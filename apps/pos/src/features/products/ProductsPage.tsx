import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileSpreadsheet, PackagePlus } from "lucide-react";
import {
  Button,
  CustomSelect,
  EmptyState,
  Input,
  Table,
  Toast,
  type SortDirection,
} from "../../components";
import { productsRepo } from "../../db/repositories/productsRepo";
import { categoriesRepo } from "../../db/repositories/categoriesRepo";
import { productImagesRepo } from "../../db/repositories/productImagesRepo";
import { seedDatabase } from "../../db/repositories/seed";
import { db, type Category, type Product } from "../../db";
import { formatRupiah } from "../../lib/money";
import { toSentenceCase } from "../../lib/text";
import { useFeatureEnabled } from "../../lib/features";
import { getCategoryColor, getProductInitials } from "../../lib/categoryColors";
import { t } from "../../i18n";
import { ProductDrawer } from "./ProductDrawer";
import { CategoryModal } from "./CategoryModal";
import { ProductImportModal } from "./ProductImportModal";
import { ProductStockDrawer } from "./ProductStockDrawer";

const ITEMS_PER_PAGE = 10;

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const isPhotosEnabled = useFeatureEnabled("photos");
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Sorting state (name, price, stock)
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Drawer & Modal state
  const navigate = useNavigate();
  const isStockInEnabled = useFeatureEnabled("stockIn");
  const isCsvImportEnabled = useFeatureEnabled("csvImport");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [stockDrawerProduct, setStockDrawerProduct] = useState<Product | null>(null);
  const [isStockDrawerOpen, setIsStockDrawerOpen] = useState(false);

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
    categories.forEach((c) => map.set(c.id, toSentenceCase(c.name)));
    return map;
  }, [categories]);

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Low stock items count
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= p.lowStockThreshold).length;
  }, [products]);

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

  // Sorting handler: Ascending -> Descending -> Default (null)
  const handleSort = (key: string) => {
    if (sortColumn === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
  };

  // Sorted products
  const sortedProducts = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredProducts;
    return [...filteredProducts].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortColumn];
      const bVal = (b as unknown as Record<string, unknown>)[sortColumn];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || "");
      const bStr = String(bVal || "");
      return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredProducts, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProducts, currentPage]);

  // Load thumbnails for paginated products when photos feature is active
  useEffect(() => {
    if (!isPhotosEnabled || paginatedProducts.length === 0) {
      return;
    }

    let isMounted = true;
    productImagesRepo.listThumbnails(paginatedProducts.map((p) => p.id)).then((map) => {
      if (isMounted) {
        setThumbnails(map);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isPhotosEnabled, paginatedProducts]);

  const handleOpenAdd = () => {
    setProductToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setProductToEdit(product);
    setIsDrawerOpen(true);
  };

  const handleOpenStock = (product: Product) => {
    setStockDrawerProduct(product);
    setIsStockDrawerOpen(true);
  };

  const handleToggleActive = useCallback(async (product: Product) => {
    await productsRepo.update(product.id, { isActive: !product.isActive });
    await loadData();
    setToastMessage(t("products.form.savedToast"));
  }, []);

  const handleDevSeed = async () => {
    await seedDatabase(db);
    await loadData();
    setToastMessage(t("products.devSeedSuccess"));
  };

  // Table columns definition per DESIGN.md 6.6
  const columns = useMemo(() => {
    const cols = [];

    if (isPhotosEnabled) {
      cols.push({
        key: "thumbnail",
        header: t("products.table.thumbnail"),
        render: (p: Product) => {
          const thumbUrl = thumbnails[p.id];
          const category = categoryById.get(p.categoryId);
          const palette = getCategoryColor(p.categoryId, category?.name);
          const initials = getProductInitials(p.name);

          return (
            <div
              className="w-10 h-10 min-w-10 min-h-10 rounded-md overflow-hidden flex items-center justify-center font-semibold text-xs select-none aspect-square"
              style={{
                backgroundColor: palette.soft,
                color: palette.main,
              }}
            >
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          );
        },
      });
    }

    cols.push(
      {
        key: "name",
        header: t("products.table.name"),
        sortable: true,
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
        sortable: true,
        render: (p: Product) => (
          <span className="font-semibold text-[var(--primary)]">{formatRupiah(p.price)}</span>
        ),
      },
      {
        key: "stock",
        header: t("products.table.stock"),
        isNumeric: true,
        sortable: true,
        render: (p: Product) => {
          const isLowStock = p.stock <= p.lowStockThreshold;
          return (
            <span className={isLowStock ? "text-[var(--warning)] font-semibold" : ""}>
              {p.stock}
            </span>
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
            {isStockInEnabled && (
              <button
                type="button"
                onClick={() => handleOpenStock(p)}
                className="text-sm font-medium text-[var(--primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 cursor-pointer"
              >
                {t("products.table.stockAction")}
              </button>
            )}
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
      }
    );

    return cols;
  }, [
    isPhotosEnabled,
    isStockInEnabled,
    thumbnails,
    categoryById,
    categoryMap,
    handleToggleActive,
  ]);

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

          {/* Bulk Stock In Button */}
          {isStockInEnabled && (
            <Button variant="secondary" onClick={() => navigate("/stok-masuk")}>
              <PackagePlus className="w-5 h-5 mr-1" aria-hidden="true" />
              {t("products.bulkStockIn")}
            </Button>
          )}

          {/* CSV Import Button */}
          {isCsvImportEnabled && (
            <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
              <FileSpreadsheet className="w-5 h-5 mr-1" aria-hidden="true" />
              {t("products.importCsv")}
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
          <div className="w-52">
            <CustomSelect
              id="product-category-filter"
              label=""
              aria-label={t("products.allCategories")}
              value={selectedCategoryId}
              onChange={(val) => {
                setSelectedCategoryId(val);
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: t("products.allCategories") },
                ...categories.map((c) => ({ value: c.id, label: toSentenceCase(c.name) })),
              ]}
            />
          </div>

          {/* Low stock filter toggle */}
          <button
            type="button"
            onClick={() => {
              setFilterLowStockOnly((prev) => !prev);
              setCurrentPage(1);
            }}
            aria-pressed={filterLowStockOnly}
            aria-label={`${t("products.lowStockFilter")} (${lowStockCount})`}
            className={`min-h-[48px] px-4 py-2 inline-flex items-center gap-2 rounded-[var(--radius-control)] text-base font-medium transition-colors select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 ${
              filterLowStockOnly
                ? "bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)] font-semibold"
                : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] hover:bg-[var(--bg)]"
            }`}
          >
            <span>{t("products.lowStockFilter")}</span>
            <span
              className={`tabular-nums text-xs px-2 py-0.5 rounded-full font-semibold ${
                filterLowStockOnly
                  ? "bg-[var(--warning)] text-white"
                  : "bg-[var(--bg)] text-[var(--text-muted)] border border-[var(--border)]"
              }`}
            >
              {lowStockCount}
            </span>
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
          sortColumn={sortColumn || undefined}
          sortDirection={sortDirection}
          onSort={handleSort}
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

      {/* Product Import Modal */}
      {isCsvImportEnabled && (
        <ProductImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={async () => {
            await loadData();
          }}
        />
      )}

      {/* Product Stock Drawer */}
      {isStockInEnabled && (
        <ProductStockDrawer
          product={stockDrawerProduct}
          isOpen={isStockDrawerOpen}
          onClose={() => {
            setIsStockDrawerOpen(false);
            setStockDrawerProduct(null);
          }}
          onSuccess={async () => {
            await loadData();
          }}
        />
      )}

      {/* Toast Notification */}
      <Toast isOpen={!!toastMessage} message={toastMessage} onDismiss={() => setToastMessage("")} />
    </main>
  );
};
