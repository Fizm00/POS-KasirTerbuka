import { describe, expect, it } from "vitest";
import {
  BUSINESS_PRESETS,
  DEFAULT_FEATURES,
  FEATURE_DEFINITIONS,
  isFeatureEnabled,
  useSettingsStore,
} from "./features";
import type { StoreSettings } from "../db/schema";

describe("Feature Toggles and Business Presets", () => {
  it("defines default features all set to false", () => {
    expect(DEFAULT_FEATURES.photos).toBe(false);
    expect(DEFAULT_FEATURES.stockIn).toBe(false);
    expect(DEFAULT_FEATURES.csvImport).toBe(false);
    expect(DEFAULT_FEATURES.shifts).toBe(false);
    expect(DEFAULT_FEATURES.expenses).toBe(false);
    expect(DEFAULT_FEATURES.holdOrders).toBe(false);
    expect(DEFAULT_FEATURES.tables).toBe(false);
    expect(DEFAULT_FEATURES.variants).toBe(false);
    expect(DEFAULT_FEATURES.receivables).toBe(false);
    expect(DEFAULT_FEATURES.tax).toBe(false);
    expect(DEFAULT_FEATURES.serviceCharge).toBe(false);
  });

  it("configures Retail preset with compact view, stockIn and csvImport enabled", () => {
    const retail = BUSINESS_PRESETS.retail;
    expect(retail.businessType).toBe("retail");
    expect(retail.productView).toBe("compact");
    expect(retail.features.stockIn).toBe(true);
    expect(retail.features.csvImport).toBe(true);
    // Others should be false
    expect(retail.features.photos).toBe(false);
    expect(retail.features.shifts).toBe(false);
    expect(retail.features.tables).toBe(false);
    expect(retail.features.variants).toBe(false);
    expect(retail.features.holdOrders).toBe(false);
  });

  it("configures Cafe preset with photo view, photos, shifts, tables, variants, and holdOrders enabled", () => {
    const cafe = BUSINESS_PRESETS.cafe;
    expect(cafe.businessType).toBe("cafe");
    expect(cafe.productView).toBe("photo");
    expect(cafe.features.photos).toBe(true);
    expect(cafe.features.shifts).toBe(true);
    expect(cafe.features.tables).toBe(true);
    expect(cafe.features.variants).toBe(true);
    expect(cafe.features.holdOrders).toBe(true);
    // Retail-specific should be false
    expect(cafe.features.stockIn).toBe(false);
    expect(cafe.features.csvImport).toBe(false);
  });

  it("configures Custom preset with compact view and all features false", () => {
    const custom = BUSINESS_PRESETS.custom;
    expect(custom.businessType).toBe("custom");
    expect(custom.productView).toBe("compact");
    expect(Object.values(custom.features).every((v) => v === false)).toBe(true);
  });

  it("lists all 11 modular feature definitions with label and description keys", () => {
    expect(FEATURE_DEFINITIONS).toHaveLength(11);
    const keys = FEATURE_DEFINITIONS.map((f) => f.key);
    expect(keys).toContain("photos");
    expect(keys).toContain("stockIn");
    expect(keys).toContain("csvImport");
    expect(keys).toContain("shifts");
    expect(keys).toContain("expenses");
    expect(keys).toContain("holdOrders");
    expect(keys).toContain("tables");
    expect(keys).toContain("variants");
    expect(keys).toContain("receivables");
    expect(keys).toContain("tax");
    expect(keys).toContain("serviceCharge");
  });

  it("isFeatureEnabled correctly checks features against passed settings", () => {
    const customSettings: StoreSettings = {
      id: "default",
      storeName: "Test Store",
      address: "",
      phone: "",
      receiptFooter: "",
      paperWidth: 58,
      currency: "IDR",
      features: {
        ...DEFAULT_FEATURES,
        photos: true,
        tables: true,
      },
    };

    expect(isFeatureEnabled("photos", customSettings)).toBe(true);
    expect(isFeatureEnabled("tables", customSettings)).toBe(true);
    expect(isFeatureEnabled("stockIn", customSettings)).toBe(false);
    expect(isFeatureEnabled("shifts", customSettings)).toBe(false);
  });

  it("isFeatureEnabled reads from useSettingsStore when settings argument is omitted", () => {
    useSettingsStore.getState().setSettings({
      id: "default",
      storeName: "Test Store",
      address: "",
      phone: "",
      receiptFooter: "",
      paperWidth: 58,
      currency: "IDR",
      features: {
        ...DEFAULT_FEATURES,
        shifts: true,
      },
    });

    expect(isFeatureEnabled("shifts")).toBe(true);
    expect(isFeatureEnabled("photos")).toBe(false);
  });
});
