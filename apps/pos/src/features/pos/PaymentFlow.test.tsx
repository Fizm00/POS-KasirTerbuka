import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CashierPage } from "./CashierPage";
import { useCartStore } from "./cartStore";
import { useAuthStore } from "../auth/authStore";
import { db } from "../../db/schema";

describe("Payment Flow", () => {
  let catMakananId: string;

  beforeEach(async () => {
    vi.stubGlobal("print", vi.fn());
    useCartStore.getState().clearCart();

    await db.products.clear();
    await db.categories.clear();
    await db.settings.clear();
    await db.transactions.clear();
    await db.counters.clear();
    await db.users.clear();

    // Log in as cashier
    useAuthStore.getState().unlock({
      id: "kasir-rina",
      name: "Rina Marlina",
      role: "kasir",
      pinHash: "hash-rina",
      isActive: true,
    });

    // Default settings
    await db.settings.put({
      id: "default",
      storeName: "Toko Berkah",
      address: "Jl. Mawar No. 12, Magelang",
      phone: "0812-3456-7890",
      receiptFooter: "Terima kasih, sampai\njumpa lagi!",
      paperWidth: 58,
      currency: "IDR",
    });

    catMakananId = crypto.randomUUID();
    await db.categories.add({ id: catMakananId, name: "Makanan" });

    await db.products.bulkAdd([
      {
        id: "prod-nasi",
        name: "Nasi Goreng Spesial",
        sku: "NAS-001",
        categoryId: catMakananId,
        price: 22000,
        cost: 12000,
        stock: 5,
        lowStockThreshold: 2,
        isActive: true,
      },
      {
        id: "prod-es",
        name: "Es Teh Manis",
        sku: "TEH-001",
        categoryId: catMakananId,
        price: 5000,
        cost: 2000,
        stock: 10,
        lowStockThreshold: 3,
        isActive: true,
      },
    ]);
  });

  it("validates insufficient cash by disabling submit button and showing error message", async () => {
    render(
      <MemoryRouter>
        <CashierPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Nasi Goreng Spesial")).toBeInTheDocument();
    });

    // Add 1x Nasi Goreng (22.000)
    await userEvent.click(screen.getByRole("button", { name: /Nasi Goreng Spesial.*Stok: 5/i }));

    // Click pay button
    await userEvent.click(screen.getByTestId("pay-button"));

    // Payment modal opens
    expect(screen.getByRole("heading", { name: "Pembayaran" })).toBeInTheDocument();

    // Clear input and enter 15.000 (less than 22.000)
    const amountInput = screen.getByLabelText(/Uang diterima/i);
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, "15000");

    // Deficit message should appear: Uang diterima kurang Rp 7.000.
    expect(screen.getByText(/Uang diterima kurang Rp 7\.000/i)).toBeInTheDocument();

    // Submit button should be disabled
    const submitBtn = screen.getByRole("button", { name: /Selesaikan transaksi/i });
    expect(submitBtn).toBeDisabled();
  });

  it("completes cash payment end-to-end, decrements stock in DB, clears cart, and displays success receipt modal", async () => {
    render(
      <MemoryRouter>
        <CashierPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Nasi Goreng Spesial")).toBeInTheDocument();
    });

    // Add 2x Nasi Goreng (22.000 x 2 = 44.000)
    const nasiTile = screen.getByRole("button", {
      name: /Nasi Goreng Spesial.*Stok: 5/i,
    });
    await userEvent.click(nasiTile);
    await userEvent.click(nasiTile);

    // Open Payment Modal
    await userEvent.click(screen.getByTestId("pay-button"));

    // Select quick amount 50.000
    const quick50k = screen.getByRole("button", { name: /^50\.000$/ });
    await userEvent.click(quick50k);

    // Change should be 50.000 - 44.000 = 6.000
    expect(screen.getByText("Rp 6.000")).toBeInTheDocument();

    // Complete transaction
    await userEvent.click(screen.getByRole("button", { name: /Selesaikan transaksi/i }));

    // Transaction Success Modal should appear
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Transaksi berhasil" })).toBeInTheDocument();
    });

    // Cart in store must be cleared
    expect(useCartStore.getState().items).toHaveLength(0);

    // Stock in database must be decremented: 5 - 2 = 3
    const updatedProduct = await db.products.get("prod-nasi");
    expect(updatedProduct?.stock).toBe(3);

    // Transaction recorded in DB
    const allTx = await db.transactions.toArray();
    expect(allTx).toHaveLength(1);
    expect(allTx[0].amountPaid).toBe(50000);
    expect(allTx[0].change).toBe(6000);
    expect(allTx[0].total).toBe(44000);

    // Receipt preview is visible and contains store name and items
    const receiptPreview = screen.getByTestId("receipt-preview");
    expect(receiptPreview).toHaveTextContent("Toko Berkah");
    expect(receiptPreview).toHaveTextContent("Nasi Goreng Spesial");
    expect(receiptPreview).toHaveTextContent("2 x 22.000");
    expect(receiptPreview).toHaveTextContent("44.000");

    // Click "Cetak struk" calls window.print
    const printBtn = screen.getByRole("button", { name: /Cetak struk/i });
    await userEvent.click(printBtn);
    expect(window.print).toHaveBeenCalled();

    // Click "Transaksi baru" closes modal
    const newTxBtn = screen.getByRole("button", { name: /Transaksi baru/i });
    await userEvent.click(newTxBtn);

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Transaksi berhasil" })).not.toBeInTheDocument();
    });
  });

  it("completes QRIS payment with amountPaid equal to total and displays note", async () => {
    render(
      <MemoryRouter>
        <CashierPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Es Teh Manis")).toBeInTheDocument();
    });

    // Add 1x Es Teh Manis (5.000)
    await userEvent.click(screen.getByRole("button", { name: /Es Teh Manis.*Stok: 10/i }));

    // Open Payment Modal
    await userEvent.click(screen.getByTestId("pay-button"));

    // Switch to QRIS
    await userEvent.click(screen.getByRole("radio", { name: "QRIS" }));

    // Verify note from DESIGN.md
    expect(
      screen.getByText(/Catat pembayaran setelah pelanggan selesai membayar/i)
    ).toBeInTheDocument();

    // Submit
    await userEvent.click(screen.getByRole("button", { name: /Selesaikan transaksi/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Transaksi berhasil" })).toBeInTheDocument();
    });

    const tx = (await db.transactions.toArray())[0];
    expect(tx.paymentMethod).toBe("qris");
    expect(tx.amountPaid).toBe(5000);
    expect(tx.change).toBe(0);
  });

  it("aborts sale if stock became insufficient before paying, leaves cart intact, and shows clear error", async () => {
    render(
      <MemoryRouter>
        <CashierPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Nasi Goreng Spesial")).toBeInTheDocument();
    });

    // Add 2 units of Nasi Goreng (stock was 5)
    const nasiTile = screen.getByRole("button", {
      name: /Nasi Goreng Spesial.*Stok: 5/i,
    });
    await userEvent.click(nasiTile);
    await userEvent.click(nasiTile);

    // Open payment modal
    await userEvent.click(screen.getByTestId("pay-button"));

    // Simulate concurrent modification: stock externally reduced to 1
    await db.products.update("prod-nasi", { stock: 1 });

    // Try completing sale
    await userEvent.click(screen.getByRole("button", { name: /Selesaikan transaksi/i }));

    // Error message naming the product must be displayed
    await waitFor(() => {
      expect(
        screen.getByText(/Stok untuk "Nasi Goreng Spesial" tidak mencukupi \(tersedia: 1\)/i)
      ).toBeInTheDocument();
    });

    // Cart must NOT be cleared!
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].qty).toBe(2);

    // Stock in database must remain untouched at 1
    const productAfter = await db.products.get("prod-nasi");
    expect(productAfter?.stock).toBe(1);

    // No transaction created in DB
    const txCount = await db.transactions.count();
    expect(txCount).toBe(0);
  });
});
