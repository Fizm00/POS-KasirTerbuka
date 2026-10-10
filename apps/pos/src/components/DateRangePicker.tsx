import React, { useEffect, useId, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "./Button";
import {
  formatJakartaDisplayDate,
  getJakartaDateParts,
  getPresetDateRange,
  type DatePreset,
} from "../lib/dates";
import { t } from "../i18n";

export interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD (or empty string)
  endDate: string; // YYYY-MM-DD (or empty string)
  activePreset?: DatePreset;
  onChange: (startDate: string, endDate: string, preset?: DatePreset) => void;
  allowEmpty?: boolean;
  className?: string;
  showPresetsInline?: boolean;
}

const INDONESIAN_MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const INDONESIAN_DAY_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  activePreset,
  onChange,
  allowEmpty = false,
  className = "",
  showPresetsInline = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [currentPreset, setCurrentPreset] = useState<DatePreset | undefined>(activePreset);

  // Month view state for calendar: year and month (0-11)
  const initialParts = getJakartaDateParts();
  const [viewYear, setViewYear] = useState(initialParts.year);
  const [viewMonth, setViewMonth] = useState(initialParts.month - 1);

  // Active selecting target: "start" | "end"
  const [selectingTarget, setSelectingTarget] = useState<"start" | "end">("start");

  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const effectivePreset = isOpen ? currentPreset : activePreset;

  const handleToggle = () => {
    if (!isOpen) {
      setTempStart(startDate);
      setTempEnd(endDate);
      setCurrentPreset(activePreset);
      if (startDate) {
        const [y, m] = startDate.split("-").map(Number);
        if (y && m) {
          setViewYear(y);
          setViewMonth(m - 1);
        }
      } else {
        const parts = getJakartaDateParts();
        setViewYear(parts.year);
        setViewMonth(parts.month - 1);
      }
      setSelectingTarget("start");
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handlePresetClick = (preset: "today" | "yesterday" | "7days" | "month") => {
    const range = getPresetDateRange(preset);
    setCurrentPreset(preset);
    setTempStart(range.startDateStr);
    setTempEnd(range.endDateStr);
    onChange(range.startDateStr, range.endDateStr, preset);
    setIsOpen(false);
  };

  const handleDayClick = (dayStr: string) => {
    setCurrentPreset("custom");
    if (selectingTarget === "start") {
      setTempStart(dayStr);
      // If end date is before new start, move end date to new start
      if (tempEnd && dayStr > tempEnd) {
        setTempEnd(dayStr);
      }
      setSelectingTarget("end");
    } else {
      if (tempStart && dayStr < tempStart) {
        setTempStart(dayStr);
        setTempEnd(tempStart);
      } else {
        setTempEnd(dayStr);
      }
      setSelectingTarget("start");
    }
  };

  const isInvalidRange = Boolean(tempStart && tempEnd && tempStart > tempEnd);

  const handleApply = () => {
    if (isInvalidRange) return;
    onChange(tempStart, tempEnd, "custom");
    setCurrentPreset("custom");
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempStart("");
    setTempEnd("");
    setCurrentPreset(undefined);
    onChange("", "", undefined);
    setIsOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calendar matrix calculation for viewYear, viewMonth
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday = 0

  const calendarDays: Array<{ dateStr: string; dayNumber: number; isCurrentMonth: boolean }> = [];
  // Empty slots for previous month padding
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push({ dateStr: "", dayNumber: 0, isCurrentMonth: false });
  }
  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const monthPadded = String(viewMonth + 1).padStart(2, "0");
    const dayPadded = String(d).padStart(2, "0");
    calendarDays.push({
      dateStr: `${viewYear}-${monthPadded}-${dayPadded}`,
      dayNumber: d,
      isCurrentMonth: true,
    });
  }

  // Display label on trigger button
  const getDisplayLabel = () => {
    if (!startDate && !endDate) {
      return t("datePicker.selectRange");
    }
    if (activePreset === "today" || currentPreset === "today") {
      return `${t("datePicker.presetToday")} (${formatJakartaDisplayDate(startDate)})`;
    }
    if (activePreset === "yesterday" || currentPreset === "yesterday") {
      return `${t("datePicker.presetYesterday")} (${formatJakartaDisplayDate(startDate)})`;
    }
    if (startDate === endDate && startDate) {
      return formatJakartaDisplayDate(startDate);
    }
    return `${formatJakartaDisplayDate(startDate)} – ${formatJakartaDisplayDate(endDate)}`;
  };

  const dateFromId = useId();
  const dateToId = useId();

  return (
    <div className={`relative flex flex-wrap items-center gap-2 ${className}`}>
      {/* Inline Fast Presets Bar if enabled */}
      {showPresetsInline && (
        <div
          className="flex items-center gap-1 p-1 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] select-none"
          role="group"
          aria-label="Pilihan rentang tanggal cepat"
        >
          <button
            type="button"
            onClick={() => handlePresetClick("today")}
            className={`min-h-[40px] px-3 text-sm font-medium rounded-[var(--radius-control)] transition-colors cursor-pointer ${
              effectivePreset === "today"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
            } focus-visible:outline-2 focus-visible:outline-[var(--primary)]`}
          >
            {t("datePicker.presetToday")}
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick("yesterday")}
            className={`min-h-[40px] px-3 text-sm font-medium rounded-[var(--radius-control)] transition-colors cursor-pointer ${
              effectivePreset === "yesterday"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
            } focus-visible:outline-2 focus-visible:outline-[var(--primary)]`}
          >
            {t("datePicker.presetYesterday")}
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick("7days")}
            className={`min-h-[40px] px-3 text-sm font-medium rounded-[var(--radius-control)] transition-colors cursor-pointer ${
              effectivePreset === "7days"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
            } focus-visible:outline-2 focus-visible:outline-[var(--primary)]`}
          >
            {t("datePicker.preset7Days")}
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick("month")}
            className={`min-h-[40px] px-3 text-sm font-medium rounded-[var(--radius-control)] transition-colors cursor-pointer ${
              effectivePreset === "month"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
            } focus-visible:outline-2 focus-visible:outline-[var(--primary)]`}
          >
            {t("datePicker.presetMonth")}
          </button>
        </div>
      )}

      {/* Main trigger button opening popover */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={getDisplayLabel()}
        className={`min-h-[48px] h-[48px] px-3.5 bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border transition-colors flex items-center gap-2 text-base select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 ${
          isOpen
            ? "border-[var(--primary)] ring-1 ring-[var(--primary)]"
            : "border-[var(--border-strong)] hover:border-[var(--text-muted)]"
        }`}
      >
        <CalendarIcon className="w-5 h-5 text-[var(--text-muted)]" aria-hidden="true" />
        <span className="font-medium text-sm tabular-nums">{getDisplayLabel()}</span>
      </button>

      {/* Clear/Reset button if allowEmpty and dates are set */}
      {allowEmpty && (startDate || endDate) && (
        <button
          type="button"
          onClick={handleReset}
          className="min-h-[48px] px-2.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer flex items-center gap-1"
          aria-label={t("datePicker.resetRange")}
        >
          <X className="w-4 h-4" />
          <span>{t("datePicker.resetRange")}</span>
        </button>
      )}

      {/* Modal / Popover Overlay */}
      {isOpen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("datePicker.selectRange")}
          className="absolute top-full left-0 mt-2 z-50 w-full sm:w-[360px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-modal)] shadow-2xl p-4 flex flex-col gap-4 text-[var(--text)]"
        >
          {/* Preset Buttons Grid inside Dialog */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handlePresetClick("today")}
              className={`min-h-[40px] px-3 text-sm font-medium rounded-[var(--radius-control)] border transition-colors ${
                effectivePreset === "today"
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-[var(--surface)] border-[var(--border-strong)] hover:bg-[var(--bg)]"
              }`}
            >
              {t("datePicker.presetToday")}
            </button>
            <button
              type="button"
              onClick={() => handlePresetClick("yesterday")}
              className={`min-h-[40px] px-3 text-sm font-medium rounded-[var(--radius-control)] border transition-colors ${
                effectivePreset === "yesterday"
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-[var(--surface)] border-[var(--border-strong)] hover:bg-[var(--bg)]"
              }`}
            >
              {t("datePicker.presetYesterday")}
            </button>
            <button
              type="button"
              onClick={() => handlePresetClick("7days")}
              className={`min-h-[40px] px-3 text-sm font-medium rounded-[var(--radius-control)] border transition-colors ${
                effectivePreset === "7days"
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-[var(--surface)] border-[var(--border-strong)] hover:bg-[var(--bg)]"
              }`}
            >
              {t("datePicker.preset7Days")}
            </button>
            <button
              type="button"
              onClick={() => handlePresetClick("month")}
              className={`min-h-[40px] px-3 text-sm font-medium rounded-[var(--radius-control)] border transition-colors ${
                effectivePreset === "month"
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-[var(--surface)] border-[var(--border-strong)] hover:bg-[var(--bg)]"
              }`}
            >
              {t("datePicker.presetMonth")}
            </button>
          </div>

          {/* Date Input Fields (Dari & Sampai) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor={dateFromId}
                className="block text-xs font-medium text-[var(--text-muted)] mb-1"
              >
                {t("datePicker.dateFrom")}
              </label>
              <input
                id={dateFromId}
                type="text"
                placeholder="YYYY-MM-DD"
                value={tempStart}
                onFocus={() => setSelectingTarget("start")}
                onChange={(e) => {
                  setTempStart(e.target.value);
                  setCurrentPreset("custom");
                }}
                className={`w-full min-h-[44px] h-[44px] px-3 text-sm tabular-nums bg-[var(--surface)] border rounded-[var(--radius-control)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] ${
                  selectingTarget === "start"
                    ? "border-[var(--primary)] ring-1 ring-[var(--primary)]"
                    : "border-[var(--border-strong)]"
                }`}
              />
            </div>
            <div>
              <label
                htmlFor={dateToId}
                className="block text-xs font-medium text-[var(--text-muted)] mb-1"
              >
                {t("datePicker.dateTo")}
              </label>
              <input
                id={dateToId}
                type="text"
                placeholder="YYYY-MM-DD"
                value={tempEnd}
                onFocus={() => setSelectingTarget("end")}
                onChange={(e) => {
                  setTempEnd(e.target.value);
                  setCurrentPreset("custom");
                }}
                className={`w-full min-h-[44px] h-[44px] px-3 text-sm tabular-nums bg-[var(--surface)] border rounded-[var(--radius-control)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] ${
                  selectingTarget === "end"
                    ? "border-[var(--primary)] ring-1 ring-[var(--primary)]"
                    : "border-[var(--border-strong)]"
                }`}
              />
            </div>
          </div>

          {/* Validation Error Message */}
          {isInvalidRange && (
            <p className="text-xs font-medium text-[var(--danger)]">{t("datePicker.errorRange")}</p>
          )}

          {/* Cross-platform Calendar Grid */}
          <div className="border border-[var(--border)] rounded-[var(--radius-control)] p-2 bg-[var(--bg)]">
            {/* Month & Year Header with Prev/Next buttons */}
            <div className="flex items-center justify-between mb-2 px-1">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Bulan sebelumnya"
                className="w-8 h-8 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold text-[var(--text)]">
                {INDONESIAN_MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Bulan berikutnya"
                className="w-8 h-8 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day Header Row */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {INDONESIAN_DAY_HEADERS.map((day) => (
                <span key={day} className="text-xs font-medium text-[var(--text-muted)] py-1">
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item, idx) => {
                if (!item.isCurrentMonth) {
                  return <div key={`empty-${idx}`} className="w-9 h-9" />;
                }

                const isStart = item.dateStr === tempStart;
                const isEnd = item.dateStr === tempEnd;
                const isInRange =
                  tempStart && tempEnd && item.dateStr > tempStart && item.dateStr < tempEnd;

                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => handleDayClick(item.dateStr)}
                    className={`w-9 h-9 flex items-center justify-center rounded-[var(--radius-control)] text-sm tabular-nums font-medium transition-colors cursor-pointer ${
                      isStart || isEnd
                        ? "bg-[var(--primary)] text-white font-semibold"
                        : isInRange
                          ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                          : "text-[var(--text)] hover:bg-[var(--surface)]"
                    }`}
                  >
                    {item.dayNumber}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              disabled={isInvalidRange || (!tempStart && !tempEnd)}
              onClick={handleApply}
            >
              {t("datePicker.applyRange")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
