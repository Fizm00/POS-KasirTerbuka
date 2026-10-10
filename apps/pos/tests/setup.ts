import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { Blob as NodeBlob } from "node:buffer";

// Ensure Blobs are cloneable by fake-indexeddb in Node.js test environment
globalThis.Blob = NodeBlob as unknown as typeof Blob;

if (typeof window !== "undefined") {
  window.Blob = NodeBlob as unknown as typeof Blob;

  let objectUrlCounter = 0;
  const objectUrlMap = new Map<string, Blob>();

  window.URL.createObjectURL = (blob: Blob) => {
    const url = `blob:http://localhost/${++objectUrlCounter}`;
    objectUrlMap.set(url, blob);
    return url;
  };

  window.URL.revokeObjectURL = (url: string) => {
    objectUrlMap.delete(url);
  };

  if (!window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
}
