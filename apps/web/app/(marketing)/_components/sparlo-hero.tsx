import Link from 'next/link';

export function SparloHero() {
  return (
    <section className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[--surface-base]">
      <div className="max-w-[720px] px-8 text-center">
        {/* Headline */}
        <h1 className="animate-headline-reveal text-[40px] leading-[1.1] font-semibold tracking-[-0.03em] text-[--text-primary] opacity-0 sm:text-[56px] md:text-[72px] lg:text-[80px]">
          Engineering Intelligence Model
        </h1>

        {/* Subhead */}
        <p className="animate-subhead-reveal mx-auto mt-8 max-w-[600px] text-[17px] leading-[1.6] text-[--text-secondary] opacity-0 md:text-[20px]">
          Advanced reasoning AI utilizing a systematic innovation methodology to
          solve technical challenges.
        </p>

        {/* CTA Button */}
        <div className="animate-cta-reveal mt-12 opacity-0">
          <Link
            href="/auth/sign-up"
            className="inline-block cursor-pointer rounded-[10px] bg-[--accent] px-9 py-[18px] text-[16px] font-medium text-white shadow-[--shadow-accent] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[--accent-hover] hover:shadow-[0_8px_32px_rgba(124,58,237,0.45)] active:translate-y-0 active:shadow-[0_2px_16px_rgba(124,58,237,0.3)]"
          >
            Try It
          </Link>
        </div>

        {/* Micro-copy */}
        <p className="animate-micro-fade mt-4 text-[14px] text-[--text-muted] opacity-0">
          First Report Free
        </p>

        {/* Optional secondary link */}
        <p className="animate-secondary-fade mt-3 text-[14px] text-[--text-muted] opacity-0">
          Innovative Solutions in 15 Minutes &rarr;
        </p>
      </div>
    </section>
  );
}
