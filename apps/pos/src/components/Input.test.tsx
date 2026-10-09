import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input component", () => {
  it("renders label and handles text change", async () => {
    const handleChange = vi.fn();
    render(<Input label="Nama produk" onChange={handleChange} />);

    expect(screen.getByLabelText("Nama produk")).toBeInTheDocument();
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "Kopi");

    expect(handleChange).toHaveBeenCalled();
  });

  it("renders error message and marks input as invalid", () => {
    render(<Input label="Nama produk" error="Nama produk wajib diisi." />);

    const input = screen.getByRole("textbox");
    expect(input).toBeInvalid();
    expect(screen.getByRole("alert")).toHaveTextContent("Nama produk wajib diisi.");
  });

  it("formats money values and calls onMoneyChange with numbers", async () => {
    const handleMoneyChange = vi.fn();
    render(<Input label="Harga jual" isMoney onMoneyChange={handleMoneyChange} />);

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "25000");

    expect(handleMoneyChange).toHaveBeenLastCalledWith(25000);
    expect(input).toHaveValue("25.000");
    expect(screen.getByText("Rp")).toBeInTheDocument();
  });
});
