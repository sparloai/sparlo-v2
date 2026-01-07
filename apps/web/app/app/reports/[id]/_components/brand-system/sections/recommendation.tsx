/**
 * Recommendation Section
 *
 * Air Company Aesthetic - Technical Monograph, Not AI Tool
 *
 * Personal, opinionated take—direct advice from the analysis.
 * Should feel like a senior advisor speaking plainly.
 *
 * Visual elements:
 * - Larger lead paragraph (the "if you read nothing else" takeaway)
 * - Flowing prose, no bullet points
 * - Generous line height for conversational pacing
 * - "If This Were My Project" label signals personal voice
 */
import { memo } from 'react';

import type { StrategicIntegration } from '~/app/reports/_lib/types/hybrid-report-display.types';

import {
  AccentBorder,
  BodyText,
  MonoLabel,
  Section,
  SectionSubtitle,
  SectionTitle,
} from '../primitives';

interface RecommendationSectionProps {
  content?: string;
  personalRecommendation?: StrategicIntegration['personal_recommendation'];
  /**
   * Render variant:
   * - 'full': Complete section with all fields (default)
   * - 'preview': Condensed version for showcase gallery cards
   */
  variant?: 'full' | 'preview';
}

export const RecommendationSection = memo(function RecommendationSection({
  content,
  personalRecommendation,
  variant = 'full',
}: RecommendationSectionProps) {
  const hasContent = content || personalRecommendation?.key_insight;

  if (!hasContent) return null;

  // Preview variant: condensed view for showcase gallery
  if (variant === 'preview') {
    const keyInsight = personalRecommendation?.key_insight;
    const firstParagraph = content?.split(/\n\n+/)[0];

    return (
      <div className="space-y-4">
        {/* Key insight or first paragraph */}
        {keyInsight ? (
          <div className="border-l-2 border-zinc-900 pl-4">
            <p className="text-[17px] font-medium leading-relaxed text-zinc-900">
              {keyInsight}
            </p>
          </div>
        ) : firstParagraph ? (
          <p className="text-[17px] leading-relaxed text-zinc-700">
            {firstParagraph}
          </p>
        ) : null}

        {/* Intro if available */}
        {personalRecommendation?.intro && !keyInsight && (
          <p className="text-[15px] text-zinc-600">
            {personalRecommendation.intro}
          </p>
        )}
      </div>
    );
  }

  // If we have a string content, split into paragraphs
  const paragraphs = content ? content.split(/\n\n+/).filter(Boolean) : [];

  return (
    <Section id="final-recommendation" className="mt-20">
      <SectionTitle size="lg">Final Recommendation</SectionTitle>
      <SectionSubtitle>
        Personal recommendation from the analysis.
      </SectionSubtitle>

      <div className="mt-10 max-w-[65ch]">
        <MonoLabel variant="muted">If This Were My Project</MonoLabel>

        {/* Personal recommendation from strategic integration */}
        {personalRecommendation && (
          <div className="mt-6">
            {personalRecommendation.intro && (
              <BodyText className="mb-4" variant="secondary">
                {personalRecommendation.intro}
              </BodyText>
            )}
            {personalRecommendation.key_insight && (
              <AccentBorder weight="heavy">
                <p className="text-[20px] leading-[1.3] font-medium tracking-[-0.02em] text-zinc-900">
                  {personalRecommendation.key_insight}
                </p>
              </AccentBorder>
            )}
          </div>
        )}

        {/* Flowing prose content */}
        {paragraphs.length > 0 && (
          <div className="mt-6 space-y-6">
            {paragraphs.map((para, index) => (
              <p
                key={index}
                className={`leading-[1.3] tracking-[-0.02em] ${
                  index === 0
                    ? 'text-[20px] text-[#1e1e1e]'
                    : 'text-[18px] text-zinc-600'
                }`}
              >
                {para}
              </p>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
});

// ============================================
// WITH CALLOUT VARIANT
// ============================================

interface RecommendationWithCalloutProps {
  leadAdvice: string;
  leadDetail?: string;
  paragraphs?: string[];
}

export const RecommendationWithCallout = memo(
  function RecommendationWithCallout({
    leadAdvice,
    leadDetail,
    paragraphs = [],
  }: RecommendationWithCalloutProps) {
    return (
      <Section id="recommendation" className="mt-20">
        <SectionTitle size="lg">Recommendation</SectionTitle>
        <SectionSubtitle>
          Personal recommendation from the analysis
        </SectionSubtitle>

        <div className="mt-10 max-w-[65ch]">
          <MonoLabel variant="muted">If This Were My Project</MonoLabel>

          {/* Lead advice - emphasized with border */}
          <div className="mt-6 md:border-l-2 md:border-zinc-900 md:pl-6">
            <p className="text-[20px] leading-[1.3] font-medium tracking-[-0.02em] text-zinc-900">
              {leadAdvice}
            </p>
            {leadDetail && (
              <p className="mt-3 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
                {leadDetail}
              </p>
            )}
          </div>

          {/* Secondary recommendations */}
          {paragraphs.length > 0 && (
            <div className="mt-10 space-y-6">
              {paragraphs.map((para, index) => (
                <p
                  key={index}
                  className="text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600"
                >
                  {para}
                </p>
              ))}
            </div>
          )}
        </div>
      </Section>
    );
  },
);

// ============================================
// WITH ACTION SUMMARY VARIANT
// ============================================

interface ActionSummary {
  label: string;
  action: string;
}

interface RecommendationWithSummaryProps {
  paragraphs: string[];
  actions: ActionSummary[];
}

export const RecommendationWithSummary = memo(
  function RecommendationWithSummary({
    paragraphs,
    actions,
  }: RecommendationWithSummaryProps) {
    return (
      <Section id="recommendation" className="mt-20">
        <SectionTitle size="lg">Recommendation</SectionTitle>
        <SectionSubtitle>
          Personal recommendation from the analysis
        </SectionSubtitle>

        <div className="mt-10 max-w-[65ch]">
          <MonoLabel variant="muted">If This Were My Project</MonoLabel>

          <div className="mt-6 space-y-6">
            {paragraphs.map((para, index) => (
              <p
                key={index}
                className={`leading-[1.3] tracking-[-0.02em] ${
                  index === 0
                    ? 'text-[20px] text-[#1e1e1e]'
                    : 'text-[18px] text-zinc-600'
                }`}
              >
                {para}
              </p>
            ))}
          </div>

          {/* Quick summary */}
          {actions.length > 0 && (
            <div className="mt-10 border-t border-zinc-200 pt-8">
              <div className="grid grid-cols-1 gap-6 text-[18px] md:grid-cols-2">
                {actions.map((item) => (
                  <div key={item.label}>
                    <span className="font-medium text-zinc-900">
                      {item.label}:
                    </span>
                    <span className="ml-2 text-zinc-600">{item.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>
    );
  },
);

export default RecommendationSection;
