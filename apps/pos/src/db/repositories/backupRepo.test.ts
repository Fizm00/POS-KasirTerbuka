import { beforeEach, describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { PosDatabase } from "../schema";
import { backupRepo, InvalidBackupFileError } from "./backupRepo";
import { seedDatabase } from "./seed";

describe("backupRepo (v1 and v2)", () => {
  let sourceDb: PosDatabase;
  let targetDb: PosDatabase;

  beforeEach(async () => {
    sourceDb = new PosDatabase(`test-backup-src-${crypto.randomUUID()}`);
    targetDb = new PosDatabase(`test-backup-tgt-${crypto.randomUUID()}`);
    await seedDatabase(sourceDb);
  });

  describe("Backup v1 (JSON backward compatibility)", () => {
    it("exports and imports v1 backup round-trip identically", async () => {
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

      expect(await targetDb.products.count()).toBe(originalProductCount);
    });

    it("rejects malformed schema without touching database", async () => {
      await seedDatabase(targetDb);
      const originalProductCount = await targetDb.products.count();

      const badPayload = {
        version: 99,
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

      expect(await targetDb.products.count()).toBe(originalProductCount);
    });
  });

  describe("Backup v2 (ZIP archive with product images)", () => {
    it("exports v2 ZIP with data.json (formatVersion: 2) and images/<productId>.<ext>", async () => {
      // Add product images to sourceDb
      const products = await sourceDb.products.toArray();
      const product1 = products[0];
      const product2 = products[1];

      const imageBlob1 = new Blob([new Uint8Array([1, 2, 3, 4, 5])], {
        type: "image/webp",
      });
      const imageBlob2 = new Blob([new Uint8Array([10, 20, 30])], {
        type: "image/jpeg",
      });

      await sourceDb.productImages.add({
        id: "img-1",
        productId: product1.id,
        blob: imageBlob1,
        mime: "image/webp",
        width: 480,
        height: 360,
        createdAt: new Date().toISOString(),
      });

      await sourceDb.productImages.add({
        id: "img-2",
        productId: product2.id,
        blob: imageBlob2,
        mime: "image/jpeg",
        width: 480,
        height: 480,
        createdAt: new Date().toISOString(),
      });

      // Export v2 ZIP
      const { blob, uint8Array, fileName, imageCount } = await backupRepo.exportV2Zip(sourceDb);

      expect(fileName).toMatch(/^cadangan-kasir-terbuka-\d{8}\.zip$/);
      expect(blob.type).toBe("application/zip");
      expect(imageCount).toBe(2);

      // Verify unzipped contents
      const unzipped = unzipSync(uint8Array);
      expect(unzipped["data.json"]).toBeDefined();
      expect(unzipped[`images/${product1.id}.webp`]).toBeDefined();
      expect(unzipped[`images/${product2.id}.jpg`]).toBeDefined();

      const dataJson = JSON.parse(strFromU8(unzipped["data.json"]));
      expect(dataJson.formatVersion).toBe(2);
      expect(dataJson.appName).toBe("Kasir Terbuka");
      expect(dataJson.data.products.length).toBe(products.length);
    });

    it("round-trip export and import v2 ZIP restores both database tables and image blobs", async () => {
      const products = await sourceDb.products.toArray();
      const product = products[0];
      const rawImageBytes = new Uint8Array([42, 43, 44, 45, 46]);
      const imageBlob = new Blob([rawImageBytes], { type: "image/webp" });

      await sourceDb.productImages.add({
        id: "img-test",
        productId: product.id,
        blob: imageBlob,
        mime: "image/webp",
        width: 480,
        height: 480,
        createdAt: new Date().toISOString(),
      });

      // Export from sourceDb
      const { uint8Array } = await backupRepo.exportV2Zip(sourceDb);

      // Validate ZIP before import
      const validated = await backupRepo.validateBackup(uint8Array);
      expect(validated.formatVersion).toBe(2);
      expect(validated.images.length).toBe(1);
      expect(validated.images[0].productId).toBe(product.id);

      const summary = backupRepo.getBackupSummary(validated);
      expect(summary.formatVersion).toBe(2);
      expect(summary.imageCount).toBe(1);
      expect(summary.productCount).toBe(products.length);

      // Import into fresh target DB
      await backupRepo.importAll(uint8Array, targetDb);

      // Verify tables
      expect(await targetDb.products.count()).toBe(products.length);

      // Verify product image restored
      const restoredImages = await targetDb.productImages.toArray();
      expect(restoredImages.length).toBe(1);
      expect(restoredImages[0].productId).toBe(product.id);
      expect(restoredImages[0].mime).toBe("image/webp");

      // Verify byte content
      const restoredBuffer = await restoredImages[0].blob.arrayBuffer();
      expect(new Uint8Array(restoredBuffer)).toEqual(rawImageBytes);
    });

    it("round-trip export and import v2 ZIP restores stockMovements table atomically", async () => {
      const products = await sourceDb.products.toArray();
      const product = products[0];

      await sourceDb.stockMovements.add({
        id: "sm-test-v2",
        productId: product.id,
        type: "in",
        qty: 50,
        resultingStock: 100,
        note: "Stok awal migrasi",
        userId: "usr-admin-1",
        createdAt: new Date().toISOString(),
      });

      // Export from sourceDb
      const { uint8Array } = await backupRepo.exportV2Zip(sourceDb);

      // Import into targetDb
      await backupRepo.importAll(uint8Array, targetDb);

      const targetMovements = await targetDb.stockMovements.toArray();
      expect(targetMovements).toHaveLength(1);
      expect(targetMovements[0].id).toBe("sm-test-v2");
      expect(targetMovements[0].qty).toBe(50);
      expect(targetMovements[0].resultingStock).toBe(100);
      expect(targetMovements[0].note).toBe("Stok awal migrasi");
    });

    it("rejects corrupted ZIP without modifying existing database", async () => {
      await seedDatabase(targetDb);
      const originalProductCount = await targetDb.products.count();

      // Fake ZIP bytes (starts with PK but corrupted body)
      const corruptedZip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);

      await expect(backupRepo.importAll(corruptedZip, targetDb)).rejects.toThrow(
        InvalidBackupFileError
      );

      // Target DB unchanged
      expect(await targetDb.products.count()).toBe(originalProductCount);
    });
  });
});
