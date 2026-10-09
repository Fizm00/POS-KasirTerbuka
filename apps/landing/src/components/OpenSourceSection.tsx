export function OpenSourceSection() {
  return (
    <section className="bg-[#FBFAF7] text-[#1A1A18] py-24 md:py-32 border-t border-[#E6E3DA]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="max-w-[720px] space-y-6">
          <h2 className="font-serif-display font-normal text-3xl sm:text-4xl lg:text-[44px] text-[#1A1A18] leading-[1.12]">
            Dibuat terbuka, supaya bisa diperiksa.
          </h2>

          <p className="text-[#5F5E58] text-base sm:text-lg leading-relaxed">
            Seluruh kode sumber aplikasi ini tersedia secara terbuka dan bebas diaudit oleh siapa
            saja di bawah lisensi AGPL-3.0. Kami percaya bahwa alat kerja utama untuk toko kecil
            tidak boleh terkunci di dalam sistem berbayar atau server pihak ketiga.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-6 text-sm">
            <a
              href="https://github.com/Fizm00/POS-KasirTerbuka/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1F6F5C] hover:underline underline-offset-4 font-medium"
            >
              Laporkan masalah
            </a>
            <a
              href="https://github.com/Fizm00/POS-KasirTerbuka#contributing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1F6F5C] hover:underline underline-offset-4 font-medium"
            >
              Berkontribusi
            </a>
            <a
              href="https://github.com/Fizm00/POS-KasirTerbuka#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1F6F5C] hover:underline underline-offset-4 font-medium"
            >
              Dokumentasi
            </a>
            <a
              href="https://github.com/Fizm00/POS-KasirTerbuka.git"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1F6F5C] hover:underline underline-offset-4 font-medium"
            >
              Repositori GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
