import React from "react";

export interface ChipProps {
  label: string;
  count?: number;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  count,
  isSelected = false,
  onClick,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`min-h-[48px] px-4 py-2 inline-flex items-center gap-2 rounded-[var(--radius-control)] text-base font-medium transition-colors select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 ${
        isSelected
          ? "bg-[var(--primary)] text-white"
          : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] hover:bg-[var(--bg)]"
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
