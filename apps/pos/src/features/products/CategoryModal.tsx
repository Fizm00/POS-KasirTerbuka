import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button, Input, Modal } from "../../components";
import { categoriesRepo } from "../../db/repositories/categoriesRepo";
import { db, type Category } from "../../db";
import { t } from "../../i18n";

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged?: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoriesChanged,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = async () => {
    const list = await categoriesRepo.getAll();
    setCategories(list);
  };

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    categoriesRepo.getAll().then((list) => {
      if (isMounted) {
        setCategories(list);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await categoriesRepo.create({ name: trimmed });
      setNewCategoryName("");
      setErrorMessage("");
      await loadCategories();
      onCategoriesChanged?.();
    } catch {
      setErrorMessage("Gagal menambahkan kategori.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    setErrorMessage("");
    // Guard: check if products use this category
    const linkedProductsCount = await db.products.where("categoryId").equals(cat.id).count();

    if (linkedProductsCount > 0) {
      setErrorMessage(
        t("products.categoriesModal.cannotDeleteLinked", { count: linkedProductsCount })
      );
      return;
    }

    try {
      await categoriesRepo.delete(cat.id);
      await loadCategories();
      onCategoriesChanged?.();
    } catch {
      setErrorMessage("Gagal menghapus kategori.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("products.categoriesModal.title")}
      footer={
        <Button variant="secondary" onClick={onClose}>
          {t("common.close")}
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Error message banner */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-[var(--danger-soft)] text-[var(--danger)] text-sm rounded-[var(--radius-control)] border border-[var(--danger)]"
          >
            {errorMessage}
          </div>
        )}

        {/* Add new category form */}
        <form onSubmit={handleAddCategory} className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label={t("products.categoriesModal.title")}
              placeholder={t("products.categoriesModal.newCategoryPlaceholder")}
              value={newCategoryName}
              onChange={(e) => {
                setNewCategoryName(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={!newCategoryName.trim() || isSubmitting}
            isLoading={isSubmitting}
          >
            {t("products.categoriesModal.addCategory")}
          </Button>
        </form>

        {/* Category list */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--text-muted)]">Daftar kategori</span>

          {categories.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              {t("products.categoriesModal.empty")}
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--border)] border border-[var(--border)] rounded-[var(--radius-control)] max-h-60 overflow-y-auto">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="min-h-[48px] px-4 py-2 flex items-center justify-between text-base text-[var(--text)]"
                >
                  <span className="font-medium">{cat.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    aria-label={`Hapus ${cat.name}`}
                    className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-[var(--radius-control)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
