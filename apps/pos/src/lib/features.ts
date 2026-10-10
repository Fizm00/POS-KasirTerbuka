import type {
  BusinessType,
  FeatureFlags,
  FeatureKey,
  ProductViewMode,
  StoreSettings,
} from "../db/schema";
import { create } from "zustand";

export const DEFAULT_FEATURES: FeatureFlags = {
  photos: false,
  stockIn: false,
  csvImport: false,
  shifts: false,
  expenses: false,
  holdOrders: false,
  tables: false,
  variants: false,
  receivables: false,
  tax: false,
  serviceCharge: false,
};

export interface BusinessPresetConfig {
  businessType: BusinessType;
  titleKey: string;
  descriptionKey: string;
  productView: ProductViewMode;
  features: FeatureFlags;
}

export const BUSINESS_PRESETS: Record<BusinessType, BusinessPresetConfig> = {
  retail: {
    businessType: "retail",
    titleKey: "setup.presetRetailTitle",
    descriptionKey: "setup.presetRetailDesc",
    productView: "compact",
    features: {
      ...DEFAULT_FEATURES,
      stockIn: true,
      csvImport: true,
    },
  },
  cafe: {
    businessType: "cafe",
    titleKey: "setup.presetCafeTitle",
    descriptionKey: "setup.presetCafeDesc",
    productView: "photo",
    features: {
      ...DEFAULT_FEATURES,
      photos: true,
      shifts: true,
      tables: true,
      variants: true,
      holdOrders: true,
    },
  },
  custom: {
    businessType: "custom",
    titleKey: "setup.presetCustomTitle",
    descriptionKey: "setup.presetCustomDesc",
    productView: "compact",
    features: {
      ...DEFAULT_FEATURES,
    },
  },
};

export interface FeatureDefinition {
  key: FeatureKey;
  labelKey: string;
  descriptionKey: string;
}

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    key: "photos",
    labelKey: "settings.features.photos.title",
    descriptionKey: "settings.features.photos.description",
  },
  {
    key: "stockIn",
    labelKey: "settings.features.stockIn.title",
    descriptionKey: "settings.features.stockIn.description",
  },
  {
    key: "csvImport",
    labelKey: "settings.features.csvImport.title",
    descriptionKey: "settings.features.csvImport.description",
  },
  {
    key: "shifts",
    labelKey: "settings.features.shifts.title",
    descriptionKey: "settings.features.shifts.description",
  },
  {
    key: "expenses",
    labelKey: "settings.features.expenses.title",
    descriptionKey: "settings.features.expenses.description",
  },
  {
    key: "holdOrders",
    labelKey: "settings.features.holdOrders.title",
    descriptionKey: "settings.features.holdOrders.description",
  },
  {
    key: "tables",
    labelKey: "settings.features.tables.title",
    descriptionKey: "settings.features.tables.description",
  },
  {
    key: "variants",
    labelKey: "settings.features.variants.title",
    descriptionKey: "settings.features.variants.description",
  },
  {
    key: "receivables",
    labelKey: "settings.features.receivables.title",
    descriptionKey: "settings.features.receivables.description",
  },
  {
    key: "tax",
    labelKey: "settings.features.tax.title",
    descriptionKey: "settings.features.tax.description",
  },
  {
    key: "serviceCharge",
    labelKey: "settings.features.serviceCharge.title",
    descriptionKey: "settings.features.serviceCharge.description",
  },
];

interface SettingsState {
  settings: StoreSettings | null;
  setSettings: (settings: StoreSettings) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  setSettings: (settings: StoreSettings) => set({ settings }),
}));

/**
 * Synchronous helper to check whether a feature flag is enabled.
 * Accepts optional StoreSettings, otherwise reads from current in-memory settings state.
 */
export function isFeatureEnabled(name: FeatureKey, customSettings?: StoreSettings | null): boolean {
  if (customSettings !== undefined) {
    return Boolean(customSettings?.features?.[name]);
  }
  return Boolean(useSettingsStore.getState().settings?.features?.[name]);
}

/**
 * Reactive React hook to observe whether a feature is enabled.
 */
export function useFeatureEnabled(name: FeatureKey): boolean {
  return useSettingsStore((state) => Boolean(state.settings?.features?.[name]));
}
