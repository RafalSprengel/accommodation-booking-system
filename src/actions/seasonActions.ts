'use server'

import dbConnect from '@/db/connection';
import Season from '@/db/models/Season';
import PropertyPrices from '@/db/models/PropertyPrices';
import Property from '@/db/models/Property';
import CustomPrice from '@/db/models/CustomPrice';
import { revalidatePath } from 'next/cache';
import { hasSeasonOverlap } from '@/utils/validateSeasonOverlap';

export interface ISeasonData {
  _id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

type MonthDaySegment = { start: number; end: number };

function toMonthDayValue(dateLike: Date | string): number {
  const date = new Date(dateLike);
  return (date.getMonth() + 1) * 100 + date.getDate();
}

function formatMonthDay(dateLike: Date | string): string {
  const date = new Date(dateLike);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
}

function toSegments(start: number, end: number): MonthDaySegment[] {
  if (start <= end) {
    return [{ start, end }];
  }

  // Cross-year range (e.g. 12-20 to 01-05).
  return [
    { start, end: 1231 },
    { start: 101, end },
  ];
}

function rangesOverlap(
  rangeA: MonthDaySegment[],
  rangeB: MonthDaySegment[]
): boolean {
  return rangeA.some((a) =>
    rangeB.some((b) => a.start <= b.end && b.start <= a.end)
  );
}

// ── Seasons CRUD ─────────────────────────────────────────────────────────────

export async function getAllSeasons() {
  try {
    await dbConnect();
    const seasons = await Season.find({}).sort({ startDate: 1 }).lean();
    return JSON.parse(JSON.stringify(seasons)) as ISeasonData[];
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return [];
  }
}

export async function getSeasonById(id: string) {
  try {
    await dbConnect();
    const season = await Season.findById(id).lean();
    if (!season) return null;
    return JSON.parse(JSON.stringify(season)) as ISeasonData;
  } catch (error) {
    console.error('Error fetching season:', error);
    return null;
  }
}

export async function updateSeasonDates(
  seasonName: string,
  seasonDesc: string,
  seasonId: string,
  startDate: string,
  endDate: string
) {
  try {
    await dbConnect();

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(12, 0, 0, 0);
    end.setHours(12, 0, 0, 0);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { success: false, message: 'Invalid season dates' };
    }

    const startMonth = start.getMonth();
    const startDay = start.getDate();
    const endMonth = end.getMonth();
    const endDay = end.getDate();

    const normalizedStartDate = new Date(2000, startMonth, startDay, 12, 0, 0, 0);
    const isCrossYear = (endMonth + 1) * 100 + endDay < (startMonth + 1) * 100 + startDay;
    const normalizedEndDate = new Date(isCrossYear ? 2001 : 2000, endMonth, endDay, 12, 0, 0, 0);

    const candidateStart = toMonthDayValue(normalizedStartDate);
    const candidateEnd = toMonthDayValue(normalizedEndDate);
    const candidateSegments = toSegments(candidateStart, candidateEnd);

    const otherSeasons = await Season.find({ _id: { $ne: seasonId } })
      .select('name startDate endDate')
      .lean();

    const overlappingSeason = otherSeasons.find((other) => {
      const otherStart = toMonthDayValue(other.startDate as Date);
      const otherEnd = toMonthDayValue(other.endDate as Date);
      const otherSegments = toSegments(otherStart, otherEnd);
      return rangesOverlap(candidateSegments, otherSegments);
    });

    if (overlappingSeason) {
      const overlapStart = formatMonthDay(overlappingSeason.startDate as Date);
      const overlapEnd = formatMonthDay(overlappingSeason.endDate as Date);
      return {
        success: false,
        message: `Date range overlaps with season "${overlappingSeason.name}", which is set from ${overlapStart} to ${overlapEnd}.`,
      };
    }

    await Season.findByIdAndUpdate(seasonId, {
      name: seasonName,
      description: seasonDesc,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
    });
    revalidatePath('/admin/settings/booking');
    revalidatePath('/admin/prices');
    revalidatePath('/', 'layout');
    return { success: true, message: 'Season dates updated' };
  } catch (error) {
    console.error('Error updating season:', error);
    return { success: false, message: 'Failed to update season dates' };
  }
}

export async function createSeason(name: string, description: string, startDate: string, endDate: string) {
  try {
    await dbConnect();

    const normalizedName = name.trim();
    if (!normalizedName) {
      return { success: false, message: 'Season name is required' };
    }
    if (!startDate || !endDate) {
      return { success: false, message: 'Season dates are required' };
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    parsedStartDate.setHours(12, 0, 0, 0);
    parsedEndDate.setHours(12, 0, 0, 0);

    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
      return { success: false, message: 'Invalid season dates' };
    }

    const startMD = toMonthDayValue(parsedStartDate);
    const endMD = toMonthDayValue(parsedEndDate);
    const isCrossYear = endMD < startMD;
    const normalizedStart = new Date(2000, parsedStartDate.getMonth(), parsedStartDate.getDate(), 12, 0, 0, 0);
    const normalizedEnd = new Date(isCrossYear ? 2001 : 2000, parsedEndDate.getMonth(), parsedEndDate.getDate(), 12, 0, 0, 0);

    const overlapResult = await hasSeasonOverlap(normalizedStart, normalizedEnd);
    if (overlapResult.hasOverlap && overlapResult.overlappingSeason) {
      const s = overlapResult.overlappingSeason;
      const overlapStart = formatMonthDay(s.startDate as Date);
      const overlapEnd = formatMonthDay(s.endDate as Date);
      return {
        success: false,
        message: `Date range overlaps with season "${s.name as string}", which is set from ${overlapStart} to ${overlapEnd}.`,
      };
    }

    const season = await Season.create({
      name: normalizedName,
      description: description.trim(),
      startDate: normalizedStart,
      endDate: normalizedEnd,
      isActive: true,
    });

    revalidatePath('/admin/settings/booking');
    revalidatePath('/admin/prices');
    return {
      success: true,
      message: `Season added: ${normalizedName}`,
      seasonId: season._id.toString(),
    };
  } catch (error) {
    console.error('Error creating season:', error);
    return { success: false, message: 'Failed to add season' };
  }
}

export async function deleteSeason(seasonId: string) {
  try {
    await dbConnect();

    const deleted = await Season.findByIdAndDelete(seasonId);
    if (!deleted) {
      return { success: false, message: 'Season not found for deletion' };
    }

    revalidatePath('/admin/settings/booking');
    revalidatePath('/admin/prices');
    return { success: true, message: `Season deleted: ${deleted.name}` };
  } catch (error) {
    console.error('Error deleting season:', error);
    return { success: false, message: 'Failed to delete season' };
  }
}

// ── Prices per property (kolekcja PropertyPrices) ────────────────────────────
//
// Konwencja: seasonId === null  →  ceny poza sezonem (dawne basicPrices)
//            seasonId === <id>  →  ceny dla konkretnego sezonu

/**
 * Pobiera wszystkie rekordy cenowe dla jednego domku.
 * Zwraca tablicę zawierającą zarówno basicPrices (seasonId: null)
 * jak i wszystkie wpisy sezonowe.
 */
export async function getPricesForProperty(propertyId: string) {
  try {
    await dbConnect();
    const prices = await PropertyPrices.find({ propertyId }).lean();
    return JSON.parse(JSON.stringify(prices));
  } catch (error) {
    console.error('Error fetching property prices:', error);
    return [];
  }
}

/**
 * Pobiera ceny poza sezonem dla domku.
 */
export async function getBasicPrices(propertyId: string) {
  try {
    await dbConnect();
    const prices = await PropertyPrices.findOne({
      propertyId,
      seasonId: null,
    }).lean();

    return {
      success: true,
      data: prices ?? null,
      message: prices
        ? 'Basic prices found'
        : 'No basic prices configured',
    };
  } catch (error) {
    console.error('Error fetching basic prices:', error);
    return { success: false, message: 'Failed to fetch basic prices' };
  }
}

/**
 * Zapisuje/aktualizuje ceny poza sezonem dla domku.
 * Używa upsert – bezpieczne przy pierwszym zapisie.
 */
export async function updateBasicPrices(
  previousState: { message: string; success: boolean } | null,
  formData: FormData
) {
  try {
    const propertyId = formData.get('propertyId') as string;
    const weekdayPrices = JSON.parse(formData.get('weekdayTiers') as string);
    const weekendPrices = JSON.parse(formData.get('weekendTiers') as string);
    const weekdayExtraBedPrice =
      parseInt(formData.get('weekdayExtraBedPrice') as string) || 50;
    const weekendExtraBedPrice =
      parseInt(formData.get('weekendExtraBedPrice') as string) || 70;

    if (
      !propertyId ||
      !Array.isArray(weekdayPrices) ||
      !Array.isArray(weekendPrices)
    ) {
      return { success: false, message: 'Invalid data' };
    }

    await dbConnect();

    await PropertyPrices.findOneAndUpdate(
      { propertyId, seasonId: null },
      { weekdayPrices, weekendPrices, weekdayExtraBedPrice, weekendExtraBedPrice },
      { upsert: true, new: true }
    );

    // revalidatePath('/admin/prices');
    revalidatePath('/', 'layout');
    return { success: true, message: 'Basic prices saved' };
  } catch (error) {
    console.error('Error saving basic prices:', error);
    return { success: false, message: 'Failed to save basic prices' };
  }
}

/**
 * Usuwa ceny poza sezonem dla domku.
 */
export async function deleteBasicPrices(propertyId: string) {
  try {
    await dbConnect();
    await PropertyPrices.deleteOne({ propertyId, seasonId: null });
    revalidatePath('/admin/prices');
    revalidatePath('/', 'layout');
    return { success: true, message: 'Basic prices deleted' };
  } catch (error) {
    console.error('Error deleting basic prices:', error);
    return { success: false, message: 'Failed to delete basic prices' };
  }
}

/**
 * Zapisuje ceny sezonowe lub podstawowe dla domku.
 * mode === 'basic'  →  seasonId: null
 * mode === 'season' →  seasonId: <id>
 *
 * Używa upsert – jedno zapytanie, żadnej logiki merge.
 */
export async function updateSeasonPricesForProperty(
  previousState: { message: string; success: boolean } | null,
  formData: FormData
) {
  try {
    const propertyId = formData.get('propertyId') as string;
    const mode = formData.get('mode') as 'basic' | 'season';
    const weekdayPrices = JSON.parse(formData.get('weekdayTiers') as string);
    const weekendPrices = JSON.parse(formData.get('weekendTiers') as string);
    const weekdayExtraBedPrice =
      parseInt(formData.get('weekdayExtraBedPrice') as string) || 50;
    const weekendExtraBedPrice =
      parseInt(formData.get('weekendExtraBedPrice') as string) || 70;

    if (
      !propertyId ||
      !Array.isArray(weekdayPrices) ||
      !Array.isArray(weekendPrices)
    ) {
      return { success: false, message: 'Invalid data' };
    }

    await dbConnect();

    const seasonId = mode === 'season'
      ? (formData.get('seasonId') as string | null)
      : null;

    if (mode === 'season' && !seasonId) {
      return { success: false, message: 'Missing season ID' };
    }

    await PropertyPrices.findOneAndUpdate(
      { propertyId, seasonId: seasonId ?? null },
      { weekdayPrices, weekendPrices, weekdayExtraBedPrice, weekendExtraBedPrice },
      { upsert: true, new: true }
    );

    revalidatePath('/admin/prices');
    revalidatePath('/', 'layout');
    return {
      success: true,
      message: mode === 'basic'
        ? 'Basic prices saved'
        : 'Seasonal prices saved',
    };
  } catch (error) {
    console.error('Error saving prices:', error);
    return { success: false, message: 'An error occurred while saving' };
  }
}

// Zostawione dla kompatybilności wstecznej (BookingSettingsForm używa updateSeasonPrices)
export async function updateSeasonPrices(
  previousState: { message: string; success: boolean },
  formData: FormData
) {
  return updateSeasonPricesForProperty(previousState, formData);
}

/**
 * Kopiuje wszystkie ceny (podstawowe + sezonowe) z jednego domku do pozostałych aktywnych domków.
 */
export async function copyPricesToAllProperties(sourcePropertyId: string) {
  try {
    await dbConnect();

    const sourcePrices = await PropertyPrices.find({ propertyId: sourcePropertyId }).lean();
    const sourceCustomPrices = await CustomPrice.find({ propertyId: sourcePropertyId }).lean();
    const otherProperties = await Property.find({
      isActive: true,
      _id: { $ne: sourcePropertyId },
    }).lean();

    if (otherProperties.length === 0) {
      return { success: false, message: 'No other cottages to copy prices to.' };
    }

    for (const property of otherProperties) {
      const targetId = property._id.toString();

      // Kopiuj ceny sezonowe/podstawowe
      await PropertyPrices.deleteMany({ propertyId: targetId });
      for (const priceRecord of sourcePrices) {
        const { _id, propertyId: _src, ...rest } = priceRecord as any;
        await PropertyPrices.create({ ...rest, propertyId: targetId });
      }

      // Kopiuj ceny indywidualne
      await CustomPrice.deleteMany({ propertyId: targetId });
      for (const customRecord of sourceCustomPrices) {
        const { _id, propertyId: _src, ...rest } = customRecord as any;
        await CustomPrice.create({ ...rest, propertyId: targetId });
      }
    }

    revalidatePath('/admin/prices');
    revalidatePath('/', 'layout');
    return {
      success: true,
      message: `Prices copied to ${otherProperties.length} cottage(s).`,
    };
  } catch (error) {
    console.error('Error copying prices:', error);
    return { success: false, message: 'Failed to copy prices.' };
  }
}