/**
 * Innovation Concepts Section
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * Displays the recommended innovation and parallel investigations.
 * Higher-risk, higher-reward alternatives to the execution track.
 */
import { memo } from 'react';

import { cn } from '@kit/ui/utils';

import type {
  ActionableConfidence,
  InnovationPortfolio,
  ParallelInvestigation,
  Readiness,
  RecommendedInnovation,
  RiskClassification,
} from '~/app/app/reports/_lib/types/hybrid-report-display.types';

import {
  AccentBorder,
  ArticleBlock,
  BodyText,
  ContentBlock,
  MetadataGrid,
  MonoLabel,
  Section,
  SectionSubtitle,
  SectionTitle,
} from '../primitives';

// ============================================
// RISK CLASSIFICATION BLOCK (for Innovation)
// ============================================

interface InnovationRiskClassificationBlockProps {
  data?: RiskClassification;
}

const InnovationRiskClassificationBlock = memo(
  function InnovationRiskClassificationBlock({
    data,
  }: InnovationRiskClassificationBlockProps) {
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
      <div className="mt-6 md:border-l-2 md:border-zinc-200 md:pl-4">
        <MonoLabel variant="muted">Risk Classification</MonoLabel>

        {data.one_line_summary && (
          <p className="mt-2 text-[16px] leading-[1.3] font-medium tracking-[-0.02em] text-zinc-900">
            {data.one_line_summary}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4 text-[14px]">
          {data.scientific_risk?.status && (
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Scientific:</span>
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
          )}

          {data.engineering_risk?.status && (
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Engineering:</span>
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
          )}
        </div>
      </div>
    );
  },
);

// ============================================
// CONFIDENCE DETAIL BLOCK (for Innovation)
// ============================================

interface InnovationConfidenceDetailBlockProps {
  data?: ActionableConfidence;
}

const InnovationConfidenceDetailBlock = memo(
  function InnovationConfidenceDetailBlock({
    data,
  }: InnovationConfidenceDetailBlockProps) {
    if (!data) return null;

    const hasContent =
      data.hinges_on || data.if_wrong || data.what_would_change_my_mind;

    if (!hasContent) return null;

    return (
      <div className="mt-6 md:border-l-2 md:border-zinc-200 md:pl-4">
        <MonoLabel variant="muted">Confidence Analysis</MonoLabel>

        <div className="mt-3 space-y-3">
          {data.hinges_on && (
            <div>
              <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
                Hinges on
              </span>
              <p className="mt-1 text-[16px] leading-[1.3] tracking-[-0.02em] text-zinc-900">
                {data.hinges_on}
              </p>
            </div>
          )}

          {data.if_wrong && (
            <div>
              <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
                If wrong
              </span>
              <p className="mt-1 text-[16px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
                {data.if_wrong}
              </p>
            </div>
          )}

          {data.what_would_change_my_mind && (
            <div>
              <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
                Would change our mind
              </span>
              <p className="mt-1 text-[16px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
                {data.what_would_change_my_mind}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },
);

// ============================================
// READINESS / TRL BLOCK (for Innovation)
// ============================================

interface InnovationReadinessBlockProps {
  data?: Readiness;
}

const InnovationReadinessBlock = memo(function InnovationReadinessBlock({
  data,
}: InnovationReadinessBlockProps) {
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
    <div className="mt-6 md:border-l-2 md:border-zinc-200 md:pl-4">
      <MonoLabel variant="muted">Technology Readiness</MonoLabel>

      <div className="mt-3 space-y-2">
        {data.trl && (
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-[14px] font-semibold text-zinc-900">
              {data.trl}
            </span>
            <span className="text-[16px] tracking-[-0.02em] text-zinc-700">
              TRL {data.trl} of 9
            </span>
          </div>
        )}

        {data.trl_rationale && (
          <p className="text-[16px] leading-[1.4] tracking-[-0.02em] text-zinc-600">
            {data.trl_rationale}
          </p>
        )}

        {data.scale_up_risk && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Scale-up Risk:</span>
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
        )}

        {data.key_scale_challenge && (
          <div>
            <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
              Key challenge
            </span>
            <p className="mt-1 text-[16px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
              {data.key_scale_challenge}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

// ============================================
// MAIN SECTION COMPONENT
// ============================================

interface InnovationConceptsSectionProps {
  data?: InnovationPortfolio;
}

export const InnovationConceptsSection = memo(
  function InnovationConceptsSection({ data }: InnovationConceptsSectionProps) {
    if (!data) return null;

    const hasContent =
      data.recommended_innovation ||
      (data.parallel_investigations && data.parallel_investigations.length > 0);

    if (!hasContent) return null;

    return (
      <Section id="innovation-concepts" className="mt-20">
        <SectionTitle size="lg">Innovation Concepts</SectionTitle>
        <SectionSubtitle>
          Higher-risk explorations with breakthrough potential.
        </SectionSubtitle>

        {data.intro && (
          <BodyText className="mt-6 max-w-[65ch]" variant="secondary">
            {data.intro}
          </BodyText>
        )}

        <ArticleBlock className="mt-10">
          {data.recommended_innovation && (
            <RecommendedInnovationCard
              innovation={data.recommended_innovation}
            />
          )}

          {data.parallel_investigations &&
            data.parallel_investigations.length > 0 && (
              <ContentBlock withBorder>
                <MonoLabel>Parallel Investigations</MonoLabel>
                <div className="mt-6 space-y-8">
                  {data.parallel_investigations.map((inv, idx) => (
                    <ParallelInvestigationCard
                      key={inv.id || idx}
                      investigation={inv}
                    />
                  ))}
                </div>
              </ContentBlock>
            )}
        </ArticleBlock>
      </Section>
    );
  },
);

const RecommendedInnovationCard = memo(function RecommendedInnovationCard({
  innovation,
}: {
  innovation: RecommendedInnovation;
}) {
  return (
    <div className="md:border-l-4 md:border-zinc-900 md:pl-6">
      <MonoLabel variant="muted">Recommended Innovation</MonoLabel>

      <h3 className="mt-4 text-[24px] leading-[1.2] font-semibold tracking-[-0.02em] text-zinc-900">
        {innovation.title}
      </h3>

      {(innovation.score ||
        innovation.confidence ||
        innovation.confidence_detail?.level) && (
        <div className="mt-2 flex items-center gap-4 text-[14px] text-zinc-500">
          {innovation.score && (
            <span>
              Score:{' '}
              <span className="font-medium text-zinc-700">
                {innovation.score}
              </span>
            </span>
          )}
          {/* Prefer confidence_detail if available, fall back to legacy confidence */}
          {innovation.confidence_detail?.level ? (
            <span>
              Confidence:{' '}
              <span
                className={cn(
                  'font-medium',
                  innovation.confidence_detail.level === 'HIGH'
                    ? 'text-zinc-700'
                    : innovation.confidence_detail.level === 'MEDIUM'
                      ? 'text-zinc-600'
                      : 'text-zinc-500',
                )}
              >
                {innovation.confidence_detail.level}
                {innovation.confidence_detail.percent !== undefined &&
                  ` (${innovation.confidence_detail.percent}%)`}
              </span>
            </span>
          ) : (
            innovation.confidence && (
              <span>
                Confidence:{' '}
                <span className="font-medium text-zinc-700">
                  {innovation.confidence}%
                </span>
              </span>
            )
          )}
        </div>
      )}

      {innovation.what_it_is && (
        <p className="mt-4 text-[18px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]">
          {innovation.what_it_is}
        </p>
      )}

      {innovation.why_it_works && (
        <p className="mt-3 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
          {innovation.why_it_works}
        </p>
      )}

      {innovation.selection_rationale && (
        <div className="mt-6 md:border-l-2 md:border-zinc-200 md:pl-4">
          <MonoLabel variant="muted">Why This Innovation</MonoLabel>
          {innovation.selection_rationale.why_this_one && (
            <BodyText className="mt-2">
              {innovation.selection_rationale.why_this_one}
            </BodyText>
          )}
          {innovation.selection_rationale.ceiling_if_works && (
            <p className="mt-2 text-[16px] leading-[1.3] text-zinc-600">
              <span className="font-medium text-zinc-700">If it works:</span>{' '}
              {innovation.selection_rationale.ceiling_if_works}
            </p>
          )}
        </div>
      )}

      {innovation.the_insight && (
        <div className="mt-6">
          <AccentBorder>
            <MonoLabel variant="muted">The Insight</MonoLabel>
            {innovation.the_insight.what && (
              <p className="mt-2 text-[18px] leading-[1.3] font-medium tracking-[-0.02em] text-zinc-900">
                {innovation.the_insight.what}
              </p>
            )}
          </AccentBorder>
        </div>
      )}

      {innovation.breakthrough_potential && (
        <div className="mt-6 bg-zinc-50 p-4">
          <MonoLabel variant="muted">Breakthrough Potential</MonoLabel>
          <div className="mt-3 space-y-2 text-[16px]">
            {innovation.breakthrough_potential.if_it_works && (
              <p className="text-zinc-700">
                <span className="font-medium">If it works:</span>{' '}
                {innovation.breakthrough_potential.if_it_works}
              </p>
            )}
            {innovation.breakthrough_potential.estimated_improvement && (
              <p className="text-zinc-700">
                <span className="font-medium">Improvement:</span>{' '}
                {innovation.breakthrough_potential.estimated_improvement}
              </p>
            )}
          </div>
        </div>
      )}

      {/* RISK CLASSIFICATION */}
      <InnovationRiskClassificationBlock
        data={innovation.risk_classification}
      />

      {/* CONFIDENCE ANALYSIS */}
      <InnovationConfidenceDetailBlock data={innovation.confidence_detail} />

      {/* TECHNOLOGY READINESS */}
      <InnovationReadinessBlock data={innovation.readiness} />

      {innovation.validation_path && (
        <div className="mt-6 border-t border-zinc-200 pt-6">
          <MonoLabel variant="muted">First Validation Step</MonoLabel>
          <MetadataGrid
            className="mt-3"
            items={[
              {
                label: 'Gating Question',
                value: innovation.validation_path.gating_question,
              },
              {
                label: 'First Test',
                value: innovation.validation_path.first_test,
              },
              { label: 'Cost', value: innovation.validation_path.cost },
              { label: 'Timeline', value: innovation.validation_path.timeline },
            ].filter((item): item is { label: string; value: string } =>
              Boolean(item.value),
            )}
          />
        </div>
      )}
    </div>
  );
});

const ParallelInvestigationCard = memo(function ParallelInvestigationCard({
  investigation,
}: {
  investigation: ParallelInvestigation;
}) {
  return (
    <div className="md:border-l-2 md:border-zinc-200 md:pl-6">
      <h4 className="text-[18px] leading-[1.3] font-medium tracking-[-0.02em] text-zinc-900">
        {investigation.title}
      </h4>

      {(investigation.score || investigation.confidence) && (
        <div className="mt-1 flex items-center gap-3 text-[13px] text-zinc-500">
          {investigation.score && <span>Score: {investigation.score}</span>}
          {investigation.confidence && (
            <span>Confidence: {investigation.confidence}%</span>
          )}
        </div>
      )}

      {investigation.one_liner && (
        <p className="mt-2 text-[16px] leading-[1.3] text-zinc-600">
          {investigation.one_liner}
        </p>
      )}

      {investigation.what_it_is && (
        <p className="mt-3 text-[16px] leading-[1.3] text-[#1e1e1e]">
          {investigation.what_it_is}
        </p>
      )}

      <div className="mt-3 space-y-1 text-[14px]">
        {investigation.ceiling && (
          <p className="text-zinc-600">
            <span className="font-medium text-zinc-700">Ceiling:</span>{' '}
            {investigation.ceiling}
          </p>
        )}
        {investigation.key_uncertainty && (
          <p className="text-zinc-600">
            <span className="font-medium text-zinc-700">Key uncertainty:</span>{' '}
            {investigation.key_uncertainty}
          </p>
        )}
        {investigation.when_to_elevate && (
          <p className="text-zinc-500">
            <span className="font-medium">Elevate when:</span>{' '}
            {investigation.when_to_elevate}
          </p>
        )}
      </div>
    </div>
  );
});

export default InnovationConceptsSection;
