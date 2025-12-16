import Link from 'next/link';

export function SparloHero() {
  return (
    <section className="dark:bg-background flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#FAFAFA]">
      <div className="max-w-[720px] px-8 text-center">
        {/* Headline */}
        <h1 className="animate-headline-reveal text-[40px] leading-[1.1] font-semibold tracking-[-0.03em] text-[#1A1A1A] opacity-0 sm:text-[56px] md:text-[72px] lg:text-[80px] dark:text-white">
          Innovation AI for Engineers
        </h1>

        {/* Subhead */}
        <p className="animate-subhead-reveal dark:text-muted-foreground mx-auto mt-8 max-w-[600px] text-[17px] leading-[1.6] text-[#666666] opacity-0 md:text-[20px]">
          An advanced reasoning model that applies first principles thinking and
          cross-domain innovation methodology to your engineering challenge.
          Innovative solutions in 15 minutes.
        </p>

        {/* CTA Button */}
        <div className="animate-cta-reveal mt-12 opacity-0">
          <Link
            href="/auth/sign-up"
            className="inline-block cursor-pointer rounded-[10px] bg-[#7C3AED] px-9 py-[18px] text-[16px] font-medium text-white shadow-[0_4px_24px_rgba(124,58,237,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6D28D9] hover:shadow-[0_8px_32px_rgba(124,58,237,0.45)] active:translate-y-0 active:shadow-[0_2px_16px_rgba(124,58,237,0.3)]"
          >
            Get your free report
          </Link>
        </div>

        {/* Micro-copy */}
        <p className="animate-micro-fade mt-4 text-[14px] text-[#AAAAAA] opacity-0">
          No credit card required
        </p>

        {/* Optional secondary link */}
        <Link
          href="/home"
          className="animate-secondary-fade mt-3 inline-block cursor-pointer text-[14px] text-[#888888] opacity-0 transition-colors hover:text-[#7C3AED]"
        >
          See example report &rarr;
        </Link>
      </div>
    </section>
  );
}
