import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { usersRepo } from "../db/repositories/usersRepo";
import { useAuthStore } from "../features/auth/authStore";
import { canAccessRoute } from "../features/auth/permissions";
import { SetupWizard } from "../features/setup/SetupWizard";
import { LockScreen } from "../features/auth/LockScreen";
import { AppShell } from "./AppShell";
import { ComponentGallery } from "./ComponentGallery";
import { CashierPage } from "../features/pos/CashierPage";
import { TransactionsPage } from "../features/transactions/TransactionsPage";
import { ProductsPage } from "../features/products/ProductsPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { UsersPage } from "../features/users/UsersPage";
import { SettingsPage } from "../features/settings/SettingsPage";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { currentUser, isLocked } = useAuthStore();
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      const count = await usersRepo.countAdmins();
      setHasAdmin(count > 0);
    }
    checkAdmin();
  }, []);

  if (hasAdmin === null) {
    return null;
  }

  if (!hasAdmin) {
    return <Navigate to="/setup" replace />;
  }

  if (isLocked || !currentUser) {
    return <Navigate to="/kunci" replace state={{ from: location }} />;
  }

  if (!canAccessRoute(currentUser.role, location.pathname)) {
    return <Navigate to="/kasir" replace />;
  }

  return <AppShell>{children}</AppShell>;
};

export const SetupRoute: React.FC = () => {
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      const count = await usersRepo.countAdmins();
      setHasAdmin(count > 0);
    }
    checkAdmin();
  }, []);

  if (hasAdmin === null) return null;
  if (hasAdmin) return <Navigate to="/kunci" replace />;

  return <SetupWizard />;
};

export const LockRoute: React.FC = () => {
  const { currentUser, isLocked } = useAuthStore();
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      const count = await usersRepo.countAdmins();
      setHasAdmin(count > 0);
    }
    checkAdmin();
  }, []);

  if (hasAdmin === null) return null;
  if (!hasAdmin) return <Navigate to="/setup" replace />;
  if (!isLocked && currentUser) return <Navigate to="/kasir" replace />;

  return <LockScreen />;
};

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Setup Wizard */}
        <Route path="/setup" element={<SetupRoute />} />

        {/* Lock / Login */}
        <Route path="/kunci" element={<LockRoute />} />

        {/* Protected Feature Routes */}
        <Route
          path="/kasir"
          element={
            <ProtectedRoute>
              <CashierPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/riwayat"
          element={
            <ProtectedRoute>
              <TransactionsPage />
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
        <Route
          path="/laporan"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pengguna"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pengaturan"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Developer Component Gallery */}
        <Route path="/dev/components" element={<ComponentGallery />} />

        {/* Default redirect to /kasir */}
        <Route path="/" element={<Navigate to="/kasir" replace />} />
        <Route path="*" element={<Navigate to="/kasir" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
