import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../../components/Button";
import { productsRepo } from "../../db/repositories/productsRepo";
import {
  stockMovementsRepo,
  type StockInItemInput,
} from "../../db/repositories/stockMovementsRepo";
import { useAuthStore } from "../auth/authStore";
import type { Product } from "../../db/schema";
import { t } from "../../i18n";
import { formatRupiah } from "../../lib/money";

interface BulkEntryItem {
  product: Product;
  qty: number;
  cost: number | "";
}

export const BulkStockInPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<BulkEntryItem[]>([]);
  const [generalNote, setGeneralNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load all active products for search & selection
  useEffect(() => {
    let isMounted = true;
    productsRepo.getAll().then((list) => {
      if (isMounted) {
        setProducts(list.filter((p) => p.isActive));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter products based on search query
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 8);
  }, [products, searchQuery]);

  // Add product to bulk entry list
  const handleAddProduct = (product: Product) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          product,
          qty: 1,
          cost: product.cost > 0 ? product.cost : "",
        },
      ];
    });
    setSearchQuery("");
  };

  // Remove product from bulk entry list
  const handleRemoveItem = (productId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Update quantity for a selected item
  const handleQtyChange = (productId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, qty: isNaN(parsed) ? 1 : Math.max(1, parsed) }
          : item
      )
    );
  };

  // Update cost for a selected item
  const handleCostChange = (productId: string, val: string) => {
    const cleaned = val.replace(/\D/g, "");
    const parsed = cleaned ? parseInt(cleaned, 10) : "";
    setSelectedItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, cost: parsed } : item))
    );
  };

  // Totals summary
  const totalUnits = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.qty, 0);
  }, [selectedItems]);

  // Submit bulk stock in
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedItems.length === 0) {
      setError("Pilih minimal satu produk untuk barang masuk.");
      return;
    }

    const payload: StockInItemInput[] = selectedItems.map((item) => ({
      productId: item.product.id,
      qty: item.qty,
      cost: typeof item.cost === "number" && item.cost >= 0 ? item.cost : undefined,
    }));

    try {
      setIsSubmitting(true);
      await stockMovementsRepo.recordBulkStockIn(
        payload,
        generalNote.trim() || undefined,
        currentUser?.id || "unknown"
      );
      navigate("/produk");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan barang masuk massal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header with back button */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/produk")}
            aria-label={t("bulkStockIn.backToProducts")}
            className="p-2 min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
              {t("bulkStockIn.title")}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{t("bulkStockIn.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Product Search & Quick Add */}
      <div className="relative bg-[var(--surface)] p-4 border border-[var(--border)] rounded-[var(--radius-control)]">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("bulkStockIn.searchPlaceholder")}
            className="w-full h-12 pl-10 pr-4 rounded-[var(--radius-control)] border border-[var(--border-strong)] text-base text-[var(--text)] bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2"
          />
        </div>

        {/* Dropdown search results */}
        {searchResults.length > 0 && (
          <ul className="absolute left-4 right-4 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-control)] shadow-[var(--shadow-modal)] z-20 max-h-60 overflow-y-auto divide-y divide-[var(--border)]">
            {searchResults.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => handleAddProduct(p)}
                  className="w-full text-left p-3 hover:bg-[var(--primary-soft)] transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="font-semibold text-sm text-[var(--text)] block">{p.name}</span>
                    <span className="text-xs text-[var(--text-muted)] tabular-nums">
                      SKU: {p.sku}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-muted)] tabular-nums">
                      Stok: {p.stock}
                    </span>
                    <span className="text-xs text-[var(--primary)] font-medium flex items-center gap-1">
                      <Plus className="w-4 h-4" /> Tambah
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected Products Table */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-[var(--danger-soft)] text-[var(--danger)] text-sm rounded-[var(--radius-control)] border border-[var(--danger)]">
            {error}
          </div>
        )}

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-control)] overflow-hidden">
          {selectedItems.length === 0 ? (
            <div className="text-center py-16 p-6 text-[var(--text-muted)] text-sm">
              {t("bulkStockIn.emptyList")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg)] border-b border-[var(--border)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{t("bulkStockIn.table.product")}</th>
                    <th className="py-3 px-4 text-right">{t("bulkStockIn.table.currentStock")}</th>
                    <th className="py-3 px-4 text-center w-36">{t("bulkStockIn.table.qty")}</th>
                    <th className="py-3 px-4 text-right w-44">{t("bulkStockIn.table.cost")}</th>
                    <th className="py-3 px-4 text-center w-20">{t("bulkStockIn.table.action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {selectedItems.map((item) => (
                    <tr key={item.product.id} className="hover:bg-[var(--bg)] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-sm text-[var(--text)]">
                          {item.product.name}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] tabular-nums">
                          SKU: {item.product.sku}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium tabular-nums text-[var(--text)]">
                        {item.product.stock}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.qty}
                          onChange={(e) => handleQtyChange(item.product.id, e.target.value)}
                          className="w-24 h-10 text-center rounded-[var(--radius-control)] border border-[var(--border-strong)] text-base font-semibold tabular-nums text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.cost === "" ? "" : formatRupiah(item.cost)}
                          onChange={(e) => handleCostChange(item.product.id, e.target.value)}
                          placeholder={formatRupiah(item.product.cost)}
                          className="w-36 h-10 text-right pr-3 rounded-[var(--radius-control)] border border-[var(--border-strong)] text-sm tabular-nums text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.product.id)}
                          aria-label={`Hapus ${item.product.name}`}
                          className="p-2 text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-[var(--radius-control)] cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* General Note and Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--surface)] p-5 border border-[var(--border)] rounded-[var(--radius-control)]">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              {t("bulkStockIn.generalNote")}
            </label>
            <input
              type="text"
              value={generalNote}
              onChange={(e) => setGeneralNote(e.target.value)}
              placeholder={t("bulkStockIn.generalNotePlaceholder")}
              className="w-full h-12 px-3 rounded-[var(--radius-control)] border border-[var(--border-strong)] text-base text-[var(--text)] bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2"
            />
          </div>

          <div className="flex flex-col justify-end items-end space-y-1">
            <div className="text-sm text-[var(--text-muted)]">
              {t("bulkStockIn.summary.totalItems", { count: selectedItems.length })}
            </div>
            <div className="text-xl font-bold text-[var(--text)] tabular-nums">
              {t("bulkStockIn.summary.totalUnits", { count: totalUnits })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/produk")}
            disabled={isSubmitting}
          >
            {t("bulkStockIn.cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={selectedItems.length === 0}
            isLoading={isSubmitting}
          >
            {t("bulkStockIn.submit")}
          </Button>
        </div>
      </form>
    </main>
  );
};
