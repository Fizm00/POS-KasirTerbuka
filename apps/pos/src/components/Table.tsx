import React from "react";
import { Button } from "./Button";
import { t } from "../i18n";

export interface Column<T> {
  key: string;
  header: string;
  isNumeric?: boolean;
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
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3.5 text-[15px] font-semibold text-[var(--text-muted)] select-none ${
                    col.isNumeric ? "text-right" : "text-left"
                  }`}
                >
                  {col.header}
                </th>
              ))}
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
