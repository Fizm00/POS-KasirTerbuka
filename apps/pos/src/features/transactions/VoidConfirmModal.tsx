import React, { useState } from "react";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { AlertTriangle } from "lucide-react";
import { t } from "../../i18n";

export interface VoidConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNo: string;
  onConfirmVoid: (reason: string) => Promise<void>;
}

export const VoidConfirmModal: React.FC<VoidConfirmModalProps> = ({
  isOpen,
  onClose,
  invoiceNo,
  onConfirmVoid,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(t("voidModal.reasonRequired"));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirmVoid(trimmed);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal membatalkan transaksi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("voidModal.title")}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {t("voidModal.confirmButton")}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning Callout */}
        <div className="p-4 bg-[var(--danger-soft)] text-[var(--danger)] rounded-[var(--radius-control)] border border-[var(--danger)] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-base">
              {t("voidModal.confirmMessage", { invoiceNo })}
            </p>
            <p className="font-medium">{t("voidModal.warningStock")}</p>
          </div>
        </div>

        {/* Reason Input */}
        <Input
          id="void-reason-input"
          label={t("voidModal.reasonLabel")}
          placeholder={t("voidModal.reasonPlaceholder")}
          value={reason}
          error={error || undefined}
          onChange={(e) => {
            setReason(e.target.value);
            setError(null);
          }}
          autoFocus
        />
      </form>
    </Modal>
  );
};
