import { z } from "zod";
import { t } from "../../i18n";

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: t("products.errors.nameRequired") }),
  sku: z
    .string()
    .trim()
    .min(1, { message: t("products.errors.skuRequired") }),
  categoryId: z
    .string()
    .trim()
    .min(1, { message: t("products.errors.categoryRequired") }),
  cost: z
    .number()
    .int()
    .min(0, { message: t("products.errors.costNegative") }),
  price: z
    .number()
    .int()
    .min(0, { message: t("products.errors.priceNegative") }),
  stock: z
    .number()
    .int()
    .min(0, { message: t("products.errors.stockNegative") }),
  lowStockThreshold: z
    .number()
    .int()
    .min(0, { message: t("products.errors.thresholdNegative") }),
  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
