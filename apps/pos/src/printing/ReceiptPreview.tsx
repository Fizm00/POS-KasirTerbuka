import React from "react";
import type { ReceiptModel } from "./receipt";

export interface ReceiptProps {
  model: ReceiptModel;
  className?: string;
}

export const Receipt: React.FC<ReceiptProps> = ({ model, className = "" }) => {
  const is58mm = model.paperWidth === 58;

  return (
    <div
      data-testid="receipt-preview"
      className={`receipt-print-area bg-white text-black border border-[var(--border)] rounded p-4 font-mono text-xs sm:text-sm leading-tight select-text shadow-sm ${
        is58mm ? "max-w-[280px]" : "max-w-[380px]"
      } mx-auto ${className}`}
      style={{
        width: is58mm ? "58mm" : "80mm",
      }}
    >
      <pre className="font-mono whitespace-pre font-normal tracking-tighter sm:tracking-normal overflow-x-hidden text-black leading-snug m-0 p-0">
        {model.rawText}
      </pre>
    </div>
  );
};

export const ReceiptPreview = Receipt;
