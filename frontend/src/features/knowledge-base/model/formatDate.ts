/**
 * Formats a Knowledge Base article `updatedAt` date string ('YYYY-MM-DD')
 * to Vietnamese display format 'dd/MM/yyyy'.
 *
 * Implemented using pure string parsing to ensure 100% deterministic,
 * timezone-independent, and SSR-safe rendering.
 * If input does not match 'YYYY-MM-DD', returns the input string unchanged.
 */
export function formatKnowledgeDate(updatedAt: string): string {
  if (typeof updatedAt !== "string") {
    return "";
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(updatedAt.trim());
  if (!match) {
    return updatedAt;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}
