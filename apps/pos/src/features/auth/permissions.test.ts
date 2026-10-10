import { describe, expect, it } from "vitest";
import {
  canAccessRoute,
  canManageProducts,
  canManageSettings,
  canManageUsers,
  canViewAllTransactions,
  canVoidTransaction,
  getNavigationItems,
} from "./permissions";

describe("role permissions", () => {
  describe("admin permissions", () => {
    it("allows access to all routes", () => {
      expect(canAccessRoute("admin", "/kasir")).toBe(true);
      expect(canAccessRoute("admin", "/riwayat")).toBe(true);
      expect(canAccessRoute("admin", "/produk")).toBe(true);
      expect(canAccessRoute("admin", "/laporan")).toBe(true);
      expect(canAccessRoute("admin", "/pengguna")).toBe(true);
      expect(canAccessRoute("admin", "/pengaturan")).toBe(true);
    });

    it("has all management permissions", () => {
      expect(canVoidTransaction("admin")).toBe(true);
      expect(canManageProducts("admin")).toBe(true);
      expect(canManageUsers("admin")).toBe(true);
      expect(canManageSettings("admin")).toBe(true);
      expect(canViewAllTransactions("admin")).toBe(true);
    });

    it("returns all 6 navigation items", () => {
      const items = getNavigationItems("admin");
      expect(items).toHaveLength(6);
      expect(items.map((i) => i.id)).toEqual([
        "cashier",
        "history",
        "products",
        "reports",
        "users",
        "settings",
      ]);
    });
  });

  describe("kasir permissions", () => {
    it("restricts access to cashier and history routes only", () => {
      expect(canAccessRoute("kasir", "/kasir")).toBe(true);
      expect(canAccessRoute("kasir", "/riwayat")).toBe(true);
      expect(canAccessRoute("kasir", "/produk")).toBe(false);
      expect(canAccessRoute("kasir", "/laporan")).toBe(false);
      expect(canAccessRoute("kasir", "/pengguna")).toBe(false);
      expect(canAccessRoute("kasir", "/pengaturan")).toBe(false);
    });

    it("denies administrative actions", () => {
      expect(canVoidTransaction("kasir")).toBe(false);
      expect(canManageProducts("kasir")).toBe(false);
      expect(canManageUsers("kasir")).toBe(false);
      expect(canManageSettings("kasir")).toBe(false);
      expect(canViewAllTransactions("kasir")).toBe(false);
    });

    it("returns only cashier and history navigation items", () => {
      const items = getNavigationItems("kasir");
      expect(items).toHaveLength(2);
      expect(items.map((i) => i.id)).toEqual(["cashier", "history"]);
    });
  });

  describe("feature-gated routes", () => {
    it("denies access to a feature route when the feature is disabled, even for admin", () => {
      const disabledSettings = {
        id: "default",
        storeName: "Test",
        address: "",
        phone: "",
        receiptFooter: "",
        paperWidth: 58 as const,
        currency: "IDR",
        features: {
          stockIn: false,
          shifts: false,
          expenses: false,
          tables: false,
          receivables: false,
          photos: false,
          csvImport: false,
          holdOrders: false,
          variants: false,
          tax: false,
          serviceCharge: false,
        },
      };

      expect(canAccessRoute("admin", "/stok-masuk", disabledSettings)).toBe(false);
      expect(canAccessRoute("admin", "/shift", disabledSettings)).toBe(false);
    });

    it("allows access to a feature route when the feature is enabled for admin", () => {
      const enabledSettings = {
        id: "default",
        storeName: "Test",
        address: "",
        phone: "",
        receiptFooter: "",
        paperWidth: 58 as const,
        currency: "IDR",
        features: {
          stockIn: true,
          shifts: true,
          expenses: false,
          tables: false,
          receivables: false,
          photos: false,
          csvImport: false,
          holdOrders: false,
          variants: false,
          tax: false,
          serviceCharge: false,
        },
      };

      expect(canAccessRoute("admin", "/stok-masuk", enabledSettings)).toBe(true);
      expect(canAccessRoute("admin", "/shift", enabledSettings)).toBe(true);
    });
  });
});
