# Panduan Pemasangan & Penggunaan Android (Capacitor) — Kasir Terbuka

Kasir Terbuka dapat dipasang sebagai aplikasi Android native mandiri di **Tablet** dan **Smartphone** menggunakan Capacitor shell.

Aplikasi berjalan **100% offline**, menyimpan database secara lokal di IndexedDB (penyimpanan permanen perangkat), dan mendukung pencetakan langsung ke printer kasir thermal Bluetooth (ESC/POS) menggunakan protokol Bluetooth Classic (SPP).

---

## 1. Memasang Berkas APK (Sideloading)

Anda dapat langsung memasang berkas APK tanpa melalui Google Play Store:

### Langkah Pemasangan:

1. Unduh berkas `Kasir-Terbuka-android-debug.apk` dari menu **Releases** di repositori GitHub ini melalui peramban di perangkat Android Anda.
2. Buka berkas APK yang telah selesai diunduh.
3. **Izin Sumber Tidak Dikenal (_Install Unknown Apps_):**
   - Jika sistem menampilkan pesan bahwa instalasi dari sumber ini diblokir, ketuk **Setelan / Settings**.
   - Aktifkan tombol **Izinkan dari sumber ini / Allow from this source** untuk aplikasi peramban (Chrome) atau File Manager yang Anda gunakan.
4. **Peringatan Google Play Protect (Unsigned/Debug APK):**
   - Karena berkas ini merupakan aplikasi open-source non-komersial berstatus debug/unsigned, Google Play Protect mungkin menampilkan pop-up kuning/oranye:
     > _"Aplikasi ini diblokir oleh Play Protect / App unverified"_
   - Ketuk teks **Rincian selengkapnya / More details**.
   - Ketuk tombol **Tetap instal / Install anyway**.
5. Buka aplikasi **Kasir Terbuka** yang telah terpasang.

---

## 2. Menghubungkan Printer Kasir Thermal Bluetooth

Printer kasir thermal (ukuran 58 mm dan 80 mm) merek umum seperti Panda, Eppos, VSC, Mini POS, Iware, Bellav, Zjiang, atau PT-210 menggunakan koneksi Bluetooth Classic (SPP).

### Langkah Menghubungkan:

1. **Nyalakan Printer:**
   - Nyalakan saklar daya printer kasir thermal Anda.
2. **Pasangkan (_Pairing_) di Pengaturan Android:**
   - Buka **Setelan Android > Bluetooth**.
   - Pastikan Bluetooth aktif, lalu pilih **Pasangkan perangkat baru / Pair new device**.
   - Pilih nama printer Anda (misalnya `RPP02N`, `MPT-II`, `POS-58`, atau `Bluetooth Printer`).
   - Masukkan PIN pairing bawaan pabrik (biasanya `0000` atau `1234`).
3. **Pilih Printer di Kasir Terbuka:**
   - Buka aplikasi **Kasir Terbuka**.
   - Masuk ke menu **Pengaturan > Printer**.
   - Pada **Tipe koneksi**, pilih:
     `Bluetooth Thermal Printer (Android)`
   - Pada **Alamat MAC Printer Bluetooth**, masukkan alamat Bluetooth printer (contoh: `00:11:22:33:44:55`). Jika dibiarkan kosong, aplikasi akan otomatis menggunakan printer Bluetooth pertama yang telah terpasang (_bonded_).
   - Ketuk **Simpan target printer**.
4. **Izin Akses Bluetooth (Android 12+):**
   - Saat pertama kali mencetak, sistem Android 12 ke atas akan meminta izin:
     > _"Izinkan Kasir Terbuka menemukan, menghubungkan, dan menentukan posisi relatif perangkat di sekitar?"_
   - Pilih **Izinkan / Allow** (`BLUETOOTH_CONNECT`).
5. **Uji Cetak:**
   - Ketuk tombol **Cetak tes**. Printer akan mengeluarkan struk uji diagnostik.

---

## 3. Tata Letak Layar (Tablet vs Ponsel)

Aplikasi telah dioptimalkan secara otomatis untuk berbagai ukuran layar Android sesuai spesifikasi `DESIGN.md`:

- **Tablet Lanskap (1280 x 800 - Rekomendasi Utama untuk Meja Kasir):**
  - Layar terbagi menjadi dua bagian: katalog produk dan kategori di sebelah kiri, serta panel keranjang belanja statis (~38% lebar layar) di sebelah kanan. Tombol pembayaran dan total harga selalu terlihat tanpa perlu berpindah layar.
- **Ponsel & Tablet Potret (Layar Sempit / Vertikal):**
  - Layar katalog menampilkan produk penuh dengan _sticky bottom bar_ yang menampilkan ringkasan jumlah item dan total harga.
  - Mengetuk bilah ringkasan akan membuka keranjang belanja sebagai lembar (_sheet modal_) layar penuh.
- **Area Aman (_Safe Areas_):**
  - Mendukung notch kamera, punch-hole, dan navigasi gestur Android dengan margin _safe-area-inset_ otomatis.

---

## 4. Pencadangan Data & Berbagi (Share / Save Sheet)

Karena aplikasi berjalan **100% lokal** di perangkat Android Anda (IndexedDB SQLite internal):

1. Buka menu **Pengaturan > Cadangan data**.
2. Ketuk tombol **Ekspor cadangan (JSON)** atau **Ekspor transaksi (CSV)**.
3. Dialog Berbagi Android (_Native Share Sheet_) akan muncul otomatis:
   - Anda dapat memilih **Simpan ke Files / Drive**, mengirim via **WhatsApp**, email, atau menyalin berkas ke flashdisk OTG.
4. Jangan lupa untuk rutin melakukan pencadangan setiap minggu untuk mengantisipasi perangkat hilang atau rusak.

---

## 5. Kompilasi dari Kode Sumber (Pengembang)

Jika Anda ingin membangun berkas APK secara manual di komputer Anda:

```bash
# 1. Pastikan dependensi terpasang
pnpm install

# 2. Bangun aset web frontend
pnpm build

# 3. Sinkronisasikan aset ke folder Android Capacitor
pnpm cap sync android

# 4. Bangun APK menggunakan Gradle wrapper
cd android
./gradlew assembleDebug
```

Berkas APK yang dihasilkan akan berada di:
`android/app/build/outputs/apk/debug/app-debug.apk`
