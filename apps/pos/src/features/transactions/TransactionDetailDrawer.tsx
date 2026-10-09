import React, { useState } from "react";
import { Drawer } from "../../components/Drawer";
import { Button } from "../../components/Button";
import { Printer, AlertOctagon } from "lucide-react";
import type { StoreSettings, Transaction } from "../../db/schema";
import { formatRupiah } from "../../lib/money";
import { printerService } from "../../printing/printerService";
import {
  buildReceiptModel,
  formatPaymentMethodName,
  formatReceiptDateTime,
} from "../../printing/receipt";
import { Receipt } from "../../printing/ReceiptPreview";
import { VoidConfirmModal } from "./VoidConfirmModal";
import { t } from "../../i18n";

export interface TransactionDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  settings: StoreSettings | null;
  canVoid: boolean;
  cashierName?: string;
  onVoidSuccess: (updatedTx: Transaction) => void;
  onVoidConfirm: (txId: string, reason: string) => Promise<Transaction>;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  isOpen,
  onClose,
  transaction,
  settings,
  canVoid,
  cashierName = "Kasir",
  onVoidSuccess,
  onVoidConfirm,
}) => {
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

  if (!isOpen || !transaction) return null;

  const isVoided = transaction.status === "void";
  const dateTime = formatReceiptDateTime(transaction.createdAt);

  const receiptModel = settings
    ? buildReceiptModel({
        transaction,
        settings,
        cashierName,
        paperWidth: settings.paperWidth || 58,
      })
    : null;

  const handleReprint = async () => {
    await printerService.printReceipt(transaction, {
      cashierName,
      customSettings: settings || undefined,
    });
  };

  const handleVoidConfirm = async (reason: string) => {
    const updated = await onVoidConfirm(transaction.id, reason);
    onVoidSuccess(updated);
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`${t("transactionDetail.title")} (${transaction.invoiceNo})`}
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <Button
              variant="secondary"
              onClick={handleReprint}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>{t("transactionDetail.reprintReceipt")}</span>
            </Button>

            {canVoid && !isVoided && (
              <Button
                variant="destructive"
                onClick={() => setIsVoidModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>{t("transactionDetail.voidTransaction")}</span>
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          {/* Status Alert if Voided */}
          {isVoided && (
            <div
              role="alert"
              className="p-4 bg-[var(--danger-soft)] text-[var(--danger)] rounded-[var(--radius-control)] border border-[var(--danger)] space-y-2 text-sm"
            >
              <div className="flex items-center gap-2 font-semibold text-base">
                <AlertOctagon className="w-5 h-5" />
                <span>{t("history.statusVoid")}</span>
              </div>
              <div className="space-y-1 pt-1 border-t border-[var(--danger)]/30 text-xs sm:text-sm">
                {transaction.voidedBy && (
                  <p>
                    <span className="font-medium">{t("transactionDetail.voidedBy")}: </span>
                    {transaction.voidedBy}
                  </p>
                )}
                {transaction.voidedAt && (
                  <p>
                    <span className="font-medium">{t("transactionDetail.voidedAt")}: </span>
                    {formatReceiptDateTime(transaction.voidedAt).full}
                  </p>
                )}
                {transaction.voidReason && (
                  <p>
                    <span className="font-medium">{t("transactionDetail.voidReason")}: </span>
                    {transaction.voidReason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* General Metadata */}
          <div className="p-4 bg-[var(--bg)] rounded-[var(--radius-control)] space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">{t("history.table.invoiceNo")}</span>
              <span className="font-mono font-medium text-[var(--text)]">
                {transaction.invoiceNo}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">{t("history.table.time")}</span>
              <span className="tabular-nums text-[var(--text)] font-medium">{dateTime.full}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">{t("history.table.cashier")}</span>
              <span className="text-[var(--text)] font-medium">{cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">{t("history.table.paymentMethod")}</span>
              <span className="text-[var(--text)] font-medium">
                {formatPaymentMethodName(transaction.paymentMethod)}
              </span>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base text-[var(--text)]">
              {t("transactionDetail.itemsTitle")}
            </h3>
            <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {transaction.items.map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  className="py-3 flex justify-between items-start text-sm"
                >
                  <div>
                    <p className="font-medium text-[var(--text)]">{item.name}</p>
                    <p className="text-xs text-[var(--text-muted)] tabular-nums">
                      {item.qty} x {formatRupiah(item.price)}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums text-[var(--text)]">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 text-sm pt-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">{t("cart.subtotal")}</span>
              <span className="tabular-nums font-medium text-[var(--text)]">
                {formatRupiah(transaction.subtotal)}
              </span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-[var(--primary)] font-medium">
                <span>{t("cart.discount")}</span>
                <span className="tabular-nums">- {formatRupiah(transaction.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-[var(--text)] pt-2 border-t border-[var(--border)]">
              <span>{t("cart.total")}</span>
              <span className="tabular-nums">{formatRupiah(transaction.total)}</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--text-muted)]">
              <span>{t("success.amountPaid")}</span>
              <span className="tabular-nums text-[var(--text)] font-medium">
                {formatRupiah(transaction.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-[var(--text-muted)]">
              <span>{t("success.change")}</span>
              <span className="tabular-nums text-[var(--text)] font-medium">
                {formatRupiah(transaction.change)}
              </span>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Hidden print container for reprinting */}
      {receiptModel && (
        <div className="hidden">
          <Receipt model={receiptModel} />
        </div>
      )}

      {/* Void Confirmation Modal */}
      {isVoidModalOpen && (
        <VoidConfirmModal
          isOpen={isVoidModalOpen}
          onClose={() => setIsVoidModalOpen(false)}
          invoiceNo={transaction.invoiceNo}
          onConfirmVoid={handleVoidConfirm}
        />
      )}
    </>
  );
};
