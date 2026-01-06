'use client';

import { memo, useRef } from 'react';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// ============================================================================
// CONTENT
// ============================================================================

const CONTENT = {
  problem: `Marine electrolyzers corrode and foul within months. Need architecture that survives 5+ years in seawater at <$80/ton CO₂.`,
  reframe: `"How do we make replacement so cheap that survival doesn't matter?"`,
  sourceIndustry: 'Desalination',
  technique: 'Electrodialysis Reversal',
  yearsProven: '30+ years proven',
  executiveSummary: `The desalination industry solved seawater fouling decades ago with electrodialysis reversal—polarity switching every 15-30 minutes that dissolves scale and kills biofilms before they mature. Mikhaylin & Bazinet's 2016 review documents 5-10x membrane life extension with this single intervention. The adaptation to alkalinity production isn't research; it's engineering integration with a philosophy shift: design for managed degradation with modular hot-swap electrodes rather than fighting for 5-year component survival in an environment that destroys everything.`,
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

const SOLUTIONS_DATA = [
  { rank: '01', name: 'Polarity-Switching Electrolyzer', confidence: 94, source: 'Desalination' },
  { rank: '02', name: 'Sacrificial Anode Arrays', confidence: 78, source: 'Marine Engineering' },
  { rank: '03', name: 'Pulsed-Current Operation', confidence: 71, source: 'Electroplating' },
  { rank: '04', name: 'Ceramic Membrane Barriers', confidence: 67, source: 'Semiconductor' },
];

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const domainPill = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 },
  },
};

// ============================================================================
// SCROLL-DRIVEN JOURNEY CONNECTOR
// ============================================================================

function JourneyConnector() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 0.5], ['0%', '100%']);
  const dotOpacity = useTransform(scrollYProgress, [0.4, 0.5], [0, 1]);
  const dotScale = useTransform(scrollYProgress, [0.4, 0.55], [0, 1]);
  const arrowOpacity = useTransform(scrollYProgress, [0.5, 0.6], [0, 1]);

  return (
    <div ref={ref} className="flex flex-col items-center py-16 md:py-24">
      {/* The track */}
      <div className="relative h-32 w-px md:h-40">
        {/* Background track */}
        <div className="absolute inset-0 bg-zinc-800/50" />

        {/* Animated fill */}
        <motion.div
          style={{ height: lineHeight }}
          className="absolute left-0 top-0 w-full bg-gradient-to-b from-zinc-600 via-zinc-500 to-white"
        />

        {/* Glowing dot */}
        <motion.div
          style={{ opacity: dotOpacity, scale: dotScale }}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2"
        >
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/30" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]" />
          </span>
        </motion.div>
      </div>

      {/* Arrow */}
      <motion.div style={{ opacity: arrowOpacity }} className="mt-4">
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path
            d="M1 1L7 8L13 1"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </div>
  );
}

// ============================================================================
// STEP LABEL
// ============================================================================

function StepLabel({ number, label }: { number: string; label: string }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <span className="font-mono text-[13px] font-medium text-zinc-600">{number}</span>
      <span className="text-[13px] font-medium uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ProcessAnimation = memo(function ProcessAnimation() {
  return (
    <section className="bg-zinc-950 px-6 py-32 md:py-40">
      <div className="mx-auto max-w-3xl">

        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          className="mb-24 text-center md:mb-32"
        >
          <p className="font-mono text-[12px] font-medium uppercase tracking-[0.3em] text-zinc-600">
            Process
          </p>
          <h2 className="mt-6 text-[36px] font-semibold leading-[1.1] tracking-tight text-white sm:text-[48px]">
            Cross-domain analysis
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-[18px] leading-relaxed text-zinc-400">
            47 technical domains. 12,847 patents. 34,291 papers.
            <br />
            One systematic search.
          </p>
        </motion.div>

        {/* ============================================ */}
        {/* STEP 01: Input */}
        {/* ============================================ */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeInUp}
        >
          <StepLabel number="01" label="Input" />
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-8 md:p-10">
            <p className="text-[20px] leading-relaxed text-zinc-100 md:text-[22px]">
              {CONTENT.problem}
            </p>
          </div>
        </motion.div>

        <JourneyConnector />

        {/* ============================================ */}
        {/* STEP 02: Reframe */}
        {/* ============================================ */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeInUp}
        >
          <StepLabel number="02" label="Reframe" />

          <div className="border-l-2 border-white/20 pl-8">
            <p className="text-[24px] font-medium leading-snug text-white md:text-[28px]">
              {CONTENT.reframe}
            </p>
          </div>
        </motion.div>

        <JourneyConnector />

        {/* ============================================ */}
        {/* STEP 03: Innovation Analysis */}
        {/* ============================================ */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeInUp}
        >
          <StepLabel number="03" label="Innovation Analysis" />

          {/* Domain pills */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap gap-2"
          >
            {DOMAINS_SEARCHED.map((domain) => {
              const isMatch = domain === CONTENT.sourceIndustry;
              return (
                <motion.span
                  key={domain}
                  variants={domainPill}
                  className={`rounded-full px-4 py-2.5 text-[14px] font-medium ${
                    isMatch
                      ? 'bg-white text-zinc-900'
                      : 'bg-zinc-800/80 text-zinc-500'
                  }`}
                >
                  {domain}
                </motion.span>
              );
            })}
            <motion.span
              variants={domainPill}
              className="rounded-full bg-zinc-900 px-4 py-2.5 text-[14px] text-zinc-600"
            >
              +39 domains
            </motion.span>
          </motion.div>

          {/* Key finding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6"
          >
            <div className="flex items-center gap-3 text-[14px]">
              <span className="rounded bg-white/10 px-3 py-1.5 font-mono text-white">
                {CONTENT.technique}
              </span>
              <span className="text-zinc-600">from</span>
              <span className="text-zinc-300">{CONTENT.sourceIndustry}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500">{CONTENT.yearsProven}</span>
            </div>
          </motion.div>

          {/* Patents & Literature */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-6 flex items-center gap-8 text-[14px] text-zinc-500"
          >
            <div>
              <span className="font-mono text-[18px] font-semibold text-zinc-300">14</span>
              <span className="ml-2">patents analyzed</span>
            </div>
            <div>
              <span className="font-mono text-[18px] font-semibold text-zinc-300">23</span>
              <span className="ml-2">papers reviewed</span>
            </div>
          </motion.div>
        </motion.div>

        <JourneyConnector />

        {/* ============================================ */}
        {/* STEP 04: Output - Terminal Style */}
        {/* ============================================ */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeInUp}
        >
          <StepLabel number="04" label="Output" />

          <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900">
            {/* Terminal header */}
            <div className="flex items-center gap-2 border-b border-zinc-800 px-6 py-4">
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="ml-4 font-mono text-[12px] text-zinc-500">
                analysis_report.md
              </span>
            </div>

            {/* Executive Summary */}
            <div className="border-b border-zinc-800 p-8 md:p-10">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-600">
                Executive Summary
              </p>
              <p className="mt-6 text-[17px] leading-[1.8] text-zinc-300 md:text-[18px]">
                {CONTENT.executiveSummary}
              </p>
            </div>

            {/* Solutions Grid */}
            <div className="p-8 md:p-10">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-600">
                Ranked Solutions
              </p>

              <div className="mt-6 space-y-4">
                {SOLUTIONS_DATA.map((solution, index) => (
                  <motion.div
                    key={solution.rank}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-6 rounded-lg p-4 ${
                      index === 0
                        ? 'bg-white/5 ring-1 ring-white/10'
                        : 'bg-zinc-800/30'
                    }`}
                  >
                    {/* Rank */}
                    <span className={`font-mono text-[14px] ${
                      index === 0 ? 'text-white' : 'text-zinc-600'
                    }`}>
                      {solution.rank}
                    </span>

                    {/* Name & Source */}
                    <div className="flex-1">
                      <p className={`text-[15px] font-medium ${
                        index === 0 ? 'text-white' : 'text-zinc-400'
                      }`}>
                        {solution.name}
                      </p>
                      <p className="mt-0.5 text-[13px] text-zinc-600">
                        via {solution.source}
                      </p>
                    </div>

                    {/* Confidence */}
                    <div className="text-right">
                      <p className={`font-mono text-[20px] font-semibold ${
                        index === 0 ? 'text-white' : 'text-zinc-500'
                      }`}>
                        {solution.confidence}
                      </p>
                      <p className="text-[11px] uppercase tracking-wider text-zinc-600">
                        confidence
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Report Stats Footer */}
            <div className="grid grid-cols-3 gap-px border-t border-zinc-800 bg-zinc-800">
              {[
                { value: '24', label: 'Pages' },
                { value: '14', label: 'Patents cited' },
                { value: '23', label: 'Validations' },
              ].map((stat) => (
                <div key={stat.label} className="bg-zinc-900 px-6 py-5 text-center">
                  <p className="font-mono text-[24px] font-semibold text-white">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[12px] text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.a
            href="#example-reports"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-8 py-5 text-[16px] font-semibold text-zinc-900 transition-all hover:bg-zinc-100"
          >
            View full example report
            <ArrowRight className="h-5 w-5" strokeWidth={2} />
          </motion.a>
        </motion.div>

      </div>
    </section>
  );
});
