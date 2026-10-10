import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { TransactionsPage } from "./TransactionsPage";
import { useAuthStore } from "../auth/authStore";
import { db, type Product, type Transaction, type User } from "../../db/schema";
import { SaleAlreadyVoidedError, transactionsRepo } from "../../db/repositories/transactionsRepo";

describe("TransactionsPage & Void Flow", () => {
  const adminUser: User = {
    id: "user-admin",
    name: "Budi Admin",
    role: "admin",
    pinHash: "hash-admin",
    isActive: true,
  };

  const cashierUser1: User = {
    id: "user-kasir-1",
    name: "Rina Kasir",
    role: "kasir",
    pinHash: "hash-kasir-1",
    isActive: true,
  };

  const cashierUser2: User = {
    id: "user-kasir-2",
    name: "Doni Kasir",
    role: "kasir",
    pinHash: "hash-kasir-2",
    isActive: true,
  };

  const testProduct: Product = {
    id: "prod-nasi",
    name: "Nasi Goreng Spesial",
    sku: "NAS-001",
    categoryId: "cat-1",
    price: 20000,
    cost: 10000,
    stock: 5,
    lowStockThreshold: 2,
    isActive: true,
  };

  const txKasir1: Transaction = {
    id: "tx-1",
    invoiceNo: "INV-20261009-0001",
    cashierId: "user-kasir-1",
    createdAt: "2026-10-09T10:00:00.000Z",
    items: [
      {
        productId: "prod-nasi",
        name: "Nasi Goreng Spesial",
        sku: "NAS-001",
        price: 20000,
        cost: 10000,
        qty: 2,
        subtotal: 40000,
      },
    ],
    subtotal: 40000,
    discount: 0,
    total: 40000,
    paymentMethod: "cash",
    amountPaid: 50000,
    change: 10000,
    status: "completed",
  };

  const txKasir2: Transaction = {
    id: "tx-2",
    invoiceNo: "INV-20261009-0002",
    cashierId: "user-kasir-2",
    createdAt: "2026-10-09T12:00:00.000Z",
    items: [
      {
        productId: "prod-nasi",
        name: "Nasi Goreng Spesial",
        sku: "NAS-001",
        price: 20000,
        cost: 10000,
        qty: 1,
        subtotal: 20000,
      },
    ],
    subtotal: 20000,
    discount: 0,
    total: 20000,
    paymentMethod: "qris",
    amountPaid: 20000,
    change: 0,
    status: "completed",
  };

  beforeEach(async () => {
    vi.stubGlobal("print", vi.fn());

    await db.transactions.clear();
    await db.products.clear();
    await db.users.clear();
    await db.settings.clear();

    await db.users.bulkAdd([adminUser, cashierUser1, cashierUser2]);
    await db.products.add(testProduct);
    await db.transactions.bulkAdd([txKasir1, txKasir2]);
    await db.settings.put({
      id: "default",
      storeName: "Toko Berkah",
      address: "Jl. Mawar",
      phone: "0812",
      receiptFooter: "Terima kasih",
      paperWidth: 58,
      currency: "IDR",
    });
  });

  it("cashier only sees their own transactions and cashier dropdown is hidden", async () => {
    // Log in as cashier 1
    useAuthStore.getState().unlock(cashierUser1);

    render(
      <MemoryRouter>
        <TransactionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Must see INV-0001 (made by cashier 1)
      expect(screen.getByText("INV-20261009-0001")).toBeInTheDocument();
    });

    // Must NOT see INV-0002 (made by cashier 2)
    expect(screen.queryByText("INV-20261009-0002")).not.toBeInTheDocument();

    // Cashier filter dropdown must NOT be in document
    expect(screen.queryByLabelText(/Filter kasir/i)).not.toBeInTheDocument();

    // Verify repository level constraint
    const txForCashier = await transactionsRepo.getForUser(cashierUser1);
    expect(txForCashier).toHaveLength(1);
    expect(txForCashier[0].cashierId).toBe("user-kasir-1");
  });

  it("admin sees all transactions and can filter by cashier", async () => {
    // Log in as admin
    useAuthStore.getState().unlock(adminUser);

    render(
      <MemoryRouter>
        <TransactionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Both transactions must be visible
      expect(screen.getByText("INV-20261009-0001")).toBeInTheDocument();
      expect(screen.getByText("INV-20261009-0002")).toBeInTheDocument();
    });

    // Cashier filter dropdown is visible to admin
    const cashierSelect = screen.getByLabelText(/^Kasir$/i);
    expect(cashierSelect).toBeInTheDocument();

    // Select Doni Kasir (user-kasir-2)
    await userEvent.selectOptions(cashierSelect, "user-kasir-2");

    await waitFor(() => {
      expect(screen.queryByText("INV-20261009-0001")).not.toBeInTheDocument();
      expect(screen.getByText("INV-20261009-0002")).toBeInTheDocument();
    });
  });

  it("filters transactions by status", async () => {
    useAuthStore.getState().unlock(adminUser);

    // Make txKasir1 voided
    await db.transactions.update("tx-1", {
      status: "void",
      voidedBy: "Budi Admin",
      voidReason: "Uji coba",
    });

    render(
      <MemoryRouter>
        <TransactionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("INV-20261009-0001")).toBeInTheDocument();
      expect(screen.getByText("INV-20261009-0002")).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText(/^Status$/i);

    // Filter to "Dibatalkan"
    await userEvent.selectOptions(statusSelect, "void");

    await waitFor(() => {
      expect(screen.getByText("INV-20261009-0001")).toBeInTheDocument();
      expect(screen.queryByText("INV-20261009-0002")).not.toBeInTheDocument();
    });

    // Filter to "Selesai"
    await userEvent.selectOptions(statusSelect, "completed");

    await waitFor(() => {
      expect(screen.queryByText("INV-20261009-0001")).not.toBeInTheDocument();
      expect(screen.getByText("INV-20261009-0002")).toBeInTheDocument();
    });
  });

  it("admin void flow restores stock, displays Dibatalkan status, and blocks second void", async () => {
    useAuthStore.getState().unlock(adminUser);

    // Initial stock is 5
    expect((await db.products.get("prod-nasi"))?.stock).toBe(5);

    render(
      <MemoryRouter>
        <TransactionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("INV-20261009-0001")).toBeInTheDocument();
    });

    // Click on "Lihat detail" for INV-0001
    const inv1Row = screen.getByText("INV-20261009-0001").closest("tr")!;
    const viewDetailBtn = within(inv1Row).getByRole("button", {
      name: /Lihat detail/i,
    });
    await userEvent.click(viewDetailBtn);

    // Detail drawer opens
    await waitFor(() => {
      expect(screen.getByText(/Detail transaksi \(INV-20261009-0001\)/i)).toBeInTheDocument();
    });

    // Click "Batalkan transaksi" in the drawer
    const drawerDialog = screen.getByRole("dialog", { name: /Detail transaksi/i });
    const voidBtn = within(drawerDialog).getByRole("button", {
      name: /Batalkan transaksi/i,
    });
    await userEvent.click(voidBtn);

    // Confirmation modal opens with invoice name and warning
    const modalDialog = screen.getByRole("dialog", {
      name: /^Batalkan transaksi$/i,
    });
    expect(
      within(modalDialog).getByText(/Batalkan transaksi INV-20261009-0001\?/i)
    ).toBeInTheDocument();
    expect(within(modalDialog).getByText(/Stok akan dikembalikan\./i)).toBeInTheDocument();

    // Enter void reason
    const reasonInput = within(modalDialog).getByLabelText(/Alasan pembatalan/i);
    await userEvent.type(reasonInput, "Salah input pesanan pelanggan");

    // Confirm void inside modal dialog
    const confirmBtn = within(modalDialog).getByRole("button", {
      name: /^Batalkan transaksi$/,
    });
    await userEvent.click(confirmBtn);

    // Status should now be Dibatalkan in danger color
    await waitFor(() => {
      expect(screen.getAllByText("Dibatalkan").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Salah input pesanan pelanggan/i)).toBeInTheDocument();
    });

    // In database, product stock should be restored by 2: 5 + 2 = 7
    const updatedProd = await db.products.get("prod-nasi");
    expect(updatedProd?.stock).toBe(7);

    // Button to void should now be gone from the drawer
    expect(screen.queryByRole("button", { name: /Batalkan transaksi/i })).not.toBeInTheDocument();

    // Second void attempt directly via repository MUST be rejected
    await expect(
      transactionsRepo.voidSale("tx-1", {
        voidedBy: "Budi Admin",
        voidReason: "Ulangi void",
        userRole: "admin",
      })
    ).rejects.toThrow(SaleAlreadyVoidedError);
  });

  it("prevents cashier role from voiding transactions", async () => {
    // Log in as cashier
    useAuthStore.getState().unlock(cashierUser1);

    render(
      <MemoryRouter>
        <TransactionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("INV-20261009-0001")).toBeInTheDocument();
    });

    // Open detail
    const viewDetailBtn = screen.getByRole("button", { name: /Lihat detail/i });
    await userEvent.click(viewDetailBtn);

    // Detail drawer opens, but "Batalkan transaksi" button MUST NOT be present for cashier
    await waitFor(() => {
      expect(screen.getByText(/Detail transaksi \(INV-20261009-0001\)/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /Batalkan transaksi/i })).not.toBeInTheDocument();

    // Repository also rejects void by non-admin role
    await expect(
      transactionsRepo.voidSale("tx-1", {
        voidedBy: "Rina Kasir",
        userRole: "kasir",
      })
    ).rejects.toThrow(/Unauthorized: Only admins can void transactions/i);
  });

  it("displays summary line with filtered transaction count and total amount", async () => {
    useAuthStore.getState().unlock(adminUser);

    render(
      <MemoryRouter>
        <TransactionsPage />
      </MemoryRouter>
    );

    // Initial state: 2 transactions (40.000 + 20.000 = 60.000)
    await waitFor(() => {
      expect(screen.getByText(/2 transaksi · Total Rp 60\.000/i)).toBeInTheDocument();
    });

    // Filter by cashier Doni (user-kasir-2, only 1 transaction = 20.000)
    const cashierSelect = screen.getByLabelText(/^Kasir$/i);
    await userEvent.selectOptions(cashierSelect, "user-kasir-2");

    await waitFor(() => {
      expect(screen.getByText(/1 transaksi · Total Rp 20\.000/i)).toBeInTheDocument();
    });
  });

  it("sorts transactions by total when column header is clicked", async () => {
    useAuthStore.getState().unlock(adminUser);

    render(
      <MemoryRouter>
        <TransactionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("INV-20261009-0001")).toBeInTheDocument();
    });

    const sortTotalBtn = screen.getByRole("button", { name: /Urutkan Total/i });

    // Click to sort ascending (20.000 first, then 40.000)
    await userEvent.click(sortTotalBtn);

    const rowsAsc = screen.getAllByRole("row");
    // Row 1 header, Row 2 INV-0002 (20.000), Row 3 INV-0001 (40.000)
    expect(within(rowsAsc[1]).getByText("INV-20261009-0002")).toBeInTheDocument();
    expect(within(rowsAsc[2]).getByText("INV-20261009-0001")).toBeInTheDocument();

    // Click to sort descending (40.000 first, then 20.000)
    await userEvent.click(sortTotalBtn);

    const rowsDesc = screen.getAllByRole("row");
    expect(within(rowsDesc[1]).getByText("INV-20261009-0001")).toBeInTheDocument();
    expect(within(rowsDesc[2]).getByText("INV-20261009-0002")).toBeInTheDocument();
  });
});
