import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-[#0E2B25] border-b border-white/10">
      <div className="max-w-[1200px] h-full mx-auto px-6 lg:px-8 flex items-center justify-between">
        <a
          href="/"
          className="min-h-[48px] inline-flex items-center text-[#F1EFE8] font-semibold text-lg tracking-tight hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#B08A57]"
        >
          Kasir Terbuka
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-[#A9B7B1] hover:text-[#F1EFE8] text-sm font-medium transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-[#A9B7B1] hover:text-[#F1EFE8] text-sm font-medium transition-colors"
          >
            How it works
          </a>
          <a
            href="#download"
            className="text-[#A9B7B1] hover:text-[#F1EFE8] text-sm font-medium transition-colors"
          >
            Download
          </a>
          <a
            href="#faq"
            className="text-[#A9B7B1] hover:text-[#F1EFE8] text-sm font-medium transition-colors"
          >
            FAQ
          </a>
          <a
            href="https://github.com/Fizm00/POS-KasirTerbuka.git"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#A9B7B1] hover:text-[#F1EFE8] text-sm font-medium transition-colors"
          >
            GitHub
          </a>
        </nav>

        {/* Desktop Download Button */}
        <div className="hidden md:flex items-center">
          <a
            href="#download"
            className="h-10 px-5 rounded-lg bg-[#F1EFE8] text-[#0E2B25] text-sm font-semibold inline-flex items-center justify-center hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#B08A57]"
          >
            Download
          </a>
        </div>

        {/* Mobile Menu Button (48px x 48px tap target) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          className="md:hidden w-12 h-12 flex items-center justify-center text-[#F1EFE8] hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B08A57]"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0E2B25] border-b border-white/10 px-6 py-4 space-y-2">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[48px] flex items-center text-[#F1EFE8] text-base font-medium hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[48px] flex items-center text-[#F1EFE8] text-base font-medium hover:text-white transition-colors"
          >
            How it works
          </a>
          <a
            href="#download"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[48px] flex items-center text-[#F1EFE8] text-base font-medium hover:text-white transition-colors"
          >
            Download
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[48px] flex items-center text-[#F1EFE8] text-base font-medium hover:text-white transition-colors"
          >
            FAQ
          </a>
          <a
            href="https://github.com/Fizm00/POS-KasirTerbuka.git"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[48px] flex items-center text-[#F1EFE8] text-base font-medium hover:text-white transition-colors"
          >
            GitHub
          </a>
          <div className="pt-2">
            <a
              href="#download"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full h-12 rounded-lg bg-[#F1EFE8] text-[#0E2B25] text-sm font-semibold flex items-center justify-center hover:bg-white transition-colors"
            >
              Download App
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
