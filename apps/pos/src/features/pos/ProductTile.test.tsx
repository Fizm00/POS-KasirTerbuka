import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductTile } from "./ProductTile";
import type { Category, Product } from "../../db/schema";

const mockCategory: Category = {
  id: "cat-1",
  name: "Minuman Kopi",
};

const mockProduct: Product = {
  id: "prod-1",
  name: "Caffe Latte",
  sku: "LAT-001",
  categoryId: "cat-1",
  price: 28000,
  cost: 15000,
  stock: 25,
  lowStockThreshold: 5,
  isActive: true,
};

describe("ProductTile", () => {
  it("renders compact mode with category bar, SKU, price, and stock", async () => {
    const onSelect = vi.fn();
    render(
      <ProductTile
        product={mockProduct}
        category={mockCategory}
        mode="compact"
        cartQty={2}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText("Caffe Latte")).toBeInTheDocument();
    expect(screen.getByText("LAT-001")).toBeInTheDocument();
    expect(screen.getByText("Rp 28.000")).toBeInTheDocument();
    expect(screen.getByText("Stok: 25")).toBeInTheDocument();
    expect(screen.getByText("x2")).toBeInTheDocument();

    const button = screen.getByRole("button");
    await userEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith(mockProduct);
  });

  it("renders photo mode with placeholder initials when no photo is provided", () => {
    const onSelect = vi.fn();
    render(
      <ProductTile
        product={mockProduct}
        category={mockCategory}
        mode="photo"
        cartQty={1}
        onSelect={onSelect}
      />
    );

    // Placeholder tile with 2-letter uppercase initials: "Caffe Latte" -> "CL"
    expect(screen.getByText("CL")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Rp 28.000")).toBeInTheDocument();
    expect(screen.getByText("Stok: 25")).toBeInTheDocument();
    expect(screen.getByText("x1")).toBeInTheDocument();
  });

  it("renders photo mode with lazy img when imageUrl is provided", () => {
    const onSelect = vi.fn();
    render(
      <ProductTile
        product={mockProduct}
        category={mockCategory}
        imageUrl="blob:http://localhost/latte.webp"
        mode="photo"
        cartQty={0}
        onSelect={onSelect}
      />
    );

    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "blob:http://localhost/latte.webp");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(screen.queryByText("CL")).not.toBeInTheDocument();
  });

  it("disables tile and displays 'Stok habis' when product stock is 0", () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    render(
      <ProductTile
        product={outOfStockProduct}
        category={mockCategory}
        mode="photo"
        onSelect={vi.fn()}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByText("Stok habis")).toBeInTheDocument();
  });

  it("shows warning color on stock text when stock is at or below threshold", () => {
    const lowStockProduct = { ...mockProduct, stock: 3, lowStockThreshold: 5 };
    render(
      <ProductTile
        product={lowStockProduct}
        category={mockCategory}
        mode="compact"
        onSelect={vi.fn()}
      />
    );

    const stockText = screen.getByText("Stok: 3");
    expect(stockText).toHaveClass("text-[var(--warning)]");
  });
});
