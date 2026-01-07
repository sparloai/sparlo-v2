'use client';

/**
 * Showcase Gallery Component
 *
 * Card-based progressive disclosure pattern for Example Reports on the landing page.
 *
 * Features:
 * - Horizontal tabs for report switching with animated indicator
 * - Accordion cards for section previews (one expanded at a time)
 * - Uses existing section components with variant="preview"
 * - "View Full Report" button opens modal with complete BrandSystemReport
 * - Responsive design with mobile-optimized layouts
 *
 * Architecture:
 * - Uses Radix Tabs for accessible tab navigation
 * - Uses Radix Accordion for expandable section cards
 * - Reuses existing section components with preview variant
 * - State managed via useShowcaseState hook with race condition protection
 */
import { lazy, memo, Suspense, useMemo } from 'react';

import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@kit/ui/accordion';
import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@kit/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { cn } from '@kit/ui/utils';

import { ChallengeFrameSection } from '~/app/reports/[id]/_components/brand-system/sections/challenge-frame';
import { ConstraintsSection } from '~/app/reports/[id]/_components/brand-system/sections/constraints';
import { ExecutiveSummarySection } from '~/app/reports/[id]/_components/brand-system/sections/executive-summary';
import { FrontierTechnologiesSection } from '~/app/reports/[id]/_components/brand-system/sections/frontier-technologies';
import { InnovationConceptsSection } from '~/app/reports/[id]/_components/brand-system/sections/innovation-concepts';
import { ProblemAnalysisSection } from '~/app/reports/[id]/_components/brand-system/sections/problem-analysis';
import { RecommendationSection } from '~/app/reports/[id]/_components/brand-system/sections/recommendation';
import { RisksWatchoutsSection } from '~/app/reports/[id]/_components/brand-system/sections/risks-watchouts';
import { SelfCritiqueSection } from '~/app/reports/[id]/_components/brand-system/sections/self-critique';
import { SolutionConceptsSection } from '~/app/reports/[id]/_components/brand-system/sections/solution-concepts';
import type { HybridReportData } from '~/app/reports/_lib/types/hybrid-report-display.types';

import { getAvailableSections, REPORTS_CONFIG, type SectionConfig } from './config';
import type { ReportId, SectionId } from './types';
import { useShowcaseState } from './use-showcase-state';

// Lazy load the full report modal for better initial load performance
const BrandSystemReport = lazy(
  () =>
    import('~/app/reports/[id]/_components/brand-system/brand-system-report').then(
      (mod) => ({ default: mod.BrandSystemReport }),
    ),
);

/**
 * Render section content based on section ID
 *
 * Shows full section content (not preview) to demonstrate the depth
 * of analysis in each report section.
 */
function SectionPreviewContent({
  sectionId,
  data,
}: {
  sectionId: SectionId;
  data: HybridReportData;
}) {
  // Use full variant to show complete section content
  // This demonstrates the technical depth of the reports
  switch (sectionId) {
    case 'executive-summary':
      return (
        <ExecutiveSummarySection
          data={data.executive_summary}
          brief={data.brief}
        />
      );
    case 'problem-analysis':
      return <ProblemAnalysisSection data={data.problem_analysis} />;
    case 'constraints':
      return <ConstraintsSection data={data.constraints_and_metrics} />;
    case 'challenge-frame':
      return <ChallengeFrameSection data={data.challenge_the_frame} />;
    case 'solution-concepts':
      return <SolutionConceptsSection data={data.execution_track} />;
    case 'innovation-concepts':
      return <InnovationConceptsSection data={data.innovation_portfolio} />;
    case 'frontier-tech':
      return (
        <FrontierTechnologiesSection
          data={data.innovation_portfolio?.frontier_watch}
        />
      );
    case 'risks':
      return <RisksWatchoutsSection data={data.risks_and_watchouts} />;
    case 'self-critique':
      return <SelfCritiqueSection data={data.self_critique} />;
    case 'recommendation':
      return (
        <RecommendationSection
          personalRecommendation={data.strategic_integration?.personal_recommendation}
        />
      );
    default:
      return null;
  }
}

/**
 * Section Card Component - Individual expandable card
 *
 * Technical document aesthetic:
 * - Left border accent (Sparlo signature pattern)
 * - Monospace metrics for data precision
 * - Section numbering for document structure
 * - Sharp corners on left, rounded on right
 */
const SectionCard = memo(function SectionCard({
  section,
  data,
  index,
}: {
  section: SectionConfig;
  data: HybridReportData;
  index: number;
}) {
  const headline = section.getHeadline(data);
  const metrics = section.getMetrics(data);
  const sectionNumber = String(index + 1).padStart(2, '0');

  return (
    <AccordionItem
      value={section.id}
      className="group overflow-hidden rounded-r-lg border border-l-2 border-zinc-200 border-l-zinc-300 bg-white transition-colors data-[state=open]:border-l-zinc-900"
    >
      <AccordionTrigger
        className={cn(
          'w-full px-6 py-5 text-left',
          'flex items-start justify-between gap-4',
          'transition-colors duration-200',
          'hover:bg-zinc-50/50 hover:no-underline',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900',
        )}
      >
        <div className="min-w-0 flex-1 text-left">
          {/* Section Header with Number */}
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[11px] font-medium text-zinc-400">
              {sectionNumber}
            </span>
            <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-zinc-500">
              {section.title}
            </span>
          </div>

          {/* Headline Preview */}
          <p className="mt-2 line-clamp-2 text-[15px] leading-snug text-zinc-900">
            {headline}
          </p>

          {/* Metrics - Monospace for technical precision */}
          {metrics.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              {metrics.map((metric, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500"
                >
                  <span className="font-mono font-semibold text-zinc-700">{metric.value}</span>
                  {metric.label && <span className="text-zinc-400">{metric.label}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent className="border-t border-zinc-100 bg-zinc-50/30 px-6 pb-8 pt-6">
        {/* Hide section titles since they're already in the card header */}
        <div className="showcase-section-content [&_[data-section-title]]:hidden [&>section>h2]:hidden [&>section]:pt-0">
          <SectionPreviewContent sectionId={section.id} data={data} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
});

/**
 * Full Report Modal
 */
const FullReportModal = memo(function FullReportModal({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: HybridReportData;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="fixed inset-4 h-auto max-h-[calc(100vh-2rem)] max-w-none overflow-y-auto rounded-xl bg-white p-0 shadow-2xl md:inset-8 lg:inset-12">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
          <DialogTitle className="text-lg font-semibold text-zinc-900">
            {data.title}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              Close
            </Button>
          </DialogClose>
        </div>
        <div className="p-6">
          <Suspense
            fallback={
              <div className="flex h-96 items-center justify-center">
                <div className="text-zinc-500">Loading report...</div>
              </div>
            }
          >
            <BrandSystemReport
              reportData={data}
              showToc={false}
              brief={data.brief}
              createdAt={new Date().toISOString()}
              hasAppSidebar={false}
              showActions={false}
              compactTitle={true}
            />
          </Suspense>
        </div>
      </DialogContent>
    </Dialog>
  );
});

/**
 * Main Showcase Gallery Component
 */
export const ShowcaseGallery = memo(function ShowcaseGallery() {
  const { state, actions } = useShowcaseState('carbon-removal');

  // Get current report config and data
  const currentReport = useMemo(
    () => REPORTS_CONFIG.find((r) => r.id === state.activeReportId)!,
    [state.activeReportId],
  );

  const reportData = currentReport.data;

  // Get available sections for current report
  const availableSections = useMemo(
    () => getAvailableSections(reportData),
    [reportData],
  );

  // Default to first section expanded
  const expandedSection = state.expandedSectionId || availableSections[0]?.id || null;

  return (
    <section
      id="example-reports"
      className="relative bg-white dark:bg-zinc-950"
    >
      {/* Section Header */}
      <div className="border-t border-zinc-200 px-8 pt-24 pb-12 md:px-16 lg:px-24 dark:border-zinc-800">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="text-[28px] leading-[1.2] font-normal tracking-[-0.02em] text-zinc-900 md:text-[36px] dark:text-white">
            Example Reports
          </h2>
          <p className="mt-4 max-w-[50ch] text-lg leading-[1.2] font-normal tracking-[-0.02em] text-zinc-500 dark:text-zinc-400">
            Explore real innovation intelligence reports across industries.
          </p>
        </div>
      </div>

      {/* Tab Navigation - Sticky below main nav */}
      <Tabs
        value={state.activeReportId}
        onValueChange={(v: string) => actions.selectReport(v as ReportId)}
      >
        <TabsList
          className="sticky top-16 z-40 h-auto w-full justify-start rounded-none border-y border-zinc-200 bg-white/95 px-0 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95"
          aria-label="Select a report"
        >
          <div className="relative mx-auto max-w-4xl w-full">
            <div className="no-scrollbar flex gap-1 overflow-x-auto px-4 py-3">
              {REPORTS_CONFIG.map((report) => {
                const isActive = state.activeReportId === report.id;
                return (
                  <TabsTrigger
                    key={report.id}
                    value={report.id}
                    className={cn(
                      'relative rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap',
                      'transition-colors duration-150',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900',
                      'data-[state=active]:bg-transparent data-[state=active]:shadow-none',
                      isActive
                        ? 'text-zinc-900'
                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700',
                    )}
                  >
                    {/* Mobile: short title, Desktop: full title */}
                    <span className="hidden sm:inline">{report.title}</span>
                    <span className="sm:hidden">{report.shortTitle}</span>

                    {/* Active Indicator with smooth animation */}
                    {isActive && (
                      <motion.div
                        layoutId="showcaseActiveTab"
                        className="absolute inset-0 -z-10 rounded-lg bg-zinc-100"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </TabsTrigger>
                );
              })}
            </div>
            {/* Scroll fade indicator - hints at more content */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white via-white/80 to-transparent lg:hidden" />
          </div>
        </TabsList>
      </Tabs>

      {/* Main Content Area */}
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Report Header - Technical document style */}
        <div className="mb-10 border-l-2 border-zinc-900 pl-6">
          {/* Document metadata bar */}
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-zinc-400">
            <span>INNOVATION INTELLIGENCE REPORT</span>
            <span className="text-zinc-300">·</span>
            <span>~25 min analysis</span>
            <span className="text-zinc-300">·</span>
            <span>47 domains searched</span>
          </div>

          <h3 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-zinc-900 md:text-[26px]">
            {reportData.title}
          </h3>
          {reportData.brief && (
            <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-zinc-600">
              {reportData.brief}
            </p>
          )}
        </div>

        {/* Section Cards */}
        <Accordion
          type="single"
          value={expandedSection ?? undefined}
          onValueChange={(v: string) => actions.expandSection(v as SectionId)}
          collapsible
          className="space-y-3"
        >
          {availableSections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              data={reportData}
              index={index}
            />
          ))}
        </Accordion>

        {/* View Full Report CTA */}
        <div className="mt-8 border-t border-zinc-200 pt-8">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[11px] text-zinc-400">
              <span>10 SECTIONS</span>
              <span className="mx-2 text-zinc-300">·</span>
              <span>~24 PAGES</span>
            </div>
            <Button
              onClick={() => actions.openModal()}
              variant="outline"
              className="inline-flex items-center gap-2 font-mono text-[13px]"
            >
              OPEN FULL REPORT
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Exit Ramp CTA */}
        <div className="mt-16 rounded-r-lg border border-l-2 border-zinc-200 border-l-zinc-900 bg-zinc-50 p-8">
          <div className="font-mono text-[11px] tracking-wide text-zinc-400">
            RUN YOUR OWN ANALYSIS
          </div>
          <h4 className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-zinc-900">
            Get reports like this for your technical challenges
          </h4>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-zinc-600">
            Sparlo searches 47+ technical domains, analyzes patents and papers,
            and delivers first-principles recommendations in ~25 minutes.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="/auth/sign-up"
              className="inline-flex min-h-[44px] items-center rounded-md bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Start Free Analysis
            </a>
            <a
              href="#methodology"
              className="inline-flex min-h-[44px] items-center rounded-md border border-zinc-300 bg-white px-6 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              View Methodology
            </a>
          </div>
        </div>
      </div>

      {/* Full Report Modal */}
      <FullReportModal
        isOpen={state.isModalOpen}
        onClose={() => actions.closeModal()}
        data={reportData}
      />
    </section>
  );
});

export default ShowcaseGallery;
