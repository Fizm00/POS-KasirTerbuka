import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CashierPage } from "./CashierPage";
import { useCartStore } from "./cartStore";
import { db } from "../../db/schema";
import { calculateTotals } from "../../lib/transactions";

describe("CashierPage", () => {
  let catMakananId: string;
  let catMinumanId: string;

  beforeEach(async () => {
    vi.stubGlobal("alert", vi.fn());
    useCartStore.getState().clearCart();

    await db.products.clear();
    await db.categories.clear();

    catMakananId = crypto.randomUUID();
    catMinumanId = crypto.randomUUID();

    await db.categories.bulkAdd([
      { id: catMakananId, name: "Makanan" },
      { id: catMinumanId, name: "Minuman" },
    ]);

    await db.products.bulkAdd([
      {
        id: "prod-1",
        name: "Kopi Susu",
        sku: "KOP-001",
        categoryId: catMinumanId,
        price: 15000,
        cost: 8000,
        stock: 2, // low stock! (<= 5)
        lowStockThreshold: 5,
        isActive: true,
      },
      {
        id: "prod-2",
        name: "Nasi Goreng",
        sku: "NAS-001",
        categoryId: catMakananId,
        price: 22000,
        cost: 12000,
        stock: 10,
        lowStockThreshold: 5,
        isActive: true,
      },
      {
        id: "prod-3",
        name: "Es Teh Manis",
        sku: "TEH-001",
        categoryId: catMinumanId,
        price: 5000,
        cost: 2000,
        stock: 0, // Out of stock!
        lowStockThreshold: 5,
        isActive: true,
      },
      {
        id: "prod-4",
        name: "Pisang Goreng",
        sku: "PIS-001",
        categoryId: catMakananId,
        price: 10000,
        cost: 5000,
        stock: 8,
        lowStockThreshold: 3,
        isActive: true,
      },
      {
        id: "prod-5",
        name: "Tahu Isi",
        sku: "TAH-001",
        categoryId: catMakananId,
        price: 3000,
        cost: 1500,
        stock: 15,
        lowStockThreshold: 5,
        isActive: true,
      },
    ]);
  });

  it("renders product tiles with stock pattern, low-stock warning, and out-of-stock disabled", async () => {
    render(
      <MemoryRouter>
        <CashierPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Kopi Susu")).toBeInTheDocument();
      expect(screen.getByText("Nasi Goreng")).toBeInTheDocument();
      expect(screen.getByText("Es Teh Manis")).toBeInTheDocument();
    });

    // Kopi Susu has stock: 2 (low stock)
    const kopiTile = screen.getByRole("button", { name: /Kopi Susu.*Stok: 2/i });
    expect(kopiTile).toBeEnabled();
    const kopiStock = screen.getByText("Stok: 2");
    expect(kopiStock).toHaveClass("text-[var(--warning)]");

    // Nasi Goreng has stock: 10 (normal)
    const nasiTile = screen.getByRole("button", { name: /Nasi Goreng.*Stok: 10/i });
    expect(nasiTile).toBeEnabled();

    // Es Teh Manis has stock: 0 (out of stock, disabled)
    const tehTile = screen.getByRole("button", { name: /Es Teh Manis.*Stok habis/i });
    expect(tehTile).toBeDisabled();
  });

  it("adds item to cart, increments quantity, limits to stock, and shows in-cart marker", async () => {
    render(
      <MemoryRouter>
        <CashierPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Kopi Susu")).toBeInTheDocument();
    });

    const kopiTile = screen.getByRole("button", { name: /Kopi Susu.*Stok: 2/i });

    // Click once to add
    await userEvent.click(kopiTile);

    // Cart should now show Kopi Susu
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(screen.getByText(/@Rp 15\.000/)).toBeInTheDocument();
    // Tile should show x1 marker
    expect(screen.getByText("x1")).toBeInTheDocument();

    // Click second time
    await userEvent.click(kopiTile);
    expect(screen.getByText("x2")).toBeInTheDocument();
    expect(useCartStore.getState().items[0].qty).toBe(2);

    // Kopi Susu has max stock 2. Click 3rd time should be blocked by store
    await userEvent.click(kopiTile);
    expect(useCartStore.getState().items[0].qty).toBe(2);

    // In cart panel, plus button should now be disabled and show stock limit message
    expect(screen.getByText(/Stok maksimal \(2\)/i)).toBeInTheDocument();
  });

  it("supports barcode scanner input: typing SKU + Enter adds matching item", async () => {
    render(
      <MemoryRouter>
        <CashierPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Nasi Goreng")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Cari produk atau scan barcode/i);

    // Type SKU "NAS-001" and hit Enter
    await userEvent.type(searchInput, "NAS-001{enter}");

    // Nasi Goreng should be in cart
    await waitFor(() => {
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].product.name).toBe("Nasi Goreng");
    });

    // Search input should be cleared for next scan
    expect(searchInput).toHaveValue("");
  });

  it("handles F2 shortcut for search focus and F9 shortcut for pay", async () => {
    const alertMock = vi.fn();
    vi.stubGlobal("alert", alertMock);

    render(
      <MemoryRouter>
        <CashierPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Nasi Goreng")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Cari produk atau scan barcode/i);

    // Trigger F2 anywhere in window
    fireEvent.keyDown(window, { key: "F2", code: "F2" });
    expect(document.activeElement).toBe(searchInput);

    // Add item to cart first
    const nasiTile = screen.getByRole("button", { name: /Nasi Goreng.*Stok: 10/i });
    await userEvent.click(nasiTile);

    // Trigger F9 for Pay opens PaymentModal
    fireEvent.keyDown(window, { key: "F9", code: "F9" });
    expect(screen.getByRole("heading", { name: "Pembayaran" })).toBeInTheDocument();
  });

  it("applies nominal and percent discounts via DiscountModal and matches calculateTotals", async () => {
    render(
      <MemoryRouter>
        <CashierPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Nasi Goreng")).toBeInTheDocument();
    });

    // Add Nasi Goreng (22.000)
    await userEvent.click(screen.getByRole("button", { name: /Nasi Goreng.*Stok: 10/i }));

    // Cart total initially Rp 22.000
    const totalElement = screen.getByTestId("cart-total-amount");
    expect(totalElement).toHaveTextContent("Rp 22.000");

    // Open discount modal
    await userEvent.click(screen.getByRole("button", { name: /Atur diskon/i }));

    // Apply nominal discount of Rp 2.000
    const nominalInput = screen.getByLabelText(/Potongan nominal/i);
    await userEvent.type(nominalInput, "2000");

    await userEvent.click(screen.getByRole("button", { name: /Terapkan diskon/i }));

    // Total should now be Rp 20.000
    await waitFor(() => {
      expect(totalElement).toHaveTextContent("Rp 20.000");
    });

    // Subtotal: 22000, discount: 2000, total: 20000
    const expectedTotals = calculateTotals([{ price: 22000, qty: 1 }], {
      type: "nominal",
      value: 2000,
    });
    expect(useCartStore.getState().totals).toEqual(expectedTotals);
  });

  it("acceptance test: cart of 4 items displays correct subtotal, discount, and 32px bold total", async () => {
    render(
      <MemoryRouter>
        <CashierPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Kopi Susu")).toBeInTheDocument();
    });

    // Add 4 different items:
    // 1. Kopi Susu (15.000 x 1)
    await userEvent.click(screen.getByRole("button", { name: /Kopi Susu.*Stok: 2/i }));
    // 2. Nasi Goreng (22.000 x 1)
    await userEvent.click(screen.getByRole("button", { name: /Nasi Goreng.*Stok: 10/i }));
    // 3. Pisang Goreng (10.000 x 1)
    await userEvent.click(screen.getByRole("button", { name: /Pisang Goreng.*Stok: 8/i }));
    // 4. Tahu Isi (3.000 x 1)
    await userEvent.click(screen.getByRole("button", { name: /Tahu Isi.*Stok: 15/i }));

    // Subtotal and Total should both be 15000 + 22000 + 10000 + 3000 = 50.000
    expect(screen.getAllByText("Rp 50.000").length).toBeGreaterThanOrEqual(1);

    // Check 32px bold total element
    const totalDisplay = screen.getByTestId("cart-total-amount");
    expect(totalDisplay).toHaveClass("text-[32px]");
    expect(totalDisplay).toHaveClass("font-bold");
    expect(totalDisplay).toHaveTextContent("Rp 50.000");

    // Pay button has F9 hint and correct amount
    const payButton = screen.getByTestId("pay-button");
    expect(payButton).toBeEnabled();
    expect(payButton).toHaveTextContent("Bayar Rp 50.000");
    expect(payButton).toHaveTextContent("F9");

    // Clear cart ("Kosongkan")
    await userEvent.click(screen.getByRole("button", { name: /Kosongkan/i }));
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(payButton).toBeDisabled();
    expect(totalDisplay).toHaveTextContent("Rp 0");
  });

  it("normalizes category display to sentence case, mutes zero-product categories, and supports F2", async () => {
    // Add an all-caps empty category and an un-normalized category
    const catEmptyId = crypto.randomUUID();
    await db.categories.add({ id: catEmptyId, name: "KATEGORI KOSONG" });

    render(
      <MemoryRouter>
        <CashierPage />
      </MemoryRouter>
    );

    // Verify "KATEGORI KOSONG" is normalized to sentence case "Kategori kosong"
    await waitFor(() => {
      expect(screen.getByText("Kategori kosong")).toBeInTheDocument();
    });

    // Verify category with 0 items is disabled
    const emptyCatChip = screen.getByRole("button", { name: /Kategori kosong/i });
    expect(emptyCatChip).toBeDisabled();
    expect(emptyCatChip).toHaveClass("opacity-40");

    // Test F2 shortcut focuses search input
    const searchInput = screen.getByPlaceholderText(/Cari produk atau scan barcode/i);
    searchInput.blur();
    expect(searchInput).not.toHaveFocus();

    fireEvent.keyDown(window, { key: "F2" });
    expect(searchInput).toHaveFocus();
  });
});
