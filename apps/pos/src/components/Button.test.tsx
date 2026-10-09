import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button component", () => {
  it("renders children correctly", () => {
    render(<Button>Simpan produk</Button>);
    expect(screen.getByRole("button", { name: "Simpan produk" })).toBeInTheDocument();
  });

  it("handles clicks when enabled", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Simpan</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("prevents clicks when disabled", async () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Simpan
      </Button>
    );

    const button = screen.getByRole("button", { name: "Simpan" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("sets aria-busy and disables interaction when loading", async () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Menyimpan
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
  });
});
