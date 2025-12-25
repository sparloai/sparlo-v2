import Link from 'next/link';

import { ArrowDown, ArrowRight } from 'lucide-react';

const sectors = [
  { id: '01', name: 'Climate Tech' },
  { id: '02', name: 'Energy' },
  { id: '03', name: 'Biotech' },
  { id: '04', name: 'Waste' },
  { id: '05', name: 'Materials Science' },
  { id: '06', name: 'Food Tech' },
];

export function SparloHero() {
  return (
    <>
      {/* Technical Grid Background */}
      <div className="technical-grid-bg" aria-hidden="true" />

      {/* Decorative Corner Marks */}
      <div
        className="pointer-events-none fixed top-0 left-0 z-50 m-4 hidden h-3 w-3 border-t border-l border-zinc-300 transition-colors md:block dark:border-zinc-700"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed top-0 right-0 z-50 m-4 hidden h-3 w-3 border-t border-r border-zinc-300 transition-colors md:block dark:border-zinc-700"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 z-50 m-4 hidden h-3 w-3 border-b border-l border-zinc-300 transition-colors md:block dark:border-zinc-700"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed right-0 bottom-0 z-50 m-4 hidden h-3 w-3 border-r border-b border-zinc-300 transition-colors md:block dark:border-zinc-700"
        aria-hidden="true"
      />

      {/* Main Content */}
      <main className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-grow flex-col justify-center px-6 pt-8 pb-24 md:px-8 md:pb-2">
        <div className="grid grid-cols-1 gap-y-16 md:grid-cols-12 md:gap-16">
          {/* Main Column */}
          <div className="animate-headline-reveal flex flex-col gap-10 md:col-span-7">
            <div className="space-y-6">
              {/* Intelligence Badge */}
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white/50 px-3 py-1.5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="animate-blink bg-primary h-1.5 w-1.5 rounded-full" />
                <span className="font-mono text-[10px] font-medium tracking-wider text-zinc-600 uppercase dark:text-zinc-400">
                  Intelligence Model v2
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl leading-[0.9] font-normal tracking-tighter text-zinc-900 md:text-7xl lg:text-8xl dark:text-white">
                AI-Powered <br className="hidden md:block" /> Innovation Engine
              </h1>
            </div>

            {/* Description & CTA */}
            <div className="animate-subhead-reveal max-w-xl space-y-10 border-l border-zinc-200 pl-8 dark:border-zinc-800">
              <p className="text-lg leading-relaxed font-light text-zinc-600 md:text-xl dark:text-zinc-400">
                An intelligence model that produces innovative solutions to
                complex industry challenges.
              </p>

              <div className="animate-cta-reveal flex flex-col items-start gap-4">
                <Link
                  href="/auth/sign-up"
                  className="group bg-primary hover:bg-primary/90 focus-visible:ring-primary flex items-center justify-center gap-3 rounded-sm py-3.5 pr-6 pl-8 text-[15px] font-medium text-white shadow-[0_4px_20px_-4px_rgba(124,58,237,0.3)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_12px_35px_-4px_rgba(124,58,237,0.5)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]"
                >
                  <span className="tracking-tight">Run Your Free Analysis</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <span className="ml-1 text-sm font-medium tracking-tight text-zinc-600 dark:text-zinc-400">
                  No credit card required
                </span>
              </div>
            </div>
          </div>

          {/* Sectors Column */}
          <div className="animate-subhead-reveal flex h-full flex-col justify-start md:col-span-5 md:pt-16 md:pl-8 lg:pl-16">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <span className="font-mono text-[10px] tracking-wider text-zinc-400 uppercase dark:text-zinc-600">
                  Target Sectors
                </span>
                <div className="h-px flex-grow bg-zinc-200 dark:bg-zinc-800" />
              </div>

              <div className="space-y-5 text-lg font-normal md:text-xl">
                {sectors.map((sector) => (
                  <div
                    key={sector.id}
                    className="group flex cursor-default items-center gap-6 rounded-md py-1 transition-all duration-200 hover:bg-violet-500/5 hover:pl-2 dark:hover:bg-violet-500/10"
                  >
                    <span className="font-mono text-xs text-zinc-300 transition-colors duration-200 group-hover:text-violet-500 dark:text-zinc-700 dark:group-hover:text-violet-400">
                      {sector.id}
                    </span>
                    <span className="text-zinc-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-white">
                      {sector.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Scroll Indicator */}
      <div className="animate-micro-fade z-10 mt-12 flex w-full flex-col items-center justify-center gap-6 pb-12">
        <a
          href="#description"
          className="group flex cursor-pointer flex-col items-center gap-3 opacity-60 transition-all duration-300 hover:opacity-100"
        >
          <span className="group-hover:text-primary font-mono text-[10px] tracking-widest text-zinc-500 uppercase transition-colors dark:text-zinc-400">
            View Example Reports
          </span>
          <div className="group-hover:border-primary/30 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white transition-all group-hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] dark:border-zinc-800 dark:bg-zinc-900">
            <ArrowDown className="animate-bounce-subtle group-hover:text-primary h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          </div>
        </a>
      </div>

      {/* Report Titles Showcase */}
      <section className="animate-secondary-fade z-10 mx-auto w-full max-w-[1200px] px-6 pt-16 pb-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center gap-4">
            <span className="font-mono text-[10px] tracking-wider text-zinc-400 uppercase dark:text-zinc-600">
              Recent Reports
            </span>
            <div className="h-px flex-grow bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="space-y-4">
            {[
              'CAR-T Manufacturing Cost Reduction: From $300K to $30K Through Integration, Not Invention',
              'On-Site Food Waste Processing: Mechanical-First Architecture for 80% Energy Reduction',
              'Breaking the Cold Chain Assumption: Multi-Mechanism Preservation for Smallholder Farmers',
            ].map((title, i) => (
              <div
                key={i}
                className="group flex cursor-default items-start gap-4 rounded-lg border border-zinc-100 bg-white/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-[0_4px_12px_rgba(139,92,246,0.08)] dark:border-zinc-800/50 dark:bg-zinc-900/30 dark:hover:border-violet-500/30 dark:hover:bg-zinc-900/60 dark:hover:shadow-[0_4px_12px_rgba(139,92,246,0.15)]"
              >
                <div className="bg-primary/10 text-primary mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-mono text-xs transition-all duration-200 group-hover:bg-primary/20 group-hover:scale-110">
                  {i + 1}
                </div>
                <p className="text-base leading-snug font-medium text-zinc-700 transition-colors duration-200 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-white">
                  {title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section
        id="description"
        className="animate-secondary-fade z-10 mx-auto w-full max-w-[1200px] px-6 pt-12 pb-12"
      >
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl leading-[1.15] font-normal tracking-tight text-zinc-900 md:text-4xl lg:text-5xl dark:text-white">
            Sparlo uses a systematic methodology of innovation to generate
            solutions to complex technical problems.{' '}
            <span className="text-zinc-400 dark:text-zinc-500/80">
              Grounded in first-principles thinking, cross-domain ideation, and
              constraint-aware commercial viability.
            </span>
          </h2>
        </div>
        <div
          className="mx-auto mt-16 h-px w-full max-w-xs bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800"
          aria-hidden="true"
        />
      </section>
    </>
  );
}
