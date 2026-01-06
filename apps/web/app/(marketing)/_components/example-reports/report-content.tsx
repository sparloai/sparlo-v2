'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@kit/ui/utils';

import type { ExampleReport } from './data/types';

interface ReportContentProps {
  report: ExampleReport;
  onActiveSectionChange: (sectionId: string) => void;
}

// ============================================
// TYPOGRAPHY PRIMITIVES (matching brand system)
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
        'text-[13px] font-semibold uppercase tracking-[0.06em]',
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
    lg: 'text-[22px]',
    md: 'text-[18px]',
    sm: 'text-[16px]',
  };

  const variantClasses = {
    primary: 'text-[#1e1e1e]',
    secondary: 'text-zinc-600',
    muted: 'text-zinc-500',
  };

  return (
    <p
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        'leading-[1.3] tracking-[-0.02em]',
        className,
      )}
    >
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[36px] font-semibold tracking-tight text-zinc-900">
      {children}
    </h2>
  );
}

function ContentBlock({
  children,
  withBorder = false,
}: {
  children: React.ReactNode;
  withBorder?: boolean;
}) {
  return (
    <div className={cn(withBorder && 'mt-12 border-t border-zinc-200 pt-8')}>
      {children}
    </div>
  );
}

function AccentBorder({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-10 border-l-4 border-zinc-900 pl-6">{children}</div>
  );
}

function HighlightBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-none border border-zinc-200 bg-zinc-50 p-8">
      {children}
    </div>
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
    <div className="max-w-[70ch] px-6 py-10 md:px-10 md:py-12">
      {/* Report Header */}
      <header className="mb-16">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
          {report.category}
        </span>
        <h1 className="mt-3 text-[36px] font-semibold leading-[1.1] tracking-tight text-zinc-900 lg:text-[42px]">
          {report.title}
        </h1>
        <p className="mt-3 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-500">
          {report.subtitle}
        </p>
        <div className="mt-4 flex items-center gap-3 text-[13px] tracking-[-0.02em] text-zinc-400">
          <span>{report.readTime}</span>
          <span className="text-zinc-300">·</span>
          <span>{report.pages} pages</span>
          <span className="text-zinc-300">·</span>
          <span>{report.patents} patents cited</span>
        </div>
      </header>

      {/* ============================================ */}
      {/* EXECUTIVE SUMMARY */}
      {/* ============================================ */}
      <section
        id={`${report.id}-executive-summary`}
        ref={setSectionRef('executive-summary')}
        className="mt-24"
      >
        <SectionTitle>Executive Summary</SectionTitle>

        <article className="mt-12 md:border-l-2 md:border-zinc-900 md:pl-10">
          <MonoLabel>The Assessment</MonoLabel>
          <BodyText size="lg" className="mt-8">
            The desalination industry solved seawater fouling decades ago with
            electrodialysis reversal—polarity switching every 15-30 minutes that
            dissolves scale and kills biofilms before they mature. Mikhaylin &
            Bazinet&apos;s 2016 review documents 5-10x membrane life extension
            with this single intervention.
          </BodyText>

          <ContentBlock withBorder>
            <MonoLabel>Viability</MonoLabel>
            <p className="mt-8 text-[18px] font-medium leading-[1.3] tracking-[-0.02em] text-zinc-900">
              Viable with high confidence using proven technologies
            </p>
          </ContentBlock>

          <ContentBlock withBorder>
            <MonoLabel>Primary Recommendation</MonoLabel>
            <BodyText className="mt-8">
              Implement polarity reversal (5-15 minute cycles for seawater)
              combined with modular cartridge electrodes designed for 6-12 month
              hot-swap replacement. Target $60-80/ton CO₂ equivalent with 70%+
              capacity factor. First validation: 3-month seawater exposure test,
              $50-100K.
            </BodyText>
          </ContentBlock>
        </article>
      </section>

      {/* ============================================ */}
      {/* PROBLEM ANALYSIS */}
      {/* ============================================ */}
      <section
        id={`${report.id}-problem-analysis`}
        ref={setSectionRef('problem-analysis')}
        className="mt-24"
      >
        <SectionTitle>Problem Analysis</SectionTitle>

        <article className="mt-12 md:border-l-2 md:border-zinc-900 md:pl-10">
          <MonoLabel>What&apos;s Wrong</MonoLabel>
          <BodyText className="mt-8">
            Seawater destroys electrochemical systems through three simultaneous
            attack vectors: chloride ions corrode metals and degrade membranes
            within weeks; biofilms establish within 24-48 hours; and mineral
            scale precipitates directly onto electrode surfaces. Current
            approaches designed for purified brine fail catastrophically.
          </BodyText>

          <ContentBlock withBorder>
            <MonoLabel>Why It&apos;s Hard</MonoLabel>
            <BodyText className="mt-8">
              The fundamental challenge is thermodynamic: chlorine evolution is
              kinetically favored over oxygen evolution on most catalysts in
              chloride-rich solutions. The 490mV window exists but requires
              precisely engineered catalyst surfaces to exploit.
            </BodyText>
          </ContentBlock>

          <AccentBorder>
            <MonoLabel variant="muted">First Principles Insight</MonoLabel>
            <p className="mt-3 text-[20px] font-medium leading-[1.3] tracking-[-0.02em] text-zinc-900">
              Optimize for $/kg-NaOH-lifetime, not component longevity
            </p>
            <BodyText className="mt-4" variant="secondary">
              The 5-year electrode life target may be self-imposed rather than
              economically optimal. If electrode replacement is cheap and fast
              enough, designing for 6-12 month disposable electrodes might beat
              5-year hardened electrodes on total cost.
            </BodyText>
          </AccentBorder>
        </article>
      </section>

      {/* ============================================ */}
      {/* SOLUTION CONCEPTS */}
      {/* ============================================ */}
      <section
        id={`${report.id}-solution-concepts`}
        ref={setSectionRef('solution-concepts')}
        className="mt-24"
      >
        <SectionTitle>Solution Concepts</SectionTitle>

        <BodyText className="mt-6" variant="secondary">
          Solution concepts use proven technologies requiring integration, not
          invention. These represent the lowest-risk path to meeting the $80/ton
          CO₂ target.
        </BodyText>

        {/* Primary Recommendation */}
        <article className="mt-12 space-y-12 md:border-l-2 md:border-zinc-900 md:pl-10">
          <header className="space-y-4">
            <MonoLabel>Primary Recommendation</MonoLabel>
            <h3 className="text-[28px] font-semibold leading-tight tracking-tight text-zinc-900">
              Polarity Reversal + Modular Cartridge Architecture
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-[13px]">
              <span className="text-zinc-500">Catalog Solution</span>
              <span className="text-zinc-300">·</span>
              <span className="text-zinc-500">Desalination Industry</span>
              <span className="text-zinc-300">·</span>
              <span className="font-medium text-zinc-700">85% confidence</span>
            </div>
          </header>

          <div>
            <MonoLabel>Bottom Line</MonoLabel>
            <BodyText className="mt-4">
              Combine proven EDR-style polarity reversal (5-15 minute cycles)
              with modular cartridge electrodes designed for 6-12 month hot-swap
              replacement.
            </BodyText>
          </div>

          <AccentBorder>
            <MonoLabel variant="muted">The Insight</MonoLabel>
            <p className="mt-3 text-[20px] font-medium leading-[1.3] tracking-[-0.02em] text-zinc-900">
              Periodic electrochemical stress disrupts fouling equilibrium
            </p>
            <div className="mt-4 space-y-2 text-[16px] text-zinc-600">
              <p>
                <span className="font-medium text-zinc-500">Domain:</span>{' '}
                Desalination industry (EDR)
              </p>
              <p>
                <span className="font-medium text-zinc-500">
                  Why industry missed it:
                </span>{' '}
                The electrolyzer industry inherited chlor-alkali assumptions
                about continuous operation.
              </p>
            </div>
          </AccentBorder>

          <ContentBlock withBorder>
            <HighlightBox>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <MonoLabel variant="muted">Investment</MonoLabel>
                  <p className="mt-2 text-[18px] font-medium text-zinc-900">
                    $0.5-2M
                  </p>
                </div>
                <div>
                  <MonoLabel variant="muted">Timeline</MonoLabel>
                  <p className="mt-2 text-[18px] font-medium text-zinc-900">
                    6-12 months
                  </p>
                </div>
                <div>
                  <MonoLabel variant="muted">Expected Improvement</MonoLabel>
                  <p className="mt-2 text-[18px] font-medium text-zinc-900">
                    5-10x membrane life
                  </p>
                </div>
              </div>
            </HighlightBox>
          </ContentBlock>
        </article>

        {/* Supporting Concepts */}
        <div className="mt-20">
          <h3 className="text-[28px] font-semibold tracking-tight text-zinc-900">
            Supporting Concepts
          </h3>

          <div className="mt-10 space-y-16">
            {/* Fallback */}
            <div className="max-w-[70ch]">
              <div className="flex items-baseline justify-between gap-4">
                <h4 className="text-[20px] font-semibold tracking-tight text-zinc-900">
                  Accept Chlorine + Downstream Mineral Neutralization
                </h4>
                <span className="text-[13px] uppercase tracking-wide text-zinc-400">
                  Fallback
                </span>
              </div>
              <p className="mt-3 text-[18px] italic leading-[1.3] tracking-[-0.02em] text-zinc-600">
                75% confidence · $1-3M · 12-18 months
              </p>
              <div className="mt-6">
                <MonoLabel>What It Is</MonoLabel>
                <BodyText className="mt-2">
                  Stop fighting chlorine evolution. Accept mixed Cl₂/O₂
                  production and react chlorine with olivine slurry downstream.
                  This is the Equatic approach.
                </BodyText>
              </div>
            </div>

            {/* Complementary */}
            <div className="max-w-[70ch]">
              <div className="flex items-baseline justify-between gap-4">
                <h4 className="text-[20px] font-semibold tracking-tight text-zinc-900">
                  Geothermal-Inspired Precipitation Steering
                </h4>
                <span className="text-[13px] uppercase tracking-wide text-zinc-400">
                  Complementary
                </span>
              </div>
              <p className="mt-3 text-[18px] italic leading-[1.3] tracking-[-0.02em] text-zinc-600">
                80% confidence · $50-200K · 3-6 months
              </p>
              <div className="mt-6">
                <MonoLabel>What It Is</MonoLabel>
                <BodyText className="mt-2">
                  Install sacrificial &quot;scaling targets&quot; upstream of
                  electrodes that preferentially nucleate Mg(OH)₂ and CaCO₃.
                  Standard practice in geothermal plants.
                </BodyText>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* INNOVATION CONCEPTS */}
      {/* ============================================ */}
      <section
        id={`${report.id}-innovation-concepts`}
        ref={setSectionRef('innovation-concepts')}
        className="mt-24"
      >
        <SectionTitle>Innovation Concepts</SectionTitle>

        <BodyText className="mt-6" variant="secondary">
          Higher-risk explorations with breakthrough potential. These are
          parallel bets that could transform the economics if successful.
        </BodyText>

        <div className="mt-10 max-w-[70ch]">
          <div className="flex items-baseline justify-between gap-4">
            <h4 className="text-[20px] font-semibold tracking-tight text-zinc-900">
              Sacrificial Magnesium Anode Architecture
            </h4>
            <span className="text-[13px] uppercase tracking-wide text-zinc-400">
              Paradigm
            </span>
          </div>
          <p className="mt-3 text-[18px] italic leading-[1.3] tracking-[-0.02em] text-zinc-600">
            50% confidence · $20-40K · 8-12 weeks
          </p>
          <div className="mt-6">
            <MonoLabel>What It Is</MonoLabel>
            <BodyText className="mt-2">
              Flip the paradigm: design the anode to corrode productively.
              Magnesium anodes dissolve to produce Mg(OH)₂ directly—the anode IS
              the alkalinity product.
            </BodyText>
          </div>

          <AccentBorder>
            <MonoLabel variant="muted">The Insight</MonoLabel>
            <p className="mt-3 text-[20px] font-medium leading-[1.3] tracking-[-0.02em] text-zinc-900">
              The electrode can BE the product—dissolution is production, not
              failure
            </p>
            <BodyText className="mt-4" variant="secondary">
              <strong>Breakthrough potential:</strong> Energy consumption could
              drop from 2.5-3.5 kWh/kg to &lt;0.5 kWh/kg.
            </BodyText>
          </AccentBorder>
        </div>
      </section>

      {/* ============================================ */}
      {/* RISKS & WATCHOUTS */}
      {/* ============================================ */}
      <section
        id={`${report.id}-risks`}
        ref={setSectionRef('risks')}
        className="mt-24"
      >
        <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900">
          Risks & Watchouts
        </h2>
        <p className="mt-2 text-[18px] text-zinc-500">What could go wrong.</p>

        <div className="mt-10 max-w-[70ch] space-y-10">
          {[
            {
              risk: 'Seawater variability may cause performance inconsistency',
              category: 'Technical',
              severity: 'medium' as const,
              mitigation:
                'Design for operational flexibility; test across multiple sites',
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
            {
              risk: 'Polarity reversal energy penalty may exceed 20%',
              category: 'Technical',
              severity: 'medium' as const,
              mitigation: 'Validate early; have fallback architecture',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`md:border-l-2 md:pl-6 ${
                item.severity === 'high'
                  ? 'md:border-zinc-400'
                  : 'md:border-zinc-200'
              }`}
            >
              <p className="text-[18px] font-medium leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]">
                {item.risk}
              </p>
              <div className="mt-2 flex items-center gap-3 text-[13px]">
                <span className="text-zinc-500">{item.category}</span>
                <span className="text-zinc-300">·</span>
                <span
                  className={
                    item.severity === 'high'
                      ? 'font-medium text-zinc-700'
                      : 'text-zinc-500'
                  }
                >
                  {item.severity.charAt(0).toUpperCase() +
                    item.severity.slice(1)}{' '}
                  severity
                </span>
              </div>
              <div className="mt-4">
                <MonoLabel variant="muted">Mitigation</MonoLabel>
                <BodyText className="mt-2" variant="secondary">
                  {item.mitigation}
                </BodyText>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* RECOMMENDATION */}
      {/* ============================================ */}
      <section
        id={`${report.id}-recommendation`}
        ref={setSectionRef('recommendation')}
        className="mt-24"
      >
        <SectionTitle>Recommendation</SectionTitle>

        <article className="mt-12 md:border-l-2 md:border-zinc-900 md:pl-10">
          <MonoLabel>If This Were My Project</MonoLabel>
          <BodyText className="mt-8">
            I&apos;d start with the boring stuff that works. Get an EDR system
            from Evoqua or Suez, modify it for seawater with more frequent
            polarity reversal, and add precipitation steering targets upstream.
            Run it for 3 months in real seawater and measure everything.
            That&apos;s your baseline.
          </BodyText>
          <BodyText className="mt-6">
            While that&apos;s running, set up a parallel bench test on
            sacrificial Mg anodes. The one thing I would NOT do is chase exotic
            materials until the simpler approaches hit a wall.
          </BodyText>
        </article>
      </section>
    </div>
  );
}
