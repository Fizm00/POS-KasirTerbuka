export function FooterSection() {
  return (
    <footer className="bg-[#0E2B25] text-[#F1EFE8] pt-24 pb-16">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        {/* Centered Closing Headline & Primary Action */}
        <div className="text-center max-w-[640px] mx-auto pb-24">
          <h2 className="font-serif-display font-light text-3xl sm:text-5xl lg:text-[56px] leading-[1.08] tracking-[-0.02em] text-[#F1EFE8] mb-8">
            Start recording sales today.
          </h2>

          <div className="flex justify-center">
            <a
              href="#download"
              className="h-[52px] px-8 rounded-lg bg-[#F1EFE8] text-[#0E2B25] font-semibold text-base inline-flex items-center justify-center hover:bg-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#B08A57] focus:ring-offset-2 focus:ring-offset-[#0E2B25]"
            >
              Download App
            </a>
          </div>
        </div>

        {/* Footer Area on the Same Background */}
        <div className="border-t border-white/10 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[#A9B7B1]">
          {/* Product name & open source statement */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-semibold text-base text-[#F1EFE8] tracking-tight">
              Kasir Terbuka
            </span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span>Open-source project.</span>
          </div>

          {/* Plain Links */}
          <nav className="flex items-center gap-6">
            <a
              href="https://github.com/Fizm00/POS-KasirTerbuka.git"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#F1EFE8] transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://github.com/Fizm00/POS-KasirTerbuka#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#F1EFE8] transition-colors"
            >
              Documentation
            </a>
            <a
              href="https://github.com/Fizm00/POS-KasirTerbuka/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#F1EFE8] transition-colors"
            >
              License
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
