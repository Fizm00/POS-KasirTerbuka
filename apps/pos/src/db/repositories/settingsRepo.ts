import { db, PosDatabase, type StoreSettings } from "../schema";
import { DEFAULT_FEATURES, useSettingsStore } from "../../lib/features";

const DEFAULT_SETTINGS_ID = "default";

export const defaultSettings: StoreSettings = {
  id: DEFAULT_SETTINGS_ID,
  storeName: "Toko Berkah",
  address: "",
  phone: "",
  receiptFooter: "Terima kasih, sampai jumpa lagi!",
  paperWidth: 58,
  currency: "IDR",
  autoLockMinutes: 5,
  businessType: "custom",
  productView: "compact",
  features: { ...DEFAULT_FEATURES },
};

export const settingsRepo = {
  async getSettings(database: PosDatabase = db): Promise<StoreSettings> {
    const existing = await database.settings.get(DEFAULT_SETTINGS_ID);
    if (!existing) {
      await database.settings.put(defaultSettings);
      useSettingsStore.getState().setSettings(defaultSettings);
      return defaultSettings;
    }
    useSettingsStore.getState().setSettings(existing);
    return existing;
  },

  async updateSettings(
    updates: Partial<Omit<StoreSettings, "id">>,
    database: PosDatabase = db
  ): Promise<StoreSettings> {
    const current = await this.getSettings(database);
    const updated: StoreSettings = {
      ...current,
      ...updates,
      id: DEFAULT_SETTINGS_ID,
    };
    await database.settings.put(updated);
    useSettingsStore.getState().setSettings(updated);
    return updated;
  },
};
