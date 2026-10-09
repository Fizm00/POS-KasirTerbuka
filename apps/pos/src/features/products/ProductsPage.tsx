import React, { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button, EmptyState, Input, Table, Toast } from "../../components";
import { productsRepo } from "../../db/repositories/productsRepo";
import { categoriesRepo } from "../../db/repositories/categoriesRepo";
import { seedDatabase } from "../../db/repositories/seed";
import { db, type Category, type Product } from "../../db";
import { formatRupiah } from "../../lib/money";
import { t } from "../../i18n";
import { ProductDrawer } from "./ProductDrawer";
import { CategoryModal } from "./CategoryModal";

const ITEMS_PER_PAGE = 10;

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Drawer & Modal state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState("");

  const loadData = async () => {
    const [prods, cats] = await Promise.all([productsRepo.getAll(), categoriesRepo.getAll()]);
    setProducts(prods);
    setCategories(cats);
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([productsRepo.getAll(), categoriesRepo.getAll()]).then(([prods, cats]) => {
      if (isMounted) {
        setProducts(prods);
        setCategories(cats);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  // Filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search by name or SKU
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Category filter
      if (selectedCategoryId && p.categoryId !== selectedCategoryId) {
        return false;
      }

      // Low stock filter
      if (filterLowStockOnly && p.stock > p.lowStockThreshold) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategoryId, filterLowStockOnly]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleOpenAdd = () => {
    setProductToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setProductToEdit(product);
    setIsDrawerOpen(true);
  };

  const handleToggleActive = async (product: Product) => {
    await productsRepo.update(product.id, { isActive: !product.isActive });
    await loadData();
    setToastMessage(t("products.form.savedToast"));
  };

  const handleDevSeed = async () => {
    await seedDatabase(db);
    await loadData();
    setToastMessage(t("products.devSeedSuccess"));
  };

  // Table columns definition per DESIGN.md 6.6
  const columns = [
    {
      key: "name",
      header: t("products.table.name"),
      render: (p: Product) => (
        <span className={!p.isActive ? "text-[var(--text-muted)] line-through" : "font-medium"}>
          {p.name}
        </span>
      ),
    },
    {
      key: "sku",
      header: t("products.table.sku"),
      render: (p: Product) => <span className="tabular-nums">{p.sku}</span>,
    },
    {
      key: "category",
      header: t("products.table.category"),
      render: (p: Product) => categoryMap.get(p.categoryId) || "-",
    },
    {
      key: "price",
      header: t("products.table.price"),
      isNumeric: true,
      render: (p: Product) => (
        <span className="font-semibold text-[var(--primary)]">{formatRupiah(p.price)}</span>
      ),
    },
    {
      key: "stock",
      header: t("products.table.stock"),
      isNumeric: true,
      render: (p: Product) => {
        const isLowStock = p.stock <= p.lowStockThreshold;
        return (
          <span className={isLowStock ? "text-[var(--warning)] font-semibold" : ""}>{p.stock}</span>
        );
      },
    },
    {
      key: "status",
      header: t("products.table.status"),
      render: (p: Product) => (
        <span className={p.isActive ? "text-[var(--text)]" : "text-[var(--text-muted)]"}>
          {p.isActive ? t("products.table.active") : t("products.table.inactive")}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("products.table.actions"),
      render: (p: Product) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleOpenEdit(p)}
            className="text-sm font-medium text-[var(--primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 cursor-pointer"
          >
            {t("products.table.edit")}
          </button>
          <button
            type="button"
            onClick={() => handleToggleActive(p)}
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 cursor-pointer"
          >
            {p.isActive ? t("products.table.deactivate") : t("products.table.activate")}
          </button>
        </div>
      ),
    },
  ];

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
            {t("products.title")}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Dev-only seed trigger */}
          {import.meta.env.DEV && (
            <Button variant="secondary" onClick={handleDevSeed}>
              {t("products.devSeed")}
            </Button>
          )}

          <Button variant="primary" onClick={handleOpenAdd}>
            <Plus className="w-5 h-5 mr-1" aria-hidden="true" />
            {t("products.addProduct")}
          </Button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 max-w-2xl">
          {/* Search */}
          <div className="w-72">
            <Input
              label=""
              aria-label={t("products.searchPlaceholder")}
              placeholder={t("products.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Category dropdown */}
          <select
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setCurrentPage(1);
            }}
            aria-label={t("products.allCategories")}
            className="min-h-[48px] h-[48px] px-3.5 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 cursor-pointer"
          >
            <option value="">{t("products.allCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Low stock filter toggle */}
          <button
            type="button"
            onClick={() => {
              setFilterLowStockOnly((prev) => !prev);
              setCurrentPage(1);
            }}
            aria-pressed={filterLowStockOnly}
            className={`min-h-[48px] px-4 py-2 inline-flex items-center rounded-[var(--radius-control)] text-base font-medium transition-colors select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 ${
              filterLowStockOnly
                ? "bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]"
                : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] hover:bg-[var(--bg)]"
            }`}
          >
            {t("products.lowStockFilter")}
          </button>
        </div>

        {/* Manage categories text link */}
        <button
          type="button"
          onClick={() => setIsCategoryModalOpen(true)}
          className="text-base font-medium text-[var(--primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 cursor-pointer"
        >
          {t("products.manageCategories")}
        </button>
      </div>

      {/* Table & empty state */}
      {products.length === 0 ? (
        <EmptyState
          message={t("products.empty.noProducts")}
          actionLabel={t("products.addProduct")}
          onAction={handleOpenAdd}
        />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          message={t("products.empty.noSearchResults")}
          actionLabel="Reset filter"
          onAction={() => {
            setSearchQuery("");
            setSelectedCategoryId("");
            setFilterLowStockOnly(false);
          }}
        />
      ) : (
        <Table
          columns={columns}
          data={paginatedProducts}
          keyExtractor={(p) => p.id}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {/* Product Drawer */}
      <ProductDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        productToEdit={productToEdit}
        onSaved={async () => {
          await loadData();
          setToastMessage(t("products.form.savedToast"));
        }}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
      />

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoriesChanged={loadData}
      />

      {/* Toast Notification */}
      <Toast isOpen={!!toastMessage} message={toastMessage} onDismiss={() => setToastMessage("")} />
    </main>
  );
};
