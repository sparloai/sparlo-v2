'use client';

import { useEffect, useRef } from 'react';

import type { ExampleReport } from './data/types';
import {
  DataTable,
  InsightCallout,
  Prose,
  SectionHeader,
  SolutionCard,
  ViabilityBadge,
} from './content-blocks';

interface ReportContentProps {
  report: ExampleReport;
  onActiveSectionChange: (sectionId: string) => void;
}

export function ReportContent({
  report,
  onActiveSectionChange,
}: ReportContentProps) {
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Intersection observer for active section tracking
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
    <div className="max-w-[680px] p-6 md:p-8">
      {/* Header */}
      <header className="mb-8 border-b border-zinc-200 pb-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {report.category}
        </p>
        <h1 className="mb-2 text-xl font-semibold leading-tight text-zinc-900">
          {report.title}
        </h1>
        <p className="text-sm text-zinc-500">{report.subtitle}</p>
      </header>

      {/* Executive Summary */}
      <section
        id={`${report.id}-executive-summary`}
        ref={setSectionRef('executive-summary')}
        className="mb-10"
      >
        <SectionHeader>Executive Summary</SectionHeader>

        <div className="mb-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            The Assessment
          </p>
          <Prose>
            The desalination industry solved seawater fouling decades ago with
            electrodialysis reversal—polarity switching every 15-30 minutes that
            dissolves scale and kills biofilms before they mature. Mikhaylin &
            Bazinet&apos;s 2016 review documents 5-10x membrane life extension
            with this single intervention.
          </Prose>
        </div>

        <ViabilityBadge status="viable">
          Viable with high confidence using proven technologies
        </ViabilityBadge>

        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Primary Recommendation
          </p>
          <Prose>
            Implement polarity reversal (5-15 minute cycles for seawater)
            combined with modular cartridge electrodes designed for 6-12 month
            hot-swap replacement. Target $60-80/ton CO₂ equivalent with 70%+
            capacity factor. First validation: 3-month seawater exposure test,
            $50-100K.
          </Prose>
        </div>
      </section>

      {/* Problem Analysis */}
      <section
        id={`${report.id}-problem-analysis`}
        ref={setSectionRef('problem-analysis')}
        className="mb-10"
      >
        <SectionHeader>Problem Analysis</SectionHeader>

        <div className="mb-5">
          <h3 className="mb-2 text-[14px] font-semibold text-zinc-900">
            What&apos;s Wrong
          </h3>
          <Prose>
            Seawater destroys electrochemical systems through three simultaneous
            attack vectors: chloride ions corrode metals and degrade membranes
            within weeks; biofilms establish within 24-48 hours; and mineral
            scale precipitates directly onto electrode surfaces. Current
            approaches designed for purified brine fail catastrophically.
          </Prose>
        </div>

        <div className="mb-5">
          <h3 className="mb-2 text-[14px] font-semibold text-zinc-900">
            Why It&apos;s Hard
          </h3>
          <Prose>
            The fundamental challenge is thermodynamic: chlorine evolution is
            kinetically favored over oxygen evolution on most catalysts in
            chloride-rich solutions. The 490mV window exists but requires
            precisely engineered catalyst surfaces to exploit.
          </Prose>
        </div>

        <InsightCallout
          title="First Principles Insight"
          subtitle="Optimize for $/kg-NaOH-lifetime, not component longevity"
        >
          The 5-year electrode life target may be self-imposed rather than
          economically optimal. If electrode replacement is cheap and fast
          enough, designing for 6-12 month disposable electrodes might beat
          5-year hardened electrodes on total cost.
        </InsightCallout>
      </section>

      {/* Solution Concepts */}
      <section
        id={`${report.id}-solution-concepts`}
        ref={setSectionRef('solution-concepts')}
        className="mb-10"
      >
        <SectionHeader>Solution Concepts</SectionHeader>

        <Prose className="mb-5">
          Solution concepts use proven technologies requiring integration, not
          invention. These represent the lowest-risk path to meeting the $80/ton
          CO₂ target.
        </Prose>

        <SolutionCard
          title="Polarity Reversal + Modular Cartridge Architecture"
          type="CATALOG"
          confidence={85}
          investment="$0.5-2M"
          timeline="6-12 months"
          summary="Combine proven EDR-style polarity reversal (5-15 minute cycles) with modular cartridge electrodes designed for 6-12 month hot-swap replacement."
          defaultExpanded={true}
        >
          <InsightCallout
            title="The Insight"
            subtitle="Periodic electrochemical stress disrupts fouling equilibrium"
            className="mb-4"
          >
            <p>
              <strong>Domain:</strong> Desalination industry (EDR)
            </p>
            <p>
              <strong>Why industry missed it:</strong> The electrolyzer industry
              inherited chlor-alkali assumptions about continuous operation.
            </p>
          </InsightCallout>
        </SolutionCard>

        <SolutionCard
          title="Accept Chlorine + Downstream Mineral Neutralization"
          type="FALLBACK"
          confidence={75}
          investment="$1-3M"
          timeline="12-18 months"
          summary="Stop fighting chlorine evolution. Accept mixed Cl₂/O₂ production and react chlorine with olivine slurry downstream. This is the Equatic approach."
          className="mt-4"
        />

        <SolutionCard
          title="Geothermal-Inspired Precipitation Steering"
          type="COMPLEMENTARY"
          confidence={80}
          investment="$50-200K"
          timeline="3-6 months"
          summary="Install sacrificial 'scaling targets' upstream of electrodes that preferentially nucleate Mg(OH)₂ and CaCO₃. Standard practice in geothermal plants."
          className="mt-4"
        />
      </section>

      {/* Innovation Concepts */}
      <section
        id={`${report.id}-innovation-concepts`}
        ref={setSectionRef('innovation-concepts')}
        className="mb-10"
      >
        <SectionHeader>Innovation Concepts</SectionHeader>

        <Prose className="mb-5">
          Higher-risk explorations with breakthrough potential. These are
          parallel bets that could transform the economics if successful.
        </Prose>

        <SolutionCard
          title="Sacrificial Magnesium Anode Architecture"
          type="PARADIGM"
          confidence={50}
          investment="$20-40K"
          timeline="8-12 weeks"
          summary="Flip the paradigm: design the anode to corrode productively. Magnesium anodes dissolve to produce Mg(OH)₂ directly—the anode IS the alkalinity product."
        >
          <InsightCallout
            title="The Insight"
            subtitle="The electrode can BE the product—dissolution is production, not failure"
          >
            <p>
              <strong>Breakthrough potential:</strong> Energy consumption could
              drop from 2.5-3.5 kWh/kg to &lt;0.5 kWh/kg.
            </p>
          </InsightCallout>
        </SolutionCard>
      </section>

      {/* Risks */}
      <section
        id={`${report.id}-risks`}
        ref={setSectionRef('risks')}
        className="mb-10"
      >
        <SectionHeader>Risks & Watchouts</SectionHeader>

        <DataTable
          headers={['Risk', 'Severity', 'Mitigation']}
          rows={[
            [
              'Seawater variability may cause performance inconsistency',
              'Medium',
              'Design for operational flexibility; test across multiple sites',
            ],
            [
              'Carbon credit pricing may not support $60-80/ton CO₂',
              'High',
              'Target voluntary market premium buyers',
            ],
            [
              'Ocean discharge may face permitting challenges',
              'High',
              'Engage regulators early; develop robust MRV',
            ],
            [
              'Polarity reversal energy penalty may exceed 20%',
              'Medium',
              'Validate early; have fallback architecture',
            ],
          ]}
        />
      </section>

      {/* Recommendation */}
      <section
        id={`${report.id}-recommendation`}
        ref={setSectionRef('recommendation')}
        className="mb-10"
      >
        <SectionHeader>Recommendation</SectionHeader>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            If This Were My Project
          </p>
          <Prose>
            I&apos;d start with the boring stuff that works. Get an EDR system
            from Evoqua or Suez, modify it for seawater with more frequent
            polarity reversal, and add precipitation steering targets upstream.
            Run it for 3 months in real seawater and measure everything.
            That&apos;s your baseline.
          </Prose>
          <Prose className="mt-3">
            While that&apos;s running, set up a parallel bench test on
            sacrificial Mg anodes. The one thing I would NOT do is chase exotic
            materials until the simpler approaches hit a wall.
          </Prose>
        </div>
      </section>
    </div>
  );
}
