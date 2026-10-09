import { describe, expect, it } from "vitest";
import { t } from "./index";

describe("i18n t() helper", () => {
  it("translates top-level and nested keys correctly", () => {
    expect(t("common.save")).toBe("Simpan");
    expect(t("common.cancel")).toBe("Batal");
    expect(t("devGallery.title")).toBe("Galeri komponen");
  });

  it("replaces parameters in string", () => {
    expect(t("common.page", { current: 1, total: 5 })).toBe("Halaman 1 dari 5");
  });

  it("returns fallback key if key is missing", () => {
    expect(t("missing.key")).toBe("missing.key");
  });
});
