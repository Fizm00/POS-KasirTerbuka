import { describe, expect, it } from "vitest";
import {
  formatJakartaDisplayDate,
  formatJakartaDisplayDateTime,
  getJakartaDateString,
  getPresetDateRange,
  jakartaDateToIsoRange,
} from "./dates";

describe("dates utility (Asia/Jakarta timezone)", () => {
  it("correctly separates transactions at 23:30 and 00:30 Jakarta time into distinct days", () => {
    // 2026-10-09 23:30:00 WIB is 2026-10-09 16:30:00 UTC
    const saleAt2330WibUtc = "2026-10-09T16:30:00.000Z";

    // 2026-10-10 00:30:00 WIB is 2026-10-09 17:30:00 UTC
    const saleAt0030WibUtc = "2026-10-09T17:30:00.000Z";

    const day1 = getJakartaDateString(saleAt2330WibUtc);
    const day2 = getJakartaDateString(saleAt0030WibUtc);

    expect(day1).toBe("2026-10-09");
    expect(day2).toBe("2026-10-10");
    expect(day1).not.toBe(day2);
  });

  it("calculates accurate day boundaries for ISO range in Jakarta time", () => {
    const { startDateIso, endDateIso } = jakartaDateToIsoRange("2026-10-09", "2026-10-09");

    // 2026-10-09 00:00:00 WIB is 2026-10-08 17:00:00 UTC
    expect(startDateIso).toBe("2026-10-08T17:00:00.000Z");

    // 2026-10-09 23:59:59.999 WIB is 2026-10-09 16:59:59.999 UTC
    expect(endDateIso).toBe("2026-10-09T16:59:59.999Z");
  });

  it("computes correct presets for reference date", () => {
    // Reference date: 2026-10-15 14:00:00 WIB
    const ref = new Date("2026-10-15T07:00:00.000Z");

    const today = getPresetDateRange("today", ref);
    expect(today.startDateStr).toBe("2026-10-15");
    expect(today.endDateStr).toBe("2026-10-15");

    const sevenDays = getPresetDateRange("7days", ref);
    expect(sevenDays.startDateStr).toBe("2026-10-09");
    expect(sevenDays.endDateStr).toBe("2026-10-15");

    const month = getPresetDateRange("month", ref);
    expect(month.startDateStr).toBe("2026-10-01");
    expect(month.endDateStr).toBe("2026-10-15");
  });

  it("formats Indonesian display dates and date-times", () => {
    expect(formatJakartaDisplayDate("2026-10-09")).toBe("09/10/2026");

    // 2026-10-09 14:30 UTC = 2026-10-09 21:30 WIB
    const formattedTime = formatJakartaDisplayDateTime("2026-10-09T14:30:00.000Z");
    expect(formattedTime).toContain("09/10/2026");
    expect(formattedTime).toContain("21:30");
  });
});
