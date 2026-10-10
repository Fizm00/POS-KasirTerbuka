import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Drawer, Input } from "../../components";
import { productsRepo } from "../../db/repositories/productsRepo";
import { categoriesRepo } from "../../db/repositories/categoriesRepo";
import { productImagesRepo } from "../../db/repositories/productImagesRepo";
import type { Category, Product } from "../../db/schema";
import { productFormSchema, type ProductFormValues } from "./productSchema";
import { ProductPhotoUpload } from "./ProductPhotoUpload";
import { useFeatureEnabled } from "../../lib/features";
import { t } from "../../i18n";

export interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSaved: () => void;
  onOpenCategoryModal: () => void;
}

export const ProductDrawer: React.FC<ProductDrawerProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSaved,
  onOpenCategoryModal,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [skuError, setSkuError] = useState<string>("");
  const isPhotosEnabled = useFeatureEnabled("photos");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [shouldDeletePhoto, setShouldDeletePhoto] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      categoryId: "",
      cost: 0,
      price: 0,
      stock: 0,
      lowStockThreshold: 5,
      isActive: true,
    },
  });

  // Load categories and sync form when drawer opens
  useEffect(() => {
    async function loadData() {
      const cats = await categoriesRepo.getAll();
      setCategories(cats);

      if (productToEdit) {
        reset({
          name: productToEdit.name,
          sku: productToEdit.sku,
          categoryId: productToEdit.categoryId,
          cost: productToEdit.cost,
          price: productToEdit.price,
          stock: productToEdit.stock,
          lowStockThreshold: productToEdit.lowStockThreshold,
          isActive: productToEdit.isActive,
        });

        if (isPhotosEnabled) {
          const url = await productImagesRepo.getProductImageUrl(productToEdit.id);
          setPhotoUrl(url);
        } else {
          setPhotoUrl(null);
        }
      } else {
        reset({
          name: "",
          sku: "",
          categoryId: cats[0]?.id || "",
          cost: 0,
          price: 0,
          stock: 0,
          lowStockThreshold: 5,
          isActive: true,
        });
        setPhotoUrl(null);
      }
      setSelectedPhotoFile(null);
      setShouldDeletePhoto(false);
      setSkuError("");
    }

    if (isOpen) {
      loadData();
    }
  }, [isOpen, productToEdit, reset, isPhotosEnabled]);

  const onSubmit = async (values: ProductFormValues) => {
    setSkuError("");

    // Check SKU uniqueness
    const existing = await productsRepo.getBySku(values.sku.trim());
    if (existing && (!productToEdit || existing.id !== productToEdit.id)) {
      setSkuError(t("products.errors.skuExists"));
      return;
    }

    if (productToEdit) {
      await productsRepo.update(productToEdit.id, {
        name: values.name.trim(),
        sku: values.sku.trim(),
        categoryId: values.categoryId,
        cost: values.cost,
        price: values.price,
        stock: values.stock,
        lowStockThreshold: values.lowStockThreshold,
        isActive: values.isActive,
      });

      if (isPhotosEnabled) {
        if (selectedPhotoFile) {
          await productImagesRepo.setProductImage(productToEdit.id, selectedPhotoFile);
        } else if (shouldDeletePhoto) {
          await productImagesRepo.removeProductImage(productToEdit.id);
        }
      }
    } else {
      const created = await productsRepo.create({
        name: values.name.trim(),
        sku: values.sku.trim(),
        categoryId: values.categoryId,
        cost: values.cost,
        price: values.price,
        stock: values.stock,
        lowStockThreshold: values.lowStockThreshold,
        isActive: values.isActive,
      });

      if (isPhotosEnabled && selectedPhotoFile) {
        await productImagesRepo.setProductImage(created.id, selectedPhotoFile);
      }
    }

    onSaved();
    onClose();
  };

  const title = productToEdit ? t("products.editProduct") : t("products.addProduct");

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="product-form" variant="primary" isLoading={isSubmitting}>
            {t("products.form.saveButton")}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {isPhotosEnabled && (
          <ProductPhotoUpload
            initialImageUrl={photoUrl}
            onChange={(file, shouldDelete) => {
              setSelectedPhotoFile(file);
              setShouldDeletePhoto(shouldDelete);
            }}
            disabled={isSubmitting}
          />
        )}

        {/* Nama produk */}
        <Input
          label={t("products.form.nameLabel")}
          placeholder={t("products.form.namePlaceholder")}
          {...register("name")}
          error={errors.name?.message}
          autoFocus
        />

        {/* SKU / barcode */}
        <Input
          label={t("products.form.skuLabel")}
          placeholder={t("products.form.skuPlaceholder")}
          {...register("sku", {
            onChange: () => {
              if (skuError) setSkuError("");
            },
          })}
          error={skuError || errors.sku?.message}
        />

        {/* Kategori dropdown with manage categories link */}
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex justify-between items-center">
            <label
              htmlFor="category-select"
              className="text-sm font-medium text-[var(--text)] select-none"
            >
              {t("products.form.categoryLabel")}
            </label>
            <button
              type="button"
              onClick={onOpenCategoryModal}
              className="text-sm text-[var(--primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 cursor-pointer"
            >
              + {t("products.manageCategories")}
            </button>
          </div>

          <select
            id="category-select"
            {...register("categoryId")}
            className={`w-full min-h-[48px] h-[48px] px-3.5 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border transition-colors ${
              errors.categoryId
                ? "border-[var(--danger)] focus-visible:outline-[var(--danger)]"
                : "border-[var(--border-strong)] focus-visible:outline-[var(--primary)]"
            } focus-visible:outline-2 focus-visible:outline-offset-2`}
          >
            <option value="">{t("products.form.selectCategory")}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        {/* Harga modal (Rp) */}
        <Controller
          name="cost"
          control={control}
          render={({ field }) => (
            <Input
              label={t("products.form.costLabel")}
              isMoney
              value={field.value}
              onMoneyChange={(val) => field.onChange(val)}
              error={errors.cost?.message}
            />
          )}
        />

        {/* Harga jual (Rp) */}
        <Controller
          name="price"
          control={control}
          render={({ field }) => (
            <Input
              label={t("products.form.priceLabel")}
              isMoney
              value={field.value}
              onMoneyChange={(val) => field.onChange(val)}
              error={errors.price?.message}
            />
          )}
        />

        {/* Stok & Batas stok menipis */}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="stock"
            control={control}
            render={({ field }) => (
              <Input
                label={
                  productToEdit
                    ? t("products.form.currentStockLabel")
                    : t("products.form.stockLabel")
                }
                type="number"
                min={0}
                value={field.value.toString()}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                error={errors.stock?.message}
              />
            )}
          />

          <Controller
            name="lowStockThreshold"
            control={control}
            render={({ field }) => (
              <Input
                label={t("products.form.lowStockThresholdLabel")}
                type="number"
                min={0}
                value={field.value.toString()}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                error={errors.lowStockThreshold?.message}
              />
            )}
          />
        </div>

        {/* Switch / checkbox Produk aktif */}
        <div className="pt-2">
          <label className="min-h-[48px] inline-flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register("isActive")}
              className="w-5 h-5 accent-[var(--primary)] rounded cursor-pointer"
            />
            <span className="text-base font-medium text-[var(--text)]">
              {t("products.form.activeLabel")}
            </span>
          </label>
        </div>
      </form>
    </Drawer>
  );
};
