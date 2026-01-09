'use client';

import { memo } from 'react';

import { motion } from 'framer-motion';

import { cn } from '@kit/ui/utils';

// ============================================================================
// TYPES
// ============================================================================

interface FirstPrinciplesProps {
  assumption?: { text: string; explanation: string };
  reframe?: { question: string; statement: string; unlocks: string[] };
  className?: string;
}

// ============================================================================
// DEFAULT CONTENT
// ============================================================================

const defaultProps = {
  assumption: {
    text: 'Electrodes must survive 5+ years in seawater',
    explanation:
      'Inherited from chlor-alkali plants operating with purified brine. Never validated for seawater.',
  },
  reframe: {
    question: "What if survival doesn't matter?",
    statement: 'Optimize for $/kg-NaOH-lifetime, not component longevity.',
    unlocks: [
      'Modular cartridge electrodes designed for 6-12 month replacement',
      'Simpler materials (carbon, nickel) vs exotic alloys',
      'Design philosophy: "make replacement cheap" vs "prevent decay"',
    ],
  },
};

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const typewriter = {
  hidden: { width: 0 },
  visible: {
    width: 'auto',
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const FirstPrinciples = memo(function FirstPrinciples({
  assumption = defaultProps.assumption,
  reframe = defaultProps.reframe,
  className,
}: FirstPrinciplesProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden bg-[#050505] px-6 py-24 md:px-16 md:py-32',
        className,
      )}
    >
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      {/* Scan line effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.1) 2px,
            rgba(255, 255, 255, 0.1) 4px
          )`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Terminal Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          className="mb-10 motion-reduce:transform-none motion-reduce:opacity-100"
        >
          {/* Terminal window chrome */}
          <div className="mb-4 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
            <span className="ml-4 font-mono text-[11px] text-zinc-500">
              sparlo@analysis:~/first-principles
            </span>
          </div>

          {/* Command line */}
          <div className="mb-6 font-mono text-[13px] text-zinc-300">
            <span className="text-emerald-400">$</span>{' '}
            <span className="text-white">analyze</span>{' '}
            <span className="text-zinc-500">--mode=</span>
            <span className="text-amber-400">first-principles</span>{' '}
            <span className="text-zinc-500">--depth=</span>
            <span className="text-cyan-400">root</span>
            <span className="ml-1 animate-pulse text-white">▊</span>
          </div>

          {/* Output header */}
          <div className="mb-6 border-b border-zinc-800 pb-2 font-mono text-[11px] text-zinc-500">
            ═══════════════════════════════════════════════════════════════════
          </div>
        </motion.div>

        {/* Question - Main heading */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          className="mb-12 motion-reduce:transform-none motion-reduce:opacity-100"
        >
          <span className="mb-3 block font-mono text-[10px] tracking-[0.15em] text-emerald-400 uppercase">
            [QUERY]
          </span>
          <h3 className="max-w-xl font-sans text-[36px] leading-[1.2] font-light tracking-tight text-white">
            Are we solving the right problem?
          </h3>
        </motion.div>

        {/* Main Analysis Flow */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="space-y-0 motion-reduce:transform-none motion-reduce:opacity-100"
        >
          {/* Assumption Block - Under examination */}
          <motion.div
            variants={staggerItem}
            className="relative border-l-2 border-red-500/50 bg-zinc-900/30 py-6 pl-6 motion-reduce:transform-none motion-reduce:opacity-100"
          >
            {/* Status indicator */}
            <div className="absolute top-6 left-0 -ml-[5px] h-2 w-2 animate-pulse rounded-full bg-red-500" />

            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[10px] font-bold tracking-[0.1em] text-red-400 uppercase">
                ⚠ ASSUMPTION_DETECTED
              </span>
              <span className="font-mono text-[10px] text-zinc-600">
                ────────────────────
              </span>
              <span className="font-mono text-[10px] text-zinc-500">
                flagged for review
              </span>
            </div>

            <p className="mb-4 font-mono text-[18px] leading-relaxed font-normal tracking-tight text-white">
              &quot;{assumption.text}&quot;
            </p>

            <div className="flex items-start gap-2">
              <span className="mt-[2px] font-mono text-[11px] text-zinc-600">
                └──
              </span>
              <p className="font-mono text-[13px] leading-relaxed text-zinc-400">
                {assumption.explanation}
              </p>
            </div>
          </motion.div>

          {/* Processing indicator */}
          <motion.div
            variants={staggerItem}
            className="py-4 pl-6 motion-reduce:transform-none motion-reduce:opacity-100"
          >
            <div className="font-mono text-[11px] text-zinc-600">
              <span className="text-zinc-500">├──</span> processing
              <span className="ml-2 text-emerald-500">████████████</span>
              <span className="text-zinc-700">░░░░</span>
              <span className="ml-2 text-zinc-500">reframing...</span>
            </div>
          </motion.div>

          {/* Reframe Block - THE answer */}
          <motion.div
            variants={staggerItem}
            className="relative border-l-2 border-[#c9a861] bg-[#c9a861]/[0.03] py-8 pl-6 motion-reduce:transform-none motion-reduce:opacity-100"
          >
            {/* Status indicator */}
            <div
              className="absolute top-8 left-0 -ml-[5px] h-2 w-2 rounded-full bg-[#c9a861]"
              style={{ boxShadow: '0 0 10px rgba(201, 168, 97, 0.5)' }}
            />

            <div className="mb-5 flex items-center gap-3">
              <span className="font-mono text-[10px] font-bold tracking-[0.1em] text-[#c9a861] uppercase">
                ✓ REFRAME_COMPLETE
              </span>
              <span className="font-mono text-[10px] text-zinc-700">
                ────────────────────
              </span>
              <span className="font-mono text-[10px] text-emerald-500">
                breakthrough
              </span>
            </div>

            <h4 className="mb-4 font-sans text-[28px] leading-[1.25] font-normal tracking-tight text-white">
              {reframe.question}
            </h4>

            <p className="mb-8 max-w-lg font-sans text-[16px] leading-relaxed tracking-tight text-zinc-200">
              {reframe.statement}
            </p>

            {/* Unlocks */}
            <div className="border-t border-zinc-800 pt-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold tracking-[0.1em] text-emerald-400 uppercase">
                  → THIS_UNLOCKS
                </span>
              </div>

              <ul className="space-y-3">
                {reframe.unlocks.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-[3px] font-mono text-[11px] text-emerald-500">
                      [{String(i + 1).padStart(2, '0')}]
                    </span>
                    <span className="font-sans text-[14px] leading-relaxed text-white">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Footer status */}
          <motion.div
            variants={staggerItem}
            className="pt-6 motion-reduce:transform-none motion-reduce:opacity-100"
          >
            <div className="border-t border-zinc-800 pt-4 font-mono text-[11px] text-zinc-600">
              <span className="text-zinc-500">
                ═══════════════════════════════════════════════════════════════════
              </span>
              <div className="mt-3 flex items-center justify-between">
                <span>
                  <span className="text-emerald-500">●</span> Analysis complete
                </span>
                <span className="text-zinc-500">
                  constraints_challenged: 1 | assumptions_invalidated: 1 |
                  paths_unlocked: {reframe.unlocks.length}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
});

export default FirstPrinciples;
