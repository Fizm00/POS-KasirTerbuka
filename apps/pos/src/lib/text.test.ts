import { describe, expect, it } from "vitest";
import { toSentenceCase } from "./text";

describe("toSentenceCase", () => {
  it("normalizes uppercase and lowercase strings to sentence case", () => {
    expect(toSentenceCase("MAKANAN")).toBe("Makanan");
    expect(toSentenceCase("minuman")).toBe("Minuman");
    expect(toSentenceCase("snack ringan")).toBe("Snack ringan");
    expect(toSentenceCase("KOPI SUSU GULA AREN")).toBe("Kopi susu gula aren");
  });

  it("handles empty and edge case strings safely", () => {
    expect(toSentenceCase("")).toBe("");
    expect(toSentenceCase("   ")).toBe("");
    expect(toSentenceCase("a")).toBe("A");
  });
});
