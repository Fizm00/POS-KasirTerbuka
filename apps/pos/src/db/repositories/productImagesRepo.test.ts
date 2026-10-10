import { beforeEach, describe, expect, it, vi } from "vitest";
import { PosDatabase } from "../schema";
import { productImagesRepo } from "./productImagesRepo";
import { productsRepo } from "./productsRepo";
import {
  getActiveObjectUrlCount,
  hasActiveObjectUrl,
  revokeAllTrackedObjectUrls,
} from "../../lib/images";

describe("productImagesRepo & Product Image Lifecycle", () => {
  let testDb: PosDatabase;

  beforeEach(async () => {
    revokeAllTrackedObjectUrls();
    testDb = new PosDatabase(`test-images-db-${crypto.randomUUID()}`);

    // Mock HTMLCanvasElement and Image loading for JSDOM
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D);

    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
      this: HTMLCanvasElement,
      callback,
      mime
    ) {
      const fakeBlob = new Blob([new Uint8Array(25000)], {
        type: mime || "image/webp",
      });
      callback(fakeBlob);
    });

    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/webp;base64,mock"
    );

    Object.defineProperty(Image.prototype, "naturalWidth", {
      get() {
        return 640;
      },
      configurable: true,
    });
    Object.defineProperty(Image.prototype, "naturalHeight", {
      get() {
        return 480;
      },
      configurable: true,
    });
    Object.defineProperty(Image.prototype, "src", {
      set(this: HTMLImageElement) {
        setTimeout(() => {
          this.onload?.(new Event("load"));
        }, 0);
      },
      configurable: true,
    });
  });

  it("stores and retrieves a product image blob with correct metadata", async () => {
    const rawBlob = new Blob([new Uint8Array(5000)], { type: "image/png" });
    const saved = await productImagesRepo.setProductImage("prod-123", rawBlob, testDb);

    expect(saved.id).toBeDefined();
    expect(saved.productId).toBe("prod-123");
    expect(saved.mime).toBe("image/webp");
    expect(saved.width).toBe(480);
    expect(saved.height).toBe(360);
    expect(saved.blob.size).toBe(25000);

    const retrieved = await productImagesRepo.getProductImage("prod-123", testDb);
    expect(retrieved).toBeDefined();
    expect(retrieved?.productId).toBe("prod-123");
    expect(retrieved?.mime).toBe("image/webp");
  });

  it("manages object URL generation and prevents memory leaks upon removal", async () => {
    const rawBlob = new Blob([new Uint8Array(5000)], { type: "image/jpeg" });
    await productImagesRepo.setProductImage("prod-abc", rawBlob, testDb);

    expect(getActiveObjectUrlCount()).toBe(0);

    // Request URL
    const url = await productImagesRepo.getProductImageUrl("prod-abc", testDb);
    expect(url).toBeDefined();
    expect(getActiveObjectUrlCount()).toBe(1);
    expect(hasActiveObjectUrl("prod-abc")).toBe(true);

    // Remove image -> object URL revoked
    await productImagesRepo.removeProductImage("prod-abc", testDb);
    expect(getActiveObjectUrlCount()).toBe(0);
    expect(hasActiveObjectUrl("prod-abc")).toBe(false);

    const afterDelete = await productImagesRepo.getProductImageUrl("prod-abc", testDb);
    expect(afterDelete).toBeNull();
  });

  it("batches thumbnails loading for multiple products", async () => {
    const blobA = new Blob([new Uint8Array(3000)], { type: "image/webp" });
    const blobB = new Blob([new Uint8Array(4000)], { type: "image/webp" });

    await productImagesRepo.setProductImage("prod-a", blobA, testDb);
    await productImagesRepo.setProductImage("prod-b", blobB, testDb);

    const thumbnails = await productImagesRepo.listThumbnails(
      ["prod-a", "prod-b", "prod-nonexistent"],
      testDb
    );

    expect(thumbnails["prod-a"]).toBeDefined();
    expect(thumbnails["prod-b"]).toBeDefined();
    expect(thumbnails["prod-nonexistent"]).toBeUndefined();
    expect(getActiveObjectUrlCount()).toBe(2);
  });

  it("replaces existing image and revokes old object URL when setting new image", async () => {
    const blob1 = new Blob([new Uint8Array(3000)], { type: "image/webp" });
    const blob2 = new Blob([new Uint8Array(4000)], { type: "image/webp" });

    await productImagesRepo.setProductImage("prod-1", blob1, testDb);
    const url1 = await productImagesRepo.getProductImageUrl("prod-1", testDb);
    expect(url1).toBeDefined();
    expect(getActiveObjectUrlCount()).toBe(1);

    // Overwrite with second image
    await productImagesRepo.setProductImage("prod-1", blob2, testDb);
    // Old URL was revoked during replacement
    expect(getActiveObjectUrlCount()).toBe(0);

    const url2 = await productImagesRepo.getProductImageUrl("prod-1", testDb);
    expect(url2).toBeDefined();
    expect(url2).not.toBe(url1);
    expect(getActiveObjectUrlCount()).toBe(1);
  });

  it("deleting a product permanently deletes its image, but deactivating preserves it", async () => {
    // Create product
    const product = await productsRepo.create(
      {
        name: "Kopi Susu",
        sku: "KOP-01",
        categoryId: "cat-1",
        price: 18000,
        cost: 10000,
        stock: 50,
        lowStockThreshold: 10,
        isActive: true,
      },
      testDb
    );

    const rawBlob = new Blob([new Uint8Array(5000)], { type: "image/webp" });
    await productImagesRepo.setProductImage(product.id, rawBlob, testDb);

    // Verify image exists
    expect(await productImagesRepo.getProductImage(product.id, testDb)).toBeDefined();

    // 1. Deactivate product -> Image MUST BE KEPT
    await productsRepo.update(product.id, { isActive: false }, testDb);
    const deactivatedImage = await productImagesRepo.getProductImage(product.id, testDb);
    expect(deactivatedImage).toBeDefined();
    expect(deactivatedImage?.productId).toBe(product.id);

    // 2. Delete product -> Image MUST BE REMOVED permanently
    await productsRepo.delete(product.id, testDb);
    const deletedImage = await productImagesRepo.getProductImage(product.id, testDb);
    expect(deletedImage).toBeUndefined();
  });
});
