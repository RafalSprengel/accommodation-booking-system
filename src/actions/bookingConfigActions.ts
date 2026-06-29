'use server'
import dbConnect from '@/db/connection';
import BookingConfig from '@/db/models/BookingConfig';
import { revalidatePath } from 'next/cache';
import { ensureAdmin } from '@/lib/ensureAdmin';

export interface BookingConfig {
  minBookingDays: number;
  maxBookingDays: number;
  highSeasonStart: string | null;
  highSeasonEnd: string | null;
  childrenFreeAgeLimit: number;
  allowCheckinOnDepartureDay: boolean;
  checkInHour: number;
  checkOutHour: number;
}

async function ensureBookingConfigExists() {
  try {
    await dbConnect();
    const exists = await BookingConfig.findById('main');
    if (!exists) {
      await BookingConfig.create({
        _id: 'main',
        allowCheckinOnDepartureDay: true,
        checkInHour: 15,
        checkOutHour: 12
      });
    }
  } catch (error) {
    console.error('Error checking booking configuration:', error);
  }
}

export async function getBookingConfig(): Promise<BookingConfig> {
  try {
    await ensureBookingConfigExists();
    const config = await BookingConfig.findById('main').lean();
    return {
      minBookingDays: config?.minBookingDays ?? 1,
      maxBookingDays: config?.maxBookingDays ?? 30,
      highSeasonEnd: config?.highSeasonEnd ?? null,
      highSeasonStart: config?.highSeasonStart ?? null,
      childrenFreeAgeLimit: config?.childrenFreeAgeLimit ?? 13,
      allowCheckinOnDepartureDay: config?.allowCheckinOnDepartureDay ?? true,
      checkInHour: config?.checkInHour ?? 15,
      checkOutHour: config?.checkOutHour ?? 12
    };
  } catch (error) {
    console.error('Error fetching booking configuration:', error);
    return {
      minBookingDays: 1,
      maxBookingDays: 30,
      highSeasonEnd: null,
      highSeasonStart: null,
      childrenFreeAgeLimit: 13,
      allowCheckinOnDepartureDay: true,
      checkInHour: 15,
      checkOutHour: 12
    };
  }
}

export async function updateAllowCheckinOnDepartureDay(allow: boolean) {
  await ensureAdmin();
  try {
    await dbConnect();
    await BookingConfig.findByIdAndUpdate(
      'main',
      { allowCheckinOnDepartureDay: allow },
      { upsert: true }
    );
    revalidatePath('/', 'layout');
    return { success: true, message: 'Setting updated' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Save error' };
  }
}

export async function updateBookingConfig(_prevState: Record<string, unknown>, formData: FormData) {
  await ensureAdmin();
  try {
    await dbConnect();
    const minBookingDays = parseInt(formData.get('minBookingDays') as string, 10) || 1;
    const maxBookingDays = parseInt(formData.get('maxBookingDays') as string, 10) || 30;
    const childrenFreeAgeLimit = parseInt(formData.get('childrenFreeAgeLimit') as string, 10) || 13;
    const allowCheckinOnDepartureDay = formData.get('allowCheckinOnDepartureDay') === 'on';
    const checkInHour = parseInt(formData.get('checkInHour') as string, 10) || 15;
    const checkOutHour = parseInt(formData.get('checkOutHour') as string, 10) || 12;

    if (checkInHour < 0 || checkInHour > 23 || checkOutHour < 0 || checkOutHour > 23) {
      return { success: false, message: 'Hours must be between 0-23.' };
    }

    await BookingConfig.findByIdAndUpdate(
      'main',
      {
        minBookingDays,
        maxBookingDays,
        childrenFreeAgeLimit,
        allowCheckinOnDepartureDay,
        checkInHour,
        checkOutHour
      },
      { upsert: true, new: true }
    );
    revalidatePath('/', 'layout');
    return { success: true, message: 'Booking settings saved.' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'An error occurred while saving.' };
  }
}