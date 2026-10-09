/**
 * ESC/POS Command Byte Constants and Builder Helpers
 * Standard ESC/POS specification for thermal receipt printers.
 */

export const CMD = {
  // Hardware control
  INIT: new Uint8Array([0x1b, 0x40]), // ESC @
  LF: new Uint8Array([0x0a]), // Line feed

  // Paper cutting
  // GS V 65 3 (0x1D, 0x56, 0x41, 0x03): Feed paper n units and cut (partial cut)
  FEED_AND_PARTIAL_CUT: new Uint8Array([0x1d, 0x56, 0x41, 0x03]),
  // GS V 0 (0x1D, 0x56, 0x00): Full cut
  FULL_CUT: new Uint8Array([0x1d, 0x56, 0x00]),

  // Cash drawer kick
  // ESC p m t1 t2: pulse to pin 2 (m=0) or pin 5 (m=1), on=50ms (0x19), off=250ms (0x7D)
  DRAWER_PULSE_PIN2: new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0x7d]),
  DRAWER_PULSE_PIN5: new Uint8Array([0x1b, 0x70, 0x01, 0x19, 0x7d]),

  // Text alignment: ESC a n (0=left, 1=center, 2=right)
  ALIGN_LEFT: new Uint8Array([0x1b, 0x61, 0x00]),
  ALIGN_CENTER: new Uint8Array([0x1b, 0x61, 0x01]),
  ALIGN_RIGHT: new Uint8Array([0x1b, 0x61, 0x02]),

  // Bold / Emphasize: ESC E n (1=on, 0=off)
  BOLD_ON: new Uint8Array([0x1b, 0x45, 0x01]),
  BOLD_OFF: new Uint8Array([0x1b, 0x45, 0x00]),

  // Underline: ESC - n (0=off, 1=1-dot, 2=2-dot)
  UNDERLINE_ON: new Uint8Array([0x1b, 0x2d, 0x01]),
  UNDERLINE_OFF: new Uint8Array([0x1b, 0x2d, 0x00]),

  // Text Size: GS ! n
  // Bits 0-3: height multiplier (0 = normal, 1 = double height)
  // Bits 4-7: width multiplier (0 = normal, 1 = double width)
  SIZE_NORMAL: new Uint8Array([0x1d, 0x21, 0x00]),
  SIZE_DOUBLE_HEIGHT: new Uint8Array([0x1d, 0x21, 0x01]),
  SIZE_DOUBLE_WIDTH: new Uint8Array([0x1d, 0x21, 0x10]),
  SIZE_DOUBLE_BOTH: new Uint8Array([0x1d, 0x21, 0x11]),
} as const;

/**
 * Creates ESC/POS byte sequence for selecting a codepage: ESC t <n>
 */
export function setCodepage(n: number): Uint8Array {
  return new Uint8Array([0x1b, 0x74, n & 0xff]);
}

/**
 * Creates ESC/POS byte sequence for feeding n lines: ESC d <n>
 */
export function feedLines(n: number): Uint8Array {
  return new Uint8Array([0x1b, 0x64, Math.max(1, Math.min(255, n))]);
}
