/**
 * Functional category color palette from DESIGN.md Section 2.1.1
 * Muted, earthy tones designed for high legibility with --text and a calm appearance.
 */
export interface CategoryColorToken {
  name: "sage" | "terracotta" | "ochre" | "slate" | "plum" | "olive";
  main: string; // Text / Border
  soft: string; // Soft background
}

export const CATEGORY_PALETTE: readonly CategoryColorToken[] = [
  { name: "sage", main: "#3E6B48", soft: "#EBF2ED" },
  { name: "terracotta", main: "#A34E36", soft: "#F9EFEA" },
  { name: "ochre", main: "#8F6420", soft: "#FAF3E7" },
  { name: "slate", main: "#425D69", soft: "#ECF1F4" },
  { name: "plum", main: "#6C435F", soft: "#F4EEF2" },
  { name: "olive", main: "#5E693F", soft: "#F1F4EC" },
] as const;

/**
 * Deterministically assigns one of the 6 category colors based on category ID or name.
 */
export function getCategoryColor(
  categoryId?: string | null,
  categoryName?: string | null
): CategoryColorToken {
  const seed = (categoryId || categoryName || "default").trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CATEGORY_PALETTE.length;
  return CATEGORY_PALETTE[index];
}

/**
 * Extracts 2-letter uppercase initials for placeholder tiles per DESIGN.md:
 * e.g. "Caffe Latte" -> "CL", "Nasi Goreng" -> "NG", "Soto" -> "SO".
 * Strictly no generic icons, clip art, or illustrations.
 */
export function getProductInitials(name: string): string {
  if (!name || !name.trim()) return "P";

  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    const first = words[0][0] || "";
    const second = words[1][0] || "";
    return (first + second).toUpperCase();
  }

  const singleWord = words[0];
  if (singleWord.length >= 2) {
    return singleWord.slice(0, 2).toUpperCase();
  }

  return singleWord.toUpperCase();
}
