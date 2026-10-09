import React from "react";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { AlertTriangle } from "lucide-react";
import type { BackupFile } from "../../db/repositories/backupRepo";
import { formatJakartaDisplayDateTime } from "../../lib/dates";
import { t } from "../../i18n";

export interface BackupConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  backupFile: BackupFile | null;
  onConfirmImport: () => Promise<void>;
  isImporting: boolean;
}

export const BackupConfirmModal: React.FC<BackupConfirmModalProps> = ({
  isOpen,
  onClose,
  backupFile,
  onConfirmImport,
  isImporting,
}) => {
  if (!isOpen || !backupFile) return null;

  const summary = {
    storeName: backupFile.data.settings[0]?.storeName || "Toko",
    exportedAt: formatJakartaDisplayDateTime(backupFile.exportedAt),
    products: backupFile.data.products.length,
    transactions: backupFile.data.transactions.length,
    users: backupFile.data.users.length,
    categories: backupFile.data.categories.length,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("settings.backup.modalTitle")}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose} disabled={isImporting}>
            {t("settings.backup.cancelButton")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirmImport}
            disabled={isImporting}
            isLoading={isImporting}
          >
            {t("settings.backup.confirmButton")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Warning Callout */}
        <div className="p-4 bg-[var(--danger-soft)] text-[var(--danger)] rounded-[var(--radius-control)] border border-[var(--danger)] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold">{t("settings.backup.modalWarning")}</p>
            <p className="font-medium text-xs">{t("settings.backup.modalWarningReplace")}</p>
          </div>
        </div>

        {/* Breakdown of what will be loaded */}
        <div className="space-y-2 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-control)] text-sm">
          <p className="font-semibold text-[var(--text)]">
            {t("settings.backup.modalItemsToReplace")}
          </p>
          <ul className="space-y-1 text-[var(--text-muted)] list-disc list-inside">
            <li>{t("settings.backup.productsCount", { count: summary.products })}</li>
            <li>
              {t("settings.backup.transactionsCount", {
                count: summary.transactions,
              })}
            </li>
            <li>{t("settings.backup.usersCount", { count: summary.users })}</li>
            <li>{t("settings.backup.categoriesCount", { count: summary.categories })}</li>
          </ul>
          <p className="text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
            Toko: <strong>{summary.storeName}</strong> • Tanggal ekspor: {summary.exportedAt}
          </p>
        </div>
      </div>
    </Modal>
  );
};
