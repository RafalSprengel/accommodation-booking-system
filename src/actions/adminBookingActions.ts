'use server'
import dbConnect from '@/db/connection'
import Booking from '@/db/models/Booking'
import Property from '@/db/models/Property'
import SystemConfig from '@/db/models/SystemConfig'
import BookingConfig from '@/db/models/BookingConfig'
import { revalidatePath } from 'next/cache'
import { calculateTotalPrice } from './searchActions'
import { buildBookingOverlapFilter } from '@/utils/bookingOverlap'
import { resolveOccupiedPropertyIdsFromBookings } from '@/utils/lazyAvailabilityCleanup'
import { calculatePaymentStatus } from '@/utils/getPaymentStatus'
import { Types } from 'mongoose'
import { generateOrderId } from '@/utils/generateOrderId'
import BookingConfirmationToClient from '@/emails/BookingConfirmationToClient'
import BookingConfirmationToAdmin from '@/emails/BookingConfirmationToAdmin'
import { sendBookingEmail } from '@/lib/sendEmail'
import { getSiteSettings } from './siteSettingsActions'

interface UnavailableDate {
  date: string | null
}

interface BlockCreateInput {
  propertyId: string
  startDate: string
  endDate: string
  adminNotes?: string
}

interface BlockedBookingListItem {
  _id: string
  propertyId: string
  propertyName: string
  startDate: string
  endDate: string
  adminNotes: string
  createdAt: string
}

const ALL_PROPERTIES_ID = 'ALL_PROPERTIES'
const AVAILABILITY_STATUS_FILTER = {
  $or: [
    { status: 'blocked' },
    { status: 'confirmed' },
    { status: 'pending' },
  ],
}

async function getAllowCheckinOnDepartureDay(): Promise<boolean> {
  const bookingConfig = await BookingConfig.findById('main')
    .select('allowCheckinOnDepartureDay')
    .lean()

  if (typeof bookingConfig?.allowCheckinOnDepartureDay !== 'boolean') {
    throw new Error('Missing valid configuration for check-in on departure day setting.')
  }

  return bookingConfig.allowCheckinOnDepartureDay
}

export async function getUnavailableDatesForProperty(propertyId: string): Promise<UnavailableDate[]> {
  await dbConnect()
  const config = await SystemConfig.findById('main')
  const autoBlockOtherCabins = config?.autoBlockOtherCabins ?? true
  const allowCheckinOnDepartureDay = await getAllowCheckinOnDepartureDay()
  const query: any = {
    ...AVAILABILITY_STATUS_FILTER,
  }

  if (!autoBlockOtherCabins) {
    query.propertyId = new Types.ObjectId(propertyId)
  }

  const bookingsForCleanup = await Booking.find(query)
    .select('_id propertyId status createdAt stripeSessionId source adminNotes startDate endDate')
    .lean()

  const { didMutateBookings } = await resolveOccupiedPropertyIdsFromBookings(bookingsForCleanup)

  const bookings = didMutateBookings
    ? await Booking.find(query)
        .select('startDate endDate status')
        .lean()
    : bookingsForCleanup
  const unavailableDates = new Set<string>()
  for (const booking of bookings) {
    const start = new Date(booking.startDate)
    const end = new Date(booking.endDate)

    if (booking.status === 'blocked') {
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        unavailableDates.add(d.toISOString().split('T')[0])
      }
    } else {
      const startPlusOne = new Date(start)
      startPlusOne.setDate(startPlusOne.getDate() + 1)
      for (let d = new Date(startPlusOne); d < end; d.setDate(d.getDate() + 1)) {
        unavailableDates.add(d.toISOString().split('T')[0])
      }
      if (!allowCheckinOnDepartureDay) {
        unavailableDates.add(start.toISOString().split('T')[0])
        unavailableDates.add(end.toISOString().split('T')[0])
      }
    }
  }
  return Array.from(unavailableDates)
    .map(date => ({ date }))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
}

function validateBookingData(data: any) {
  const errors: string[] = []
  if (!data.propertyId) errors.push('Please select a property')
  if (!data.startDate) errors.push('Please enter a start date')
  if (!data.endDate) errors.push('Please enter an end date')
  if (new Date(data.endDate) <= new Date(data.startDate)) errors.push('End date must be later than start date')
  const adults = Number(data.adults)
  if (isNaN(adults) || adults <= 0) errors.push('Number of adults must be a valid number greater than 0')
  const children = Number(data.children)
  if (isNaN(children) || children < 0) errors.push('Number of children cannot be negative')
  const extraBeds = Number(data.extraBedsCount)
  if (isNaN(extraBeds) || extraBeds < 0) errors.push('Number of extra beds cannot be negative')
  const totalPrice = Number(data.totalPrice)
  if (isNaN(totalPrice) || totalPrice < 0) errors.push('Total price cannot be negative')
  const paidAmount = Number(data.paidAmount)
  if (isNaN(paidAmount) || paidAmount < 0) errors.push('Paid amount cannot be negative')
  if (!(data.firstName && data.lastName)) errors.push('Please enter the guest\'s first and last name')
  if (!data.guestEmail || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.guestEmail)) errors.push('Invalid email address format')
  if (!data.guestPhone) errors.push('Please enter the guest\'s phone number')
  if (data.invoice === 'true') {
    if (!data.invoiceCompany) errors.push('Company name is required for invoice')
    if (!data.invoiceNip) errors.push('Tax ID is required for invoice')
    if (!data.invoiceStreet) errors.push('Street is required for invoice')
    if (!data.invoicePostalCode) errors.push('Postal code is required for invoice')
    if (!data.invoiceCity) errors.push('City is required for invoice')
  }
  return errors
}

export async function getAdminBookingsList() {
  await dbConnect()

  // Leniwe weryfikowanie "oczekujących" rezerwacji przed pobraniem całej listy
  const pendingBookingsForCleanup = await Booking.find({ status: 'pending' })
    .select('_id propertyId status createdAt stripeSessionId source adminNotes startDate endDate')
    .lean()

  if (pendingBookingsForCleanup.length > 0) {
    await resolveOccupiedPropertyIdsFromBookings(pendingBookingsForCleanup)
  }

  const bookings = await Booking.find({ status: { $ne: 'blocked' } })
    .sort({ startDate: -1 })
    .populate('propertyId', 'name')
    .lean()

  const normalizedBookings = bookings.map((booking: any) => {
    const property = booking.propertyId
    const propertyId = property?._id ? String(property._id) : String(property || '')
    const paidAmount = Number(booking.paidAmount)
    const totalPrice = Number(booking.totalPrice)
    const paymentStatus = booking.paymentStatus || calculatePaymentStatus(totalPrice, paidAmount)

    // Normalize guest name: build from firstName/lastName
    const firstName = booking.firstName || ''
    const lastName = booking.lastName || ''

    return {
      ...booking,
      propertyId,
      propertyName: property?.name || 'Domek',
      paidAmount,
      paymentStatus,
      firstName,
      lastName,
    }
  })

  return JSON.parse(JSON.stringify(normalizedBookings))
}

export async function getBookingById(bookingId: string) {
  await dbConnect()
  const booking = await Booking.findById(bookingId)
    .populate('propertyId', 'name')
    .lean()

  if (!booking) {
    return null
  }

  const property = (booking as any).propertyId
  const paidAmount = Number((booking as any).paidAmount)
  const totalPrice = Number((booking as any).totalPrice)
  const paymentStatus = (booking as any).paymentStatus || calculatePaymentStatus(totalPrice, paidAmount)
  const firstName = (booking as any).firstName || ''
  const lastName = (booking as any).lastName || ''

  const normalizedBooking = {
    ...booking,
    propertyId: property?._id ? String(property._id) : String(property || ''),
    propertyName: property?.name || '',
    paidAmount,
    paymentStatus,
    firstName,
    lastName,
  }

  return JSON.parse(JSON.stringify(normalizedBooking))
}

export async function createBookingByAdmin(prevState: any, formData: FormData) {
  await dbConnect()
  const rawData = Object.fromEntries(formData.entries())
  const validationErrors = validateBookingData(rawData)
  if (validationErrors.length > 0) {
    return { message: validationErrors.join(', '), success: false }
  }
  try {
    const adults = Number(rawData.adults)
    const children = Number(rawData.children)
    const extraBedsCount = Number(rawData.extraBedsCount)
    const invoiceData = rawData.invoice === 'true'
      ? {
          companyName: rawData.invoiceCompany,
          nip: rawData.invoiceNip,
          street: rawData.invoiceStreet,
          city: rawData.invoiceCity,
          postalCode: rawData.invoicePostalCode,
        }
      : undefined
    const totalPrice = Number(rawData.totalPrice)
    const paidAmount = Number(rawData.paidAmount)
    const paymentStatus = calculatePaymentStatus(totalPrice, paidAmount)
    const allowCheckinOnDepartureDay = await getAllowCheckinOnDepartureDay()
    const propertyId = rawData.propertyId as string
    const startDate = new Date(rawData.startDate as string)
    const endDate = new Date(rawData.endDate as string)

    if (!Types.ObjectId.isValid(propertyId)) {
      return { message: 'Invalid property ID.', success: false }
    }

    // Validate property capacity (prevent admin from creating bookings exceeding limits)
    const property = await Property.findOne({ _id: propertyId, isActive: true })
      .select('maxAdults maxChildren maxExtraBeds name')
      .lean()

    if (!property) {
      return { message: 'The selected property does not exist or is inactive.', success: false }
    }

    if (adults > property.maxAdults) {
      return { message: `Number of adults (${adults}) exceeds the capacity of "${property.name}" (max ${property.maxAdults}).`, success: false }
    }

    if (children > property.maxChildren) {
      return { message: `Number of children (${children}) exceeds the capacity of "${property.name}" (max ${property.maxChildren}).`, success: false }
    }

    if (extraBedsCount > property.maxExtraBeds) {
      return { message: `Number of extra beds (${extraBedsCount}) exceeds the capacity of "${property.name}" (max ${property.maxExtraBeds}).`, success: false }
    }

    const overlapFilter = buildBookingOverlapFilter(startDate, endDate, allowCheckinOnDepartureDay)

    const overlappingBookings = await Booking.find({
      propertyId: new Types.ObjectId(propertyId),
      ...AVAILABILITY_STATUS_FILTER,
      ...overlapFilter,
    })
      .select('_id propertyId status createdAt stripeSessionId source adminNotes')
      .lean()

    const { occupiedPropertyIds } = await resolveOccupiedPropertyIdsFromBookings(overlappingBookings)

    const existingConflict = occupiedPropertyIds.size > 0

    if (existingConflict) {
      return { message: 'The selected dates conflict with an existing booking or block.', success: false }
    }

    const newBooking = new Booking({
      orderId: await generateOrderId(),
      propertyId,
      startDate,
      endDate,
      firstName: rawData.firstName || '',
      lastName: rawData.lastName || '',
      guestEmail: rawData.guestEmail,
      guestPhone: rawData.guestPhone,
      adults,
      children,
      extraBedsCount,
      totalPrice,
      paidAmount,
      paymentStatus,
      status: 'confirmed',
      paymentMethod: 'transfer',
      invoice: rawData.invoice === 'true',
      invoiceData,
      adminNotes: rawData.internalNotes,
      source: 'admin',
    })
    await newBooking.save()
    // Send confirmation emails: to client and to site admin
    try {
      const siteSettings = await getSiteSettings()
      const customerName = `${newBooking.firstName || ''} ${newBooking.lastName || ''}`.trim()

      // Only send confirmation emails if enabled in site settings
        if (siteSettings.sendBookingConfirmationEmails !== false) {
        await sendBookingEmail({
          to: newBooking.guestEmail,
      subject: 'Booking Confirmation - Wilcze Chatki',
          react: BookingConfirmationToClient({
            customerName,
            orderNumber: newBooking.orderId ?? '',
            checkIn: newBooking.startDate.toISOString().split('T')[0],
            checkOut: newBooking.endDate.toISOString().split('T')[0],
            totalPrice: newBooking.totalPrice,
            paidAmount: newBooking.paidAmount,
            siteSettings,
            guestPhone: newBooking.guestPhone,
            guestEmail: newBooking.guestEmail,
            guestAddress: newBooking.guestAddress,
              propertyName: property?.name || '',
            adults: newBooking.adults,
            children: newBooking.children,
            extraBeds: newBooking.extraBedsCount,
            orderDate: newBooking.createdAt?.toISOString().split('T')[0],
            invoiceRequested: Boolean(newBooking.invoice),
            companyName: newBooking.invoiceData?.companyName,
            nip: newBooking.invoiceData?.nip,
            street: newBooking.invoiceData?.street,
            city: newBooking.invoiceData?.city,
            postalCode: newBooking.invoiceData?.postalCode,
            cabinsCount: 1,
          }),
        })

        const adminEmail = siteSettings.bookingNotificationsEmail || siteSettings.email

          if (adminEmail) {
          await sendBookingEmail({
            to: adminEmail,
      subject: `New booking: ${customerName} (${newBooking.orderId})`,
            react: BookingConfirmationToAdmin({
              customerName,
              orderNumber: newBooking.orderId ?? '',
              checkIn: newBooking.startDate.toISOString().split('T')[0],
              checkOut: newBooking.endDate.toISOString().split('T')[0],
              totalPrice: newBooking.totalPrice,
              paidAmount: newBooking.paidAmount,
              siteSettings,
              guestPhone: newBooking.guestPhone,
              guestEmail: newBooking.guestEmail,
              guestAddress: newBooking.guestAddress,
                propertyName: property?.name || '',
              adults: newBooking.adults,
              children: newBooking.children,
              extraBeds: newBooking.extraBedsCount,
              orderDate: newBooking.createdAt?.toISOString().split('T')[0],
              invoiceRequested: Boolean(newBooking.invoice),
              companyName: newBooking.invoiceData?.companyName,
              nip: newBooking.invoiceData?.nip,
              street: newBooking.invoiceData?.street,
              city: newBooking.invoiceData?.city,
              postalCode: newBooking.invoiceData?.postalCode,
              cabinsCount: 1,
              adminNotes: newBooking.adminNotes,
            }),
          })
        }
      }
    } catch (err) {
      console.error('Error sending email after admin booking creation:', err)
    }
    revalidatePath('/', 'layout')
    revalidatePath('/admin', 'layout')
    revalidatePath('/admin/bookings/list')
    revalidatePath('/admin/bookings/calendar')
    revalidatePath('/admin/bookings/block')
    return { message: 'Booking has been successfully created!', success: true }
  } catch (error: any) {
    return { message: error.message || 'An unexpected server error occurred.', success: false }
  }
}

export async function updateBookingAction(prevState: any, formData: FormData) {
  await dbConnect()
  const rawData = Object.fromEntries(formData.entries())
  const bookingId = rawData.bookingId as string

  if (!Types.ObjectId.isValid(bookingId)) {
    return { message: 'Invalid booking ID.', success: false }
  }

  const validationErrors = validateBookingData(rawData)
  if (validationErrors.length > 0) {
    return { message: validationErrors.join(', '), success: false }
  }
  try {
    const adults = Number(rawData.adults)
    const children = Number(rawData.children)
    const extraBedsCount = Number(rawData.extraBedsCount)
    const prevBooking = await Booking.findById(bookingId).lean()
    if (!prevBooking) {
      return { message: 'Booking not found for update.', success: false }
    }
    const invoiceData = rawData.invoice === 'true'
      ? {
          companyName: rawData.invoiceCompany || prevBooking?.invoiceData?.companyName,
          nip: rawData.invoiceNip || prevBooking?.invoiceData?.nip,
          street: rawData.invoiceStreet || prevBooking?.invoiceData?.street,
          city: rawData.invoiceCity || prevBooking?.invoiceData?.city,
          postalCode: rawData.invoicePostalCode || prevBooking?.invoiceData?.postalCode,
        }
      : prevBooking?.invoiceData
    const totalPrice = Number(rawData.totalPrice)
    const paidAmount = Number(rawData.paidAmount)
    const paymentStatus = calculatePaymentStatus(totalPrice, paidAmount)
    const allowCheckinOnDepartureDay = await getAllowCheckinOnDepartureDay()
    const propertyId = rawData.propertyId as string
    const startDate = new Date(rawData.startDate as string)
    const endDate = new Date(rawData.endDate as string)
    const status = rawData.status as string

    if (!Types.ObjectId.isValid(propertyId)) {
      return { message: 'Invalid property ID.', success: false }
    }

    const property = await Property.findOne({ _id: propertyId, isActive: true })
      .select('maxAdults maxChildren maxExtraBeds name')
      .lean()

    if (!property) {
      return { message: 'The selected property does not exist or is inactive.', success: false }
    }

    if (adults > property.maxAdults) {
      return { message: `Number of adults (${adults}) exceeds the capacity of "${property.name}" (max ${property.maxAdults}).`, success: false }
    }

    if (children > property.maxChildren) {
      return { message: `Number of children (${children}) exceeds the capacity of "${property.name}" (max ${property.maxChildren}).`, success: false }
    }

    if (extraBedsCount > property.maxExtraBeds) {
      return { message: `Number of extra beds (${extraBedsCount}) exceeds the capacity of "${property.name}" (max ${property.maxExtraBeds}).`, success: false }
    }

   // Prevent manual setting of statuses that are managed automatically
    const forbiddenStatuses = ['blocked', 'pending', 'failed']
    if (forbiddenStatuses.includes(status)) {
      return {
        message: 'Manually setting "blocked", "pending" and "failed" statuses is not allowed. Use the blocking function or wait for automatic update.',
        success: false,
      }
    }

    if (status === 'confirmed') {
      const overlapFilter = buildBookingOverlapFilter(startDate, endDate, allowCheckinOnDepartureDay)

      const overlappingBookings = await Booking.find({
        _id: { $ne: bookingId },
        propertyId: new Types.ObjectId(propertyId),
        ...AVAILABILITY_STATUS_FILTER,
        ...overlapFilter,
      })
        .select('_id propertyId status createdAt stripeSessionId source adminNotes')
        .lean()

      const { occupiedPropertyIds } = await resolveOccupiedPropertyIdsFromBookings(overlappingBookings)

      const existingConflict = occupiedPropertyIds.size > 0

      if (existingConflict) {
        return { message: 'The selected dates conflict with an existing booking or block.', success: false }
      }
    }

    const bookingData = {
      propertyId,
      startDate,
      endDate,
      firstName: rawData.firstName || '',
      lastName: rawData.lastName || '',
      guestEmail: rawData.guestEmail,
      guestPhone: rawData.guestPhone,
      adults,
      children,
      extraBedsCount,
      totalPrice,
      paidAmount,
      paymentStatus,
      status,
      paymentMethod: 'transfer',
      invoice: rawData.invoice === 'true',
      invoiceData,
      adminNotes: rawData.internalNotes,
    }
    // previous booking was loaded earlier to allow merging invoice data

    // Determine whether any meaningful fields (other than adminNotes) changed by
    // comparing the incoming form values with the DB record before update.
    const sendClientEmail =
      String(prevBooking.propertyId) !== propertyId ||
      new Date(prevBooking.startDate).toISOString() !== startDate.toISOString() ||
      new Date(prevBooking.endDate).toISOString() !== endDate.toISOString() ||
      (prevBooking.firstName || '') !== (rawData.firstName || '') ||
      (prevBooking.lastName || '') !== (rawData.lastName || '') ||
      prevBooking.guestEmail !== rawData.guestEmail ||
      prevBooking.guestPhone !== rawData.guestPhone ||
      prevBooking.adults !== adults ||
      prevBooking.children !== children ||
      prevBooking.extraBedsCount !== extraBedsCount ||
      Number(prevBooking.totalPrice) !== totalPrice ||
      Number(prevBooking.paidAmount) !== paidAmount ||
      prevBooking.paymentStatus !== paymentStatus ||
      prevBooking.status !== status ||
      Boolean(prevBooking.invoice) !== (rawData.invoice === 'true') ||
      JSON.stringify(prevBooking.invoiceData || {}) !== JSON.stringify(invoiceData || {})

    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, bookingData, { new: true })
    if (!updatedBooking) {
      return { message: 'Booking not found for update.', success: false }
    }

    // Send notification emails after update (non-blocking)
    try {
      const siteSettings = await getSiteSettings()
      const customerName = `${updatedBooking.firstName || ''} ${updatedBooking.lastName || ''}`.trim()
      if (siteSettings.sendBookingConfirmationEmails !== false) {

        if (sendClientEmail && updatedBooking.guestEmail) {
          const propertyDoc = await Property.findById(updatedBooking.propertyId).select('name').lean();
          const propertyName = propertyDoc?.name || '';
          await sendBookingEmail({
            to: updatedBooking.guestEmail,
      subject: 'Booking Update - Wilcze Chatki',
            react: BookingConfirmationToClient({
              customerName,
              orderNumber: updatedBooking.orderId ?? '',
              checkIn: updatedBooking.startDate.toISOString().split('T')[0],
              checkOut: updatedBooking.endDate.toISOString().split('T')[0],
              totalPrice: updatedBooking.totalPrice,
              paidAmount: updatedBooking.paidAmount,
              siteSettings,
              guestPhone: updatedBooking.guestPhone,
              guestEmail: updatedBooking.guestEmail,
              guestAddress: updatedBooking.guestAddress,
              propertyName,
              adults: updatedBooking.adults,
              children: updatedBooking.children,
              extraBeds: updatedBooking.extraBedsCount,
              orderDate: updatedBooking.createdAt?.toISOString().split('T')[0],
              invoiceRequested: Boolean(updatedBooking.invoice),
              companyName: updatedBooking.invoiceData?.companyName,
              nip: updatedBooking.invoiceData?.nip,
              street: updatedBooking.invoiceData?.street,
              city: updatedBooking.invoiceData?.city,
              postalCode: updatedBooking.invoiceData?.postalCode,
              cabinsCount: 1,
            }),
          })
        } else {
          // Suppress client email when only adminNotes changed
        }

        const adminEmail = siteSettings.bookingNotificationsEmail || siteSettings.email

        if (!sendClientEmail) {
          // only adminNotes changed; no client/admin emails sent
        }

        if (adminEmail && sendClientEmail) {
          const propertyDoc = await Property.findById(updatedBooking.propertyId).select('name').lean();
          const propertyName = propertyDoc?.name || '';
          await sendBookingEmail({
            to: adminEmail,
      subject: `Updated booking: ${customerName} (${updatedBooking.orderId})`,
            react: BookingConfirmationToAdmin({
              customerName,
              orderNumber: updatedBooking.orderId ?? '',
              checkIn: updatedBooking.startDate.toISOString().split('T')[0],
              checkOut: updatedBooking.endDate.toISOString().split('T')[0],
              totalPrice: updatedBooking.totalPrice,
              paidAmount: updatedBooking.paidAmount,
              siteSettings,
              guestPhone: updatedBooking.guestPhone,
              guestEmail: updatedBooking.guestEmail,
              guestAddress: updatedBooking.guestAddress,
              propertyName,
              adults: updatedBooking.adults,
              children: updatedBooking.children,
              extraBeds: updatedBooking.extraBedsCount,
              orderDate: updatedBooking.createdAt?.toISOString().split('T')[0],
              invoiceRequested: Boolean(updatedBooking.invoice),
              companyName: updatedBooking.invoiceData?.companyName,
              nip: updatedBooking.invoiceData?.nip,
              street: updatedBooking.invoiceData?.street,
              city: updatedBooking.invoiceData?.city,
              postalCode: updatedBooking.invoiceData?.postalCode,
              cabinsCount: 1,
              adminNotes: updatedBooking.adminNotes,
            }),
          })
        }
      }
    } catch (err) {
      console.error('Error sending email after admin booking update:', err)
    }
    revalidatePath('/', 'layout')
    revalidatePath('/admin', 'layout')
    revalidatePath('/admin/bookings/list')
    revalidatePath('/admin/bookings/calendar')
    revalidatePath('/admin/bookings/block')
    return { message: 'Booking has been successfully updated!', success: true }
  } catch (error: any) {
    return { message: error.message || 'An unexpected server error occurred.', success: false }
  }
}

export async function deleteBookingAction(bookingId: string) {
  await dbConnect()

  if (!Types.ObjectId.isValid(bookingId)) {
    return { message: 'Invalid booking ID.', success: false }
  }

  try {
    const result = await Booking.findByIdAndDelete(bookingId)
    if (!result) {
      return { message: 'Booking not found.', success: false }
    }
    revalidatePath('/', 'layout')
    revalidatePath('/admin', 'layout')
    revalidatePath('/admin/bookings/list')
    revalidatePath('/admin/bookings/calendar')
    revalidatePath('/admin/bookings/block')
    return { message: 'Booking has been successfully deleted!', success: true }
  } catch (error: any) {
    return { message: error.message || 'An unexpected server error occurred.', success: false }
  }
}

export async function calculatePriceAction(
  params: {
    startDate: string
    endDate: string
    baseGuests: number
    extraBeds: number
    propertySelection: string
  }
): Promise<{ price: number }> {
  try {
    const price = await calculateTotalPrice({
      startDate: params.startDate,
      endDate: params.endDate,
      baseGuests: params.baseGuests,
      extraBeds: params.extraBeds,
      propertySelection: params.propertySelection
    });
    return { price }
  } catch (error) {
    console.error('Error calculating price:', error)
    return { price: 0 }
  }
}

export async function getUnavailableDatesForBlocking(propertyId: string): Promise<UnavailableDate[]> {
  await dbConnect()
  const allowCheckinOnDepartureDay = await getAllowCheckinOnDepartureDay()

  if (!propertyId) return []

  const query: any = {
    ...AVAILABILITY_STATUS_FILTER,
  }

  if (propertyId !== ALL_PROPERTIES_ID) {
    if (!Types.ObjectId.isValid(propertyId)) return []
    query.propertyId = new Types.ObjectId(propertyId)
  }

  const bookingsForCleanup = await Booking.find(query)
    .select('_id propertyId status createdAt stripeSessionId source adminNotes startDate endDate')
    .lean()

  const { didMutateBookings } = await resolveOccupiedPropertyIdsFromBookings(bookingsForCleanup)

  const bookings = didMutateBookings
    ? await Booking.find(query)
        .select('startDate endDate status')
        .lean()
    : bookingsForCleanup

  const unavailableDates = new Set<string>()

  for (const booking of bookings) {
    const start = new Date(booking.startDate)
    const end = new Date(booking.endDate)
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      unavailableDates.add(d.toISOString().split('T')[0])
    }

    if (!allowCheckinOnDepartureDay && (booking as any).status !== 'blocked') {
      unavailableDates.add(end.toISOString().split('T')[0])
    }
  }

  return Array.from(unavailableDates)
    .map(date => ({ date }))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
}

export async function getBlockedBookings(propertyId?: string): Promise<BlockedBookingListItem[]> {
  await dbConnect()

  const query: any = { status: 'blocked' }
  if (propertyId && propertyId !== ALL_PROPERTIES_ID && Types.ObjectId.isValid(propertyId)) {
    query.propertyId = new Types.ObjectId(propertyId)
  }

  const bookings = await Booking.find(query)
    .sort({ startDate: 1, createdAt: -1 })
    .populate('propertyId', 'name')
    .lean()

  return bookings.map((booking: any) => ({
    _id: String(booking._id),
    propertyId: booking.propertyId?._id ? String(booking.propertyId._id) : String(booking.propertyId || ''),
    propertyName: booking.propertyId?.name || 'Domek',
    startDate: new Date(booking.startDate).toISOString(),
    endDate: new Date(booking.endDate).toISOString(),
    adminNotes: booking.adminNotes || '',
    createdAt: booking.createdAt ? new Date(booking.createdAt).toISOString() : new Date().toISOString(),
  }))
}

export async function createBlockedBookingByAdmin(data: BlockCreateInput) {
  try {
    await dbConnect()
    const allowCheckinOnDepartureDay = await getAllowCheckinOnDepartureDay()

    if (!data.propertyId || !data.startDate || !data.endDate) {
      return { success: false, message: 'Select a property and date range.' }
    }

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return { success: false, message: 'Invalid date range.' }
    }

    if (endDate <= startDate) {
      return { success: false, message: 'Block end date must be later than start date.' }
    }

    let targetProperties: Array<{ _id: Types.ObjectId; name: string }> = []

    if (data.propertyId === ALL_PROPERTIES_ID) {
      const properties = await Property
        .find({ isActive: true })
        .select('name')
        .lean()

      targetProperties = properties.map((p: any) => ({ _id: p._id, name: p.name || 'Domek' }))
    } else {
      if (!Types.ObjectId.isValid(data.propertyId)) {
        return { success: false, message: 'Invalid property.' }
      }

      const property = await Property
        .findById(data.propertyId)
        .select('name')
        .lean()

      if (!property) {
        return { success: false, message: 'The selected cottage was not found.' }
      }

      targetProperties = [{ _id: property._id, name: property.name || 'Domek' }]
    }

    if (targetProperties.length === 0) {
      return { success: false, message: 'No cottages to block.' }
    }

    const conflictedProperties: string[] = []
    const overlapFilter = buildBookingOverlapFilter(startDate, endDate, allowCheckinOnDepartureDay)

    for (const property of targetProperties) {
      const overlapBookings = await Booking.find({
        propertyId: property._id,
        ...AVAILABILITY_STATUS_FILTER,
        ...overlapFilter,
      })
        .select('_id propertyId status createdAt stripeSessionId source adminNotes')
        .lean()

      const { occupiedPropertyIds } = await resolveOccupiedPropertyIdsFromBookings(overlapBookings)

      const conflict = occupiedPropertyIds.size > 0

      if (conflict) conflictedProperties.push(property.name)
    }

    if (conflictedProperties.length > 0) {
      return {
        success: false,
        message: `The range conflicts with an existing booking/block: ${conflictedProperties.join(', ')}`,
      }
    }

    const docs = targetProperties.map((property) => ({
      propertyId: property._id,
      startDate,
      endDate,
      firstName: 'Blokada',
      lastName: 'admin',
      guestEmail: 'blokada@admin.local',
      guestPhone: '-',
      adults: 1,
      children: 0,
      extraBedsCount: 0,
      totalPrice: 0,
      paidAmount: 0,
      paymentStatus: 'unpaid',
      status: 'blocked',
      paymentMethod: '',
      adminNotes: data.adminNotes?.trim() || 'Date block',
      source: 'admin',
    }))

    await Booking.insertMany(docs)

    revalidatePath('/', 'layout')
    revalidatePath('/admin', 'layout')
    revalidatePath('/admin/bookings/list')
    revalidatePath('/admin/bookings/calendar')
    revalidatePath('/admin/bookings/block')

    return {
      success: true,
      message: targetProperties.length === 1
        ? 'The date has been blocked.'
        : `The dates have been blocked for ${targetProperties.length} cottages.`,
    }
  } catch (error: any) {
    return { success: false, message: error?.message || 'An error occurred while blocking the date.' }
  }
}

export async function deleteBlockedBookingByAdmin(bookingId: string) {
  try {
    await dbConnect()

    if (!Types.ObjectId.isValid(bookingId)) {
      return { success: false, message: 'Invalid block ID.' }
    }

    const deleted = await Booking.findOneAndDelete({
      _id: new Types.ObjectId(bookingId),
      status: 'blocked',
    })

    if (!deleted) {
      return { success: false, message: 'Block not found for deletion.' }
    }

    revalidatePath('/', 'layout')
    revalidatePath('/admin', 'layout')
    revalidatePath('/admin/bookings/list')
    revalidatePath('/admin/bookings/calendar')
    revalidatePath('/admin/bookings/block')

    return { success: true, message: 'Block has been deleted.' }
  } catch (error: any) {
    return { success: false, message: error?.message || 'An error occurred while deleting the block.' }
  }
}