import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductImportModal } from "./ProductImportModal";
import { db } from "../../db/schema";

describe("ProductImportModal", () => {
  beforeEach(async () => {
    await db.products.clear();
    await db.categories.clear();
  });

  it("renders modal with template download and file dropzone", () => {
    render(<ProductImportModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByText("Impor produk dari CSV")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Unduh template CSV/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Pilih berkas CSV \(maksimal 5 MB, 5\.000 baris\)/i)
    ).toBeInTheDocument();
  });

  it("handles CSV file upload, previews rows, and executes atomic import", async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    const { container } = render(
      <ProductImportModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
    );

    const csvContent =
      "nama,sku,kategori,harga_modal,harga_jual,stok,batas_stok_menipis\n" +
      "Kopi Latte,LAT-001,Minuman,10000,20000,15,3\n" +
      "Roti Bakar,ROT-001,Makanan,8000,16000,10,2";

    const file = new File([csvContent], "products.csv", { type: "text/csv" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    // Wait for parse result and preview table
    await waitFor(() => {
      expect(screen.getByText(/Berkas: products\.csv \(2 baris\)/i)).toBeInTheDocument();
      expect(screen.getByText("Kopi Latte")).toBeInTheDocument();
      expect(screen.getByText("Roti Bakar")).toBeInTheDocument();
    });

    // Check conflict strategy radio buttons
    expect(screen.getByText("Lewati produk (pertahankan data lama)")).toBeInTheDocument();
    expect(screen.getByText("Perbarui produk (timpa harga, modal, dan stok)")).toBeInTheDocument();

    // Import button
    const importButton = screen.getByRole("button", { name: /Mulai impor \(2 baris\)/i });
    expect(importButton).toBeEnabled();

    await userEvent.click(importButton);

    // Summary screen
    await waitFor(() => {
      expect(screen.getByText("Impor produk berhasil")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument(); // 2 created
    });

    expect(onSuccess).toHaveBeenCalled();

    // Database verification
    const products = await db.products.toArray();
    expect(products).toHaveLength(2);
    expect(products.find((p) => p.sku === "LAT-001")?.price).toBe(20000);
    expect(products.find((p) => p.sku === "ROT-001")?.price).toBe(16000);

    const categories = await db.categories.toArray();
    expect(categories).toHaveLength(2);
  });

  it("displays validation error when CSV has invalid data and blocks import", async () => {
    const { container } = render(
      <ProductImportModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />
    );

    const badCsvContent =
      "nama,sku,harga_jual\n" +
      ",LAT-001,20000\n" + // Missing name
      "Roti Bakar,ROT-001,-5000"; // Negative price

    const file = new File([badCsvContent], "bad.csv", { type: "text/csv" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Ditemukan 2 masalah pada berkas CSV/i)).toBeInTheDocument();
    });

    // Execute button should be disabled due to validation errors
    expect(screen.getByRole("button", { name: /Mulai impor/i })).toBeDisabled();
  });
});
