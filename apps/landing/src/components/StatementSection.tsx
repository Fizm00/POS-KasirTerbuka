export function StatementSection() {
  return (
    <section className="bg-[#0E2B25] text-[#F1EFE8] py-28 md:py-36">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        {/* 1px brass hairline above */}
        <div className="w-16 border-t border-[#B08A57] mb-10" />

        {/* Large serif sentence, left aligned, max 18 words */}
        <p className="font-serif-display font-light text-3xl sm:text-4xl lg:text-[46px] leading-[1.18] tracking-[-0.015em] text-[#F1EFE8] max-w-[840px]">
          Small shops do not need a monthly subscription just to record sales.
        </p>
      </div>
    </section>
  );
}
