import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VirtualizedProductGrid } from "./VirtualizedProductGrid";
import type { Category, Product } from "../../db/schema";

const mockCategory: Category = {
  id: "cat-1",
  name: "Minuman",
};

describe("VirtualizedProductGrid", () => {
  it("renders non-virtualized grid directly when items <= 200", () => {
    const products: Product[] = Array.from({ length: 10 }).map((_, i) => ({
      id: `p-${i}`,
      name: `Produk ${i}`,
      sku: `SKU-${i}`,
      categoryId: "cat-1",
      price: 10000 + i * 1000,
      cost: 5000,
      stock: 10,
      lowStockThreshold: 3,
      isActive: true,
    }));

    render(
      <VirtualizedProductGrid
        products={products}
        categories={[mockCategory]}
        thumbnails={{}}
        viewMode="compact"
        getItemQty={() => 0}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText("Produk 0")).toBeInTheDocument();
    expect(screen.getByText("Produk 9")).toBeInTheDocument();
  });

  it("virtualizes rendering when items > 200 items", () => {
    const products: Product[] = Array.from({ length: 300 }).map((_, i) => ({
      id: `p-${i}`,
      name: `Produk ${i}`,
      sku: `SKU-${i}`,
      categoryId: "cat-1",
      price: 10000,
      cost: 5000,
      stock: 10,
      lowStockThreshold: 3,
      isActive: true,
    }));

    render(
      <VirtualizedProductGrid
        products={products}
        categories={[mockCategory]}
        thumbnails={{}}
        viewMode="compact"
        getItemQty={() => 0}
        onSelect={vi.fn()}
      />
    );

    // Initial windowed view renders first few items but NOT all 300 DOM elements
    expect(screen.getByText("Produk 0")).toBeInTheDocument();
    expect(screen.queryByText("Produk 299")).not.toBeInTheDocument();
  });
});
