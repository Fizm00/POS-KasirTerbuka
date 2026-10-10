<div align="center">

  <img src="apps/pos/public/favicon.svg" alt="Kasir Terbuka Logo" width="100" height="100" />

# Kasir Terbuka

### _Modern, Local-First & 100% Offline Point-of-Sale System_

**Aplikasi kasir (POS) open-source, cepat, dan tenang untuk warung & UMKM Indonesia.**
<br>
_Tersedia untuk Windows, Android, macOS, Linux, dan Web PWA • Nol biaya langganan • 100% Privasi data lokal._

  <br>

[![Latest Release](https://img.shields.io/badge/release-v1.1.0-1F6F5C?style=for-the-badge&logo=github)](https://github.com/Fizm00/POS-KasirTerbuka/releases/latest)
[![License](https://img.shields.io/badge/license-AGPL--3.0-1F6F5C?style=for-the-badge)](LICENSE)
[![Tests Status](<https://img.shields.io/badge/tests-283%20passed%20(100%25)-10B981?style=for-the-badge&logo=vitest&logoColor=white>)](apps/pos)
[![Architecture](https://img.shields.io/badge/architecture-100%25%20Local--First-D97706?style=for-the-badge)](#-mengapa-kasir-terbuka-why-kasir-terbuka)
[![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Android%20%7C%20macOS%20%7C%20Linux%20%7C%20PWA-2563EB?style=for-the-badge)](#-unduh--instalasi-multi-platform)

  <br>

[🚀 **Coba Web PWA**](https://fizm00.github.io/POS-KasirTerbuka/) &nbsp;•&nbsp;
[📥 **Unduh Aplikasi**](#-unduh--instalasi-multi-platform) &nbsp;•&nbsp;
[✨ **Fitur Unggulan**](#-fitur-unggulan-features) &nbsp;•&nbsp;
[🖨️ **Setup Printer**](docs/printer-setup.md) &nbsp;•&nbsp;
[📖 **Panduan Pengguna**](docs/user-guide.md)

  <br>
  <br>

  <img src="apps/pos/public/screenshot-cashier.svg" alt="Kasir Terbuka Interface" width="920" />

</div>

<br>

---

## ⚡ Mengapa Kasir Terbuka? (Why Kasir Terbuka?)

Kasir Terbuka lahir dari kebutuhan nyata pemilik toko, warung kelontong, kafe, dan UMKM di Indonesia yang menginginkan aplikasi kasir yang **responsif**, **bebas biaya langganan**, **tidak bergantung pada internet**, dan **sepenuhnya berada dalam kendali pemilik toko**.

| Pilar Utama                              | Deskripsi                                                                                                                                                                                              |
| :--------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔒 **100% Local-First & Offline**        | **Tanpa server backend, tanpa akun cloud, nol biaya bulanan.** Seluruh database tersimpan langsung di IndexedDB perangkat via Dexie.js. Data bisnis Anda tidak pernah dikirim ke server pihak ketiga.  |
| ⚡ **Transaksi Kilat (< 30 Detik)**      | Didesain khusus untuk antrean kasir yang sibuk. Navigasi penuh keyboard (`F2` untuk pencarian SKU/barcode, `F9` untuk pembayaran instan), input barcode scanner instan, dan hitung kembalian otomatis. |
| 🖨️ **Dukungan Printer Termal Luas**      | Cetak struk belanja 58 mm dan 80 mm secara native menggunakan format perintah ESC/POS standar industri melalui USB, Bluetooth SPP (Android), WebSerial, WebUSB, dan LAN/Wi-Fi socket.                  |
| 📦 **Manajemen Stok & Audit Terperinci** | Dilengkapi fitur Penerimaan Barang Masuk (Bulk Stock-In), penyesuaian fisik (Stock Opname), pelacakan mutasi stok, peringatan stok menipis, dan valuasi nilai persediaan modal secara real-time.       |
| 📑 **Impor Katalog Massal (CSV)**        | Tambahkan ratusan produk dan kategori sekaligus dalam hitungan detik menggunakan format CSV dengan validasi cerdas anti-duplikasi SKU.                                                                 |
| 🛡️ **Keamanan PIN Lokal & Hak Akses**    | Akses kasir berbasis PIN dengan enkripsi PBKDF2 salted hash, penguncian layar otomatis (auto-lock saat ditinggal), dan perlindungan otorisasi admin untuk pembatalan transaksi (void).                 |
| 💾 **Pencadangan Total (Atomic Backup)** | Ekspor seluruh transaksi, katalog produk, dan pengaturan toko ke satu file cadangan yang aman, serta pemulihan atomik tanpa risiko data korup.                                                         |

---

## 📥 Unduh & Instalasi Multi-Platform

Pilih paket instalasi yang sesuai untuk perangkat Anda dari **[Rilis Resmi v1.1.0](https://github.com/Fizm00/POS-KasirTerbuka/releases/latest)**:

| Platform    | Format Berkas         | Arsitektur Target                 | Tautan Unduhan Langsung                                                                                                                             | Panduan                                            |
| :---------- | :-------------------- | :-------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------- |
| **Windows** | Setup `.exe` / `.msi` | x64 (Windows 10 / 11)             | [📥 **Kasir.Terbuka_1.1.0_x64-setup.exe**](https://github.com/Fizm00/POS-KasirTerbuka/releases/download/v1.1.0/Kasir.Terbuka_1.1.0_x64-setup.exe)   | [Panduan Desktop](docs/desktop-installation.md)    |
| **Android** | Package `.apk`        | Universal / ARM64 (Android 8–15)  | [📱 **Kasir-Terbuka-android-debug.apk**](https://github.com/Fizm00/POS-KasirTerbuka/releases/download/v1.1.0/Kasir-Terbuka-android-debug.apk)       | [Panduan Android](docs/android-setup.md)           |
| **macOS**   | Disk Image `.dmg`     | Universal (Apple Silicon & Intel) | [🍎 **Kasir.Terbuka_1.1.0_universal.dmg**](https://github.com/Fizm00/POS-KasirTerbuka/releases/download/v1.1.0/Kasir.Terbuka_1.1.0_universal.dmg)   | [Panduan Desktop](docs/desktop-installation.md)    |
| **Linux**   | `.AppImage` / `.deb`  | x86_64 / amd64                    | [🐧 **Kasir.Terbuka_1.1.0_amd64.AppImage**](https://github.com/Fizm00/POS-KasirTerbuka/releases/download/v1.1.0/Kasir.Terbuka_1.1.0_amd64.AppImage) | [Panduan Desktop](docs/desktop-installation.md)    |
| **Web PWA** | Web App Mandiri       | Semua Browser Modern              | [🌐 **Buka Aplikasi Kasir (PWA)**](https://fizm00.github.io/POS-KasirTerbuka/)                                                                      | [Petunjuk PWA](#-instalasi-sebagai-pwa-standalone) |

> 💡 **Informasi untuk Desktop & Android:** Karena aplikasi ini berstatus _open-source community_ dan belum menggunakan sertifikat berbayar, Anda mungkin melihat dialog _Windows SmartScreen_ ("Windows protected your PC") atau _Android Play Protect_. Anda dapat melanjutkan dengan mengeklik **"More info" ➔ "Run anyway"** atau **"Tetap pasang"**. Detail verifikasi integritas dapat dibaca di [Panduan Desktop](docs/desktop-installation.md) dan [Panduan Android](docs/android-setup.md).

---

## ✨ Fitur Unggulan (Features)

### 🛒 1. Meja Kasir Cepat (`/kasir`)

- **Pencarian Kilat & Barcode Scanner:** Tekan `F2` untuk fokus ke pencarian atau pindai barcode produk secara instan menggunakan barcode scanner fisik (USB/Bluetooth HID).
- **Keranjang Kasir Responsif:** Atur kuantitas barang, hapus item, dan tinjau subtotal secara real-time.
- **Diskon Transaksi Fleksibel:** Dukungan diskon nominal Rupiah (`Rp`) maupun persentase (`%`) dengan kalkulasi transparan.
- **Peringatan Stok Menipis:** Indikator tenang saat stok mendekati batas minimum, serta pencegahan transaksi jika stok habis.
- **Metode Pembayaran:** Tunai (dengan hitung kembalian otomatis & tombol pecahan uang pas), QRIS statis, dan Transfer Bank.
- **Cetak Struk Instan:** Menghasilkan nomor invoice harian otomatis (`INV-YYYYMMDD-0001`) dan mencetak ke printer struk.

### 📦 2. Manajemen Produk & Stok (`/produk` & `/stok-masuk`)

- **Katalog Produk Terstruktur:** Tambah, ubah, dan kelola produk lengkap dengan SKU, kategori, harga modal, harga jual, dan batas stok menipis.
- **Impor Massal via CSV:** Unggah katalog toko dalam hitungan detik dengan validasi cerdas anti-duplikasi dan template resmi yang dapat diunduh langsung.
- **Drawer Mutasi Stok Individual:** Audit riwayat pergerakan barang (Barang Masuk, Opname/Penyesuaian Fisik, Penjualan Kasir, Pembatalan/Void).
- **Penerimaan Barang Masuk Massal (`/stok-masuk`):** Input banyak barang datang dari distributor atau supplier dalam satu halaman ringkas.
- **Valuasi Stok Otomatis:** Perhitungan total nilai modal persediaan barang toko yang selalu terbarui.

### 📊 3. Laporan Keuangan & Penjualan (`/laporan`)

- **Ringkasan Finansial:** Pantau Total Omset Penjualan, Jumlah Transaksi, Rata-rata Nilai Keranjang (AOV), Laba Kotor, dan Nilai Persediaan Stok.
- **Filter Rentang Waktu:** Hari Ini, 7 Hari Terakhir, Bulan Ini, atau Rentang Tanggal Kustom.
- **Grafik Tren Penjualan:** Grafik batang omset penjualan harian yang bersih dan mudah dianalisis.
- **Daftar Produk Terlaris:** Menampilkan produk dengan volume penjualan dan pendapatan tertinggi.
- **Ekspor CSV Akuntansi:** Unduh ringkasan laporan dan rincian transaksi per item untuk diolah di Microsoft Excel atau Google Sheets.

### 🧾 4. Riwayat Transaksi & Pembatalan (`/riwayat`)

- **Pencarian Transaksi Lampau:** Filter transaksi berdasarkan tanggal, kasir yang bertugas, dan status transaksi.
- **Rincian Struk & Cetak Ulang:** Lihat kembali snapshot produk saat transaksi dibuat dan cetak ulang struk kapan saja.
- **Pembatalan Aman (Void):** Khusus hak akses admin, mencatat alasan pembatalan dan secara otomatis mengembalikan stok barang ke database.

### 🔐 5. Keamanan PIN Lokal & Hak Akses (`/pengguna`)

- **Multi-Pengguna:** Mendukung peran `admin` (akses penuh semua fitur) dan `kasir` (hanya meja kasir & riwayat).
- **Enkripsi PIN Kuat:** Menggunakan hashing PBKDF2 salted hash melalui Web Crypto API standar industri.
- **Kunci Otomatis (Auto-Lock):** Penguncian layar otomatis setelah periode tidak aktif (1–15 menit) untuk melindungi meja kasir saat ditinggalkan.

### ⚙️ 6. Pengaturan Toko & Backup Atomik (`/pengaturan`)

- **Personalisasi Struk Belanja:** Nama toko, alamat, nomor telepon, catatan kaki struk (footer), serta pilihan lebar kertas 58 mm atau 80 mm.
- **Pencadangan Total (Atomic Backup):** Ekspor seluruh basis data ke berkas `.json` dan pemulihan aman dengan validasi Zod.
- **Penyimpanan Permanen:** Meminta hak `navigator.storage.persist()` ke sistem browser agar data tidak pernah terhapus otomatis oleh sistem pembersih cache.

---

## 🖨️ Kompatibilitas Printer Termal (ESC/POS)

Kasir Terbuka mengimplementasikan driver pure TypeScript untuk mengonversi data transaksi langsung menjadi perintah **ESC/POS byte stream**:

```
+--------------------------------+
|          TOKO BERKAH           |
|    Jl. Sudirman No. 12, Jkt    |
|--------------------------------|
| INV-20261010-0001              |
| 10/10/2026 14:30   Kasir: Rina |
|--------------------------------|
| Kopi Susu Aren                 |
| 2 x Rp 15.000        Rp 30.000 |
| Nasi Goreng                    |
| 1 x Rp 22.000        Rp 22.000 |
|--------------------------------|
| Subtotal:            Rp 52.000 |
| Total:               Rp 52.000 |
| Tunai:               Rp 60.000 |
| Kembali:              Rp 8.000 |
|--------------------------------|
|     Terima Kasih Atas          |
|      Kunjungan Anda!           |
+--------------------------------+
```

### Transport & Driver yang Didukung

- **Desktop (Tauri 2):** Native USB Raw Socket, Serial COM Port, dan TCP/IP Socket (LAN / Wi-Fi).
- **Android (Capacitor):** Bluetooth Classic SPP (`RFCOMM`) dengan auto-discovery printer yang sudah dipasangkan (paired).
- **Browser (PWA):** WebSerial API, WebUSB API, WebBluetooth API, serta fallback `window.print()` dengan optimasi CSS struk kasir 58/80 mm.

_Panduan lengkap konfigurasi dan troubleshooting printer termal: [docs/printer-setup.md](docs/printer-setup.md)._

---

## 🌐 Instalasi sebagai PWA (Standalone)

Kasir Terbuka dapat dipasang langsung dari browser tanpa perlu mengunduh installer:

1. **Desktop (Google Chrome / Microsoft Edge):**
   - Kunjungi web app [Kasir Terbuka](https://fizm00.github.io/POS-KasirTerbuka/).
   - Klik ikon instal di bilah alamat browser, atau pilih menu peramban ➔ **"Install Kasir Terbuka"**.
   - Aplikasi akan berjalan di jendela independen dengan caching offline penuh.
2. **Android (Chrome):**
   - Buka web app di Chrome.
   - Ketuk menu titik tiga di kanan atas.
   - Pilih **"Tambahkan ke Layar Utama"** atau **"Pasang Aplikasi"**.
3. **iOS / iPadOS (Safari):**
   - Buka web app di Safari.
   - Ketuk tombol **Bagikan (Share)** di bagian bawah layar.
   - Pilih **"Tambah ke Layar Utama (Add to Home Screen)"**.

---

## 🛠️ Arsitektur Monorepo & Teknologi

Proyek ini dibangun sebagai monorepo menggunakan `pnpm workspace`:

```
POS-KasirTerbuka/
├── apps/
│   ├── pos/                  # Aplikasi Kasir (PWA, Tauri Desktop, Capacitor Android)
│   │   ├── src/
│   │   │   ├── app/          # Router & Providers
│   │   │   ├── components/   # UI Primitives (Button, Modal, Input, Table)
│   │   │   ├── db/           # Dexie IndexedDB Schema & Repository Layer
│   │   │   ├── features/     # Modul Fitur (pos, products, reports, auth, settings)
│   │   │   ├── lib/          # Helper (money, dates, csv, features)
│   │   │   └── printing/     # ESC/POS byte builder & driver adapters
│   │   ├── src-tauri/        # Shell Native Desktop (Tauri 2 + Rust)
│   │   └── android/          # Shell Native Android (Capacitor + Java)
│   └── landing/              # Halaman Beranda Publik & Showroom (React 19 + Vite)
├── docs/                     # Dokumentasi Resmi & Panduan Pengguna
└── .github/workflows/        # Otomasi CI/CD & Build Multi-Platform
```

### Rincian Teknologi (Tech Stack)

| Bagian               | Teknologi                     | Keterangan                                    |
| :------------------- | :---------------------------- | :-------------------------------------------- |
| **Language**         | TypeScript (Strict mode)      | 100% type-safe, no implicit any               |
| **UI Framework**     | React 19 + Vite               | Performa tinggi, HMR instan, bundle ringkas   |
| **Styling**          | Tailwind CSS v4               | Semantic design tokens, rasio kontras tinggi  |
| **Database**         | Dexie.js (IndexedDB)          | Transaksi atomik, skema versi, 100% lokal     |
| **State Management** | Zustand                       | State keranjang & sesi kasir yang ringan      |
| **Validation**       | Zod + React Hook Form         | Validasi skema input & impor data ketat       |
| **Typography**       | Plus Jakarta Sans             | Dibundel lokal, 100% bekerja offline          |
| **Testing**          | Vitest + RTL + fake-indexeddb | **283 unit & integration tests lulus (100%)** |
| **Desktop Shell**    | Tauri 2 (Rust)                | Ringan (~15 MB RAM), performa native          |
| **Mobile Shell**     | Capacitor (Android)           | Akses native Bluetooth Classic printer        |

---

## 💻 Panduan Pengembang (Developer Quickstart)

### Prasyarat

- [Node.js](https://nodejs.org/) v20 atau lebih baru
- [pnpm](https://pnpm.io/) v10 atau v12
- [Rust](https://rustup.rs/) _(opsional, untuk build desktop Tauri)_
- [Android Studio & JDK 21](https://developer.android.com/studio) _(opsional, untuk build APK)_

### Memulai Pengembangan Lokal

```bash
# 1. Klon repositori
git clone https://github.com/Fizm00/POS-KasirTerbuka.git
cd POS-KasirTerbuka

# 2. Pasang dependensi monorepo
pnpm install

# 3. Jalankan server pengembang aplikasi kasir
pnpm dev:pos

# 4. (Opsional) Jalankan landing page di terminal terpisah
pnpm dev:landing
```

Buka `http://localhost:5173` di peramban Anda. Pada kunjungan pertama, wizard pengaturan awal akan memandu Anda membuat nama toko dan PIN admin.

### Perintah Pengujian & Kualitas Kode

```bash
pnpm -r test           # Menjalankan seluruh test suite (Vitest)
pnpm -r typecheck      # Memeriksa static typecheck TypeScript
pnpm -r lint           # Memeriksa kepatuhan kode dengan ESLint
pnpm format            # Merapikan format kode dengan Prettier
pnpm --filter pos tauri dev   # Menjalankan aplikasi desktop Tauri
pnpm --filter pos cap sync    # Sinkronisasi build web ke Capacitor Android
```

---

## 📚 Indeks Dokumentasi Lengkap

Dokumentasi teknis dan panduan operasional tersedia di folder [`docs/`](docs/):

- 📖 [**Panduan Pengguna (User Guide)**](docs/user-guide.md) — Panduan lengkap penggunaan kasir, transaksi, dan pelaporan dalam Bahasa Indonesia.
- 📱 [**Panduan Instalasi Android**](docs/android-setup.md) — Langkah pemasangan APK, izin Bluetooth, dan Bluetooth printer setup.
- 🖥️ [**Panduan Instalasi Desktop**](docs/desktop-installation.md) — Instalasi Windows, macOS, dan Linux serta bypass SmartScreen.
- 🖨️ [**Panduan Printer Termal (ESC/POS)**](docs/printer-setup.md) — Referensi teknis pengkabelan, baudrate, dan koneksi printer.
- 📊 [**Format Spesifikasi Ekspor CSV**](docs/csv-export.md) — Struktur kolom dan format data ekspor transaksi & laporan.
- 🤝 [**Panduan Berkontribusi**](docs/contributing.md) — Standar kontribusi, git commit, dan pembuatan pull request.

---

## 🤝 Kontribusi

Kasir Terbuka adalah proyek sumber terbuka yang didedikasikan untuk memberdayakan UMKM Indonesia melalui teknologi yang bebas, transparan, dan mandiri. Kontribusi dalam bentuk laporan bug, perbaikan kode, penerjemahan, maupun pengujian printer termal sangat diapresiasi!

Silakan baca [Panduan Kontribusi](docs/contributing.md) sebelum mengajukan Pull Request.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah ketentuan **[GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE)**.

Hak Cipta © 2026 **Kontributor Kasir Terbuka**.
