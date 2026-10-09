import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { UsersPage } from "./UsersPage";
import { db, type User } from "../../db/schema";
import { usersRepo, LastAdminProtectionError } from "../../db/repositories/usersRepo";
import { hashPin, verifyPin } from "../auth/pin";

describe("UsersPage & Last-Admin Protection", () => {
  const adminUser: User = {
    id: "admin-1",
    name: "Budi Admin",
    role: "admin",
    pinHash: "admin-hash",
    isActive: true,
  };

  const cashierUser: User = {
    id: "kasir-1",
    name: "Rina Kasir",
    role: "kasir",
    pinHash: "kasir-hash",
    isActive: true,
  };

  beforeEach(async () => {
    await db.users.clear();
    await db.users.bulkAdd([adminUser, cashierUser]);
  });

  it("renders user list with role, status, and actions", async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Budi Admin")).toBeInTheDocument();
      expect(screen.getByText("Rina Kasir")).toBeInTheDocument();
    });

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Kasir")).toBeInTheDocument();
  });

  it("prevents the last active admin from being deactivated (UI and repository)", async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Budi Admin")).toBeInTheDocument();
    });

    // Locate the row for Budi Admin (the only active admin)
    const adminRow = screen.getByText("Budi Admin").closest("tr")!;
    const deactivateBtn = within(adminRow).getByRole("button", {
      name: "Nonaktifkan",
    });

    // Button MUST be disabled
    expect(deactivateBtn).toBeDisabled();

    // Repository also strictly throws LastAdminProtectionError
    await expect(usersRepo.updateUser("admin-1", { isActive: false })).rejects.toThrow(
      LastAdminProtectionError
    );
    await expect(usersRepo.updateUser("admin-1", { role: "kasir" })).rejects.toThrow(
      LastAdminProtectionError
    );
  });

  it("allows deactivating and reactivating a cashier", async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Rina Kasir")).toBeInTheDocument();
    });

    const cashierRow = screen.getByText("Rina Kasir").closest("tr")!;
    const deactivateBtn = within(cashierRow).getByRole("button", {
      name: "Nonaktifkan",
    });

    expect(deactivateBtn).not.toBeDisabled();
    await userEvent.click(deactivateBtn);

    // Status should update to Nonaktif and button becomes Aktifkan
    await waitFor(() => {
      expect(within(cashierRow).getByText("Nonaktif")).toBeInTheDocument();
      expect(within(cashierRow).getByRole("button", { name: "Aktifkan" })).toBeInTheDocument();
    });

    // Click Aktifkan
    const activateBtn = within(cashierRow).getByRole("button", {
      name: "Aktifkan",
    });
    await userEvent.click(activateBtn);

    await waitFor(() => {
      expect(within(cashierRow).getByText("Aktif")).toBeInTheDocument();
    });
  });

  it("creates a new user with hashed PIN and adds to list", async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Budi Admin")).toBeInTheDocument();
    });

    // Open Drawer
    const addBtn = screen.getByRole("button", { name: /Tambah pengguna/i });
    await userEvent.click(addBtn);

    // Form inputs
    const nameInput = screen.getByLabelText(/Nama lengkap/i);
    const pinInput = screen.getByLabelText(/PIN \(4-6 digit\)/i);

    await userEvent.type(nameInput, "Doni Kasir Baru");
    await userEvent.type(pinInput, "1234");

    // Submit form
    const submitBtn = screen.getByRole("button", { name: "Simpan pengguna" });
    await userEvent.click(submitBtn);

    // Check newly added user appears in table
    await waitFor(() => {
      expect(screen.getByText("Doni Kasir Baru")).toBeInTheDocument();
    });

    // Verify in database that PIN was salted & hashed, not stored plaintext
    const addedUser = (await db.users.toArray()).find((u) => u.name === "Doni Kasir Baru");
    expect(addedUser).toBeDefined();
    expect(addedUser?.pinHash).not.toBe("1234");
    expect(await verifyPin("1234", addedUser!.pinHash)).toBe(true);
  });

  it("resets PIN for an existing user and new PIN verifies successfully", async () => {
    const originalHash = await hashPin("1111");
    await db.users.update("kasir-1", { pinHash: originalHash });

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Rina Kasir")).toBeInTheDocument();
    });

    const cashierRow = screen.getByText("Rina Kasir").closest("tr")!;
    const resetBtn = within(cashierRow).getByRole("button", {
      name: "Atur ulang PIN",
    });
    await userEvent.click(resetBtn);

    // Reset PIN Modal opens
    const modal = screen.getByRole("dialog");
    expect(within(modal).getByText(/Atur ulang PIN untuk Rina Kasir/i)).toBeInTheDocument();

    const newPinInput = within(modal).getByLabelText(/PIN baru \(4-6 digit\)/i);
    const confirmPinInput = within(modal).getByLabelText(/Ulangi PIN baru/i);

    await userEvent.type(newPinInput, "9999");
    await userEvent.type(confirmPinInput, "9999");

    const savePinBtn = within(modal).getByRole("button", {
      name: "Simpan PIN",
    });
    await userEvent.click(savePinBtn);

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Check database has new hash and old PIN fails
    const updated = await db.users.get("kasir-1");
    expect(await verifyPin("1111", updated!.pinHash)).toBe(false);
    expect(await verifyPin("9999", updated!.pinHash)).toBe(true);
  });
});
