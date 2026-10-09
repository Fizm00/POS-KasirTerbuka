import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`w-full bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-control)] p-12 text-center flex flex-col items-center justify-center gap-4 ${className}`}
    >
      <p className="text-base text-[var(--text-muted)] max-w-md">{message}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
