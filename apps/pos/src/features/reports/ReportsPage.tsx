import React, { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button } from "../../components/Button";
import { Table, type Column } from "../../components/Table";
import {
  reportsRepo,
  type DailySalesItem,
  type SalesSummary,
  type TopProductItem,
} from "../../db/repositories/reportsRepo";
import { usersRepo } from "../../db/repositories/usersRepo";
import { type User } from "../../db/schema";
import { formatRupiah } from "../../lib/money";
import {
  formatJakartaDisplayDate,
  getPresetDateRange,
  jakartaDateToIsoRange,
  type DatePreset,
} from "../../lib/dates";
import { downloadCsvFile, generateTransactionsCsv } from "../../lib/csv";
import { t } from "../../i18n";

export const ReportsPage: React.FC = () => {
  const [activePreset, setActivePreset] = useState<DatePreset>("today");

  // Initial date strings default to "Hari ini" in Asia/Jakarta
  const initialRange = useMemo(() => getPresetDateRange("today"), []);
  const [startDateStr, setStartDateStr] = useState(initialRange.startDateStr);
  const [endDateStr, setEndDateStr] = useState(initialRange.endDateStr);

  const [summary, setSummary] = useState<SalesSummary>({
    totalSales: 0,
    transactionCount: 0,
    averagePerTransaction: 0,
    grossProfit: 0,
  });
  const [dailySales, setDailySales] = useState<DailySalesItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Load users once for mapping cashier names in CSV export
  useEffect(() => {
    let isMounted = true;
    usersRepo.getUsers().then((uList) => {
      if (isMounted) {
        setUsers(uList);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const usersMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) {
      map.set(u.id, u.name);
    }
    return map;
  }, [users]);

  // Handle Preset selection
  const handleSelectPreset = (preset: "today" | "7days" | "month") => {
    setActivePreset(preset);
    const range = getPresetDateRange(preset);
    setStartDateStr(range.startDateStr);
    setEndDateStr(range.endDateStr);
  };

  // Handle custom date change
  const handleStartDateChange = (val: string) => {
    setStartDateStr(val);
    setActivePreset("custom");
  };

  const handleEndDateChange = (val: string) => {
    setEndDateStr(val);
    setActivePreset("custom");
  };

  // Fetch report data whenever start/end dates change
  useEffect(() => {
    let isMounted = true;
    if (!startDateStr || !endDateStr) return;

    const { startDateIso, endDateIso } = jakartaDateToIsoRange(startDateStr, endDateStr);
    const dateRange = { startDate: startDateIso, endDate: endDateIso };

    Promise.all([
      reportsRepo.getSummary(dateRange),
      reportsRepo.getDailySales(dateRange),
      reportsRepo.getTopProducts(dateRange, 10),
    ]).then(([sum, daily, top]) => {
      if (isMounted) {
        setSummary(sum);
        setDailySales(daily);
        setTopProducts(top);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [startDateStr, endDateStr]);

  // Export CSV handler
  const handleExportCsv = async () => {
    if (!startDateStr || !endDateStr) return;
    try {
      setIsExporting(true);
      const { startDateIso, endDateIso } = jakartaDateToIsoRange(startDateStr, endDateStr);
      const transactions = await reportsRepo.getCompletedTransactions({
        startDate: startDateIso,
        endDate: endDateIso,
      });

      const csv = generateTransactionsCsv(transactions, usersMap);
      const filename = `transaksi-${startDateStr}-sd-${endDateStr}.csv`;
      downloadCsvFile(filename, csv);
    } finally {
      setIsExporting(false);
    }
  };

  // Top products table columns
  const topProductColumns: Column<TopProductItem>[] = [
    {
      key: "rank",
      header: t("reports.topProducts.rank"),
      render: (_row: TopProductItem, index: number) => (
        <span className="font-medium text-[var(--text-muted)]">{index + 1}</span>
      ),
    },
    {
      key: "name",
      header: t("reports.topProducts.name"),
      render: (item) => <span className="font-medium text-[var(--text)]">{item.name}</span>,
    },
    {
      key: "sku",
      header: t("reports.topProducts.sku"),
      render: (item) => (
        <span className="text-sm font-mono text-[var(--text-muted)]">{item.sku}</span>
      ),
    },
    {
      key: "unitsSold",
      header: t("reports.topProducts.sold"),
      isNumeric: true,
      render: (item) => (
        <span className="tabular-nums font-medium text-[var(--text)]">
          {item.unitsSold.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      key: "revenue",
      header: t("reports.topProducts.revenue"),
      isNumeric: true,
      render: (item) => (
        <span className="tabular-nums font-semibold text-[var(--text)]">
          {formatRupiah(item.revenue)}
        </span>
      ),
    },
  ];

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header and Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
            {t("reports.title")}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">{t("reports.voidExclusionNote")}</p>
        </div>

        {/* CSV Export Button */}
        <Button
          variant="secondary"
          onClick={handleExportCsv}
          disabled={isExporting}
          isLoading={isExporting}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>{t("reports.exportCsv")}</span>
        </Button>
      </div>

      {/* Date Presets and Custom Filter Controls */}
      <div className="flex flex-wrap items-end gap-3 bg-[var(--surface)] p-4 border border-[var(--border)] rounded-[var(--radius-control)]">
        {/* Presets Button Group */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-control)]">
          <button
            type="button"
            onClick={() => handleSelectPreset("today")}
            className={`min-h-[40px] px-3.5 text-sm font-medium rounded-[var(--radius-control)] transition-colors cursor-pointer ${
              activePreset === "today"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {t("reports.presetToday")}
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset("7days")}
            className={`min-h-[40px] px-3.5 text-sm font-medium rounded-[var(--radius-control)] transition-colors cursor-pointer ${
              activePreset === "7days"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {t("reports.preset7Days")}
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset("month")}
            className={`min-h-[40px] px-3.5 text-sm font-medium rounded-[var(--radius-control)] transition-colors cursor-pointer ${
              activePreset === "month"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {t("reports.presetMonth")}
          </button>
        </div>

        {/* Custom Range: Dari Tanggal */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-[var(--text-muted)]">
            {t("reports.dateFrom")}
          </label>
          <input
            type="date"
            aria-label={t("reports.dateFrom")}
            value={startDateStr}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="min-h-[48px] h-[48px] px-3 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] cursor-pointer"
          />
        </div>

        {/* Custom Range: Sampai Tanggal */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-[var(--text-muted)]">
            {t("reports.dateTo")}
          </label>
          <input
            type="date"
            aria-label={t("reports.dateTo")}
            value={endDateStr}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="min-h-[48px] h-[48px] px-3 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] cursor-pointer"
          />
        </div>
      </div>

      {/* Four Plain Figures in a row (no icons, no colored circles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Penjualan */}
        <div className="bg-[var(--surface)] p-5 border border-[var(--border)] rounded-[var(--radius-control)] flex flex-col justify-between">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {t("reports.summary.totalSales")}
          </span>
          <span className="text-2xl font-bold tracking-tight text-[var(--text)] tabular-nums mt-2">
            {formatRupiah(summary.totalSales)}
          </span>
        </div>

        {/* Jumlah Transaksi */}
        <div className="bg-[var(--surface)] p-5 border border-[var(--border)] rounded-[var(--radius-control)] flex flex-col justify-between">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {t("reports.summary.transactionCount")}
          </span>
          <span className="text-2xl font-bold tracking-tight text-[var(--text)] tabular-nums mt-2">
            {summary.transactionCount.toLocaleString("id-ID")}
          </span>
        </div>

        {/* Rata-rata per Transaksi */}
        <div className="bg-[var(--surface)] p-5 border border-[var(--border)] rounded-[var(--radius-control)] flex flex-col justify-between">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {t("reports.summary.averagePerTransaction")}
          </span>
          <span className="text-2xl font-bold tracking-tight text-[var(--text)] tabular-nums mt-2">
            {formatRupiah(summary.averagePerTransaction)}
          </span>
        </div>

        {/* Laba Kotor */}
        <div className="bg-[var(--surface)] p-5 border border-[var(--border)] rounded-[var(--radius-control)] flex flex-col justify-between">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {t("reports.summary.grossProfit")}
          </span>
          <span className="text-2xl font-bold tracking-tight text-[var(--text)] tabular-nums mt-2">
            {formatRupiah(summary.grossProfit)}
          </span>
        </div>
      </div>

      {/* Below: Bar Chart of Daily Sales and Top Products Table */}
      <div className="space-y-6">
        {/* Single-color Bar Chart of Daily Sales */}
        <div className="bg-[var(--surface)] p-5 border border-[var(--border)] rounded-[var(--radius-control)] space-y-4">
          <h2 className="text-base font-semibold text-[var(--text)]">{t("reports.chart.title")}</h2>

          <div className="w-full h-[280px]">
            {dailySales.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-[var(--text-muted)]">
                {t("common.empty")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySales} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val: string) => formatJakartaDisplayDate(val).slice(0, 5)}
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    label={{
                      value: t("reports.chart.dateLabel"),
                      position: "insideBottom",
                      offset: -12,
                      fontSize: 11,
                      fill: "var(--text-muted)",
                    }}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val: number) =>
                      val >= 1000000
                        ? `${(val / 1000000).toFixed(1)}jt`
                        : val >= 1000
                          ? `${Math.round(val / 1000)}rb`
                          : String(val)
                    }
                    label={{
                      value: t("reports.chart.salesLabel"),
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 11,
                      fill: "var(--text-muted)",
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--bg)" }}
                    formatter={(value: unknown) => [
                      formatRupiah(Number(value) || 0),
                      t("reports.chart.salesLabel"),
                    ]}
                    labelFormatter={(label: unknown) =>
                      formatJakartaDisplayDate(String(label || ""))
                    }
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border)",
                      borderRadius: "var(--radius-control)",
                      color: "var(--text)",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="totalSales" fill="#1F6F5C" radius={[2, 2, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Ranked "Produk terlaris" Table */}
        <div className="bg-[var(--surface)] p-5 border border-[var(--border)] rounded-[var(--radius-control)] space-y-4">
          <h2 className="text-base font-semibold text-[var(--text)]">
            {t("reports.topProducts.title")}
          </h2>

          <Table
            columns={topProductColumns}
            data={topProducts}
            keyExtractor={(item) => item.productId}
            emptyMessage={t("reports.topProducts.empty")}
          />
        </div>
      </div>
    </main>
  );
};
