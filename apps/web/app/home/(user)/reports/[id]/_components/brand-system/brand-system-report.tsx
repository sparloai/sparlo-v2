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

import { memo, useEffect, useState } from 'react';

import type { HybridReportData } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

import { cn } from '@kit/ui/utils';

import { Section, SectionTitle, UnknownFieldRenderer } from './primitives';
import {
  ChallengeFrameSection,
  ConstraintsSection,
  CrossDomainSearchSection,
  ExecutiveSummarySection,
  FrontierTechnologiesSection,
  HonestAssessmentSection,
  InnovationConceptsSection,
  ProblemAnalysisSection,
  RecommendationSection,
  RisksWatchoutsSection,
  SelfCritiqueSection,
  SolutionConceptsSection,
  StrategicIntegrationSection,
} from './sections';
import {
  TableOfContents,
  generateTocSections,
  type TocSection,
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
}

/**
 * Calculate estimated read time based on word count
 * Average reading speed: 200-250 words per minute for technical content
 */
function calculateReadTime(data: HybridReportData): number {
  // Recursively extract all text from the report
  const extractText = (obj: unknown): string => {
    if (typeof obj === 'string') return obj;
    if (Array.isArray(obj)) return obj.map(extractText).join(' ');
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).map(extractText).join(' ');
    }
    return '';
  };

  const text = extractText(data);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const minutesRaw = wordCount / 200; // 200 words per minute for technical content

  // Round to nearest minute, minimum 1 minute
  return Math.max(1, Math.round(minutesRaw));
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

// Known fields that we handle explicitly (both old and new names)
const KNOWN_FIELDS = new Set([
  'title',
  'executive_summary',
  'problem_restatement',
  'key_insights',
  'next_steps',
  'decision_architecture',
  'other_concepts',
  'self_critique',
  'honest_assessment',
  'cross_domain_search',
  'execution_track',
  'innovation_portfolio',
  'strategic_integration',
  'brief',
  'problem_analysis',
  'constraints_and_metrics',
  'constraints',
  'challenge_the_frame',
  'risks_and_watchouts',
  'what_id_actually_do',
  'follow_up_prompts',
  'innovation_analysis',
  // Old field names (v3 schema)
  'solution_concepts',
  'innovation_concepts',
  'header',
  'metadata',
]);

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
// TOC NAV ITEM COMPONENT
// ============================================

interface TocNavItemProps {
  section: TocSection;
}

function TocNavItem({ section }: TocNavItemProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('[id]');
      let currentActive = '';
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom > 0) {
          currentActive = el.id;
        }
      });
      setActiveSection(currentActive);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigate = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const isActive = activeSection === section.id;

  return (
    <li>
      <button
        onClick={() => handleNavigate(section.id)}
        className={cn(
          'relative block w-full py-1.5 text-left text-[14px] transition-colors',
          isActive ? 'font-medium text-zinc-900' : 'text-zinc-500 hover:text-zinc-900',
        )}
      >
        {isActive && (
          <span className="absolute -left-4 top-1/2 h-4 w-0.5 -translate-y-1/2 bg-zinc-900" />
        )}
        {section.title}
      </button>

      {/* Subsections */}
      {section.subsections && section.subsections.length > 0 && (
        <ul className="ml-3 mt-1 space-y-1">
          {section.subsections.map((sub) => (
            <li key={sub.id}>
              <button
                onClick={() => handleNavigate(sub.id)}
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
  unknownFields: [string, unknown][];
}

const ReportContent = memo(function ReportContent({
  normalizedData,
  title,
  brief,
  createdAt,
  readTime,
  unknownFields,
}: ReportContentProps) {
  return (
    <>
      {/* Report Title + Metadata */}
      {(title || normalizedData.title) && (
        <header className="mb-16">
          <h1 className="font-heading text-[36px] leading-[1.1] font-normal tracking-[-0.02em] text-zinc-900 md:text-[48px]">
            {title || normalizedData.title}
          </h1>
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
        <Section id="brief">
          <SectionTitle>The Brief</SectionTitle>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-6">
            <p className="whitespace-pre-wrap text-[16px] leading-relaxed tracking-[-0.01em] text-zinc-700">
              {brief}
            </p>
          </div>
        </Section>
      )}

      {/* Executive Summary */}
      <ExecutiveSummarySection data={normalizedData.executive_summary} />

      {/* Problem Analysis */}
      <ProblemAnalysisSection data={normalizedData.problem_analysis} />

      {/* Constraints & Metrics */}
      <ConstraintsSection data={normalizedData.constraints_and_metrics} />

      {/* Challenge the Frame */}
      <ChallengeFrameSection
        data={normalizedData.challenge_the_frame}
        reframe={normalizedData.innovation_analysis?.reframe}
      />

      {/* Honest Assessment */}
      <HonestAssessmentSection data={normalizedData.honest_assessment} />

      {/* Cross-Domain Search */}
      <CrossDomainSearchSection data={normalizedData.cross_domain_search} />

      {/* Solution Concepts (Execution Track) */}
      <SolutionConceptsSection data={normalizedData.execution_track} />

      {/* Innovation Portfolio */}
      <InnovationConceptsSection data={normalizedData.innovation_portfolio} />

      {/* Frontier Watch */}
      <FrontierTechnologiesSection
        data={normalizedData.innovation_portfolio?.frontier_watch}
      />

      {/* Strategic Integration */}
      <StrategicIntegrationSection data={normalizedData.strategic_integration} />

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
      {normalizedData.key_insights && normalizedData.key_insights.length > 0 && (
        <KeyInsightsSection insights={normalizedData.key_insights} />
      )}

      {/* Next Steps (if present as separate field) */}
      {normalizedData.next_steps && normalizedData.next_steps.length > 0 && (
        <NextStepsSection steps={normalizedData.next_steps} />
      )}

      {/* Follow-up Prompts */}
      {normalizedData.follow_up_prompts &&
        normalizedData.follow_up_prompts.length > 0 && (
          <FollowUpPromptsSection prompts={normalizedData.follow_up_prompts} />
        )}

      {/* Unknown Fields - Graceful Handling */}
      {unknownFields.length > 0 && (
        <Section id="additional-information" className="mt-20">
          <SectionTitle size="lg">Additional Information</SectionTitle>
          <div className="mt-10 space-y-8">
            {unknownFields.map(([key, value]) => (
              <div key={key} className="max-w-[70ch]">
                <UnknownFieldRenderer
                  data={value}
                  label={key.replace(/_/g, ' ')}
                />
              </div>
            ))}
          </div>
        </Section>
      )}
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
}: BrandSystemReportProps) {
  // Normalize field names for backward compatibility
  const normalizedData = normalizeReportData(reportData);
  const tocSections = generateTocSections(
    normalizedData as Record<string, unknown>,
    !!brief, // Include Brief in TOC if we have it
  );

  // Find unknown fields for graceful rendering
  const unknownFields = Object.entries(reportData).filter(
    ([key, value]) =>
      !KNOWN_FIELDS.has(key) && value !== null && value !== undefined,
  );

  // Calculate read time
  const readTime = calculateReadTime(normalizedData);

  // When there's an app sidebar, use two-column flex layout with sticky TOC
  // This avoids fixed positioning conflicts with the expandable sidebar
  if (hasAppSidebar && showToc) {
    return (
      <div className="relative min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="flex gap-8 py-10">
            {/* Sticky TOC Sidebar */}
            {tocSections.length > 0 && (
              <aside className="hidden w-56 shrink-0 lg:block">
                <nav className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
                  <p className="mb-4 text-[12px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
                    Contents
                  </p>
                  <ul className="space-y-1 border-l border-zinc-200 pl-4">
                    {tocSections.map((section) => (
                      <TocNavItem key={section.id} section={section} />
                    ))}
                  </ul>
                </nav>
              </aside>
            )}

            {/* Main Content */}
            <main className="min-w-0 flex-1">
              <div className="max-w-3xl">
                <ReportContent
                  normalizedData={normalizedData}
                  title={title}
                  brief={brief}
                  createdAt={createdAt}
                  readTime={readTime}
                  unknownFields={unknownFields}
                />
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white">
      {/* Table of Contents - fixed sidebar for pages without app sidebar */}
      {showToc && (
        <TableOfContents sections={tocSections} hasAppSidebar={hasAppSidebar} />
      )}

      {/* Main Content - adjust margin when TOC is shown (TOC is w-56 = 224px) */}
      <main
        className={`max-w-3xl px-6 py-16 ${showToc ? 'lg:ml-56 lg:pr-8' : 'mx-auto'}`}
      >
        <ReportContent
          normalizedData={normalizedData}
          title={title}
          brief={brief}
          createdAt={createdAt}
          readTime={readTime}
          unknownFields={unknownFields}
        />
      </main>
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

const FollowUpPromptsSection = memo(function FollowUpPromptsSection({
  prompts,
}: {
  prompts: string[];
}) {
  return (
    <Section
      id="follow-up-prompts"
      className="mt-20 border-t border-zinc-200 pt-16"
    >
      <SectionTitle size="md">Continue the Conversation</SectionTitle>
      <div className="mt-6 space-y-3">
        {prompts.map((prompt, idx) => (
          <button
            key={idx}
            className="block w-full max-w-[50ch] rounded border border-zinc-200 px-4 py-3 text-left text-[16px] text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
          >
            {prompt}
          </button>
        ))}
      </div>
    </Section>
  );
});

export default BrandSystemReport;
