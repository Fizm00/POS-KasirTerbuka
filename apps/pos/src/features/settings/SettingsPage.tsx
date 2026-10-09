import React, { useEffect, useRef, useState } from "react";
import { Download, Upload, FileSpreadsheet, Lock } from "lucide-react";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { SegmentedControl } from "../../components/SegmentedControl";
import { settingsRepo } from "../../db/repositories/settingsRepo";
import { backupRepo, type BackupFile } from "../../db/repositories/backupRepo";
import { transactionsRepo } from "../../db/repositories/transactionsRepo";
import { usersRepo } from "../../db/repositories/usersRepo";
import type { PaperWidth, StoreSettings } from "../../db/schema";
import { useAuthStore } from "../auth/authStore";
import { formatJakartaDisplayDateTime } from "../../lib/dates";
import { downloadCsvFile, generateTransactionsCsv } from "../../lib/csv";
import { BackupConfirmModal } from "./BackupConfirmModal";
import { ChangePinModal } from "./ChangePinModal";
import { printerService } from "../../printing/printerService";
import type { PrinterDriverId } from "../../printing/drivers/types";
import { isCapacitor } from "../../lib/platform";
import { t } from "../../i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const SettingsPage: React.FC = () => {
  const { setAutoLockMinutes } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // PWA install state
  const [isStandalone, setIsStandalone] = useState(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches)
  );
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Toko form state
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [paperWidth, setPaperWidth] = useState<PaperWidth>(58);

  // Printer state
  const [printerConnection, setPrinterConnection] = useState<PrinterDriverId>(() =>
    printerService.getActiveDriverId()
  );
  const [printerTarget, setPrinterTarget] = useState("");
  const [cashDrawerEnabled, setCashDrawerEnabled] = useState(false);
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);
  const [isPrinterConnecting, setIsPrinterConnecting] = useState(false);

  // Keamanan state
  const [autoLockMin, setAutoLockMin] = useState(5);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

  // Backup & Import state
  const [pendingBackup, setPendingBackup] = useState<BackupFile | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsStandalone(true);
        showToast(t("settings.app.installedSuccess"));
      }
      setDeferredPrompt(null);
    } else {
      alert(t("settings.app.installPromptAlert"));
    }
  };

  useEffect(() => {
    let isMounted = true;
    settingsRepo.getSettings().then((s) => {
      if (isMounted) {
        setSettings(s);
        setStoreName(s.storeName);
        setAddress(s.address);
        setPhone(s.phone);
        setReceiptFooter(s.receiptFooter);
        setPaperWidth(s.paperWidth);
        const lockMins = s.autoLockMinutes || 5;
        setAutoLockMin(lockMins);
        setAutoLockMinutes(lockMins);

        const savedPrinterType = (s.printer?.type as PrinterDriverId) || "browser";
        setPrinterConnection(savedPrinterType);
        setPrinterTarget(s.printer?.target || "");
        setCashDrawerEnabled(Boolean(s.printer?.cashDrawer));
        printerService.setActiveDriver(savedPrinterType, false).then(() => {
          if (isMounted) {
            const active = printerService.getActiveDriver();
            setIsPrinterConnected(Boolean(active.isConnected?.()));
            setConnectedDeviceName(active.getDeviceName?.() || null);
          }
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [setAutoLockMinutes]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Save Store Settings
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const updated = await settingsRepo.updateSettings({
        storeName: storeName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        receiptFooter: receiptFooter.trim(),
        paperWidth,
      });
      setSettings(updated);
      showToast(t("settings.store.saved"));
    } catch {
      setErrorMessage("Gagal menyimpan pengaturan toko.");
    }
  };

  // Printer handlers
  const handleConnectionChange = async (newType: PrinterDriverId) => {
    setPrinterConnection(newType);
    await printerService.setActiveDriver(newType, true);
    const active = printerService.getActiveDriver();
    setIsPrinterConnected(Boolean(active.isConnected?.()));
    setConnectedDeviceName(active.getDeviceName?.() || null);
  };

  const handleCashDrawerToggle = async (enabled: boolean) => {
    setCashDrawerEnabled(enabled);
    try {
      const current = await settingsRepo.getSettings();
      await settingsRepo.updateSettings({
        printer: {
          ...current.printer,
          cashDrawer: enabled,
        },
      });
    } catch {
      // ignore
    }
  };

  const handleSavePrinterTarget = async () => {
    try {
      const current = await settingsRepo.getSettings();
      const updated = await settingsRepo.updateSettings({
        printer: {
          ...current.printer,
          target: printerTarget.trim(),
        },
      });
      setSettings(updated);
      await printerService.initFromSettings();
      showToast(t("settings.printer.targetSaved"));
    } catch {
      setErrorMessage("Gagal menyimpan target printer.");
    }
  };

  const handleConnectPrinter = async () => {
    setErrorMessage(null);
    setIsPrinterConnecting(true);
    try {
      await printerService.connect();
      const active = printerService.getActiveDriver();
      setIsPrinterConnected(Boolean(active.isConnected?.()));
      setConnectedDeviceName(active.getDeviceName?.() || null);
      showToast(t("settings.printer.connectedSuccess"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghubungkan printer.";
      setErrorMessage(msg);
    } finally {
      setIsPrinterConnecting(false);
    }
  };

  const handleDisconnectPrinter = async () => {
    setErrorMessage(null);
    try {
      await printerService.disconnect();
      setIsPrinterConnected(false);
      setConnectedDeviceName(null);
      showToast(t("settings.printer.disconnectedSuccess"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memutuskan koneksi printer.";
      setErrorMessage(msg);
    }
  };

  const handleTestPrint = async () => {
    setErrorMessage(null);
    const res = await printerService.printTestPage();
    if (res.success) {
      showToast(t("settings.printer.testPrintSuccess"));
    } else {
      setErrorMessage(res.error || "Gagal mencetak halaman tes.");
    }
  };

  const handleReprintLast = async () => {
    setErrorMessage(null);
    const res = await printerService.reprintLastReceipt();
    if (res.success) {
      showToast(t("settings.printer.reprintSuccess"));
    } else {
      setErrorMessage(res.error || "Belum ada transaksi sebelumnya untuk dicetak ulang.");
    }
  };

  const handleOpenCashDrawer = async () => {
    setErrorMessage(null);
    const res = await printerService.openCashDrawer();
    if (res.success) {
      showToast(t("settings.printer.openDrawerSuccess"));
    } else {
      setErrorMessage(res.error || "Gagal membuka laci kasir.");
    }
  };

  // Handle Export Backup (JSON)
  const handleExportBackup = async () => {
    setErrorMessage(null);
    try {
      const backup = await backupRepo.exportAll();
      const nowIso = new Date().toISOString();

      // Update lastBackupAt in settings
      const updatedSettings = await settingsRepo.updateSettings({
        lastBackupAt: nowIso,
      });
      setSettings(updatedSettings);

      const jsonString = JSON.stringify(backup, null, 2);
      const dateStr = nowIso.slice(0, 10).replace(/-/g, "");
      const fileName = `cadangan-kasir-terbuka-${dateStr}.json`;

      if (isCapacitor()) {
        try {
          const { Share } = await import("@capacitor/share");
          await Share.share({
            title: fileName,
            text: jsonString,
            dialogTitle: "Simpan atau Bagikan Cadangan Data",
          });
          showToast(t("settings.backup.exportSuccess"));
          return;
        } catch {
          // Fall back to web download if share cancelled or unavailable
        }
      }

      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      showToast(t("settings.backup.exportSuccess"));
    } catch {
      setErrorMessage("Gagal mengekspor data cadangan.");
    }
  };

  // Handle File Input Select for Backup Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const validated = backupRepo.validateBackup(content);
        setPendingBackup(validated);
        setIsConfirmModalOpen(true);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage(t("settings.backup.invalidFile"));
        }
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // Execute Atomic Backup Restore
  const handleConfirmRestore = async () => {
    if (!pendingBackup) return;
    try {
      setIsImporting(true);
      await backupRepo.importAll(pendingBackup);

      // Reload settings
      const freshSettings = await settingsRepo.getSettings();
      setSettings(freshSettings);
      setStoreName(freshSettings.storeName);
      setAddress(freshSettings.address);
      setPhone(freshSettings.phone);
      setReceiptFooter(freshSettings.receiptFooter);
      setPaperWidth(freshSettings.paperWidth);

      setIsConfirmModalOpen(false);
      setPendingBackup(null);
      showToast(t("settings.backup.importSuccess"));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t("settings.backup.invalidFile"));
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Handle Export Transactions (CSV)
  const handleExportCsv = async () => {
    setErrorMessage(null);
    try {
      const [txs, users] = await Promise.all([transactionsRepo.getAll(), usersRepo.getUsers()]);
      const usersMap = new Map(users.map((u) => [u.id, u.name]));
      const csv = generateTransactionsCsv(txs, usersMap);
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `semua-transaksi-${dateStr}.csv`;

      if (isCapacitor()) {
        try {
          const { Share } = await import("@capacitor/share");
          await Share.share({
            title: fileName,
            text: csv,
            dialogTitle: "Simpan atau Bagikan Transaksi CSV",
          });
          showToast(t("reports.exportSuccess"));
          return;
        } catch {
          // Fall back to web download
        }
      }

      downloadCsvFile(fileName, csv);
      showToast(t("reports.exportSuccess"));
    } catch {
      setErrorMessage("Gagal mengekspor transaksi CSV.");
    }
  };

  // Handle Auto-lock duration change
  const handleAutoLockChange = async (minutes: number) => {
    setAutoLockMin(minutes);
    setAutoLockMinutes(minutes);
    const updated = await settingsRepo.updateSettings({
      autoLockMinutes: minutes,
    });
    setSettings(updated);
  };

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-10">
      {/* Page Title */}
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
          {t("settings.title")}
        </h1>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 bg-[var(--danger-soft)] text-[var(--danger)] rounded-[var(--radius-control)] border border-[var(--danger)] text-sm font-medium"
        >
          {errorMessage}
        </div>
      )}

      {toastMessage && (
        <div
          role="status"
          className="p-4 bg-[var(--primary-soft)] text-[var(--primary)] rounded-[var(--radius-control)] border border-[var(--primary)] text-sm font-medium"
        >
          {toastMessage}
        </div>
      )}

      {/* SECTION 1: TOKO */}
      <section className="space-y-6 pb-8 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">{t("settings.store.title")}</h2>
        </div>

        <form onSubmit={handleSaveStore} className="space-y-5 max-w-xl">
          <Input
            id="store-name"
            label={t("settings.store.name")}
            placeholder={t("settings.store.namePlaceholder")}
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
          />

          <Input
            id="store-address"
            label={t("settings.store.address")}
            placeholder={t("settings.store.addressPlaceholder")}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <Input
            id="store-phone"
            label={t("settings.store.phone")}
            placeholder={t("settings.store.phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            id="store-footer"
            label={t("settings.store.receiptFooter")}
            placeholder={t("settings.store.receiptFooterPlaceholder")}
            value={receiptFooter}
            onChange={(e) => setReceiptFooter(e.target.value)}
          />

          {/* Lebar Kertas (58mm / 80mm) */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">
              {t("settings.store.paperWidth")}
            </label>
            <div className="max-w-xs">
              <SegmentedControl
                options={[
                  { value: "58", label: "58 mm" },
                  { value: "80", label: "80 mm" },
                ]}
                value={String(paperWidth)}
                onChange={(val) => setPaperWidth(Number(val) as PaperWidth)}
              />
            </div>
          </div>

          <Button type="submit" variant="primary">
            {t("settings.store.save")}
          </Button>
        </form>
      </section>

      {/* SECTION 2: PRINTER */}
      <section className="space-y-6 pb-8 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">
            {t("settings.printer.title")}
          </h2>
        </div>

        <div className="space-y-5 max-w-xl">
          {/* Tipe Koneksi */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">
              {t("settings.printer.connectionType")}
            </label>
            <select
              aria-label={t("settings.printer.connectionType")}
              value={printerConnection}
              onChange={(e) => handleConnectionChange(e.target.value as PrinterDriverId)}
              className="w-full min-h-[48px] h-[48px] px-3.5 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] cursor-pointer"
            >
              <option value="browser">{t("settings.printer.driverBrowser")}</option>
              <option value="webserial">{t("settings.printer.driverWebSerial")}</option>
              <option value="webusb">{t("settings.printer.driverWebUsb")}</option>
              <option value="webbluetooth">{t("settings.printer.driverWebBluetooth")}</option>
              <option value="tauri">{t("settings.printer.driverTauri")}</option>
              <option value="capacitor-bt">{t("settings.printer.driverCapacitorBt")}</option>
            </select>
          </div>

          {printerConnection === "tauri" && (
            <div className="space-y-2">
              <label
                htmlFor="printer-target"
                className="block text-sm font-medium text-[var(--text)]"
              >
                {t("settings.printer.target")}
              </label>
              <div className="flex gap-2">
                <input
                  id="printer-target"
                  type="text"
                  value={printerTarget}
                  onChange={(e) => setPrinterTarget(e.target.value)}
                  placeholder={t("settings.printer.targetPlaceholder")}
                  className="flex-1 min-h-[48px] h-[48px] px-3.5 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                />
                <Button variant="secondary" onClick={handleSavePrinterTarget}>
                  {t("settings.printer.saveTarget")}
                </Button>
              </div>
            </div>
          )}

          {printerConnection === "capacitor-bt" && (
            <div className="space-y-2">
              <label
                htmlFor="printer-target-bt"
                className="block text-sm font-medium text-[var(--text)]"
              >
                {t("settings.printer.targetBt")}
              </label>
              <div className="flex gap-2">
                <input
                  id="printer-target-bt"
                  type="text"
                  value={printerTarget}
                  onChange={(e) => setPrinterTarget(e.target.value)}
                  placeholder={t("settings.printer.targetBtPlaceholder")}
                  className="flex-1 min-h-[48px] h-[48px] px-3.5 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                />
                <Button variant="secondary" onClick={handleSavePrinterTarget}>
                  {t("settings.printer.saveTarget")}
                </Button>
              </div>
            </div>
          )}

          {/* Status Text */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--text-muted)]">
              {t("settings.printer.status")}:
            </span>
            <span className="text-sm font-semibold text-[var(--text)]">
              {printerConnection === "browser"
                ? t("settings.printer.statusReady")
                : !printerService.getDriver(printerConnection)?.isSupported()
                  ? t("settings.printer.statusNotSupported")
                  : isPrinterConnected
                    ? t("settings.printer.statusConnected", {
                        name: connectedDeviceName || "Printer",
                      })
                    : t("settings.printer.notConnected")}
            </span>
          </div>

          {/* Actions: Hubungkan/Putuskan, Cetak tes, Cetak ulang struk */}
          <div className="flex flex-wrap items-center gap-3">
            {printerConnection !== "browser" &&
              (isPrinterConnected ? (
                <Button
                  variant="secondary"
                  onClick={handleDisconnectPrinter}
                  disabled={isPrinterConnecting}
                >
                  {t("settings.printer.disconnect")}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleConnectPrinter}
                  disabled={
                    isPrinterConnecting ||
                    !printerService.getDriver(printerConnection)?.isSupported()
                  }
                >
                  {isPrinterConnecting ? "Menghubungkan..." : t("settings.printer.connect")}
                </Button>
              ))}

            <Button
              variant="secondary"
              onClick={handleTestPrint}
              disabled={printerConnection !== "browser" && !isPrinterConnected}
            >
              {t("settings.printer.testPrint")}
            </Button>

            <Button variant="secondary" onClick={handleReprintLast}>
              {t("settings.printer.reprintLast")}
            </Button>

            {cashDrawerEnabled && printerConnection !== "browser" && (
              <Button variant="secondary" onClick={handleOpenCashDrawer}>
                {t("settings.printer.openDrawer")}
              </Button>
            )}
          </div>

          {/* Cash drawer toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none pt-2">
            <input
              type="checkbox"
              checked={cashDrawerEnabled}
              onChange={(e) => handleCashDrawerToggle(e.target.checked)}
              className="w-5 h-5 accent-[var(--primary)] rounded-[var(--radius-control)]"
            />
            <span className="text-sm text-[var(--text)]">{t("settings.printer.cashDrawer")}</span>
          </label>
        </div>
      </section>

      {/* SECTION 3: CADANGAN DATA */}
      <section className="space-y-6 pb-8 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">{t("settings.backup.title")}</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {settings?.lastBackupAt
              ? t("settings.backup.lastBackup", {
                  date: formatJakartaDisplayDateTime(settings.lastBackupAt),
                })
              : t("settings.backup.neverBackedUp")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 max-w-2xl">
          {/* Ekspor JSON */}
          <Button
            variant="secondary"
            onClick={handleExportBackup}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>{t("settings.backup.exportJson")}</span>
          </Button>

          {/* Impor JSON */}
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>{t("settings.backup.importJson")}</span>
          </Button>

          {/* Ekspor CSV */}
          <Button variant="secondary" onClick={handleExportCsv} className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
            <span>{t("settings.backup.exportCsv")}</span>
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            aria-label={t("settings.backup.importJson")}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </section>

      {/* SECTION 4: KEAMANAN */}
      <section className="space-y-6 pb-8">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">
            {t("settings.security.title")}
          </h2>
        </div>

        <div className="space-y-5 max-w-xl">
          {/* Durasi Kunci Otomatis */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">
              {t("settings.security.autoLock")}
            </label>
            <select
              aria-label={t("settings.security.autoLock")}
              value={autoLockMin}
              onChange={(e) => handleAutoLockChange(Number(e.target.value))}
              className="w-full min-h-[48px] h-[48px] px-3.5 text-base bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-control)] border border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] cursor-pointer"
            >
              <option value={1}>{t("settings.security.minutes", { count: 1 })}</option>
              <option value={2}>{t("settings.security.minutes", { count: 2 })}</option>
              <option value={5}>{t("settings.security.minutes", { count: 5 })}</option>
              <option value={10}>{t("settings.security.minutes", { count: 10 })}</option>
              <option value={15}>{t("settings.security.minutes", { count: 15 })}</option>
            </select>
          </div>

          {/* Tombol Ubah PIN Saya */}
          <div>
            <Button
              variant="secondary"
              onClick={() => setIsChangePinOpen(true)}
              className="flex items-center gap-2"
            >
              <Lock className="w-4 h-4" aria-hidden="true" />
              <span>{t("settings.security.changeMyPin")}</span>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 5: APLIKASI */}
      <section className="space-y-4 pb-8">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">{t("settings.app.title")}</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {isStandalone ? t("settings.app.statusStandalone") : t("settings.app.statusBrowser")}
          </p>
        </div>

        {!isStandalone && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleInstallPwa}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>{t("settings.app.installButton")}</span>
            </Button>
            <span className="text-xs text-[var(--text-muted)]">
              {t("settings.app.installHint")}
            </span>
          </div>
        )}
      </section>

      {/* Backup Confirm Modal */}
      <BackupConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setPendingBackup(null);
        }}
        backupFile={pendingBackup}
        onConfirmImport={handleConfirmRestore}
        isImporting={isImporting}
      />

      {/* Change Pin Modal */}
      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        onSuccess={() => {
          showToast(t("settings.security.changePinModal.success"));
        }}
      />
    </main>
  );
};
