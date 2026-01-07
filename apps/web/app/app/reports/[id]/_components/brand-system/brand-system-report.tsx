/**
 * Brand System Report Display
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * Main wrapper component that renders the complete hybrid report
 * with the brand system styling and Table of Contents.
 *
 * Features:
 * - Typography-driven hierarchy
 * - Near-monochrome palette (zinc-50 through zinc-950)
 * - Graceful handling of unknown fields
 * - Responsive TOC (sidebar on desktop, mobile dropdown)
 */

'use client';

import { memo, useMemo } from 'react';

import { Download, Loader2, Share2 } from 'lucide-react';

import { cn } from '@kit/ui/utils';

import type { HybridReportData } from '~/app/app/reports/_lib/types/hybrid-report-display.types';

import { CHAT_DRAWER_WIDTH } from '../../_lib/constants';
import { useReportActions } from '../../_lib/hooks/use-report-actions';
import {
  TOC_SCROLL_OFFSET,
  TOC_STICKY_TOP,
  flattenSectionIds,
  useTocScroll,
} from '../../_lib/hooks/use-toc-scroll';
import { Section, SectionTitle } from './primitives';
import {
  ChallengeFrameSection,
  ConstraintsSection,
  ExecutiveSummarySection,
  FrontierTechnologiesSection,
  InnovationAnalysisSection,
  InnovationConceptsSection,
  ProblemAnalysisSection,
  RecommendationSection,
  ReferencesSection,
  RisksWatchoutsSection,
  SelfCritiqueSection,
  SolutionConceptsSection,
} from './sections';
import {
  TableOfContents,
  type TocSection,
  generateTocSections,
} from './table-of-contents';

interface BrandSystemReportProps {
  reportData: HybridReportData;
  title?: string;
  /** Whether to show the fixed sidebar TOC. Set to false when embedding in a page with its own TOC. */
  showToc?: boolean;
  /** The user's original input/brief */
  brief?: string;
  /** When the report was created (ISO string) */
  createdAt?: string;
  /**
   * Whether the report is inside a layout with the app sidebar.
   * When true (default), TOC is positioned at left-16 and content has lg:ml-56.
   * When false (landing page), TOC is at left-0 and content has lg:ml-56.
   */
  hasAppSidebar?: boolean;
  /**
   * Whether the chat drawer is open.
   * When true, content shifts right to make room for the 420px chat panel.
   */
  isChatOpen?: boolean;
  /**
   * Whether to show action buttons (Share, Export).
   * Set to false for landing page examples.
   * @default true
   */
  showActions?: boolean;
  /**
   * The report ID for share/export functionality.
   * Required when showActions is true.
   */
  reportId?: string;
  /**
   * Use compact/smaller title styling.
   * Set to true for landing page examples.
   * @default false
   */
  compactTitle?: boolean;
}

// Reading speed constants (words per minute)
const WPM_PROSE = 150; // Technical prose - dense, requires comprehension
const WPM_HEADLINE = 300; // Headlines - scanned quickly
const WPM_LIST_ITEM = 220; // Bullet points - structured, easier to parse
const SECONDS_PER_TABLE_ROW = 3; // Fixed time per table/data row

/**
 * Calculate estimated read time by extracting only rendered content
 * and applying content-type specific reading speeds.
 *
 * This function explicitly extracts text from fields that are actually
 * rendered to users, avoiding metadata, IDs, and non-displayed content.
 */
function calculateReadTime(data: HybridReportData): number {
  let proseWords = 0;
  let headlineWords = 0;
  let listItemWords = 0;
  let tableRows = 0;

  const countWords = (text: string | undefined | null): number => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // Brief - user's original input
  proseWords += countWords(data.brief);

  // Executive Summary
  if (typeof data.executive_summary === 'string') {
    proseWords += countWords(data.executive_summary);
  } else if (data.executive_summary) {
    proseWords += countWords(data.executive_summary.narrative_lead);
    proseWords += countWords(data.executive_summary.the_problem);
    proseWords += countWords(data.executive_summary.core_insight?.explanation);
    proseWords += countWords(data.executive_summary.primary_recommendation);
    headlineWords += countWords(data.executive_summary.core_insight?.headline);
  }

  // Problem Analysis
  if (data.problem_analysis) {
    proseWords += countWords(data.problem_analysis.whats_wrong?.prose);
    proseWords += countWords(data.problem_analysis.why_its_hard?.prose);
    proseWords += countWords(
      data.problem_analysis.first_principles_insight?.explanation,
    );
    headlineWords += countWords(
      data.problem_analysis.first_principles_insight?.headline,
    );

    // Root cause hypotheses
    data.problem_analysis.root_cause_hypotheses?.forEach((h) => {
      listItemWords += countWords(h.hypothesis);
      listItemWords += countWords(h.explanation);
    });

    // Industry approaches
    data.problem_analysis.what_industry_does_today?.forEach((item) => {
      listItemWords += countWords(item.approach);
      listItemWords += countWords(item.limitation);
    });

    // Benchmarks table
    tableRows +=
      data.problem_analysis.current_state_of_art?.benchmarks?.length || 0;
  }

  // Constraints & Metrics
  if (data.constraints_and_metrics) {
    data.constraints_and_metrics.hard_constraints?.forEach((c) => {
      listItemWords += countWords(c);
    });
    data.constraints_and_metrics.soft_constraints?.forEach((c) => {
      listItemWords += countWords(c);
    });
    data.constraints_and_metrics.assumptions?.forEach((a) => {
      listItemWords += countWords(a);
    });
    tableRows += data.constraints_and_metrics.success_metrics?.length || 0;
  }

  // Challenge the Frame
  data.challenge_the_frame?.forEach((c) => {
    listItemWords += countWords(c.assumption);
    listItemWords += countWords(c.challenge);
    listItemWords += countWords(c.implication);
  });

  // Execution Track (Solution Concepts)
  if (data.execution_track) {
    proseWords += countWords(data.execution_track.intro);

    if (data.execution_track.primary) {
      const p = data.execution_track.primary;
      headlineWords += countWords(p.title);
      headlineWords += countWords(p.bottom_line);
      proseWords += countWords(p.what_it_is);
      proseWords += countWords(p.why_it_works);
      proseWords += countWords(p.expected_improvement);
      tableRows += p.validation_gates?.length || 0;

      // Why it might fail
      p.why_it_might_fail?.forEach((reason) => {
        listItemWords += countWords(reason);
      });
    }

    // Supporting concepts
    data.execution_track.supporting_concepts?.forEach((c) => {
      headlineWords += countWords(c.title);
      listItemWords += countWords(c.one_liner);
      proseWords += countWords(c.what_it_is);
      proseWords += countWords(c.why_it_works);
    });
  }

  // Innovation Portfolio
  if (data.innovation_portfolio) {
    proseWords += countWords(data.innovation_portfolio.intro);

    if (data.innovation_portfolio.recommended_innovation) {
      const r = data.innovation_portfolio.recommended_innovation;
      headlineWords += countWords(r.title);
      proseWords += countWords(r.what_it_is);
      proseWords += countWords(r.why_it_works);
      proseWords += countWords(r.the_insight?.what);
      proseWords += countWords(r.the_insight?.why_industry_missed_it);
    }

    // Parallel investigations
    data.innovation_portfolio.parallel_investigations?.forEach((inv) => {
      headlineWords += countWords(inv.title);
      listItemWords += countWords(inv.one_liner);
      proseWords += countWords(inv.what_it_is);
      proseWords += countWords(inv.why_it_works);
    });

    // Frontier watch
    data.innovation_portfolio.frontier_watch?.forEach((fw) => {
      headlineWords += countWords(fw.title);
      listItemWords += countWords(fw.one_liner);
      proseWords += countWords(fw.why_interesting);
      proseWords += countWords(fw.why_not_now);
    });
  }

  // Risks & Watchouts
  data.risks_and_watchouts?.forEach((r) => {
    listItemWords += countWords(r.risk);
    listItemWords += countWords(r.mitigation);
  });

  // Self Critique
  if (data.self_critique) {
    proseWords += countWords(data.self_critique.confidence_rationale);
    data.self_critique.what_we_might_be_wrong_about?.forEach((w) => {
      listItemWords += countWords(w);
    });
    data.self_critique.unexplored_directions?.forEach((d) => {
      listItemWords += countWords(d);
    });
  }

  // Strategic Integration
  if (data.strategic_integration) {
    proseWords += countWords(
      data.strategic_integration.portfolio_view?.combined_strategy,
    );
    proseWords += countWords(
      data.strategic_integration.personal_recommendation?.intro,
    );
    proseWords += countWords(
      data.strategic_integration.personal_recommendation?.key_insight,
    );

    data.strategic_integration.action_plan?.forEach((action) => {
      listItemWords += countWords(action.rationale);
      action.actions?.forEach((a) => {
        listItemWords += countWords(a);
      });
    });
  }

  // Final Recommendation
  proseWords += countWords(data.what_id_actually_do);

  // Key Insights & Next Steps
  data.key_insights?.forEach((i) => (listItemWords += countWords(i)));
  data.next_steps?.forEach((s) => (listItemWords += countWords(s)));

  // Calculate time for each content type
  const proseMinutes = proseWords / WPM_PROSE;
  const headlineMinutes = headlineWords / WPM_HEADLINE;
  const listMinutes = listItemWords / WPM_LIST_ITEM;
  const tableMinutes = (tableRows * SECONDS_PER_TABLE_ROW) / 60;

  const totalMinutes =
    proseMinutes + headlineMinutes + listMinutes + tableMinutes;

  return Math.max(1, Math.round(totalMinutes));
}

/**
 * Format date in a readable format: "Dec 27, 2025"
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Normalize report data to handle both old (v3) and new (v4) schema field names.
 * Maps: solution_concepts → execution_track, innovation_concepts → innovation_portfolio
 */
function normalizeReportData(data: HybridReportData): HybridReportData {
  const raw = data as Record<string, unknown>;

  // If using new schema, return as-is
  if (data.execution_track || data.innovation_portfolio) {
    return {
      ...data,
      constraints_and_metrics:
        data.constraints_and_metrics ??
        (raw.constraints as HybridReportData['constraints_and_metrics']),
    };
  }

  // Normalize solution_concepts → execution_track
  const solutionConcepts = raw.solution_concepts as
    | {
        intro?: string;
        primary?: {
          id?: string;
          title?: string;
          confidence_percent?: number;
          source_type?: string;
          what_it_is?: string;
          why_it_works?: string;
          economics?: {
            expected_outcome?: { value?: string };
            investment?: { value?: string };
            timeline?: { value?: string };
          };
          the_insight?: unknown;
          first_validation_step?: {
            test?: string;
            cost?: string;
            go_criteria?: string;
          };
        };
        supporting?: Array<{
          id?: string;
          title?: string;
          relationship?: string;
          what_it_is?: string;
          why_it_works?: string;
          when_to_use_instead?: string;
          confidence_percent?: number;
          key_risk?: string;
        }>;
      }
    | undefined;

  const executionTrack: HybridReportData['execution_track'] = solutionConcepts
    ? {
        intro: solutionConcepts.intro,
        primary: solutionConcepts.primary
          ? {
              id: solutionConcepts.primary.id,
              title: solutionConcepts.primary.title,
              confidence: solutionConcepts.primary.confidence_percent,
              source_type: solutionConcepts.primary.source_type as
                | 'CATALOG'
                | 'TRANSFER'
                | 'OPTIMIZATION'
                | 'FIRST_PRINCIPLES'
                | undefined,
              what_it_is: solutionConcepts.primary.what_it_is,
              why_it_works: solutionConcepts.primary.why_it_works,
              expected_improvement:
                solutionConcepts.primary.economics?.expected_outcome?.value,
              investment: solutionConcepts.primary.economics?.investment?.value,
              timeline: solutionConcepts.primary.economics?.timeline?.value,
              the_insight: solutionConcepts.primary
                .the_insight as HybridReportData['execution_track'] extends {
                primary?: { the_insight?: infer T };
              }
                ? T
                : never,
              validation_gates: solutionConcepts.primary.first_validation_step
                ? [
                    {
                      test: solutionConcepts.primary.first_validation_step.test,
                      cost: solutionConcepts.primary.first_validation_step.cost,
                      success_criteria:
                        solutionConcepts.primary.first_validation_step
                          .go_criteria,
                    },
                  ]
                : undefined,
            }
          : undefined,
        supporting_concepts: solutionConcepts.supporting?.map((s) => ({
          id: s.id,
          title: s.title,
          relationship: s.relationship as
            | 'COMPLEMENTARY'
            | 'FALLBACK'
            | 'PREREQUISITE'
            | undefined,
          one_liner: s.key_risk,
          what_it_is: s.what_it_is,
          why_it_works: s.why_it_works,
          when_to_use_instead: s.when_to_use_instead,
          confidence: s.confidence_percent,
        })),
      }
    : undefined;

  // Normalize innovation_concepts → innovation_portfolio
  const innovationConcepts = raw.innovation_concepts as
    | {
        intro?: string;
        recommended?: {
          id?: string;
          title?: string;
          confidence_percent?: number;
          confidence?: number;
          [key: string]: unknown;
        };
        parallel?: Array<{
          id?: string;
          title?: string;
          confidence_percent?: number;
          confidence?: number;
          [key: string]: unknown;
        }>;
        frontier_watch?: HybridReportData['innovation_portfolio'] extends {
          frontier_watch?: infer T;
        }
          ? T
          : never;
      }
    | undefined;

  const innovationPortfolio: HybridReportData['innovation_portfolio'] =
    innovationConcepts
      ? {
          intro: innovationConcepts.intro,
          recommended_innovation: innovationConcepts.recommended
            ? ({
                ...innovationConcepts.recommended,
                confidence:
                  innovationConcepts.recommended.confidence_percent ??
                  innovationConcepts.recommended.confidence,
              } as HybridReportData['innovation_portfolio'] extends {
                recommended_innovation?: infer T;
              }
                ? T
                : never)
            : undefined,
          parallel_investigations: innovationConcepts.parallel?.map((p) => ({
            ...p,
            confidence: p.confidence_percent ?? p.confidence,
          })) as HybridReportData['innovation_portfolio'] extends {
            parallel_investigations?: infer T;
          }
            ? T
            : never,
          frontier_watch: innovationConcepts.frontier_watch,
        }
      : undefined;

  // Normalize constraints → constraints_and_metrics
  const constraintsAndMetrics =
    data.constraints_and_metrics ??
    (raw.constraints as HybridReportData['constraints_and_metrics']);

  return {
    ...data,
    execution_track: executionTrack,
    innovation_portfolio: innovationPortfolio,
    constraints_and_metrics: constraintsAndMetrics,
  };
}

// ============================================
// DATA EXTRACTION HELPERS
// ============================================

/**
 * Extract domains searched as simple string array from multiple possible locations.
 * Handles both cross_domain_search.domains_searched and innovation_analysis.domains_searched.
 */
function extractDomainsSearched(data: HybridReportData): string[] | undefined {
  // Try cross_domain_search first
  if (
    data.cross_domain_search?.domains_searched &&
    data.cross_domain_search.domains_searched.length > 0
  ) {
    return data.cross_domain_search.domains_searched.map((d) =>
      typeof d === 'string' ? d : (d as { domain?: string }).domain || '',
    );
  }

  // Fall back to innovation_analysis
  if (
    data.innovation_analysis?.domains_searched &&
    data.innovation_analysis.domains_searched.length > 0
  ) {
    return data.innovation_analysis.domains_searched;
  }

  return undefined;
}

/**
 * Extract from-scratch revelations (First Principles Concept) from the report.
 */
function extractFromScratchRevelations(
  data: HybridReportData,
):
  | Array<{ discovery?: string; source?: string; implication?: string }>
  | undefined {
  return data.cross_domain_search?.from_scratch_revelations;
}

// ============================================
// TOC NAV ITEM COMPONENT
// ============================================

interface TocNavItemProps {
  section: TocSection;
  activeSection: string;
  onNavigate: (id: string) => void;
}

const TocNavItem = memo(function TocNavItem({
  section,
  activeSection,
  onNavigate,
}: TocNavItemProps) {
  const isActive = activeSection === section.id;

  return (
    <li>
      <button
        onClick={() => onNavigate(section.id)}
        className={cn(
          'relative block w-full py-1.5 text-left text-[14px] transition-colors',
          isActive
            ? 'font-medium text-zinc-900'
            : 'text-zinc-500 hover:text-zinc-900',
        )}
      >
        {isActive && (
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
                  'block w-full py-1 text-left text-[13px] transition-colors',
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
  );
});

// ============================================
// ACTION BUTTON COMPONENT
// ============================================

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  loadingIcon?: React.ReactNode;
  label: string;
  loadingLabel?: string;
  ariaLabel: string;
  disabled?: boolean;
  isLoading?: boolean;
}

function ActionButton({
  onClick,
  icon,
  loadingIcon,
  label,
  loadingLabel,
  ariaLabel,
  disabled,
  isLoading,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'flex items-center gap-2 rounded border border-zinc-200 px-3 py-2 text-[13px] tracking-[-0.01em] text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900',
        (disabled || isLoading) && 'cursor-not-allowed opacity-50',
      )}
      aria-label={ariaLabel}
    >
      {isLoading ? loadingIcon || icon : icon}
      <span className="hidden sm:inline">
        {isLoading ? loadingLabel || label : label}
      </span>
    </button>
  );
}

// ============================================
// REPORT CONTENT COMPONENT
// ============================================

interface ReportContentProps {
  normalizedData: HybridReportData;
  title?: string;
  brief?: string;
  createdAt?: string;
  readTime: number;
  showActions?: boolean;
  reportId?: string;
  compactTitle?: boolean;
}

const ReportContent = memo(function ReportContent({
  normalizedData,
  title,
  brief,
  createdAt,
  readTime,
  showActions = true,
  reportId,
  compactTitle = false,
}: ReportContentProps) {
  const displayTitle = title || normalizedData.title;

  // Share and export functionality via shared hook
  // Only initialize if we have a reportId (required for these actions)
  const { handleShare, handleExport, isGeneratingShare, isExporting } =
    useReportActions({
      reportId: reportId || '',
      reportTitle: displayTitle || 'Report',
    });

  // Actions require a valid reportId to work
  const hasReportId = !!reportId;

  return (
    <>
      {/* Report Title + Metadata + Actions */}
      {displayTitle && (
        <header className="mb-16">
          {/* Title and Actions Row */}
          <div className="flex items-start justify-between gap-6">
            <h1
              className={cn(
                'font-heading text-[40px] leading-none font-normal tracking-[-0.02em] text-zinc-900',
                compactTitle && 'text-[28px] md:text-[32px]',
              )}
            >
              {displayTitle}
            </h1>
            {/* Action Buttons - show when showActions=true, disabled when no reportId */}
            {showActions && (
              <div className="flex shrink-0 items-center gap-2 pt-2">
                <ActionButton
                  onClick={handleShare}
                  icon={<Share2 className="h-4 w-4" />}
                  loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                  label="Share"
                  loadingLabel="Sharing..."
                  ariaLabel="Share report"
                  isLoading={isGeneratingShare}
                  disabled={!hasReportId}
                />
                <ActionButton
                  onClick={handleExport}
                  icon={<Download className="h-4 w-4" />}
                  loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                  label="Export"
                  loadingLabel="Exporting..."
                  ariaLabel="Export report"
                  isLoading={isExporting}
                  disabled={!hasReportId}
                />
              </div>
            )}
          </div>
          {/* Metadata row */}
          <div className="mt-4 flex items-center gap-4 text-[14px] tracking-[-0.02em] text-zinc-500">
            {createdAt && <span>{formatDate(createdAt)}</span>}
            {createdAt && <span className="text-zinc-300">·</span>}
            <span>{readTime} min read</span>
          </div>
        </header>
      )}

      {/* Brief - User's original input */}
      {brief && (
        <Section id="brief" className="mt-0">
          <SectionTitle>The Brief</SectionTitle>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-6">
            <p className="text-[16px] leading-relaxed tracking-[-0.01em] whitespace-pre-wrap text-zinc-700">
              {brief}
            </p>
          </div>
        </Section>
      )}

      {/* Executive Summary */}
      <ExecutiveSummarySection data={normalizedData.executive_summary} />

      {/* Problem Analysis */}
      <ProblemAnalysisSection
        data={normalizedData.problem_analysis}
        fromScratchRevelations={extractFromScratchRevelations(normalizedData)}
      />

      {/* Constraints & Metrics */}
      <ConstraintsSection data={normalizedData.constraints_and_metrics} />

      {/* Challenge the Frame */}
      <ChallengeFrameSection data={normalizedData.challenge_the_frame} />

      {/* Innovation Analysis (reframe + domains searched) */}
      <InnovationAnalysisSection
        data={normalizedData.innovation_analysis}
        domainsSearched={extractDomainsSearched(normalizedData)}
      />

      {/* Solution Concepts (Execution Track) */}
      <SolutionConceptsSection data={normalizedData.execution_track} />

      {/* Innovation Portfolio */}
      <InnovationConceptsSection data={normalizedData.innovation_portfolio} />

      {/* Frontier Watch */}
      <FrontierTechnologiesSection
        data={normalizedData.innovation_portfolio?.frontier_watch}
      />

      {/* Risks & Watchouts */}
      <RisksWatchoutsSection data={normalizedData.risks_and_watchouts} />

      {/* Self Critique */}
      <SelfCritiqueSection data={normalizedData.self_critique} />

      {/* Recommendation */}
      <RecommendationSection
        content={normalizedData.what_id_actually_do}
        personalRecommendation={
          normalizedData.strategic_integration?.personal_recommendation
        }
      />

      {/* Key Insights (if present as separate field) */}
      {normalizedData.key_insights &&
        normalizedData.key_insights.length > 0 && (
          <KeyInsightsSection insights={normalizedData.key_insights} />
        )}

      {/* Next Steps (if present as separate field) */}
      {normalizedData.next_steps && normalizedData.next_steps.length > 0 && (
        <NextStepsSection steps={normalizedData.next_steps} />
      )}

      {/* References (inline citations) */}
      <ReferencesSection data={normalizedData.references} />
    </>
  );
});

export const BrandSystemReport = memo(function BrandSystemReport({
  reportData,
  title,
  showToc = true,
  brief,
  createdAt,
  hasAppSidebar = true,
  isChatOpen = false,
  showActions = true,
  reportId,
  compactTitle = false,
}: BrandSystemReportProps) {
  // Normalize field names for backward compatibility
  const normalizedData = normalizeReportData(reportData);

  // Memoize TOC sections to avoid regenerating on every render
  const tocSections = useMemo(
    () =>
      generateTocSections(
        normalizedData as Record<string, unknown>,
        !!brief, // Include Brief in TOC if we have it
      ),
    [normalizedData, brief],
  );

  // Flatten section IDs for scroll tracking
  const sectionIds = useMemo(
    () => flattenSectionIds(tocSections),
    [tocSections],
  );

  // Use shared scroll tracking hook
  const { activeSection, navigateToSection } = useTocScroll({
    sectionIds,
    scrollOffset: TOC_SCROLL_OFFSET,
  });

  // Calculate read time
  const readTime = calculateReadTime(normalizedData);

  // When there's an app sidebar, use two-column flex layout with sticky TOC
  // This avoids fixed positioning conflicts with the expandable sidebar
  if (hasAppSidebar && showToc) {
    return (
      <div
        className="relative min-h-screen bg-white transition-transform duration-300 ease-out"
        style={{
          transform: isChatOpen
            ? `translateX(-${CHAT_DRAWER_WIDTH / 2}px)`
            : undefined,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="flex gap-8 py-10">
            {/* Sticky TOC Sidebar - z-30 ensures it goes behind the expanded app sidebar (z-50) */}
            {tocSections.length > 0 && (
              <aside className="relative z-30 hidden w-56 shrink-0 self-start lg:block">
                <nav
                  className="sticky max-h-[calc(100vh-5rem)] overflow-y-auto"
                  style={{ top: `${TOC_STICKY_TOP}px` }}
                >
                  <p className="mb-4 text-[12px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
                    Contents
                  </p>
                  <ul className="space-y-1 border-l border-zinc-200 pl-4">
                    {tocSections.map((section) => (
                      <TocNavItem
                        key={section.id}
                        section={section}
                        activeSection={activeSection}
                        onNavigate={navigateToSection}
                      />
                    ))}
                  </ul>
                </nav>
              </aside>
            )}

            {/* Main Content */}
            <div className="min-w-0 flex-1">
              <div className="max-w-3xl">
                <ReportContent
                  normalizedData={normalizedData}
                  title={title}
                  brief={brief}
                  createdAt={createdAt}
                  readTime={readTime}
                  showActions={showActions}
                  reportId={reportId}
                  compactTitle={compactTitle}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-white transition-transform duration-300 ease-out"
      style={{
        transform: isChatOpen
          ? `translateX(-${CHAT_DRAWER_WIDTH / 2}px)`
          : undefined,
      }}
    >
      {/* Table of Contents - fixed sidebar for pages without app sidebar */}
      {showToc && (
        <TableOfContents sections={tocSections} hasAppSidebar={hasAppSidebar} />
      )}

      {/* Main Content - adjust margin when TOC is shown (TOC is w-56 = 224px) */}
      <div
        className={`max-w-3xl px-6 py-16 ${showToc ? 'lg:ml-56 lg:pr-8' : 'mx-auto'}`}
      >
        <ReportContent
          normalizedData={normalizedData}
          title={title}
          brief={brief}
          createdAt={createdAt}
          readTime={readTime}
          showActions={showActions}
          reportId={reportId}
          compactTitle={compactTitle}
        />
      </div>
    </div>
  );
});

// ============================================
// HELPER SECTIONS
// ============================================

const KeyInsightsSection = memo(function KeyInsightsSection({
  insights,
}: {
  insights: string[];
}) {
  return (
    <Section id="key-insights" className="mt-20">
      <SectionTitle size="lg">Key Insights</SectionTitle>
      <ul className="mt-8 max-w-[65ch] space-y-4">
        {insights.map((insight, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-900" />
            <p className="text-[18px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]">
              {insight}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
});

const NextStepsSection = memo(function NextStepsSection({
  steps,
}: {
  steps: string[];
}) {
  return (
    <Section id="next-steps" className="mt-20">
      <SectionTitle size="lg">Next Steps</SectionTitle>
      <ol className="mt-8 max-w-[65ch] space-y-4">
        {steps.map((step, idx) => (
          <li key={idx} className="flex items-start gap-4">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-[14px] font-semibold text-zinc-400">
              {idx + 1}.
            </span>
            <p className="text-[18px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]">
              {step}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
});

export default BrandSystemReport;
