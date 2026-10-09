import React, { useEffect } from "react";
import { X } from "lucide-react";

export type ToastVariant = "success" | "error";

export interface ToastProps {
  isOpen: boolean;
  message: string;
  variant?: ToastVariant;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export const Toast: React.FC<ToastProps> = ({
  isOpen,
  message,
  variant = "success",
  onDismiss,
  autoDismissMs = 3000,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    if (variant === "error") {
      // Errors persist until dismissed
      return;
    }

    const timer = setTimeout(() => {
      onDismiss();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [isOpen, variant, autoDismissMs, onDismiss]);

  if (!isOpen) return null;

  const isError = variant === "error";

  return (
    <aside
      aria-label="Notifikasi"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
    >
      <div
        role={isError ? "alert" : "status"}
        aria-live={isError ? "assertive" : "polite"}
        className={`flex items-center gap-3 min-h-[48px] px-4 py-2 rounded-[var(--radius-control)] border text-sm font-medium ${
          isError
            ? "bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]"
            : "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary)]"
        }`}
      >
        <span>{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup"
          className="min-h-[44px] min-w-[44px] -mr-2 inline-flex items-center justify-center rounded-[var(--radius-control)] text-current hover:opacity-75 focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-1 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};
