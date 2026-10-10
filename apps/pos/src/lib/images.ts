export interface ProcessedImage {
  blob: Blob;
  mime: "image/webp" | "image/jpeg";
  width: number;
  height: number;
}

export const MAX_IMAGE_DIMENSION = 480;
export const TARGET_MAX_BYTE_SIZE = 40 * 1024; // 40 KB
export const MAX_INPUT_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

/**
 * Checks whether the environment supports WebP canvas encoding.
 */
export function isWebPSupported(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

/**
 * Calculates resized dimensions preserving aspect ratio with longest side <= 480px.
 */
export function calculateTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension = MAX_IMAGE_DIMENSION
): { width: number; height: number } {
  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: originalWidth, height: originalHeight };
  }

  if (originalWidth >= originalHeight) {
    const targetWidth = maxDimension;
    const targetHeight = Math.max(1, Math.round((originalHeight * maxDimension) / originalWidth));
    return { width: targetWidth, height: targetHeight };
  } else {
    const targetHeight = maxDimension;
    const targetWidth = Math.max(1, Math.round((originalWidth * maxDimension) / originalHeight));
    return { width: targetWidth, height: targetHeight };
  }
}

/**
 * Converts canvas to Blob with specified mime type and quality.
 */
function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Gagal membuat blob dari canvas."));
        }
      },
      mime,
      quality
    );
  });
}

/**
 * Loads an image from a Blob into an HTMLImageElement safely.
 */
function loadImageElement(blob: Blob): Promise<{ img: HTMLImageElement; cleanup: () => void }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      resolve({
        img,
        cleanup: () => URL.revokeObjectURL(url),
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Format berkas gambar tidak valid atau rusak."));
    };

    img.src = url;
  });
}

/**
 * Validates, resizes to max 480px on longest side, strips EXIF metadata,
 * encodes to WebP (fallback JPEG), and quality-steps near 40KB target.
 */
export async function processProductImage(fileOrBlob: Blob | File): Promise<ProcessedImage> {
  if (fileOrBlob.size > MAX_INPUT_FILE_SIZE) {
    throw new Error("Ukuran berkas gambar terlalu besar (maksimal 10 MB).");
  }

  if (fileOrBlob.type && !ALLOWED_MIME_TYPES.has(fileOrBlob.type.toLowerCase())) {
    throw new Error("Format gambar tidak didukung. Gunakan WebP, PNG, atau JPEG.");
  }

  const { img, cleanup } = await loadImageElement(fileOrBlob);

  try {
    const origWidth = img.naturalWidth || img.width;
    const origHeight = img.naturalHeight || img.height;

    if (!origWidth || !origHeight) {
      throw new Error("Dimensi gambar tidak valid.");
    }

    const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
      origWidth,
      origHeight,
      MAX_IMAGE_DIMENSION
    );

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Gagal menginisialisasi canvas 2D context.");
    }

    const mime: "image/webp" | "image/jpeg" = isWebPSupported() ? "image/webp" : "image/jpeg";

    if (mime === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    // Drawing strips camera/EXIF metadata
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Quality stepping to cap near 40 KB
    const qualitySteps = [0.82, 0.72, 0.62, 0.52, 0.42];
    let bestBlob: Blob | null = null;

    for (const quality of qualitySteps) {
      const blob = await canvasToBlob(canvas, mime, quality);
      bestBlob = blob;
      if (blob.size <= TARGET_MAX_BYTE_SIZE) {
        break;
      }
    }

    if (!bestBlob) {
      throw new Error("Gagal memproses kompresi gambar.");
    }

    return {
      blob: bestBlob,
      mime,
      width: targetWidth,
      height: targetHeight,
    };
  } finally {
    cleanup();
  }
}

// ---------------------------------------------------------------------------
// Object URL Memory Leak Guard & Registry
// ---------------------------------------------------------------------------

const activeObjectUrls = new Map<string, string>();

/**
 * Creates and tracks an object URL for a given ID, revoking previous URL if exists.
 */
export function createTrackedObjectUrl(id: string, blob: Blob): string {
  if (activeObjectUrls.has(id)) {
    const oldUrl = activeObjectUrls.get(id);
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
    }
    activeObjectUrls.delete(id);
  }

  const url = URL.createObjectURL(blob);
  activeObjectUrls.set(id, url);
  return url;
}

/**
 * Revokes a tracked object URL for a given ID.
 */
export function revokeTrackedObjectUrl(id: string): void {
  const url = activeObjectUrls.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    activeObjectUrls.delete(id);
  }
}

/**
 * Revokes all currently active tracked object URLs.
 */
export function revokeAllTrackedObjectUrls(): void {
  for (const url of activeObjectUrls.values()) {
    URL.revokeObjectURL(url);
  }
  activeObjectUrls.clear();
}

/**
 * Returns the count of active tracked object URLs (for leak testing and diagnosis).
 */
export function getActiveObjectUrlCount(): number {
  return activeObjectUrls.size;
}

/**
 * Checks if a specific ID has an active object URL tracked.
 */
export function hasActiveObjectUrl(id: string): boolean {
  return activeObjectUrls.has(id);
}
