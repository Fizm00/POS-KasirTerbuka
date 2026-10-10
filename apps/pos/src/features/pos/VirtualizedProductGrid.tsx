import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Product } from "../../db/schema";
import { ProductTile } from "./ProductTile";

export interface VirtualizedProductGridProps {
  products: Product[];
  categories: Category[];
  thumbnails: Record<string, string>;
  viewMode: "photo" | "compact";
  getItemQty: (productId: string) => number;
  onSelect: (product: Product) => void;
  onRequestThumbnails?: (productIds: string[]) => void;
}

const VIRTUALIZATION_THRESHOLD = 200;
const OVERSCAN_ROWS = 2;

export const VirtualizedProductGrid: React.FC<VirtualizedProductGridProps> = ({
  products,
  categories,
  thumbnails,
  viewMode,
  getItemQty,
  onSelect,
  onRequestThumbnails,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Track container dimensions with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateDimensions = () => {
      setDimensions({
        width: el.clientWidth || 800,
        height: el.clientHeight || 600,
      });
    };

    updateDimensions();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => {
        updateDimensions();
      });
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const gap = 12;
  const numColumns = viewMode === "compact" ? 1 : dimensions.width >= 768 ? 3 : 2;
  const tileWidth = Math.max(120, (dimensions.width - 32 - gap * (numColumns - 1)) / numColumns);
  const rowHeight = viewMode === "compact" ? 60 : Math.round(tileWidth + 88 + gap);

  const totalRows = Math.ceil(products.length / numColumns);
  const totalHeight = totalRows * rowHeight;

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN_ROWS);
  const endRow = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + dimensions.height) / rowHeight) + OVERSCAN_ROWS
  );

  // Request thumbnails for newly visible items if requested
  useEffect(() => {
    if (
      !onRequestThumbnails ||
      viewMode !== "photo" ||
      products.length <= VIRTUALIZATION_THRESHOLD
    ) {
      return;
    }
    const startIndex = startRow * numColumns;
    const endIndex = Math.min(products.length, (endRow + 1) * numColumns);
    const visibleProducts = products.slice(startIndex, endIndex);
    const missingIds = visibleProducts
      .filter((p) => thumbnails[p.id] === undefined)
      .map((p) => p.id);

    if (missingIds.length > 0) {
      onRequestThumbnails(missingIds);
    }
  }, [startRow, endRow, numColumns, products, thumbnails, viewMode, onRequestThumbnails]);

  // If items are <= 200, render standard non-virtualized grid/list
  if (products.length <= VIRTUALIZATION_THRESHOLD) {
    return (
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4"
        tabIndex={0}
        aria-label="Daftar produk"
      >
        {viewMode === "compact" ? (
          <div className="flex flex-col gap-2">
            {products.map((product) => (
              <ProductTile
                key={product.id}
                product={product}
                category={categoryMap.get(product.categoryId)}
                imageUrl={thumbnails[product.id]}
                mode="compact"
                cartQty={getItemQty(product.id)}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {products.map((product) => (
              <ProductTile
                key={product.id}
                product={product}
                category={categoryMap.get(product.categoryId)}
                imageUrl={thumbnails[product.id]}
                mode="photo"
                cartQty={getItemQty(product.id)}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const visibleRowIndices: number[] = [];
  for (let r = startRow; r <= endRow; r++) {
    visibleRowIndices.push(r);
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4"
      tabIndex={0}
      aria-label="Daftar produk virtual"
    >
      <div style={{ height: `${totalHeight}px`, position: "relative", width: "100%" }}>
        {visibleRowIndices.map((rowIndex) => {
          const rowProducts = products.slice(rowIndex * numColumns, (rowIndex + 1) * numColumns);
          const topOffset = rowIndex * rowHeight;

          return (
            <div
              key={rowIndex}
              style={{
                position: "absolute",
                top: `${topOffset}px`,
                left: 0,
                right: 0,
                height: `${rowHeight - gap}px`,
              }}
              className={
                viewMode === "compact"
                  ? "flex flex-col"
                  : `grid ${numColumns === 3 ? "grid-cols-3" : "grid-cols-2"} gap-3`
              }
            >
              {rowProducts.map((product) => (
                <ProductTile
                  key={product.id}
                  product={product}
                  category={categoryMap.get(product.categoryId)}
                  imageUrl={thumbnails[product.id]}
                  mode={viewMode}
                  cartQty={getItemQty(product.id)}
                  onSelect={onSelect}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
