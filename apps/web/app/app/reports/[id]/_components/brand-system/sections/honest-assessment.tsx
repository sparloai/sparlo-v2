/**
 * Honest Assessment Section
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * Candid evaluation of the problem type and expected value range.
 * No sugar-coating - straight talk about what's realistic.
 */
import { memo } from 'react';

import type { HonestAssessment } from '~/app/reports/_lib/types/hybrid-report-display.types';

import {
  AccentBorder,
  ArticleBlock,
  BodyText,
  ContentBlock,
  MonoLabel,
  Section,
  SectionSubtitle,
  SectionTitle,
} from '../primitives';

interface HonestAssessmentSectionProps {
  data?: HonestAssessment;
}

export const HonestAssessmentSection = memo(function HonestAssessmentSection({
  data,
}: HonestAssessmentSectionProps) {
  if (!data) return null;

  const hasContent =
    data.problem_type ||
    data.expected_value_range ||
    data.candid_assessment ||
    data.if_value_is_limited;

  if (!hasContent) return null;

  return (
    <Section id="honest-assessment" className="mt-20">
      <SectionTitle size="lg">Honest Assessment</SectionTitle>
      <SectionSubtitle>What you should realistically expect</SectionSubtitle>

      <ArticleBlock className="mt-10">
        {/* Problem type */}
        {data.problem_type && (
          <div className="max-w-[60ch]">
            <MonoLabel variant="muted">Problem Type</MonoLabel>
            <p className="mt-3 text-[20px] leading-[1.3] font-medium tracking-[-0.02em] text-zinc-900">
              {data.problem_type}
            </p>
          </div>
        )}

        {/* Expected value range */}
        {data.expected_value_range && (
          <ContentBlock withBorder className="max-w-[50ch]">
            <MonoLabel variant="muted">Expected Value Range</MonoLabel>
            <div className="mt-4 space-y-3">
              {data.expected_value_range.ceiling && (
                <ValueRangeItem
                  label="Ceiling"
                  value={data.expected_value_range.ceiling}
                  variant="high"
                />
              )}
              {data.expected_value_range.most_likely && (
                <ValueRangeItem
                  label="Most Likely"
                  value={data.expected_value_range.most_likely}
                  variant="primary"
                />
              )}
              {data.expected_value_range.floor && (
                <ValueRangeItem
                  label="Floor"
                  value={data.expected_value_range.floor}
                  variant="low"
                />
              )}
            </div>
          </ContentBlock>
        )}

        {/* Candid assessment */}
        {data.candid_assessment && (
          <ContentBlock withBorder className="max-w-[65ch]">
            <AccentBorder weight="heavy">
              <MonoLabel variant="muted">Candid Assessment</MonoLabel>
              <p className="mt-3 text-[18px] leading-[1.4] tracking-[-0.02em] text-[#1e1e1e]">
                {data.candid_assessment}
              </p>
            </AccentBorder>
          </ContentBlock>
        )}

        {/* If value is limited */}
        {data.if_value_is_limited && (
          <ContentBlock withBorder className="max-w-[65ch]">
            <MonoLabel variant="muted">If Value Is Limited</MonoLabel>
            <BodyText className="mt-3">{data.if_value_is_limited}</BodyText>
          </ContentBlock>
        )}
      </ArticleBlock>
    </Section>
  );
});

const ValueRangeItem = memo(function ValueRangeItem({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: 'high' | 'primary' | 'low';
}) {
  const styles = {
    high: 'md:border-l-2 md:border-zinc-300 text-zinc-600',
    primary: 'md:border-l-4 md:border-zinc-900 font-medium text-zinc-900',
    low: 'md:border-l-2 md:border-zinc-200 text-zinc-500',
  };

  return (
    <div className={`md:pl-4 ${styles[variant]}`}>
      <span className="text-[12px] font-medium tracking-wider text-zinc-400 uppercase">
        {label}
      </span>
      <p className="mt-1 text-[18px] leading-[1.3] tracking-[-0.02em]">
        {value}
      </p>
    </div>
  );
});

export default HonestAssessmentSection;
