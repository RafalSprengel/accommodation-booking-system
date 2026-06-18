'use server'

import { revalidatePath } from 'next/cache'
import Stripe from 'stripe'
import dbConnect from '@/db/connection'
import Booking from '@/db/models/Booking'
import { stripe } from '@/lib/stripe'
import type { PaymentMethod } from '@/types/bookingStatus'
import { Types } from 'mongoose'

export type AdminPaymentStatus = 'pending' | 'confirmed' | 'failed' | 'all'
export type AdminPaymentTab = 'online' | 'offline'

export interface AdminPaymentRow {
  id: string
  orderId?: string
  createdAt: string
  firstName?: string
  lastName?: string
  totalPrice: number
  paymentMethod: PaymentMethod
  status: string
  stripeSessionId?: string
}

export interface AdminPaymentsData {
  online: AdminPaymentRow[]
  offline: AdminPaymentRow[]
}

function normalizePaymentRow(row: Record<string, unknown>): AdminPaymentRow {
  if (!row._id) {
    throw new Error('Missing booking ID during payment mapping.')
  }

  if (!row.createdAt) {
    throw new Error('Missing booking creation date during payment mapping.')
  }

  const createdAtValue = row.createdAt
  if (typeof createdAtValue !== 'string' && typeof createdAtValue !== 'number' && !(createdAtValue instanceof Date)) {
    throw new Error('Invalid booking creation date type during payment mapping.')
  }

  // Accept either structured names or legacy guestName string

  if (typeof row.totalPrice !== 'number') {
    throw new Error('Missing valid booking amount during payment mapping.')
  }

  if (row.paymentMethod !== 'online' && row.paymentMethod !== 'cash' && row.paymentMethod !== 'transfer') {
    throw new Error('Missing valid payment method during payment mapping.')
  }

  if (typeof row.status !== 'string') {
    throw new Error('Missing valid status during payment mapping.')
  }

  const mapped: AdminPaymentRow = {
    id: String(row._id),
    createdAt: new Date(createdAtValue as string | number | Date).toISOString(),
    firstName: (row.firstName as string) || (typeof row.guestName === 'string' ? (row.guestName as string).split(' ')[0] : undefined),
    lastName: (row.lastName as string) || (typeof row.guestName === 'string' ? (row.guestName as string).split(' ').slice(1).join(' ') : undefined),
    totalPrice: row.totalPrice,
    paymentMethod: row.paymentMethod,
    status: row.status,
  }

  if (typeof row.orderId === 'string' && row.orderId.trim().length > 0) {
    mapped.orderId = row.orderId
  }

  if (typeof row.stripeSessionId === 'string' && row.stripeSessionId.trim().length > 0) {
    mapped.stripeSessionId = row.stripeSessionId
  }

  return mapped
}

export async function getAdminPaymentsData(): Promise<AdminPaymentsData> {
  await dbConnect()

  const [onlineRows, offlineRows] = await Promise.all([
    Booking.find({
      source: 'online',
      status: { $in: ['pending', 'confirmed', 'failed'] },
    })
      .select('orderId createdAt firstName lastName totalPrice paymentMethod status stripeSessionId')
      .sort({ createdAt: -1 })
      .lean(),
    Booking.find({
      paymentMethod: { $in: ['cash', 'transfer'] },
      status: { $in: ['pending', 'confirmed', 'failed'] },
    })
      .select('orderId createdAt firstName lastName totalPrice paymentMethod status')
      .sort({ createdAt: -1 })
      .lean(),
  ])

  return {
    online: onlineRows.map(normalizePaymentRow),
    offline: offlineRows.map(normalizePaymentRow),
  }
}

export async function syncOnlinePaymentAction(bookingId: string): Promise<{
  ok: boolean
  level: 'success' | 'info' | 'error'
  message: string
}> {
  try {
    await dbConnect()

    if (!Types.ObjectId.isValid(bookingId)) {
      return { ok: false, level: 'error', message: 'Invalid booking ID.' }
    }

    const booking = await Booking.findById(bookingId)
      .select('status source stripeSessionId')
      .lean()

    if (!booking) {
      return { ok: false, level: 'error', message: 'Booking not found for sync.' }
    }

    if (booking.source !== 'online') {
      return { ok: false, level: 'error', message: 'Stripe sync is only available for online payments.' }
    }

    if (booking.status !== 'pending') {
      return { ok: false, level: 'info', message: 'This payment does not have a pending status.' }
    }

    if (typeof booking.stripeSessionId !== 'string' || booking.stripeSessionId.trim().length === 0) {
      return { ok: false, level: 'error', message: 'No stripeSessionId for this booking.' }
    }

    const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId)

    if (session.payment_status === 'paid') {
      await Booking.updateMany(
        {
          stripeSessionId: booking.stripeSessionId,
          source: 'online',
          status: 'pending',
        },
        {
          $set: {
            status: 'confirmed',
            paymentStatus: 'paid',
          },
        }
      )

      revalidatePath('/admin')
      revalidatePath('/admin/bookings/calendar')
      revalidatePath('/admin/bookings/list')
      revalidatePath('/admin/payments')
      revalidatePath('/booking')

      return { ok: true, level: 'success', message: 'Payment confirmed. Booking has been marked as confirmed and paid.' }
    }

    if (session.status === 'expired') {
      await Booking.updateMany(
        {
          stripeSessionId: booking.stripeSessionId,
          source: 'online',
          status: 'pending',
        },
        {
          $set: {
            status: 'failed',
          },
        }
      )

      revalidatePath('/admin')
      revalidatePath('/admin/bookings/calendar')
      revalidatePath('/admin/bookings/list')
      revalidatePath('/admin/payments')
      revalidatePath('/booking')

      return { ok: true, level: 'success', message: 'Stripe session expired. Booking has been marked as failed.' }
    }

    if (session.status === 'open') {
      return { ok: true, level: 'info', message: 'Client still has an open payment window.' }
    }

    return {
      ok: false,
      level: 'error',
      message: `Unsupported Stripe session status: ${session.status} / payment_status: ${session.payment_status}.`,
    }
  } catch (error: unknown) {
    if (error instanceof Stripe.errors.StripeError) {
      return {
        ok: false,
        level: 'error',
        message: `Stripe: ${error.message}`,
      }
    }

    if (error instanceof Error) {
      return { ok: false, level: 'error', message: error.message }
    }

    return { ok: false, level: 'error', message: 'An unknown error occurred during Stripe sync.' }
  }
}
