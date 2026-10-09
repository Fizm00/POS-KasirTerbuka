export function ThermalPrinterSection() {
  const supportData = [
    { platform: "Windows", support: "Supported" },
    { platform: "macOS", support: "Limited" },
    { platform: "Linux", support: "Supported" },
    { platform: "Android", support: "Supported" },
    { platform: "Browser", support: "Limited" },
  ];

  return (
    <section className="bg-[#FBFAF7] text-[#1A1A18] py-24 md:py-32 border-t border-[#E6E3DA]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Headline & Paragraph */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="font-serif-display font-normal text-3xl sm:text-4xl lg:text-[44px] text-[#1A1A18] leading-[1.12]">
              Print receipts on thermal printers.
            </h2>
            <p className="text-[#5F5E58] text-base sm:text-lg leading-relaxed max-w-[500px]">
              Supports standard ESC/POS 58 mm and 80 mm thermal receipt printers over USB and
              Bluetooth, depending on your platform. Browser print dialog is available as a reliable
              fallback.
            </p>
          </div>

          {/* Right Column: Plain Hairline Table */}
          <div className="lg:col-span-6">
            <div className="w-full">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#E6E3DA] text-sm text-[#5F5E58]">
                    <th className="py-3 pr-4 font-normal">Platform</th>
                    <th className="py-3 pl-4 font-normal text-right sm:text-left">Support</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E3DA] text-sm">
                  {supportData.map((row) => (
                    <tr key={row.platform}>
                      <td className="py-3.5 pr-4 font-medium text-[#1A1A18]">{row.platform}</td>
                      <td className="py-3.5 pl-4 text-[#5F5E58] text-right sm:text-left">
                        {row.support}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Single line below the table */}
              <p className="mt-6 text-sm text-[#5F5E58]">
                List of verified printer models will be added as tested.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
