/**
 * Solution Concepts Section (Execution Track)
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * Primary recommendation with supporting concepts.
 * The "do this first" with fallback options.
 */
import { memo } from 'react';

import { cn } from '@kit/ui/utils';

import type {
  ActionableConfidence,
  ExecutionTrack,
  ExecutionTrackPrimary,
  InsightBlock,
  Readiness,
  RiskClassification,
  SupportingConcept,
  ValidationGate,
} from '~/app/reports/_lib/types/hybrid-report-display.types';

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

// ============================================
// RISK CLASSIFICATION BLOCK
// ============================================

interface RiskClassificationBlockProps {
  data?: RiskClassification;
}

const RiskClassificationBlock = memo(function RiskClassificationBlock({
  data,
}: RiskClassificationBlockProps) {
  if (!data) return null;

  const hasContent =
    data.scientific_risk?.status ||
    data.engineering_risk?.status ||
    data.one_line_summary;

  if (!hasContent) return null;

  // Monochrome styling per Air Company aesthetic
  const getRiskStyles = (
    status?: 'RETIRED' | 'ACTIVE' | 'HIGH' | 'LOW' | 'MEDIUM',
  ) => {
    switch (status) {
      case 'HIGH':
        return { dot: 'bg-zinc-900', text: 'text-zinc-700 font-medium' };
      case 'ACTIVE':
      case 'MEDIUM':
        return { dot: 'bg-zinc-500', text: 'text-zinc-500' };
      case 'RETIRED':
      case 'LOW':
        return { dot: 'bg-zinc-400', text: 'text-zinc-400' };
      default:
        return { dot: 'bg-zinc-400', text: 'text-zinc-500' };
    }
  };

  return (
    <ContentBlock withBorder className="max-w-[70ch]">
      <MonoLabel>Risk Classification</MonoLabel>

      {data.one_line_summary && (
        <p className="mt-3 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-900">
          {data.one_line_summary}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.scientific_risk?.status && (
          <div className="space-y-2">
            <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
              Scientific Risk
            </span>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  getRiskStyles(data.scientific_risk.status).dot,
                )}
              />
              <span
                className={cn(
                  'text-[13px]',
                  getRiskStyles(data.scientific_risk.status).text,
                )}
              >
                {data.scientific_risk.status}
              </span>
            </div>
            {data.scientific_risk.explanation && (
              <p className="text-[16px] leading-[1.4] tracking-[-0.02em] text-zinc-600">
                {data.scientific_risk.explanation}
              </p>
            )}
          </div>
        )}

        {data.engineering_risk?.status && (
          <div className="space-y-2">
            <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
              Engineering Risk
            </span>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  getRiskStyles(data.engineering_risk.status).dot,
                )}
              />
              <span
                className={cn(
                  'text-[13px]',
                  getRiskStyles(data.engineering_risk.status).text,
                )}
              >
                {data.engineering_risk.status}
              </span>
            </div>
            {data.engineering_risk.explanation && (
              <p className="text-[16px] leading-[1.4] tracking-[-0.02em] text-zinc-600">
                {data.engineering_risk.explanation}
              </p>
            )}
          </div>
        )}
      </div>
    </ContentBlock>
  );
});

// ============================================
// ACTIONABLE CONFIDENCE BLOCK
// ============================================

interface ConfidenceDetailBlockProps {
  data?: ActionableConfidence;
}

const ConfidenceDetailBlock = memo(function ConfidenceDetailBlock({
  data,
}: ConfidenceDetailBlockProps) {
  if (!data) return null;

  const hasContent =
    data.hinges_on || data.if_wrong || data.what_would_change_my_mind;

  if (!hasContent) return null;

  return (
    <ContentBlock withBorder className="max-w-[70ch]">
      <MonoLabel>Confidence Analysis</MonoLabel>

      <div className="mt-4 space-y-4">
        {data.hinges_on && (
          <div>
            <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
              Critical Assumption
            </span>
            <p className="mt-1 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-900">
              {data.hinges_on}
            </p>
          </div>
        )}

        {data.if_wrong && (
          <div>
            <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
              If Wrong
            </span>
            <p className="mt-1 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
              {data.if_wrong}
            </p>
          </div>
        )}

        {data.what_would_change_my_mind && (
          <div>
            <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
              What Would Change Our Mind
            </span>
            <p className="mt-1 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
              {data.what_would_change_my_mind}
            </p>
          </div>
        )}
      </div>
    </ContentBlock>
  );
});

// ============================================
// READINESS / TRL BLOCK
// ============================================

interface ReadinessBlockProps {
  data?: Readiness;
}

const ReadinessBlock = memo(function ReadinessBlock({
  data,
}: ReadinessBlockProps) {
  if (!data) return null;

  const hasContent =
    data.trl ||
    data.trl_rationale ||
    data.scale_up_risk ||
    data.key_scale_challenge;

  if (!hasContent) return null;

  // Monochrome styling per Air Company aesthetic
  const getScaleRiskStyles = (risk?: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (risk) {
      case 'HIGH':
        return { dot: 'bg-zinc-900', text: 'text-zinc-700 font-medium' };
      case 'MEDIUM':
        return { dot: 'bg-zinc-500', text: 'text-zinc-500' };
      case 'LOW':
        return { dot: 'bg-zinc-400', text: 'text-zinc-400' };
      default:
        return { dot: 'bg-zinc-400', text: 'text-zinc-500' };
    }
  };

  return (
    <ContentBlock withBorder className="max-w-[70ch]">
      <MonoLabel>Technology Readiness</MonoLabel>

      <div className="mt-4 space-y-4">
        {data.trl && (
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50">
              <span className="text-[20px] font-semibold text-zinc-900">
                {data.trl}
              </span>
            </div>
            <div>
              <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
                Technology Readiness Level
              </span>
              <p className="text-[16px] tracking-[-0.02em] text-zinc-700">
                TRL {data.trl} of 9
              </p>
            </div>
          </div>
        )}

        {data.trl_rationale && (
          <p className="text-[16px] leading-[1.4] tracking-[-0.02em] text-zinc-600">
            {data.trl_rationale}
          </p>
        )}

        {data.scale_up_risk && (
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
              Scale-up Risk
            </span>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  getScaleRiskStyles(data.scale_up_risk).dot,
                )}
              />
              <span
                className={cn(
                  'text-[13px]',
                  getScaleRiskStyles(data.scale_up_risk).text,
                )}
              >
                {data.scale_up_risk}
              </span>
            </div>
          </div>
        )}

        {data.key_scale_challenge && (
          <div>
            <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
              Key Scale Challenge
            </span>
            <p className="mt-1 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
              {data.key_scale_challenge}
            </p>
          </div>
        )}
      </div>
    </ContentBlock>
  );
});

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
        <p className="mt-3 text-[20px] leading-[1.3] font-medium tracking-[-0.02em] text-zinc-900">
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
              <span className="font-medium text-zinc-500">
                How they use it:
              </span>{' '}
              {insight.where_we_found_it.how_they_use_it}
            </p>
          )}
          {insight.where_we_found_it.why_it_transfers && (
            <p>
              <span className="font-medium text-zinc-500">
                Why it transfers:
              </span>{' '}
              {insight.where_we_found_it.why_it_transfers}
            </p>
          )}
        </div>
      )}

      {insight.why_industry_missed_it && (
        <p className="mt-4 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600 italic">
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
            className="py-2 md:border-l-2 md:border-zinc-300 md:pl-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[13px] font-medium text-zinc-400">
                  {gate.week}
                </span>
                <p className="mt-1 text-[18px] leading-[1.3] font-medium text-[#1e1e1e]">
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
              <p className="mt-2 text-[16px] leading-[1.3] text-zinc-500 italic">
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
        <h2 className="text-[28px] leading-tight font-semibold tracking-tight text-zinc-900">
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
          {/* Prefer confidence_detail if available, fall back to legacy confidence */}
          {data.confidence_detail?.level ? (
            <>
              <span className="text-zinc-300">·</span>
              <span
                className={cn(
                  'font-medium',
                  data.confidence_detail.level === 'HIGH'
                    ? 'text-zinc-700'
                    : data.confidence_detail.level === 'MEDIUM'
                      ? 'text-zinc-500'
                      : 'text-zinc-400',
                )}
              >
                {data.confidence_detail.level} confidence
                {data.confidence_detail.percent !== undefined &&
                  ` (${data.confidence_detail.percent}%)`}
              </span>
            </>
          ) : (
            data.confidence !== undefined && (
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
            )
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

      {/* RISK CLASSIFICATION */}
      <RiskClassificationBlock data={data.risk_classification} />

      {/* CONFIDENCE ANALYSIS */}
      <ConfidenceDetailBlock data={data.confidence_detail} />

      {/* TECHNOLOGY READINESS */}
      <ReadinessBlock data={data.readiness} />

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
                <span className="text-[13px] tracking-wide text-zinc-400 uppercase">
                  {concept.relationship}
                </span>
              )}
            </div>

            {/* One-liner */}
            {concept.one_liner && (
              <p className="mt-3 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600 italic">
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
  /**
   * Render variant:
   * - 'full': Complete section with all fields (default)
   * - 'preview': Condensed version for showcase gallery cards
   */
  variant?: 'full' | 'preview';
}

export const SolutionConceptsSection = memo(function SolutionConceptsSection({
  data,
  variant = 'full',
}: SolutionConceptsSectionProps) {
  if (!data) return null;

  // Preview variant: condensed view for showcase gallery
  if (variant === 'preview') {
    const primary = data.primary;
    const supportingCount = data.supporting_concepts?.length || 0;

    return (
      <div className="space-y-4">
        {/* Primary recommendation title */}
        {primary?.title && (
          <div className="border-l-2 border-zinc-900 pl-4">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
              Primary Recommendation
            </p>
            <p className="mt-1 text-[16px] font-medium text-zinc-900">
              {primary.title}
            </p>
          </div>
        )}

        {/* Bottom line if available */}
        {primary?.bottom_line && (
          <p className="text-[15px] leading-relaxed text-zinc-700">
            {primary.bottom_line.slice(0, 200)}
            {primary.bottom_line.length > 200 ? '...' : ''}
          </p>
        )}

        {/* Confidence and alternatives summary */}
        <div className="flex flex-wrap gap-3 text-[14px]">
          {primary?.confidence_detail?.level && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-700">
              {primary.confidence_detail.level} confidence
            </span>
          )}
          {supportingCount > 0 && (
            <span>
              <span className="font-medium text-zinc-700">{supportingCount}</span>{' '}
              <span className="text-zinc-500">alternatives</span>
            </span>
          )}
        </div>
      </div>
    );
  }

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
          <MonoLabel>Why This Isn&apos;t Obvious</MonoLabel>
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
