import { describe, expect, it } from "vitest";
import { CATEGORY_PALETTE, getCategoryColor, getProductInitials } from "./categoryColors";

describe("Category Colors & Product Initials per DESIGN.md", () => {
  it("defines exact 6 functional category colors from DESIGN.md Section 2.1.1", () => {
    expect(CATEGORY_PALETTE).toHaveLength(6);
    expect(CATEGORY_PALETTE.map((c) => c.name)).toEqual([
      "sage",
      "terracotta",
      "ochre",
      "slate",
      "plum",
      "olive",
    ]);

    // Verify sage values
    expect(CATEGORY_PALETTE[0].main).toBe("#3E6B48");
    expect(CATEGORY_PALETTE[0].soft).toBe("#EBF2ED");

    // Verify terracotta values
    expect(CATEGORY_PALETTE[1].main).toBe("#A34E36");
    expect(CATEGORY_PALETTE[1].soft).toBe("#F9EFEA");
  });

  it("deterministically returns the same category color for identical ID or name", () => {
    const color1 = getCategoryColor("cat-minuman", "Minuman");
    const color2 = getCategoryColor("cat-minuman", "Minuman");
    expect(color1).toEqual(color2);

    const color3 = getCategoryColor("cat-makanan");
    const color4 = getCategoryColor("cat-makanan");
    expect(color3).toEqual(color4);
  });

  it("extracts 2-letter uppercase initials accurately for single and multi-word names", () => {
    expect(getProductInitials("Caffe Latte")).toBe("CL");
    expect(getProductInitials("Nasi Goreng Spesial")).toBe("NG");
    expect(getProductInitials("Soto")).toBe("SO");
    expect(getProductInitials("Kopi")).toBe("KO");
    expect(getProductInitials("Es")).toBe("ES");
    expect(getProductInitials("A")).toBe("A");
    expect(getProductInitials("")).toBe("P");
  });
});
