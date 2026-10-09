import { describe, expect, it } from "vitest";
import { hashPin, verifyPin } from "./pin";

describe("PIN hashing and verification", () => {
  it("generates a salt and hash in saltHex:hashHex format", async () => {
    const hashed = await hashPin("1234");
    expect(hashed).toContain(":");
    const [salt, hash] = hashed.split(":");
    expect(salt).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(hash).toHaveLength(64); // 256 bits = 32 bytes = 64 hex chars
  });

  it("verifies matching PIN successfully", async () => {
    const hashed = await hashPin("5678");
    const isValid = await verifyPin("5678", hashed);
    expect(isValid).toBe(true);
  });

  it("rejects incorrect PIN", async () => {
    const hashed = await hashPin("1234");
    const isValid = await verifyPin("9999", hashed);
    expect(isValid).toBe(false);
  });

  it("produces different hashes for the same PIN with random salts", async () => {
    const hash1 = await hashPin("1234");
    const hash2 = await hashPin("1234");
    expect(hash1).not.toBe(hash2);

    expect(await verifyPin("1234", hash1)).toBe(true);
    expect(await verifyPin("1234", hash2)).toBe(true);
  });

  it("handles malformed stored hash safely", async () => {
    expect(await verifyPin("1234", "")).toBe(false);
    expect(await verifyPin("1234", "nohyphen")).toBe(false);
    expect(await verifyPin("1234", ":nohash")).toBe(false);
  });
});
