import React, { useState } from "react";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { SegmentedControl } from "../../components/SegmentedControl";
import type { DiscountInput, DiscountType } from "../../lib/transactions";
import { formatDigits, formatRupiah, parseRupiah } from "../../lib/money";
import { t } from "../../i18n";

export interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  currentDiscount: DiscountInput | null;
  onApply: (discount: DiscountInput | null) => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  currentDiscount,
  onApply,
}) => {
  const [type, setType] = useState<DiscountType>(currentDiscount?.type ?? "nominal");
  const [inputValue, setInputValue] = useState<string>(() => {
    if (!currentDiscount) return "";
    return currentDiscount.type === "nominal"
      ? currentDiscount.value > 0
        ? formatDigits(currentDiscount.value)
        : ""
      : String(currentDiscount.value);
  });
  const [error, setError] = useState<string | null>(null);

  const handleTypeChange = (newType: DiscountType) => {
    setType(newType);
    setInputValue("");
    setError(null);
  };

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const numericValue = type === "nominal" ? parseRupiah(inputValue) : parseFloat(inputValue) || 0;

    if (numericValue < 0) {
      setError(t("discount.errorNegative"));
      return;
    }

    if (type === "percent") {
      if (numericValue > 100) {
        setError(t("discount.errorPercentMax"));
        return;
      }
    } else {
      if (numericValue > subtotal) {
        setError(t("discount.errorNominalMax"));
        return;
      }
    }

    if (numericValue === 0) {
      onApply(null);
    } else {
      onApply({
        type,
        value: numericValue,
      });
    }

    onClose();
  };

  const handleRemove = () => {
    onApply(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("discount.title")}
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {currentDiscount && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-sm font-medium text-[var(--danger)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--danger)] rounded-[var(--radius-control)] p-1 cursor-pointer"
              >
                {t("discount.remove")}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={handleApply}>
              {t("discount.apply")}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleApply} className="space-y-4">
        {/* Subtotal reference */}
        <div className="p-3 bg-[var(--bg)] rounded-[var(--radius-control)] flex justify-between items-center text-sm">
          <span className="text-[var(--text-muted)]">{t("cart.subtotal")}</span>
          <span className="font-semibold tabular-nums text-[var(--text)]">
            {formatRupiah(subtotal)}
          </span>
        </div>

        {/* Discount Type Selector */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--text)]">Tipe diskon</label>
          <SegmentedControl<DiscountType>
            value={type}
            onChange={handleTypeChange}
            options={[
              { value: "nominal", label: t("discount.typeNominal") },
              { value: "percent", label: t("discount.typePercent") },
            ]}
          />
        </div>

        {/* Amount Input */}
        {type === "nominal" ? (
          <Input
            id="discount-nominal-input"
            label={t("discount.nominalLabel")}
            prefix="Rp"
            value={inputValue}
            placeholder={t("discount.nominalPlaceholder")}
            error={error || undefined}
            onChange={(e) => {
              const parsed = parseRupiah(e.target.value);
              setInputValue(parsed > 0 ? formatDigits(parsed) : "");
              setError(null);
            }}
          />
        ) : (
          <Input
            id="discount-percent-input"
            label={t("discount.percentLabel")}
            type="number"
            min={0}
            max={100}
            step="1"
            value={inputValue}
            placeholder={t("discount.percentPlaceholder")}
            error={error || undefined}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
            }}
          />
        )}
      </form>
    </Modal>
  );
};
