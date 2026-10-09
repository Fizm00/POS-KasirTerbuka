import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

describe("Modal component", () => {
  it("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Pembayaran">
        Konten modal
      </Modal>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders when isOpen is true and displays title and content", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Pembayaran">
        Konten modal
      </Modal>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Pembayaran")).toBeInTheDocument();
    expect(screen.getByText("Konten modal")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Pembayaran">
        Konten modal
      </Modal>
    );

    await userEvent.click(screen.getByRole("button", { name: "Tutup" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", async () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Pembayaran">
        Konten modal
      </Modal>
    );

    await userEvent.keyboard("{Escape}");
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
