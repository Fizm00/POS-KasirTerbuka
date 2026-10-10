import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductPhotoUpload } from "./ProductPhotoUpload";

describe("ProductPhotoUpload", () => {
  it("renders 120x120 empty preview box with camera icon and 'Pilih foto'", () => {
    const onChange = vi.fn();
    render(<ProductPhotoUpload onChange={onChange} />);

    expect(screen.getByText("Foto produk")).toBeInTheDocument();
    expect(screen.getAllByText("Pilih foto").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Format WebP, PNG, atau JPEG\. Otomatis dikompresi ke maks\. 480 px\./)
    ).toBeInTheDocument();
  });

  it("shows initial image and allows removing it", async () => {
    const onChange = vi.fn();
    render(
      <ProductPhotoUpload initialImageUrl="blob:http://localhost/test-photo" onChange={onChange} />
    );

    const img = screen.getByAltText("Foto produk");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "blob:http://localhost/test-photo");

    const removeBtn = screen.getByText("Hapus foto");
    await userEvent.click(removeBtn);

    expect(onChange).toHaveBeenCalledWith(null, true);
    expect(screen.queryByAltText("Foto produk")).not.toBeInTheDocument();
  });

  it("validates file format and shows error for unsupported file types", () => {
    const onChange = vi.fn();
    const { container } = render(<ProductPhotoUpload onChange={onChange} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    const invalidFile = new File(["fake content"], "document.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(
      screen.getByText("Format berkas tidak didukung. Gunakan WebP, PNG, atau JPEG.")
    ).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("validates file size and shows error for files over 10 MB", () => {
    const onChange = vi.fn();
    const { container } = render(<ProductPhotoUpload onChange={onChange} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    // 11 MB file
    const oversizedFile = new File(["x"], "huge.png", { type: "image/png" });
    Object.defineProperty(oversizedFile, "size", { value: 11 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [oversizedFile] } });

    expect(screen.getByText("Ukuran gambar terlalu besar (maksimal 10 MB).")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("accepts valid image file and calls onChange with file", () => {
    const onChange = vi.fn();
    const { container } = render(<ProductPhotoUpload onChange={onChange} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(["image-bytes"], "photo.webp", { type: "image/webp" });
    Object.defineProperty(validFile, "size", { value: 100 * 1024 });

    fireEvent.change(input, { target: { files: [validFile] } });

    expect(
      screen.queryByText("Format berkas tidak didukung. Gunakan WebP, PNG, atau JPEG.")
    ).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(validFile, false);
  });
});
