# Panduan Instalasi Desktop (Tauri 2) — Kasir Terbuka

Kasir Terbuka dapat dijalankan sebagai aplikasi desktop native di **Windows**, **macOS**, dan **Linux** menggunakan shell Tauri 2.

Aplikasi desktop berjalan 100% offline, menyimpan database langsung di perangkat lokal, dan mendukung pencetakan langsung ke printer kasir thermal (ESC/POS) melalui port serial/USB dan jaringan lokal tanpa batasan sandbox peramban.

---

## 1. Persyaratan Sistem & Kompilasi dari Kode Sumber (Development)

Jika Anda ingin membangun aplikasi desktop dari kode sumber:

### Prasyarat

- **Node.js**: v20+ atau v22+
- **pnpm**: v9+ atau v10+
- **Rust**: Versi stable terbaru (`rustup update stable`)
- **Dependensi Sistem per Platform**:
  - **Windows**: [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) atau build tools untuk `msvc`.
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`).
  - **Linux (Ubuntu/Debian)**:
    ```bash
    sudo apt-get update
    sudo apt-get install -y build-essential curl wget file libssl-dev libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libudev-dev
    ```

### Perintah Pembangunan

```bash
# Instal dependensi frontend
pnpm install

# Menjalankan aplikasi desktop dalam mode development
pnpm tauri dev

# Membangun bundel dan installer produksi untuk platform Anda saat ini
pnpm tauri build
```

Hasil installer biner akan berada di dalam direktori `src-tauri/target/release/bundle/`.

---

## 2. Pemasangan Installer Resmi (Prebuilt Binaries)

Unduh installer versi rilis terbaru dari tab [Releases di GitHub Repository](https://github.com/).

### Windows (`.exe` atau `.msi`)

1. Unduh berkas instalasi installer Windows (`Kasir Terbuka_x64-setup.exe` atau `.msi`).
2. Klik dua kali pada berkas installer untuk memulai proses instalasi.
3. **Peringatan Windows SmartScreen (Unsigned Binary):**
   - Karena Kasir Terbuka adalah proyek sumber terbuka (open-source) nirlaba yang belum ditandatangani sertifikat berbayar komersial (Code Signing Certificate), Windows Defender SmartScreen mungkin menampilkan layar biru bertuliskan:
     > _"Windows protected your PC / Windows melindungi PC Anda"_
   - **Solusi / Cara Melanjutkan:**
     1. Klik tautan teks **"More info"** (_Informasi selengkapnya_).
     2. Tombol **"Run anyway"** (_Tetap jalankan_) akan muncul di bagian bawah.
     3. Klik **"Run anyway"** untuk menyelesaikan instalasi.

### macOS (`.dmg`)

1. Unduh berkas disk image `Kasir Terbuka_universal.dmg` atau `Kasir Terbuka_aarch64.dmg`.
2. Buka berkas `.dmg`, lalu tarik ikon **Kasir Terbuka** ke folder **Applications**.
3. **Peringatan Apple Gatekeeper (Unsigned Binary):**
   - macOS akan menampilkan peringatan:
     > _"Kasir Terbuka cannot be opened because the developer cannot be verified"_
   - **Solusi / Cara Membuka:**
     1. Buka folder **Applications** melalui Finder.
     2. Klik kanan (atau Control + Klik) pada ikon **Kasir Terbuka**, lalu pilih **Open** (Buka).
     3. Pada kotak dialog konfirmasi, klik **Open**. (Langkah ini hanya perlu dilakukan sekali saat pertama kali aplikasi dibuka).
     4. Alternatif: Buka **System Settings** > **Privacy & Security**, scroll ke bagian _Security_, dan klik tombol **"Open Anyway"** di sebelah teks Kasir Terbuka.

### Linux (`.deb` atau `.AppImage`)

- **Debian / Ubuntu (`.deb`)**:
  ```bash
  sudo dpkg -i kasir-terbuka_*_amd64.deb
  # Jika ada dependensi yang kurang:
  sudo apt-get install -f
  ```
- **AppImage (`.AppImage`)**:
  ```bash
  chmod +x Kasir_Terbuka_*.AppImage
  ./Kasir_Terbuka_*.AppImage
  ```

---

## 3. Konfigurasi Printer Kasir Thermal di Aplikasi Desktop

Aplikasi desktop Kasir Terbuka menyertakan driver native (`TauriDriver`) yang berkomunikasi langsung dengan printer tanpa dialog peramban:

1. Buka menu **Pengaturan** di aplikasi desktop Kasir Terbuka.
2. Pada bagian **Printer**, pilih **Tipe koneksi**:
   - `Printer Desktop / Serial / Jaringan (Tauri)`
3. Masukkan target printer di kolom **Port Serial / IP Printer**:
   - **Printer Kabel USB / Serial:** Masukkan port serial (misalnya `COM1`, `COM3`, atau `/dev/ttyUSB0`).
   - **Printer Jaringan LAN / Wi-Fi:** Masukkan alamat IP dan port (misalnya `192.168.1.100:9100`). Port default `9100` adalah standar pabrik ESC/POS raw socket.
4. Klik **Simpan target printer**.
5. Klik **Cetak tes** untuk memastikan komunikasi dengan printer thermal bekerja dengan baik.

---

## 4. Keamanan & Penyimpanan Data

- Semua data transaksi, produk, dan pengaturan tersimpan secara lokal di mesin komputer Anda.
- Jangan lupa untuk rutin melakukan pencadangan melalui menu **Pengaturan > Cadangan data (Ekspor JSON)** dan simpan salinan berkas di media penyimpanan eksternal (flashdisk atau cloud pribadi Anda).
