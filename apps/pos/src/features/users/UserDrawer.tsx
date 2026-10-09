import React, { useState } from "react";
import { Drawer } from "../../components/Drawer";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Eye, EyeOff } from "lucide-react";
import { hashPin } from "../auth/pin";
import { usersRepo } from "../../db/repositories/usersRepo";
import type { User, UserRole } from "../../db/schema";
import { t } from "../../i18n";

export interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (newUser: User) => void;
}

export const UserDrawer: React.FC<UserDrawerProps> = ({ isOpen, onClose, onUserCreated }) => {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [role, setRole] = useState<UserRole>("kasir");
  const [nameError, setNameError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setPin("");
    setShowPin(false);
    setRole("kasir");
    setNameError(null);
    setPinError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setPinError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(t("users.errors.nameRequired"));
      return;
    }

    if (!/^\d{4,6}$/.test(pin)) {
      setPinError(t("users.errors.pinFormat"));
      return;
    }

    try {
      setIsSubmitting(true);
      const pinHash = await hashPin(pin);
      const newUser = await usersRepo.createUser({
        name: trimmedName,
        role,
        pinHash,
        isActive: true,
      });

      onUserCreated(newUser);
      handleClose();
    } catch {
      setNameError("Gagal menambahkan pengguna.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={t("users.drawer.title")}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {t("users.drawer.cancel")}
          </Button>
          <Button
            type="submit"
            form="user-create-form"
            variant="primary"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {t("users.drawer.submit")}
          </Button>
        </div>
      }
    >
      <form id="user-create-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Nama Lengkap */}
        <Input
          id="user-name-input"
          label={t("users.drawer.nameLabel")}
          placeholder={t("users.drawer.namePlaceholder")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(null);
          }}
          error={nameError || undefined}
          autoFocus
        />

        {/* PIN dengan Toggle Show/Hide */}
        <div className="space-y-1">
          <label htmlFor="user-pin-input" className="block text-sm font-medium text-[var(--text)]">
            {t("users.drawer.pinLabel")}
          </label>
          <div className="relative">
            <input
              id="user-pin-input"
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              maxLength={6}
              placeholder={t("users.drawer.pinPlaceholder")}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setPin(val);
                setPinError(null);
              }}
              className="w-full min-h-[48px] h-[48px] px-3.5 pr-12 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] tabular-nums"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] rounded-[var(--radius-control)] cursor-pointer"
              aria-label={showPin ? t("users.drawer.hidePin") : t("users.drawer.showPin")}
            >
              {showPin ? (
                <EyeOff className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Eye className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
          {pinError && <p className="text-xs text-[var(--danger)] font-medium mt-1">{pinError}</p>}
        </div>

        {/* Peran (Radio: Kasir, Admin) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text)]">
            {t("users.drawer.roleLabel")}
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-[var(--radius-control)] cursor-pointer hover:bg-[var(--bg)] transition-colors">
              <input
                type="radio"
                name="user-role"
                value="kasir"
                checked={role === "kasir"}
                onChange={() => setRole("kasir")}
                className="w-4 h-4 text-[var(--primary)] accent-[var(--primary)]"
              />
              <span className="text-base font-medium text-[var(--text)]">
                {t("users.drawer.roleCashier")}
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-[var(--radius-control)] cursor-pointer hover:bg-[var(--bg)] transition-colors">
              <input
                type="radio"
                name="user-role"
                value="admin"
                checked={role === "admin"}
                onChange={() => setRole("admin")}
                className="w-4 h-4 text-[var(--primary)] accent-[var(--primary)]"
              />
              <span className="text-base font-medium text-[var(--text)]">
                {t("users.drawer.roleAdmin")}
              </span>
            </label>
          </div>
        </div>
      </form>
    </Drawer>
  );
};
