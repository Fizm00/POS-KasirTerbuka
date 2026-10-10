import { CashierMockup } from "./screenshots/CashierMockup";
import { ProductTableMockup } from "./screenshots/ProductTableMockup";
import { ReportMockup } from "./screenshots/ReportMockup";
import { PinLockMockup } from "./screenshots/PinLockMockup";

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[#FBFAF7] text-[#1A1A18] py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 divide-y divide-[#E6E3DA]">
        {/* Row 1: Fast at the counter (Text Left / Screenshot Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center py-20 first:pt-0">
          <div className="lg:col-span-5 space-y-5">
            <h2 className="font-serif-display font-normal text-3xl sm:text-4xl text-[#1A1A18] leading-tight">
              Fast at the counter
            </h2>
            <p className="text-[#5F5E58] text-base sm:text-lg leading-relaxed">
              Complete transactions at checkout in seconds. Search items instantly, scan barcodes,
              and let the app calculate change automatically without delay.
            </p>
            <ul className="space-y-2 pt-2 text-sm text-[#1A1A18]">
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Instant product search and barcode scanning
              </li>
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Keyboard shortcuts: F2 to search, F9 to pay
              </li>
              <li className="pb-2">Automatic discount and change calculation</li>
            </ul>
          </div>
          <div className="lg:col-span-7">
            <CashierMockup />
          </div>
        </div>

        {/* Row 2: Products & inventory (Screenshot Left / Text Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center py-20">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <ProductTableMockup />
          </div>
          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <h2 className="font-serif-display font-normal text-3xl sm:text-4xl text-[#1A1A18] leading-tight">
              Products & inventory
            </h2>
            <p className="text-[#5F5E58] text-base sm:text-lg leading-relaxed">
              Track store inventory clearly and transparently. Stock reduces automatically with each
              completed sale, with clear indicators before items run out.
            </p>
            <ul className="space-y-2 pt-2 text-sm text-[#1A1A18]">
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Automatic stock deduction upon completed payment
              </li>
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Visual alerts when inventory runs low
              </li>
              <li className="pb-2">Organize products by store categories</li>
            </ul>
          </div>
        </div>

        {/* Row 3: Clear, honest reports (Text Left / Screenshot Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center py-20">
          <div className="lg:col-span-5 space-y-5">
            <h2 className="font-serif-display font-normal text-3xl sm:text-4xl text-[#1A1A18] leading-tight">
              Clear, honest reports
            </h2>
            <p className="text-[#5F5E58] text-base sm:text-lg leading-relaxed">
              Understand daily store performance without confusing, bloated charts. Four key numbers
              give a complete overview, with instant CSV export anytime.
            </p>
            <ul className="space-y-2 pt-2 text-sm text-[#1A1A18]">
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Four key metrics: gross sales, profit, orders, and average ticket
              </li>
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Daily revenue trend chart in a single refined green hue
              </li>
              <li className="pb-2">Export full transaction history to CSV spreadsheet</li>
            </ul>
          </div>
          <div className="lg:col-span-7">
            <ReportMockup />
          </div>
        </div>

        {/* Row 4: Roles & PIN lock (Screenshot Left / Text Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center py-20 last:pb-0">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <PinLockMockup />
          </div>
          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <h2 className="font-serif-display font-normal text-3xl sm:text-4xl text-[#1A1A18] leading-tight">
              Roles & PIN lock
            </h2>
            <p className="text-[#5F5E58] text-base sm:text-lg leading-relaxed">
              Protect store records with local access permissions. Cashiers focus on ringing up
              customers, while voiding transactions and editing products require an admin PIN.
            </p>
            <ul className="space-y-2 pt-2 text-sm text-[#1A1A18]">
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Cashier sign-in with secure local numeric PIN
              </li>
              <li className="pb-2 border-b border-[#E6E3DA]/80">
                Safe transaction voiding with mandatory reason recording
              </li>
              <li className="pb-2">Auto-lock screen when the register is left unattended</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
