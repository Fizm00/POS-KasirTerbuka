import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { db } from "../db/schema";
import { useAuthStore } from "../features/auth/authStore";
import { LockRoute, ProtectedRoute, SetupRoute } from "./routes";
import { CashierPage } from "../features/pos/CashierPage";
import { ProductsPage } from "../features/products/ProductsPage";

describe("Route guards", () => {
  beforeEach(async () => {
    await db.settings.clear();
    await db.users.clear();
    useAuthStore.getState().lock();
  });

  it("redirects to /setup when no admin user exists", async () => {
    render(
      <MemoryRouter initialEntries={["/kasir"]}>
        <Routes>
          <Route path="/setup" element={<div>Halaman Setup</div>} />
          <Route path="/kunci" element={<div>Halaman Kunci</div>} />
          <Route
            path="/kasir"
            element={
              <ProtectedRoute>
                <CashierPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Halaman Setup")).toBeInTheDocument();
    });
  });

  it("redirects to /kunci when admin exists but user is locked", async () => {
    await db.users.add({
      id: "admin-1",
      name: "Admin Budi",
      role: "admin",
      pinHash: "sample-hash",
      isActive: true,
    });

    render(
      <MemoryRouter initialEntries={["/kasir"]}>
        <Routes>
          <Route path="/setup" element={<SetupRoute />} />
          <Route path="/kunci" element={<div>Halaman Kunci</div>} />
          <Route
            path="/kasir"
            element={
              <ProtectedRoute>
                <CashierPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Halaman Kunci")).toBeInTheDocument();
    });
  });

  it("prevents cashier role from accessing admin route /produk and redirects to /kasir", async () => {
    await db.users.add({
      id: "admin-1",
      name: "Admin Budi",
      role: "admin",
      pinHash: "sample-hash",
      isActive: true,
    });

    // Log in as cashier
    useAuthStore.getState().unlock({
      id: "kasir-1",
      name: "Rina Kasir",
      role: "kasir",
      pinHash: "sample-hash",
      isActive: true,
    });

    render(
      <MemoryRouter initialEntries={["/produk"]}>
        <Routes>
          <Route path="/kunci" element={<LockRoute />} />
          <Route
            path="/kasir"
            element={
              <ProtectedRoute>
                <CashierPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/produk"
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Must be redirected to /kasir
      expect(screen.getByPlaceholderText(/Cari produk atau scan barcode/i)).toBeInTheDocument();
      expect(screen.queryByText(/Kelola kategori/i)).not.toBeInTheDocument();
    });
  });

  it("allows admin role to access /produk", async () => {
    await db.users.add({
      id: "admin-1",
      name: "Admin Budi",
      role: "admin",
      pinHash: "sample-hash",
      isActive: true,
    });

    // Log in as admin
    useAuthStore.getState().unlock({
      id: "admin-1",
      name: "Admin Budi",
      role: "admin",
      pinHash: "sample-hash",
      isActive: true,
    });

    render(
      <MemoryRouter initialEntries={["/produk"]}>
        <Routes>
          <Route
            path="/produk"
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Produk" })).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /Tambah produk/i }).length).toBeGreaterThan(0);
    });
  });
});
