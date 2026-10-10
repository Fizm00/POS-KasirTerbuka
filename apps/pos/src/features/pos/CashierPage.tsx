import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ShoppingBag, LayoutGrid, List } from "lucide-react";
import { productsRepo } from "../../db/repositories/productsRepo";
import { categoriesRepo } from "../../db/repositories/categoriesRepo";
import { settingsRepo } from "../../db/repositories/settingsRepo";
import { productImagesRepo } from "../../db/repositories/productImagesRepo";
import { transactionsRepo, InsufficientStockError } from "../../db/repositories/transactionsRepo";
import type {
  Category,
  PaymentMethod,
  Product,
  ProductViewMode,
  StoreSettings,
  Transaction,
} from "../../db/schema";
import { useAuthStore } from "../auth/authStore";
import { useCartStore } from "./cartStore";
import { VirtualizedProductGrid } from "./VirtualizedProductGrid";
import { useFeatureEnabled } from "../../lib/features";
import { CartPanel } from "./CartPanel";
import { PaymentModal } from "./PaymentModal";
import { TransactionSuccessModal } from "./TransactionSuccessModal";
import { Chip } from "../../components/Chip";
import { formatRupiah } from "../../lib/money";
import { toSentenceCase } from "../../lib/text";
import { t } from "../../i18n";

export const CashierPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const isPhotosEnabled = useFeatureEnabled("photos");
  const [viewMode, setViewMode] = useState<ProductViewMode>("compact");
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Payment and success modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const { items, totals, itemCount, discount, addItem, getItemQty, clearCart } = useCartStore();
  const { currentUser } = useAuthStore();

  // Load active products, categories, and settings
  useEffect(() => {
    async function loadData() {
      const [prods, cats, sets] = await Promise.all([
        productsRepo.getActive(),
        categoriesRepo.getAll(),
        settingsRepo.getSettings(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setSettings(sets);
      if (sets?.productView) {
        setViewMode(sets.productView);
      }
    }
    loadData();
  }, []);

  // Effective view mode: forced to compact if photos feature is disabled
  const effectiveViewMode: ProductViewMode = isPhotosEnabled ? viewMode : "compact";

  const handleToggleViewMode = async () => {
    const nextMode: ProductViewMode = viewMode === "photo" ? "compact" : "photo";
    setViewMode(nextMode);
    await settingsRepo.updateSettings({ productView: nextMode });
  };

  // Load thumbnails for active products when photos feature is active
  useEffect(() => {
    if (!isPhotosEnabled || products.length === 0) {
      return;
    }

    let isMounted = true;
    const initialBatch = products.slice(0, 100).map((p) => p.id);
    productImagesRepo.listThumbnails(initialBatch).then((map) => {
      if (isMounted) {
        setThumbnails((prev) => ({ ...prev, ...map }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isPhotosEnabled, products]);

  const handleRequestThumbnails = useCallback((productIds: string[]) => {
    productImagesRepo.listThumbnails(productIds).then((map) => {
      setThumbnails((prev) => ({ ...prev, ...map }));
    });
  }, []);

  // Autofocus search on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handlePay = useCallback(() => {
    if (items.length === 0) return;
    setStockError(null);
    setIsPaymentOpen(true);
  }, [items.length]);

  // Keyboard shortcuts: F2 for search focus, F9 for pay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === "F9") {
        e.preventDefault();
        if (items.length > 0 && !isPaymentOpen && !completedTx) {
          handlePay();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items.length, isPaymentOpen, completedTx, handlePay]);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchCategory = !selectedCategoryId || product.categoryId === selectedCategoryId;
      const matchSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  // Handle barcode scanner Enter key in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = searchQuery.trim().toLowerCase();
      if (!code) return;

      // Find product with matching SKU
      const matched = products.find((p) => p.sku.toLowerCase() === code);
      if (matched) {
        if (matched.stock <= 0) {
          setFeedbackMessage(t("cashier.outOfStock"));
        } else {
          const added = addItem(matched);
          if (added) {
            setSearchQuery("");
            setFeedbackMessage(null);
          } else {
            setFeedbackMessage(t("cart.stockLimit"));
          }
        }
      } else {
        setFeedbackMessage(t("cashier.productNotFound", { sku: searchQuery.trim() }));
      }
    }
  };

  const handleConfirmPayment = async (method: PaymentMethod, amountPaid: number): Promise<void> => {
    const cashierId = currentUser?.id || "cashier";

    try {
      const sale = await transactionsRepo.createSale({
        cashierId,
        items: items.map((i) => ({ productId: i.product.id, qty: i.qty })),
        discount: discount ?? undefined,
        paymentMethod: method,
        amountPaid,
      });

      // Clear cart on success
      clearCart();
      setIsPaymentOpen(false);
      setIsMobileCartOpen(false);
      setCompletedTx(sale);

      // Refresh product list to show decremented stock levels
      const refreshedProducts = await productsRepo.getActive();
      setProducts(refreshedProducts);
    } catch (err: unknown) {
      if (err instanceof InsufficientStockError) {
        const errorMsg = t("payment.stockError", {
          name: err.productName,
          available: err.available,
        });
        setStockError(errorMsg);
        throw new Error(errorMsg, { cause: err });
      }
      throw err;
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-52px-56px)] md:h-[calc(100vh-52px)] overflow-hidden bg-[var(--bg)]">
      {/* Left Section (~62%): Search, Categories, Product Grid */}
      <section
        className="w-full lg:w-[62%] flex flex-col h-full border-r border-[var(--border)] overflow-hidden"
        aria-label="Katalog produk"
      >
        {/* Search Bar with F2 Shortcut Hint and View Mode Switcher */}
        <div className="p-4 bg-[var(--surface)] border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 absolute left-3.5 text-[var(--text-muted)] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setFeedbackMessage(null);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder={t("cashier.searchPlaceholder")}
                aria-label={t("cashier.searchPlaceholder")}
                className="w-full h-12 pl-11 pr-14 bg-[var(--surface)] text-base text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 transition-colors placeholder:text-[var(--text-muted)]"
              />
              <kbd className="absolute right-3.5 px-2 py-0.5 text-xs font-mono rounded border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--text-muted)] select-none">
                {t("cashier.f2Hint")}
              </kbd>
            </div>

            {isPhotosEnabled && (
              <button
                type="button"
                onClick={handleToggleViewMode}
                title={t("cashier.toggleViewMode")}
                aria-label={t("cashier.toggleViewMode")}
                className="w-12 h-12 min-w-12 min-h-12 flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 shrink-0 cursor-pointer"
              >
                {effectiveViewMode === "photo" ? (
                  <LayoutGrid className="w-5 h-5 text-[var(--primary)]" />
                ) : (
                  <List className="w-5 h-5 text-[var(--text-muted)]" />
                )}
              </button>
            )}
          </div>

          {/* Feedback / Error message from barcode scanner */}
          {feedbackMessage && (
            <p className="mt-2 text-sm text-[var(--danger)] font-medium">{feedbackMessage}</p>
          )}
        </div>

        {/* Category Chips Bar */}
        <div className="px-4 py-2.5 bg-[var(--surface)] border-b border-[var(--border)] flex items-center gap-2 overflow-x-auto scrollbar-none select-none">
          <Chip
            label={t("cashier.allCategories")}
            count={products.length}
            isSelected={selectedCategoryId === null}
            onClick={() => setSelectedCategoryId(null)}
          />
          {categories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;
            const hasProducts = count > 0;
            return (
              <Chip
                key={cat.id}
                label={toSentenceCase(cat.name)}
                count={count}
                isSelected={selectedCategoryId === cat.id}
                disabled={!hasProducts}
                onClick={hasProducts ? () => setSelectedCategoryId(cat.id) : undefined}
              />
            );
          })}
        </div>

        {/* Product Catalog / Grid */}
        {products.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
            <p className="font-medium text-base text-[var(--text)]">{t("cashier.emptyCatalog")}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
            <p className="font-medium text-base text-[var(--text)]">{t("cashier.emptyFilter")}</p>
          </div>
        ) : (
          <VirtualizedProductGrid
            products={filteredProducts}
            categories={categories}
            thumbnails={thumbnails}
            viewMode={effectiveViewMode}
            getItemQty={getItemQty}
            onSelect={(p) => addItem(p)}
            onRequestThumbnails={handleRequestThumbnails}
          />
        )}

        {/* Mobile / Tablet Portrait Sticky Bottom Bar */}
        <div
          className="lg:hidden p-3 bg-[var(--surface)] border-t border-[var(--border)] flex items-center justify-between select-none shrink-0"
          style={{
            paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)]">
              {t("cart.mobileOrderSummary", { count: itemCount })}
            </span>
            <span className="font-bold text-lg tabular-nums text-[var(--text)]">
              {formatRupiah(totals.total)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="min-h-[48px] px-5 py-2.5 rounded-[var(--radius-control)] bg-[var(--primary)] text-white font-semibold text-sm flex items-center gap-2 hover:bg-[var(--primary-hover)] active:opacity-90 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t("cart.mobileViewOrder")}</span>
          </button>
        </div>
      </section>

      {/* Right Section (~38%): Cart Panel (Desktop & Tablet Landscape) */}
      <section
        className="hidden lg:flex lg:w-[38%] h-full flex-col overflow-hidden"
        aria-label="Keranjang belanja"
      >
        <CartPanel onPay={handlePay} />
      </section>

      {/* Mobile Full-Height Cart Sheet (Phone & Tablet Portrait) */}
      {isMobileCartOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="lg:hidden fixed inset-0 z-50 bg-[var(--overlay-bg)] flex flex-col justify-end"
        >
          <div className="w-full h-full max-h-screen bg-[var(--surface)] flex flex-col shadow-2xl">
            <CartPanel onPay={handlePay} onCloseMobile={() => setIsMobileCartOpen(false)} />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentOpen && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          total={totals.total}
          onConfirmPayment={handleConfirmPayment}
          stockError={stockError}
        />
      )}

      {/* Transaction Success Modal with Receipt Preview */}
      {completedTx && settings && (
        <TransactionSuccessModal
          isOpen={true}
          transaction={completedTx}
          settings={settings}
          cashierName={currentUser?.name || "Kasir"}
          onNewTransaction={() => {
            setCompletedTx(null);
            searchInputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
};
