import { isTauri as checkTauri } from "@tauri-apps/api/core";
import { Capacitor } from "@capacitor/core";

/**
 * Returns true if running inside the Tauri desktop shell.
 */
export function isTauri(): boolean {
  try {
    return checkTauri();
  } catch {
    return false;
  }
}

/**
 * Returns true if running inside the Capacitor native shell (Android/iOS).
 */
export function isCapacitor(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Returns true if running on native Android via Capacitor.
 */
export function isAndroid(): boolean {
  try {
    return Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
}

/**
 * Returns true if running in a standard web browser (or PWA).
 */
export function isBrowser(): boolean {
  return !isTauri() && !isCapacitor();
}

export type PlatformType = "tauri" | "capacitor" | "browser";

/**
 * Returns the current platform identifier.
 */
export function getPlatform(): PlatformType {
  if (isTauri()) return "tauri";
  if (isCapacitor()) return "capacitor";
  return "browser";
}
