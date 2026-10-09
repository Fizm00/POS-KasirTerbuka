import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ProductsPage } from "./ProductsPage";
import { db } from "../../db/schema";
import { useAuthStore } from "../auth/authStore";

describe("ProductsPage (Admin)", () => {
  let catMakananId: string;
  let catMinumanId: string;

  beforeEach(async () => {
    await db.products.clear();
    await db.categories.clear();
    await db.users.clear();

    // Log in as admin
    useAuthStore.getState().unlock({
      id: "admin-1",
      name: "Admin Budi",
      role: "admin",
      pinHash: "hash",
      isActive: true,
    });

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
        stock: 20, // normal stock (> 5)
        lowStockThreshold: 5,
        isActive: true,
      },
    ]);
  });

  it("renders products list with right-aligned tabular prices and numbers", async () => {
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Kopi Susu")).toBeInTheDocument();
      expect(screen.getByText("Nasi Goreng")).toBeInTheDocument();
    });

    expect(screen.getByText("Rp 15.000")).toBeInTheDocument();
    expect(screen.getByText("Rp 22.000")).toBeInTheDocument();
  });

  it("filters products by low stock when toggle is clicked", async () => {
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Kopi Susu")).toBeInTheDocument();
      expect(screen.getByText("Nasi Goreng")).toBeInTheDocument();
    });

    // Toggle low stock filter
    const toggleBtn = screen.getByRole("button", { name: /Stok menipis/i });
    await userEvent.click(toggleBtn);

    // Only Kopi Susu should be visible (stock 2 <= threshold 5)
    expect(screen.getByText("Kopi Susu")).toBeInTheDocument();
    expect(screen.queryByText("Nasi Goreng")).not.toBeInTheDocument();

    // Toggle off
    await userEvent.click(toggleBtn);
    expect(screen.getByText("Nasi Goreng")).toBeInTheDocument();
  });

  it("validates product drawer form and shows error for duplicate SKU", async () => {
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Kopi Susu")).toBeInTheDocument();
    });

    // Open add drawer
    await userEvent.click(screen.getByRole("button", { name: /Tambah produk/i }));

    // Try submitting empty form
    await userEvent.click(screen.getByRole("button", { name: /Simpan produk/i }));

    await waitFor(() => {
      expect(screen.getByText(/Nama produk wajib diisi/i)).toBeInTheDocument();
      expect(screen.getByText(/SKU wajib diisi/i)).toBeInTheDocument();
    });

    // Fill form with duplicate SKU "KOP-001"
    await userEvent.type(screen.getByLabelText(/^Nama produk/i), "Kopi Tubruk");
    await userEvent.type(screen.getByLabelText(/^SKU \/ barcode/i), "KOP-001");

    await userEvent.click(screen.getByRole("button", { name: /Simpan produk/i }));

    await waitFor(() => {
      expect(screen.getByText(/SKU sudah dipakai/i)).toBeInTheDocument();
    });

    // Fix SKU to unique "KOP-002"
    await userEvent.clear(screen.getByLabelText(/^SKU \/ barcode/i));
    await userEvent.type(screen.getByLabelText(/^SKU \/ barcode/i), "KOP-002");

    await userEvent.click(screen.getByRole("button", { name: /Simpan produk/i }));

    // Product should now be added
    await waitFor(() => {
      expect(screen.getByText("Kopi Tubruk")).toBeInTheDocument();
    });
  });

  it("toggles product activation status without deleting history", async () => {
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Kopi Susu")).toBeInTheDocument();
    });

    // Find Deactivate button for Kopi Susu
    const deactivateBtns = screen.getAllByRole("button", { name: /Nonaktifkan/i });
    await userEvent.click(deactivateBtns[0]);

    // Product status should change to Nonaktif
    await waitFor(async () => {
      const prod = await db.products.get("prod-1");
      expect(prod?.isActive).toBe(false);
      expect(screen.getByText("Nonaktif")).toBeInTheDocument();
    });
  });

  it("blocks deleting category when products are linked, but deletes when unlinked", async () => {
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );

    // Open category modal
    await userEvent.click(screen.getByRole("button", { name: /Kelola kategori/i }));

    await waitFor(() => {
      expect(screen.getByText("Daftar kategori")).toBeInTheDocument();
    });

    // Try deleting "Minuman" (linked to prod-1)
    const deleteMinumanBtn = screen.getByRole("button", { name: /Hapus Minuman/i });
    await userEvent.click(deleteMinumanBtn);

    // Guard error must be shown
    await waitFor(() => {
      expect(screen.getByText(/Kategori ini masih digunakan oleh 1 produk/i)).toBeInTheDocument();
    });

    // Category "Minuman" must still exist in DB
    expect(await db.categories.get(catMinumanId)).toBeDefined();

    // Add a new unused category
    await userEvent.type(screen.getByPlaceholderText(/Nama kategori baru/i), "Snack Baru");
    await userEvent.click(screen.getByRole("button", { name: /Tambah$/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Hapus Snack Baru/i })).toBeInTheDocument();
    });

    // Delete "Snack Baru" (not linked to any product)
    const deleteSnackBtn = screen.getByRole("button", { name: /Hapus Snack Baru/i });
    await userEvent.click(deleteSnackBtn);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Hapus Snack Baru/i })).not.toBeInTheDocument();
    });
  });
});
