'use client';

import { memo } from 'react';

import { motion } from 'framer-motion';
import { ArrowRight, Check, FileText, Shield, Lightbulb } from 'lucide-react';

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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const domainPill = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

// ============================================================================
// ANIMATED JOURNEY CONNECTOR
// ============================================================================

function JourneyConnector() {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="flex flex-col items-center py-8"
    >
      {/* The track */}
      <div className="relative h-24 w-px">
        {/* Background line */}
        <motion.div
          variants={{
            hidden: { scaleY: 0, originY: 0 },
            visible: {
              scaleY: 1,
              transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
            },
          }}
          className="absolute inset-0 bg-gradient-to-b from-zinc-800 via-zinc-700 to-zinc-800"
        />

        {/* Traveling pulse - the "journey" effect */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { delay: 0.3 },
            },
          }}
          className="absolute inset-0 overflow-hidden"
        >
          <motion.div
            animate={{
              y: ['-100%', '200%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: 0.5,
            }}
            className="absolute left-1/2 h-8 w-px -translate-x-1/2"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.6), transparent)',
            }}
          />
        </motion.div>

        {/* Glowing dot at the end */}
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0 },
            visible: {
              opacity: 1,
              scale: 1,
              transition: { delay: 0.6, type: 'spring', stiffness: 300 },
            },
          }}
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-white/80" />
          </span>
        </motion.div>
      </div>

      {/* Arrow head */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: -5 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { delay: 0.7, duration: 0.3 },
          },
        }}
        className="mt-2"
      >
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-white/60">
          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// STEP LABEL COMPONENT
// ============================================================================

function StepLabel({ number, label }: { number: number; label: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-[13px] font-medium text-zinc-400">
        {number}
      </span>
      <span className="text-[13px] font-medium uppercase tracking-[0.15em] text-zinc-500">
        {label}
      </span>
    </div>
  );
}

// ============================================================================
// REPORT PREVIEW METRICS
// ============================================================================

const REPORT_METRICS = [
  { icon: Lightbulb, value: '4', label: 'Viable solutions' },
  { icon: Shield, value: '12', label: 'Risk factors analyzed' },
  { icon: FileText, value: '24', label: 'Pages of analysis' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ProcessAnimation = memo(function ProcessAnimation() {
  return (
    <section className="bg-zinc-950 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-3xl">

        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          className="mb-16 text-center"
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

        {/* ============================================ */}
        {/* STEP 1: The Problem */}
        {/* ============================================ */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeInUp}
        >
          <StepLabel number={1} label="Your challenge" />
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
            <p className="text-[19px] leading-relaxed text-zinc-200">
              {CONTENT.problem}
            </p>
          </div>
        </motion.div>

        <JourneyConnector />

        {/* ============================================ */}
        {/* STEP 2: The Search */}
        {/* ============================================ */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeInUp}
        >
          <StepLabel number={2} label="Cross-domain search" />

          {/* Stats row */}
          <div className="mb-6 flex items-center gap-6 text-[14px] text-zinc-500">
            <span><span className="font-medium text-zinc-300">47</span> domains</span>
            <span><span className="font-medium text-zinc-300">12,847</span> patents</span>
            <span><span className="font-medium text-zinc-300">34,291</span> papers</span>
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
                  className={`rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
                    isWinner
                      ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'bg-zinc-800/80 text-zinc-400'
                  }`}
                >
                  {domain}
                  {isWinner && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8, type: 'spring', stiffness: 500 }}
                      className="ml-2"
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.span>
              );
            })}
            <motion.span
              variants={domainPill}
              className="rounded-full bg-zinc-800/50 px-4 py-2 text-[14px] text-zinc-600"
            >
              +39 more
            </motion.span>
          </motion.div>
        </motion.div>

        <JourneyConnector />

        {/* ============================================ */}
        {/* STEP 3: The Insight */}
        {/* ============================================ */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeInUp}
        >
          <StepLabel number={3} label="The insight" />

          {/* Reframe quote */}
          <div className="mb-8 rounded-xl border-l-2 border-zinc-600 bg-zinc-900/40 py-5 pl-6 pr-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-600">
              Reframing the problem
            </p>
            <p className="mt-3 text-[21px] font-medium leading-snug text-white sm:text-[24px]">
              {CONTENT.reframe}
            </p>
          </div>

          {/* Connection card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            {/* Source badge */}
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-[14px] font-medium text-emerald-400">
                {CONTENT.sourceIndustry}
              </span>
              <span className="text-zinc-700">→</span>
              <span className="text-[14px] text-zinc-500">
                {CONTENT.yearsProven}
              </span>
            </div>

            {/* Technique name */}
            <p className="mb-2 font-mono text-[14px] font-medium text-emerald-400">
              {CONTENT.technique}
            </p>

            {/* Insight text */}
            <p className="text-[17px] leading-relaxed text-zinc-300">
              {CONTENT.insight}
            </p>
          </div>
        </motion.div>

        <JourneyConnector />

        {/* ============================================ */}
        {/* STEP 4: The Deliverable */}
        {/* ============================================ */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeInUp}
        >
          <StepLabel number={4} label="Your deliverable" />

          <div className="overflow-hidden rounded-2xl bg-white">
            {/* Executive Summary Header */}
            <div className="border-b border-zinc-100 px-8 py-6">
              <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.1em] text-zinc-400">
                <Check className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />
                Analysis complete
              </div>
            </div>

            {/* Main content */}
            <div className="px-8 py-8">
              {/* Lead recommendation */}
              <p className="text-[13px] font-medium uppercase tracking-[0.1em] text-emerald-600">
                Lead recommendation
              </p>
              <h3 className="mt-2 text-[28px] font-semibold leading-tight text-zinc-900 sm:text-[32px]">
                {CONTENT.solution}
              </h3>

              {/* Executive summary */}
              <p className="mt-4 text-[17px] leading-relaxed text-zinc-600">
                Adapting electrodialysis reversal from desalination eliminates the corrosion-fouling
                cycle that limits marine electrolyzer lifespan. This architecture has been validated
                in seawater environments for 30+ years at industrial scale.
              </p>

              {/* Evidence line */}
              <div className="mt-4 flex items-center gap-4 text-[14px] text-zinc-500">
                <span className="font-medium text-zinc-700">{CONTENT.patents}</span>
                <span className="h-1 w-1 rounded-full bg-zinc-300" />
                <span className="font-medium text-zinc-700">{CONTENT.papers}</span>
                <span className="h-1 w-1 rounded-full bg-zinc-300" />
                <span>Confidence: <span className="font-medium text-emerald-600">High</span></span>
              </div>
            </div>

            {/* Report metrics */}
            <div className="border-t border-zinc-100 bg-zinc-50/50 px-8 py-6">
              <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.1em] text-zinc-400">
                Full report includes
              </p>
              <div className="grid grid-cols-3 gap-4">
                {REPORT_METRICS.map((metric) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-center"
                  >
                    <metric.icon className="mx-auto h-5 w-5 text-zinc-400" strokeWidth={1.5} />
                    <p className="mt-2 text-[24px] font-semibold text-zinc-900">{metric.value}</p>
                    <p className="text-[13px] text-zinc-500">{metric.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="border-t border-zinc-100 px-8 py-6">
              <a
                href="#example-reports"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 py-3.5 text-[15px] font-medium text-white transition-all hover:bg-zinc-800"
              >
                View full example report
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </a>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
});
