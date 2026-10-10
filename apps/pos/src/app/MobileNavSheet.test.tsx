import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { MobileNavSheet } from "./MobileNavSheet";
import type { NavItem } from "../features/auth/permissions";

describe("MobileNavSheet", () => {
  const items: NavItem[] = [
    { id: "reports", labelKey: "nav.reports", path: "/laporan" },
    { id: "users", labelKey: "nav.users", path: "/pengguna" },
    { id: "settings", labelKey: "nav.settings", path: "/pengaturan" },
  ];

  it("does not render when isOpen is false", () => {
    render(
      <MemoryRouter>
        <MobileNavSheet isOpen={false} onClose={() => {}} items={items} onLock={() => {}} />
      </MemoryRouter>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders remaining navigation items and lock button when isOpen is true", async () => {
    const handleClose = vi.fn();
    const handleLock = vi.fn();

    render(
      <MemoryRouter>
        <MobileNavSheet isOpen={true} onClose={handleClose} items={items} onLock={handleLock} />
      </MemoryRouter>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Laporan/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Pengguna/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Pengaturan/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Kunci/i })).toBeInTheDocument();

    // Clicking Lock calls onLock
    await userEvent.click(screen.getByRole("button", { name: /Kunci/i }));
    expect(handleLock).toHaveBeenCalled();
  });

  it("closes on Escape key press", () => {
    const handleClose = vi.fn();

    render(
      <MemoryRouter>
        <MobileNavSheet isOpen={true} onClose={handleClose} items={items} onLock={() => {}} />
      </MemoryRouter>
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalled();
  });
});
