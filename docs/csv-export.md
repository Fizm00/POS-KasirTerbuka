# Format Ekspor Transaksi (CSV)

Dokumen ini menjelaskan struktur data dan pertimbangan format ekspor CSV transaksi pada Kasir Terbuka.

## Pilihan Struktur Data: Satu Baris per Item Transaksi (_One Row per Transaction Item_)

Ekspor data transaksi menggunakan struktur **satu baris untuk setiap item produk dalam transaksi** (_line-item level_), bukan satu baris per transaksi tunggal.

### Alasan Pemilihan Format

1. **Analisis Produk dan Persediaan yang Akurat:** Pemilik toko dapat langsung memfilter dan menganalisis produk mana yang paling laris, pergerakan stok historis, serta kontribusi margin per produk langsung di spreadsheet (Microsoft Excel / Google Sheets).
2. **Kesesuaian dengan Pembukuan:** Dalam pembukuan dan akuntansi ritel/warung, harga jual, harga pokok (modal), dan kuantitas tiap produk dibutuhkan untuk menghitung HPP (Harga Pokok Penjualan) secara mendalam.
3. **Fleksibilitas Pivot Table:** Format tabular normal (_flat table_) per item sangat memudahkan pembuatan Pivot Table untuk agregasi per hari, per kasir, per metode pembayaran, maupun per kategori produk.

## Spesifikasi Teknis File

- **Karakter Pengkodean (Encoding):** UTF-8 dengan Byte Order Mark (`\uFEFF`) agar aplikasi Microsoft Excel pada Windows langsung membaca teks berkarakter khusus dan huruf Latin dengan benar tanpa kendala _encoding_.
- **Pemisah Kolom (Delimiter):** Koma (`,`) sesuai standar RFC 4180.
- **Pemisah Baris (Line Ending):** CRLF (`\r\n`).
- **Penanganan Teks Khusus (Escaping):** Nilai teks yang mengandung tanda koma (`,`), tanda kutip ganda (`"`), atau baris baru (`\n`) dibungkus dengan tanda kutip ganda, dan tanda kutip ganda internal diduplikasi (`""`).

## Daftar Kolom CSV

| No  | Nama Kolom          | Contoh Nilai          | Keterangan                                                                      |
| --- | ------------------- | --------------------- | ------------------------------------------------------------------------------- |
| 1   | `No Invoice`        | `INV-20261009-0001`   | Nomor invoice unik transaksi                                                    |
| 2   | `Waktu (WIB)`       | `09/10/2026 14:32`    | Waktu transaksi dalam zona waktu Asia/Jakarta (WIB)                             |
| 3   | `Kasir`             | `Budi Admin`          | Nama kasir yang melayani                                                        |
| 4   | `Metode Pembayaran` | `Tunai`               | Tunai, QRIS, atau Transfer                                                      |
| 5   | `SKU`               | `KOP-001`             | Kode SKU produk                                                                 |
| 6   | `Nama Produk`       | `Kopi Susu Gula Aren` | Nama produk snapshot saat transaksi                                             |
| 7   | `Harga Satuan`      | `15000`               | Harga jual per unit (integer Rupiah)                                            |
| 8   | `Harga Modal`       | `10000`               | Harga modal per unit snapshot (integer Rupiah)                                  |
| 9   | `Jumlah`            | `2`                   | Jumlah barang yang dibeli (Qty)                                                 |
| 10  | `Subtotal Item`     | `30000`               | Subtotal item (`Harga Satuan * Jumlah`)                                         |
| 11  | `Laba Item`         | `10000`               | Laba kotor item sebelum diskon faktur (`(Harga Satuan - Harga Modal) * Jumlah`) |
| 12  | `Diskon Transaksi`  | `0`                   | Potongan harga transaksi keseluruhan                                            |
| 13  | `Total Transaksi`   | `30000`               | Total akhir yang dibayar pelanggan                                              |
| 14  | `Status`            | `Selesai`             | Status transaksi (`Selesai` atau `Dibatalkan`)                                  |

_Catatan: Pada menu Laporan, transaksi yang dibatalkan (void) otomatis dikecualikan dari data yang diekspor._
