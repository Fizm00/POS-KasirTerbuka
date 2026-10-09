export function CashierMockup() {
  return (
    <div className="border border-[#E6E3DA] rounded-[2px] bg-white p-4 font-sans text-xs select-none">
      {/* Top search bar & status */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E6E3DA] gap-2">
        <div className="h-7 px-3 bg-[#FBFAF7] border border-[#E6E3DA] rounded text-[#5F5E58] flex items-center flex-1">
          Cari produk atau scan barcode... (F2)
        </div>
        <div className="h-7 px-2.5 bg-[#FBFAF7] border border-[#E6E3DA] rounded text-[#1F6F5C] font-medium flex items-center">
          Kasir: Ani
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 pt-3">
        {/* Left: Product tiles (7 cols) */}
        <div className="col-span-7 grid grid-cols-2 gap-2">
          <div className="p-2.5 border border-[#E6E3DA] rounded-[2px] bg-[#FBFAF7]">
            <div className="font-semibold text-[#1A1A18]">Kopi Susu Aren</div>
            <div className="text-[11px] text-[#5F5E58] mt-0.5">Minuman</div>
            <div className="font-medium text-[#1F6F5C] mt-2">Rp 15.000</div>
          </div>
          <div className="p-2.5 border border-[#E6E3DA] rounded-[2px] bg-[#FBFAF7]">
            <div className="font-semibold text-[#1A1A18]">Nasi Goreng</div>
            <div className="text-[11px] text-[#5F5E58] mt-0.5">Makanan</div>
            <div className="font-medium text-[#1F6F5C] mt-2">Rp 22.000</div>
          </div>
          <div className="p-2.5 border border-[#E6E3DA] rounded-[2px] bg-[#FBFAF7]">
            <div className="font-semibold text-[#1A1A18]">Teh Botol Sosro</div>
            <div className="text-[11px] text-[#5F5E58] mt-0.5">Minuman</div>
            <div className="font-medium text-[#1F6F5C] mt-2">Rp 6.000</div>
          </div>
          <div className="p-2.5 border border-[#E6E3DA] rounded-[2px] bg-[#FBFAF7]">
            <div className="font-semibold text-[#1A1A18]">Roti Bakar</div>
            <div className="text-[11px] text-[#5F5E58] mt-0.5">Makanan</div>
            <div className="font-medium text-[#1F6F5C] mt-2">Rp 18.000</div>
          </div>
        </div>

        {/* Right: Cart (5 cols) */}
        <div className="col-span-5 border-l border-[#E6E3DA] pl-3 flex flex-col justify-between">
          <div>
            <div className="font-semibold text-[#1A1A18] pb-1.5 border-b border-[#E6E3DA]">
              Keranjang (3)
            </div>
            <div className="space-y-1.5 pt-2 text-[11px]">
              <div className="flex justify-between">
                <span>2x Kopi Susu Aren</span>
                <span className="font-medium">30.000</span>
              </div>
              <div className="flex justify-between">
                <span>1x Nasi Goreng</span>
                <span className="font-medium">22.000</span>
              </div>
              <div className="flex justify-between">
                <span>1x Teh Botol Sosro</span>
                <span className="font-medium">6.000</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E6E3DA] mt-3">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[#5F5E58]">Total</span>
              <span className="font-bold text-sm text-[#1A1A18]">Rp 58.000</span>
            </div>
            <div className="h-8 bg-[#1F6F5C] text-white font-medium rounded flex items-center justify-center text-[11px]">
              Bayar (F9)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
