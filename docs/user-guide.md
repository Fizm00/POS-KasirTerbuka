# Panduan Pengguna — Kasir Terbuka

Kasir Terbuka adalah aplikasi kasir (Point of Sale / POS) gratis, bebas biaya langganan, dan beroperasi sepenuhnya secara offline (local-first) yang dirancang khusus untuk toko kelontong, warung, kafe, dan UMKM di Indonesia.

---

## Daftar Isi

1. [Prinsip & Keamanan Data](#1-prinsip--keamanan-data)
2. [Pemasangan Aplikasi (PWA)](#2-pemasangan-aplikasi-pwa)
3. [Penyiapan Awal (First-Run Wizard)](#3-penyiapan-awal-first-run-wizard)
4. [Layar Kasir & Transaksi Penjualan](#4-layar-kasir--transaksi-penjualan)
5. [Metode Pembayaran](#5-metode-pembayaran)
6. [Struk & Pencetakan](#6-struk--pencetakan)
7. [Riwayat Transaksi & Pembatalan (Void)](#7-riwayat-transaksi--pembatalan-void)
8. [Manajemen Produk & Kategori](#8-manajemen-produk--kategori)
9. [Laporan Penjualan & Ekspor CSV](#9-laporan-penjualan--ekspor-csv)
10. [Manajemen Pengguna & Hak Akses](#10-manajemen-pengguna--hak-akses)
11. [Pengaturan Toko, Printer & Cadangan Data](#11-pengaturan-toko-printer--cadangan-data)

---

## 1. Prinsip & Keamanan Data

- **Offline Sepenuhnya:** Kasir Terbuka tidak memerlukan koneksi internet untuk beroperasi harian.
- **Data Tersimpan Lokal:** Seluruh data produk, stok, transaksi, dan laporan disimpan langsung di browser perangkat Anda menggunakan teknologi IndexedDB.
- **Tanpa Akun Server:** Tidak ada server pihak ketiga yang mengumpulkan informasi penjualan Anda. Bisnis dan pembukuan Anda 100% privat.
- **Penyimpanan Persisten:** Saat pertama kali dijalankan, aplikasi secara otomatis meminta izin penyimpanan persisten (`navigator.storage.persist()`) ke browser agar data tidak terhapus otomatis oleh pembersihan cache peramban.

---

## 2. Pemasangan Aplikasi (PWA)

Anda dapat memasang Kasir Terbuka sebagai aplikasi mandiri di komputer (Windows/macOS/Linux) atau tablet/smartphone (Android/iPadOS):

1. **Google Chrome / Microsoft Edge (Desktop):**
   - Buka alamat aplikasi atau kunjungi `/unduh`.
   - Klik ikon pasang (tanda monitor/panah) di sebelah kanan bilah alamat (URL bar), atau klik menu browser (titik tiga) lalu pilih **"Pasang Kasir Terbuka"** / **"Install app"**.
   - Aplikasi akan terbuka di jendela mandiri tanpa address bar browser.

2. **Android (Chrome):**
   - Buka aplikasi di Google Chrome Android.
   - Tekan menu titik tiga di kanan atas.
   - Pilih **"Tambahkan ke Layar Utama"** atau **"Pasang Aplikasi"**.

3. **iOS / iPadOS (Safari):**
   - Buka aplikasi di Safari.
   - Tekan tombol **Bagikan** (Share icon panah ke atas).
   - Pilih **"Tambah ke Layar Utama"** (Add to Home Screen).

---

## 3. Penyiapan Awal (First-Run Wizard)

Ketika aplikasi dibuka untuk pertama kalinya pada perangkat baru, wisaya penyiapan 3 langkah akan memandu Anda:

1. **Data Toko:**
   - Masukkan Nama Toko (misal: _Toko Berkah_).
   - Masukkan Alamat dan Nomor Telepon.
   - Masukkan Teks Kaki Struk (misal: _Terima kasih atas kunjungan Anda!_).
   - Pilih Lebar Kertas Struk: **58 mm** atau **80 mm**.
2. **Akun Pemilik (Admin):**
   - Masukkan nama pemilik/pengelola toko.
   - Buat PIN masuk (4–6 digit angka). PIN disimpan dalam bentuk hash terenkripsi (PBKDF2 Web Crypto).
3. **Data Awal (Opsional):**
   - Anda dapat memilih untuk memuat produk sampel atau memulai dengan katalog kosong.

---

## 4. Layar Kasir & Transaksi Penjualan

Layar kasir dirancang untuk kecepatan transaksi di meja kasir (< 30 detik):

- **Pencarian Produk:**
  - Ketik nama produk atau SKU pada bilah pencarian.
  - Tekan **F2** pada keyboard kapan saja untuk langsung memfokuskan kursor ke pencarian produk.
  - Jika Anda menggunakan barcode scanner USB, arahkan kursor ke kolom pencarian lalu scan barcode produk.
- **Filter Kategori:**
  - Klik tab kategori untuk memfilter daftar produk dengan cepat.
- **Indikator Stok:**
  - Menampilkan sisa unit stok secara real-time.
  - Produk dengan stok di bawah ambang batas (low stock) diberi tanda peringatan tenang.
  - Produk dengan stok 0 dinonaktifkan dari penambahan keranjang.
- **Keranjang Belanja:**
  - Menampilkan daftar produk pesanan, kuantitas (`+` / `-`), harga satuan, dan subtotal.
  - Tombol **Kosongkan** untuk membatalkan seluruh isi keranjang.
- **Pemberian Diskon:**
  - Klik tombol **Atur Diskon** di bawah subtotal.
  - Pilih jenis diskon: **Nominal (Rp)** atau **Persentase (%)**.
  - Masukkan nilai potongan, lalu klik **Terapkan diskon**.

---

## 5. Metode Pembayaran

Untuk menyelesaikan pesanan, klik tombol **Bayar (F9)** atau tekan tombol keyboard **F9**:

1. **Tunai:**
   - Masukkan jumlah uang tunai yang diterima dari pelanggan.
   - Tersedia tombol cepat nominal uang pas dan pecahan umum (Rp 10.000, Rp 20.000, Rp 50.000, Rp 100.000).
   - Kembalian akan dihitung secara otomatis dan ditampilkan jelas.
   - Tombol konfirmasi bayar dinonaktifkan jika uang yang diterima kurang dari total belanja.
2. **QRIS:**
   - Pilih metode QRIS.
   - Kasir mencatat pembayaran setelah pelanggan berhasil memindai kode QRIS toko Anda.
3. **Transfer:**
   - Pilih metode Transfer jika pelanggan membayar melalui transfer bank.

Transaksi diproses secara **atomik**: invoice dibuat, stok produk dikurangi, dan transaksi disimpan bersamaan. Jika stok tidak mencukupi, transaksi dibatalkan sepenuhnya tanpa mengubah stok.

---

## 6. Struk & Pencetakan

Setelah transaksi selesai, jendela konfirmasi berhasil akan muncul:

- Menampilkan nomor invoice harian (contoh: `INV-20261009-0001`), rincian total, metode bayar, uang diterima, dan kembalian.
- Klik **Cetak struk** untuk mencetak melalui dialog cetak peramban (`window.print()`).
- Format struk thermal telah dioptimalkan untuk ukuran kertas **58 mm** (32 karakter/baris) dan **80 mm** (48 karakter/baris).
- Klik **Transaksi baru** untuk langsung kembali ke layar kasir yang bersih.

---

## 7. Riwayat Transaksi & Pembatalan (Void)

Menu **Riwayat** memungkinkan penelusuran seluruh transaksi penjualan:

- **Filter Pencarian:**
  - Filter berdasarkan rentang tanggal (_Dari tanggal_ - _Sampai tanggal_).
  - Filter berdasarkan nama kasir yang melayani.
  - Filter berdasarkan status transaksi (_Selesai_ atau _Dibatalkan_).
- **Detail Transaksi:**
  - Klik baris transaksi untuk melihat rincian produk, kuantitas saat transaksi dibeli (snapshot), subtotal, diskon, dan metode pembayaran.
  - **Cetak ulang struk:** Tersedia tombol cetak ulang struk kapan saja.
- **Pembatalan Transaksi (Void - Khusus Admin):**
  - Transaksi yang salah input dapat dibatalkan oleh pengguna dengan peran **Admin**.
  - Masukkan alasan pembatalan.
  - Saat transaksi dibatalkan, seluruh kuantitas produk yang terjual akan **dikembalikan ke stok barang secara otomatis**.
  - Transaksi yang sudah dibatalkan tidak dapat dibatalkan untuk kedua kalinya.

---

## 8. Manajemen Produk & Kategori

Menu **Produk** digunakan untuk mengelola data katalog barang (khusus Admin):

- **Tambah & Ubah Produk:**
  - Nama produk, SKU (kode unik barang / barcode), kategori, harga jual, harga modal (HPP), stok saat ini, dan batas stok menipis.
- **Filter Stok Menipis:**
  - Toggle tombol filter stok menipis untuk melihat barang-barang yang perlu segera dipesan ulang ke pemasok.
- **Manajemen Kategori:**
  - Tambah dan hapus kategori produk. Kategori yang masih memiliki produk terkait tidak dapat dihapus sembarangan untuk mencegah inkonsistensi data.

---

## 9. Laporan Penjualan & Ekspor CSV

Menu **Laporan** menyajikan rangkuman bisnis toko:

- **Preset Rentang Waktu:**
  - _Hari ini_, _7 hari terakhir_, _Bulan ini_, dan _Rentang kustom_.
- **Ringkasan Angka Utama:**
  - **Total penjualan:** Penjualan kotor bersih setelah diskon (tidak termasuk transaksi yang dibatalkan).
  - **Jumlah transaksi:** Total transaksi selesai.
  - **Rata-rata per transaksi:** Nilai transaksi rata-rata (basket size).
  - **Laba kotor:** Total pendapatan dikurangi total harga modal (HPP).
- **Grafik Penjualan Harian:**
  - Visualisasi tren penjualan harian sederhana.
- **Produk Terlaris:**
  - Tabel peringkat produk yang paling banyak terjual berdasarkan kuantitas dan total nilai rupiah.
- **Ekspor CSV:**
  - Klik **Ekspor CSV** untuk mengunduh laporan transaksi dalam format file spreadsheet Excel/CSV yang dapat dibuka di Microsoft Excel atau Google Sheets.

---

## 10. Manajemen Pengguna & Hak Akses

Menu **Pengguna** memungkinkan pengelolaan akun staf kasir (khusus Admin):

- **Peran (Roles):**
  - **Admin:** Memiliki akses penuh ke seluruh fitur (Kasir, Produk, Riwayat, Pembatalan Void, Laporan, Pengguna, Pengaturan, Cadangan Data).
  - **Kasir:** Hanya dapat mengakses Layar Kasir dan melihat Riwayat transaksi (tidak dapat mengubah produk, membatalkan transaksi, atau mengakses pengaturan/laporan).
- **Keamanan PIN:**
  - Setiap pengguna masuk menggunakan PIN 4–6 digit.
  - Admin dapat mengatur ulang PIN staf yang lupa PIN.
  - Staf dapat mengubah PIN pribadi mereka melalui menu Pengaturan.
  - Proteksi Admin Terakhir: Sistem mencegah penonaktifan satu-satunya admin aktif untuk menghindari terkuncinya akses manajemen.
  - *Catatan Batasan Keamanan:* Perlindungan PIN lokal dirancang untuk mencegah penggunaan kasual antar staf saat pergantian giliran kerja di meja kasir. PIN lokal **bukan** sistem keamanan mutlak terhadap pihak yang memiliki akses fisik langsung ke perangkat atau alat pengembang peramban (developer tools). Selalu jaga keamanan fisik perangkat dan kunci perangkat utama Anda.
- **Kunci Otomatis (Auto-Lock):**
  - Layar akan terkunci otomatis jika tidak ada aktivitas pengguna dalam durasi tertentu (1, 2, 5, 10, atau 15 menit).

---

## 11. Pengaturan Toko, Printer & Cadangan Data

Menu **Pengaturan** menyediakan konfigurasi operasional toko:

1. **Pengaturan Toko:**
   - Ubah Nama Toko, Alamat, Telepon, Teks Kaki Struk, dan Lebar Kertas (58 mm / 80 mm).
2. **Pemasangan Aplikasi:**
   - Menampilkan status instalasi (mode mandiri/PWA atau peramban web) serta panduan pemasangan.
3. **Cadangan Data (Sangat Penting):**
   - Karena data disimpan di perangkat Anda sendiri, **sangat disarankan mengekspor cadangan secara berkala** (misal seminggu sekali atau setiap tutup toko).
   - **Ekspor cadangan (JSON):** Mengunduh seluruh database toko (produk, kategori, transaksi, pengguna, pengaturan) ke dalam satu file berkas `.json`. Simpan berkas ini di flashdisk atau Google Drive.
   - **Impor cadangan:** Memulihkan seluruh data toko dari file `.json`. Sistem akan menampilkan dialog konfirmasi yang merinci berapa banyak produk, transaksi, dan pengguna yang akan dimuat sebelum data digantikan secara aman dan atomik.
   - **Peringatan Tenang:** Jika data belum pernah dicadangkan selama lebih dari 7 hari, pengingat tenang akan muncul di area layar kasir dan pengaturan.
