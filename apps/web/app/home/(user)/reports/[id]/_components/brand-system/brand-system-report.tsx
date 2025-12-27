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

// Known fields that we handle explicitly
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
  'challenge_the_frame',
  'risks_and_watchouts',
  'what_id_actually_do',
  'follow_up_prompts',
  'innovation_analysis',
]);

export const BrandSystemReport = memo(function BrandSystemReport({
  reportData,
  title,
}: BrandSystemReportProps) {
  const tocSections = generateTocSections(reportData as Record<string, unknown>);

  // Find unknown fields for graceful rendering
  const unknownFields = Object.entries(reportData).filter(
    ([key, value]) => !KNOWN_FIELDS.has(key) && value !== null && value !== undefined,
  );

  return (
    <div className="relative min-h-screen bg-white">
      {/* Table of Contents */}
      <TableOfContents sections={tocSections} />

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-16 lg:ml-72 lg:mr-8 xl:mr-32">
        {/* Report Title */}
        {(title || reportData.title) && (
          <header className="mb-16">
            <h1 className="text-[36px] font-semibold leading-[1.1] tracking-[-0.03em] text-zinc-900 md:text-[48px]">
              {title || reportData.title}
            </h1>
          </header>
        )}

        {/* Executive Summary */}
        <ExecutiveSummarySection data={reportData.executive_summary} />

        {/* Problem Analysis */}
        <ProblemAnalysisSection data={reportData.problem_analysis} />

        {/* Constraints & Metrics */}
        <ConstraintsSection data={reportData.constraints_and_metrics} />

        {/* Challenge the Frame */}
        <ChallengeFrameSection
          data={reportData.challenge_the_frame}
          reframe={reportData.innovation_analysis?.reframe}
        />

        {/* Honest Assessment */}
        <HonestAssessmentSection data={reportData.honest_assessment} />

        {/* Cross-Domain Search */}
        <CrossDomainSearchSection data={reportData.cross_domain_search} />

        {/* Solution Concepts (Execution Track) */}
        <SolutionConceptsSection data={reportData.execution_track} />

        {/* Innovation Portfolio */}
        <InnovationConceptsSection data={reportData.innovation_portfolio} />

        {/* Frontier Watch */}
        <FrontierTechnologiesSection data={reportData.innovation_portfolio?.frontier_watch} />

        {/* Strategic Integration */}
        <StrategicIntegrationSection data={reportData.strategic_integration} />

        {/* Risks & Watchouts */}
        <RisksWatchoutsSection data={reportData.risks_and_watchouts} />

        {/* Self Critique */}
        <SelfCritiqueSection data={reportData.self_critique} />

        {/* Recommendation */}
        <RecommendationSection
          content={reportData.what_id_actually_do}
          personalRecommendation={reportData.strategic_integration?.personal_recommendation}
        />

        {/* Key Insights (if present as separate field) */}
        {reportData.key_insights && reportData.key_insights.length > 0 && (
          <KeyInsightsSection insights={reportData.key_insights} />
        )}

        {/* Next Steps (if present as separate field) */}
        {reportData.next_steps && reportData.next_steps.length > 0 && (
          <NextStepsSection steps={reportData.next_steps} />
        )}

        {/* Follow-up Prompts */}
        {reportData.follow_up_prompts && reportData.follow_up_prompts.length > 0 && (
          <FollowUpPromptsSection prompts={reportData.follow_up_prompts} />
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
