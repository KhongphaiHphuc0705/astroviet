import { UnresolvableTimezoneError } from '../errors/chart.errors.js';

export const ANCHOR_TIME_FOR_UNKNOWN_BIRTH_TIME = {
  hour: 12,
  minute: 0,
  second: 0,
};

/**
 * Gets the offset in milliseconds from UTC for a specific date and timezone.
 */
function getOffsetMs(date: Date, timeZone: string): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = dtf.formatToParts(date);
    let y = 0,
      m = 0,
      d = 0,
      h = 0,
      min = 0,
      s = 0;

    for (const part of parts) {
      if (part.type === 'year') y = parseInt(part.value, 10);
      if (part.type === 'month') m = parseInt(part.value, 10) - 1; // months are 0-indexed in Date.UTC
      if (part.type === 'day') d = parseInt(part.value, 10);
      if (part.type === 'hour') {
        h = parseInt(part.value, 10);
        if (h === 24) h = 0; // Handle midnight
      }
      if (part.type === 'minute') min = parseInt(part.value, 10);
      if (part.type === 'second') s = parseInt(part.value, 10);
    }
    const localAsUtc = Date.UTC(y, m, d, h, min, s);
    return localAsUtc - date.getTime();
  } catch {
    throw new UnresolvableTimezoneError(`Timezone '${timeZone}' không hợp lệ hoặc không tồn tại.`);
  }
}

/**
 * Converts local date and time components to a UTC Date object using the specified IANA timezoneId.
 * If time components are not provided, it falls back to a predefined anchor time (12:00:00).
 */
export function convertLocalTimeToUtc(
  birthDate: Date, // local date
  birthTime: { hour: number; minute: number; second: number } | null,
  isBirthTimeKnown: boolean,
  timezoneId: string,
): Date {
  const year = birthDate.getFullYear();
  const month = birthDate.getMonth();
  const day = birthDate.getDate();

  let hour = 0;
  let minute = 0;
  let second = 0;

  if (isBirthTimeKnown && birthTime) {
    hour = birthTime.hour;
    minute = birthTime.minute;
    second = birthTime.second;
  } else {
    // Sourced from Swiss Ephemeris Integration Spec §9.3 and Decision M3-5
    hour = ANCHOR_TIME_FOR_UNKNOWN_BIRTH_TIME.hour;
    minute = ANCHOR_TIME_FOR_UNKNOWN_BIRTH_TIME.minute;
    second = ANCHOR_TIME_FOR_UNKNOWN_BIRTH_TIME.second;
  }

  // 1. Create a naive date assuming the local components are UTC
  const naiveDate = new Date(Date.UTC(year, month, day, hour, minute, second));

  // 2. Determine offset at naiveDate
  const offset1 = getOffsetMs(naiveDate, timezoneId);

  // 3. Subtract offset to approximate the real UTC date
  const date1 = new Date(naiveDate.getTime() - offset1);

  // 4. Determine offset at the new estimated date
  const offset2 = getOffsetMs(date1, timezoneId);

  // 5. If offsets match, we found the exact UTC time
  if (offset1 === offset2) {
    return date1;
  }

  // 6. Handle DST transitions
  const date2 = new Date(naiveDate.getTime() - offset2);
  const offset3 = getOffsetMs(date2, timezoneId);

  if (offset2 === offset3) {
    return date2;
  }

  // If it still doesn't match, it means the local time provided falls into a "skipped" hour
  // during a DST spring-forward transition, making it an invalid local time.
  throw new Error(`Invalid or ambiguous local time due to DST gap/overlap.`);
}
