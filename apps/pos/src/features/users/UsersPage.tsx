import React, { useEffect, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "../../components/Button";
import { Table, type Column } from "../../components/Table";
import { usersRepo, LastAdminProtectionError } from "../../db/repositories/usersRepo";
import type { User } from "../../db/schema";
import { UserDrawer } from "./UserDrawer";
import { ResetPinModal } from "./ResetPinModal";
import { t } from "../../i18n";

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [resetPinTarget, setResetPinTarget] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    const list = await usersRepo.getUsers();
    setUsers(list);
  };

  useEffect(() => {
    let isMounted = true;
    usersRepo.getUsers().then((list) => {
      if (isMounted) setUsers(list);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeAdminCount = useMemo(() => {
    return users.filter((u) => u.role === "admin" && u.isActive).length;
  }, [users]);

  const handleToggleActive = async (user: User) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Prevent deactivating last active admin
    if (user.role === "admin" && user.isActive && activeAdminCount <= 1) {
      setErrorMessage(t("users.errors.lastAdmin"));
      return;
    }

    try {
      const updated = await usersRepo.toggleActive(user.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setSuccessMessage(t("users.toast.userUpdated"));
    } catch (err) {
      if (err instanceof LastAdminProtectionError) {
        setErrorMessage(t("users.errors.lastAdmin"));
      } else {
        setErrorMessage("Gagal mengubah status pengguna.");
      }
    }
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: t("users.table.name"),
      render: (u) => <span className="font-medium text-[var(--text)]">{u.name}</span>,
    },
    {
      key: "role",
      header: t("users.table.role"),
      render: (u) => (
        <span className="text-[var(--text)]">
          {u.role === "admin" ? t("users.table.roleAdmin") : t("users.table.roleCashier")}
        </span>
      ),
    },
    {
      key: "status",
      header: t("users.table.status"),
      render: (u) => {
        return (
          <span
            className={`font-medium ${
              u.isActive ? "text-[var(--text)]" : "text-[var(--text-muted)]"
            }`}
          >
            {u.isActive ? t("users.table.statusActive") : t("users.table.statusInactive")}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: t("users.table.action"),
      isNumeric: true,
      render: (u) => {
        const isLastAdmin = u.role === "admin" && u.isActive && activeAdminCount <= 1;

        return (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setResetPinTarget(u)}
              className="text-sm font-medium text-[var(--primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--primary)] rounded-[var(--radius-control)] cursor-pointer min-h-[44px] px-2 py-1"
            >
              {t("users.table.resetPin")}
            </button>

            <button
              type="button"
              onClick={() => handleToggleActive(u)}
              disabled={isLastAdmin}
              title={isLastAdmin ? t("users.errors.lastAdmin") : undefined}
              className={`text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)] rounded-[var(--radius-control)] min-h-[44px] px-2 py-1 ${
                isLastAdmin
                  ? "text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                  : u.isActive
                    ? "text-[var(--danger)] hover:underline cursor-pointer"
                    : "text-[var(--primary)] hover:underline cursor-pointer"
              }`}
            >
              {u.isActive ? t("users.table.deactivate") : t("users.table.activate")}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
          {t("users.title")}
        </h1>

        <Button
          variant="primary"
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          <span>{t("users.addUser")}</span>
        </Button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 bg-[var(--danger-soft)] text-[var(--danger)] rounded-[var(--radius-control)] border border-[var(--danger)] text-sm font-medium"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="p-4 bg-[var(--primary-soft)] text-[var(--primary)] rounded-[var(--radius-control)] border border-[var(--primary)] text-sm font-medium"
        >
          {successMessage}
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-control)] overflow-hidden">
        <Table
          columns={columns}
          data={users}
          keyExtractor={(u) => u.id}
          emptyMessage="Belum ada data pengguna."
        />
      </div>

      {/* User Drawer */}
      <UserDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUserCreated={(newUser) => {
          setUsers((prev) => [...prev, newUser]);
          setSuccessMessage(t("users.toast.userCreated"));
        }}
      />

      {/* Reset PIN Modal */}
      <ResetPinModal
        isOpen={Boolean(resetPinTarget)}
        onClose={() => setResetPinTarget(null)}
        user={resetPinTarget}
        onPinResetSuccess={() => {
          loadUsers();
          setSuccessMessage(t("users.toast.pinReset"));
        }}
      />
    </main>
  );
};
