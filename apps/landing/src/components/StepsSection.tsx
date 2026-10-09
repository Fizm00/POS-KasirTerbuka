export function StepsSection() {
  const steps = [
    {
      number: "01",
      title: "Download or install",
      desc: "Get the app for your computer or install directly from your web browser.",
    },
    {
      number: "02",
      title: "Set up store & admin PIN",
      desc: "Configure your store name and secure access with your initial administrator PIN.",
    },
    {
      number: "03",
      title: "Start selling",
      desc: "Start recording sales transactions, tracking inventory, and printing customer receipts.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="bg-[#FBFAF7] text-[#1A1A18] py-24 md:py-32 border-t border-[#E6E3DA]"
    >
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <h2 className="font-serif-display font-normal text-3xl sm:text-4xl lg:text-[44px] text-[#1A1A18] leading-[1.12] mb-14">
          Get started in three steps.
        </h2>

        {/* Three columns separated by vertical hairlines */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E6E3DA]">
          {steps.map((s, idx) => (
            <div
              key={s.number}
              className={`py-8 md:py-0 ${
                idx === 0 ? "md:pr-10" : idx === 1 ? "md:px-10" : "md:pl-10"
              }`}
            >
              {/* Small step number in serif */}
              <div className="font-serif-display text-2xl text-[#1A1A18] mb-3">{s.number}</div>
              <h3 className="font-medium text-lg text-[#1A1A18] mb-2">{s.title}</h3>
              <p className="text-[#5F5E58] text-sm sm:text-base leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
