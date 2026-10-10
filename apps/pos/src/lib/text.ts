/**
 * Text manipulation and formatting utilities.
 */

/**
 * Converts a string into sentence case (First letter uppercase, remaining lowercase).
 * Preserves empty string if input is blank.
 */
export function toSentenceCase(text: string): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length === 0) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
