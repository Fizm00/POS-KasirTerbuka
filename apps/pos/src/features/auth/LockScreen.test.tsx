import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LockScreen } from "./LockScreen";
import { db } from "../../db/schema";
import { hashPin } from "./pin";
import { useAuthStore } from "./authStore";

describe("LockScreen", () => {
  beforeEach(async () => {
    await db.settings.clear();
    await db.users.clear();
    useAuthStore.getState().lock();

    await db.settings.put({
      id: "default",
      storeName: "Warung Bu Siti",
      address: "",
      phone: "",
      receiptFooter: "",
      paperWidth: 58,
      currency: "IDR",
    });
  });

  it("renders keypad and shows wrong PIN message only after a failed attempt", async () => {
    const hashed = await hashPin("1234");
    await db.users.add({
      id: "user-1",
      name: "Siti",
      role: "admin",
      pinHash: hashed,
      isActive: true,
    });

    render(
      <MemoryRouter>
        <LockScreen />
      </MemoryRouter>
    );

    // Wait for store name and user to load
    await waitFor(() => {
      expect(screen.getByText("Warung Bu Siti")).toBeInTheDocument();
    });

    // Error message must NOT be present before an attempt
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/PIN salah/i)).not.toBeInTheDocument();

    // Type wrong PIN (9, 9, 9, 9, 9, 9)
    await userEvent.click(screen.getByRole("button", { name: "9" }));
    await userEvent.click(screen.getByRole("button", { name: "9" }));
    await userEvent.click(screen.getByRole("button", { name: "9" }));
    await userEvent.click(screen.getByRole("button", { name: "9" }));
    await userEvent.click(screen.getByRole("button", { name: "9" }));
    await userEvent.click(screen.getByRole("button", { name: "9" }));

    // Now error message MUST appear
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/PIN salah\. Coba lagi\./i);
    });

    // Now type correct PIN (1, 2, 3, 4)
    await userEvent.click(screen.getByRole("button", { name: "1" }));
    await userEvent.click(screen.getByRole("button", { name: "2" }));
    await userEvent.click(screen.getByRole("button", { name: "3" }));
    await userEvent.click(screen.getByRole("button", { name: "4" }));

    // Auth store should be unlocked
    await waitFor(() => {
      expect(useAuthStore.getState().isLocked).toBe(false);
      expect(useAuthStore.getState().currentUser?.name).toBe("Siti");
    });
  });

  it("shows user picker when there is more than one active user", async () => {
    const hashAdmin = await hashPin("1111");
    const hashKasir = await hashPin("2222");

    await db.users.bulkAdd([
      { id: "u1", name: "Budi Admin", role: "admin", pinHash: hashAdmin, isActive: true },
      { id: "u2", name: "Rina Kasir", role: "kasir", pinHash: hashKasir, isActive: true },
    ]);

    render(
      <MemoryRouter>
        <LockScreen />
      </MemoryRouter>
    );

    // Both users should appear in picker
    await waitFor(() => {
      expect(screen.getByText("Budi Admin")).toBeInTheDocument();
      expect(screen.getByText("Rina Kasir")).toBeInTheDocument();
    });

    // Select Rina Kasir
    await userEvent.click(screen.getByText("Rina Kasir"));

    // Keypad should now be visible and Rina selected
    expect(screen.getByText(/Rina Kasir/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
  });
});
