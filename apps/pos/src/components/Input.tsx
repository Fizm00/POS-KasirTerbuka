import React, { useId } from "react";
import { formatDigits, parseRupiah } from "../lib/money";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  helperText?: string;
  error?: string;
  isMoney?: boolean;
  onMoneyChange?: (value: number) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Input: React.FC<InputProps> = ({
  id,
  label,
  helperText,
  error,
  isMoney = false,
  value,
  defaultValue,
  onMoneyChange,
  onChange,
  className = "",
  disabled = false,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isMoney) {
      const rawValue = e.target.value;
      const numericValue = parseRupiah(rawValue);
      onMoneyChange?.(numericValue);

      // Create a modified event with formatted value for standard handlers
      const formatted = numericValue > 0 ? formatDigits(numericValue) : "";
      e.target.value = formatted;
      onChange?.(e);
    } else {
      onChange?.(e);
    }
  };

  const displayValue =
    isMoney && typeof value === "number" ? (value > 0 ? formatDigits(value) : "") : value;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={inputId} className="text-sm font-medium text-[var(--text)] select-none">
        {label}
      </label>

      <div className="relative flex items-center">
        {isMoney && (
          <span
            className="absolute left-3.5 text-base text-[var(--text-muted)] font-medium select-none pointer-events-none tabular-nums"
            aria-hidden="true"
          >
            Rp
          </span>
        )}

        <input
          id={inputId}
          disabled={disabled}
          value={displayValue}
          defaultValue={
            isMoney && typeof defaultValue === "number" ? formatDigits(defaultValue) : defaultValue
          }
          onChange={handleTextChange}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          inputMode={isMoney ? "numeric" : props.inputMode}
          className={`w-full min-h-[48px] h-[48px] px-3.5 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border transition-colors ${
            isMoney ? "pl-11" : ""
          } ${
            error
              ? "border-[var(--danger)] focus-visible:outline-[var(--danger)]"
              : "border-[var(--border-strong)] focus-visible:outline-[var(--primary)]"
          } ${
            disabled ? "opacity-40 cursor-not-allowed bg-[var(--bg)]" : ""
          } focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" aria-live="polite" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-sm text-[var(--text-muted)]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
