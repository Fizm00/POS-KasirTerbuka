import { CashierMockup } from "./screenshots/CashierMockup";
import { ProductTableMockup } from "./screenshots/ProductTableMockup";
import { ReportMockup } from "./screenshots/ReportMockup";
import { PinLockMockup } from "./screenshots/PinLockMockup";

export function FeaturesSection() {
  return (
    <section id="fitur" className="bg-[#FBFAF7] text-[#1A1A18] py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 divide-y divide-[#E6E3DA]">
        {/* Row 1: Kasir yang cepat (Text Left / Screenshot Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center py-20 first:pt-0">
          <div className="lg:col-span-5 space-y-5">
            <h2 className="font-serif-display font-normal text-3xl sm:text-4xl text-[#1A1A18] leading-tight">
              Kasir yang cepat
            </h2>
            <p className="text-[#5F5E58] text-base sm:text-lg leading-relaxed">
              Proses transaksi di meja kasir selesai dalam hitungan detik. Cari barang dengan cepat,
              scan barcode, dan biarkan aplikasi menghitung kembalian otomatis tanpa jeda.
            </p>
            <ul className="space-y-2 pt-2 text-sm text-[#1A1A18]">
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Pencarian produk instan dan pemindai barcode
              </li>
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Pintasan keyboard F2 untuk cari dan F9 untuk bayar
              </li>
              <li className="pb-2">Perhitungan kembalian dan diskon secara otomatis</li>
            </ul>
          </div>
          <div className="lg:col-span-7">
            <CashierMockup />
          </div>
        </div>

        {/* Row 2: Stok dan produk (Screenshot Left / Text Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center py-20">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <ProductTableMockup />
          </div>
          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <h2 className="font-serif-display font-normal text-3xl sm:text-4xl text-[#1A1A18] leading-tight">
              Stok dan produk
            </h2>
            <p className="text-[#5F5E58] text-base sm:text-lg leading-relaxed">
              Pantau persediaan barang dagangan dengan rapi dan transparan. Stok berkurang otomatis
              setiap kali penjualan berhasil, lengkap dengan indikator sebelum barang habis.
            </p>
            <ul className="space-y-2 pt-2 text-sm text-[#1A1A18]">
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Stok berkurang otomatis saat pembayaran selesai
              </li>
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Peringatan visual saat persediaan menipis
              </li>
              <li className="pb-2">Pengelompokan barang berdasarkan kategori toko</li>
            </ul>
          </div>
        </div>

        {/* Row 3: Laporan sederhana (Text Left / Screenshot Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center py-20">
          <div className="lg:col-span-5 space-y-5">
            <h2 className="font-serif-display font-normal text-3xl sm:text-4xl text-[#1A1A18] leading-tight">
              Laporan sederhana
            </h2>
            <p className="text-[#5F5E58] text-base sm:text-lg leading-relaxed">
              Ketahui kinerja toko harian tanpa grafik rumit yang membingungkan. Empat angka utama
              memberikan ringkasan menyeluruh dengan opsi ekspor riwayat ke file CSV kapan saja.
            </p>
            <ul className="space-y-2 pt-2 text-sm text-[#1A1A18]">
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Empat angka utama: penjualan, laba, nota, dan rata-rata
              </li>
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Grafik tren pendapatan harian dengan satu warna hijau
              </li>
              <li className="pb-2">Ekspor seluruh data transaksi ke spreadsheet CSV</li>
            </ul>
          </div>
          <div className="lg:col-span-7">
            <ReportMockup />
          </div>
        </div>

        {/* Row 4: Beberapa peran (Screenshot Left / Text Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center py-20 last:pb-0">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <PinLockMockup />
          </div>
          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <h2 className="font-serif-display font-normal text-3xl sm:text-4xl text-[#1A1A18] leading-tight">
              Beberapa peran
            </h2>
            <p className="text-[#5F5E58] text-base sm:text-lg leading-relaxed">
              Jaga catatan toko dengan hak akses lokal. Kasir berfokus melayani pelanggan, sedangkan
              pembatalan transaksi dan perubahan produk dilindungi PIN khusus admin.
            </p>
            <ul className="space-y-2 pt-2 text-sm text-[#1A1A18]">
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Masuk kasir dengan PIN numerik yang aman di perangkat
              </li>
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Pembatalan transaksi aman dengan pencatatan alasan
              </li>
              <li className="pb-2">Kunci layar otomatis saat kasir ditinggalkan</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
