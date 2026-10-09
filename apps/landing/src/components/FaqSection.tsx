import { useState } from "react";

interface FaqItem {
  q: string;
  a: string;
}

export function FaqSection() {
  const faqs: FaqItem[] = [
    {
      q: "Is it really free?",
      a: "Yes, this app is free forever under the AGPL-3.0 license. There are no monthly subscriptions, no transaction fees, and no locked premium features.",
    },
    {
      q: "Where is my data stored?",
      a: "All store data, product lists, and transaction history are stored directly in your device's local storage (via IndexedDB). Data is never sent to any external server.",
    },
    {
      q: "What if my device breaks or gets lost?",
      a: "Because data exists only on your device and is not saved to an online server, you should make regular backups to a JSON file. This file can be stored on a USB drive or personal cloud storage to restore if your device ever has an issue.",
    },
    {
      q: "Can it be used on multiple devices simultaneously?",
      a: "Not at this time. The app is designed as a standalone system for one cashier device per store. Transaction records do not synchronize wirelessly across multiple devices automatically.",
    },
    {
      q: "Which printers are supported?",
      a: "Standard ESC/POS 58 mm and 80 mm thermal receipt printers via USB or Bluetooth. You can also use your browser's built-in print dialog (browser print).",
    },
    {
      q: "Do I need an internet connection?",
      a: "No. All core cashier functions, inventory calculations, and receipt printing work 100% without an internet connection.",
    },
    {
      q: "How do I back up my data?",
      a: "Go to Settings > Backup Data, then click Export Backup. A JSON file will download to your device, ready to be kept as a safe archive.",
    },
  ];

  // First item expanded by default (index 0)
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section
      id="faq"
      className="bg-[#FBFAF7] text-[#1A1A18] py-24 md:py-32 border-t border-[#E6E3DA]"
    >
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <h2 className="font-serif-display font-normal text-3xl sm:text-4xl lg:text-[44px] text-[#1A1A18] leading-[1.12] mb-12">
          Frequently asked questions
        </h2>

        {/* Accordion with hairline separators */}
        <div className="max-w-[840px] divide-y divide-[#E6E3DA] border-y border-[#E6E3DA]">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={faq.q} className="py-5">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between text-left gap-4 focus:outline-none group"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-base sm:text-lg text-[#1A1A18] group-hover:text-[#1F6F5C] transition-colors">
                    {faq.q}
                  </span>

                  {/* Simple line plus/minus icon */}
                  <span className="text-xl leading-none text-[#5F5E58] font-mono flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-3 text-sm sm:text-base text-[#5F5E58] leading-relaxed pr-8">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
