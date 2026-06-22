"use server";

import { Types } from "mongoose";
import { headers } from "next/headers";
import dbConnect from "@/db/connection";
import Booking from "@/db/models/Booking";
import BookingConfig from "@/db/models/BookingConfig";
import Property from "@/db/models/Property";
import { stripe } from "@/lib/stripe";
import type { BookingData } from "@/types/booking";
import { generateOrderId } from "@/utils/generateOrderId";
import { formatDisplayDate } from "@/utils/formatDate";
import { calculateTotalPrice } from "@/actions/searchActions";
import { buildBookingOverlapFilter } from "@/utils/bookingOverlap";
import { resolveOccupiedPropertyIdsFromBookings } from "@/utils/lazyAvailabilityCleanup";

export async function createCheckoutSession(bookingData: BookingData) {
  if (!bookingData) throw new Error("Missing booking data.");

  const { startDate, endDate, adults, children, clientData, invoice, invoiceData, orders } = bookingData;

  if (
    !startDate ||
    !endDate ||
    !Number.isInteger(adults) ||
    adults < 1 ||
    !Number.isInteger(children) ||
    children < 0 ||
    !clientData?.firstName ||
    !clientData?.lastName ||
    !clientData?.email ||
    !Array.isArray(orders) ||
    orders.length === 0
  ) {
    throw new Error("Incomplete booking data.");
  }

  await dbConnect();

  for (const order of orders) {
    if (!order.propertyId || !Types.ObjectId.isValid(order.propertyId)) {
      throw new Error("Invalid property ID in order.");
    }

    if (!order.displayName || order.displayName.trim().length === 0) {
      throw new Error("Missing property name in order.");
    }

    if (!Number.isFinite(order.price) || order.price <= 0) {
      throw new Error("Invalid price in order.");
    }

    if (!Number.isInteger(order.guests) || order.guests <= 0) {
      throw new Error("Invalid number of guests in order.");
    }

    if (!Number.isInteger(order.adults) || order.adults < 1) {
      throw new Error("Invalid number of paying guests in order.");
    }

    if (!Number.isInteger(order.children) || order.children < 0) {
      throw new Error("Invalid number of children in order.");
    }

    if (order.adults + order.children !== order.guests) {
      throw new Error("Inconsistent guest data in order.");
    }

    if (!Number.isInteger(order.extraBeds) || order.extraBeds < 0) {
      throw new Error("Invalid number of extra beds in order.");
    }
  }

  const bookingConfig = await BookingConfig.findById("main").lean();
  const allowCheckinOnDepartureDay = bookingConfig?.allowCheckinOnDepartureDay ?? true;
  const overlapFilter = buildBookingOverlapFilter(new Date(startDate), new Date(endDate), allowCheckinOnDepartureDay);

  const overlappingBookings = await Booking.find({
    $or: [{ status: "blocked" }, { status: "confirmed" }, { status: "pending" }],
    ...overlapFilter,
  })
    .select("_id propertyId status createdAt stripeSessionId source adminNotes")
    .lean();

  const { occupiedPropertyIds } = await resolveOccupiedPropertyIdsFromBookings(overlappingBookings);

  const verifiedOrders: Array<{ propertyId: string; displayName: string; adults: number; children: number; extraBeds: number; guests: number; price: number }> = [];
  let totalAdults = 0;
  let totalChildren = 0;

  for (const order of orders) {
    if (occupiedPropertyIds.has(order.propertyId)) {
      throw new Error(`Property "${order.displayName}" is not available for the selected dates.`);
    }

    const property = await Property.findOne({ _id: order.propertyId, isActive: true })
      .select("_id maxAdults maxExtraBeds maxChildren")
      .lean();

    if (!property) {
      throw new Error(`Property "${order.displayName}" does not exist or is inactive.`);
    }

    if (order.adults > property.maxAdults) {
      throw new Error(`Number of adults (${order.adults}) exceeds the capacity of "${order.displayName}" (max ${property.maxAdults}).`);
    }

    if (order.extraBeds > property.maxExtraBeds) {
      throw new Error(`Number of extra beds (${order.extraBeds}) exceeds the capacity of "${order.displayName}" (max ${property.maxExtraBeds}).`);
    }

    const recalculatedPrice = await calculateTotalPrice({
      startDate,
      endDate,
      baseGuests: order.adults,
      extraBeds: order.extraBeds,
      propertySelection: order.propertyId,
    });

    if (recalculatedPrice <= 0) {
      throw new Error(`Could not calculate price for property "${order.displayName}".`);
    }

    totalAdults += order.adults;
    totalChildren += order.children;

    verifiedOrders.push({ ...order, price: recalculatedPrice });
  }

  if (totalAdults !== adults || totalChildren !== children) {
    throw new Error("Inconsistent adult and child count in booking.");
  }

  const amount = verifiedOrders.reduce((sum, item) => sum + item.price, 0);

  const propertyIds = verifiedOrders.map((order) => order.propertyId).join(",");
  const orderDisplayName = verifiedOrders.length === 1
    ? verifiedOrders[0].displayName
    : `${verifiedOrders.length} properties`;
  const totalGuests = verifiedOrders.reduce((sum, item) => sum + item.guests, 0);
  const totalExtraBeds = verifiedOrders.reduce((sum, item) => sum + item.extraBeds, 0);

  if (amount <= 0) {
    console.error("Error: Invalid booking amount:", amount);
    throw new Error("Invalid booking amount. Please try again.");
  }

  const headerList = await headers();
  const origin = headerList.get("origin");

  if (!origin) {
    throw new Error("Missing origin header needed to create Stripe session.");
  }

  const orderId = await generateOrderId();

  const bookingDocs = verifiedOrders.map((order) => ({
    propertyId: new Types.ObjectId(order.propertyId),
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    firstName: clientData.firstName,
    lastName: clientData.lastName,
    guestEmail: clientData.email,
    guestPhone: clientData.phone,
    guestAddress: clientData.address,
    adults: order.adults,
    children: order.children,
    extraBedsCount: order.extraBeds,
    totalPrice: order.price,
    paidAmount: 0,
    orderId,
    paymentStatus: "unpaid" as const,
    status: "pending" as const,
    paymentMethod: "online" as const,
    source: "online" as const,
    invoice: invoice === true,
    invoiceData: invoice === true ? invoiceData : undefined,
  }));

  const insertedBookings = await Booking.insertMany(bookingDocs);
  const bookingIds = insertedBookings.map((booking) => booking._id.toString());
  const bookingObjectIds = bookingIds.map((id) => new Types.ObjectId(id));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      // payment_method_types: ["card", "blik", "p24"],
      locale: "en",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Booking: ${orderDisplayName}`,
              description: `Stay from ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: clientData.email,
      metadata: {
        orderId,
        startDate: startDate,
        endDate: endDate,
        propertyIds,
        guestEmail: clientData.email,
        guests: totalGuests.toString(),
        adults: adults.toString(),
        children: children.toString(),
        extraBeds: totalExtraBeds.toString(),
        bookingIds: bookingIds.join(","),
      },
      shipping_address_collection: {
        allowed_countries: [
          'PL', 'DE', 'GB', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH',
          'DK', 'SE', 'NO', 'FI', 'IE', 'PT', 'CZ', 'SK', 'HU', 'LT',
          'LV', 'EE', 'RO', 'BG', 'GR', 'HR', 'SI', 'IS', 'LU'
        ],
      },
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking/summary`,
    });

    const updatedBookings = await Booking.updateMany(
      { _id: { $in: bookingObjectIds } },
      {
        $set: {
          stripeSessionId: session.id,
          stripeSessionStatus: session.status === 'open' ? 'open' : 'unknown',
        },
      }
    );

    if (updatedBookings.matchedCount !== bookingObjectIds.length) {
      throw new Error('Failed to assign Stripe session ID to all bookings.');
    }

    return { url: session.url };
  } catch (error) {
    await Booking.deleteMany({ _id: { $in: bookingObjectIds } });
    console.error("Error creating checkout session:", error);
    throw new Error("An error occurred while initialising Stripe payment.");
  }
}