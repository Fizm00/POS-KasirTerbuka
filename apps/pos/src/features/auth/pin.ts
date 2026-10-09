/**
 * PIN hashing and verification using Web Crypto PBKDF2.
 * Salt is generated per-user and stored alongside the derived hash in format "saltHex:hashHex".
 */

const ITERATIONS = 100_000;
const HASH_BITS = 256;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Hashes a 4-6 digit PIN using PBKDF2 with a salt.
 * If saltHex is provided, uses that salt; otherwise generates a new 16-byte random salt.
 * Returns combined string "saltHex:hashHex".
 */
export async function hashPin(pin: string, existingSaltHex?: string): Promise<string> {
  const salt = existingSaltHex
    ? hexToBytes(existingSaltHex)
    : crypto.getRandomValues(new Uint8Array(16));

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    HASH_BITS
  );

  const derivedBytes = new Uint8Array(derivedBits);
  const saltHex = bytesToHex(salt);
  const hashHex = bytesToHex(derivedBytes);

  return `${saltHex}:${hashHex}`;
}

/**
 * Verifies a PIN against a stored "saltHex:hashHex" string.
 */
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !storedHash.includes(":")) {
    return false;
  }

  const [saltHex, expectedHashHex] = storedHash.split(":");
  if (!saltHex || !expectedHashHex) {
    return false;
  }

  try {
    const computed = await hashPin(pin, saltHex);
    const computedHashHex = computed.split(":")[1];
    return computedHashHex === expectedHashHex;
  } catch {
    return false;
  }
}
