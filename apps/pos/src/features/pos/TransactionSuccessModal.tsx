import React, { useState } from "react";
import { CheckCircle2, Printer, Plus } from "lucide-react";
import type { StoreSettings, Transaction } from "../../db/schema";
import { buildReceiptModel, formatPaymentMethodName } from "../../printing/receipt";
import { Receipt } from "../../printing/ReceiptPreview";
import { formatRupiah } from "../../lib/money";
import { printerService } from "../../printing/printerService";
import { t } from "../../i18n";

export interface TransactionSuccessModalProps {
  isOpen: boolean;
  transaction: Transaction;
  settings: StoreSettings;
  cashierName?: string;
  onNewTransaction: () => void;
}

export const TransactionSuccessModal: React.FC<TransactionSuccessModalProps> = ({
  isOpen,
  transaction,
  settings,
  cashierName = "Kasir",
  onNewTransaction,
}) => {
  const [printError, setPrintError] = useState<string | null>(null);

  if (!isOpen) return null;

  const receiptModel = buildReceiptModel({
    transaction,
    settings,
    cashierName,
    paperWidth: settings.paperWidth || 58,
  });

  const handlePrint = async () => {
    setPrintError(null);
    const res = await printerService.printReceipt(transaction, {
      cashierName,
      customSettings: settings,
    });
    if (!res.success) {
      setPrintError(res.error || t("success.printError"));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay-bg)]"
    >
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-modal)] shadow-[var(--shadow-modal)] w-full max-w-4xl max-h-[92vh] flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Confirmation & Actions */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[var(--border)] overflow-y-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-[var(--primary)] shrink-0" />
              <div>
                <h2
                  id="success-dialog-title"
                  className="text-2xl font-semibold text-[var(--text)] tracking-tight"
                >
                  {t("success.title")}
                </h2>
                <p className="text-sm text-[var(--text-muted)] font-mono mt-0.5">
                  {transaction.invoiceNo}
                </p>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-[var(--bg)] rounded-[var(--radius-control)] p-4 space-y-3 text-base">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">{t("success.total")}</span>
                <span className="font-bold text-xl tabular-nums text-[var(--text)]">
                  {formatRupiah(transaction.total)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm pt-2 border-t border-[var(--border)]">
                <span className="text-[var(--text-muted)]">{t("success.paymentMethod")}</span>
                <span className="font-medium text-[var(--text)]">
                  {formatPaymentMethodName(transaction.paymentMethod)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-muted)]">{t("success.amountPaid")}</span>
                <span className="font-medium tabular-nums text-[var(--text)]">
                  {formatRupiah(transaction.amountPaid)}
                </span>
              </div>

              {transaction.change > 0 && (
                <div className="flex justify-between items-center text-sm font-semibold text-[var(--primary)] pt-1">
                  <span>{t("success.change")}</span>
                  <span className="tabular-nums">{formatRupiah(transaction.change)}</span>
                </div>
              )}
            </div>

            {/* Print Error if any */}
            {printError && (
              <div
                role="alert"
                className="p-3 bg-[var(--danger-soft)] text-[var(--danger)] text-sm rounded-[var(--radius-control)] border border-[var(--danger)] flex justify-between items-center"
              >
                <span>{printError}</span>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="text-xs font-semibold underline cursor-pointer"
                >
                  {t("success.retryPrint")}
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-6 space-y-3">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full min-h-[48px] px-5 rounded-[var(--radius-control)] bg-[var(--primary)] text-white font-medium inline-flex items-center justify-center gap-2 hover:bg-[var(--primary-hover)] active:opacity-90 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
            >
              <Printer className="w-5 h-5" />
              <span>{t("success.printReceipt")}</span>
            </button>

            <button
              type="button"
              onClick={onNewTransaction}
              className="w-full min-h-[48px] px-5 rounded-[var(--radius-control)] bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] font-medium inline-flex items-center justify-center gap-2 hover:bg-[var(--bg)] active:bg-[var(--border)] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
            >
              <Plus className="w-5 h-5" />
              <span>{t("success.newTransaction")}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Receipt Preview */}
        <div className="w-full md:w-[380px] p-6 bg-[var(--bg)] flex flex-col items-center justify-start overflow-y-auto max-h-[400px] md:max-h-[92vh]">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            {t("success.previewTitle")}
          </span>
          <Receipt model={receiptModel} />
        </div>
      </div>
    </div>
  );
};
