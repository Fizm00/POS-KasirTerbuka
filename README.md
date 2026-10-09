# Kasir Terbuka

A free, open-source, local-first point-of-sale (POS) application designed for small Indonesian shops (warung, cafes, grocery stores).

Kasir Terbuka installs on desktop PC, tablet, and smartphone as a Progressive Web App (PWA), works fully offline without any server or internet connection, stores all data on the user's own device, and generates thermal-ready receipts.

---

## Key Principles

- **Local-First & Offline:** No backend server, no cloud accounts, zero subscription costs. All data lives on the device using IndexedDB (via Dexie.js).
- **Fast at the Counter:** Designed so that a standard checkout takes under 30 seconds. Optimized for touch screens and keyboard shortcuts (`F2` search, `F9` payment).
- **Data Privacy & Ownership:** Business data never leaves your device. Full JSON backup export and restore, plus CSV transaction exports for accounting.
- **Calm, Low-Noise Interface:** Follows strict contrast and ergonomics guidelines with no distracting gradients, glow effects, or marketing fluff.
- **Indonesian Retail Built-In:** Integer Rupiah currency formatting (`Rp 25.000`), daily invoice sequences (`INV-YYYYMMDD-0001`), Asia/Jakarta timestamps, and 58 mm / 80 mm thermal receipt layouts.

---

## Features

- **Cashier Screen (`/kasir`):**
  - Instant SKU/barcode search (`F2`) and category filtering.
  - Cart with quantity controls, clear button, and subtotal calculation.
  - Nominal (`Rp`) and percentage (`%`) discounts.
  - Real-time stock counts with calm low-stock warnings and out-of-stock disabling.
- **Payments & Receipts:**
  - Cash payment with automatic change calculation and quick amount buttons.
  - QRIS and Bank Transfer manual recording.
  - Atomic sale transactions: cart, inventory deductions, and daily invoice counters persist together.
  - Thermal receipt layout preview and browser printing (`window.print()`) for 58 mm and 80 mm paper widths.
- **Transaction History & Void (`/riwayat`):**
  - Filterable by date range, cashier, and status (Selesai / Dibatalkan).
  - Detailed receipt breakdown with original item snapshot.
  - Admin-only void action that safely returns inventory to stock.
- **Product & Category Catalog (`/produk`):**
  - Full CRUD for products (name, SKU, category, selling price, cost price, stock, low-stock threshold).
  - Low-stock filter toggle.
  - Category management with active-product deletion guard.
- **Sales Reports (`/laporan`):**
  - Date presets (Hari ini, 7 hari terakhir, Bulan ini, Custom range).
  - Key metrics: Total penjualan, Jumlah transaksi, Rata-rata per transaksi, Laba kotor.
  - Single-color daily sales bar chart and top-selling products table.
  - CSV export for spreadsheets (Excel / Google Sheets).
- **User Management & Local PIN Security (`/pengguna`):**
  - Multi-user support with `admin` and `kasir` roles.
  - PBKDF2 salted hash local PIN authentication.
  - *Security transparency note:* Local PIN protection is designed to deter casual use between staff shifts at the counter. It is not strong protection against an attacker with direct physical or developer-tools access to the device. Store managers should maintain device-level physical security.
  - Last-admin deactivation protection.
  - Configurable inactivity auto-lock (1–15 minutes).
- **Store Settings & Data Backup (`/pengaturan`):**
  - Store profile customization (name, address, phone, receipt footer, paper width).
  - Full atomic JSON backup export and restore with pre-flight entity counts confirmation.
  - Persistent storage activation (`navigator.storage.persist()`).
  - PWA installation status indicator.
- **Public Download & Landing Page (`/unduh`, `/download`):**
  - Clean, distraction-free landing page with direct browser PWA install button, screenshot preview, platform guides, and FAQ.

---

## Tech Stack

| Area               | Technology                                               |
| ------------------ | -------------------------------------------------------- |
| Language           | TypeScript (Strict mode)                                 |
| Framework          | React 19 + Vite                                          |
| Styling            | Tailwind CSS v4 with semantic CSS variables              |
| Routing            | React Router v7                                          |
| Database           | Dexie.js (IndexedDB) with atomic transactions            |
| State              | Zustand (Cart & session state) + Dexie Repositories      |
| Forms & Validation | React Hook Form + Zod resolver                           |
| Charts             | Recharts                                                 |
| Dates & Currency   | dayjs (`Asia/Jakarta`) + custom integer Rupiah formatter |
| Typography         | Plus Jakarta Sans (bundled locally, 100% offline)        |
| Icons              | Lucide React                                             |
| PWA & Caching      | `vite-plugin-pwa` with Workbox offline precaching        |
| Testing            | Vitest + React Testing Library + `fake-indexeddb`        |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or newer
- [pnpm](https://pnpm.io/) v10 or v12

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/Fizm00/POS-KasirTerbuka.git
cd POS-KasirTerbuka

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:5173` in your browser. On first visit, the setup wizard will guide you to configure your store name and admin PIN.

### Available Scripts

```bash
pnpm dev         # Start Vite development server
pnpm build       # Compile TypeScript and create production bundle
pnpm preview     # Preview production build locally
pnpm test        # Run unit and integration tests (Vitest)
pnpm lint        # Run ESLint checks
pnpm typecheck   # Typecheck codebase without emitting files
pnpm format      # Format codebase using Prettier
pnpm tauri dev   # Run native Tauri 2 desktop app in development
pnpm tauri build # Build production desktop installer (.exe, .msi, .dmg, .deb)
pnpm cap sync    # Sync web assets to Capacitor Android
```

---

## Desktop Application (Tauri 2)

Kasir Terbuka provides native desktop packages for Windows, macOS, and Linux built with Tauri 2. The desktop shell bypasses browser sandbox limitations and allows high-speed raw ESC/POS thermal printing over USB/Serial and LAN/Wi-Fi sockets.

- See [Panduan Instalasi Desktop (docs/desktop-installation.md)](docs/desktop-installation.md) for prebuilt installation binaries, unsigned SmartScreen/Gatekeeper bypass instructions, and native thermal printer setup.

---

## Android Application (Capacitor)

Kasir Terbuka can be installed as an APK on Android tablets and smartphones using the Capacitor native shell. It features native Bluetooth Classic SPP thermal printing with Android 12+ runtime permissions, safe area padding, and device share/save dialog for JSON backups.

- See [Panduan Android & Sideloading (docs/android-setup.md)](docs/android-setup.md) for APK installation, Bluetooth thermal printer pairing, and sideloading instructions.

---

## Installing as a PWA (Standalone App)

Kasir Terbuka can also be installed directly from any modern web browser without downloading separate installation executables:

1. **Desktop (Google Chrome / Microsoft Edge):**
   - Open the web app.
   - Click the install icon in the browser address bar, or open the browser menu and select **"Install Kasir Terbuka"**.
   - The app runs in a dedicated standalone window with offline caching.
2. **Android (Chrome):**
   - Tap the three dots menu in Chrome.
   - Select **"Add to Home screen"** or **"Install App"**.
3. **iOS / iPadOS (Safari):**
   - Tap the Share button at the bottom/top of Safari.
   - Select **"Add to Home Screen"**.

---

## Project Structure

```
src/
├── app/                  # Application router, layout shell, providers
├── components/           # Reusable UI primitives (Button, Modal, Input, etc.)
├── db/                   # IndexedDB schema, migrations, and repository layer
│   ├── repositories/     # Data access abstraction (All DB queries go here)
│   └── schema.ts         # Dexie tables and indexes
├── features/
│   ├── auth/             # PIN verification, auto-lock, and role permissions
│   ├── landing/          # Public landing and PWA download page
│   ├── pos/              # Cashier counter, product catalog, cart, and payment modal
│   ├── products/         # Product & category CRUD management
│   ├── reports/          # Financial summaries, daily charts, and CSV export
│   ├── settings/         # Store info, backup/restore, and PWA status
│   ├── setup/            # First-run 3-step setup wizard
│   ├── transactions/     # Transaction history and voiding flow
│   └── users/            # Cashier and admin user management
├── i18n/                 # Indonesian strings (id.json) and localization helper
├── lib/                  # Money formatter, dates, platform check, CSV generator
├── printing/             # ESC/POS byte builder, printer service, and driver adapters
│   ├── drivers/          # Browser, WebSerial, WebUSB, WebBluetooth, Tauri, Capacitor drivers
│   └── escpos/           # Pure function ESC/POS command encoder
└── styles/               # Design tokens and CSS configuration
src-tauri/                # Tauri 2 native desktop shell & Rust hardware commands
android/                  # Capacitor Android shell & native Bluetooth printing plugin
```

---

## Documentation

- [User Guide (Panduan Pengguna)](docs/user-guide.md) — Comprehensive user manual in Indonesian.
- [Android Setup & Sideloading](docs/android-setup.md) — APK installation, Bluetooth printing, and backup sharing.
- [Desktop Installation Guide](docs/desktop-installation.md) — Tauri 2 desktop setup and installer guide.
- [Thermal Printer Setup](docs/printer-setup.md) — Hardware guide for USB, Bluetooth, and Serial printers.
- [Contributing Guidelines](docs/contributing.md) — Rules for contributing, code standards, and PR workflows.
- [Architecture & Rules (AGENTS.md)](AGENTS.md) — System principles, conventions, and constraints.
- [Design Tokens & UI Specs (DESIGN.md)](DESIGN.md) — Ergonomics, contrast standards, and layout guidelines.
- [CSV Export Specification](docs/csv-export.md) — Format and column structure for exported reports.

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](LICENSE) file for details.
