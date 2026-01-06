'use client';

import { memo, useRef } from 'react';

import { type MotionValue, motion, useScroll, useTransform } from 'framer-motion';

import { usePrefersReducedMotion } from '@kit/ui/hooks';

// ============================================================================
// CONTENT CONFIGURATION
// ============================================================================

const CONTENT = {
  problem: `Electrochemical ocean alkalinity enhancement produces NaOH at sea to absorb atmospheric CO₂. But marine electrolysis faces severe corrosion, biofouling, and membrane fouling. Need electrolyzer architecture that survives 5+ years in marine environment at <$80/ton CO₂ equivalent alkalinity cost.`,
  reframe: `Instead of asking "how do we make components survive 5 years in seawater," we asked "how do we make replacement so cheap that survival doesn't matter."`,
  stats: '3,310 patents  ·  8 domains  ·  47 papers',
  domains: ['Desalination', 'Geothermal', 'Marine Biology', 'Aerospace'],
  output: '12 concepts → 6 solutions',
  report: '20-page report  ·  14 citations  ·  3 validation protocols',
};

const FRAGMENTS = [
  { text: 'US9,073,003', x: 15, y: 10, start: 0.48, end: 0.54 },
  { text: 'Mikhaylin 2016', x: 55, y: 40, start: 0.49, end: 0.55 },
  { text: '[Desalination]', x: 8, y: 65, start: 0.5, end: 0.56 },
  { text: 'ΔG = -237 kJ/mol', x: 50, y: 20, start: 0.51, end: 0.57 },
  { text: 'polarity reversal', x: 20, y: 50, start: 0.52, end: 0.58 },
  { text: 'Kuang et al.', x: 60, y: 75, start: 0.53, end: 0.59 },
  { text: 'US10,892,401', x: 12, y: 35, start: 0.54, end: 0.6 },
  { text: 'Cl⁻ < 5%', x: 58, y: 55, start: 0.55, end: 0.61 },
  { text: 'E_cell = E° + η', x: 25, y: 80, start: 0.56, end: 0.62 },
  { text: '[Geothermal]', x: 48, y: 8, start: 0.57, end: 0.63 },
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function Divider({ scaleX }: { scaleX: MotionValue<number> }) {
  return (
    <div className="my-12 flex justify-center">
      <motion.div
        className="h-px w-20 origin-left bg-white/15"
        style={{ scaleX }}
      />
    </div>
  );
}

function Fragment({
  text,
  x,
  y,
  start,
  end,
  scrollYProgress,
}: {
  text: string;
  x: number;
  y: number;
  start: number;
  end: number;
  scrollYProgress: MotionValue<number>;
}) {
  const opacity = useTransform(
    scrollYProgress,
    [start, start + 0.015, end - 0.015, end],
    [0, 0.7, 0.7, 0],
  );

  const blur = useTransform(scrollYProgress, [end - 0.015, end], [0, 2]);

  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  return (
    <motion.span
      className="pointer-events-none absolute whitespace-nowrap font-mono text-[13px] text-white"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        opacity,
        filter,
      }}
    >
      {text}
    </motion.span>
  );
}

function FragmentFlicker({
  scrollYProgress,
  containerOpacity,
}: {
  scrollYProgress: MotionValue<number>;
  containerOpacity: MotionValue<number>;
}) {
  return (
    <motion.div
      className="relative mx-auto my-8 h-[80px] w-[220px] sm:h-[100px] sm:w-[280px]"
      style={{ opacity: containerOpacity }}
    >
      {FRAGMENTS.map((frag, i) => (
        <Fragment key={i} {...frag} scrollYProgress={scrollYProgress} />
      ))}
    </motion.div>
  );
}

function StaticContent() {
  return (
    <section
      aria-label="Analysis Process"
      className="bg-[#09090B] px-4 py-24 md:px-6"
    >
      <h2 className="sr-only">How Sparlo Analyzes Your Problem</h2>
      <div className="mx-auto max-w-[680px] text-center">
        <p className="text-base leading-relaxed text-[#FAFAFA] md:text-lg">
          {CONTENT.problem}
        </p>
        <div className="my-12 flex justify-center">
          <div className="h-px w-20 bg-white/15" />
        </div>
        <p className="mx-auto max-w-[600px] text-base leading-relaxed">
          <span className="text-[#A1A1AA]">↳ Reframed: </span>
          <span className="text-[#FAFAFA]">{CONTENT.reframe}</span>
        </p>
        <div className="my-12 flex justify-center">
          <div className="h-px w-20 bg-white/15" />
        </div>
        <p className="mb-6 text-sm text-[#A1A1AA]">{CONTENT.stats}</p>
        <div className="mb-6 flex flex-col justify-center gap-2 sm:flex-row sm:gap-6">
          {CONTENT.domains.map((domain) => (
            <span
              key={domain}
              className="font-mono text-[12px] text-[#A1A1AA] sm:text-[13px]"
            >
              {domain}
            </span>
          ))}
        </div>
        <p className="mb-12 text-[15px] font-medium text-[#FAFAFA]">
          {CONTENT.output}
        </p>
        <div className="my-12 flex justify-center">
          <div className="h-px w-20 bg-white/15" />
        </div>
        <p className="text-sm text-[#A1A1AA]">{CONTENT.report}</p>
      </div>
    </section>
  );
}

// ============================================================================
// ANIMATED CONTENT
// ============================================================================

function AnimatedContent({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  // Divider animations
  const divider1Scale = useTransform(scrollYProgress, [0.15, 0.2], [0, 1]);
  const divider2Scale = useTransform(scrollYProgress, [0.42, 0.46], [0, 1]);
  const divider3Scale = useTransform(scrollYProgress, [0.8, 0.84], [0, 1]);

  // Reframe animation
  const reframeOpacity = useTransform(scrollYProgress, [0.2, 0.28], [0, 1]);
  const reframeY = useTransform(scrollYProgress, [0.2, 0.28], [8, 0]);

  // Analyzing label
  const analyzingOpacity = useTransform(scrollYProgress, [0.46, 0.5], [0, 1]);

  // Fragment container
  const fragmentContainerOpacity = useTransform(
    scrollYProgress,
    [0.46, 0.48, 0.62, 0.65],
    [0, 1, 1, 0],
  );

  // Stats
  const statsOpacity = useTransform(scrollYProgress, [0.64, 0.68], [0, 1]);
  const statsY = useTransform(scrollYProgress, [0.64, 0.68], [8, 0]);

  // Domain tags (staggered)
  const domain1Opacity = useTransform(scrollYProgress, [0.68, 0.71], [0, 1]);
  const domain2Opacity = useTransform(scrollYProgress, [0.7, 0.73], [0, 1]);
  const domain3Opacity = useTransform(scrollYProgress, [0.72, 0.75], [0, 1]);
  const domain4Opacity = useTransform(scrollYProgress, [0.74, 0.77], [0, 1]);
  const domainOpacities = [
    domain1Opacity,
    domain2Opacity,
    domain3Opacity,
    domain4Opacity,
  ];

  // Output
  const outputOpacity = useTransform(scrollYProgress, [0.76, 0.8], [0, 1]);
  const outputY = useTransform(scrollYProgress, [0.76, 0.8], [8, 0]);

  // Report
  const reportOpacity = useTransform(scrollYProgress, [0.84, 0.92], [0, 1]);
  const reportY = useTransform(scrollYProgress, [0.84, 0.92], [8, 0]);

  // Section fade
  const sectionOpacity = useTransform(scrollYProgress, [0.92, 1.0], [1, 0.5]);

  return (
    <motion.div
      className="w-full max-w-[680px] text-center"
      style={{ opacity: sectionOpacity }}
    >
      {/* Problem */}
      <p className="text-base leading-relaxed text-[#FAFAFA] md:text-lg">
        {CONTENT.problem}
      </p>

      {/* Divider 1 */}
      <Divider scaleX={divider1Scale} />

      {/* Reframe */}
      <motion.p
        className="mx-auto max-w-[600px] text-base leading-relaxed"
        style={{ opacity: reframeOpacity, y: reframeY }}
      >
        <span className="text-[#A1A1AA]">↳ Reframed: </span>
        <span className="text-[#FAFAFA]">{CONTENT.reframe}</span>
      </motion.p>

      {/* Divider 2 */}
      <Divider scaleX={divider2Scale} />

      {/* Analyzing Label */}
      <motion.p
        className="mb-2 text-sm tracking-wide text-[#A1A1AA]"
        style={{ opacity: analyzingOpacity }}
      >
        Analyzing
      </motion.p>

      {/* Fragment Flicker */}
      <FragmentFlicker
        scrollYProgress={scrollYProgress}
        containerOpacity={fragmentContainerOpacity}
      />

      {/* Stats */}
      <motion.p
        className="mb-6 text-sm text-[#A1A1AA]"
        style={{ opacity: statsOpacity, y: statsY }}
      >
        {CONTENT.stats}
      </motion.p>

      {/* Domain Tags */}
      <div className="mb-6 flex flex-col justify-center gap-2 sm:flex-row sm:gap-6">
        {CONTENT.domains.map((domain, i) => (
          <motion.span
            key={domain}
            className="font-mono text-[12px] text-[#A1A1AA] sm:text-[13px]"
            style={{ opacity: domainOpacities[i] }}
          >
            {domain}
          </motion.span>
        ))}
      </div>

      {/* Output */}
      <motion.p
        className="mb-12 text-[15px] font-medium text-[#FAFAFA]"
        style={{ opacity: outputOpacity, y: outputY }}
      >
        {CONTENT.output}
      </motion.p>

      {/* Divider 3 */}
      <Divider scaleX={divider3Scale} />

      {/* Report */}
      <motion.p
        className="text-sm text-[#A1A1AA]"
        style={{ opacity: reportOpacity, y: reportY }}
      >
        {CONTENT.report}
      </motion.p>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ProcessAnimation = memo(function ProcessAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // If reduced motion, render static version
  if (prefersReducedMotion) {
    return <StaticContent />;
  }

  return (
    <section
      ref={containerRef}
      aria-label="Analysis Process"
      className="relative h-[200vh] bg-[#09090B]"
    >
      <h2 className="sr-only">How Sparlo Analyzes Your Problem</h2>
      <a
        href="#after-process-animation"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip animation section
      </a>
      <div className="sticky top-0 flex h-screen items-center justify-center px-4 md:px-6">
        <AnimatedContent scrollYProgress={scrollYProgress} />
      </div>
      <div id="after-process-animation" />
    </section>
  );
});
