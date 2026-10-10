export function ReportMockup() {
  const bars = [
    { day: "Mon", val: 65 },
    { day: "Tue", val: 80 },
    { day: "Wed", val: 55 },
    { day: "Thu", val: 90 },
    { day: "Fri", val: 120 },
    { day: "Sat", val: 140 },
    { day: "Sun", val: 110 },
  ];

  return (
    <div className="border border-[#E6E3DA] rounded-[2px] bg-white p-4 font-sans text-xs select-none">
      <div className="flex justify-between items-center pb-3 border-b border-[#E6E3DA]">
        <div className="font-semibold text-sm text-[#1A1A18]">Sales Report (Last 7 Days)</div>
        <div className="text-[11px] text-[#5F5E58] border border-[#E6E3DA] rounded px-2 py-0.5">
          Export CSV
        </div>
      </div>

      {/* Four Plain Figures */}
      <div className="grid grid-cols-4 gap-2 py-3 border-b border-[#E6E3DA]">
        <div>
          <div className="text-[10px] text-[#5F5E58]">Gross Sales</div>
          <div className="text-sm font-semibold text-[#1A1A18] tabular-nums mt-0.5">
            Rp 1.450.000
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[#5F5E58]">Gross Profit</div>
          <div className="text-sm font-semibold text-[#1F6F5C] tabular-nums mt-0.5">Rp 620.000</div>
        </div>
        <div>
          <div className="text-[10px] text-[#5F5E58]">Transactions</div>
          <div className="text-sm font-semibold text-[#1A1A18] tabular-nums mt-0.5">38</div>
        </div>
        <div>
          <div className="text-[10px] text-[#5F5E58]">Average Ticket</div>
          <div className="text-sm font-semibold text-[#1A1A18] tabular-nums mt-0.5">Rp 38.150</div>
        </div>
      </div>

      {/* Single Green Bar Chart */}
      <div className="pt-3">
        <div className="text-[11px] font-medium text-[#5F5E58] mb-2">Daily Sales Trend</div>
        <div className="h-28 flex items-end justify-between gap-2 pt-2 px-1">
          {bars.map((b) => (
            <div
              key={b.day}
              className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
            >
              <div
                className="w-full bg-[#1F6F5C] rounded-t-[1px]"
                style={{ height: `${(b.val / 140) * 100}%` }}
              />
              <span className="text-[10px] text-[#5F5E58]">{b.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
