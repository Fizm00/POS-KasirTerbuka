import React, { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCartStore } from "./cartStore";
import { DiscountModal } from "./DiscountModal";
import { formatRupiah } from "../../lib/money";
import { t } from "../../i18n";

export interface CartPanelProps {
  onPay?: () => void;
  className?: string;
  onCloseMobile?: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({ onPay, className = "", onCloseMobile }) => {
  const {
    items,
    totals,
    itemCount,
    discount,
    increment,
    decrement,
    removeItem,
    clearCart,
    setDiscount,
  } = useCartStore();

  const [isDiscountOpen, setIsDiscountOpen] = useState(false);

  return (
    <aside
      className={`flex flex-col h-full bg-[var(--surface)] border-l border-[var(--border)] ${className}`}
      aria-label="Panel keranjang pesanan"
    >
      {/* Header: Title, Item Count, and Clear Button */}
      <div className="min-h-[56px] px-4 py-3 border-b border-[var(--border)] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-lg text-[var(--text)]">{t("cart.title")}</h2>
          {itemCount > 0 && (
            <span className="text-sm text-[var(--text-muted)] tabular-nums">
              ({itemCount} item)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="min-h-[48px] px-2 text-sm font-medium text-[var(--danger)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--danger)] rounded-[var(--radius-control)] cursor-pointer"
            >
              {t("cart.clear")}
            </button>
          )}

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden min-h-[48px] px-3 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border)]"
            >
              {t("cart.closeOrder")}
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List (Scrollable) */}
      <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)] p-4 space-y-3">
        {items.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
            <ShoppingBag className="w-12 h-12 mb-3 stroke-1 text-[var(--border-strong)]" />
            <p className="font-medium text-base text-[var(--text)]">{t("cart.emptyTitle")}</p>
            <p className="text-sm mt-1 max-w-[240px]">{t("cart.emptySubtitle")}</p>
          </div>
        ) : (
          items.map(({ product, qty, subtotal }) => {
            const isAtMaxStock = qty >= product.stock;

            return (
              <div key={product.id} className="pt-3 first:pt-0 pb-1 flex flex-col gap-2">
                {/* Row 1: Product Name & Line Total */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-base text-[var(--text)] line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                    <span className="text-sm text-[var(--text-muted)] tabular-nums">
                      {t("cart.unitPrice", { price: formatRupiah(product.price) })}
                    </span>
                  </div>

                  <span className="font-semibold text-base tabular-nums text-[var(--text)] shrink-0">
                    {formatRupiah(subtotal)}
                  </span>
                </div>

                {/* Row 2: Quantity Stepper & Remove Button */}
                <div className="flex items-center justify-between gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => decrement(product.id)}
                      aria-label={`Kurangi kuantitas ${product.name}`}
                      className="w-12 h-12 inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--bg)] active:bg-[var(--border)] cursor-pointer text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <span
                      aria-label={`Jumlah ${qty}`}
                      className="min-w-[40px] text-center font-semibold text-base tabular-nums text-[var(--text)]"
                    >
                      {qty}
                    </span>

                    <button
                      type="button"
                      disabled={isAtMaxStock}
                      onClick={() => increment(product.id)}
                      aria-label={`Tambah kuantitas ${product.name}`}
                      className={`w-12 h-12 inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] ${
                        isAtMaxStock
                          ? "opacity-40 cursor-not-allowed bg-[var(--bg)]"
                          : "hover:bg-[var(--bg)] active:bg-[var(--border)] cursor-pointer"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(product.id)}
                    aria-label={`Hapus ${product.name} dari pesanan`}
                    className="w-12 h-12 inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:border-[var(--danger)] active:bg-[var(--danger-soft)] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[var(--danger)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Stock limit helper text */}
                {isAtMaxStock && (
                  <p className="text-xs text-[var(--warning)] font-medium">
                    {t("cart.stockLimit")} ({product.stock})
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pinned Footer */}
      <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] space-y-3 shrink-0">
        {/* Subtotal */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-[var(--text-muted)]">{t("cart.subtotal")}</span>
          <span className="font-medium text-[var(--text)] tabular-nums">
            {formatRupiah(totals.subtotal)}
          </span>
        </div>

        {/* Discount row */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)]">{t("cart.discount")}</span>
            <button
              type="button"
              onClick={() => setIsDiscountOpen(true)}
              className="min-h-[48px] py-3 inline-flex items-center text-xs font-medium text-[var(--primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--primary)] rounded cursor-pointer"
            >
              {t("cart.setDiscount")}
            </button>
          </div>
          <span
            className={`font-medium tabular-nums ${
              totals.discount > 0 ? "text-[var(--primary)]" : "text-[var(--text)]"
            }`}
          >
            {totals.discount > 0 ? `- ${formatRupiah(totals.discount)}` : formatRupiah(0)}
          </span>
        </div>

        {/* Total row at 32px bold */}
        <div className="pt-2 border-t border-[var(--border)] flex justify-between items-baseline">
          <span className="font-semibold text-lg text-[var(--text)]">{t("cart.total")}</span>
          <span
            data-testid="cart-total-amount"
            className="text-[32px] font-bold text-[var(--text)] tabular-nums tracking-tight leading-none"
            aria-live="polite"
          >
            {formatRupiah(totals.total)}
          </span>
        </div>

        {/* Primary Pay Button: 56px height with F9 shortcut hint */}
        <button
          type="button"
          disabled={items.length === 0}
          onClick={onPay}
          data-testid="pay-button"
          className={`w-full min-h-[56px] h-[56px] px-6 rounded-[var(--radius-control)] font-semibold text-lg inline-flex items-center justify-center gap-3 transition-colors select-none ${
            items.length === 0
              ? "bg-[var(--border-strong)] text-[var(--text-muted)] opacity-50 cursor-not-allowed"
              : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:opacity-90 cursor-pointer shadow-none"
          } focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2`}
        >
          <span>{t("cart.payButton", { total: formatRupiah(totals.total) })}</span>
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono rounded bg-white/20 text-white">
            {t("cart.f9Hint")}
          </kbd>
        </button>
      </div>

      {/* Discount modal */}
      {isDiscountOpen && (
        <DiscountModal
          isOpen={isDiscountOpen}
          onClose={() => setIsDiscountOpen(false)}
          subtotal={totals.subtotal}
          currentDiscount={discount}
          onApply={(disc) => setDiscount(disc)}
        />
      )}
    </aside>
  );
};
