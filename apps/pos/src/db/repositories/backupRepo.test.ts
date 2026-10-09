import { beforeEach, describe, expect, it } from "vitest";
import { PosDatabase } from "../schema";
import { backupRepo, InvalidBackupFileError } from "./backupRepo";
import { seedDatabase } from "./seed";

describe("backupRepo", () => {
  let sourceDb: PosDatabase;
  let targetDb: PosDatabase;

  beforeEach(async () => {
    sourceDb = new PosDatabase(`test-backup-src-${crypto.randomUUID()}`);
    targetDb = new PosDatabase(`test-backup-tgt-${crypto.randomUUID()}`);
    await seedDatabase(sourceDb);
  });

  it("exports and imports backup round-trip identically", async () => {
    const exported = await backupRepo.exportAll(sourceDb);

    expect(exported.version).toBe(1);
    expect(exported.appName).toBe("Kasir Terbuka");
    expect(exported.data.products.length).toBeGreaterThan(0);
    expect(exported.data.categories.length).toBeGreaterThan(0);
    expect(exported.data.users.length).toBeGreaterThan(0);

    // Import into fresh target DB
    await backupRepo.importAll(exported, targetDb);

    // Verify target DB data matches source DB data exactly
    const targetProducts = await targetDb.products.toArray();
    const sourceProducts = await sourceDb.products.toArray();
    expect(targetProducts).toEqual(sourceProducts);

    const targetCategories = await targetDb.categories.toArray();
    const sourceCategories = await sourceDb.categories.toArray();
    expect(targetCategories).toEqual(sourceCategories);

    const targetUsers = await targetDb.users.toArray();
    const sourceUsers = await sourceDb.users.toArray();
    expect(targetUsers).toEqual(sourceUsers);

    const targetSettings = await targetDb.settings.toArray();
    const sourceSettings = await sourceDb.settings.toArray();
    expect(targetSettings).toEqual(sourceSettings);
  });

  it("supports JSON string import", async () => {
    const exported = await backupRepo.exportAll(sourceDb);
    const jsonString = JSON.stringify(exported);

    await backupRepo.importAll(jsonString, targetDb);

    const count = await targetDb.products.count();
    expect(count).toBe(await sourceDb.products.count());
  });

  it("rejects invalid JSON string without touching database", async () => {
    await seedDatabase(targetDb);
    const originalProductCount = await targetDb.products.count();

    await expect(backupRepo.importAll("invalid-json{", targetDb)).rejects.toThrow(
      InvalidBackupFileError
    );

    // Target DB must remain untouched
    expect(await targetDb.products.count()).toBe(originalProductCount);
  });

  it("rejects malformed schema without touching database", async () => {
    await seedDatabase(targetDb);
    const originalProductCount = await targetDb.products.count();

    const badPayload = {
      version: 2, // Unsupported version
      appName: "Other App",
      exportedAt: new Date().toISOString(),
      data: {
        settings: [],
        users: [],
        categories: [],
        products: [{ name: "Missing fields" }],
        transactions: [],
        counters: [],
      },
    };

    await expect(backupRepo.importAll(badPayload, targetDb)).rejects.toThrow(
      InvalidBackupFileError
    );

    // Target DB must remain untouched
    expect(await targetDb.products.count()).toBe(originalProductCount);
  });
});
