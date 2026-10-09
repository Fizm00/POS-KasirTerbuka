import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
export type ButtonSize = "default" | "large";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "default",
  isLoading = false,
  disabled = false,
  children,
  className = "",
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  // Base styles: 48px touch target min (or 56px large), 8px radius, no shadows
  const baseStyles =
    "relative inline-flex items-center justify-center font-medium transition-colors select-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2";

  const sizeStyles =
    size === "large" ? "min-h-[56px] px-6 text-base" : "min-h-[48px] px-4 text-base";

  const radiusStyles = "rounded-[var(--radius-control)]";

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:bg-[var(--primary-hover)]",
    secondary:
      "bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] hover:bg-[var(--bg)] active:bg-[var(--border)]",
    tertiary:
      "bg-transparent text-[var(--primary)] hover:bg-[var(--primary-soft)] active:bg-[var(--primary-soft)]",
    destructive: "bg-[var(--danger)] text-white hover:opacity-90 active:opacity-100",
  };

  const stateStyles = isDisabled
    ? "opacity-40 cursor-not-allowed pointer-events-none"
    : "cursor-pointer";

  return (
    <button
      disabled={isDisabled}
      aria-busy={isLoading}
      className={`${baseStyles} ${sizeStyles} ${radiusStyles} ${variantStyles[variant]} ${stateStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="invisible flex items-center justify-center gap-2">{children}</span>
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-current" aria-hidden="true" />
          </span>
        </>
      ) : (
        <span className="flex items-center justify-center gap-2">{children}</span>
      )}
    </button>
  );
};
