export function Receipt() {
  return (
    <div
      className="relative w-full max-w-[340px] mx-auto filter drop-shadow-[0_24px_48px_rgba(0,0,0,0.28)] select-none"
      aria-label="Sample thermal receipt from Kasir Terbuka"
      role="img"
    >
      {/* Paper Body */}
      <div className="bg-white rounded-t-[2px] p-4 sm:p-6 text-[#1A1A18] font-receipt-mono text-[13px] leading-relaxed">
        {/* Store Header */}
        <div className="text-center pb-2.5 sm:pb-3">
          <div className="font-semibold text-sm sm:text-base tracking-tight text-[#1A1A18]">
            Toko Berkah
          </div>
          <div className="text-[11px] sm:text-xs text-[#5F5E58] mt-0.5">INV-20261009-0012</div>
          <div className="text-[11px] sm:text-xs text-[#5F5E58]">09/10/2026 14:32</div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-[#E6E3DA] my-2" />

        {/* Item Rows */}
        <div className="space-y-2 py-1 text-xs">
          <div>
            <div className="font-medium text-[#1A1A18]">Kopi Susu Gula Aren</div>
            <div className="flex justify-between text-[#5F5E58]">
              <span>2 x 15.000</span>
              <span className="text-[#1A1A18] font-medium">30.000</span>
            </div>
          </div>

          <div>
            <div className="font-medium text-[#1A1A18]">Nasi Goreng</div>
            <div className="flex justify-between text-[#5F5E58]">
              <span>1 x 23.000</span>
              <span className="text-[#1A1A18] font-medium">23.000</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-[#E6E3DA] my-2" />

        {/* Totals Section */}
        <div className="space-y-1.5 py-1 text-xs">
          <div className="pt-0.5 pb-1 flex justify-between items-baseline font-bold text-sm text-[#1A1A18] border-b-2 border-[#B08A57]">
            <span>TOTAL</span>
            <span className="text-base tabular-nums">53.000</span>
          </div>

          <div className="pt-1.5 flex justify-between text-[#5F5E58]">
            <span>Cash</span>
            <span className="text-[#1A1A18] tabular-nums">60.000</span>
          </div>
          <div className="flex justify-between text-[#5F5E58]">
            <span>Change</span>
            <span className="text-[#1A1A18] tabular-nums">7.000</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-3 sm:pt-4 pb-0.5 text-xs text-[#5F5E58]">Thank you</div>
      </div>

      {/* Serrated Tear Edge (SVG zigzag seamlessly aligned with white paper) */}
      <div className="w-full overflow-hidden leading-none -mt-px">
        <svg
          className="w-full h-3 text-white fill-current block"
          viewBox="0 0 340 12"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,0 L10,12 L20,0 L30,12 L40,0 L50,12 L60,0 L70,12 L80,0 L90,12 L100,0 L110,12 L120,0 L130,12 L140,0 L150,12 L160,0 L170,12 L180,0 L190,12 L200,0 L210,12 L220,0 L230,12 L240,0 L250,12 L260,0 L270,12 L280,0 L290,12 L300,0 L310,12 L320,0 L330,12 L340,0 Z" />
        </svg>
      </div>
    </div>
  );
}
