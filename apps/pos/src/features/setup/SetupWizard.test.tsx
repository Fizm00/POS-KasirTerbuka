import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SetupWizard } from "./SetupWizard";
import { db } from "../../db/schema";
import { useAuthStore } from "../auth/authStore";

describe("SetupWizard", () => {
  beforeEach(async () => {
    await db.settings.clear();
    await db.users.clear();
    useAuthStore.getState().lock();
  });

  it("walks through 4 steps with business preset, validates input, and completes setup", async () => {
    // Mock navigator.storage.persist
    const persistMock = vi.fn().mockResolvedValue(true);
    Object.defineProperty(globalThis.navigator, "storage", {
      value: { persist: persistMock },
      configurable: true,
    });

    render(
      <MemoryRouter>
        <SetupWizard />
      </MemoryRouter>
    );

    // Step 1: Business preset selection
    expect(screen.getByText(/Langkah 1 dari 4/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Jenis usaha/i })).toBeInTheDocument();
    expect(screen.getByText(/Kafe \/ Warung makan/i)).toBeInTheDocument();

    // Select Cafe preset
    await userEvent.click(screen.getByRole("radio", { name: /Kafe \/ Warung makan/i }));
    await userEvent.click(screen.getByRole("button", { name: /Lanjut/i }));

    // Step 2: Store data
    expect(screen.getByText(/Langkah 2 dari 4/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama toko/i)).toBeInTheDocument();

    // Click next without store name -> error
    await userEvent.click(screen.getByRole("button", { name: /Lanjut/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Nama toko wajib diisi/i);

    // Fill store info
    await userEvent.type(screen.getByLabelText(/Nama toko/i), "Kopi Senja");
    await userEvent.type(screen.getByLabelText(/Alamat/i), "Jl. Pemuda No. 1");
    await userEvent.type(screen.getByLabelText(/Nomor telepon/i), "0812345678");
    await userEvent.click(screen.getByRole("button", { name: /Lanjut/i }));

    // Step 3: Admin account
    expect(screen.getByText(/Langkah 3 dari 4/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama admin/i)).toBeInTheDocument();

    // Fill invalid PIN -> error
    await userEvent.type(screen.getByLabelText(/Nama admin/i), "Pak Budi");
    await userEvent.type(screen.getByLabelText(/^PIN/i), "12"); // only 2 digits
    await userEvent.type(screen.getByLabelText(/Ulangi PIN/i), "12");
    await userEvent.click(screen.getByRole("button", { name: /Lanjut/i }));
    expect(screen.getByText(/PIN harus berupa 4 sampai 6 digit/i)).toBeInTheDocument();

    // Fill mismatched PIN -> error
    await userEvent.clear(screen.getByLabelText(/^PIN/i));
    await userEvent.clear(screen.getByLabelText(/Ulangi PIN/i));
    await userEvent.type(screen.getByLabelText(/^PIN/i), "1234");
    await userEvent.type(screen.getByLabelText(/Ulangi PIN/i), "4321");
    await userEvent.click(screen.getByRole("button", { name: /Lanjut/i }));
    expect(screen.getByText(/Konfirmasi PIN tidak cocok/i)).toBeInTheDocument();

    // Fill valid matching PIN
    await userEvent.clear(screen.getByLabelText(/Ulangi PIN/i));
    await userEvent.type(screen.getByLabelText(/Ulangi PIN/i), "1234");
    await userEvent.click(screen.getByRole("button", { name: /Lanjut/i }));

    // Step 4: Finish
    expect(screen.getByText(/Langkah 4 dari 4/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Semua data toko, produk, dan transaksi disimpan langsung/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Buat cadangan secara berkala/i)).toBeInTheDocument();

    // Complete setup
    await userEvent.click(screen.getByRole("button", { name: /Mulai memakai/i }));

    // Verify storage.persist was called
    await waitFor(() => {
      expect(persistMock).toHaveBeenCalled();
    });

    // Verify DB records
    await waitFor(async () => {
      const users = await db.users.toArray();
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe("Pak Budi");
      expect(users[0].role).toBe("admin");
      expect(users[0].pinHash).toContain(":"); // Hashed with salt
    });

    const settings = await db.settings.get("default");
    expect(settings?.storeName).toBe("Kopi Senja");
    expect(settings?.businessType).toBe("cafe");
    expect(settings?.productView).toBe("photo");
    expect(settings?.features?.photos).toBe(true);
    expect(settings?.features?.shifts).toBe(true);
    expect(settings?.features?.tables).toBe(true);
    expect(settings?.features?.variants).toBe(true);
    expect(settings?.features?.holdOrders).toBe(true);
    expect(settings?.features?.stockIn).toBe(false);

    // Verify auth store is unlocked
    expect(useAuthStore.getState().isLocked).toBe(false);
    expect(useAuthStore.getState().currentUser?.name).toBe("Pak Budi");
  }, 15000);
});
