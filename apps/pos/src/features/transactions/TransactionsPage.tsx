import React, { useEffect, useMemo, useState } from "react";
import { Table, type TableColumn, type SortDirection } from "../../components/Table";
import { CustomSelect } from "../../components/CustomSelect";
import { DateRangePicker } from "../../components/DateRangePicker";
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

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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

  // Sorting handler
  const handleSort = (key: string) => {
    if (sortColumn === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn("createdAt");
        setSortDirection("desc");
      }
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
  };

  // Sorted transactions
  const sortedTransactions = useMemo(() => {
    if (!sortColumn || !sortDirection) return transactions;
    return [...transactions].sort((a, b) => {
      let aVal: string | number = (a as unknown as Record<string, unknown>)[sortColumn] as
        string | number;
      let bVal: string | number = (b as unknown as Record<string, unknown>)[sortColumn] as
        string | number;
      if (sortColumn === "cashierId") {
        aVal = usersMap.get(a.cashierId) || "";
        bVal = usersMap.get(b.cashierId) || "";
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || "");
      const bStr = String(bVal || "");
      return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [transactions, sortColumn, sortDirection, usersMap]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / PAGE_SIZE));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedTransactions.slice(start, start + PAGE_SIZE);
  }, [sortedTransactions, currentPage]);

  // Summary line: total of filtered transactions
  const filteredTotal = useMemo(() => {
    return transactions.reduce((acc, tx) => acc + tx.total, 0);
  }, [transactions]);

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
      sortable: true,
      render: (tx) => (
        <span className="font-mono font-medium text-[var(--text)]">{tx.invoiceNo}</span>
      ),
    },
    {
      key: "createdAt",
      header: t("history.table.time"),
      sortable: true,
      render: (tx) => (
        <span className="tabular-nums text-[var(--text)]">
          {formatReceiptDateTime(tx.createdAt).full}
        </span>
      ),
    },
    {
      key: "cashierId",
      header: t("history.table.cashier"),
      sortable: true,
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
      sortable: true,
      render: (tx) => (
        <span className="tabular-nums font-semibold text-[var(--text)]">
          {formatRupiah(tx.total)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("history.table.status"),
      sortable: true,
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
        {/* Date Range Picker */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-[var(--text-muted)]">
            {t("datePicker.selectRange")}
          </label>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            allowEmpty
            onChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Cashier Filter (Admin only) */}
        {isAdmin && (
          <div className="w-52">
            <CustomSelect
              id="history-cashier-filter"
              label={t("history.filterCashier")}
              aria-label={t("history.filterCashier")}
              value={selectedCashierId}
              onChange={(val) => {
                setSelectedCashierId(val);
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: t("history.allCashiers") },
                ...users.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` })),
              ]}
            />
          </div>
        )}

        {/* Status Filter */}
        <div className="w-44">
          <CustomSelect
            id="history-status-filter"
            label={t("history.filterStatus")}
            aria-label={t("history.filterStatus")}
            value={selectedStatus}
            onChange={(val) => {
              setSelectedStatus(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "", label: t("history.allStatuses") },
              { value: "completed", label: t("history.statusCompleted") },
              { value: "void", label: t("history.statusVoid") },
            ]}
          />
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
            {t("history.resetFilter")}
          </button>
        )}
      </div>

      {/* Filtered Result Summary Line */}
      <div className="flex items-center justify-between text-sm font-medium text-[var(--text-muted)] px-1">
        <span>
          {t("history.summaryLine", {
            count: transactions.length,
            total: formatRupiah(filteredTotal),
          })}
        </span>
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
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
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
