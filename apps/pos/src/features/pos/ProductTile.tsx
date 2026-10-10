import React from "react";
import type { Category, Product } from "../../db/schema";
import { formatRupiah } from "../../lib/money";
import { getCategoryColor, getProductInitials } from "../../lib/categoryColors";
import { t } from "../../i18n";

export interface ProductTileProps {
  product: Product;
  category?: Category;
  cartQty?: number;
  imageUrl?: string | null;
  mode?: "photo" | "compact";
  onSelect: (product: Product) => void;
}

export const ProductTile: React.FC<ProductTileProps> = ({
  product,
  category,
  cartQty = 0,
  imageUrl,
  mode = "compact",
  onSelect,
}) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= product.lowStockThreshold;
  const palette = getCategoryColor(product.categoryId, category?.name);
  const initials = getProductInitials(product.name);

  const ariaLabel = `${product.name}, ${formatRupiah(product.price)}, ${
    isOutOfStock ? t("cashier.outOfStock") : t("cashier.stock", { count: product.stock })
  }`;

  if (mode === "photo") {
    return (
      <button
        type="button"
        disabled={isOutOfStock}
        onClick={() => onSelect(product)}
        className={`relative flex flex-col text-left rounded-[var(--radius-control)] border transition-colors select-none overflow-hidden ${
          isOutOfStock
            ? "bg-[var(--surface)] border-[var(--border)] opacity-50 cursor-not-allowed"
            : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)] active:bg-[var(--primary-soft)] cursor-pointer"
        } focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2`}
        aria-label={ariaLabel}
      >
        {/* 1:1 Square Media Area */}
        <div
          className="w-full aspect-square relative overflow-hidden flex items-center justify-center font-bold text-2xl select-none"
          style={{
            backgroundColor: palette.soft,
            color: palette.main,
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}

          {/* In-cart marker */}
          {cartQty > 0 && (
            <span
              className="absolute top-2 right-2 bg-[var(--surface)]/95 border border-[var(--primary)] text-[var(--primary)] text-xs font-bold px-2 py-0.5 rounded-full shadow-sm tabular-nums"
              aria-label={`Dalam pesanan ${cartQty}`}
            >
              x{cartQty}
            </span>
          )}
        </div>

        {/* Content Area */}
        <div className="p-3 flex flex-col justify-between flex-1 gap-2 w-full">
          <span className="font-medium text-[15px] text-[var(--text)] line-clamp-2 leading-snug">
            {product.name}
          </span>

          <div className="flex items-baseline justify-between gap-2 mt-auto w-full">
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
              {isOutOfStock
                ? t("cashier.outOfStock")
                : t("cashier.stock", { count: product.stock })}
            </span>
          </div>
        </div>
      </button>
    );
  }

  // Compact list mode
  return (
    <button
      type="button"
      disabled={isOutOfStock}
      onClick={() => onSelect(product)}
      className={`relative min-h-[52px] p-3 px-3.5 flex items-center justify-between gap-3 text-left rounded-[var(--radius-control)] border transition-colors select-none ${
        isOutOfStock
          ? "bg-[var(--surface)] border-[var(--border)] opacity-50 cursor-not-allowed"
          : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)] active:bg-[var(--primary-soft)] cursor-pointer"
      } focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2`}
      aria-label={ariaLabel}
    >
      {/* Left: Category color indicator bar (4x24px) + Name + SKU */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="w-1 h-6 min-w-1 min-h-6 rounded-full shrink-0"
          style={{ backgroundColor: palette.main }}
          aria-hidden="true"
        />
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-[15px] text-[var(--text)] truncate">
            {product.name}
          </span>
          <span className="text-[13px] text-[var(--text-muted)] tabular-nums truncate">
            {product.sku}
          </span>
        </div>
      </div>

      {/* Center: Stock text */}
      <div className="shrink-0 text-right">
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

      {/* Right: In-cart marker + Tabular Price */}
      <div className="shrink-0 flex items-center gap-2 text-right">
        {cartQty > 0 && (
          <span
            className="text-xs font-bold text-[var(--primary)] tabular-nums px-1.5 py-0.5 rounded bg-[var(--primary-soft)]"
            aria-label={`Dalam pesanan ${cartQty}`}
          >
            x{cartQty}
          </span>
        )}
        <span className="font-bold text-base text-[var(--primary)] tabular-nums">
          {formatRupiah(product.price)}
        </span>
      </div>
    </button>
  );
};
