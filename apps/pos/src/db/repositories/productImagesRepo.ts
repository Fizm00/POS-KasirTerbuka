import { db, PosDatabase, type ProductImage } from "../schema";
import {
  createTrackedObjectUrl,
  processProductImage,
  revokeAllTrackedObjectUrls,
  revokeTrackedObjectUrl,
} from "../../lib/images";

/**
 * Product Images Repository.
 *
 * Rules:
 * - Deactivating a product (isActive = false): Image is KEPT in database so it is
 *   preserved when the product is reactivated.
 * - Deleting a product (productsRepo.delete): Image is PERMANENTLY REMOVED from
 *   productImages and its object URL is immediately revoked to prevent orphaned blobs.
 */
export const productImagesRepo = {
  /**
   * Processes, compresses, and stores an image for a product.
   * If an image already exists for this productId, it replaces it.
   */
  async setProductImage(
    productId: string,
    fileOrBlob: File | Blob,
    database: PosDatabase = db
  ): Promise<ProductImage> {
    const { blob, mime, width, height } = await processProductImage(fileOrBlob);
    const nowIso = new Date().toISOString();

    const existing = await database.productImages.where("productId").equals(productId).first();

    const record: ProductImage = {
      id: existing ? existing.id : crypto.randomUUID(),
      productId,
      blob,
      mime,
      width,
      height,
      createdAt: nowIso,
    };

    await database.productImages.put(record);

    // If an object URL was active, revoke it so subsequent requests create fresh URL
    revokeTrackedObjectUrl(productId);

    return record;
  },

  /**
   * Retrieves the raw ProductImage row from database.
   */
  async getProductImage(
    productId: string,
    database: PosDatabase = db
  ): Promise<ProductImage | undefined> {
    return database.productImages.where("productId").equals(productId).first();
  },

  /**
   * Returns a memory-managed Object URL for a product's image, or null if none.
   * Any previously created URL for this productId is revoked.
   */
  async getProductImageUrl(productId: string, database: PosDatabase = db): Promise<string | null> {
    const record = await this.getProductImage(productId, database);
    if (!record) {
      revokeTrackedObjectUrl(productId);
      return null;
    }

    return createTrackedObjectUrl(productId, record.blob);
  },

  /**
   * Removes the image for a product and revokes its Object URL.
   */
  async removeProductImage(productId: string, database: PosDatabase = db): Promise<void> {
    await database.productImages.where("productId").equals(productId).delete();
    revokeTrackedObjectUrl(productId);
  },

  /**
   * Loads thumbnails for a batch of product IDs, returning a map of productId -> Object URL.
   */
  async listThumbnails(
    productIds: string[],
    database: PosDatabase = db
  ): Promise<Record<string, string>> {
    if (productIds.length === 0) return {};

    const records = await database.productImages.where("productId").anyOf(productIds).toArray();

    const result: Record<string, string> = {};
    for (const record of records) {
      result[record.productId] = createTrackedObjectUrl(record.productId, record.blob);
    }
    return result;
  },

  /**
   * Revokes the active Object URL for a specific product ID.
   */
  revokeProductImageUrl(productId: string): void {
    revokeTrackedObjectUrl(productId);
  },

  /**
   * Revokes all active tracked Object URLs across the application.
   */
  revokeAllProductImages(): void {
    revokeAllTrackedObjectUrls();
  },
};
