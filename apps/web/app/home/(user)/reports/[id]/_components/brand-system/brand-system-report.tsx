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

import { memo } from 'react';

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
import { TableOfContents, generateTocSections } from './table-of-contents';

import type { HybridReportData } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

interface BrandSystemReportProps {
  reportData: HybridReportData;
  title?: string;
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
      constraints_and_metrics: data.constraints_and_metrics ?? raw.constraints as HybridReportData['constraints_and_metrics'],
    };
  }

  // Normalize solution_concepts → execution_track
  const solutionConcepts = raw.solution_concepts as {
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
  } | undefined;

  const executionTrack: HybridReportData['execution_track'] = solutionConcepts ? {
    intro: solutionConcepts.intro,
    primary: solutionConcepts.primary ? {
      id: solutionConcepts.primary.id,
      title: solutionConcepts.primary.title,
      confidence: solutionConcepts.primary.confidence_percent,
      source_type: solutionConcepts.primary.source_type as 'CATALOG' | 'TRANSFER' | 'OPTIMIZATION' | 'FIRST_PRINCIPLES' | undefined,
      what_it_is: solutionConcepts.primary.what_it_is,
      why_it_works: solutionConcepts.primary.why_it_works,
      expected_improvement: solutionConcepts.primary.economics?.expected_outcome?.value,
      investment: solutionConcepts.primary.economics?.investment?.value,
      timeline: solutionConcepts.primary.economics?.timeline?.value,
      the_insight: solutionConcepts.primary.the_insight as HybridReportData['execution_track'] extends { primary?: { the_insight?: infer T } } ? T : never,
      validation_gates: solutionConcepts.primary.first_validation_step ? [{
        test: solutionConcepts.primary.first_validation_step.test,
        cost: solutionConcepts.primary.first_validation_step.cost,
        success_criteria: solutionConcepts.primary.first_validation_step.go_criteria,
      }] : undefined,
    } : undefined,
    supporting_concepts: solutionConcepts.supporting?.map(s => ({
      id: s.id,
      title: s.title,
      relationship: s.relationship as 'COMPLEMENTARY' | 'FALLBACK' | 'PREREQUISITE' | undefined,
      one_liner: s.key_risk,
      what_it_is: s.what_it_is,
      why_it_works: s.why_it_works,
      when_to_use_instead: s.when_to_use_instead,
      confidence: s.confidence_percent,
    })),
  } : undefined;

  // Normalize innovation_concepts → innovation_portfolio
  const innovationConcepts = raw.innovation_concepts as {
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
    frontier_watch?: HybridReportData['innovation_portfolio'] extends { frontier_watch?: infer T } ? T : never;
  } | undefined;

  const innovationPortfolio: HybridReportData['innovation_portfolio'] = innovationConcepts ? {
    intro: innovationConcepts.intro,
    recommended_innovation: innovationConcepts.recommended ? {
      ...innovationConcepts.recommended,
      confidence: innovationConcepts.recommended.confidence_percent ?? innovationConcepts.recommended.confidence,
    } as HybridReportData['innovation_portfolio'] extends { recommended_innovation?: infer T } ? T : never : undefined,
    parallel_investigations: innovationConcepts.parallel?.map(p => ({
      ...p,
      confidence: p.confidence_percent ?? p.confidence,
    })) as HybridReportData['innovation_portfolio'] extends { parallel_investigations?: infer T } ? T : never,
    frontier_watch: innovationConcepts.frontier_watch,
  } : undefined;

  // Normalize constraints → constraints_and_metrics
  const constraintsAndMetrics = data.constraints_and_metrics ?? raw.constraints as HybridReportData['constraints_and_metrics'];

  return {
    ...data,
    execution_track: executionTrack,
    innovation_portfolio: innovationPortfolio,
    constraints_and_metrics: constraintsAndMetrics,
  };
}

export const BrandSystemReport = memo(function BrandSystemReport({
  reportData,
  title,
}: BrandSystemReportProps) {
  // Normalize field names for backward compatibility
  const normalizedData = normalizeReportData(reportData);
  const tocSections = generateTocSections(normalizedData as Record<string, unknown>);

  // Find unknown fields for graceful rendering
  const unknownFields = Object.entries(reportData).filter(
    ([key, value]) => !KNOWN_FIELDS.has(key) && value !== null && value !== undefined,
  );

  return (
    <div className="relative min-h-screen bg-white">
      {/* Table of Contents */}
      <TableOfContents sections={tocSections} />

      {/* Main Content */}
      <main className="max-w-3xl px-6 py-16 lg:ml-72 lg:pr-8">
        {/* Report Title */}
        {(title || normalizedData.title) && (
          <header className="mb-16">
            <h1 className="text-[36px] font-semibold leading-[1.1] tracking-[-0.03em] text-zinc-900 md:text-[48px]">
              {title || normalizedData.title}
            </h1>
          </header>
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
        <FrontierTechnologiesSection data={normalizedData.innovation_portfolio?.frontier_watch} />

        {/* Strategic Integration */}
        <StrategicIntegrationSection data={normalizedData.strategic_integration} />

        {/* Risks & Watchouts */}
        <RisksWatchoutsSection data={normalizedData.risks_and_watchouts} />

        {/* Self Critique */}
        <SelfCritiqueSection data={normalizedData.self_critique} />

        {/* Recommendation */}
        <RecommendationSection
          content={normalizedData.what_id_actually_do}
          personalRecommendation={normalizedData.strategic_integration?.personal_recommendation}
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
        {normalizedData.follow_up_prompts && normalizedData.follow_up_prompts.length > 0 && (
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
    <Section id="follow-up-prompts" className="mt-20 border-t border-zinc-200 pt-16">
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
