import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateTargetDimensions,
  createTrackedObjectUrl,
  getActiveObjectUrlCount,
  hasActiveObjectUrl,
  isWebPSupported,
  MAX_IMAGE_DIMENSION,
  processProductImage,
  revokeAllTrackedObjectUrls,
  revokeTrackedObjectUrl,
} from "./images";

describe("Image Processing & Memory Guard Pipeline", () => {
  beforeEach(() => {
    revokeAllTrackedObjectUrls();
    vi.restoreAllMocks();
  });

  describe("calculateTargetDimensions", () => {
    it("keeps dimensions untouched if both sides are <= 480px", () => {
      const result = calculateTargetDimensions(300, 200, 480);
      expect(result).toEqual({ width: 300, height: 200 });

      const squareResult = calculateTargetDimensions(480, 480, 480);
      expect(squareResult).toEqual({ width: 480, height: 480 });
    });

    it("resizes landscape image so width is 480px and preserves ratio", () => {
      const result = calculateTargetDimensions(1920, 1080, 480);
      expect(result.width).toBe(480);
      expect(result.height).toBe(270);
    });

    it("resizes portrait image so height is 480px and preserves ratio", () => {
      const result = calculateTargetDimensions(1080, 1920, 480);
      expect(result.width).toBe(270);
      expect(result.height).toBe(480);
    });

    it("handles large square image", () => {
      const result = calculateTargetDimensions(1200, 1200, 480);
      expect(result.width).toBe(480);
      expect(result.height).toBe(480);
    });
  });

  describe("Memory Guard & Object URL Tracker", () => {
    it("tracks and counts active object URLs correctly", () => {
      expect(getActiveObjectUrlCount()).toBe(0);

      const blob1 = new Blob(["test-image-1"], { type: "image/webp" });
      const blob2 = new Blob(["test-image-2"], { type: "image/webp" });

      const url1 = createTrackedObjectUrl("prod-1", blob1);
      const url2 = createTrackedObjectUrl("prod-2", blob2);

      expect(getActiveObjectUrlCount()).toBe(2);
      expect(hasActiveObjectUrl("prod-1")).toBe(true);
      expect(hasActiveObjectUrl("prod-2")).toBe(true);
      expect(url1).toBeDefined();
      expect(url2).toBeDefined();
    });

    it("revoking a specific product URL decrements counter and removes tracking", () => {
      const blob1 = new Blob(["test-image-1"], { type: "image/webp" });
      const revokeSpy = vi.spyOn(URL, "revokeObjectURL");

      const url1 = createTrackedObjectUrl("prod-1", blob1);
      expect(getActiveObjectUrlCount()).toBe(1);

      revokeTrackedObjectUrl("prod-1");
      expect(getActiveObjectUrlCount()).toBe(0);
      expect(hasActiveObjectUrl("prod-1")).toBe(false);
      expect(revokeSpy).toHaveBeenCalledWith(url1);
    });

    it("re-requesting URL for same product ID automatically revokes the old URL", () => {
      const blob1 = new Blob(["old-image"], { type: "image/webp" });
      const blob2 = new Blob(["new-image"], { type: "image/webp" });
      const revokeSpy = vi.spyOn(URL, "revokeObjectURL");

      const oldUrl = createTrackedObjectUrl("prod-1", blob1);
      expect(getActiveObjectUrlCount()).toBe(1);

      const newUrl = createTrackedObjectUrl("prod-1", blob2);
      expect(getActiveObjectUrlCount()).toBe(1);
      expect(revokeSpy).toHaveBeenCalledWith(oldUrl);
      expect(newUrl).not.toBe(oldUrl);
    });

    it("revokeAllTrackedObjectUrls revokes all URLs and resets counter to 0", () => {
      const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
      createTrackedObjectUrl("prod-1", new Blob(["1"], { type: "image/webp" }));
      createTrackedObjectUrl("prod-2", new Blob(["2"], { type: "image/webp" }));
      createTrackedObjectUrl("prod-3", new Blob(["3"], { type: "image/webp" }));

      expect(getActiveObjectUrlCount()).toBe(3);

      revokeAllTrackedObjectUrls();
      expect(getActiveObjectUrlCount()).toBe(0);
      expect(revokeSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe("Validation & Compression Pipeline", () => {
    it("rejects files larger than 10MB", async () => {
      const largeBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], {
        type: "image/jpeg",
      });

      await expect(processProductImage(largeBlob)).rejects.toThrow(/terlalu besar/i);
    });

    it("rejects unsupported MIME types", async () => {
      const textBlob = new Blob(["hello world"], { type: "text/plain" });

      await expect(processProductImage(textBlob)).rejects.toThrow(/Format gambar tidak didukung/i);
    });

    it("resizes, strips metadata, and quality steps image near 40KB", async () => {
      // Mock Canvas and Image behavior in JSDOM
      const mockDrawImage = vi.fn();
      const mockFillRect = vi.fn();

      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
        drawImage: mockDrawImage,
        fillRect: mockFillRect,
        fillStyle: "",
      } as unknown as CanvasRenderingContext2D);

      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
        this: HTMLCanvasElement,
        callback,
        mime,
        quality
      ) {
        // Simulate 25 KB WebP blob
        const byteLength = quality && quality > 0.8 ? 50000 : 25000;
        const fakeBlob = new Blob([new Uint8Array(byteLength)], {
          type: mime || "image/webp",
        });
        callback(fakeBlob);
      });

      vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
        "data:image/webp;base64,mock"
      );

      // Mock Image loading
      const originalSrc = Object.getOwnPropertyDescriptor(Image.prototype, "src");
      const originalNaturalWidth = Object.getOwnPropertyDescriptor(Image.prototype, "naturalWidth");
      const originalNaturalHeight = Object.getOwnPropertyDescriptor(
        Image.prototype,
        "naturalHeight"
      );

      Object.defineProperty(Image.prototype, "naturalWidth", {
        get() {
          return 1200;
        },
        configurable: true,
      });
      Object.defineProperty(Image.prototype, "naturalHeight", {
        get() {
          return 900;
        },
        configurable: true,
      });
      Object.defineProperty(Image.prototype, "src", {
        set(this: HTMLImageElement) {
          setTimeout(() => {
            if (this.onload) {
              this.onload(new Event("load"));
            }
          }, 0);
        },
        configurable: true,
      });

      try {
        const testBlob = new Blob([new Uint8Array(1000)], { type: "image/png" });
        const processed = await processProductImage(testBlob);

        expect(processed.width).toBe(MAX_IMAGE_DIMENSION); // 480
        expect(processed.height).toBe(360); // 900 * 480 / 1200
        expect(processed.mime).toBe("image/webp");
        expect(processed.blob.size).toBeLessThanOrEqual(40 * 1024);
        expect(mockDrawImage).toHaveBeenCalled();
      } finally {
        if (originalSrc) {
          Object.defineProperty(Image.prototype, "src", originalSrc);
        }
        if (originalNaturalWidth) {
          Object.defineProperty(Image.prototype, "naturalWidth", originalNaturalWidth);
        }
        if (originalNaturalHeight) {
          Object.defineProperty(Image.prototype, "naturalHeight", originalNaturalHeight);
        }
      }
    });

    it("falls back to image/jpeg if WebP is not supported", async () => {
      vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
        "data:image/png;base64,fallback"
      );

      expect(isWebPSupported()).toBe(false);

      const mockDrawImage = vi.fn();
      const mockFillRect = vi.fn();

      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
        drawImage: mockDrawImage,
        fillRect: mockFillRect,
        fillStyle: "",
      } as unknown as CanvasRenderingContext2D);

      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
        this: HTMLCanvasElement,
        callback,
        mime
      ) {
        const fakeBlob = new Blob([new Uint8Array(20000)], {
          type: mime || "image/jpeg",
        });
        callback(fakeBlob);
      });

      const originalSrc = Object.getOwnPropertyDescriptor(Image.prototype, "src");
      const originalNaturalWidth = Object.getOwnPropertyDescriptor(Image.prototype, "naturalWidth");
      const originalNaturalHeight = Object.getOwnPropertyDescriptor(
        Image.prototype,
        "naturalHeight"
      );

      Object.defineProperty(Image.prototype, "naturalWidth", {
        get() {
          return 400;
        },
        configurable: true,
      });
      Object.defineProperty(Image.prototype, "naturalHeight", {
        get() {
          return 300;
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

      try {
        const testBlob = new Blob([new Uint8Array(500)], { type: "image/jpeg" });
        const processed = await processProductImage(testBlob);

        expect(processed.mime).toBe("image/jpeg");
        expect(processed.width).toBe(400);
        expect(processed.height).toBe(300);
        // Canvas filled with white background for JPEG
        expect(mockFillRect).toHaveBeenCalledWith(0, 0, 400, 300);
      } finally {
        if (originalSrc) {
          Object.defineProperty(Image.prototype, "src", originalSrc);
        }
        if (originalNaturalWidth) {
          Object.defineProperty(Image.prototype, "naturalWidth", originalNaturalWidth);
        }
        if (originalNaturalHeight) {
          Object.defineProperty(Image.prototype, "naturalHeight", originalNaturalHeight);
        }
      }
    });
  });
});
