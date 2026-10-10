import React, { useState } from "react";
import { Download, Upload, AlertTriangle, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { Button, Modal } from "../../components";
import {
  downloadProductTemplateCsv,
  guessColumnMapping,
  parseProductCsv,
  validateCsvRows,
  type ColumnMapping,
  type CsvParseResult,
  type CsvValidationError,
  type ProductTargetField,
  MAX_CSV_FILE_SIZE_BYTES,
  MAX_CSV_ROWS,
} from "../../lib/productCsvImport";
import {
  productImportRepo,
  type ImportSummary,
  type SkuConflictStrategy,
} from "../../db/repositories/productImportRepo";
import { t } from "../../i18n";

export interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TARGET_FIELDS: { key: ProductTargetField; labelKey: string }[] = [
  { key: "name", labelKey: "products.import.fields.name" },
  { key: "sku", labelKey: "products.import.fields.sku" },
  { key: "category", labelKey: "products.import.fields.category" },
  { key: "cost", labelKey: "products.import.fields.cost" },
  { key: "price", labelKey: "products.import.fields.price" },
  { key: "stock", labelKey: "products.import.fields.stock" },
  { key: "lowStockThreshold", labelKey: "products.import.fields.lowStockThreshold" },
  { key: "unmapped", labelKey: "products.import.fields.unmapped" },
];

export const ProductImportModal: React.FC<ProductImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [conflictStrategy, setConflictStrategy] = useState<SkuConflictStrategy>("skip");
  const [validationErrors, setValidationErrors] = useState<CsvValidationError[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const resetState = () => {
    setFile(null);
    setParseResult(null);
    setMapping({});
    setConflictStrategy("skip");
    setValidationErrors([]);
    setFileError(null);
    setIsImporting(false);
    setSummary(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFileError(null);
    setValidationErrors([]);
    setSummary(null);

    if (selectedFile.size > MAX_CSV_FILE_SIZE_BYTES) {
      setFileError(t("products.import.errors.fileTooLarge"));
      return;
    }

    try {
      const text = await selectedFile.text();
      const result = await parseProductCsv(text);

      if (result.totalRows === 0) {
        setFileError(t("products.import.errors.emptyFile"));
        return;
      }

      if (result.totalRows > MAX_CSV_ROWS) {
        setFileError(t("products.import.errors.tooManyRows", { count: result.totalRows }));
        return;
      }

      setFile(selectedFile);
      setParseResult(result);

      const initialMapping = guessColumnMapping(result.headers);
      setMapping(initialMapping);

      // Initial validation check
      const validation = validateCsvRows(result.rawRows, initialMapping);
      setValidationErrors(validation.errors);
    } catch {
      setFileError(t("products.import.errors.emptyFile"));
    }
  };

  const handleMappingChange = (csvHeader: string, targetField: ProductTargetField) => {
    if (!parseResult) return;
    const newMapping = { ...mapping, [csvHeader]: targetField };
    setMapping(newMapping);

    const validation = validateCsvRows(parseResult.rawRows, newMapping);
    setValidationErrors(validation.errors);
  };

  const handleExecuteImport = async () => {
    if (!parseResult) return;

    const validation = validateCsvRows(parseResult.rawRows, mapping);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsImporting(true);
    try {
      const res = await productImportRepo.importProducts(
        validation.parsedProducts,
        conflictStrategy
      );
      setSummary(res);
      onSuccess();
    } catch (err) {
      setValidationErrors([
        {
          row: 0,
          field: "Database",
          message: err instanceof Error ? err.message : "Gagal mengimpor produk ke database",
        },
      ]);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("products.import.title")}
      footer={
        summary ? (
          <Button variant="primary" onClick={handleClose}>
            {t("products.import.close")}
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={isImporting}>
              {t("common.cancel")}
            </Button>
            {parseResult && (
              <Button
                variant="primary"
                onClick={handleExecuteImport}
                disabled={isImporting || validationErrors.length > 0}
                isLoading={isImporting}
              >
                {t("products.import.executeButton", { count: parseResult.totalRows })}
              </Button>
            )}
          </>
        )
      }
    >
      <div className="flex flex-col gap-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* SUMMARY SCREEN POST-IMPORT */}
        {summary ? (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[var(--text)]">
                {t("products.import.successTitle")}
              </h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {t("products.import.summaryTotal")}: {summary.total}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-2">
              <div className="p-3 bg-[var(--surface-sunken)] rounded-[var(--radius-control)] border border-[var(--border)]">
                <span className="text-xs text-[var(--text-muted)] block">
                  {t("products.import.summaryCreated")}
                </span>
                <span className="text-xl font-bold text-[var(--primary)] tabular-nums">
                  {summary.created}
                </span>
              </div>
              <div className="p-3 bg-[var(--surface-sunken)] rounded-[var(--radius-control)] border border-[var(--border)]">
                <span className="text-xs text-[var(--text-muted)] block">
                  {t("products.import.summaryUpdated")}
                </span>
                <span className="text-xl font-bold text-[var(--text)] tabular-nums">
                  {summary.updated}
                </span>
              </div>
              <div className="p-3 bg-[var(--surface-sunken)] rounded-[var(--radius-control)] border border-[var(--border)]">
                <span className="text-xs text-[var(--text-muted)] block">
                  {t("products.import.summarySkipped")}
                </span>
                <span className="text-xl font-bold text-[var(--text-muted)] tabular-nums">
                  {summary.skipped}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Template Download Banner */}
            <div className="p-4 bg-[var(--surface-sunken)] rounded-[var(--radius-control)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                <span className="text-sm font-semibold text-[var(--text)]">
                  {t("products.import.downloadTemplate")}
                </span>
                <span className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {t("products.import.templateHelper")}
                </span>
              </div>
              <Button type="button" variant="secondary" onClick={downloadProductTemplateCsv}>
                <Download className="w-4 h-4 mr-2" />
                {t("products.import.downloadTemplate")}
              </Button>
            </div>

            {/* File Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[var(--text)]">
                {t("products.import.chooseFile")}
              </label>

              {!file ? (
                <label className="min-h-[100px] border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--primary)] rounded-[var(--radius-control)] bg-[var(--surface)] p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center select-none">
                  <Upload className="w-6 h-6 text-[var(--text-muted)] mb-2" />
                  <span className="text-sm font-medium text-[var(--text)]">
                    {t("products.import.dropzonePlaceholder")}
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-control)] border border-[var(--border-strong)] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileSpreadsheet className="w-5 h-5 text-[var(--primary)] shrink-0" />
                    <span className="text-sm font-medium text-[var(--text)] truncate">
                      {t("products.import.fileSelected", {
                        name: file.name,
                        count: parseResult?.totalRows || 0,
                      })}
                    </span>
                  </div>
                  <label className="text-sm font-medium text-[var(--primary)] hover:underline cursor-pointer shrink-0">
                    {t("products.import.changeFile")}
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}

              {fileError && (
                <p role="alert" className="text-sm text-[var(--danger)] mt-1">
                  {fileError}
                </p>
              )}
            </div>

            {/* CONFLICT STRATEGY */}
            {parseResult && (
              <div className="flex flex-col gap-2 p-3 bg-[var(--surface-sunken)] rounded-[var(--radius-control)] border border-[var(--border)]">
                <span className="text-sm font-semibold text-[var(--text)]">
                  {t("products.import.conflictTitle")}
                </span>
                <div className="flex flex-col gap-2 text-sm text-[var(--text)]">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="conflictStrategy"
                      value="skip"
                      checked={conflictStrategy === "skip"}
                      onChange={() => setConflictStrategy("skip")}
                      className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
                    />
                    <span>{t("products.import.conflictSkip")}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="conflictStrategy"
                      value="update"
                      checked={conflictStrategy === "update"}
                      onChange={() => setConflictStrategy("update")}
                      className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
                    />
                    <span>{t("products.import.conflictUpdate")}</span>
                  </label>
                </div>
              </div>
            )}

            {/* COLUMN MAPPING */}
            {parseResult && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[var(--text)]">
                    {t("products.import.mappingTitle")}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {t("products.import.mappingHelper")}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                  {parseResult.headers.map((header) => (
                    <div
                      key={header}
                      className="p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-control)] flex flex-col gap-1"
                    >
                      <span className="text-xs font-semibold text-[var(--text-muted)] truncate">
                        {header}
                      </span>
                      <select
                        value={mapping[header] || "unmapped"}
                        onChange={(e) =>
                          handleMappingChange(header, e.target.value as ProductTargetField)
                        }
                        className="w-full min-h-[38px] px-2 text-sm bg-[var(--surface)] text-[var(--text)] rounded border border-[var(--border-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        aria-label={`Petakan kolom ${header}`}
                      >
                        {TARGET_FIELDS.map((f) => (
                          <option key={f.key} value={f.key}>
                            {t(f.labelKey)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VALIDATION REPORT */}
            {validationErrors.length > 0 && (
              <div className="p-3 bg-[var(--danger-soft)] rounded-[var(--radius-control)] border border-[var(--danger)] flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[var(--danger)] font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    {t("products.import.validationErrorsTitle", {
                      count: validationErrors.length,
                    })}
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto text-xs text-[var(--text)]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--danger)]/30 font-semibold text-[var(--text-muted)]">
                        <th className="py-1 px-1.5">{t("products.import.rowHeader")}</th>
                        <th className="py-1 px-1.5">{t("products.import.fieldHeader")}</th>
                        <th className="py-1 px-1.5">{t("products.import.problemHeader")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationErrors.map((err, i) => (
                        <tr key={i} className="border-b border-[var(--danger)]/10">
                          <td className="py-1 px-1.5 tabular-nums font-mono">
                            {err.row > 0 ? err.row : "-"}
                          </td>
                          <td className="py-1 px-1.5 font-medium">{err.field}</td>
                          <td className="py-1 px-1.5 text-[var(--danger)]">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PREVIEW FIRST 20 ROWS */}
            {parseResult && parseResult.previewRows.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[var(--text)]">
                  {t("products.import.previewTitle")}
                </span>
                <div className="max-h-48 overflow-auto border border-[var(--border)] rounded-[var(--radius-control)] bg-[var(--surface)] text-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[var(--surface-sunken)] border-b border-[var(--border)] text-[var(--text-muted)] font-semibold sticky top-0">
                        <th className="p-2 text-left">#</th>
                        {parseResult.headers.map((h) => (
                          <th key={h} className="p-2 text-left whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.previewRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-[var(--border)] hover:bg-[var(--surface-sunken)]"
                        >
                          <td className="p-2 font-mono text-[var(--text-muted)] tabular-nums">
                            {idx + 2}
                          </td>
                          {parseResult.headers.map((h) => (
                            <td key={h} className="p-2 whitespace-nowrap truncate max-w-[200px]">
                              {row[h] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
