import { describe, it, expect, vi, beforeEach } from "vitest";
import * as platform from "./platform";
import * as tauriCore from "@tauri-apps/api/core";
import { Capacitor } from "@capacitor/core";

vi.mock("@tauri-apps/api/core", () => ({
  isTauri: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
    getPlatform: vi.fn(),
  },
}));

describe("platform detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("identifies tauri environment when isTauri returns true", () => {
    vi.mocked(tauriCore.isTauri).mockReturnValue(true);
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    expect(platform.isTauri()).toBe(true);
    expect(platform.isCapacitor()).toBe(false);
    expect(platform.isBrowser()).toBe(false);
    expect(platform.getPlatform()).toBe("tauri");
  });

  it("identifies capacitor environment when Capacitor.isNativePlatform returns true", () => {
    vi.mocked(tauriCore.isTauri).mockReturnValue(false);
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(Capacitor.getPlatform).mockReturnValue("android");

    expect(platform.isTauri()).toBe(false);
    expect(platform.isCapacitor()).toBe(true);
    expect(platform.isAndroid()).toBe(true);
    expect(platform.isBrowser()).toBe(false);
    expect(platform.getPlatform()).toBe("capacitor");
  });

  it("identifies browser environment when neither is active", () => {
    vi.mocked(tauriCore.isTauri).mockReturnValue(false);
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    vi.mocked(Capacitor.getPlatform).mockReturnValue("web");

    expect(platform.isTauri()).toBe(false);
    expect(platform.isCapacitor()).toBe(false);
    expect(platform.isBrowser()).toBe(true);
    expect(platform.getPlatform()).toBe("browser");
  });

  it("safely handles error and defaults to browser", () => {
    vi.mocked(tauriCore.isTauri).mockImplementation(() => {
      throw new Error("unexpected error");
    });
    vi.mocked(Capacitor.isNativePlatform).mockImplementation(() => {
      throw new Error("unexpected error");
    });

    expect(platform.isTauri()).toBe(false);
    expect(platform.isCapacitor()).toBe(false);
    expect(platform.isBrowser()).toBe(true);
    expect(platform.getPlatform()).toBe("browser");
  });
});
