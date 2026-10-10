import React, { useEffect, useMemo, useState } from "react";
import { Drawer } from "../../components/Drawer";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { SegmentedControl } from "../../components/SegmentedControl";
import { useAuthStore } from "../auth/authStore";
import { stockMovementsRepo } from "../../db/repositories/stockMovementsRepo";
import { usersRepo } from "../../db/repositories/usersRepo";
import type { Product, StockMovement, User } from "../../db/schema";
import { t } from "../../i18n";
import { formatRupiah } from "../../lib/money";
import { formatJakartaDisplayDate } from "../../lib/dates";

export interface ProductStockDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type StockDrawerTab = "stockIn" | "adjust" | "history";

interface ProductStockDrawerContentProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

const ProductStockDrawerContent: React.FC<ProductStockDrawerContentProps> = ({
  product,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<StockDrawerTab>("stockIn");

  // Stock In Form state
  const [inQty, setInQty] = useState<string>("");
  const [inCost, setInCost] = useState<string>(product.cost > 0 ? String(product.cost) : "");
  const [inNote, setInNote] = useState<string>("");
  const [inError, setInError] = useState<string | null>(null);
  const [isSubmittingIn, setIsSubmittingIn] = useState<boolean>(false);

  // Stock Adjustment Form state
  const [actualCount, setActualCount] = useState<string>(String(product.stock));
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState<boolean>(false);

  // History state
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    let isMounted = true;
    Promise.all([stockMovementsRepo.getByProduct(product.id), usersRepo.getUsers()]).then(
      ([movements, uList]) => {
        if (isMounted) {
          setHistory(movements);
          setUsers(uList);
          setIsLoadingHistory(false);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [product.id]);

  const usersMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) {
      map.set(u.id, u.name);
    }
    return map;
  }, [users]);

  // Handle Stock In Submit
  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInError(null);

    const parsedQty = parseInt(inQty, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setInError("Jumlah masuk harus berupa angka lebih dari 0.");
      return;
    }

    let parsedCost: number | undefined = undefined;
    if (inCost.trim()) {
      const c = parseInt(inCost.replace(/\D/g, ""), 10);
      if (!isNaN(c) && c >= 0) {
        parsedCost = c;
      }
    }

    try {
      setIsSubmittingIn(true);
      await stockMovementsRepo.recordStockIn({
        productId: product.id,
        qty: parsedQty,
        cost: parsedCost,
        note: inNote.trim() || undefined,
        userId: currentUser?.id || "unknown",
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setInError(err instanceof Error ? err.message : "Gagal menyimpan barang masuk.");
    } finally {
      setIsSubmittingIn(false);
    }
  };

  // Handle Adjustment Submit
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError(null);

    if (!isAdmin) {
      setAdjustError(t("products.stockDrawer.adminOnlyAdjustment"));
      return;
    }

    const parsedCount = parseInt(actualCount, 10);
    if (isNaN(parsedCount) || parsedCount < 0) {
      setAdjustError("Stok fisik harus berupa angka 0 atau lebih.");
      return;
    }

    if (!adjustReason.trim()) {
      setAdjustError(t("products.stockDrawer.adjustReasonRequired"));
      return;
    }

    try {
      setIsSubmittingAdjust(true);
      await stockMovementsRepo.recordAdjustment({
        productId: product.id,
        actualCount: parsedCount,
        reason: adjustReason.trim(),
        userId: currentUser?.id || "unknown",
        userRole: currentUser?.role,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setAdjustError(err instanceof Error ? err.message : "Gagal menyimpan penyesuaian stok.");
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Difference calculation for adjustment tab
  const parsedActual = parseInt(actualCount, 10);
  const diff = isNaN(parsedActual) ? 0 : parsedActual - product.stock;

  const getTypeLabel = (type: StockMovement["type"]): string => {
    switch (type) {
      case "in":
        return t("products.stockDrawer.historyTable.typeIn");
      case "adjust":
        return t("products.stockDrawer.historyTable.typeAdjust");
      case "sale":
        return t("products.stockDrawer.historyTable.typeSale");
      case "void":
        return t("products.stockDrawer.historyTable.typeVoid");
      default:
        return type;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Current Stock Banner */}
      <div className="bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-control)] p-4 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-medium text-[var(--text-muted)] tracking-wider">
            SKU: <span className="tabular-nums font-semibold">{product.sku}</span>
          </span>
          <div className="text-sm text-[var(--text-muted)] mt-0.5">
            Harga jual: {formatRupiah(product.price)}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase font-medium text-[var(--text-muted)] tracking-wider block">
            Stok saat ini
          </span>
          <span
            className={`text-2xl font-bold tabular-nums ${
              product.stock <= product.lowStockThreshold
                ? "text-[var(--warning)]"
                : "text-[var(--text)]"
            }`}
          >
            {product.stock}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <SegmentedControl<StockDrawerTab>
        value={activeTab}
        onChange={setActiveTab}
        className="w-full"
        options={[
          { value: "stockIn", label: t("products.stockDrawer.tabStockIn") },
          { value: "adjust", label: t("products.stockDrawer.tabAdjust") },
          { value: "history", label: t("products.stockDrawer.tabHistory") },
        ]}
      />

      {/* Tab 1: Barang Masuk */}
      {activeTab === "stockIn" && (
        <form
          onSubmit={handleStockInSubmit}
          className="flex flex-col flex-1 justify-between space-y-4"
        >
          <div className="space-y-4">
            <Input
              label={t("products.stockDrawer.stockInQty")}
              type="number"
              min="1"
              step="1"
              required
              value={inQty}
              onChange={(e) => setInQty(e.target.value)}
              placeholder={t("products.stockDrawer.stockInQtyPlaceholder")}
              helperText="Masukkan jumlah unit barang yang baru masuk."
              error={inError || undefined}
            />

            <Input
              label={t("products.stockDrawer.stockInCost")}
              type="number"
              min="0"
              step="100"
              value={inCost}
              onChange={(e) => setInCost(e.target.value)}
              placeholder={t("products.stockDrawer.stockInCostPlaceholder")}
              helperText={`Harga modal saat ini: ${formatRupiah(product.cost)}.`}
            />

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                {t("products.stockDrawer.stockInNote")}
              </label>
              <textarea
                value={inNote}
                onChange={(e) => setInNote(e.target.value)}
                placeholder={t("products.stockDrawer.stockInNotePlaceholder")}
                rows={2}
                className="w-full rounded-[var(--radius-control)] border border-[var(--border-strong)] p-3 text-base text-[var(--text)] bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmittingIn}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingIn}>
              {t("products.stockDrawer.stockInSubmit")}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Penyesuaian Stok */}
      {activeTab === "adjust" && (
        <form
          onSubmit={handleAdjustSubmit}
          className="flex flex-col flex-1 justify-between space-y-4"
        >
          <div className="space-y-4">
            {!isAdmin && (
              <div className="p-3 bg-[var(--danger-soft)] text-[var(--danger)] text-sm rounded-[var(--radius-control)] border border-[var(--danger)]">
                {t("products.stockDrawer.adminOnlyAdjustment")}
              </div>
            )}

            <Input
              label={t("products.stockDrawer.adjustActualCount")}
              type="number"
              min="0"
              step="1"
              required
              disabled={!isAdmin}
              value={actualCount}
              onChange={(e) => setActualCount(e.target.value)}
              helperText="Hasil penghitungan fisik stok yang sebenarnya di toko."
              error={adjustError || undefined}
            />

            {/* Difference Calculation Callout */}
            <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-control)] flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">Perubahan stok:</span>
              <span
                className={`font-bold tabular-nums text-base ${
                  diff > 0
                    ? "text-[var(--primary)]"
                    : diff < 0
                      ? "text-[var(--danger)]"
                      : "text-[var(--text-muted)]"
                }`}
              >
                {diff > 0 ? `+${diff}` : diff} unit
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                {t("products.stockDrawer.adjustReason")} *
              </label>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder={t("products.stockDrawer.adjustReasonPlaceholder")}
                rows={2}
                disabled={!isAdmin}
                required
                className="w-full rounded-[var(--radius-control)] border border-[var(--border-strong)] p-3 text-base text-[var(--text)] bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmittingAdjust}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isAdmin}
              isLoading={isSubmittingAdjust}
            >
              {t("products.stockDrawer.adjustSubmit")}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 3: Riwayat Mutasi Stok */}
      {activeTab === "history" && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {isLoadingHistory ? (
            <div className="text-center py-8 text-sm text-[var(--text-muted)]">
              {t("common.loading")}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-sm text-[var(--text-muted)] bg-[var(--bg)] rounded-[var(--radius-control)] border border-[var(--border)] p-6">
              {t("products.stockDrawer.historyEmpty")}
            </div>
          ) : (
            <div className="border border-[var(--border)] rounded-[var(--radius-control)] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg)] border-b border-[var(--border)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">{t("products.stockDrawer.historyTable.date")}</th>
                    <th className="py-2.5 px-3">{t("products.stockDrawer.historyTable.type")}</th>
                    <th className="py-2.5 px-3 text-right">
                      {t("products.stockDrawer.historyTable.change")}
                    </th>
                    <th className="py-2.5 px-3 text-right">
                      {t("products.stockDrawer.historyTable.resultingStock")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {history.map((item) => {
                    const userName = usersMap.get(item.userId) || item.userId;
                    return (
                      <tr key={item.id} className="hover:bg-[var(--bg)] transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-[var(--text)]">
                            {formatJakartaDisplayDate(item.createdAt)}
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">{userName}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-[var(--text)]">
                            {getTypeLabel(item.type)}
                          </span>
                          {item.note && (
                            <div
                              className="text-xs text-[var(--text-muted)] truncate max-w-[130px]"
                              title={item.note}
                            >
                              {item.note}
                            </div>
                          )}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-semibold tabular-nums ${
                            item.qty > 0
                              ? "text-[var(--primary)]"
                              : item.qty < 0
                                ? "text-[var(--danger)]"
                                : "text-[var(--text-muted)]"
                          }`}
                        >
                          {item.qty > 0 ? `+${item.qty}` : item.qty}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-medium text-[var(--text)]">
                          {item.resultingStock ?? "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ProductStockDrawer: React.FC<ProductStockDrawerProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={product ? t("products.stockDrawer.title", { name: product.name }) : ""}
    >
      {product && (
        <ProductStockDrawerContent
          key={product.id}
          product={product}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Drawer>
  );
};
