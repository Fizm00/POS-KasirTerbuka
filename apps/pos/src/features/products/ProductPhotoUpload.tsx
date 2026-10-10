import React, { useEffect, useRef, useState } from "react";
import { Camera, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "../../components";
import { t } from "../../i18n";

export interface ProductPhotoUploadProps {
  initialImageUrl?: string | null;
  onChange: (file: File | null, shouldDelete: boolean) => void;
  disabled?: boolean;
}

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ProductPhotoUpload: React.FC<ProductPhotoUploadProps> = ({
  initialImageUrl,
  onChange,
  disabled = false,
}) => {
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [isRemoved, setIsRemoved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active preview derived from uploaded file or initial image unless removed
  const previewUrl = selectedFileUrl ?? (isRemoved ? null : initialImageUrl || null);

  // Clean up locally created object URL when component unmounts or selectedFileUrl changes
  useEffect(() => {
    return () => {
      if (selectedFileUrl) {
        URL.revokeObjectURL(selectedFileUrl);
      }
    };
  }, [selectedFileUrl]);

  const handleSelectClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting the exact same file fires onChange again
    e.target.value = "";

    // Validate type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage(t("products.form.photoErrorInvalid"));
      return;
    }

    // Validate size (10 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(t("products.form.photoErrorSize"));
      return;
    }

    // Clear error
    setErrorMessage(null);

    // Revoke old local blob URL if exists
    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
    }

    const newUrl = URL.createObjectURL(file);
    setSelectedFileUrl(newUrl);
    setIsRemoved(false);

    onChange(file, false);
  };

  const handleRemove = () => {
    if (disabled) return;

    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
      setSelectedFileUrl(null);
    }

    setIsRemoved(true);
    setErrorMessage(null);
    onChange(null, true);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-medium text-[var(--text)] select-none">
        {t("products.form.photoLabel")}
      </label>

      <div className="flex flex-row items-center gap-4">
        {/* 120x120px Box */}
        <div
          className={`w-[120px] h-[120px] min-w-[120px] min-h-[120px] rounded-[var(--radius-control)] overflow-hidden flex items-center justify-center relative ${
            previewUrl
              ? "border border-[var(--border-strong)] bg-[var(--surface-sunken)]"
              : "border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--primary)] bg-[var(--surface-sunken)] cursor-pointer"
          }`}
          onClick={previewUrl ? undefined : handleSelectClick}
          role={previewUrl ? undefined : "button"}
          tabIndex={previewUrl ? undefined : 0}
          onKeyDown={(e) => {
            if (!previewUrl && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              handleSelectClick();
            }
          }}
          aria-label={t("products.form.photoSelect")}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={t("products.form.photoLabel")}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 p-2 text-center text-[var(--text-muted)] select-none">
              <Camera className="w-6 h-6" />
              <span className="text-xs font-medium leading-tight">
                {t("products.form.photoSelect")}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons & helper */}
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex flex-wrap gap-2">
            {previewUrl ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSelectClick}
                  disabled={disabled}
                >
                  <Camera className="w-4 h-4 mr-1.5" />
                  {t("products.form.photoChange")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="text-[var(--danger)] hover:bg-[var(--danger)]/10"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  {t("products.form.photoRemove")}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={handleSelectClick}
                disabled={disabled}
              >
                <ImageIcon className="w-4 h-4 mr-1.5" />
                {t("products.form.photoSelect")}
              </Button>
            )}
          </div>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {t("products.form.photoHelper")}
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {/* Inline error */}
      {errorMessage && (
        <p role="alert" className="text-sm text-[var(--danger)] mt-0.5">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
