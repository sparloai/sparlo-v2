'use client';

import { memo, useMemo, useState } from 'react';

import { Lock } from 'lucide-react';

import { CardWithHeader, SectionHeader } from '@kit/ui/aura';
import { cn } from '@kit/ui/utils';

import {
  BrandSystemReport,
  type TocSection,
  generateTocSections,
} from '~/app/reports/[id]/_components/brand-system';
import {
  flattenSectionIds,
  useTocScroll,
} from '~/app/reports/[id]/_lib/hooks/use-toc-scroll';
import type { HybridReportData } from '~/app/reports/_lib/types/hybrid-report-display.types';

import type { Mode } from '../mode-tabs';
import { BIOTECH_HYBRID_REPORT } from './biotech-hybrid-data';
import { CARBON_REMOVAL_HYBRID_REPORT } from './carbon-removal-hybrid-data';
import {
  EXAMPLE_REPORTS,
  INVESTOR_REPORTS,
  INVESTOR_REPORT_DATA_MAP,
} from './example-reports-data';
import { FOOD_HYBRID_REPORT } from './food-hybrid-data';
import { FOODTECH_HYBRID_REPORT } from './foodtech-hybrid-data';
import { GREEN_H2_HYBRID_REPORT } from './green-h2-hybrid-data';
import { MATERIALS_SCIENCE_HYBRID_REPORT } from './materials-science-hybrid-data';

/**
 * Example Reports Section
 *
 * Air Company Aesthetic - Clean report display with sticky TOC
 *
 * Features:
 * - Tab navigation for different reports
 * - Sticky TOC sidebar (within section only)
 * - Two-column layout on desktop
 * - Mode-aware content (Engineers vs Investors)
 */

// Map report IDs to their data
const REPORT_DATA_MAP: Record<string, HybridReportData> = {
  'food-waste': FOOD_HYBRID_REPORT,
  'food-tech': FOODTECH_HYBRID_REPORT,
  biotech: BIOTECH_HYBRID_REPORT,
  'materials-science': MATERIALS_SCIENCE_HYBRID_REPORT,
  'carbon-removal': CARBON_REMOVAL_HYBRID_REPORT,
  'green-h2': GREEN_H2_HYBRID_REPORT,
};

// Section content config per mode
const SECTION_CONTENT = {
  engineers: {
    title: 'Example Reports',
    subtitle: 'Explore real innovation intelligence reports across industries.',
  },
  investors: {
    title: 'Example Reports',
    subtitle:
      'Explore real due diligence reports across climate and deep tech sectors.',
  },
};

// Scroll offset to account for sticky tab bar (top-16 = 64px + ~48px height = ~112px)
// Plus some extra padding for visual breathing room
const LP_SCROLL_OFFSET = 140;

interface ExampleReportsSectionProps {
  mode: Mode;
}

export function ExampleReportsSection({ mode }: ExampleReportsSectionProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [prevMode, setPrevMode] = useState(mode);

  // Get the correct reports array based on mode
  const reports = mode === 'engineers' ? EXAMPLE_REPORTS : INVESTOR_REPORTS;

  // Reset active tab during render when mode changes (React recommended pattern)
  if (prevMode !== mode) {
    setPrevMode(mode);
    setActiveTab(0);
  }

  const report = reports[activeTab]!;

  // Get the hybrid report data for current tab
  // For investors mode, map to existing reports via INVESTOR_REPORT_DATA_MAP
  const reportData = useMemo(() => {
    if (mode === 'investors') {
      const mappedId = INVESTOR_REPORT_DATA_MAP[report.id];
      return mappedId ? REPORT_DATA_MAP[mappedId] : undefined;
    }
    return REPORT_DATA_MAP[report.id];
  }, [mode, report.id]);

  // Generate TOC sections from report data
  const tocSections = useMemo(() => {
    if (!reportData) return [];
    return generateTocSections(reportData as Record<string, unknown>, false);
  }, [reportData]);

  // Flatten section IDs for scroll tracking
  const sectionIds = useMemo(
    () => flattenSectionIds(tocSections),
    [tocSections],
  );

  // Use shared scroll tracking hook for active section detection
  const { activeSection, navigateToSection } = useTocScroll({
    sectionIds,
    scrollOffset: LP_SCROLL_OFFSET,
  });

  const sectionContent = SECTION_CONTENT[mode];

  return (
    <section
      id="example-reports"
      className="relative min-h-screen bg-white dark:bg-zinc-950"
    >
      {/* Section Header */}
      <div className="border-t border-zinc-200 px-8 pt-24 pb-12 md:px-16 lg:px-24 dark:border-zinc-800">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="text-[28px] leading-[1.2] font-normal tracking-[-0.02em] text-zinc-900 md:text-[36px] dark:text-white">
            {sectionContent.title}
          </h2>
          <p className="mt-4 max-w-[50ch] text-lg leading-[1.2] font-normal tracking-[-0.02em] text-zinc-500 dark:text-zinc-400">
            {sectionContent.subtitle}
          </p>
        </div>
      </div>

      {/* Tab Navigation - Sticky below main nav */}
      <div
        id="example-reports-tabs"
        className="sticky top-16 z-40 overflow-x-hidden border-y border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="no-scrollbar flex gap-1 overflow-x-auto py-3">
            {reports.map((r, i) => (
              <button
                key={r.id}
                onClick={() => {
                  setActiveTab(i);
                  // Scroll to the report content area, right below the sticky tabs
                  const contentElement = document.getElementById(
                    'example-reports-content',
                  );
                  if (contentElement) {
                    // nav (64px) + tabs (~56px with py-3) = ~120px offset
                    const navAndTabsHeight = 120;
                    const rect = contentElement.getBoundingClientRect();
                    const absoluteTop = rect.top + window.scrollY;
                    window.scrollTo({
                      top: absoluteTop - navAndTabsHeight,
                      behavior: 'smooth',
                    });
                  }
                }}
                className={cn(
                  'flex min-h-[44px] shrink-0 items-center gap-2 rounded-md px-4 py-2.5 text-base leading-[1.2] font-medium tracking-[-0.02em] whitespace-nowrap transition-all',
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

      {/* Two-column layout: Sticky TOC + Report Content */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div id="example-reports-content" className="flex gap-8 py-10">
          {/* Sticky TOC Sidebar - Hidden on mobile, visible on lg+ */}
          {tocSections.length > 0 && !report.locked && (
            <StickyTocSidebar
              sections={tocSections}
              activeSection={activeSection}
              onNavigate={navigateToSection}
            />
          )}

          {/* Report Content */}
          <div className="min-w-0 flex-1">
            <div className="mx-auto max-w-3xl">
              {report.locked ? (
                <LockedOverlay report={report} />
              ) : reportData ? (
                <BrandSystemReport
                  reportData={reportData}
                  showToc={false}
                  brief={reportData.brief}
                  createdAt={new Date().toISOString()}
                  hasAppSidebar={false}
                  showActions={false}
                  compactTitle={true}
                />
              ) : (
                <ReportContent report={report} />
              )}
              <div className="h-32" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Sticky TOC Sidebar - Only visible within the example reports section
 */
const StickyTocSidebar = memo(function StickyTocSidebar({
  sections,
  activeSection,
  onNavigate,
}: {
  sections: TocSection[];
  activeSection: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      {/* top-36 = 144px to clear the sticky tab bar (top-16 + ~48px height + padding) */}
      <nav className="sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto">
        {/* Contents label */}
        <p className="mb-4 text-xs font-medium tracking-[0.08em] text-zinc-400 uppercase">
          Contents
        </p>

        <ul className="space-y-1 border-l border-zinc-200 pl-4">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => onNavigate(section.id)}
                className={cn(
                  'relative block min-h-[36px] w-full py-2 text-left text-sm transition-colors',
                  activeSection === section.id
                    ? 'font-medium text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900',
                )}
              >
                {/* Active indicator */}
                {activeSection === section.id && (
                  <span className="absolute top-1/2 -left-4 h-4 w-0.5 -translate-y-1/2 bg-zinc-900" />
                )}
                {section.title}
              </button>

              {/* Subsections */}
              {section.subsections && section.subsections.length > 0 && (
                <ul className="mt-1 ml-3 space-y-1">
                  {section.subsections.map((sub) => (
                    <li key={sub.id}>
                      <button
                        onClick={() => onNavigate(sub.id)}
                        className={cn(
                          'block min-h-[32px] w-full py-1.5 text-left text-sm transition-colors',
                          activeSection === sub.id
                            ? 'text-zinc-700'
                            : 'text-zinc-400 hover:text-zinc-600',
                        )}
                      >
                        {sub.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
});

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
          <p className="mt-2 max-w-sm text-base leading-[1.2] tracking-[-0.02em] text-zinc-600 dark:text-zinc-400">
            Sign up to access the full {report.title} analysis and all other
            intelligence reports.
          </p>
          <a
            href="/auth/sign-up"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-md bg-zinc-900 px-6 py-3 text-base leading-[1.2] font-medium tracking-[-0.02em] text-white transition-colors hover:bg-zinc-800"
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
          <p className="text-lg leading-[1.2] tracking-[-0.02em] text-zinc-600 dark:text-zinc-400">
            {report.subtitle}
          </p>
          <div className="flex items-center gap-3 text-base leading-[1.2] tracking-[-0.02em] text-zinc-500 dark:text-zinc-500">
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
