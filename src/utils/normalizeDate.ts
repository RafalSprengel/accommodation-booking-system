import dayjs from 'dayjs';

export function normalizeDate(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}
