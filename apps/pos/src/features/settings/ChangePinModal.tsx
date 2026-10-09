import React, { useState } from "react";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { hashPin, verifyPin } from "../auth/pin";
import { usersRepo } from "../../db/repositories/usersRepo";
import { useAuthStore } from "../auth/authStore";
import { t } from "../../i18n";

export interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser, unlock } = useAuthStore();

  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleClose = () => {
    setOldPin("");
    setNewPin("");
    setConfirmPin("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Verify old PIN
    const isValidOldPin = await verifyPin(oldPin, currentUser.pinHash);
    if (!isValidOldPin) {
      setError(t("settings.security.changePinModal.oldPinIncorrect"));
      return;
    }

    // Validate new PIN format
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
      const updatedUser = await usersRepo.resetPin(currentUser.id, newPinHash);

      // Update current user in store
      unlock(updatedUser);

      onSuccess();
      handleClose();
    } catch {
      setError("Gagal memperbarui PIN.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("settings.security.changePinModal.title")}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {t("settings.security.changePinModal.cancel")}
          </Button>
          <Button
            type="submit"
            form="change-my-pin-form"
            variant="primary"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {t("settings.security.changePinModal.submit")}
          </Button>
        </div>
      }
    >
      <form id="change-my-pin-form" onSubmit={handleSubmit} className="space-y-4">
        {/* PIN Saat Ini */}
        <div className="space-y-1">
          <label htmlFor="change-old-pin" className="block text-sm font-medium text-[var(--text)]">
            {t("settings.security.changePinModal.oldPinLabel")}
          </label>
          <input
            id="change-old-pin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={oldPin}
            onChange={(e) => {
              setOldPin(e.target.value.replace(/\D/g, "").slice(0, 6));
              setError(null);
            }}
            className="w-full min-h-[48px] h-[48px] px-3.5 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] tabular-nums"
            autoFocus
          />
        </div>

        {/* PIN Baru */}
        <div className="space-y-1">
          <label htmlFor="change-new-pin" className="block text-sm font-medium text-[var(--text)]">
            {t("settings.security.changePinModal.newPinLabel")}
          </label>
          <input
            id="change-new-pin"
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
          />
        </div>

        {/* Konfirmasi PIN Baru */}
        <div className="space-y-1">
          <label
            htmlFor="change-confirm-pin"
            className="block text-sm font-medium text-[var(--text)]"
          >
            {t("settings.security.changePinModal.confirmPinLabel")}
          </label>
          <input
            id="change-confirm-pin"
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
