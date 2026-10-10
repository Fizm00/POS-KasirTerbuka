import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, Lock, Settings, Users, X } from "lucide-react";
import type { NavItem } from "../features/auth/permissions";
import { t } from "../i18n";

export interface MobileNavSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  onLock: () => void;
}

const NAV_ICONS: Record<string, React.ReactNode> = {
  "/laporan": <BarChart3 className="w-5 h-5" aria-hidden="true" />,
  "/pengguna": <Users className="w-5 h-5" aria-hidden="true" />,
  "/pengaturan": <Settings className="w-5 h-5" aria-hidden="true" />,
};

export const MobileNavSheet: React.FC<MobileNavSheetProps> = ({
  isOpen,
  onClose,
  items,
  onLock,
}) => {
  const location = useLocation();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("nav.moreMenu")}
      className="fixed inset-0 z-50 flex items-end justify-center md:hidden"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-[rgba(28,27,25,0.4)] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Drawer */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-lg bg-[var(--surface)] border-t border-[var(--border)] rounded-t-[var(--radius-modal)] shadow-2xl p-4 flex flex-col gap-2 z-10 animate-in slide-in-from-bottom duration-200"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">{t("nav.moreMenu")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="w-12 h-12 flex items-center justify-center rounded-[var(--radius-control)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links list */}
        <div className="flex flex-col py-1">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            const icon = NAV_ICONS[item.path] || null;

            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={onClose}
                className={`min-h-[52px] h-[52px] px-4 flex items-center gap-3.5 rounded-[var(--radius-control)] text-base font-medium transition-colors cursor-pointer select-none ${
                  isActive
                    ? "bg-[var(--primary-soft)] text-[var(--primary)] font-semibold"
                    : "text-[var(--text)] hover:bg-[var(--bg)]"
                } focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2`}
              >
                <span className={isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}>
                  {icon}
                </span>
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}

          {/* Quick Lock in More Sheet */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onLock();
            }}
            className="min-h-[52px] h-[52px] px-4 flex items-center gap-3.5 rounded-[var(--radius-control)] text-base font-medium text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer select-none text-left focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2"
          >
            <span className="text-[var(--text-muted)]">
              <Lock className="w-5 h-5" aria-hidden="true" />
            </span>
            <span>{t("nav.lock")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
