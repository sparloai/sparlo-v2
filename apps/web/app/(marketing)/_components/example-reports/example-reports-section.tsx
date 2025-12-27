'use client';

import { useState } from 'react';

import { Lock } from 'lucide-react';

import { CardWithHeader, SectionHeader } from '@kit/ui/aura';
import { cn } from '@kit/ui/utils';

import { HybridReportDisplay } from '~/home/(user)/reports/[id]/_components/hybrid-report-display';

import { CLIMATE_HYBRID_REPORT } from './climate-hybrid-data';
import { ENERGY_HYBRID_REPORT } from './energy-hybrid-data';
import { EXAMPLE_REPORTS } from './example-reports-data';
import { FOOD_HYBRID_REPORT } from './food-hybrid-data';
import { FOODTECH_HYBRID_REPORT } from './foodtech-hybrid-data';
import { MATERIALS_SCIENCE_HYBRID_REPORT } from './materials-science-hybrid-data';

/**
 * Example Reports Section
 *
 * Air Company Aesthetic - Clean report display without sidebar TOC
 *
 * Features:
 * - Tab navigation for different reports
 * - Full-width report content (no sidebar)
 * - showToc={false} to hide brand system TOC
 */

export function ExampleReportsSection() {
  const [activeTab, setActiveTab] = useState(0);
  const report = EXAMPLE_REPORTS[activeTab]!;

  return (
    <section
      id="example-reports"
      className="relative min-h-screen bg-white dark:bg-zinc-950"
    >
      {/* Tab Navigation - Sticky below main nav */}
      <div className="sticky top-16 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="no-scrollbar flex gap-1 overflow-x-auto py-1">
            {EXAMPLE_REPORTS.map((r, i) => (
              <button
                key={r.id}
                onClick={() => {
                  setActiveTab(i);
                  window.scrollTo({
                    top:
                      document.getElementById('example-reports')?.offsetTop ??
                      0,
                    behavior: 'smooth',
                  });
                }}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-md px-4 py-2.5 text-[14px] leading-[1.2] font-medium tracking-[-0.02em] whitespace-nowrap transition-all',
                  activeTab === i
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
                )}
              >
                {r.title}
                {r.locked && <Lock className="h-3.5 w-3.5 opacity-50" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Content - Full Width */}
      <div className="px-4 py-10 md:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Report Content */}
          {report.locked ? (
            <LockedOverlay report={report} />
          ) : report.id === 'climate-tech' ? (
            <HybridReportDisplay
              reportData={{
                mode: 'hybrid',
                report: CLIMATE_HYBRID_REPORT,
              }}
              useBrandSystem={true}
              showToc={false}
            />
          ) : report.id === 'food-waste' ? (
            <HybridReportDisplay
              reportData={{
                mode: 'hybrid',
                report: FOOD_HYBRID_REPORT,
              }}
              useBrandSystem={true}
              showToc={false}
            />
          ) : report.id === 'food-tech' ? (
            <HybridReportDisplay
              reportData={{
                mode: 'hybrid',
                report: FOODTECH_HYBRID_REPORT,
              }}
              useBrandSystem={true}
              showToc={false}
            />
          ) : report.id === 'materials-science' ? (
            <HybridReportDisplay
              reportData={{
                mode: 'hybrid',
                report: MATERIALS_SCIENCE_HYBRID_REPORT,
              }}
              useBrandSystem={true}
              showToc={false}
            />
          ) : report.id === 'energy' ? (
            <HybridReportDisplay
              reportData={{
                mode: 'hybrid',
                report: ENERGY_HYBRID_REPORT,
              }}
              useBrandSystem={true}
              showToc={false}
            />
          ) : (
            <ReportContent report={report} />
          )}

          <div className="h-32" />
        </div>
      </div>
    </section>
  );
}

interface Report {
  id: string;
  title: string;
  subtitle: string;
  locked: boolean;
  metadata: {
    readTime: string;
    dataPoints: string;
  };
  sections: {
    id: string;
    number: string;
    title: string;
    content: React.ReactNode;
  }[];
}

function LockedOverlay({ report }: { report: Report }) {
  return (
    <div className="relative min-h-[500px]">
      <div className="pointer-events-none opacity-40 blur-sm">
        <SectionHeader title="Executive Summary" subtitle="The bottom line" />
        <CardWithHeader label="Executive Summary">
          <div className="space-y-4">
            <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </CardWithHeader>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-zinc-950/90">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Lock className="h-6 w-6 text-zinc-500" />
          </div>
          <h3 className="text-[24px] leading-[1.2] font-semibold tracking-[-0.02em] text-zinc-900 dark:text-white">
            Premium Report
          </h3>
          <p className="mt-2 max-w-sm text-[16px] leading-[1.2] tracking-[-0.02em] text-zinc-600 dark:text-zinc-400">
            Sign up to access the full {report.title} analysis and all other
            intelligence reports.
          </p>
          <a
            href="/auth/sign-up"
            className="mt-6 inline-block rounded-md bg-zinc-900 px-6 py-3 text-[14px] leading-[1.2] font-medium tracking-[-0.02em] text-white transition-colors hover:bg-zinc-800"
          >
            Get Started Free
          </a>
        </div>
      </div>
    </div>
  );
}

function ReportContent({ report }: { report: Report }) {
  return (
    <div className="space-y-16">
      {/* Report Header */}
      <header className="mb-12">
        <div className="space-y-4">
          <h1 className="text-[36px] leading-[1.2] font-semibold tracking-[-0.02em] text-zinc-900 lg:text-[48px] dark:text-white">
            {report.title}
          </h1>
          <p className="text-[18px] leading-[1.2] tracking-[-0.02em] text-zinc-600 dark:text-zinc-400">
            {report.subtitle}
          </p>
          <div className="flex items-center gap-3 text-[14px] leading-[1.2] tracking-[-0.02em] text-zinc-500 dark:text-zinc-500">
            <span>{report.metadata.readTime}</span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span>{report.metadata.dataPoints}</span>
          </div>
        </div>
      </header>

      {report.sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-48">
          <SectionHeader
            title={section.title}
            subtitle={getSectionSubtitle(section.id)}
          />
          <CardWithHeader label={section.title}>
            <div className="prose prose-zinc dark:prose-invert prose-p:text-base prose-p:leading-relaxed prose-p:text-zinc-700 dark:prose-p:text-zinc-300 max-w-none">
              {section.content}
            </div>
          </CardWithHeader>
        </section>
      ))}
    </div>
  );
}

function getSectionSubtitle(sectionId: string): string {
  const subtitles: Record<string, string> = {
    brief: 'Original problem statement',
    'executive-summary': 'The bottom line',
    'challenge-the-frame': 'Questioning assumptions',
    'primary-solution': 'Recommended approach',
    'innovation-concept': 'Cross-domain insight',
    risks: 'What could go wrong',
    'next-steps': 'Actionable recommendations',
  };
  return subtitles[sectionId] ?? '';
}
