import React from "react";

export interface ChipProps {
  label: string;
  count?: number;
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  count,
  isSelected = false,
  disabled = false,
  onClick,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      className={`min-h-[48px] px-4 py-2 inline-flex items-center gap-2 rounded-[var(--radius-control)] text-base font-medium transition-colors select-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 ${
        disabled
          ? "opacity-40 cursor-not-allowed bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]"
          : isSelected
            ? "bg-[var(--primary)] text-white cursor-pointer"
            : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] hover:bg-[var(--bg)] cursor-pointer"
      } ${className}`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`tabular-nums text-sm font-semibold ${
            isSelected ? "text-white opacity-90" : "text-[var(--text-muted)]"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
