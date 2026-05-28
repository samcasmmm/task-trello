import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { parseISO, formatDistance, isValid, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return '';

  let dateObj: Date;

  try {
    if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = parseISO(date);
    }

    if (!isValid(dateObj)) {
      dateObj = new Date(date);
      if (!isValid(dateObj)) return '';
    }

    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Date parsing error fallback invoked for value:', date, error);
    return '';
  }
}
