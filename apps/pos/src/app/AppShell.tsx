import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { settingsRepo } from "../db/repositories/settingsRepo";
import type { StoreSettings } from "../db/schema";
import { useAuthStore } from "../features/auth/authStore";
import { getNavigationItems } from "../features/auth/permissions";
import { useAutoLock } from "../features/auth/useAutoLock";
import { t } from "../i18n";

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, lock } = useAuthStore();

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isBackupDue, setIsBackupDue] = useState(false);

  // Activate auto-lock on inactivity
  useAutoLock();

  useEffect(() => {
    async function loadSettings() {
      const s = await settingsRepo.getSettings();
      setSettings(s);
      const isDue =
        !s.lastBackupAt ||
        Date.now() - new Date(s.lastBackupAt).getTime() > 7 * 24 * 60 * 60 * 1000;
      setIsBackupDue(isDue);
    }
    loadSettings();
  }, [location.pathname]);

  const handleLock = () => {
    lock();
    navigate("/kunci", { replace: true });
  };

  const navItems = currentUser ? getNavigationItems(currentUser.role) : [];

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col"
      style={{
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      {/* Top Bar (48-56px high + safe area top) */}
      <header
        className="min-h-[52px] bg-[var(--surface)] border-b border-[var(--border)] px-4 flex items-center justify-between select-none sticky top-0 z-40"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        {/* Left: Store Name & Navigation */}
        <div className="flex items-center gap-6">
          <span className="font-semibold text-base tracking-tight text-[var(--text)]">
            {settings?.storeName || "Kasir Terbuka"}
          </span>

          {/* Navigation Links for Desktop / Tablet */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Menu navigasi">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`min-h-[40px] px-3.5 inline-flex items-center rounded-[var(--radius-control)] text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
                  } focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2`}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Cashier Name & Lock Button */}
        <div className="flex items-center gap-4">
          {currentUser && (
            <span className="text-sm font-medium text-[var(--text)]">
              {t("nav.cashierLabel", { name: currentUser.name })}
            </span>
          )}

          {/* Calm backup reminder on cashier screen when backup is > 7 days old */}
          {location.pathname === "/kasir" && isBackupDue && (
            <Link
              to="/pengaturan"
              className="hidden sm:inline-flex items-center text-xs font-medium text-[var(--warning)] hover:underline px-1.5 py-1"
            >
              {t("settings.backup.calmReminder")}
            </Link>
          )}

          <button
            type="button"
            onClick={handleLock}
            className="min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] text-sm font-medium text-[var(--text)] hover:bg-[var(--bg)] active:bg-[var(--border)] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2"
          >
            <Lock className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
            <span>{t("nav.lock")}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 pb-16 md:pb-0">{children}</div>

      {/* Bottom Bar for Mobile Screens (max 4 items + safe area bottom) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 min-h-[56px] bg-[var(--surface)] border-t border-[var(--border)] flex items-center justify-around z-40 select-none px-2"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        aria-label="Menu bawah ponsel"
      >
        {navItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`min-h-[48px] px-2 flex-1 inline-flex items-center justify-center text-sm font-medium rounded-[var(--radius-control)] ${
                isActive
                  ? "text-[var(--primary)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              } focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2`}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
