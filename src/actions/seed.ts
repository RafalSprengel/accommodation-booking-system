'use server'

import dbConnect from '@/db/connection';
import Property from '@/db/models/Property';
import PropertyPrices from '@/db/models/PropertyPrices';
import Booking from '@/db/models/Booking';
import SystemConfig from '@/db/models/SystemConfig';
import BookingConfig from '@/db/models/BookingConfig';
import PriceConfig from '@/db/models/PriceConfig';
import Season from '@/db/models/Season';
import CustomPrice from '@/db/models/CustomPrice';
import SiteSettings from '@/db/models/SiteSettings';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import { getSiteSettings } from '@/actions/siteSettingsActions';
import { getAuth } from '@/lib/auth';
import { siteSettingsDefaults } from '@/lib/siteSettingsDefaults';
import { revalidatePath } from 'next/cache';

function toPlainObject(doc: any) {
  return JSON.parse(JSON.stringify(doc));
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────────────────────

export async function clearAllData() {
  try {
    await dbConnect();
    await Booking.deleteMany({});
    await Property.deleteMany({});
    await PropertyPrices.deleteMany({});
    await SystemConfig.deleteMany({});
    await BookingConfig.deleteMany({});
    await PriceConfig.deleteMany({});
    await Season.deleteMany({});
    await CustomPrice.deleteMany({});
    await SiteSettings.deleteMany({});

    const db = mongoose.connection.db;
    if (db) {
      await db.collection('user').deleteMany({});
      await db.collection('account').deleteMany({});
      await db.collection('session').deleteMany({});
      await db.collection('verification').deleteMany({});
    }

    return { success: true, message: 'All data has been deleted (including users)' };
  } catch (error) {
    console.error('Error clearing data:', error);
    return { success: false, error: 'Failed to delete data' };
  }
}

export async function seedSeasons() {
  try {
    await dbConnect();
    const currentYear = new Date().getFullYear();

    const seasons = [
      {
        _id: new Types.ObjectId('6a0276c6b002180738334dda'),
        name: 'Christmas/New Year Season',
        description: 'Higher prices during Christmas and New Year period.',
        startDate: new Date('2000-12-20T12:00:00.000Z'),
        endDate: new Date('2001-01-05T12:00:00.000Z'),
        isActive: true,
        order: 3,
        createdAt: new Date('2026-05-12T00:39:34.992Z'),
        updatedAt: new Date('2026-05-16T18:10:18.050Z'),
      },
      {
        _id: new Types.ObjectId('6a0276c6b002180738334ddb'),
        name: 'Winter Break Season',
        description: 'Winter break in northern Poland.',
        startDate: new Date('2000-01-15T12:00:00.000Z'),
        endDate: new Date('2000-02-29T12:00:00.000Z'),
        isActive: true,
        order: 0,
        createdAt: new Date('2026-05-12T00:39:34.992Z'),
        updatedAt: new Date('2026-05-16T18:09:49.581Z'),
      },
      {
        _id: new Types.ObjectId('6a0276c6b002180738334dd9'),
        name: 'High Season (Summer Holidays)',
        description: 'Prices valid in the summer season – June, July, August.',
        startDate: new Date('2000-06-01T12:00:00.000Z'),
        endDate: new Date('2000-08-31T12:00:00.000Z'),
        isActive: true,
        order: 3,
        createdAt: new Date('2026-05-12T00:39:34.992Z'),
        updatedAt: new Date('2026-05-12T01:13:05.556Z'),
      },
      {
        _id: new Types.ObjectId('6a027c2be997703cfd85a1d0'),
        name: 'May Holiday',
        description: 'Long May weekend.',
        startDate: new Date('2000-05-01T12:00:00.000Z'),
        endDate: new Date('2000-05-03T12:00:00.000Z'),
        isActive: true,
        order: 2,
        createdAt: new Date('2026-05-12T01:02:35.044Z'),
        updatedAt: new Date('2026-05-12T01:12:29.811Z'),
      },
    ];

    await Season.deleteMany({});
    const created = await Season.insertMany(seasons);
    revalidatePath('/', 'layout');
    revalidatePath('/admin', 'layout');
    return {
      success: true,
      message: `Created ${created.length} seasons`,
      data: created.map(toPlainObject),
    };
  } catch (error) {
    console.error('Error seeding seasons:', error);
    return { success: false, error: 'Failed to create seasons' };
  }
}

export async function seedProperties() {
  try {
    await dbConnect();

    const properties = [
      {
        _id: new Types.ObjectId('69d78477b191d7bb540f83e1'),
        name: 'Cottage A',
        description: 'A cosy cottage with a forest view.',
        maxAdults: 6,
        maxChildren: 6,
        maxExtraBeds: 2,
        images: ['/gallery/wnetrze1.webp', '/gallery/wnetrze2.webp'],
        isActive: true,
        createdAt: new Date('2026-04-09T10:50:31.743Z'),
        updatedAt: new Date('2026-05-14T23:29:47.673Z'),
      },
      {
        _id: new Types.ObjectId('69d78477b191d7bb540f83e2'),
        name: 'Cottage B',
        description: 'A cosy cottage with a forest view.',
        maxAdults: 6,
        maxChildren: 6,
        maxExtraBeds: 2,
        images: ['/gallery/wnetrze4.webp', '/gallery/wnetrze5.webp'],
        isActive: true,
        createdAt: new Date('2026-04-09T10:50:31.744Z'),
        updatedAt: new Date('2026-05-14T23:18:27.222Z'),
      },
    ];

    await Property.deleteMany({});
    const created = await Property.insertMany(properties);
    revalidatePath('/', 'layout');
    revalidatePath('/admin', 'layout');
    return {
      success: true,
      message: `Created ${created.length} cottages`,
      data: created.map(toPlainObject),
    };
  } catch (error) {
    console.error('Error seeding cottages:', error);
    return { success: false, error: 'Failed to create cottages' };
  }
}

/**
 * Seeds the PropertyPrices collection.
 * Must be called AFTER seedProperties() and seedSeasons().
 */
export async function seedPropertyPrices() {
  try {
    await dbConnect();

    const properties = await Property.find({}).lean();

    if (properties.length === 0) {
      return { success: false, error: 'First run seedProperties()' };
    }

    const pricesToInsert = [
      {
        _id: new Types.ObjectId('6a102b906289d1081775ae75'),
        propertyId: new Types.ObjectId('69d78477b191d7bb540f83e2'),
        seasonId: new Types.ObjectId('6a0276c6b002180738334dd9'),
        weekdayPrices: [
          { minGuests: 1, maxGuests: 3, price: 350 },
          { minGuests: 4, maxGuests: 6, price: 450 },
        ],
        weekendPrices: [
          { minGuests: 1, maxGuests: 3, price: 450 },
          { minGuests: 4, maxGuests: 6, price: 550 },
        ],
        weekdayExtraBedPrice: 100,
        weekendExtraBedPrice: 100,
        createdAt: new Date('2026-05-12T01:31:36.769Z'),
        updatedAt: new Date('2026-05-12T01:31:36.769Z'),
      },
      {
        _id: new Types.ObjectId('6a102b906289d1081775ae77'),
        propertyId: new Types.ObjectId('69d78477b191d7bb540f83e2'),
        seasonId: new Types.ObjectId('6a0276c6b002180738334dda'),
        weekdayPrices: [
          { minGuests: 1, maxGuests: 3, price: 500 },
          { minGuests: 4, maxGuests: 6, price: 600 },
        ],
        weekendPrices: [
          { minGuests: 1, maxGuests: 3, price: 600 },
          { minGuests: 4, maxGuests: 6, price: 700 },
        ],
        weekdayExtraBedPrice: 150,
        weekendExtraBedPrice: 150,
        createdAt: new Date('2026-05-12T01:34:12.214Z'),
        updatedAt: new Date('2026-05-12T01:34:12.214Z'),
      },
      {
        _id: new Types.ObjectId('6a102b906289d1081775ae79'),
        propertyId: new Types.ObjectId('69d78477b191d7bb540f83e2'),
        seasonId: new Types.ObjectId('6a0276c6b002180738334ddb'),
        weekdayPrices: [
          { minGuests: 1, maxGuests: 3, price: 400 },
          { minGuests: 4, maxGuests: 6, price: 500 },
        ],
        weekendPrices: [
          { minGuests: 1, maxGuests: 3, price: 500 },
          { minGuests: 4, maxGuests: 6, price: 600 },
        ],
        weekdayExtraBedPrice: 110,
        weekendExtraBedPrice: 110,
        createdAt: new Date('2026-05-12T01:28:37.827Z'),
        updatedAt: new Date('2026-05-12T01:28:37.827Z'),
      },
      {
        _id: new Types.ObjectId('6a102b906289d1081775ae7b'),
        propertyId: new Types.ObjectId('69d78477b191d7bb540f83e2'),
        seasonId: new Types.ObjectId('6a027c2be997703cfd85a1d0'),
        weekdayPrices: [
          { minGuests: 1, maxGuests: 3, price: 400 },
          { minGuests: 4, maxGuests: 6, price: 500 },
        ],
        weekendPrices: [
          { minGuests: 1, maxGuests: 3, price: 500 },
          { minGuests: 4, maxGuests: 6, price: 600 },
        ],
        weekdayExtraBedPrice: 110,
        weekendExtraBedPrice: 110,
        createdAt: new Date('2026-05-12T01:30:01.477Z'),
        updatedAt: new Date('2026-05-12T01:30:01.477Z'),
      },
    ];

    await PropertyPrices.deleteMany({});
    const created = await PropertyPrices.insertMany(pricesToInsert);

    revalidatePath('/', 'layout');
    revalidatePath('/admin', 'layout');
    return {
      success: true,
      message: `Created ${created.length} price records in PropertyPrices`,
      data: created.map(toPlainObject),
    };
  } catch (error) {
    console.error('Error seeding prices:', error);
    return { success: false, error: 'Failed to create prices' };
  }
}

export async function seedPriceConfigDefaults() {
  try {
    await dbConnect();

    const defaultPriceConfig = {
      _id: 'main',
      defaultWeekdayPrices: [
        { minGuests: 2, maxGuests: 3, price: 300 },
        { minGuests: 4, maxGuests: 5, price: 400 },
        { minGuests: 6, maxGuests: 10, price: 500 },
      ],
      defaultWeekendPrices: [
        { minGuests: 2, maxGuests: 3, price: 400 },
        { minGuests: 4, maxGuests: 5, price: 500 },
        { minGuests: 6, maxGuests: 10, price: 600 },
      ],
      defaultWeekdayExtraBedPrice: 50,
      defaultWeekendExtraBedPrice: 70,
      childrenFreeAgeLimit: 13,
    };

    await PriceConfig.deleteMany({});
    const created = await PriceConfig.create(defaultPriceConfig);
    revalidatePath('/', 'layout');
    revalidatePath('/admin', 'layout');
    return {
      success: true,
      message: 'Default price configuration created',
      data: toPlainObject(created),
    };
  } catch (error) {
    console.error('Error seeding price configuration:', error);
    return { success: false, error: 'Failed to create price configuration' };
  }
}

export async function seedSystemConfig() {
  try {
    await dbConnect();
    await SystemConfig.deleteMany({});
    const created = await SystemConfig.create({
      _id: 'main',
      autoBlockOtherCabins: false,
      lastOrderNumber: 50,
    });
    revalidatePath('/', 'layout');
    revalidatePath('/admin', 'layout');
    return {
      success: true,
      message: 'System configuration created',
      data: toPlainObject(created),
    };
  } catch (error) {
    console.error('Error seeding system configuration:', error);
    return { success: false, error: 'Failed to create system configuration' };
  }
}

export async function seedSiteSettings() {
  try {
    await dbConnect();
    await SiteSettings.deleteMany({});
    const created = await SiteSettings.create({
      _id: 'main',
      phone: '+48503420551',
      email: 'wilczechatki@gmail.com',
      facebookUrl: 'https://facebook.com/profile.php?id=61584455637648',
      bankAccountNumber: '20 1020 5226 0000 6702 0486 0336',
    });
    revalidatePath('/', 'layout');
    revalidatePath('/admin', 'layout');
    return {
      success: true,
      message: 'Site settings created',
      data: toPlainObject(created),
    };
  } catch (error) {
    console.error('Error seeding site settings:', error);
    return { success: false, error: 'Failed to create site settings' };
  }
}

export async function seedBookingConfig() {
  try {
    await dbConnect();
    await BookingConfig.deleteMany({});
    const created = await BookingConfig.create({
      _id: 'main',
      minBookingDays: 2,
      maxBookingDays: 30,
      childrenFreeAgeLimit: 13,
      allowCheckinOnDepartureDay: false,
      checkInHour: 15,
      checkOutHour: 12,
      createdAt: new Date('2026-04-09T10:50:32.119Z'),
      updatedAt: new Date('2026-05-16T19:07:42.466Z'),
    });
    revalidatePath('/', 'layout');
    revalidatePath('/admin', 'layout');
    return {
      success: true,
      message: 'Booking configuration created',
      data: toPlainObject(created),
    };
  } catch (error) {
    console.error('Error seeding booking configuration:', error);
    return { success: false, error: 'Failed to create booking configuration' };
  }
}

export async function seedBookings() {
  try {
    await dbConnect();

    const properties = await Property.find({ isActive: true }).lean();
    if (properties.length < 2) {
      return { success: false, error: 'First create at least 2 cottages' };
    }

    const today = new Date();

    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(today.getDate() + 7);
    nextWeekStart.setHours(14, 0, 0, 0);

    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 4);
    nextWeekEnd.setHours(11, 0, 0, 0);

    const twoWeeksStart = new Date(today);
    twoWeeksStart.setDate(today.getDate() + 21);
    twoWeeksStart.setHours(14, 0, 0, 0);

    const twoWeeksEnd = new Date(twoWeeksStart);
    twoWeeksEnd.setDate(twoWeeksStart.getDate() + 3);
    twoWeeksEnd.setHours(11, 0, 0, 0);

    const bookings = [
      {
        propertyId: new Types.ObjectId(properties[0]._id),
          startDate: nextWeekStart,
          endDate: nextWeekEnd,
          firstName: 'John',
          lastName: 'Smith',
          guestEmail: 'john.smith@example.com',
        guestPhone: '+48 123 456 789',
        guestAddress: '1 Sample Street, 00-001 Warsaw',
        adults: 4,
        children: 0,
        extraBedsCount: 1,
        totalPrice: 3500,
        paidAmount: 500,
        paymentStatus: 'partial_paid',
        paymentMethod: 'transfer',
        status: 'confirmed',
        invoice: true,
        invoiceData: {
          companyName: 'Test Ltd.',
          nip: '1234567890',
          street: '10 Invoice Street',
          city: 'Warsaw',
          postalCode: '00-002',
        },
        source: 'online',
      },
      {
        propertyId: new Types.ObjectId(properties[1]._id),
          startDate: twoWeeksStart,
          endDate: twoWeeksEnd,
          firstName: 'Anna',
          lastName: 'Nowak',
          guestEmail: 'anna.nowak@example.com',
        guestPhone: '+48 987 654 321',
        guestAddress: '5 Other Street, 80-001 Gdansk',
        adults: 2,
        children: 0,
        extraBedsCount: 0,
        totalPrice: 1800,
        paidAmount: 1800,
        paymentStatus: 'paid',
        paymentMethod: 'transfer',
        status: 'confirmed',
        invoice: false,
        source: 'online',
      },
    ];

    await Booking.deleteMany({});
    const created = await Booking.insertMany(bookings);
    revalidatePath('/', 'layout');
    revalidatePath('/admin', 'layout');
    return {
      success: true,
      message: `Created ${created.length} bookings`,
      data: created.map(toPlainObject),
    };
  } catch (error) {
    console.error('Error seeding bookings:', error);
    return { success: false, error: 'Failed to create bookings' };
  }
}

/**
 * Full database reset.
 * Order matters: seasons → cottages → prices (PropertyPrices) → rest.
 */
export async function seedAllData() {
  try {
    await dbConnect();

    await clearAllData();

    // Order is important – PropertyPrices requires IDs from Season and Property
    const seasons = await seedSeasons();
    if (!seasons.success) throw new Error(seasons.error);

    const props = await seedProperties();
    if (!props.success) throw new Error(props.error);

    const prices = await seedPropertyPrices();
    if (!prices.success) throw new Error(prices.error);

    const priceConfig = await seedPriceConfigDefaults();
    if (!priceConfig.success) throw new Error(priceConfig.error);

    const system = await seedSystemConfig();
    if (!system.success) throw new Error(system.error);

    const siteSettings = await seedSiteSettings();
    if (!siteSettings.success) throw new Error(siteSettings.error);

    const bookingConfig = await seedBookingConfig();
    if (!bookingConfig.success) throw new Error(bookingConfig.error);

    const bookings = await seedBookings();
    if (!bookings.success) throw new Error(bookings.error);

    return {
      success: true,
      message:
        'All data has been reset. ' +
        `Seasons: ${seasons.data?.length}, Cottages: ${props.data?.length}, ` +
        `Price records: ${prices.data?.length}, Bookings: ${bookings.data?.length}`,
    };
  } catch (error) {
    console.error('Error seeding all data:', error);
    return { success: false, error: 'Failed to reset data' };
  }
}

export async function seedAdmin() {
  const siteSettings = await getSiteSettings();
  const adminEmail = siteSettings.email || siteSettingsDefaults.email;

  try {
    await dbConnect();
    const auth = await getAuth();

    const db = mongoose.connection.db;
    if (!db) throw new Error('No MongoDB connection');

    // Remove existing user with the same email or username to avoid conflicts
    await db.collection('user').deleteMany({
      $or: [{ email: adminEmail }, { username: 'admin' }]
    });
    await db.collection('account').deleteMany({});

    await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: 'admin',
        name: 'admin',
      },
    });

    await db.collection('user').updateOne(
      { email: adminEmail },
      {
        $set: {
          emailVerified: true,
          role: 'admin',
          username: 'admin',
          displayUsername: 'admin'
        }
      }
    );

    return {
      success: true,
      message: 'Created 1 administrator using Better Auth.',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('seedAdmin error:', error);
    return { success: false, error: message };
  }
}

export async function seedExactBetterAuthUser() {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) throw new Error('No MongoDB connection');

    const userId = new Types.ObjectId('69fddb9a2e82f94116ef90c4');
    const accountId = new Types.ObjectId('69fddb9a2e82f94116ef90c5');

    await db.collection('user').deleteOne({ _id: userId });
    await db.collection('account').deleteOne({ _id: accountId });

    await db.collection('user').insertOne({
      _id: userId,
      name: 'Marika',
      email: 'test@gmail.com',
      emailVerified: true,
      role: 'admin',
      displayUsername: 'Marika',
      username: 'marika',
      createdAt: new Date('2026-05-08T12:48:26.232Z'),
      updatedAt: new Date('2026-05-16T19:30:58.008Z'),
    });

    await db.collection('account').insertOne({
      _id: accountId,
      accountId: '69fddb9a2e82f94116ef90c4',
      providerId: 'credential',
      userId,
      password: 'f439ddc539dd4312032f817049d1c38f:1f5448a74a5f3c971990eb9965e2ea16054847d49bc96454f406d7c2bc5071d7f561d4359739fe94483310ad7cf72a80b01589e90a0d6fa7db7b11758e67d8b9',
      createdAt: new Date('2026-05-08T12:48:26.268Z'),
      updatedAt: new Date('2026-05-08T12:48:26.268Z'),
    });

    return {
      success: true,
      message: 'Created better-auth user and account records.',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('seedExactBetterAuthUser error:', error);
    return {
      success: false,
      error: message,
    };
  }
}