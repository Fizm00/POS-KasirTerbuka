import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { StatementSection } from "./components/StatementSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { LocalFirstSection } from "./components/LocalFirstSection";
import { ThermalPrinterSection } from "./components/ThermalPrinterSection";
import { StepsSection } from "./components/StepsSection";
import { DownloadSection } from "./components/DownloadSection";
import { OpenSourceSection } from "./components/OpenSourceSection";
import { FaqSection } from "./components/FaqSection";
import { FooterSection } from "./components/FooterSection";

export default function App() {
  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#1A1A18] antialiased selection:bg-[#1F6F5C] selection:text-white">
      {/* 1. Header (64px) & Hero on deep green (#0E2B25) */}
      <Header />
      <Hero />

      {/* 2. Pernyataan on deep green (#0E2B25) */}
      <StatementSection />

      {/* 3. Fitur (4 alternating rows) on off-white (#FBFAF7) */}
      <FeaturesSection />

      {/* 4. Local-First explainer with 2-color line diagram */}
      <LocalFirstSection />

      {/* 5. Printer Thermal: Struk ESC/POS & tabel dukungan */}
      <ThermalPrinterSection />

      {/* 6. Cara mulai: Mulai dalam tiga langkah */}
      <StepsSection />

      {/* 7. Unduh: Panel lebar dengan deteksi & pilihan platform */}
      <DownloadSection />

      {/* 8. Sumber terbuka: Dibuat terbuka, supaya bisa diperiksa */}
      <OpenSourceSection />

      {/* 9. FAQ: Akordion 7 pertanyaan */}
      <FaqSection />

      {/* 10. Penutup & Footer on deep green (#0E2B25) */}
      <FooterSection />
    </div>
  );
}
