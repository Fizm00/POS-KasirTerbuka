import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ReportsPage } from "./ReportsPage";
import { db, type Product, type User } from "../../db/schema";
import { transactionsRepo } from "../../db/repositories/transactionsRepo";
import { getJakartaDateString } from "../../lib/dates";

describe("ReportsPage (Admin)", () => {
  const adminUser: User = {
    id: "admin-1",
    name: "Budi Admin",
    role: "admin",
    pinHash: "hash-admin",
    isActive: true,
  };

  const prodKopi: Product = {
    id: "prod-kopi",
    name: "Kopi Susu Gula Aren",
    sku: "KOP-001",
    categoryId: "cat-minuman",
    price: 15000,
    cost: 10000,
    stock: 100,
    lowStockThreshold: 10,
    isActive: true,
  };

  const prodNasi: Product = {
    id: "prod-nasi",
    name: "Nasi Goreng Spesial",
    sku: "NAS-001",
    categoryId: "cat-makanan",
    price: 20000,
    cost: 12000,
    stock: 50,
    lowStockThreshold: 5,
    isActive: true,
  };

  beforeEach(async () => {
    await db.products.clear();
    await db.users.clear();
    await db.transactions.clear();
    await db.counters.clear();

    await db.products.bulkAdd([prodKopi, prodNasi]);
    await db.users.add(adminUser);
  });

  it("acceptance test: displays four plain figures, excludes void, and matches manual calculations", async () => {
    // Current time today in Jakarta
    const todayStr = getJakartaDateString(new Date());
    const txTime1 = new Date(`${todayStr}T10:00:00+07:00`);
    const txTime2 = new Date(`${todayStr}T11:00:00+07:00`);
    const txTime3 = new Date(`${todayStr}T12:00:00+07:00`);

    // Sale 1: 2 Kopi Susu
    // Subtotal: 30.000, Diskon: 0, Total: 30.000
    // Laba: (15.000 - 10.000) * 2 = 10.000
    await transactionsRepo.createSale(
      {
        cashierId: "admin-1",
        items: [{ productId: prodKopi.id, qty: 2 }],
        paymentMethod: "cash",
        amountPaid: 30000,
        customDate: txTime1,
      },
      db
    );

    // Sale 2: 1 Nasi Goreng + 1 Kopi Susu
    // Subtotal: 35.000, Diskon: 5.000, Total: 30.000
    // Laba: ((20.000 - 12.000) * 1 + (15.000 - 10.000) * 1) - 5.000 = (8.000 + 5.000) - 5.000 = 8.000
    await transactionsRepo.createSale(
      {
        cashierId: "admin-1",
        items: [
          { productId: prodNasi.id, qty: 1 },
          { productId: prodKopi.id, qty: 1 },
        ],
        discount: { type: "nominal", value: 5000 },
        paymentMethod: "cash",
        amountPaid: 30000,
        customDate: txTime2,
      },
      db
    );

    // Sale 3 (VOIDED): 5 Nasi Goreng (Revenue: 100.000)
    const sale3 = await transactionsRepo.createSale(
      {
        cashierId: "admin-1",
        items: [{ productId: prodNasi.id, qty: 5 }],
        paymentMethod: "cash",
        amountPaid: 100000,
        customDate: txTime3,
      },
      db
    );

    await transactionsRepo.voidSale(
      sale3.id,
      {
        voidedBy: "Budi Admin",
        voidReason: "Uji coba pembatalan",
        userRole: "admin",
      },
      db
    );

    // Expected Manual Calculations:
    // Total Penjualan: 30.000 + 30.000 = 60.000 (Rp 60.000)
    // Jumlah Transaksi: 2 (sale 3 voided excluded!)
    // Rata-rata per Transaksi: 60.000 / 2 = 30.000 (Rp 30.000)
    // Laba Kotor: 10.000 + 8.000 = 18.000 (Rp 18.000)

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText("Rp 60.000")).toBeInTheDocument(); // Total penjualan
      const txCountCard = screen.getByText("Jumlah transaksi").closest("div")!;
      expect(within(txCountCard).getByText("2")).toBeInTheDocument(); // Jumlah transaksi
      expect(screen.getByText("Rp 30.000")).toBeInTheDocument(); // Rata-rata per transaksi
      expect(screen.getByText("Rp 18.000")).toBeInTheDocument(); // Laba kotor
    });

    // One-line note on void exclusion
    expect(
      screen.getByText("Transaksi yang dibatalkan tidak disertakan dalam laporan ini.")
    ).toBeInTheDocument();

    // Top products table:
    // Kopi Susu: 3 units sold, revenue 45.000
    // Nasi Goreng: 1 unit sold, revenue 20.000 (Sale 3's 5 units strictly excluded!)
    expect(screen.getByText("Kopi Susu Gula Aren")).toBeInTheDocument();
    expect(screen.getByText("Nasi Goreng Spesial")).toBeInTheDocument();
    expect(screen.getByText("Rp 45.000")).toBeInTheDocument();
    expect(screen.getByText("Rp 20.000")).toBeInTheDocument();
  });

  it("handles date preset switching and triggers CSV export", async () => {
    // Mock browser URL and download
    const createObjectUrlMock = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectUrlMock = vi.fn();
    window.URL.createObjectURL = createObjectUrlMock;
    window.URL.revokeObjectURL = revokeObjectUrlMock;

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    // Check presets exist
    const preset7Days = screen.getByRole("button", { name: "7 hari" });
    const presetMonth = screen.getByRole("button", { name: "Bulan ini" });
    const presetToday = screen.getByRole("button", { name: "Hari ini" });

    expect(preset7Days).toBeInTheDocument();
    expect(presetMonth).toBeInTheDocument();
    expect(presetToday).toBeInTheDocument();

    // Click 7 days preset
    await userEvent.click(preset7Days);
    expect(preset7Days).toHaveClass("bg-[var(--primary)]");

    // Click CSV Export button
    const exportBtn = screen.getByRole("button", { name: /Ekspor CSV/i });
    expect(exportBtn).toBeInTheDocument();

    await userEvent.click(exportBtn);

    await waitFor(() => {
      expect(createObjectUrlMock).toHaveBeenCalled();
    });
  });
});
