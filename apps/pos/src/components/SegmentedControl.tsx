export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={`inline-flex flex-wrap p-1 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] gap-1 ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={`min-h-[48px] px-5 py-2 inline-flex items-center justify-center rounded-[var(--radius-control)] text-base font-medium transition-colors select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 ${
              isSelected
                ? "bg-[var(--primary)] text-white"
                : "bg-transparent text-[var(--text)] hover:bg-[var(--bg)]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
