/**
 * Date and timezone utilities for Asia/Jakarta (WIB, UTC+7).
 * Ensures day boundaries and date grouping accurately follow Indonesian Western Time.
 */

const JAKARTA_TIMEZONE = "Asia/Jakarta";

/**
 * Returns the YYYY-MM-DD date string of a Date or ISO string in Asia/Jakarta time.
 */
export function getJakartaDateString(dateInput: Date | string | number): string {
  const d =
    typeof dateInput === "string" || typeof dateInput === "number"
      ? new Date(dateInput)
      : dateInput;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Returns the current date components in Asia/Jakarta.
 */
export function getJakartaDateParts(referenceDate: Date = new Date()): {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  dateString: string; // YYYY-MM-DD
} {
  const dateString = getJakartaDateString(referenceDate);
  const [yearStr, monthStr, dayStr] = dateString.split("-");
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10),
    day: parseInt(dayStr, 10),
    dateString,
  };
}

/**
 * Converts a Jakarta date string (YYYY-MM-DD) to ISO UTC boundary strings.
 */
export function jakartaDateToIsoRange(
  startDateStr: string,
  endDateStr: string
): { startDateIso: string; endDateIso: string } {
  // Asia/Jakarta is UTC+7 with no daylight savings time
  const startDate = new Date(`${startDateStr}T00:00:00+07:00`);
  const endDate = new Date(`${endDateStr}T23:59:59.999+07:00`);

  return {
    startDateIso: startDate.toISOString(),
    endDateIso: endDate.toISOString(),
  };
}

export type DatePreset = "today" | "7days" | "month" | "custom";

export interface PresetRangeResult {
  startDateStr: string; // YYYY-MM-DD
  endDateStr: string; // YYYY-MM-DD
  startDateIso: string; // ISO string for DB query
  endDateIso: string; // ISO string for DB query
}

/**
 * Computes start and end boundaries for predefined presets in Asia/Jakarta timezone.
 */
export function getPresetDateRange(
  preset: "today" | "7days" | "month",
  referenceDate: Date = new Date()
): PresetRangeResult {
  const nowParts = getJakartaDateParts(referenceDate);
  const endStr = nowParts.dateString;

  let startStr = endStr;

  if (preset === "today") {
    startStr = endStr;
  } else if (preset === "7days") {
    // 7 days inclusive: today minus 6 days
    // Construct Jakarta noon to safely shift days without boundary ambiguity
    const anchor = new Date(`${nowParts.dateString}T12:00:00+07:00`);
    anchor.setDate(anchor.getDate() - 6);
    startStr = getJakartaDateString(anchor);
  } else if (preset === "month") {
    const monthPadded = String(nowParts.month).padStart(2, "0");
    startStr = `${nowParts.year}-${monthPadded}-01`;
  }

  const { startDateIso, endDateIso } = jakartaDateToIsoRange(startStr, endStr);

  return {
    startDateStr: startStr,
    endDateStr: endStr,
    startDateIso,
    endDateIso,
  };
}

/**
 * Formats YYYY-MM-DD or ISO string into DD/MM/YYYY for Indonesian display.
 */
export function formatJakartaDisplayDate(dateInput: string): string {
  const [year, month, day] = dateInput.slice(0, 10).split("-");
  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }
  return dateInput;
}

/**
 * Formats ISO string into DD/MM/YYYY HH:mm in Asia/Jakarta.
 */
export function formatJakartaDisplayDateTime(isoString: string): string {
  const d = new Date(isoString);
  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(d).replace(/\./g, ":");
}
