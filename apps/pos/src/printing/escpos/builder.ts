import type { ReceiptModel } from "../receipt";
import { CMD, feedLines, setCodepage } from "./commands";
import { encodeLatinText } from "./codepages";
import { padTwoColumns } from "../receipt";
import type { PaperWidth } from "../../db/schema";

export interface EscPosOptions {
  codepage?: number; // default 0 (CP437)
  openCashDrawer?: boolean; // trigger cash drawer kick pulse
  cut?: boolean; // default true (feed and cut paper)
  feedLinesCount?: number; // default 3
}

/**
 * Merges multiple Uint8Array buffers into one contiguous Uint8Array.
 */
export function concatByteArrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, curr) => acc + curr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Builds raw ESC/POS bytes from a ReceiptModel.
 * Pure function: does not perform any I/O or state modification.
 */
export function buildEscPosBytes(receipt: ReceiptModel, options: EscPosOptions = {}): Uint8Array {
  const { codepage = 0, openCashDrawer = false, cut = true, feedLinesCount = 3 } = options;

  const chunks: Uint8Array[] = [];

  // 1. Initialize printer
  chunks.push(CMD.INIT);

  // 2. Select codepage
  chunks.push(setCodepage(codepage));

  // 3. Process each receipt line
  for (const line of receipt.lines) {
    // Set Alignment
    if (line.align === "center") {
      chunks.push(CMD.ALIGN_CENTER);
    } else if (line.align === "right") {
      chunks.push(CMD.ALIGN_RIGHT);
    } else {
      chunks.push(CMD.ALIGN_LEFT);
    }

    // Set Bold
    const isBold = Boolean(line.isBold || line.type === "header");
    chunks.push(isBold ? CMD.BOLD_ON : CMD.BOLD_OFF);

    // Set Text Size (Total line or isDoubleHeight uses double height)
    const isDoubleHeight = Boolean(line.isDoubleHeight || line.type === "total");
    chunks.push(isDoubleHeight ? CMD.SIZE_DOUBLE_HEIGHT : CMD.SIZE_NORMAL);

    // Prepare line text
    let lineText = "";
    if (line.type === "two-column" && line.left !== undefined && line.right !== undefined) {
      lineText = padTwoColumns(line.left, line.right, receipt.columnWidth);
    } else if (line.text !== undefined) {
      lineText = line.text;
    }

    // Write text and line feed
    if (lineText.length > 0) {
      chunks.push(encodeLatinText(lineText));
    }
    chunks.push(CMD.LF);

    // Reset line formatting
    if (isBold) chunks.push(CMD.BOLD_OFF);
    if (isDoubleHeight) chunks.push(CMD.SIZE_NORMAL);
    if (line.align && line.align !== "left") chunks.push(CMD.ALIGN_LEFT);
  }

  // 4. Feed lines before cutting / finishing
  chunks.push(feedLines(feedLinesCount));

  // 5. Open cash drawer if requested
  if (openCashDrawer) {
    chunks.push(CMD.DRAWER_PULSE_PIN2);
  }

  // 6. Cut paper
  if (cut) {
    chunks.push(CMD.FEED_AND_PARTIAL_CUT);
  }

  return concatByteArrays(chunks);
}

/**
 * Builds standalone ESC/POS command bytes to kick open the cash drawer.
 */
export function buildCashDrawerBytes(): Uint8Array {
  return concatByteArrays([CMD.INIT, CMD.DRAWER_PULSE_PIN2]);
}

/**
 * Builds a diagnostic self-test printout in ESC/POS format.
 */
export function buildTestPrintBytes(
  paperWidth: PaperWidth = 58,
  storeName: string = "Kasir Terbuka"
): Uint8Array {
  const colWidth = paperWidth === 80 ? 48 : 32;
  const divider = "-".repeat(colWidth);

  const chunks: Uint8Array[] = [
    CMD.INIT,
    setCodepage(0),
    CMD.ALIGN_CENTER,
    CMD.BOLD_ON,
    CMD.SIZE_DOUBLE_HEIGHT,
    encodeLatinText(storeName),
    CMD.LF,
    CMD.SIZE_NORMAL,
    CMD.BOLD_OFF,
    encodeLatinText("Uji Cetak Thermal Printer"),
    CMD.LF,
    encodeLatinText(divider),
    CMD.LF,
    CMD.ALIGN_LEFT,
    encodeLatinText(`Lebar kertas: ${paperWidth} mm (${colWidth} kolom)`),
    CMD.LF,
    encodeLatinText(`Status: Terhubung & Siap`),
    CMD.LF,
    encodeLatinText(`Waktu: ${new Date().toLocaleString("id-ID")}`),
    CMD.LF,
    CMD.ALIGN_CENTER,
    encodeLatinText(divider),
    CMD.LF,
    encodeLatinText("Jika teks ini terbaca jelas,"),
    CMD.LF,
    encodeLatinText("printer Anda siap digunakan."),
    CMD.LF,
    feedLines(3),
    CMD.FEED_AND_PARTIAL_CUT,
  ];

  return concatByteArrays(chunks);
}
