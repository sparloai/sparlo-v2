/**
 * Executive Summary Section
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * The definitive assessment up front. Should feel like reading the abstract
 * of a Nature paper—dense with information, zero padding.
 */
import { memo } from 'react';

import type { StructuredExecutiveSummary } from '~/app/reports/_lib/types/hybrid-report-display.types';

import {
  ArticleBlock,
  BodyText,
  ContentBlock,
  MonoLabel,
  Section,
  SectionTitle,
  UnknownFieldRenderer,
} from '../primitives';

interface ExecutiveSummarySectionProps {
  data?: string | StructuredExecutiveSummary;
  brief?: string;
}

export const ExecutiveSummarySection = memo(function ExecutiveSummarySection({
  data,
  brief,
}: ExecutiveSummarySectionProps) {
  if (!data && !brief) return null;

  // Handle string format (legacy)
  if (typeof data === 'string') {
    return (
      <Section id="executive-summary">
        <SectionTitle className="mb-12">Executive Summary</SectionTitle>

        <ArticleBlock>
          <MonoLabel>The Assessment</MonoLabel>
          <BodyText size="lg" className="mt-8 max-w-[80ch]">
            {data}
          </BodyText>
        </ArticleBlock>
      </Section>
    );
  }

  // Handle structured format
  const structured = data as StructuredExecutiveSummary | undefined;

  return (
    <Section id="executive-summary">
      <SectionTitle className="mb-12">Executive Summary</SectionTitle>

      <ArticleBlock>
        {/* THE ASSESSMENT */}
        <div>
          <MonoLabel>The Assessment</MonoLabel>
          <BodyText size="lg" className="mt-8 max-w-[80ch]">
            {structured?.narrative_lead || brief || 'No assessment provided.'}
          </BodyText>
        </div>

        {/* VIABILITY */}
        {structured?.viability && (
          <ContentBlock withBorder className="max-w-[80ch]">
            <MonoLabel>Viability</MonoLabel>
            <p className="mt-8 max-w-[80ch] text-[18px] leading-[1.3] font-medium tracking-[-0.02em] text-zinc-900">
              {structured.viability_label || structured.viability}
            </p>
          </ContentBlock>
        )}

        {/* THE PROBLEM */}
        {structured?.the_problem && (
          <ContentBlock withBorder className="max-w-[80ch]">
            <MonoLabel>The Problem</MonoLabel>
            <BodyText className="mt-8 max-w-[80ch]">
              {structured.the_problem}
            </BodyText>
          </ContentBlock>
        )}

        {/* CORE INSIGHT */}
        {structured?.core_insight && (
          <ContentBlock withBorder className="max-w-[80ch]">
            <MonoLabel>Core Insight</MonoLabel>
            <p className="mt-8 max-w-[80ch] text-[20px] leading-[1.3] font-medium tracking-[-0.02em] text-zinc-900">
              {structured.core_insight.headline}
            </p>
            {structured.core_insight.explanation && (
              <BodyText className="mt-4 max-w-[80ch]" variant="secondary">
                {structured.core_insight.explanation}
              </BodyText>
            )}
          </ContentBlock>
        )}

        {/* PRIMARY RECOMMENDATION */}
        {structured?.primary_recommendation && (
          <ContentBlock withBorder className="max-w-[80ch]">
            <MonoLabel>Primary Recommendation</MonoLabel>
            <BodyText size="md" className="mt-8 max-w-[80ch]">
              {structured.primary_recommendation}
            </BodyText>
          </ContentBlock>
        )}

        {/* RECOMMENDED PATH (if present) */}
        {structured?.recommended_path &&
          structured.recommended_path.length > 0 && (
            <ContentBlock withBorder className="max-w-[80ch]">
              <MonoLabel>Recommended Path</MonoLabel>
              <div className="mt-6 space-y-4">
                {structured.recommended_path.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-[13px] font-medium text-zinc-400">
                      {step.step || idx + 1}
                    </span>
                    <div>
                      <p className="text-[18px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]">
                        {step.action}
                      </p>
                      {step.rationale && (
                        <p className="mt-1 text-[16px] leading-[1.3] tracking-[-0.02em] text-zinc-500">
                          {step.rationale}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ContentBlock>
          )}

        {/* Handle any unknown fields gracefully */}
        {structured &&
          Object.entries(structured).map(([key, value]) => {
            // Skip known fields
            if (
              [
                'narrative_lead',
                'viability',
                'viability_label',
                'the_problem',
                'core_insight',
                'primary_recommendation',
                'recommended_path',
              ].includes(key)
            ) {
              return null;
            }
            return (
              <ContentBlock key={key} withBorder className="max-w-[80ch]">
                <UnknownFieldRenderer
                  data={value}
                  label={key.replace(/_/g, ' ')}
                />
              </ContentBlock>
            );
          })}
      </ArticleBlock>
    </Section>
  );
});

export default ExecutiveSummarySection;
