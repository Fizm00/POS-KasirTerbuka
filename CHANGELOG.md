# Changelog

All notable changes to the Kasir Terbuka project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-10-10

### Added

- **Product CSV Import (`/produk`):**
  - High-performance CSV file upload and preview using `PapaParse` and `Zod`.
  - Validation modal displaying valid rows, new items, SKU updates, and line-by-line validation errors.
  - Automatic category resolution matching existing names or creating new categories.
  - Sample CSV template download (`Template-Import-Produk.csv`) directly in the modal.
  - Modular feature toggle (`csvImport`) in Store Settings.
- **Stock Movement Audit, Bulk Stock-In & Valuation (`/stok-masuk`):**
  - Dexie Schema v5 adding `stockMovements` table with compound index `[productId+createdAt]`.
  - Atomic inventory transactions for incoming stock (`in`), physical opname adjustments (`adjust`), sales deductions (`sale`), and void restitutions (`void`).
  - `ProductStockDrawer`: 3-tab drawer on product catalog for quick stock-in, stock adjustments with auto-calculated delta, and complete audit history.
  - `BulkStockInPage` (`/stok-masuk`): multi-product bulk stock-in screen with instant search and total cost calculation.
  - Stock valuation metric ("Nilai persediaan") displayed in Sales Reports (`/laporan`).
  - Modular feature toggle (`stockIn`) in Store Settings.
- **Multi-Platform Binaries & Distribution:**
  - Windows x64 setup executable installer (`Kasir-Terbuka-Setup-1.1.0.exe`).
  - Android standalone APK package (`Kasir-Terbuka-1.1.0.apk`).
  - GitHub Actions automated release pipeline for macOS Universal DMG and Linux AppImage.

## [1.0.0] - 2026-10-10

### Added

- Direct installer downloads on the public landing page without mandatory GitHub redirection (`.exe`, `.apk`, `.dmg`, `.AppImage`).
- Standalone landing page app (`apps/landing`) with independent Vite build, Newsreader editorial typography, and 58 mm thermal receipt hero strip.
- Dexie schema version 2 upgrade with compound indexes (`[status+createdAt]`, `[isActive+categoryId]`) for high-speed queries.
- Performance verification: sub-100ms catalog search over 5,000 products and sub-3s financial summary over 50,000 seeded transactions.
- Automated Dexie schema migration test (`src/db/schemaMigration.test.ts`) validating seamless upgrade from version 1 to 2.
- Accessibility hardening: `aria-live` announcements on cart total changes and modal/form errors, keyboard shortcuts (`F2`, `F9`, `Esc`), and verified $\ge 48$px touch targets across all interactive controls.
- Security transparency notes in docs explicitly stating the practical deterrent limits of local PIN protection.
- GitHub issue templates and pull request templates.

## [0.1.0] - 2026-10-09

### Added

- **Phase 1: Core POS App (PWA)**
  - First-run 3-step setup wizard with store details and initial admin setup.
  - Local-first IndexedDB storage via Dexie.js with persistent storage auto-request.
  - Multi-user authentication with PBKDF2 salted hash PIN verification and last-admin protection.
  - Inactivity auto-lock (1–15 minutes) with on-screen numerical keypad unlock.
  - Product and category management (CRUD, active toggle, SKU uniqueness validation, low-stock threshold).
  - Cashier screen with real-time catalog search (`F2`), category filtering, low-stock indicators, and out-of-stock disabling.
  - Shopping cart with quantity increment/decrement, clear action, and subtotal calculation.
  - Nominal (`Rp`) and percentage (`%`) discount calculator.
  - Atomic sale transactions (invoice counter, cart items snapshot, and stock deductions).
  - Multiple payment methods: Cash (with quick denominations and change calculator), QRIS, and Bank Transfer.
  - Receipt preview modal with browser print (`window.print()`) supporting 58 mm and 80 mm paper formats.
  - Transaction history screen with date, cashier, and status filters.
  - Admin-only transaction voiding flow that safely restores inventory.
  - Sales reports with preset filters (Today, 7 Days, This Month, Custom), key financial metrics, daily bar chart, top-selling products, and CSV export.
  - Store settings and full atomic JSON backup export and restore with entity validation.
  - Progressive Web App (PWA) configuration with Workbox offline precaching, web app manifest, and icons.
  - Public landing and download page (`/unduh`, `/download`) with browser PWA installation button, cashier screenshot, platform guides, and FAQ.
  - Comprehensive Indonesian user guide (`docs/user-guide.md`) and contributing guide (`docs/contributing.md`).
  - AGPL-3.0 open-source license.
- **Phase 2: ESC/POS Thermal Printing & Hardware Abstraction**
  - Pure TypeScript ESC/POS command byte builder (`src/printing/escpos/`) supporting initialization, text alignment, bold, double-height, line feed, paper cutting, cash drawer kick pulses, and codepage mappings (CP437, PC850, WPC1252, PC858).
  - Snapshot test coverage for byte outputs at 58 mm and 80 mm paper formats.
  - Pluggable `PrinterDriver` interface with `MockDriver`, `BrowserDriver` (window.print fallback), `WebSerialDriver`, `WebUsbDriver`, and `WebBluetoothDriver`.
  - Non-blocking `PrinterService` singleton preventing failed prints from aborting sales, with retry support ("Coba cetak lagi") and cash drawer kick trigger.
  - Settings > Printer interactive controls: connection type selector, connect/disconnect, test print, last receipt reprint, and cash drawer toggle.
  - Thermal printer hardware setup guide (`docs/printer-setup.md`) with explicit compatibility disclosure.
- **Phase 2: Desktop Shell (Tauri 2)**
  - Native desktop application shell (`src-tauri/`) powered by Tauri 2 targeting Windows, macOS, and Linux.
  - Native window settings: 1280x800 default size, 800x600 minimum size, resizable, custom app icons.
  - Native printer commands implemented in Rust: `list_serial_ports`, `print_raw_serial`, and `print_raw_network` with socket timeout.
  - `TauriDriver` adapter in frontend adhering strictly to the `PrinterDriver` contract with zero web-side platform branching outside `src/printing/drivers/` and `src/lib/platform.ts`.
  - GitHub Actions release workflow (`.github/workflows/release.yml`) building native installers across platforms (`windows-latest`, `macos-latest`, `ubuntu-22.04`).
  - Comprehensive desktop installation and unsigned binary setup guide (`docs/desktop-installation.md`).
- **Phase 3: Android Shell (Capacitor)**
  - Native Android application wrapper (`android/`) powered by Capacitor targeting tablets (1280x800) and smartphones.
  - Native in-tree Android plugin (`BluetoothPrinterPlugin`) supporting Bluetooth Classic (RFCOMM SPP) with Android 12+ runtime permissions (`BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN`).
  - `CapacitorBtDriver` implementing standard `PrinterDriver` interface (`id = "capacitor-bt"`).
  - Safe area inset handling (`viewport-fit=cover`, `--sat`, `--sab`, notch and home bar margins).
  - Native Android share/save sheet integration via `@capacitor/share` for JSON backup and CSV transactions export.
  - GitHub Actions release workflow building debug/unsigned APK and attaching to GitHub Releases.
  - Comprehensive Android setup, printer pairing, and sideloading documentation (`docs/android-setup.md`).
