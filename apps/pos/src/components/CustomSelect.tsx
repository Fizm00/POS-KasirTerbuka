import React, { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  id?: string;
  label?: string;
  "aria-label"?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  helperText?: string;
  error?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  label,
  "aria-label": ariaLabel,
  value,
  options,
  onChange,
  placeholder = "Pilih opsi",
  disabled = false,
  className = "",
  helperText,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const openSelect = () => {
    const idx = options.findIndex((opt) => opt.value === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
    setIsOpen(true);
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      openSelect();
    } else {
      setIsOpen(false);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        openSelect();
      } else {
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        openSelect();
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isOpen) {
        openSelect();
      } else if (highlightedIndex >= 0 && options[highlightedIndex]) {
        handleSelect(options[highlightedIndex].value);
      }
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (isOpen) {
        setIsOpen(false);
      }
    }
  };

  const selectId = id || generatedId;

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium text-[var(--text-muted)] select-none"
        >
          {label}
        </label>
      )}

      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`min-h-[48px] h-[48px] px-3.5 bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border transition-colors flex items-center justify-between gap-2 text-base select-none text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 ${
          error
            ? "border-[var(--danger)]"
            : isOpen
              ? "border-[var(--primary)] ring-1 ring-[var(--primary)]"
              : "border-[var(--border-strong)] hover:border-[var(--text-muted)]"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-[var(--bg)]" : ""}`}
      >
        <span
          className={`truncate ${
            selectedOption ? "text-[var(--text)] font-normal" : "text-[var(--text-muted)]"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-[var(--primary)]" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Hidden native select for accessible form control and test runner compatibility */}
      <select
        id={selectId}
        aria-label={ariaLabel || label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        className="sr-only"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {isOpen && (
        <ul
          ref={listboxRef}
          role="listbox"
          aria-label={ariaLabel || label}
          className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] shadow-lg z-50 py-1 focus:outline-none"
        >
          {options.length === 0 ? (
            <li className="px-3.5 py-2.5 text-sm text-[var(--text-muted)]">Tidak ada pilihan</li>
          ) : (
            options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`min-h-[44px] px-3.5 py-2 flex items-center justify-between text-base cursor-pointer select-none transition-colors ${
                    isHighlighted
                      ? "bg-[var(--primary-soft)] text-[var(--primary)] font-medium"
                      : isSelected
                        ? "font-medium text-[var(--text)]"
                        : "text-[var(--text)]"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[var(--primary)] shrink-0" aria-hidden="true" />
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}

      {error ? (
        <span className="text-xs text-[var(--danger)]">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-[var(--text-muted)]">{helperText}</span>
      ) : null}
    </div>
  );
};
