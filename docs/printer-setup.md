# Panduan Penyiapan Thermal Printer (ESC/POS) — Kasir Terbuka

Aplikasi **Kasir Terbuka** mendukung pencetakan struk thermal format ESC/POS standar (lebar kertas **58 mm** dan **80 mm**) melalui beberapa pilihan transportasi:

1. **Dialog Cetak Browser (`window.print`)** — Fallback universal yang bekerja di 100% perangkat dan peramban tanpa memerlukan driver khusus.
2. **USB / Serial Virtual COM (Web Serial)** — Direkomendasikan untuk PC desktop / laptop berbasis peramban Chromium (Google Chrome, Microsoft Edge, Opera).
3. **USB Langsung (WebUSB)** — Komunikasi langsung bulk-endpoint USB pada peramban Chromium.
4. **Bluetooth BLE (Web Bluetooth)** — Untuk printer thermal portabel yang mengekspos layanan BLE GATT UART transparan.

---

## 1. Pilihan Transportasi & Penyiapan

### A. Dialog Cetak Browser (Universal Fallback)

Pilihan ini adalah yang paling sederhana dan selalu dapat diandalkan:

1. Masuk ke menu **Pengaturan > Toko**, pastikan opsi **Lebar kertas** sesuai dengan printer Anda (**58 mm** atau **80 mm**).
2. Di bagian **Printer**, pilih tipe koneksi: **Dialog Cetak Browser (window.print)**.
3. Klik tombol **Cetak tes**. Jendela dialog cetak bawaan peramban akan terbuka.
4. Pada jendela dialog cetak:
   - **Tujuan / Destination:** Pilih nama printer thermal Anda yang terpasang di sistem operasi.
   - **Ukuran Kertas:** Pilih _58mm Roll_ atau _80mm Roll_.
   - **Margin:** Pilih _None_ (Tanpa margin).
   - **Header dan Footer:** Nonaktifkan (jangan centang opsi tanggal dan URL peramban).

---

### B. USB / Serial Port (Web Serial)

Sangat cocok untuk printer thermal USB di desktop Windows/Linux yang menggunakan chip jembatan USB-to-Serial (misal: CH340, PL2303, FTDI, CP2102) atau port COM virtual:

1. Hubungkan kabel USB printer thermal ke komputer dan hidupkan daya printer.
2. Buka aplikasi Kasir Terbuka di **Google Chrome** atau **Microsoft Edge**.
3. Buka menu **Pengaturan > Printer**.
4. Pilih tipe koneksi: **USB / Serial Port (Web Serial)**.
5. Klik tombol **Hubungkan printer**.
6. Jendela pemilih perangkat peramban akan muncul di bagian atas layar. Pilih port printer yang terdeteksi (misal: _USB-SERIAL CH340_ atau _COM3_), lalu klik **Hubungkan (Connect)**.
7. Status akan berubah menjadi **Terhubung**. Klik **Cetak tes** untuk menguji cetakan struk.

---

### C. USB Langsung (WebUSB)

1. Hubungkan printer thermal via kabel USB ke PC (atau tablet Android via kabel USB-OTG).
2. Buka menu **Pengaturan > Printer**, pilih **USB Langsung (WebUSB)**.
3. Klik **Hubungkan printer**. Pilih printer USB dari dialog izin peramban.
4. _Catatan Pengguna Windows:_ Driver sistem bawaan Windows (`usbprint.sys`) terkadang mengunci akses eksklusif ke perangkat USB. Jika browser menolak mengklaim antarmuka, gunakan mode **Web Serial** atau **Dialog Cetak Browser**.

---

### D. Bluetooth BLE (Web Bluetooth)

1. Aktifkan Bluetooth pada perangkat komputer atau smartphone/tablet kasir Anda.
2. Hidupkan printer thermal Bluetooth portabel Anda.
3. Pada browser Chrome / Edge, buka **Pengaturan > Printer**, lalu pilih **Bluetooth BLE (Web Bluetooth)**.
4. Klik **Hubungkan printer**. Pilih nama printer Bluetooth yang terdeteksi pada daftar pemindai BLE.
5. _Catatan:_ Web Bluetooth pada peramban web standar hanya mendukung protokol **Bluetooth Low Energy (BLE)** GATT. Printer Bluetooth generasi lama yang hanya mendukung Bluetooth Classic SPP (Serial Port Profile) memerlukan aplikasi pembungkus native (Tauri / Capacitor) atau dialog cetak peramban.

---

## 2. Pengaturan Laci Kasir (Cash Drawer)

Printer thermal ESC/POS umumnya memiliki konektor kabel RJ11 / RJ12 di bagian belakang yang terhubung langsung ke laci kasir:

- Untuk membuka laci otomatis saat struk dicetak, centang kotak **"Buka laci kasir otomatis saat mencetak"** di menu **Pengaturan > Printer**.
- Anda juga dapat menguji pemicu pembuka laci secara manual dengan menekan tombol **"Buka laci kasir"**.
- _Catatan:_ Perintah pembuka laci kasir membutuhkan koneksi ESC/POS langsung (Web Serial, WebUSB, atau Bluetooth) dan tidak dapat dikirim melalui dialog cetak browser biasa.

---

## 3. Penanganan Masalah Umum (Troubleshooting)

| Gejala Masalah                                                     | Kemungkinan Penyebab                                                                                       | Solusi                                                                                                                                                                                                                                                          |
| :----------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tombol "Hubungkan printer" dinonaktifkan / abu-abu                 | Peramban tidak mendukung Web API hardware terkait (misal: membuka Web Serial di Safari atau Firefox lama). | Beralih ke Google Chrome / Microsoft Edge di komputer desktop, atau gunakan mode **Dialog Cetak Browser**.                                                                                                                                                      |
| Huruf tercetak simbol acak / karakter tanda tanya                  | Laju baud rate serial tidak cocok atau _codepage_ tidak dikenali printer.                                  | Standar printer adalah 9600 bps atau 38400 bps dengan codepage CP437. Pastikan konfigurasi dip dip-switch printer thermal berada pada pengaturan standar pabrik.                                                                                                |
| Printer tidak merespons setelah kabel dicabut dan dipasang kembali | Sesi port Web Serial terputus oleh sistem operasi.                                                         | Klik tombol **Putuskan koneksi**, lalu klik **Hubungkan printer** kembali untuk memilih port yang aktif.                                                                                                                                                        |
| Dialog cetak browser mencetak terlalu kecil                        | Skala zoom cetak peramban tidak diatur 100%.                                                               | Pada dialog cetak Chrome/Edge, atur Scale ke _100%_ atau _Fit to printable area_.                                                                                                                                                                               |
| Transaksi penjualan berhasil tetapi struk gagal dicetak            | Printer kehabisan kertas thermal atau kabel printer lepas.                                                 | Penjualan di Kasir Terbuka **tidak pernah dibatalkan karena kegagalan printer**. Masukkan gulungan kertas baru, lalu tekan tombol **"Coba cetak lagi"** pada jendela pembayaran atau buka menu Riwayat / Pengaturan lalu klik **"Cetak ulang struk terakhir"**. |

---

## 4. Status Pengujian Perangkat Keras Fisik

> **Pernyataan Kejujuran Kompatibilitas Perangkat Keras:**
>
> Seluruh aliran data byte ESC/POS diuji secara otomatis pada unit testing menggunakan **Mock Driver (perekaman byte)** dan divalidasi pada **Dialog Cetak Browser (`window.print`)**.
>
> Mengingat keragaman perangkat thermal printer di pasar Indonesia, model perangkat keras berikut didaftarkan berdasarkan spesifikasi protokol ESC/POS standar dan saat ini berstatus **Belum Teruji Fisik (Untested on real hardware)** oleh pengembang hingga diverifikasi pada unit fisik:

| Merek & Model Populer di Indonesia | Antarmuka Fisik    | Status Pengujian Pengembang     |
| :--------------------------------- | :----------------- | :------------------------------ |
| **Panda PRJ-58D / PRJ-80**         | USB / Bluetooth    | _Belum Teruji Fisik (Untested)_ |
| **Iware C58 / MP-58 / TP-80**      | USB / Bluetooth    | _Belum Teruji Fisik (Untested)_ |
| **VSC TM-58 / TM-80**              | USB / Serial       | _Belum Teruji Fisik (Untested)_ |
| **Epson TM-T82 / TM-T88**          | USB / Serial / LAN | _Belum Teruji Fisik (Untested)_ |
| **Xprinter XP-58 / XP-80C**        | USB / Serial       | _Belum Teruji Fisik (Untested)_ |
| **Zjiang ZJ-5802 / POS-58**        | USB / Bluetooth    | _Belum Teruji Fisik (Untested)_ |
| **Goojprt PT-210 / MTP-II**        | USB / Bluetooth    | _Belum Teruji Fisik (Untested)_ |

_Jika Anda memiliki printer thermal di atas dan telah mengujinya dengan Kasir Terbuka, silakan berkontribusi dengan memperbarui tabel ini melalui Pull Request di repositori GitHub!_
