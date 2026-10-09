import React from "react";
import type { Product } from "../../db/schema";
import { formatRupiah } from "../../lib/money";
import { t } from "../../i18n";

export interface ProductTileProps {
  product: Product;
  cartQty?: number;
  onSelect: (product: Product) => void;
}

export const ProductTile: React.FC<ProductTileProps> = ({ product, cartQty = 0, onSelect }) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= product.lowStockThreshold;

  return (
    <button
      type="button"
      disabled={isOutOfStock}
      onClick={() => onSelect(product)}
      className={`relative min-h-[104px] p-4 flex flex-col justify-between text-left rounded-[var(--radius-control)] border transition-colors select-none ${
        isOutOfStock
          ? "bg-[var(--surface)] border-[var(--border)] opacity-50 cursor-not-allowed"
          : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)] active:bg-[var(--primary-soft)] cursor-pointer"
      } focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2`}
      aria-label={`${product.name}, ${formatRupiah(product.price)}, ${
        isOutOfStock ? t("cashier.outOfStock") : t("cashier.stock", { count: product.stock })
      }`}
    >
      {/* Top Header: Name and optional in-cart marker (xN) */}
      <div className="flex items-start justify-between gap-2 w-full">
        <span className="font-medium text-base text-[var(--text)] line-clamp-2 leading-snug">
          {product.name}
        </span>
        {cartQty > 0 && (
          <span
            className="shrink-0 text-sm font-bold text-[var(--primary)] tabular-nums"
            aria-label={`Dalam pesanan ${cartQty}`}
          >
            x{cartQty}
          </span>
        )}
      </div>

      {/* Bottom Footer: Price & Stock Pattern */}
      <div className="mt-3 flex items-baseline justify-between gap-2 w-full">
        <span className="font-semibold text-base text-[var(--primary)] tabular-nums">
          {formatRupiah(product.price)}
        </span>

        <span
          className={`text-sm tabular-nums ${
            isOutOfStock
              ? "text-[var(--text-muted)] font-medium"
              : isLowStock
                ? "text-[var(--warning)] font-semibold"
                : "text-[var(--text-muted)]"
          }`}
        >
          {isOutOfStock ? t("cashier.outOfStock") : t("cashier.stock", { count: product.stock })}
        </span>
      </div>
    </button>
  );
};
