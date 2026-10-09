/**
 * Codepage translation and Latin character encoding for ESC/POS printers.
 * Keeps text safe, ASCII/Latin compatible, avoiding corrupted characters on thermal printers.
 */

export interface CodepageInfo {
  id: number;
  name: string;
  description: string;
}

export const SUPPORTED_CODEPAGES: CodepageInfo[] = [
  { id: 0, name: "CP437", description: "USA / Standard ESC/POS Default" },
  { id: 2, name: "PC850", description: "Multilingual (Latin-1)" },
  { id: 16, name: "WPC1252", description: "Windows-1252 (Latin-1)" },
  { id: 19, name: "PC858", description: "Euro / Multilingual II" },
];

/**
 * Encodes a string into single-byte character array for ESC/POS codepages.
 * Indonesian retail text uses standard Latin characters, numbers, and basic punctuation.
 */
export function encodeLatinText(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Standard ASCII range (0x20 to 0x7E) and common controls (CR, LF)
    if (code <= 0x7e) {
      bytes[i] = code;
    } else {
      // Basic fallback for common extended Latin or symbols
      bytes[i] = code <= 0xff ? code : 0x3f; // '?' if out of 1-byte range
    }
  }
  return bytes;
}
