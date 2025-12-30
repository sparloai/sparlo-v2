/**
 * Innovation Concepts Section
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * Displays the recommended innovation and parallel investigations.
 * Higher-risk, higher-reward alternatives to the execution track.
 */
import { memo } from 'react';

import type {
  InnovationPortfolio,
  ParallelInvestigation,
  RecommendedInnovation,
} from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

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

      {(innovation.score || innovation.confidence) && (
        <div className="mt-2 flex items-center gap-4 text-[14px] text-zinc-500">
          {innovation.score && (
            <span>
              Score:{' '}
              <span className="font-medium text-zinc-700">
                {innovation.score}
              </span>
            </span>
          )}
          {innovation.confidence && (
            <span>
              Confidence:{' '}
              <span className="font-medium text-zinc-700">
                {innovation.confidence}%
              </span>
            </span>
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
