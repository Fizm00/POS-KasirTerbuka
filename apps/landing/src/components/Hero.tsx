import { Receipt } from "./Receipt";

export function Hero() {
  return (
    <section className="relative bg-[#0E2B25] text-[#F1EFE8] pt-10 pb-16 lg:pt-24 lg:pb-32 overflow-hidden lg:overflow-visible">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-start">
          {/* Headline & Subhead (Row 1 on Desktop, Top on Mobile) */}
          <div className="lg:col-span-7 lg:row-start-1 pt-2 text-left">
            <h1 className="font-serif-display font-light text-[38px] sm:text-[44px] lg:text-[72px] leading-[1.06] tracking-[-0.02em] text-[#F1EFE8]">
              Kasir gratis untuk toko kecil, yang tetap jalan tanpa internet.
            </h1>

            <p className="mt-5 text-[#A9B7B1] text-base sm:text-lg lg:text-xl font-normal leading-relaxed max-w-[560px]">
              Pasang di PC, tablet, atau HP. Datanya tetap di perangkat Anda.
            </p>
          </div>

          {/* Shorter Thermal Receipt Strip (Between subhead and buttons on Mobile; Right column on Desktop) */}
          <div className="lg:col-span-5 lg:row-start-1 lg:row-span-2 lg:pl-6 flex justify-start lg:justify-end my-2 lg:my-0">
            <div className="w-full max-w-[320px] sm:max-w-[340px] lg:translate-y-8 lg:-mb-24 z-10">
              <Receipt />
            </div>
          </div>

          {/* Action Buttons & Note (Row 2 on Desktop, Follows Receipt on Mobile) */}
          <div className="lg:col-span-7 lg:row-start-2 text-left">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
              <a
                href="#unduh"
                className="w-full sm:w-auto h-14 sm:h-[52px] px-8 rounded-lg bg-[#F1EFE8] text-[#0E2B25] font-semibold text-base inline-flex items-center justify-center hover:bg-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#B08A57] focus:ring-offset-2 focus:ring-offset-[#0E2B25] min-h-[48px]"
              >
                Unduh aplikasi
              </a>
              <a
                href="https://github.com/Fizm00/POS-KasirTerbuka.git"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] py-3 inline-flex items-center justify-start text-[#F1EFE8] font-medium text-base underline underline-offset-8 decoration-1 decoration-[#F1EFE8]/40 hover:decoration-[#F1EFE8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#B08A57] focus:ring-offset-2 focus:ring-offset-[#0E2B25]"
              >
                Lihat di GitHub
              </a>
            </div>

            <p className="mt-6 lg:mt-8 text-sm text-[#A9B7B1] font-normal tracking-wide">
              Gratis. Sumber terbuka. Tanpa akun.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
