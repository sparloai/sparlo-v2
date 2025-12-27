/**
 * Solution Concepts Section (Execution Track)
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * Primary recommendation with supporting concepts.
 * The "do this first" with fallback options.
 */

import { cn } from '@kit/ui/utils';
import { memo } from 'react';

import {
  AccentBorder,
  ArticleBlock,
  BodyText,
  ContentBlock,
  HighlightBox,
  MonoLabel,
  Section,
  SectionTitle,
  UnknownFieldRenderer,
} from '../primitives';

import type {
  ExecutionTrack,
  ExecutionTrackPrimary,
  InsightBlock,
  SupportingConcept,
  ValidationGate,
} from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

// ============================================
// INSIGHT BLOCK
// ============================================

interface InsightBlockComponentProps {
  insight?: InsightBlock;
}

const InsightBlockComponent = memo(function InsightBlockComponent({
  insight,
}: InsightBlockComponentProps) {
  if (!insight) return null;

  return (
    <AccentBorder weight="heavy" className="mt-10">
      <MonoLabel variant="muted">The Insight</MonoLabel>

      {insight.what && (
        <p className="mt-3 text-[20px] font-medium leading-[1.3] tracking-[-0.02em] text-zinc-900">
          {insight.what}
        </p>
      )}

      {insight.where_we_found_it && (
        <div className="mt-4 space-y-2 text-[16px] text-zinc-600">
          {insight.where_we_found_it.domain && (
            <p>
              <span className="font-medium text-zinc-500">Domain:</span>{' '}
              {insight.where_we_found_it.domain}
            </p>
          )}
          {insight.where_we_found_it.how_they_use_it && (
            <p>
              <span className="font-medium text-zinc-500">How they use it:</span>{' '}
              {insight.where_we_found_it.how_they_use_it}
            </p>
          )}
          {insight.where_we_found_it.why_it_transfers && (
            <p>
              <span className="font-medium text-zinc-500">Why it transfers:</span>{' '}
              {insight.where_we_found_it.why_it_transfers}
            </p>
          )}
        </div>
      )}

      {insight.why_industry_missed_it && (
        <p className="mt-4 text-[18px] italic leading-[1.3] tracking-[-0.02em] text-zinc-600">
          Why industry missed it: {insight.why_industry_missed_it}
        </p>
      )}

      {insight.physics && (
        <div className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-4">
          <span className="text-[13px] font-medium text-zinc-500">Physics</span>
          <p className="mt-1 font-mono text-[16px] text-zinc-700">
            {insight.physics}
          </p>
        </div>
      )}
    </AccentBorder>
  );
});

// ============================================
// VALIDATION GATES
// ============================================

interface ValidationGatesProps {
  gates?: ValidationGate[];
}

const ValidationGates = memo(function ValidationGates({
  gates,
}: ValidationGatesProps) {
  if (!gates || gates.length === 0) return null;

  return (
    <ContentBlock withBorder>
      <MonoLabel>Validation Gates</MonoLabel>
      <div className="mt-6 space-y-6">
        {gates.map((gate, idx) => (
          <div
            key={idx}
            className="border-l-2 border-zinc-300 py-2 pl-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[13px] font-medium text-zinc-400">
                  {gate.week}
                </span>
                <p className="mt-1 text-[18px] font-medium leading-[1.3] text-[#1e1e1e]">
                  {gate.test}
                </p>
              </div>
              {gate.cost && (
                <span className="flex-shrink-0 text-[13px] text-zinc-500">
                  {gate.cost}
                </span>
              )}
            </div>

            {gate.method && (
              <p className="mt-2 text-[16px] leading-[1.3] text-zinc-600">
                <span className="font-medium text-zinc-500">Method:</span>{' '}
                {gate.method}
              </p>
            )}

            {gate.success_criteria && (
              <p className="mt-2 text-[16px] leading-[1.3] text-zinc-600">
                <span className="font-medium text-zinc-500">Success:</span>{' '}
                {gate.success_criteria}
              </p>
            )}

            {gate.decision_point && (
              <p className="mt-2 text-[16px] italic leading-[1.3] text-zinc-500">
                {gate.decision_point}
              </p>
            )}
          </div>
        ))}
      </div>
    </ContentBlock>
  );
});

// ============================================
// PRIMARY RECOMMENDATION CARD
// ============================================

interface PrimaryRecommendationCardProps {
  data?: ExecutionTrackPrimary;
}

const PrimaryRecommendationCard = memo(function PrimaryRecommendationCard({
  data,
}: PrimaryRecommendationCardProps) {
  if (!data) return null;

  return (
    <ArticleBlock className="space-y-12">
      {/* HEADER */}
      <header className="space-y-4">
        <MonoLabel>Primary Recommendation</MonoLabel>

        {/* Title */}
        <h2 className="text-[28px] font-semibold leading-tight tracking-tight text-zinc-900">
          {data.title}
        </h2>

        {/* Meta: Source type, confidence */}
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          {data.source_type && (
            <span className="text-zinc-500">
              {data.source_type.replace(/_/g, ' ')}
            </span>
          )}
          {data.source && (
            <>
              <span className="text-zinc-300">·</span>
              <span className="text-zinc-500">{data.source}</span>
            </>
          )}
          {data.confidence !== undefined && (
            <>
              <span className="text-zinc-300">·</span>
              <span
                className={cn(
                  'font-medium',
                  data.confidence >= 70
                    ? 'text-zinc-700'
                    : data.confidence >= 40
                      ? 'text-zinc-500'
                      : 'text-zinc-400',
                )}
              >
                {data.confidence}% confidence
              </span>
            </>
          )}
        </div>
      </header>

      {/* BOTTOM LINE */}
      {data.bottom_line && (
        <div>
          <MonoLabel>Bottom Line</MonoLabel>
          <BodyText size="md" className="mt-4 max-w-[70ch]">
            {data.bottom_line}
          </BodyText>
        </div>
      )}

      {/* WHAT IT IS */}
      {data.what_it_is && (
        <ContentBlock withBorder className="max-w-[70ch]">
          <MonoLabel>What It Is</MonoLabel>
          <BodyText className="mt-4">{data.what_it_is}</BodyText>
        </ContentBlock>
      )}

      {/* WHY IT WORKS */}
      {data.why_it_works && (
        <ContentBlock withBorder className="max-w-[70ch]">
          <MonoLabel>Why It Works</MonoLabel>
          <BodyText className="mt-4">{data.why_it_works}</BodyText>
        </ContentBlock>
      )}

      {/* THE INSIGHT */}
      <InsightBlockComponent insight={data.the_insight} />

      {/* KEY METRICS GRID */}
      {(data.expected_improvement || data.timeline || data.investment) && (
        <ContentBlock withBorder>
          <HighlightBox variant="subtle">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {data.expected_improvement && (
                <div>
                  <MonoLabel variant="muted">Expected Improvement</MonoLabel>
                  <p className="mt-2 text-[18px] font-medium text-zinc-900">
                    {data.expected_improvement}
                  </p>
                </div>
              )}
              {data.timeline && (
                <div>
                  <MonoLabel variant="muted">Timeline</MonoLabel>
                  <p className="mt-2 text-[18px] font-medium text-zinc-900">
                    {data.timeline}
                  </p>
                </div>
              )}
              {data.investment && (
                <div>
                  <MonoLabel variant="muted">Investment</MonoLabel>
                  <p className="mt-2 text-[18px] font-medium text-zinc-900">
                    {data.investment}
                  </p>
                </div>
              )}
            </div>
          </HighlightBox>
        </ContentBlock>
      )}

      {/* WHY SAFE */}
      {data.why_safe && (
        <ContentBlock withBorder className="max-w-[70ch]">
          <MonoLabel>Why This is Safe</MonoLabel>
          <div className="mt-4 space-y-3">
            {data.why_safe.track_record && (
              <p className="text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
                <span className="font-medium text-zinc-900">Track Record:</span>{' '}
                {data.why_safe.track_record}
              </p>
            )}
            {data.why_safe.precedent && data.why_safe.precedent.length > 0 && (
              <div>
                <span className="text-[16px] font-medium text-zinc-500">
                  Precedent:
                </span>
                <ul className="mt-2 space-y-1">
                  {data.why_safe.precedent.map((p, idx) => (
                    <li
                      key={idx}
                      className="text-[18px] leading-[1.3] text-zinc-600"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ContentBlock>
      )}

      {/* WHY IT MIGHT FAIL */}
      {data.why_it_might_fail && data.why_it_might_fail.length > 0 && (
        <ContentBlock withBorder className="max-w-[70ch]">
          <MonoLabel>Why It Might Fail</MonoLabel>
          <ul className="mt-4 space-y-3">
            {data.why_it_might_fail.map((reason, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600"
              >
                <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-400" />
                {reason}
              </li>
            ))}
          </ul>
        </ContentBlock>
      )}

      {/* VALIDATION GATES */}
      <ValidationGates gates={data.validation_gates} />
    </ArticleBlock>
  );
});

// ============================================
// SUPPORTING CONCEPTS
// ============================================

interface SupportingConceptsProps {
  concepts?: SupportingConcept[];
}

const SupportingConceptsSection = memo(function SupportingConceptsSection({
  concepts,
}: SupportingConceptsProps) {
  if (!concepts || concepts.length === 0) return null;

  return (
    <Section id="supporting-concepts" className="mt-20">
      <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900">
        Supporting Concepts
      </h2>

      <div className="mt-10 space-y-16">
        {concepts.map((concept, idx) => (
          <div key={concept.id ?? idx} className="max-w-[70ch]">
            {/* Title + Type */}
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-[20px] font-semibold tracking-tight text-zinc-900">
                {concept.title}
              </h3>
              {concept.relationship && (
                <span className="text-[13px] uppercase tracking-wide text-zinc-400">
                  {concept.relationship}
                </span>
              )}
            </div>

            {/* One-liner */}
            {concept.one_liner && (
              <p className="mt-3 text-[18px] italic leading-[1.3] tracking-[-0.02em] text-zinc-600">
                {concept.one_liner}
              </p>
            )}

            {/* What It Is */}
            {concept.what_it_is && (
              <div className="mt-6">
                <MonoLabel>What It Is</MonoLabel>
                <BodyText className="mt-2">{concept.what_it_is}</BodyText>
              </div>
            )}

            {/* Why It Works */}
            {concept.why_it_works && (
              <div className="mt-6">
                <MonoLabel>Why It Works</MonoLabel>
                <BodyText className="mt-2">{concept.why_it_works}</BodyText>
              </div>
            )}

            {/* When to Use Instead */}
            {concept.when_to_use_instead && (
              <AccentBorder weight="light" className="mt-6">
                <MonoLabel variant="muted">When to Use Instead</MonoLabel>
                <BodyText className="mt-2" variant="secondary">
                  {concept.when_to_use_instead}
                </BodyText>
              </AccentBorder>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
});

// ============================================
// MAIN SECTION COMPONENT
// ============================================

interface SolutionConceptsSectionProps {
  data?: ExecutionTrack;
}

export const SolutionConceptsSection = memo(function SolutionConceptsSection({
  data,
}: SolutionConceptsSectionProps) {
  if (!data) return null;

  return (
    <Section id="solution-concepts">
      <SectionTitle className="mb-12">Solution Concepts</SectionTitle>

      {/* Intro */}
      {data.intro && (
        <BodyText className="mb-12 max-w-[70ch]" variant="secondary">
          {data.intro}
        </BodyText>
      )}

      {/* Primary Recommendation */}
      <div id="primary-recommendation">
        <PrimaryRecommendationCard data={data.primary} />
      </div>

      {/* Supporting Concepts */}
      <SupportingConceptsSection concepts={data.supporting_concepts} />

      {/* Why Not Obvious */}
      {data.why_not_obvious && (
        <ContentBlock withBorder className="mt-12 max-w-[70ch]">
          <MonoLabel>Why This Isn't Obvious</MonoLabel>
          <div className="mt-4 space-y-4">
            {data.why_not_obvious.industry_gap && (
              <p className="text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
                <span className="font-medium text-zinc-900">Industry Gap:</span>{' '}
                {data.why_not_obvious.industry_gap}
              </p>
            )}
            {data.why_not_obvious.knowledge_barrier && (
              <p className="text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
                <span className="font-medium text-zinc-900">
                  Knowledge Barrier:
                </span>{' '}
                {data.why_not_obvious.knowledge_barrier}
              </p>
            )}
            {data.why_not_obvious.our_contribution && (
              <p className="text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
                <span className="font-medium text-zinc-900">
                  Our Contribution:
                </span>{' '}
                {data.why_not_obvious.our_contribution}
              </p>
            )}
          </div>
        </ContentBlock>
      )}

      {/* Fallback Trigger */}
      {data.fallback_trigger && (
        <ContentBlock withBorder className="mt-12 max-w-[70ch]">
          <MonoLabel>Fallback Trigger</MonoLabel>
          <div className="mt-4 space-y-4">
            {data.fallback_trigger.conditions &&
              data.fallback_trigger.conditions.length > 0 && (
                <div>
                  <span className="text-[16px] font-medium text-zinc-500">
                    Pivot if:
                  </span>
                  <ul className="mt-2 space-y-1">
                    {data.fallback_trigger.conditions.map((c, idx) => (
                      <li
                        key={idx}
                        className="text-[18px] leading-[1.3] text-zinc-600"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            {data.fallback_trigger.pivot_to && (
              <p className="text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
                <span className="font-medium text-zinc-900">Pivot to:</span>{' '}
                {data.fallback_trigger.pivot_to}
              </p>
            )}
            {data.fallback_trigger.sunk_cost_limit && (
              <p className="text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
                <span className="font-medium text-zinc-900">
                  Sunk Cost Limit:
                </span>{' '}
                {data.fallback_trigger.sunk_cost_limit}
              </p>
            )}
          </div>
        </ContentBlock>
      )}

      {/* Handle unknown fields */}
      {data &&
        Object.entries(data).map(([key, value]) => {
          if (
            [
              'intro',
              'primary',
              'supporting_concepts',
              'why_not_obvious',
              'fallback_trigger',
              'supplier_arbitrage',
            ].includes(key)
          ) {
            return null;
          }
          return (
            <ContentBlock key={key} withBorder className="max-w-[70ch]">
              <UnknownFieldRenderer
                data={value}
                label={key.replace(/_/g, ' ')}
              />
            </ContentBlock>
          );
        })}
    </Section>
  );
});

export default SolutionConceptsSection;
