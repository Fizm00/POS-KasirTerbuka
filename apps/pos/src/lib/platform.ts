import { isTauri as checkTauri } from "@tauri-apps/api/core";
import { Capacitor } from "@capacitor/core";

/**
 * Returns true if running inside the Tauri desktop shell.
 */
export function isTauri(): boolean {
  try {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if (
        win.location?.hostname === "tauri.localhost" ||
        win.location?.origin?.includes("tauri.localhost") ||
        win.location?.protocol === "tauri:" ||
        Boolean(win.__TAURI_INTERNALS__) ||
        Boolean(win.__TAURI__) ||
        Boolean(win.isTauri) ||
        Boolean(win.chrome?.webview)
      ) {
        return true;
      }
    }
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
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if (
        Boolean(win.Capacitor?.isNativePlatform?.()) ||
        Boolean(win.androidBridge) ||
        win.location?.protocol === "capacitor:" ||
        (win.location?.origin === "http://localhost" &&
          /android/i.test(navigator?.userAgent || "")) ||
        (win.location?.origin === "https://localhost" &&
          /android/i.test(navigator?.userAgent || ""))
      ) {
        return true;
      }
    }
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
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if (
        Boolean(win.androidBridge) ||
        win.Capacitor?.getPlatform?.() === "android" ||
        win.Capacitor?.platform === "android" ||
        (isCapacitor() && /android/i.test(navigator?.userAgent || ""))
      ) {
        return true;
      }
    }
    return isCapacitor() && Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
}

/**
 * Returns true if running as an installed PWA in standalone display mode.
 */
export function isPwa(): boolean {
  if (isTauri() || isCapacitor()) return false;
  if (typeof window === "undefined") return false;
  return (
    Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches) ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Boolean((navigator as any).standalone)
  );
}

/**
 * Returns true if the app is already installed (Desktop, Mobile, or PWA).
 */
export function isInstalled(): boolean {
  return isTauri() || isCapacitor() || isPwa();
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
