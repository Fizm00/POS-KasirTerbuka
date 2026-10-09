export function PinLockMockup() {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Cancel", "0", "Clear"];

  return (
    <div className="border border-[#E6E3DA] rounded-[2px] bg-white p-5 font-sans text-xs select-none max-w-sm mx-auto">
      <div className="text-center pb-3">
        <div className="font-semibold text-sm text-[#1A1A18]">Kasir Terbuka</div>
        <div className="text-[11px] text-[#5F5E58] mt-0.5">Enter PIN to unlock register</div>
      </div>

      {/* Cashier selection chip */}
      <div className="my-2 p-2 bg-[#FBFAF7] border border-[#E6E3DA] rounded flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#1F6F5C] text-white flex items-center justify-center font-bold text-[10px]">
            A
          </div>
          <span className="font-medium text-[#1A1A18]">Ani (Cashier)</span>
        </div>
        <span className="text-[#5F5E58] text-[10px]">Switch cashier</span>
      </div>

      {/* PIN dots display */}
      <div className="flex justify-center gap-3 my-4">
        <div className="w-3 h-3 rounded-full bg-[#1A1A18]" />
        <div className="w-3 h-3 rounded-full bg-[#1A1A18]" />
        <div className="w-3 h-3 rounded-full bg-[#E6E3DA]" />
        <div className="w-3 h-3 rounded-full bg-[#E6E3DA]" />
      </div>

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-1.5 pt-2">
        {digits.map((d) => (
          <div
            key={d}
            className={`h-9 flex items-center justify-center rounded border border-[#E6E3DA] font-medium text-xs ${
              d === "Cancel" || d === "Clear"
                ? "bg-[#FBFAF7] text-[#5F5E58] text-[11px]"
                : "bg-white text-[#1A1A18]"
            }`}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}
