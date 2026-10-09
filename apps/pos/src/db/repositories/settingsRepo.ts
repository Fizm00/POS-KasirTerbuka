import { db, PosDatabase, type StoreSettings } from "../schema";

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
};

export const settingsRepo = {
  async getSettings(database: PosDatabase = db): Promise<StoreSettings> {
    const existing = await database.settings.get(DEFAULT_SETTINGS_ID);
    if (!existing) {
      await database.settings.put(defaultSettings);
      return defaultSettings;
    }
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
    return updated;
  },
};
