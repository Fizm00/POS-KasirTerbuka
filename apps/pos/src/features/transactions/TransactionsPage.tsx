import React, { useEffect, useMemo, useState } from "react";
import { Table, type TableColumn } from "../../components/Table";
import { settingsRepo } from "../../db/repositories/settingsRepo";
import { transactionsRepo } from "../../db/repositories/transactionsRepo";
import { usersRepo } from "../../db/repositories/usersRepo";
import type { StoreSettings, Transaction, TransactionStatus, User } from "../../db/schema";
import { useAuthStore } from "../auth/authStore";
import { canVoidTransaction } from "../auth/permissions";
import { TransactionDetailDrawer } from "./TransactionDetailDrawer";
import { formatRupiah } from "../../lib/money";
import { formatPaymentMethodName, formatReceiptDateTime } from "../../printing/receipt";
import { t } from "../../i18n";

const PAGE_SIZE = 15;

export const TransactionsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === "admin";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Filters state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCashierId, setSelectedCashierId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // Load users and settings once
  useEffect(() => {
    async function loadMeta() {
      const [uList, s] = await Promise.all([usersRepo.getUsers(), settingsRepo.getSettings()]);
      setUsers(uList);
      setSettings(s);
    }
    loadMeta();
  }, []);

  // Map of userId -> name
  const usersMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) {
      map.set(u.id, u.name);
    }
    return map;
  }, [users]);

  useEffect(() => {
    let isMounted = true;
    if (!currentUser) return;

    const startIso = startDate ? new Date(`${startDate}T00:00:00`).toISOString() : undefined;
    const endIso = endDate ? new Date(`${endDate}T23:59:59.999`).toISOString() : undefined;

    transactionsRepo
      .getForUser(currentUser, {
        startDate: startIso,
        endDate: endIso,
        cashierId: selectedCashierId || undefined,
        status: (selectedStatus as TransactionStatus) || undefined,
      })
      .then((txList) => {
        if (isMounted) {
          setTransactions(txList);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser, startDate, endDate, selectedCashierId, selectedStatus]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return transactions.slice(start, start + PAGE_SIZE);
  }, [transactions, currentPage]);

  const handleVoidConfirm = async (txId: string, reason: string): Promise<Transaction> => {
    if (!currentUser) throw new Error("Pengguna belum masuk.");
    const updated = await transactionsRepo.voidSale(txId, {
      voidedBy: currentUser.name,
      voidReason: reason,
      userRole: currentUser.role,
    });
    return updated;
  };

  const handleVoidSuccess = (updatedTx: Transaction) => {
    setTransactions((prev) => prev.map((tx) => (tx.id === updatedTx.id ? updatedTx : tx)));
    setSelectedTx(updatedTx);
  };

  // Table columns definition
  const columns: TableColumn<Transaction>[] = [
    {
      key: "invoiceNo",
      header: t("history.table.invoiceNo"),
      render: (tx) => (
        <span className="font-mono font-medium text-[var(--text)]">{tx.invoiceNo}</span>
      ),
    },
    {
      key: "createdAt",
      header: t("history.table.time"),
      render: (tx) => (
        <span className="tabular-nums text-[var(--text)]">
          {formatReceiptDateTime(tx.createdAt).full}
        </span>
      ),
    },
    {
      key: "cashierId",
      header: t("history.table.cashier"),
      render: (tx) => (
        <span className="text-[var(--text)]">{usersMap.get(tx.cashierId) || "Kasir"}</span>
      ),
    },
    {
      key: "paymentMethod",
      header: t("history.table.paymentMethod"),
      render: (tx) => (
        <span className="text-[var(--text)]">{formatPaymentMethodName(tx.paymentMethod)}</span>
      ),
    },
    {
      key: "total",
      header: t("history.table.total"),
      isNumeric: true,
      render: (tx) => (
        <span className="tabular-nums font-semibold text-[var(--text)]">
          {formatRupiah(tx.total)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("history.table.status"),
      render: (tx) => {
        const isVoid = tx.status === "void";
        return (
          <span
            className={`font-medium ${
              isVoid ? "text-[var(--danger)]" : "text-[var(--text-muted)]"
            }`}
          >
            {isVoid ? t("history.statusVoid") : t("history.statusCompleted")}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: t("history.table.action"),
      isNumeric: true,
      render: (tx) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTx(tx);
          }}
          className="min-h-[48px] px-3 py-2 text-sm font-medium text-[var(--primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--primary)] rounded-[var(--radius-control)] cursor-pointer"
        >
          {t("history.table.viewDetail")}
        </button>
      ),
    },
  ];

  const hasActiveFilters =
    Boolean(startDate) || Boolean(endDate) || Boolean(selectedCashierId) || Boolean(selectedStatus);

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
          {t("history.title")}
        </h1>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-end gap-3 bg-[var(--surface)] p-4 border border-[var(--border)] rounded-[var(--radius-control)]">
        {/* Date From */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-[var(--text-muted)]">
            {t("history.filterDateFrom")}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            aria-label={t("history.filterDateFrom")}
            className="min-h-[48px] h-[48px] px-3 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] cursor-pointer"
          />
        </div>

        {/* Date To */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-[var(--text-muted)]">
            {t("history.filterDateTo")}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            aria-label={t("history.filterDateTo")}
            className="min-h-[48px] h-[48px] px-3 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] cursor-pointer"
          />
        </div>

        {/* Cashier Filter (Admin only) */}
        {isAdmin && (
          <div className="space-y-1">
            <label className="block text-xs font-medium text-[var(--text-muted)]">
              {t("history.filterCashier")}
            </label>
            <select
              value={selectedCashierId}
              onChange={(e) => {
                setSelectedCashierId(e.target.value);
                setCurrentPage(1);
              }}
              aria-label={t("history.filterCashier")}
              className="min-h-[48px] h-[48px] px-3.5 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] cursor-pointer"
            >
              <option value="">{t("history.allCashiers")}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-[var(--text-muted)]">
            {t("history.filterStatus")}
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            aria-label={t("history.filterStatus")}
            className="min-h-[48px] h-[48px] px-3.5 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] cursor-pointer"
          >
            <option value="">{t("history.allStatuses")}</option>
            <option value="completed">{t("history.statusCompleted")}</option>
            <option value="void">{t("history.statusVoid")}</option>
          </select>
        </div>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setSelectedCashierId("");
              setSelectedStatus("");
              setCurrentPage(1);
            }}
            className="min-h-[48px] px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <Table<Transaction>
        columns={columns}
        data={paginatedTransactions}
        keyExtractor={(tx) => tx.id}
        onRowClick={(tx) => setSelectedTx(tx)}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyMessage={
          hasActiveFilters ? t("history.empty.noFilterResults") : t("history.empty.noTransactions")
        }
      />

      {/* Detail Right Drawer */}
      <TransactionDetailDrawer
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
        settings={settings}
        canVoid={canVoidTransaction(currentUser?.role || "kasir")}
        cashierName={selectedTx ? usersMap.get(selectedTx.cashierId) : "Kasir"}
        onVoidSuccess={handleVoidSuccess}
        onVoidConfirm={handleVoidConfirm}
      />
    </main>
  );
};
