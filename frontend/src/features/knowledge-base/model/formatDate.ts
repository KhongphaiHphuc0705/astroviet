/**
 * Formats a Knowledge Base article `updatedAt` ISO calendar date string ('YYYY-MM-DD')
 * to Vietnamese display format 'dd/MM/yyyy'.
 *
 * Uses strict `YYYY-MM-DD` regex parsing plus UTC calendar round-trip validation
 * (e.g., rejects `2026-02-29` in a non-leap year, `2026-02-30`, datetimes, and malformed strings)
 * while assembling the output purely from the matched components so formatting is
 * 100% deterministic, timezone-independent, and SSR-safe (AC-F6.4-A01).
 *
 * Returns `""` when input is invalid so views can defensively omit the updated date line
 * instead of rendering malformed text or substituting the current date.
 */
export function formatKnowledgeDate(updatedAt: string): string {
  if (typeof updatedAt !== "string") {
    return "";
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(updatedAt.trim());
  if (!match) {
    return "";
  }

  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return "";
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() + 1 !== month ||
    utcDate.getUTCDate() !== day
  ) {
    return "";
  }

  return `${dayStr}/${monthStr}/${yearStr}`;
}
