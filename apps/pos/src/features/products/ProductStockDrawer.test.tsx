import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductStockDrawer } from "./ProductStockDrawer";
import { stockMovementsRepo } from "../../db/repositories/stockMovementsRepo";
import { usersRepo } from "../../db/repositories/usersRepo";
import { useAuthStore } from "../auth/authStore";
import type { Product, StockMovement, User } from "../../db/schema";

vi.mock("../../db/repositories/stockMovementsRepo", () => ({
  stockMovementsRepo: {
    recordStockIn: vi.fn(),
    recordAdjustment: vi.fn(),
    getByProduct: vi.fn(),
  },
}));

vi.mock("../../db/repositories/usersRepo", () => ({
  usersRepo: {
    getUsers: vi.fn(),
  },
}));

describe("ProductStockDrawer", () => {
  const sampleProduct: Product = {
    id: "prod-1",
    name: "Kopi Hitam",
    sku: "KOP-01",
    categoryId: "cat-1",
    price: 15000,
    cost: 6000,
    stock: 20,
    lowStockThreshold: 5,
    isActive: true,
  };

  const sampleUsers: User[] = [
    {
      id: "usr-admin",
      name: "Budi Admin",
      role: "admin",
      pinHash: "hash",
      isActive: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({
      currentUser: sampleUsers[0],
      isLocked: false,
    });

    vi.mocked(usersRepo.getUsers).mockResolvedValue(sampleUsers);
    vi.mocked(stockMovementsRepo.getByProduct).mockResolvedValue([]);
  });

  it("renders current stock and submits stock in successfully", async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();
    const user = userEvent.setup();

    render(
      <ProductStockDrawer
        product={sampleProduct}
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    // Verify current stock and SKU are rendered
    expect(screen.getByText("KOP-01")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();

    // Fill Jumlah Masuk
    const qtyInput = screen.getByLabelText(/Jumlah masuk/i);
    await user.clear(qtyInput);
    await user.type(qtyInput, "15");

    // Click submit
    const submitBtn = screen.getByRole("button", { name: /Simpan stok masuk/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(stockMovementsRepo.recordStockIn).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: "prod-1",
          qty: 15,
          userId: "usr-admin",
        })
      );
      expect(handleSuccess).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("calculates adjustment difference and validates required reason", async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();
    const user = userEvent.setup();

    render(
      <ProductStockDrawer
        product={sampleProduct}
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    // Switch to Penyesuaian tab
    const adjustTab = screen.getByRole("radio", { name: /Penyesuaian/i });
    await user.click(adjustTab);

    // Actual count input defaults to current stock 20
    const countInput = screen.getByLabelText(/Stok fisik sebenarnya/i);
    expect(countInput).toHaveValue(20);

    // Change actual count to 25 -> difference +5
    await user.clear(countInput);
    await user.type(countInput, "25");
    expect(screen.getByText("+5 unit")).toBeInTheDocument();

    // Change actual count to 17 -> difference -3
    await user.clear(countInput);
    await user.type(countInput, "17");
    expect(screen.getByText("-3 unit")).toBeInTheDocument();

    // Submit without reason -> required validation prevents submission
    const submitBtn = screen.getByRole("button", { name: /Simpan penyesuaian/i });
    await user.click(submitBtn);

    expect(stockMovementsRepo.recordAdjustment).not.toHaveBeenCalled();

    // Fill reason and submit
    const reasonInput = screen.getByPlaceholderText(/Contoh: Barang rusak/i);
    await user.type(reasonInput, "3 unit tumpah");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(stockMovementsRepo.recordAdjustment).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: "prod-1",
          actualCount: 17,
          reason: "3 unit tumpah",
          userId: "usr-admin",
          userRole: "admin",
        })
      );
      expect(handleSuccess).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("blocks cashier role from performing adjustments", async () => {
    useAuthStore.setState({
      currentUser: {
        id: "usr-kasir",
        name: "Siti Kasir",
        role: "kasir",
        pinHash: "hash",
        isActive: true,
      },
      isLocked: false,
    });

    const user = userEvent.setup();

    render(
      <ProductStockDrawer
        product={sampleProduct}
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    // Switch to Penyesuaian tab
    await user.click(screen.getByRole("radio", { name: /Penyesuaian/i }));

    // Admin-only warning must be visible
    expect(
      screen.getByText(/Hanya admin yang dapat melakukan penyesuaian stok/i)
    ).toBeInTheDocument();

    // Submit button must be disabled
    const submitBtn = screen.getByRole("button", { name: /Simpan penyesuaian/i });
    expect(submitBtn).toBeDisabled();
  });

  it("renders stock history list with type, delta, resulting stock, and user", async () => {
    const mockHistory: StockMovement[] = [
      {
        id: "sm-1",
        productId: "prod-1",
        type: "in",
        qty: 10,
        resultingStock: 30,
        note: "Pengiriman supplier",
        userId: "usr-admin",
        createdAt: "2026-10-10T10:00:00.000Z",
      },
      {
        id: "sm-2",
        productId: "prod-1",
        type: "sale",
        qty: -2,
        resultingStock: 28,
        note: "Invoice INV-20261010-0001",
        userId: "usr-admin",
        createdAt: "2026-10-10T11:00:00.000Z",
      },
    ];

    vi.mocked(stockMovementsRepo.getByProduct).mockResolvedValue(mockHistory);
    const user = userEvent.setup();

    render(
      <ProductStockDrawer
        product={sampleProduct}
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    // Switch to Riwayat stok tab
    await user.click(screen.getByRole("radio", { name: /Riwayat stok/i }));

    await waitFor(() => {
      expect(screen.getByText("+10")).toBeInTheDocument();
      expect(screen.getByText("-2")).toBeInTheDocument();
      expect(screen.getByText("30")).toBeInTheDocument();
      expect(screen.getByText("28")).toBeInTheDocument();
      expect(screen.getByText("Pengiriman supplier")).toBeInTheDocument();
    });
  });
});
