import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CustomSelect } from "./CustomSelect";

describe("CustomSelect", () => {
  const options = [
    { value: "", label: "Semua" },
    { value: "makanan", label: "Makanan" },
    { value: "minuman", label: "Minuman" },
  ];

  it("renders with placeholder or selected option", () => {
    const { rerender } = render(
      <CustomSelect label="Kategori" value="" options={options} onChange={() => {}} />
    );

    expect(screen.getByRole("button")).toHaveTextContent("Semua");

    rerender(
      <CustomSelect label="Kategori" value="minuman" options={options} onChange={() => {}} />
    );

    expect(screen.getByRole("button")).toHaveTextContent("Minuman");
  });

  it("opens listbox on click and selects option", async () => {
    const handleChange = vi.fn();
    render(<CustomSelect label="Pilih Kasir" value="" options={options} onChange={handleChange} />);

    const button = screen.getByRole("button");
    await userEvent.click(button);

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();

    const optionMakanan = within(listbox).getByRole("option", { name: "Makanan" });
    await userEvent.click(optionMakanan);

    expect(handleChange).toHaveBeenCalledWith("makanan");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("supports keyboard navigation with arrows, Enter, and Escape", async () => {
    const handleChange = vi.fn();
    render(
      <CustomSelect label="Status" value="makanan" options={options} onChange={handleChange} />
    );

    const button = screen.getByRole("button");
    button.focus();

    // ArrowDown opens the listbox
    fireEvent.keyDown(button, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // ArrowDown navigates to next option (minuman)
    fireEvent.keyDown(button, { key: "ArrowDown" });
    // Enter selects the currently highlighted option
    fireEvent.keyDown(button, { key: "Enter" });

    expect(handleChange).toHaveBeenCalledWith("minuman");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    // Reopen and test Escape
    fireEvent.keyDown(button, { key: " " });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(button, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not open when disabled", async () => {
    render(
      <CustomSelect label="Status" value="makanan" options={options} onChange={() => {}} disabled />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
