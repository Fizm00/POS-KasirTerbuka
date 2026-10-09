import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SettingsPage } from "./SettingsPage";
import { db, type Category, type Product, type Transaction, type User } from "../../db/schema";
import { settingsRepo } from "../../db/repositories/settingsRepo";
import { backupRepo, type BackupFile } from "../../db/repositories/backupRepo";
import { buildReceiptModel } from "../../printing/receipt";

describe("SettingsPage & Backup/Restore", () => {
  const adminUser: User = {
    id: "admin-1",
    name: "Budi Admin",
    role: "admin",
    pinHash: "admin-hash",
    isActive: true,
  };

  beforeEach(async () => {
    await db.settings.clear();
    await db.users.clear();
    await db.products.clear();
    await db.categories.clear();
    await db.transactions.clear();
    await db.counters.clear();

    await settingsRepo.getSettings(); // initialize default settings
    await db.users.add(adminUser);
  });

  it("persists store settings and correctly affects thermal receipt model (58mm -> 80mm)", async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    // Verify initial values loaded
    const nameInput = await screen.findByLabelText(/Nama toko/i);
    expect(nameInput).toHaveValue("Toko Berkah");

    // Change store name, address, footer, and paper width to 80mm
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Warung Nusantara");

    const addressInput = screen.getByLabelText(/Alamat/i);
    await userEvent.type(addressInput, "Jl. Malioboro No. 10");

    const footerInput = screen.getByLabelText(/Teks kaki struk/i);
    await userEvent.clear(footerInput);
    await userEvent.type(footerInput, "Matur nuwun, berkah selalu!");

    // Switch paper width to 80 mm
    const option80 = screen.getByRole("radio", { name: "80 mm" });
    await userEvent.click(option80);

    // Save
    const saveBtn = screen.getByRole("button", { name: "Simpan pengaturan toko" });
    await userEvent.click(saveBtn);

    // Verify in database
    await waitFor(async () => {
      const saved = await settingsRepo.getSettings();
      expect(saved.storeName).toBe("Warung Nusantara");
      expect(saved.address).toBe("Jl. Malioboro No. 10");
      expect(saved.receiptFooter).toBe("Matur nuwun, berkah selalu!");
      expect(saved.paperWidth).toBe(80);
    });

    // Test that the persisted settings directly affect the receipt model:
    const saved = await settingsRepo.getSettings();
    const mockTx: Transaction = {
      id: "tx-test",
      invoiceNo: "INV-20261009-0001",
      cashierId: "admin-1",
      items: [
        {
          productId: "p-1",
          name: "Soto Ayam",
          sku: "SOT-01",
          price: 20000,
          cost: 12000,
          qty: 1,
          subtotal: 20000,
        },
      ],
      subtotal: 20000,
      discount: 0,
      total: 20000,
      paymentMethod: "cash",
      amountPaid: 20000,
      change: 0,
      status: "completed",
      createdAt: "2026-10-09T03:00:00.000Z",
    };

    const receipt = buildReceiptModel({
      transaction: mockTx,
      settings: saved,
      paperWidth: saved.paperWidth,
    });

    expect(receipt.paperWidth).toBe(80);
    expect(receipt.columnWidth).toBe(48); // 80mm column width is 48 chars
    expect(receipt.rawText).toContain("Warung Nusantara");
    expect(receipt.rawText).toContain("Matur nuwun, berkah selalu!");
  });

  it("exports backup JSON, saves lastBackupAt, and triggers download", async () => {
    const createObjectUrlMock = vi.fn().mockReturnValue("blob:mock-backup-url");
    const revokeObjectUrlMock = vi.fn();
    window.URL.createObjectURL = createObjectUrlMock;
    window.URL.revokeObjectURL = revokeObjectUrlMock;

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const exportBtn = await screen.findByRole("button", {
      name: /Ekspor cadangan \(JSON\)/i,
    });

    await userEvent.click(exportBtn);

    await waitFor(async () => {
      expect(createObjectUrlMock).toHaveBeenCalled();
      const updatedSettings = await settingsRepo.getSettings();
      expect(updatedSettings.lastBackupAt).toBeDefined();
    });
  });

  it("validates backup file, displays confirmation dialog, and replaces data atomically", async () => {
    // Current data before import: 1 product
    await db.products.add({
      id: "old-prod",
      name: "Produk Lama",
      sku: "OLD-01",
      categoryId: "cat-1",
      price: 10000,
      cost: 5000,
      stock: 5,
      lowStockThreshold: 2,
      isActive: true,
    });

    // Valid backup file to import
    const validBackup: BackupFile = {
      version: 1,
      appName: "Kasir Terbuka",
      exportedAt: "2026-10-09T10:00:00.000Z",
      data: {
        settings: [
          {
            id: "default",
            storeName: "Toko Baru Pulih",
            address: "Jl. Pemulihan",
            phone: "0811",
            receiptFooter: "Terima kasih",
            paperWidth: 58,
            currency: "IDR",
          },
        ],
        users: [adminUser],
        categories: [{ id: "cat-fresh", name: "Kategori Baru" }],
        products: [
          {
            id: "fresh-prod-1",
            name: "Produk Baru Pulih",
            sku: "FRESH-01",
            categoryId: "cat-fresh",
            price: 25000,
            cost: 15000,
            stock: 20,
            lowStockThreshold: 5,
            isActive: true,
          },
        ],
        transactions: [],
        counters: [],
      },
    };

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    // Trigger file change on the hidden file input
    const fileInput = screen.getByLabelText(/Impor cadangan/i);
    const file = new File([JSON.stringify(validBackup)], "backup.json", {
      type: "application/json",
    });

    await userEvent.upload(fileInput, file);

    // Confirmation modal should open
    const modal = await screen.findByRole("dialog");
    expect(within(modal).getByText(/Impor cadangan data/i)).toBeInTheDocument();
    expect(within(modal).getByText(/1 produk/i)).toBeInTheDocument();
    expect(within(modal).getByText(/Toko Baru Pulih/i)).toBeInTheDocument();

    // Confirm restore
    const confirmBtn = within(modal).getByRole("button", {
      name: /Gantikan data & impor/i,
    });
    await userEvent.click(confirmBtn);

    // Verify atomic replacement in database
    await waitFor(async () => {
      const allProducts = await db.products.toArray();
      expect(allProducts).toHaveLength(1);
      expect(allProducts[0].name).toBe("Produk Baru Pulih");

      const currentSettings = await settingsRepo.getSettings();
      expect(currentSettings.storeName).toBe("Toko Baru Pulih");
    });
  });

  it("rejects invalid backup and leaves existing database data untouched", async () => {
    // Current database data
    await db.products.add({
      id: "prod-safe",
      name: "Produk Aman",
      sku: "SAFE-01",
      categoryId: "cat-1",
      price: 50000,
      cost: 30000,
      stock: 15,
      lowStockThreshold: 3,
      isActive: true,
    });

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    // Upload corrupted file
    const fileInput = screen.getByLabelText(/Impor cadangan/i);
    const corruptedFile = new File(["{ invalid json content !!!"], "corrupt.json", {
      type: "application/json",
    });

    await userEvent.upload(fileInput, corruptedFile);

    // Alert error should be rendered
    await waitFor(() => {
      expect(
        screen.getByText(/Berkas cadangan tidak valid: Format JSON tidak valid/i)
      ).toBeInTheDocument();
    });

    // Verify existing database data was completely untouched
    const prods = await db.products.toArray();
    expect(prods).toHaveLength(1);
    expect(prods[0].name).toBe("Produk Aman");
  });

  it("acceptance test: export, wipe browser data, import, and confirm full restoration", async () => {
    // Seed initial dataset
    const cat: Category = { id: "cat-1", name: "Minuman Dingin" };
    const prod: Product = {
      id: "prod-1",
      name: "Es Teh Manis",
      sku: "EST-01",
      categoryId: cat.id,
      price: 5000,
      cost: 2000,
      stock: 50,
      lowStockThreshold: 5,
      isActive: true,
    };
    const tx: Transaction = {
      id: "tx-accept",
      invoiceNo: "INV-20261009-0099",
      cashierId: adminUser.id,
      items: [
        {
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          price: prod.price,
          cost: prod.cost,
          qty: 2,
          subtotal: 10000,
        },
      ],
      subtotal: 10000,
      discount: 0,
      total: 10000,
      paymentMethod: "cash",
      amountPaid: 10000,
      change: 0,
      status: "completed",
      createdAt: "2026-10-09T08:00:00.000Z",
    };

    await db.categories.add(cat);
    await db.products.add(prod);
    await db.transactions.add(tx);

    // 1. Export database to BackupFile
    const exportedBackup = await backupRepo.exportAll();
    expect(exportedBackup.data.products).toHaveLength(1);
    expect(exportedBackup.data.transactions).toHaveLength(1);
    expect(exportedBackup.data.categories).toHaveLength(1);

    // 2. Wipe browser database completely
    await db.settings.clear();
    await db.users.clear();
    await db.products.clear();
    await db.categories.clear();
    await db.transactions.clear();
    await db.counters.clear();

    // Verify everything is wiped
    expect(await db.products.count()).toBe(0);
    expect(await db.transactions.count()).toBe(0);
    expect(await db.categories.count()).toBe(0);
    expect(await db.users.count()).toBe(0);

    // 3. Import the backup file
    await backupRepo.importAll(exportedBackup);

    // 4. Confirm everything is restored identically
    const restoredProducts = await db.products.toArray();
    const restoredTxs = await db.transactions.toArray();
    const restoredCats = await db.categories.toArray();
    const restoredUsers = await db.users.toArray();

    expect(restoredProducts).toHaveLength(1);
    expect(restoredProducts[0]).toEqual(prod);

    expect(restoredTxs).toHaveLength(1);
    expect(restoredTxs[0]).toEqual(tx);

    expect(restoredCats).toHaveLength(1);
    expect(restoredCats[0]).toEqual(cat);

    expect(restoredUsers).toHaveLength(1);
    expect(restoredUsers[0]).toEqual(adminUser);
  });

  it("displays PWA install section and allows triggering install prompt", async () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    // Section title
    expect(await screen.findByRole("heading", { name: /Aplikasi/i })).toBeInTheDocument();
    expect(screen.getByText(/Berjalan di peramban web/i)).toBeInTheDocument();

    // Install button
    const installBtn = screen.getByRole("button", { name: /Pasang di perangkat/i });
    expect(installBtn).toBeInTheDocument();

    await userEvent.click(installBtn);
    expect(alertMock).toHaveBeenCalledWith(
      expect.stringContaining("Untuk memasang aplikasi dari browser")
    );
  });

  it("handles printer connection controls, test print, cash drawer toggle, and reprint", async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    // Printer heading
    expect(await screen.findByRole("heading", { name: /Printer/i })).toBeInTheDocument();

    // Connection selector
    const connectionSelect = screen.getByLabelText(/Tipe koneksi/i);
    expect(connectionSelect).toBeInTheDocument();

    // Select Browser Print
    await userEvent.selectOptions(connectionSelect, "browser");
    expect(screen.getByText(/Siap \(Dialog Peramban\)/i)).toBeInTheDocument();

    // Test print button
    const testPrintBtn = screen.getByRole("button", { name: /Cetak tes/i });
    expect(testPrintBtn).toBeInTheDocument();
    expect(testPrintBtn).not.toBeDisabled();
    await userEvent.click(testPrintBtn);

    // Cash drawer toggle
    const cashDrawerCheckbox = screen.getByLabelText(/Buka laci kasir otomatis saat mencetak/i);
    expect(cashDrawerCheckbox).not.toBeChecked();
    await userEvent.click(cashDrawerCheckbox);
    expect(cashDrawerCheckbox).toBeChecked();

    // Reprint button
    const reprintBtn = screen.getByRole("button", { name: /Cetak ulang struk terakhir/i });
    expect(reprintBtn).toBeInTheDocument();
  });

  it("displays native desktop status and hides install prompt when running in Tauri", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__TAURI_INTERNALS__ = {};

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: /Aplikasi/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Aplikasi desktop terpasang \(Windows \/ Native\)/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Pasang di perangkat/i })
    ).not.toBeInTheDocument();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).__TAURI_INTERNALS__;
  });
});
