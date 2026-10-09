import { useState } from "react";

interface FaqItem {
  q: string;
  a: string;
}

export function FaqSection() {
  const faqs: FaqItem[] = [
    {
      q: "Apakah benar-benar gratis?",
      a: "Ya, aplikasi ini gratis selamanya di bawah lisensi AGPL-3.0. Tidak ada biaya langganan bulanan, tidak ada komisi per transaksi, dan tidak ada fitur berbayar yang dikunci.",
    },
    {
      q: "Di mana data saya disimpan?",
      a: "Seluruh data toko, daftar produk, dan riwayat transaksi disimpan langsung di penyimpanan lokal perangkat Anda sendiri (melalui IndexedDB browser/sistem). Data tidak pernah dikirim ke server luar mana pun.",
    },
    {
      q: "Bagaimana kalau perangkat rusak atau hilang?",
      a: "Karena data hanya ada di perangkat Anda dan tidak disimpan di server online, Anda perlu membuat cadangan data secara berkala ke file JSON. File tersebut dapat disimpan di flashdisk atau drive pribadi untuk dipulihkan jika perangkat bermasalah.",
    },
    {
      q: "Apakah bisa dipakai di beberapa tablet sekaligus?",
      a: "Saat ini belum bisa. Aplikasi dirancang mandiri untuk satu perangkat kasir per toko. Data transaksi tidak disinkronkan secara nirkabel antar-perangkat secara otomatis.",
    },
    {
      q: "Printer apa yang didukung?",
      a: "Mendukung printer thermal standar ESC/POS ukuran 58 mm dan 80 mm melalui koneksi USB atau Bluetooth. Anda juga dapat menggunakan dialog cetak bawaan browser (browser print).",
    },
    {
      q: "Apakah perlu internet?",
      a: "Tidak perlu. Seluruh fitur pencatatan kasir, kalkulasi stok, dan cetak struk bekerja 100% tanpa koneksi internet.",
    },
    {
      q: "Bagaimana cara mencadangkan data?",
      a: "Masuk ke menu Pengaturan > Cadangkan Data, lalu klik Ekspor Cadangan. File JSON akan terunduh ke perangkat Anda dan siap disimpan sebagai arsip aman.",
    },
  ];

  // First item expanded by default (index 0)
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section
      id="faq"
      className="bg-[#FBFAF7] text-[#1A1A18] py-24 md:py-32 border-t border-[#E6E3DA]"
    >
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <h2 className="font-serif-display font-normal text-3xl sm:text-4xl lg:text-[44px] text-[#1A1A18] leading-[1.12] mb-12">
          Pertanyaan yang sering diajukan
        </h2>

        {/* Accordion with hairline separators */}
        <div className="max-w-[840px] divide-y divide-[#E6E3DA] border-y border-[#E6E3DA]">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={faq.q} className="py-5">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between text-left gap-4 focus:outline-none group"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-base sm:text-lg text-[#1A1A18] group-hover:text-[#1F6F5C] transition-colors">
                    {faq.q}
                  </span>

                  {/* Simple line plus/minus icon */}
                  <span className="text-xl leading-none text-[#5F5E58] font-mono flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-3 text-sm sm:text-base text-[#5F5E58] leading-relaxed pr-8">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
