export function LocalFirstSection() {
  return (
    <section className="bg-[#FBFAF7] text-[#1A1A18] py-24 md:py-32 border-t border-[#E6E3DA]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: Headline & Paragraph */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="font-serif-display font-normal text-3xl sm:text-4xl lg:text-[44px] text-[#1A1A18] leading-[1.12]">
              Your data stays on your device.
            </h2>
            <p className="text-[#5F5E58] text-base sm:text-lg leading-relaxed max-w-[500px]">
              The app never sends your sales records to any remote server. Even without internet,
              your cash register keeps working. Because data lives only on your device, back up
              regularly.
            </p>
          </div>

          {/* Right: Simple Two-Color Line Diagram (Deep Green & Stone) */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="w-full max-w-[460px] p-6 sm:p-8 bg-white border border-[#E6E3DA] rounded-[2px] flex items-center justify-between gap-6 select-none">
              {/* Device with Database Inside */}
              <div className="flex flex-col items-center">
                <svg
                  width="120"
                  height="150"
                  viewBox="0 0 120 150"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-[#0E2B25]"
                  aria-label="Diagram of store device with local database inside connecting to a backup file"
                  role="img"
                >
                  {/* Device frame */}
                  <rect
                    x="2"
                    y="2"
                    width="116"
                    height="146"
                    rx="4"
                    strokeWidth="1.5"
                    fill="#FBFAF7"
                  />
                  {/* Device screen area */}
                  <rect
                    x="10"
                    y="12"
                    width="100"
                    height="116"
                    rx="2"
                    stroke="#E6E3DA"
                    strokeWidth="1"
                    fill="white"
                  />
                  {/* Home indicator bar */}
                  <line x1="48" y1="138" x2="72" y2="138" strokeWidth="1.5" strokeLinecap="round" />

                  {/* Database Cylinder inside device */}
                  <g transform="translate(35, 42)">
                    {/* Top ellipse */}
                    <ellipse cx="25" cy="10" rx="22" ry="7" strokeWidth="1.5" fill="#FBFAF7" />
                    {/* Upper tier */}
                    <path
                      d="M3 10 v15 c0 3.86 9.85 7 22 7 s22 -3.14 22 -7 v-15"
                      strokeWidth="1.5"
                    />
                    {/* Middle tier */}
                    <path
                      d="M3 25 v15 c0 3.86 9.85 7 22 7 s22 -3.14 22 -7 v-15"
                      strokeWidth="1.5"
                    />
                    {/* Bottom tier */}
                    <path
                      d="M3 40 v15 c0 3.86 9.85 7 22 7 s22 -3.14 22 -7 v-15"
                      strokeWidth="1.5"
                    />
                  </g>
                </svg>
                <span className="text-xs font-medium text-[#1A1A18] mt-3">Store Device</span>
              </div>

              {/* Dashed line pointing to backup file */}
              <div className="flex-1 flex flex-col items-center px-2">
                <svg
                  width="100%"
                  height="24"
                  viewBox="0 0 80 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                >
                  <line
                    x1="0"
                    y1="12"
                    x2="70"
                    y2="12"
                    stroke="#0E2B25"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M66 8 L74 12 L66 16"
                    stroke="#0E2B25"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Backup File Box */}
              <div className="flex flex-col items-center">
                <div className="w-[100px] h-[120px] border border-[#0E2B25] bg-[#FBFAF7] rounded-[2px] p-3 flex flex-col justify-between">
                  {/* File fold corner icon */}
                  <div className="flex justify-end">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      className="stroke-[#0E2B25]"
                    >
                      <path d="M0 0 L10 0 L18 8 L18 18 L0 18 Z" strokeWidth="1" fill="none" />
                      <path d="M10 0 L10 8 L18 8" strokeWidth="1" />
                    </svg>
                  </div>
                  <div className="text-center pb-2">
                    <div className="text-[11px] font-semibold text-[#1A1A18] leading-tight">
                      Backup
                    </div>
                    <div className="text-[10px] text-[#5F5E58] mt-0.5">(file)</div>
                  </div>
                </div>
                <span className="text-xs text-[#5F5E58] mt-3">Standalone JSON File</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
