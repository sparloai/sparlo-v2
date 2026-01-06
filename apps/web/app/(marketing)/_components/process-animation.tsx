'use client';

import { memo, useRef } from 'react';

import {
  type MotionValue,
  motion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { usePrefersReducedMotion } from '@kit/ui/hooks';

// ============================================================================
// CONTENT - FOCUSED ON THE INSIGHT, NOT THE PROCESS
// ============================================================================

const CONTENT = {
  // The problem (keep it short - users scan)
  problem: `Marine electrolyzers face severe corrosion and biofouling. Need architecture that survives 5+ years in seawater at <$80/ton CO₂.`,

  // THE HOOK - this is the magic moment
  reframe: `Instead of asking "how do we survive 5 years in seawater," we asked "how do we make replacement so cheap that survival doesn't matter."`,

  // THE DISCOVERY - one powerful insight, not six domain names
  sourceIndustry: 'Desalination',
  discoveryInsight: `The desalination industry solved fouling 30 years ago with polarity reversal—switching current direction every 15 minutes dissolves scale before it forms.`,

  // THE ANSWER - concrete and confident
  solution: 'Polarity-switching electrolyzer architecture',
  confidence: 'High confidence',
  validationNote: 'Validated against 14 peer-reviewed sources',
};

// ============================================================================
// BEAT 1: THE PROBLEM (0-25% scroll)
// Clean, minimal - user sees "this is a hard problem"
// ============================================================================

function Beat1Problem({
  scrollYProgress,
  opacity,
}: {
  scrollYProgress: MotionValue<number>;
  opacity: MotionValue<number>;
}) {
  const buttonScale = useTransform(
    scrollYProgress,
    [0.18, 0.22, 0.25],
    [1, 0.96, 1],
  );

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center px-6"
      style={{ opacity }}
    >
      <div className="max-w-lg text-center">
        <p className="mb-6 text-[15px] leading-relaxed text-gray-600">
          {CONTENT.problem}
        </p>
        <motion.button
          className="rounded-full bg-gray-900 px-5 py-2.5 text-[14px] font-medium text-white"
          style={{ scale: buttonScale }}
        >
          Run Analysis
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// BEAT 2: THE INSIGHT (25-70% scroll)
// This is THE moment. The reframe + the discovery.
// ============================================================================

function Beat2Insight({
  scrollYProgress,
  opacity,
}: {
  scrollYProgress: MotionValue<number>;
  opacity: MotionValue<number>;
}) {
  // Reframe appears first (25-45%)
  const reframeOpacity = useTransform(
    scrollYProgress,
    [0.25, 0.30, 0.42, 0.48],
    [0, 1, 1, 0],
  );

  // Discovery appears after (45-70%)
  const discoveryOpacity = useTransform(
    scrollYProgress,
    [0.42, 0.50, 0.65, 0.72],
    [0, 1, 1, 0],
  );

  // Connection line animation
  const lineWidth = useTransform(
    scrollYProgress,
    [0.50, 0.58],
    ['0%', '100%'],
  );

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center px-6"
      style={{ opacity }}
    >
      <div className="max-w-xl">
        {/* THE REFRAME - the hook, the thesis */}
        <motion.div
          className="mb-16 text-center"
          style={{ opacity: reframeOpacity }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-gray-400">
            Reframing the problem
          </p>
          <p className="mt-4 text-[22px] font-medium leading-relaxed text-gray-900 sm:text-[26px]">
            {CONTENT.reframe}
          </p>
        </motion.div>

        {/* THE DISCOVERY - one powerful connection */}
        <motion.div style={{ opacity: discoveryOpacity }}>
          {/* Connection visualization */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <span className="rounded-full bg-blue-50 px-4 py-2 text-[14px] font-medium text-blue-700">
              {CONTENT.sourceIndustry}
            </span>
            <div className="relative h-px w-16 bg-gray-200">
              <motion.div
                className="absolute left-0 top-0 h-full bg-gray-400"
                style={{ width: lineWidth }}
              />
            </div>
            <span className="rounded-full bg-gray-100 px-4 py-2 text-[14px] font-medium text-gray-700">
              Your Problem
            </span>
          </div>

          {/* The insight */}
          <p className="text-center text-[17px] leading-relaxed text-gray-600">
            {CONTENT.discoveryInsight}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// BEAT 3: THE ANSWER (70-95% scroll)
// Resolution - concrete solution + confidence + CTA
// ============================================================================

function Beat3Answer({ opacity }: { opacity: MotionValue<number> }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center px-6"
      style={{ opacity }}
    >
      <div className="max-w-md text-center">
        {/* The solution */}
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-gray-400">
          Recommended approach
        </p>
        <h3 className="mt-3 text-[24px] font-semibold text-gray-900 sm:text-[28px]">
          {CONTENT.solution}
        </h3>

        {/* Confidence indicator */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[14px] font-medium text-emerald-700">
            {CONTENT.confidence}
          </span>
        </div>

        <p className="mt-3 text-[13px] text-gray-500">
          {CONTENT.validationNote}
        </p>

        {/* CTA */}
        <a
          href="#example-reports"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-gray-800"
        >
          View Full Report
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </a>
      </div>
    </motion.div>
  );
}

// ============================================================================
// STATIC CONTENT (REDUCED MOTION FALLBACK)
// ============================================================================

function StaticContent() {
  return (
    <section
      aria-label="Analysis Process"
      className="bg-white px-4 py-20 md:px-6"
    >
      <h2 className="sr-only">How Sparlo Analyzes Your Problem</h2>
      <div className="mx-auto max-w-xl space-y-16 text-center">
        {/* Problem */}
        <div>
          <p className="text-[15px] leading-relaxed text-gray-600">
            {CONTENT.problem}
          </p>
        </div>

        {/* Reframe */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-gray-400">
            Reframing the problem
          </p>
          <p className="mt-4 text-[22px] font-medium leading-relaxed text-gray-900">
            {CONTENT.reframe}
          </p>
        </div>

        {/* Discovery */}
        <div>
          <div className="mb-6 flex items-center justify-center gap-4">
            <span className="rounded-full bg-blue-50 px-4 py-2 text-[14px] font-medium text-blue-700">
              {CONTENT.sourceIndustry}
            </span>
            <span className="text-gray-300">→</span>
            <span className="rounded-full bg-gray-100 px-4 py-2 text-[14px] font-medium text-gray-700">
              Your Problem
            </span>
          </div>
          <p className="text-[17px] leading-relaxed text-gray-600">
            {CONTENT.discoveryInsight}
          </p>
        </div>

        {/* Answer */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-gray-400">
            Recommended approach
          </p>
          <h3 className="mt-3 text-[24px] font-semibold text-gray-900">
            {CONTENT.solution}
          </h3>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[14px] font-medium text-emerald-700">
              {CONTENT.confidence}
            </span>
          </div>
          <p className="mt-3 text-[13px] text-gray-500">
            {CONTENT.validationNote}
          </p>
          <a
            href="#example-reports"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-[14px] font-medium text-white hover:bg-gray-800"
          >
            View Full Report
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </a>
        </div>
      </div>
    </section>
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

  // THREE BEATS - tight, focused, impactful
  // Beat 1: Problem (0-25%)
  // Beat 2: Insight - reframe + discovery (25-70%)
  // Beat 3: Answer (70-95%)

  const beat1Opacity = useTransform(
    scrollYProgress,
    [0, 0.20, 0.25],
    [1, 1, 0],
  );

  const beat2Opacity = useTransform(
    scrollYProgress,
    [0.20, 0.25, 0.68, 0.72],
    [0, 1, 1, 0],
  );

  const beat3Opacity = useTransform(
    scrollYProgress,
    [0.68, 0.72, 0.95],
    [0, 1, 1],
  );

  if (prefersReducedMotion) {
    return <StaticContent />;
  }

  return (
    <section
      ref={containerRef}
      aria-label="Analysis Process"
      className="relative h-[150vh] bg-white"
    >
      <h2 className="sr-only">How Sparlo Analyzes Your Problem</h2>

      <a
        href="#after-process-animation"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gray-900 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip animation section
      </a>

      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <Beat1Problem
          scrollYProgress={scrollYProgress}
          opacity={beat1Opacity}
        />
        <Beat2Insight
          scrollYProgress={scrollYProgress}
          opacity={beat2Opacity}
        />
        <Beat3Answer opacity={beat3Opacity} />
      </div>

      <div id="after-process-animation" />
    </section>
  );
});
