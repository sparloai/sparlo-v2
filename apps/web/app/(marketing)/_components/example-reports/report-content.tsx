'use client';

import { useEffect, useRef } from 'react';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Lightbulb, Target, Zap } from 'lucide-react';

import { cn } from '@kit/ui/utils';

import type { ExampleReport } from './data/types';

interface ReportContentProps {
  report: ExampleReport;
  onActiveSectionChange: (sectionId: string) => void;
}

// ============================================
// VISUAL COMPONENTS
// ============================================

function ConfidenceMeter({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2 w-24 overflow-hidden rounded-full bg-zinc-200">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-zinc-900"
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <span className="text-[14px] font-semibold text-zinc-900">{value}%</span>
      <span className="text-[13px] text-zinc-500">{label}</span>
    </div>
  );
}

function InsightCard({
  icon,
  title,
  description,
  variant = 'default',
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: 'default' | 'highlight';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className={cn(
        'rounded-xl border p-6',
        variant === 'highlight'
          ? 'border-zinc-900 bg-zinc-900 text-white'
          : 'border-zinc-200 bg-white',
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-10 w-10 items-center justify-center rounded-lg',
          variant === 'highlight' ? 'bg-white/10' : 'bg-zinc-100',
        )}
      >
        {icon}
      </div>
      <h4
        className={cn(
          'text-[16px] font-semibold',
          variant === 'highlight' ? 'text-white' : 'text-zinc-900',
        )}
      >
        {title}
      </h4>
      <p
        className={cn(
          'mt-2 text-[15px] leading-relaxed',
          variant === 'highlight' ? 'text-zinc-300' : 'text-zinc-600',
        )}
      >
        {description}
      </p>
    </motion.div>
  );
}

function StatBox({
  value,
  label,
  subtext,
}: {
  value: string;
  label: string;
  subtext?: string;
}) {
  return (
    <div className="text-center">
      <motion.p
        className="text-[32px] font-bold tracking-tight text-zinc-900"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {value}
      </motion.p>
      <p className="mt-1 text-[14px] font-medium text-zinc-700">{label}</p>
      {subtext && <p className="mt-0.5 text-[12px] text-zinc-400">{subtext}</p>}
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="my-16 flex items-center gap-4">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
    </div>
  );
}

// ============================================
// TYPOGRAPHY PRIMITIVES
// ============================================

function MonoLabel({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'muted';
}) {
  return (
    <span
      className={cn(
        'text-[12px] font-semibold uppercase tracking-[0.08em]',
        variant === 'default' ? 'text-zinc-500' : 'text-zinc-400',
      )}
    >
      {children}
    </span>
  );
}

function BodyText({
  children,
  className,
  size = 'md',
  variant = 'primary',
}: {
  children: React.ReactNode;
  className?: string;
  size?: 'lg' | 'md' | 'sm';
  variant?: 'primary' | 'secondary' | 'muted';
}) {
  const sizeClasses = {
    lg: 'text-[20px]',
    md: 'text-[17px]',
    sm: 'text-[15px]',
  };

  const variantClasses = {
    primary: 'text-zinc-800',
    secondary: 'text-zinc-600',
    muted: 'text-zinc-500',
  };

  return (
    <p
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        'leading-[1.6] tracking-[-0.01em]',
        className,
      )}
    >
      {children}
    </p>
  );
}

function SectionHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <MonoLabel>{label}</MonoLabel>
      <h2 className="mt-3 text-[32px] font-semibold tracking-tight text-zinc-900">
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-[55ch] text-[17px] leading-relaxed text-zinc-500">
          {description}
        </p>
      )}
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ReportContent({
  report,
  onActiveSectionChange,
}: ReportContentProps) {
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id.replace(`${report.id}-`, '');
            onActiveSectionChange(sectionId);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    );

    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [report.id, onActiveSectionChange]);

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(id, el);
  };

  return (
    <div className="px-6 py-10 md:px-10 md:py-12">
      {/* Report Header */}
      <header className="mb-12 max-w-[65ch]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MonoLabel variant="muted">{report.category}</MonoLabel>
          <h1 className="mt-3 text-[36px] font-semibold leading-[1.1] tracking-tight text-zinc-900 lg:text-[42px]">
            {report.title}
          </h1>
          <p className="mt-4 text-[18px] leading-relaxed text-zinc-500">
            {report.subtitle}
          </p>
        </motion.div>
      </header>

      {/* Key Stats Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-16 grid grid-cols-3 gap-6 rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8"
      >
        <StatBox value="5-10x" label="Membrane Life" subtext="improvement" />
        <StatBox value="$60-80" label="Per Ton CO₂" subtext="target cost" />
        <StatBox value="85%" label="Confidence" subtext="in primary solution" />
      </motion.div>

      {/* ============================================ */}
      {/* EXECUTIVE SUMMARY */}
      {/* ============================================ */}
      <section
        id={`${report.id}-executive-summary`}
        ref={setSectionRef('executive-summary')}
        className="scroll-mt-8"
      >
        <SectionHeader
          label="Section 01"
          title="Executive Summary"
          description="The bottom line on marine electrolyzer viability."
        />

        <div className="space-y-8">
          <InsightCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            title="Viable with High Confidence"
            description="The desalination industry solved seawater fouling decades ago with electrodialysis reversal—polarity switching every 15-30 minutes that dissolves scale and kills biofilms."
            variant="highlight"
          />

          <BodyText>
            Mikhaylin & Bazinet&apos;s 2016 review documents 5-10x membrane life
            extension with this single intervention. The electrolyzer industry
            inherited chlor-alkali assumptions about continuous operation and
            missed this entirely.
          </BodyText>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            <MonoLabel>Primary Recommendation</MonoLabel>
            <BodyText className="mt-3">
              Implement polarity reversal (5-15 minute cycles for seawater)
              combined with modular cartridge electrodes designed for 6-12 month
              hot-swap replacement. Target $60-80/ton CO₂ equivalent with 70%+
              capacity factor.
            </BodyText>
            <div className="mt-4 flex items-center gap-4 text-[14px]">
              <span className="rounded-full bg-zinc-200 px-3 py-1 font-medium text-zinc-700">
                First validation: $50-100K
              </span>
              <span className="rounded-full bg-zinc-200 px-3 py-1 font-medium text-zinc-700">
                3-month seawater test
              </span>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ============================================ */}
      {/* PROBLEM ANALYSIS */}
      {/* ============================================ */}
      <section
        id={`${report.id}-problem-analysis`}
        ref={setSectionRef('problem-analysis')}
        className="scroll-mt-8"
      >
        <SectionHeader
          label="Section 02"
          title="Problem Analysis"
          description="Understanding why seawater destroys electrochemical systems."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <InsightCard
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            title="Chloride Corrosion"
            description="Chloride ions corrode metals and degrade membranes within weeks of exposure."
          />
          <InsightCard
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            title="Biofilm Formation"
            description="Biofilms establish within 24-48 hours, creating persistent fouling layers."
          />
          <InsightCard
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            title="Mineral Scale"
            description="Mg(OH)₂ and CaCO₃ precipitate directly onto electrode surfaces."
          />
        </div>

        <div className="mt-10 rounded-xl border-l-4 border-zinc-900 bg-zinc-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-[16px] font-semibold text-zinc-900">
                First Principles Insight
              </h4>
              <p className="mt-2 text-[18px] font-medium leading-snug text-zinc-800">
                Optimize for $/kg-NaOH-lifetime, not component longevity
              </p>
              <BodyText className="mt-3" variant="secondary">
                The 5-year electrode life target may be self-imposed rather than
                economically optimal. If electrode replacement is cheap and fast
                enough, designing for 6-12 month disposable electrodes might beat
                5-year hardened electrodes on total cost.
              </BodyText>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ============================================ */}
      {/* SOLUTION CONCEPTS */}
      {/* ============================================ */}
      <section
        id={`${report.id}-solution-concepts`}
        ref={setSectionRef('solution-concepts')}
        className="scroll-mt-8"
      >
        <SectionHeader
          label="Section 03"
          title="Solution Concepts"
          description="Proven technologies requiring integration, not invention."
        />

        {/* Primary Recommendation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="mb-10 overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900"
        >
          <div className="p-8">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-zinc-400" />
              <MonoLabel>Primary Recommendation</MonoLabel>
            </div>
            <h3 className="mt-4 text-[24px] font-semibold text-white">
              Polarity Reversal + Modular Cartridge Architecture
            </h3>
            <p className="mt-3 text-[16px] leading-relaxed text-zinc-400">
              Combine proven EDR-style polarity reversal (5-15 minute cycles)
              with modular cartridge electrodes designed for 6-12 month hot-swap
              replacement.
            </p>

            <div className="mt-6">
              <ConfidenceMeter value={85} label="confidence" />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-zinc-800 pt-6">
              <div>
                <p className="text-[12px] uppercase tracking-wide text-zinc-500">
                  Investment
                </p>
                <p className="mt-1 text-[20px] font-semibold text-white">
                  $0.5-2M
                </p>
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-wide text-zinc-500">
                  Timeline
                </p>
                <p className="mt-1 text-[20px] font-semibold text-white">
                  6-12 months
                </p>
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-wide text-zinc-500">
                  Expected Improvement
                </p>
                <p className="mt-1 text-[20px] font-semibold text-white">
                  5-10x life
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Supporting Concepts */}
        <h3 className="mb-6 text-[20px] font-semibold text-zinc-900">
          Supporting Concepts
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                Fallback
              </span>
              <ConfidenceMeter value={75} label="" />
            </div>
            <h4 className="mt-4 text-[17px] font-semibold text-zinc-900">
              Accept Chlorine + Downstream Mineral Neutralization
            </h4>
            <BodyText className="mt-2" size="sm" variant="secondary">
              Stop fighting chlorine evolution. Accept mixed Cl₂/O₂ production
              and react chlorine with olivine slurry downstream.
            </BodyText>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                Complementary
              </span>
              <ConfidenceMeter value={80} label="" />
            </div>
            <h4 className="mt-4 text-[17px] font-semibold text-zinc-900">
              Geothermal-Inspired Precipitation Steering
            </h4>
            <BodyText className="mt-2" size="sm" variant="secondary">
              Install sacrificial &quot;scaling targets&quot; upstream of electrodes
              that preferentially nucleate Mg(OH)₂ and CaCO₃.
            </BodyText>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ============================================ */}
      {/* INNOVATION CONCEPTS */}
      {/* ============================================ */}
      <section
        id={`${report.id}-innovation-concepts`}
        ref={setSectionRef('innovation-concepts')}
        className="scroll-mt-8"
      >
        <SectionHeader
          label="Section 04"
          title="Innovation Concepts"
          description="Higher-risk explorations with breakthrough potential."
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-dashed border-zinc-300 bg-gradient-to-br from-zinc-50 to-white p-8"
        >
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <span className="text-[12px] font-semibold uppercase tracking-wide text-amber-600">
              Paradigm Shift
            </span>
          </div>
          <h4 className="mt-4 text-[20px] font-semibold text-zinc-900">
            Sacrificial Magnesium Anode Architecture
          </h4>
          <BodyText className="mt-3" variant="secondary">
            Flip the paradigm: design the anode to corrode productively.
            Magnesium anodes dissolve to produce Mg(OH)₂ directly—the anode IS
            the alkalinity product.
          </BodyText>

          <div className="mt-6 flex items-center gap-6">
            <ConfidenceMeter value={50} label="confidence" />
            <div className="h-4 w-px bg-zinc-200" />
            <span className="text-[14px] text-zinc-500">$20-40K · 8-12 weeks</span>
          </div>

          <div className="mt-6 rounded-lg bg-zinc-100 p-4">
            <p className="text-[14px] font-medium text-zinc-700">
              Breakthrough potential: Energy consumption could drop from 2.5-3.5
              kWh/kg to &lt;0.5 kWh/kg
            </p>
          </div>
        </motion.div>
      </section>

      <SectionDivider />

      {/* ============================================ */}
      {/* RISKS & WATCHOUTS */}
      {/* ============================================ */}
      <section
        id={`${report.id}-risks`}
        ref={setSectionRef('risks')}
        className="scroll-mt-8"
      >
        <SectionHeader
          label="Section 05"
          title="Risks & Watchouts"
          description="What could go wrong and how to mitigate."
        />

        <div className="space-y-4">
          {[
            {
              risk: 'Seawater variability may cause performance inconsistency',
              category: 'Technical',
              severity: 'medium' as const,
              mitigation: 'Design for operational flexibility; test across multiple sites',
            },
            {
              risk: 'Carbon credit pricing may not support $60-80/ton CO₂',
              category: 'Market',
              severity: 'high' as const,
              mitigation: 'Target voluntary market premium buyers',
            },
            {
              risk: 'Ocean discharge may face permitting challenges',
              category: 'Regulatory',
              severity: 'high' as const,
              mitigation: 'Engage regulators early; develop robust MRV',
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={cn(
                'rounded-xl border p-6',
                item.severity === 'high'
                  ? 'border-zinc-300 bg-zinc-50'
                  : 'border-zinc-200 bg-white',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                        item.severity === 'high'
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-200 text-zinc-600',
                      )}
                    >
                      {item.severity}
                    </span>
                    <span className="text-[12px] text-zinc-400">{item.category}</span>
                  </div>
                  <p className="mt-3 text-[17px] font-medium text-zinc-900">
                    {item.risk}
                  </p>
                  <div className="mt-4">
                    <MonoLabel variant="muted">Mitigation</MonoLabel>
                    <BodyText className="mt-1" size="sm" variant="secondary">
                      {item.mitigation}
                    </BodyText>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* ============================================ */}
      {/* RECOMMENDATION */}
      {/* ============================================ */}
      <section
        id={`${report.id}-recommendation`}
        ref={setSectionRef('recommendation')}
        className="scroll-mt-8"
      >
        <SectionHeader
          label="Section 06"
          title="Recommendation"
          description="If this were my project, here's what I'd do."
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-8"
        >
          <BodyText size="lg">
            I&apos;d start with the boring stuff that works. Get an EDR system
            from Evoqua or Suez, modify it for seawater with more frequent
            polarity reversal, and add precipitation steering targets upstream.
          </BodyText>
          <BodyText className="mt-6" size="lg">
            Run it for 3 months in real seawater and measure everything.
            That&apos;s your baseline.
          </BodyText>
          <BodyText className="mt-6" variant="secondary">
            While that&apos;s running, set up a parallel bench test on
            sacrificial Mg anodes. The one thing I would NOT do is chase exotic
            materials until the simpler approaches hit a wall.
          </BodyText>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-1 w-12 rounded-full bg-zinc-900" />
            <span className="text-[14px] font-medium text-zinc-700">
              Start simple. Measure everything. Then iterate.
            </span>
          </div>
        </motion.div>
      </section>

      {/* End spacer */}
      <div className="h-12" />
    </div>
  );
}
