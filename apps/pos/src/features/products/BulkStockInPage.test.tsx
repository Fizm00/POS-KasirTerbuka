import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { BulkStockInPage } from "./BulkStockInPage";
import { productsRepo } from "../../db/repositories/productsRepo";
import { stockMovementsRepo } from "../../db/repositories/stockMovementsRepo";
import { useAuthStore } from "../auth/authStore";
import type { Product } from "../../db/schema";

vi.mock("../../db/repositories/productsRepo", () => ({
  productsRepo: {
    getAll: vi.fn(),
  },
}));

vi.mock("../../db/repositories/stockMovementsRepo", () => ({
  stockMovementsRepo: {
    recordBulkStockIn: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("BulkStockInPage", () => {
  const sampleProducts: Product[] = [
    {
      id: "prod-1",
      name: "Beras Rojolele 5kg",
      sku: "BRS-05",
      categoryId: "cat-1",
      price: 75000,
      cost: 65000,
      stock: 10,
      lowStockThreshold: 3,
      isActive: true,
    },
    {
      id: "prod-2",
      name: "Minyak Goreng 2L",
      sku: "MYK-02",
      categoryId: "cat-1",
      price: 34000,
      cost: 29000,
      stock: 20,
      lowStockThreshold: 5,
      isActive: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      currentUser: {
        id: "usr-admin",
        name: "Admin Store",
        role: "admin",
        pinHash: "hash",
        isActive: true,
      },
      isLocked: false,
    });
    vi.mocked(productsRepo.getAll).mockResolvedValue(sampleProducts);
    vi.mocked(stockMovementsRepo.recordBulkStockIn).mockResolvedValue([]);
  });

  it("searches, adds products to bulk list, and executes atomic bulk stock in", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <BulkStockInPage />
      </MemoryRouter>
    );

    // Initial state: empty list message and submit button disabled
    expect(screen.getByText(/Belum ada produk yang dipilih/i)).toBeInTheDocument();
    const submitBtn = screen.getByRole("button", { name: /Simpan barang masuk/i });
    expect(submitBtn).toBeDisabled();

    // Search for Beras
    const searchInput = screen.getByPlaceholderText(/Cari nama produk atau scan barcode/i);
    await user.type(searchInput, "Beras");

    // Click on search result
    const searchResultItem = await screen.findByText("Beras Rojolele 5kg");
    await user.click(searchResultItem);

    // Verify Beras added to table
    expect(screen.getByText("SKU: BRS-05")).toBeInTheDocument();
    expect(submitBtn).toBeEnabled();

    // Search and add Minyak
    await user.type(searchInput, "Minyak");
    const minyakItem = await screen.findByText("Minyak Goreng 2L");
    await user.click(minyakItem);

    expect(screen.getByText("SKU: MYK-02")).toBeInTheDocument();

    // Verify summary
    expect(screen.getByText(/Total produk: 2/i)).toBeInTheDocument();

    // Type a general note
    const noteInput = screen.getByPlaceholderText(/Faktur Supplier PO/i);
    await user.type(noteInput, "Faktur PO-888");

    // Click submit
    await user.click(submitBtn);

    await waitFor(() => {
      expect(stockMovementsRepo.recordBulkStockIn).toHaveBeenCalledWith(
        [
          expect.objectContaining({ productId: "prod-1", qty: 1 }),
          expect.objectContaining({ productId: "prod-2", qty: 1 }),
        ],
        "Faktur PO-888",
        "usr-admin"
      );
      expect(mockNavigate).toHaveBeenCalledWith("/produk");
    });
  });

  it("navigates back to /produk when cancel is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <BulkStockInPage />
      </MemoryRouter>
    );

    const cancelBtn = screen.getByRole("button", { name: /Batal/i });
    await user.click(cancelBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/produk");
  });
});
