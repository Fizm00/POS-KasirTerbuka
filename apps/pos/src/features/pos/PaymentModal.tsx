import React, { useState } from "react";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { SegmentedControl } from "../../components/SegmentedControl";
import type { PaymentMethod } from "../../db/schema";
import { formatDigits, formatRupiah, parseRupiah } from "../../lib/money";
import { calculateChange } from "../../lib/transactions";
import { getQuickAmounts } from "./paymentUtils";
import { t } from "../../i18n";

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirmPayment: (method: PaymentMethod, amountPaid: number) => Promise<void>;
  stockError?: string | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  onConfirmPayment,
  stockError,
}) => {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [inputValue, setInputValue] = useState<string>(() =>
    total > 0 ? formatDigits(total) : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const numericAmountPaid = method === "cash" ? parseRupiah(inputValue) : total;

  const { change, isSufficient } = calculateChange(total, numericAmountPaid);
  const deficit = total - numericAmountPaid;

  const quickAmounts = getQuickAmounts(total);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isSufficient && method === "cash") {
      return;
    }

    try {
      setIsSubmitting(true);
      setLocalError(null);
      await onConfirmPayment(method, numericAmountPaid);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLocalError(err.message);
      } else {
        setLocalError("Terjadi kesalahan saat memproses pembayaran.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorMessage = stockError || localError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("payment.title")}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={(!isSufficient && method === "cash") || isSubmitting}
            isLoading={isSubmitting}
          >
            {t("payment.completeSale")}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Total Amount Header */}
        <div className="p-4 bg-[var(--bg)] rounded-[var(--radius-control)] flex flex-col items-center justify-center text-center">
          <span className="text-sm font-medium text-[var(--text-muted)]">{t("cart.total")}</span>
          <span className="text-3xl font-bold text-[var(--text)] tabular-nums mt-0.5">
            {formatRupiah(total)}
          </span>
        </div>

        {/* Payment Method Segmented Control */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--text)]">
            {t("success.paymentMethod")}
          </label>
          <SegmentedControl<PaymentMethod>
            value={method}
            onChange={(m) => {
              setMethod(m);
              if (m !== "cash") {
                setInputValue(formatDigits(total));
              }
              setLocalError(null);
            }}
            options={[
              { value: "cash", label: t("payment.methodCash") },
              { value: "qris", label: t("payment.methodQris") },
              { value: "transfer", label: t("payment.methodTransfer") },
            ]}
          />
        </div>

        {/* Cash Payment Flow */}
        {method === "cash" ? (
          <div className="space-y-3">
            {/* Amount Paid Input */}
            <Input
              id="amount-paid-input"
              label={t("payment.amountReceived")}
              prefix="Rp"
              value={inputValue}
              error={
                !isSufficient && numericAmountPaid > 0
                  ? t("payment.insufficientCash", {
                      deficit: formatRupiah(deficit),
                    })
                  : undefined
              }
              onChange={(e) => {
                const parsed = parseRupiah(e.target.value);
                setInputValue(parsed > 0 ? formatDigits(parsed) : "");
                setLocalError(null);
              }}
            />

            {/* Quick Bill Amount Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {quickAmounts.map((amt) => {
                const isExact = amt === total;
                const isSelected = numericAmountPaid === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setInputValue(formatDigits(amt));
                      setLocalError(null);
                    }}
                    className={`min-h-[48px] px-3.5 py-2 rounded-[var(--radius-control)] border text-sm font-medium transition-colors select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--primary)] ${
                      isSelected
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-[var(--surface)] text-[var(--text)] border-[var(--border-strong)] hover:bg-[var(--bg)]"
                    }`}
                  >
                    {isExact
                      ? `${t("payment.exactAmount")} (${formatDigits(amt)})`
                      : formatDigits(amt)}
                  </button>
                );
              })}
            </div>

            {/* Change Row (Highlighted) */}
            <div
              className={`p-3.5 rounded-[var(--radius-control)] border flex justify-between items-center ${
                change > 0
                  ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]"
                  : "bg-[var(--surface)] border-[var(--border)] text-[var(--text)]"
              }`}
            >
              <span className="font-semibold text-base">{t("payment.change")}</span>
              <span className="font-bold text-xl tabular-nums">{formatRupiah(change)}</span>
            </div>
          </div>
        ) : (
          /* QRIS and Transfer manual recording note */
          <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-control)] space-y-2">
            <p className="text-sm text-[var(--text-muted)] italic">
              {t("payment.manualRecordNote")}
            </p>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-[var(--border)]">
              <span className="text-[var(--text-muted)]">{t("payment.amountReceived")}</span>
              <span className="font-semibold tabular-nums text-[var(--text)]">
                {formatRupiah(total)}
              </span>
            </div>
          </div>
        )}

        {/* Stock / System Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-3 bg-[var(--danger-soft)] text-[var(--danger)] text-sm font-medium rounded-[var(--radius-control)] border border-[var(--danger)]"
          >
            {errorMessage}
          </div>
        )}
      </form>
    </Modal>
  );
};
