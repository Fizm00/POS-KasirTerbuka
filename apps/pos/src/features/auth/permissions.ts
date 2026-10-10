import type { FeatureKey, StoreSettings, UserRole } from "../../db/schema";
import { isFeatureEnabled } from "../../lib/features";

export interface NavItem {
  id: string;
  labelKey: string;
  path: string;
  requiredFeature?: FeatureKey;
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
 * Route paths that are gated by specific feature flags.
 * If the feature is disabled, access is rejected regardless of role.
 */
export const FEATURE_ROUTES: Record<string, FeatureKey> = {
  "/stok-masuk": "stockIn",
  "/shift": "shifts",
  "/pengeluaran": "expenses",
  "/meja": "tables",
  "/piutang": "receivables",
};

/**
 * Checks whether a user role is allowed to access a specific route,
 * taking into account both role permissions and active feature flags.
 */
export function canAccessRoute(
  role: UserRole,
  path: string,
  settings?: StoreSettings | null
): boolean {
  // If the route belongs to a feature module and the feature is disabled, deny access
  const requiredFeature =
    FEATURE_ROUTES[path] || ALL_NAV_ITEMS.find((item) => item.path === path)?.requiredFeature;

  if (requiredFeature && !isFeatureEnabled(requiredFeature, settings)) {
    return false;
  }

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

export function canAdjustStock(role: UserRole): boolean {
  return role === "admin";
}

/**
 * Returns navigation menu items visible for the given user role and active features.
 */
export function getNavigationItems(role: UserRole, settings?: StoreSettings | null): NavItem[] {
  return ALL_NAV_ITEMS.filter((item) => {
    if (item.requiredFeature && !isFeatureEnabled(item.requiredFeature, settings)) {
      return false;
    }
    return canAccessRoute(role, item.path, settings);
  });
}
