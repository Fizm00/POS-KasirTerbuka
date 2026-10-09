import type { UserRole } from "../../db/schema";

export interface NavItem {
  id: string;
  labelKey: string;
  path: string;
}

export const ALL_NAV_ITEMS: NavItem[] = [
  { id: "cashier", labelKey: "nav.cashier", path: "/kasir" },
  { id: "history", labelKey: "nav.history", path: "/riwayat" },
  { id: "products", labelKey: "nav.products", path: "/produk" },
  { id: "reports", labelKey: "nav.reports", path: "/laporan" },
  { id: "users", labelKey: "nav.users", path: "/pengguna" },
  { id: "settings", labelKey: "nav.settings", path: "/pengaturan" },
];

/**
 * Checks whether a user role is allowed to access a specific route.
 */
export function canAccessRoute(role: UserRole, path: string): boolean {
  if (role === "admin") {
    return true;
  }

  // Kasir can only access /kasir and /riwayat (and /dev/components)
  if (path === "/kasir" || path === "/riwayat" || path.startsWith("/dev/")) {
    return true;
  }

  return false;
}

export function canVoidTransaction(role: UserRole): boolean {
  return role === "admin";
}

export function canManageProducts(role: UserRole): boolean {
  return role === "admin";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}

export function canManageSettings(role: UserRole): boolean {
  return role === "admin";
}

export function canViewAllTransactions(role: UserRole): boolean {
  return role === "admin";
}

/**
 * Returns navigation menu items visible for the given user role.
 */
export function getNavigationItems(role: UserRole): NavItem[] {
  return ALL_NAV_ITEMS.filter((item) => canAccessRoute(role, item.path));
}
