'use server'

import dbConnect from '@/db/connection'
import Booking from '@/db/models/Booking'
import BookingConfig from '@/db/models/BookingConfig'
import { buildBookingOverlapFilter } from '@/utils/bookingOverlap'
import { resolveOccupiedPropertyIdsFromBookings } from '@/utils/lazyAvailabilityCleanup'
import { Types } from 'mongoose'

interface AvailabilityCheckResult {
  available: boolean
  occupiedPropertyIds: string[]
}

export async function isRangeAvailable(
  startDate: string,
  endDate: string,
  propertyIds?: string[]
): Promise<AvailabilityCheckResult> {
  if (!startDate || !endDate) throw new Error('Brak daty rozpoczęcia lub zakończenia')
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error('Nieprawidłowy format daty')
  if (end <= start) throw new Error('Data zakończenia musi być późniejsza niż data rozpoczęcia')

  await dbConnect()

  const bookingConfig = await BookingConfig.findById('main').lean()
  const allowCheckinOnDepartureDay = bookingConfig?.allowCheckinOnDepartureDay ?? true

  const overlapFilter = buildBookingOverlapFilter(start, end, allowCheckinOnDepartureDay)

  const query: any = {
    $or: [
      { status: 'blocked' },
      { status: 'confirmed' },
      { status: 'pending' },
    ],
    ...overlapFilter,
  }

  if (propertyIds && propertyIds.length > 0) {
    query.propertyId = { $in: propertyIds.map((id) => new Types.ObjectId(id)) }
  }

  const overlapping = await Booking.find(query)
    .select('_id propertyId status createdAt stripeSessionId source adminNotes')
    .lean()

  // Ensure all propertyIds are strings to avoid "Objects with toJSON methods are not supported" error
  const plainOverlapping = overlapping.map(doc => ({
    ...doc,
    propertyId: doc.propertyId?.toString(),
    _id: doc._id?.toString(),
  }));

  const { occupiedPropertyIds } = await resolveOccupiedPropertyIdsFromBookings(plainOverlapping)

  if (propertyIds && propertyIds.length > 0) {
    const anyOccupied = propertyIds.some((id) => occupiedPropertyIds.has(id))
    return { available: !anyOccupied, occupiedPropertyIds: Array.from(occupiedPropertyIds) }
  }

  return { available: occupiedPropertyIds.size === 0, occupiedPropertyIds: Array.from(occupiedPropertyIds) }
}
