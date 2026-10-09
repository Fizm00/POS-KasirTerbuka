import React, { useState } from "react";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { hashPin } from "../auth/pin";
import { usersRepo } from "../../db/repositories/usersRepo";
import type { User } from "../../db/schema";
import { t } from "../../i18n";

export interface ResetPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onPinResetSuccess: () => void;
}

export const ResetPinModal: React.FC<ResetPinModalProps> = ({
  isOpen,
  onClose,
  user,
  onPinResetSuccess,
}) => {
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleClose = () => {
    setNewPin("");
    setConfirmPin("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{4,6}$/.test(newPin)) {
      setError(t("users.errors.pinFormat"));
      return;
    }

    if (newPin !== confirmPin) {
      setError(t("users.errors.pinMismatch"));
      return;
    }

    try {
      setIsSubmitting(true);
      const newPinHash = await hashPin(newPin);
      await usersRepo.resetPin(user.id, newPinHash);
      onPinResetSuccess();
      handleClose();
    } catch {
      setError("Gagal mereset PIN.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("users.resetPinModal.title")}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {t("users.resetPinModal.cancel")}
          </Button>
          <Button
            type="submit"
            form="reset-pin-form"
            variant="primary"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {t("users.resetPinModal.submit")}
          </Button>
        </div>
      }
    >
      <form id="reset-pin-form" onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-[var(--text-muted)]">
          {t("users.resetPinModal.subtitle", { name: user.name })}
        </p>

        {/* PIN Baru */}
        <div className="space-y-1">
          <label htmlFor="reset-new-pin" className="block text-sm font-medium text-[var(--text)]">
            {t("users.resetPinModal.newPinLabel")}
          </label>
          <input
            id="reset-new-pin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="4 - 6 digit"
            value={newPin}
            onChange={(e) => {
              setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6));
              setError(null);
            }}
            className="w-full min-h-[48px] h-[48px] px-3.5 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] tabular-nums"
            autoFocus
          />
        </div>

        {/* Ulangi PIN Baru */}
        <div className="space-y-1">
          <label
            htmlFor="reset-confirm-pin"
            className="block text-sm font-medium text-[var(--text)]"
          >
            {t("users.resetPinModal.confirmPinLabel")}
          </label>
          <input
            id="reset-confirm-pin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="Ulangi 4 - 6 digit"
            value={confirmPin}
            onChange={(e) => {
              setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6));
              setError(null);
            }}
            className="w-full min-h-[48px] h-[48px] px-3.5 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] tabular-nums"
          />
        </div>

        {error && <p className="text-xs text-[var(--danger)] font-medium">{error}</p>}
      </form>
    </Modal>
  );
};
