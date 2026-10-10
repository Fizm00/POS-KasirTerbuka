import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "./Button";
import { t } from "../i18n";

export type SortDirection = "asc" | "desc" | null;

export interface Column<T> {
  key: string;
  header: string;
  isNumeric?: boolean;
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

export type TableColumn<T> = Column<T>;

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRowClick?: (row: T) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
  onRowClick,
  currentPage,
  totalPages,
  onPageChange,
  sortColumn,
  sortDirection,
  onSort,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-control)] p-12 text-center flex flex-col items-center justify-center gap-4">
        <p className="text-[15px] text-[var(--text-muted)]">{emptyMessage || t("common.empty")}</p>
        {emptyActionLabel && onEmptyAction && (
          <Button variant="secondary" onClick={onEmptyAction}>
            {emptyActionLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-control)] overflow-hidden flex flex-col">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                const currentDir = isSorted ? sortDirection : null;
                const ariaSort =
                  currentDir === "asc"
                    ? "ascending"
                    : currentDir === "desc"
                      ? "descending"
                      : "none";

                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={col.sortable ? ariaSort : undefined}
                    className={`px-4 py-3.5 text-[15px] font-semibold text-[var(--text-muted)] select-none ${
                      col.isNumeric ? "text-right" : "text-left"
                    }`}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        aria-label={`Urutkan ${col.header}`}
                        className={`inline-flex items-center gap-1.5 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 ${
                          col.isNumeric ? "ml-auto flex-row-reverse" : ""
                        } ${isSorted ? "text-[var(--text)] font-semibold" : "hover:text-[var(--text)]"}`}
                      >
                        <span>{col.header}</span>
                        {currentDir === "asc" ? (
                          <ArrowUp
                            className="w-4 h-4 text-[var(--primary)] shrink-0"
                            aria-hidden="true"
                          />
                        ) : currentDir === "desc" ? (
                          <ArrowDown
                            className="w-4 h-4 text-[var(--primary)] shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <ArrowUpDown
                            className="w-4 h-4 text-[var(--text-muted)] opacity-60 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`min-h-[52px] h-[52px] transition-colors hover:bg-[var(--primary-soft)] ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((col) => {
                  const cellContent = col.render
                    ? col.render(row, rowIndex)
                    : (row as Record<string, unknown>)[col.key]?.toString();

                  return (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-[15px] text-[var(--text)] ${
                        col.isNumeric ? "text-right tabular-nums font-medium" : "text-left"
                      }`}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {currentPage !== undefined && totalPages !== undefined && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--surface)]">
          <span className="text-sm text-[var(--text-muted)]">
            {t("common.page", { current: currentPage, total: totalPages })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={currentPage <= 1}
              onClick={() => onPageChange?.(currentPage - 1)}
            >
              {t("common.previous")}
            </Button>
            <Button
              variant="secondary"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange?.(currentPage + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
