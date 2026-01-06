'use client';

import { memo, useEffect, useRef, useState } from 'react';

import {
  AnimatePresence,
  type MotionValue,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { usePrefersReducedMotion } from '@kit/ui/hooks';

import { DURATION, EASING } from '~/app/_lib/animation-constants';

// ============================================================================
// TYPES
// ============================================================================

interface Domain {
  name: string;
  highlight?: string;
  isConnection?: boolean;
}

interface Concept {
  title: string;
  status: 'active' | 'eliminated';
  isConnected?: boolean;
}

// ============================================================================
// CONTENT CONFIGURATION
// ============================================================================

const CONTENT = {
  problem: {
    text: 'Electrochemical ocean alkalinity enhancement produces NaOH at sea to absorb atmospheric CO2. But marine electrolysis faces severe corrosion, biofouling, and membrane fouling. Need electrolyzer architecture that survives 5+ years in marine environment at <$80/ton CO2 equivalent alkalinity cost.',
  },
  reframe: {
    prefix: 'Reframed:',
    text: 'Instead of asking "how do we make components survive 5 years in seawater," we asked "how do we make replacement so cheap that survival doesn\'t matter."',
  },
  priorArt: {
    patentCount: 3310,
    paperCount: 47,
    citations: [
      'Mikhaylin & Bazinet, 2016',
      'Kuang et al., 2019',
      'US9,073,003',
      'US10,892,401',
    ],
  },
  crossDomain: {
    domains: [
      { name: 'Desalination' },
      { name: 'Geothermal' },
      { name: 'Marine Biology', highlight: 'Antifouling surfaces' },
      {
        name: 'Semiconductor Processing',
        highlight: 'Polarity reversal',
        isConnection: true,
      },
      { name: 'Aerospace' },
      { name: 'Nuclear' },
    ] as Domain[],
    transferCount: 8,
  },
  solutions: {
    concepts: [
      {
        title: 'Polarity Reversal + Modular Cartridge Architecture',
        status: 'active',
        isConnected: true,
      },
      { title: 'Sacrificial Magnesium Anode', status: 'active' },
      { title: 'Downstream Mineral Neutralization', status: 'active' },
      { title: 'Electrode Hardening', status: 'eliminated' },
      { title: 'High-Temp Ceramic Membrane', status: 'eliminated' },
    ] as Concept[],
    totalCount: 12,
    survivingCount: 6,
  },
  report: {
    pageCount: 20,
    citationCount: 14,
    protocolCount: 3,
  },
};

// ============================================================================
// TYPOGRAPHY CLASSES
// ============================================================================

const typography = {
  microLabel:
    'font-mono text-[9px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-400',
  counter:
    'font-mono text-[48px] md:text-[72px] lg:text-[96px] font-bold tabular-nums text-zinc-50',
  problemStatement:
    'font-sans text-[16px] md:text-[18px] font-light leading-[1.7] text-zinc-50 max-w-[680px]',
  reframe:
    'font-sans text-[15px] md:text-[17px] font-medium leading-[1.6] text-blue-400',
  citation: 'font-sans text-[11px] font-normal italic text-zinc-500',
  concept: 'font-mono text-[13px] font-medium text-zinc-50',
  conceptEliminated:
    'line-through decoration-zinc-600 decoration-2 text-zinc-500',
};

// ============================================================================
// VISUAL COMPONENTS
// ============================================================================

function GridBackground() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Layer 1: Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(63,63,70,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Layer 2: Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(9,9,11,0.4) 100%)',
        }}
      />
    </div>
  );
}

function TimelineSpine({ phase }: { phase: number }) {
  return (
    <div className="absolute top-0 bottom-0 left-8 flex flex-col items-center md:left-16">
      {/* Vertical line */}
      <div className="h-full w-[2px] bg-gradient-to-b from-transparent via-blue-500/30 to-transparent" />
      {/* Phase dots */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div
          key={i}
          className={`absolute h-3 w-3 rounded-full transition-all duration-300 ${
            i <= phase
              ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
              : 'bg-zinc-700/30'
          }`}
          style={{ top: `${12.5 + i * 10}%` }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// PATENT COUNTER (Optimized - No Re-renders)
// ============================================================================

function PatentCounter({
  targetValue = 3310,
  scrollYProgress,
}: {
  targetValue?: number;
  scrollYProgress: MotionValue<number>;
}) {
  const counterRef = useRef<HTMLSpanElement>(null);
  const [announced, setAnnounced] = useState(false);

  // Phase 4-5: Counter animation (40-65% scroll)
  const rawCount = useTransform(scrollYProgress, [0.4, 0.65], [0, targetValue]);

  // Update DOM directly without React state (performance optimization)
  useMotionValueEvent(rawCount, 'change', (value) => {
    if (counterRef.current) {
      counterRef.current.textContent = Math.floor(value).toLocaleString();
    }
  });

  // Announce final value to screen readers
  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    if (progress >= 0.65 && !announced) {
      setAnnounced(true);
    }
  });

  return (
    <div className="relative">
      <span
        ref={counterRef}
        className={typography.counter}
        style={{
          filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.4))',
        }}
        aria-hidden="true"
      >
        0
      </span>
      {/* Screen reader announcement */}
      {announced && (
        <span role="status" aria-live="polite" className="sr-only">
          {targetValue.toLocaleString()} patents analyzed
        </span>
      )}
    </div>
  );
}

// ============================================================================
// CONNECTION LINE (CSS Filter, NOT SVG Filter)
// ============================================================================

function ConnectionLine({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const [totalLength, setTotalLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setTotalLength(pathRef.current.getTotalLength());
    }
  }, []);

  // Phase 6: Connection line draws (60-70% scroll)
  const strokeDashoffset = useTransform(
    scrollYProgress,
    [0.6, 0.7],
    [totalLength, 0],
  );

  const pathOpacity = useTransform(
    scrollYProgress,
    [0.6, 0.62, 0.7],
    [0, 1, 1],
  );

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid meet"
    >
      <motion.path
        ref={pathRef}
        d="M 200 300 Q 400 200 600 400"
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray={totalLength}
        strokeLinecap="round"
        style={{
          strokeDashoffset,
          opacity: pathOpacity,
          filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.4))',
        }}
      />
    </svg>
  );
}

// ============================================================================
// PHASE CONTENT SECTIONS
// ============================================================================

function ProblemSection() {
  return (
    <div className="absolute top-1/2 left-1/2 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 px-8">
      <span className={typography.microLabel}>Problem</span>
      <p className={`mt-4 ${typography.problemStatement}`}>
        {CONTENT.problem.text}
      </p>
    </div>
  );
}

function ReframeSection() {
  return (
    <div className="absolute top-1/2 left-1/2 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 px-8">
      <span className={typography.microLabel}>Reframe</span>
      <p className={`mt-4 ${typography.reframe}`}>
        <span className="text-zinc-400">{CONTENT.reframe.prefix}</span>{' '}
        {CONTENT.reframe.text}
      </p>
    </div>
  );
}

function AnalysisTracksSection({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 px-8 md:grid-cols-2">
        {/* Prior Art Track */}
        <div className="space-y-4">
          <span className={typography.microLabel}>Prior Art</span>
          <PatentCounter
            targetValue={CONTENT.priorArt.patentCount}
            scrollYProgress={scrollYProgress}
          />
          <p className={typography.citation}>patents analyzed</p>
          <div className="mt-4 space-y-1">
            {CONTENT.priorArt.citations.map((citation, i) => (
              <motion.p
                key={citation}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.1,
                  duration: DURATION.normal,
                  ease: EASING.easeOut,
                }}
                className={typography.citation}
              >
                {citation}
              </motion.p>
            ))}
          </div>
        </div>

        {/* Cross-Domain Track */}
        <div className="space-y-4">
          <span className={typography.microLabel}>Cross-Domain</span>
          <div className="mt-4 space-y-2">
            {CONTENT.crossDomain.domains.map((domain, i) => (
              <motion.div
                key={domain.name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.08,
                  duration: DURATION.normal,
                  ease: EASING.easeOut,
                }}
                className={`${typography.concept} ${domain.isConnection ? 'text-blue-400' : ''}`}
              >
                {domain.name}
                {domain.highlight && (
                  <span className="ml-2 text-zinc-500">
                    → {domain.highlight}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <ConnectionLine scrollYProgress={scrollYProgress} />
    </div>
  );
}

function SynthesisSection() {
  return (
    <div className="absolute top-1/2 left-1/2 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 px-8">
      <span className={typography.microLabel}>Synthesis</span>
      <p className="mt-4 mb-6 text-zinc-400">
        {CONTENT.solutions.totalCount} concepts →{' '}
        {CONTENT.solutions.survivingCount} surviving
      </p>
      <div className="space-y-3">
        {CONTENT.solutions.concepts.map((concept, i) => (
          <motion.div
            key={concept.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * 0.1,
              duration: DURATION.normal,
              ease: EASING.easeOut,
            }}
            className={
              concept.status === 'eliminated'
                ? typography.conceptEliminated
                : `${typography.concept} ${concept.isConnected ? 'text-blue-400' : ''}`
            }
          >
            {concept.title}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ReportSection() {
  return (
    <div className="absolute top-1/2 left-1/2 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 px-8">
      <span className={typography.microLabel}>Report</span>
      <div className="mt-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: DURATION.slow, ease: EASING.easeOut }}
          className="rounded-lg border border-zinc-700/20 bg-zinc-900/50 p-6"
        >
          <div className="flex items-baseline gap-8">
            <div>
              <span className="text-[48px] font-bold text-zinc-50">
                {CONTENT.report.pageCount}
              </span>
              <span className="ml-2 text-zinc-400">pages</span>
            </div>
            <div>
              <span className="text-[32px] font-bold text-zinc-50">
                {CONTENT.report.citationCount}
              </span>
              <span className="ml-2 text-zinc-400">citations</span>
            </div>
            <div>
              <span className="text-[32px] font-bold text-zinc-50">
                {CONTENT.report.protocolCount}
              </span>
              <span className="ml-2 text-zinc-400">protocols</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// PHASE CONTENT (AnimatePresence for Performance)
// ============================================================================

function PhaseContent({
  phase,
  scrollYProgress,
}: {
  phase: number;
  scrollYProgress: MotionValue<number>;
}) {
  return (
    <div className="absolute inset-0 z-10">
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div
            key="problem"
            className="absolute inset-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: DURATION.normal, ease: EASING.easeOut }}
          >
            <ProblemSection />
          </motion.div>
        )}

        {phase === 1 && (
          <motion.div
            key="reframe"
            className="absolute inset-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: DURATION.normal, ease: EASING.easeOut }}
          >
            <ReframeSection />
          </motion.div>
        )}

        {phase >= 2 && phase <= 5 && (
          <motion.div
            key="tracks"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.normal, ease: EASING.easeOut }}
          >
            <AnalysisTracksSection scrollYProgress={scrollYProgress} />
          </motion.div>
        )}

        {phase === 6 && (
          <motion.div
            key="synthesis"
            className="absolute inset-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: DURATION.normal, ease: EASING.easeOut }}
          >
            <SynthesisSection />
          </motion.div>
        )}

        {phase >= 7 && (
          <motion.div
            key="report"
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: DURATION.slow, ease: EASING.easeOut }}
          >
            <ReportSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// PHASE ANNOUNCER (Screen Reader)
// ============================================================================

const PHASE_DESCRIPTIONS = [
  'Problem statement displayed',
  'Problem reframed from first principles',
  'Analysis tracks appearing',
  'Prior art track: scanning patents',
  'Cross-domain track: finding connections',
  'Connection lines drawing between insights',
  'Solution synthesis: filtering concepts',
  'Final report emerging',
];

function PhaseAnnouncer({ phase }: { phase: number }) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnnouncement(PHASE_DESCRIPTIONS[phase] || '');
    }, 500);

    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

// ============================================================================
// MANUAL NAVIGATION (Keyboard Accessibility)
// ============================================================================

function PhaseIndicator({ phase }: { phase: number }) {
  return (
    <div
      className="phase-indicator absolute top-24 right-8 z-50 rounded-lg border border-zinc-700/30 bg-zinc-900/80 px-4 py-2 backdrop-blur-sm"
      data-phase={phase}
    >
      <span className={typography.microLabel}>Phase {phase + 1} of 8</span>
      <p className="mt-1 text-xs text-zinc-400">{PHASE_DESCRIPTIONS[phase]}</p>
    </div>
  );
}

function ManualNavigation({
  phase,
  onPhaseChange,
}: {
  phase: number;
  onPhaseChange: (phase: number) => void;
}) {
  return (
    <nav
      className="absolute right-8 bottom-8 flex gap-2"
      aria-label="Phase navigation"
    >
      <button
        onClick={() => onPhaseChange(Math.max(0, phase - 1))}
        disabled={phase === 0}
        className="rounded bg-zinc-800/50 p-2 text-zinc-400 transition-colors hover:bg-zinc-700/50 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
        aria-label="Previous phase"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <span className="sr-only">Phase {phase + 1} of 8</span>

      <button
        onClick={() => onPhaseChange(Math.min(7, phase + 1))}
        disabled={phase === 7}
        className="rounded bg-zinc-800/50 p-2 text-zinc-400 transition-colors hover:bg-zinc-700/50 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
        aria-label="Next phase"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
}

// ============================================================================
// STATIC FALLBACK (Reduced Motion)
// ============================================================================

function StaticAnalysisVisualization() {
  return (
    <section
      className="analysis-animation relative min-h-screen bg-zinc-950 py-24"
      aria-label="Sparlo Analysis Process"
    >
      <div className="mx-auto max-w-4xl space-y-16 px-8">
        <div>
          <h2 className={typography.microLabel}>Problem</h2>
          <p className={`mt-4 ${typography.problemStatement}`}>
            {CONTENT.problem.text}
          </p>
        </div>

        <div>
          <h2 className={typography.microLabel}>Reframe</h2>
          <p className={`mt-4 ${typography.reframe}`}>
            <span className="text-zinc-400">{CONTENT.reframe.prefix}</span>{' '}
            {CONTENT.reframe.text}
          </p>
        </div>

        <div>
          <h2 className={typography.microLabel}>Analysis</h2>
          <p className={typography.counter}>
            {CONTENT.priorArt.patentCount.toLocaleString()}
          </p>
          <p className={typography.citation}>patents analyzed</p>
        </div>

        <div>
          <h2 className={typography.microLabel}>Synthesis</h2>
          <p className="text-zinc-50">
            {CONTENT.solutions.totalCount} concepts →{' '}
            {CONTENT.solutions.survivingCount} surviving
          </p>
          <div className="mt-4 space-y-2">
            {CONTENT.solutions.concepts.map((concept) => (
              <p
                key={concept.title}
                className={
                  concept.status === 'eliminated'
                    ? typography.conceptEliminated
                    : typography.concept
                }
              >
                {concept.title}
              </p>
            ))}
          </div>
        </div>

        <div>
          <h2 className={typography.microLabel}>Report</h2>
          <p className="text-zinc-50">
            {CONTENT.report.pageCount} pages, {CONTENT.report.citationCount}{' '}
            citations
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AnalysisAnimation = memo(function AnalysisAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState(0);
  const [isInView, setIsInView] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Add spring for smoother feel (unless reduced motion)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Track when section is in view for fixed positioning
  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    // Show fixed content when we're within the scroll range (0 < progress < 1)
    const shouldShow = progress > 0 && progress < 1;
    if (shouldShow !== isInView) {
      setIsInView(shouldShow);
    }

    // Phase calculation with non-linear timing
    let newPhase: number;
    if (progress < 0.08) {
      newPhase = 0; // Problem: 0-8%
    } else if (progress < 0.16) {
      newPhase = 1; // Reframe: 8-16%
    } else if (progress < 0.28) {
      newPhase = 2; // Analysis tracks appear: 16-28%
    } else if (progress < 0.44) {
      newPhase = 3; // Prior art scanning: 28-44%
    } else if (progress < 0.56) {
      newPhase = 4; // Cross-domain: 44-56%
    } else if (progress < 0.68) {
      newPhase = 5; // Connection lines: 56-68%
    } else if (progress < 0.82) {
      newPhase = 6; // Synthesis: 68-82%
    } else {
      newPhase = 7; // Report: 82-100%
    }
    if (newPhase !== phase) {
      setPhase(newPhase);
    }
  });

  // Update CSS custom property for non-React animations
  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    containerRef.current?.style.setProperty(
      '--scroll-progress',
      progress.toString(),
    );
  });

  if (prefersReducedMotion) {
    return <StaticAnalysisVisualization />;
  }

  const effectiveProgress = prefersReducedMotion
    ? scrollYProgress
    : smoothProgress;

  return (
    <>
      {/* Scroll container - tall section that drives the animation */}
      <section
        ref={containerRef}
        className="analysis-animation relative h-[300vh] md:h-[400vh] lg:h-[500vh]"
        aria-label="Sparlo Analysis Process Visualization"
      >
        {/* Skip link for keyboard users */}
        <a
          href="#after-animation"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-blue-500 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip animation section
        </a>
        <div id="after-animation" />
      </section>

      {/* Fixed animation overlay - stays in view while scrolling through section */}
      {isInView && (
        <div
          className="fixed inset-0 z-40 h-screen w-screen overflow-hidden bg-zinc-950"
          style={{ pointerEvents: 'none' }}
        >
          <GridBackground />
          <TimelineSpine phase={phase} />
          <PhaseIndicator phase={phase} />
          <PhaseContent phase={phase} scrollYProgress={effectiveProgress} />
          <div style={{ pointerEvents: 'auto' }}>
            <ManualNavigation phase={phase} onPhaseChange={setPhase} />
          </div>
          <PhaseAnnouncer phase={phase} />
        </div>
      )}
    </>
  );
});
