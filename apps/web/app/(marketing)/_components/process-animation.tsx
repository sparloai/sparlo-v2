'use client';

import { memo } from 'react';

import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

// ============================================================================
// CONTENT
// ============================================================================

const CONTENT = {
  problem: `Marine electrolyzers corrode and foul within months. Need architecture that survives 5+ years in seawater at <$80/ton CO₂.`,
  reframe: `"How do we make replacement so cheap that survival doesn't matter?"`,
  sourceIndustry: 'Desalination',
  technique: 'Electrodialysis Reversal',
  insight: `Polarity switching every 15-30 minutes dissolves scale and kills biofilms before they mature.`,
  yearsProven: '30+ years proven',
  solution: 'Polarity-Switching Electrolyzer',
  patents: '14 patents',
  papers: '23 validations',
};

const DOMAINS_SEARCHED = [
  'Electrochemistry',
  'Marine Biology',
  'Corrosion Science',
  'Membrane Tech',
  'Desalination',
  'Geothermal',
  'Semiconductor',
  'Aerospace',
];

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const domainPill = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4 }
  },
};

// ============================================================================
// MAIN COMPONENT - Simple landing page section with entrance animations
// ============================================================================

export const ProcessAnimation = memo(function ProcessAnimation() {
  return (
    <section className="bg-zinc-950 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-4xl">

        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          className="mb-20 text-center"
        >
          <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            How it works
          </p>
          <h2 className="mt-4 text-[32px] font-semibold leading-tight text-white sm:text-[40px]">
            Cross-domain innovation analysis
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-zinc-400">
            We search across 47 technical domains to find proven solutions
            from unexpected industries.
          </p>
        </motion.div>

        {/* The Example Flow */}
        <div className="space-y-16">

          {/* Step 1: The Problem */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[13px] font-medium text-zinc-400">
                1
              </span>
              <span className="text-[13px] font-medium uppercase tracking-wider text-zinc-500">
                Your challenge
              </span>
            </div>
            <p className="text-[18px] leading-relaxed text-zinc-200">
              {CONTENT.problem}
            </p>
          </motion.div>

          {/* Step 2: The Search */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[13px] font-medium text-zinc-400">
                2
              </span>
              <span className="text-[13px] font-medium uppercase tracking-wider text-zinc-500">
                Cross-domain search
              </span>
            </div>

            {/* Domain pills */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-wrap gap-2"
            >
              {DOMAINS_SEARCHED.map((domain) => {
                const isWinner = domain === CONTENT.sourceIndustry;
                return (
                  <motion.span
                    key={domain}
                    variants={domainPill}
                    className={`rounded-full px-4 py-2 text-[14px] font-medium ${
                      isWinner
                        ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30'
                        : 'bg-zinc-800/80 text-zinc-500'
                    }`}
                  >
                    {domain}
                    {isWinner && <span className="ml-2">✓</span>}
                  </motion.span>
                );
              })}
              <span className="rounded-full bg-zinc-800/50 px-4 py-2 text-[14px] text-zinc-600">
                +39 more
              </span>
            </motion.div>
          </motion.div>

          {/* Step 3: The Insight */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[13px] font-medium text-zinc-400">
                3
              </span>
              <span className="text-[13px] font-medium uppercase tracking-wider text-zinc-500">
                The insight
              </span>
            </div>

            {/* Reframe */}
            <div className="mb-8 rounded-xl border-l-2 border-blue-500 bg-zinc-900/30 py-4 pl-6 pr-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                Reframing the problem
              </p>
              <p className="mt-2 text-[20px] font-medium leading-snug text-white sm:text-[22px]">
                {CONTENT.reframe}
              </p>
            </div>

            {/* Connection */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-[14px] font-medium text-blue-400">
                  {CONTENT.sourceIndustry}
                </span>
                <span className="text-zinc-600">→</span>
                <span className="text-[14px] text-zinc-400">
                  {CONTENT.yearsProven}
                </span>
              </div>

              <p className="mb-2 font-mono text-[13px] font-medium text-blue-400">
                {CONTENT.technique}
              </p>
              <p className="text-[16px] leading-relaxed text-zinc-300">
                {CONTENT.insight}
              </p>
            </div>
          </motion.div>

          {/* Step 4: The Result */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
            className="rounded-2xl bg-white p-8 text-center"
          >
            <div className="mb-6 flex items-center justify-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-[13px] font-medium text-zinc-500">
                4
              </span>
              <span className="text-[13px] font-medium uppercase tracking-wider text-zinc-400">
                Recommended solution
              </span>
            </div>

            <h3 className="text-[24px] font-semibold text-zinc-900 sm:text-[28px]">
              {CONTENT.solution}
            </h3>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2">
              <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
              <span className="text-[14px] font-medium text-emerald-700">
                High confidence
              </span>
            </div>

            <p className="mt-4 text-[14px] text-zinc-500">
              {CONTENT.patents} · {CONTENT.papers}
            </p>

            <a
              href="#example-reports"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-zinc-800"
            >
              View example report
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </a>
          </motion.div>

        </div>
      </div>
    </section>
  );
});
