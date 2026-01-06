/**
 * Problem Analysis Section
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * Deep analysis of the problem space. Structured breakdown with
 * governing equations, root causes, and industry benchmarks.
 */
import { memo } from 'react';

import type { ProblemAnalysis } from '~/app/reports/_lib/types/hybrid-report-display.types';

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

interface FromScratchRevelation {
  discovery?: string;
  source?: string;
  implication?: string;
}

interface ProblemAnalysisSectionProps {
  data?: ProblemAnalysis;
  fromScratchRevelations?: FromScratchRevelation[];
}

export const ProblemAnalysisSection = memo(function ProblemAnalysisSection({
  data,
  fromScratchRevelations,
}: ProblemAnalysisSectionProps) {
  if (!data) return null;

  return (
    <Section id="problem-analysis">
      <SectionTitle className="mb-12">Problem Analysis</SectionTitle>

      <ArticleBlock>
        {/* WHAT'S WRONG */}
        {data.whats_wrong?.prose && (
          <div>
            <MonoLabel>What&apos;s Wrong</MonoLabel>
            <BodyText size="md" className="mt-4 max-w-[80ch]">
              {data.whats_wrong.prose}
            </BodyText>
          </div>
        )}

        {/* WHY IT'S HARD */}
        {data.why_its_hard && (
          <ContentBlock withBorder className="max-w-[80ch]">
            <MonoLabel>Why It&apos;s Hard</MonoLabel>
            {data.why_its_hard.prose && (
              <BodyText size="md" className="mt-4 max-w-[80ch]">
                {data.why_its_hard.prose}
              </BodyText>
            )}

            {/* Factors */}
            {data.why_its_hard.factors &&
              data.why_its_hard.factors.length > 0 && (
                <div className="mt-6 space-y-3">
                  {data.why_its_hard.factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="py-2 md:border-l-2 md:border-zinc-200 md:pl-4"
                    >
                      <p className="text-[18px] font-medium text-zinc-900">
                        {factor.factor}
                      </p>
                      {factor.explanation && (
                        <p className="mt-1 text-[16px] leading-[1.3] text-zinc-600">
                          {factor.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </ContentBlock>
        )}

        {/* GOVERNING EQUATION */}
        {data.why_its_hard?.governing_equation && (
          <ContentBlock withBorder>
            <HighlightBox variant="subtle" className="max-w-[80ch]">
              <MonoLabel>Governing Equation</MonoLabel>

              {/* The equation itself - monospace, larger */}
              <p className="mt-6 font-mono text-[22px] text-zinc-900">
                {data.why_its_hard.governing_equation.equation}
              </p>

              {/* Explanation */}
              {data.why_its_hard.governing_equation.explanation && (
                <p className="mt-2 text-[18px] text-zinc-500 italic">
                  {data.why_its_hard.governing_equation.explanation}
                </p>
              )}
            </HighlightBox>
          </ContentBlock>
        )}

        {/* FIRST PRINCIPLES INSIGHT */}
        {data.first_principles_insight && (
          <ContentBlock withBorder className="max-w-[60ch]">
            <MonoLabel variant="muted">First Principles Insight</MonoLabel>
            <h3 className="mt-4 text-[28px] leading-[1.25] font-medium text-zinc-900">
              {data.first_principles_insight.headline}
            </h3>
            {data.first_principles_insight.explanation && (
              <BodyText className="mt-4" variant="muted">
                {data.first_principles_insight.explanation}
              </BodyText>
            )}
          </ContentBlock>
        )}

        {/* FIRST PRINCIPLES CONCEPT (from cross-domain revelations) */}
        {fromScratchRevelations && fromScratchRevelations.length > 0 && (
          <ContentBlock withBorder className="max-w-[70ch]">
            <MonoLabel variant="muted">First Principles Concept</MonoLabel>
            <div className="mt-6 space-y-6">
              {fromScratchRevelations.map((revelation, idx) => (
                <div
                  key={idx}
                  className="py-2 md:border-l-2 md:border-zinc-200 md:pl-4"
                >
                  {revelation.discovery && (
                    <p className="text-[18px] leading-[1.3] font-medium tracking-[-0.02em] text-[#1e1e1e]">
                      {revelation.discovery}
                    </p>
                  )}
                  {revelation.source && (
                    <p className="mt-1 text-[14px] tracking-[-0.02em] text-zinc-500">
                      Source: {revelation.source}
                    </p>
                  )}
                  {revelation.implication && (
                    <p className="mt-2 text-[16px] leading-[1.4] tracking-[-0.02em] text-zinc-600">
                      {revelation.implication}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ContentBlock>
        )}

        {/* WHAT INDUSTRY DOES TODAY */}
        {data.what_industry_does_today &&
          data.what_industry_does_today.length > 0 && (
            <ContentBlock withBorder className="max-w-[80ch]">
              <MonoLabel>What Industry Does Today</MonoLabel>

              {/* Mobile: Stacked cards */}
              <div className="mt-6 space-y-6 md:hidden">
                {data.what_industry_does_today.map((item, idx) => (
                  <div
                    key={idx}
                    className="border-b border-zinc-200 pb-6 last:border-b-0"
                  >
                    <p className="text-[17px] font-medium text-[#1e1e1e]">
                      {item.approach}
                    </p>
                    {item.limitation && (
                      <div className="mt-3">
                        <span className="text-[13px] font-medium text-zinc-500">
                          Limitation
                        </span>
                        <p className="mt-1 text-[15px] leading-[1.4] text-zinc-600">
                          {item.limitation}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop: Table layout */}
              <div className="mt-6 hidden md:block">
                <table className="w-full text-[18px]">
                  <thead>
                    <tr className="border-b border-zinc-300">
                      <th className="py-3 pr-8 text-left font-medium text-zinc-900">
                        Approach
                      </th>
                      <th className="py-3 text-left font-medium text-zinc-500">
                        Limitation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {data.what_industry_does_today.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-4 pr-8 align-top text-[#1e1e1e]">
                          {item.approach}
                        </td>
                        <td className="py-4 align-top text-zinc-600">
                          {item.limitation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ContentBlock>
          )}

        {/* CURRENT STATE OF THE ART */}
        {data.current_state_of_art?.benchmarks &&
          data.current_state_of_art.benchmarks.length > 0 && (
            <ContentBlock withBorder>
              <MonoLabel>Current State of the Art</MonoLabel>

              {/* Mobile: Stacked cards */}
              <div className="mt-6 space-y-6 md:hidden">
                {data.current_state_of_art.benchmarks.map((b, idx) => (
                  <div
                    key={idx}
                    className="border-b border-zinc-200 pb-6 last:border-b-0"
                  >
                    <p className="text-[17px] font-medium text-[#1e1e1e]">
                      {b.entity}
                    </p>
                    {b.approach && (
                      <div className="mt-3">
                        <span className="text-[13px] font-medium text-zinc-500">
                          Approach
                        </span>
                        <p className="mt-1 text-[15px] leading-[1.4] text-zinc-700">
                          {b.approach}
                        </p>
                      </div>
                    )}
                    {b.current_performance && (
                      <div className="mt-3">
                        <span className="text-[13px] font-medium text-zinc-500">
                          Current Performance
                        </span>
                        <p className="mt-1 text-[15px] leading-[1.4] text-zinc-700">
                          {b.current_performance}
                        </p>
                      </div>
                    )}
                    {b.target_roadmap && (
                      <div className="mt-3">
                        <span className="text-[13px] font-medium text-zinc-500">
                          Target/Roadmap
                        </span>
                        <p className="mt-1 text-[15px] leading-[1.4] text-zinc-700">
                          {b.target_roadmap}
                        </p>
                      </div>
                    )}
                    {b.source && (
                      <p className="mt-2 text-[13px] text-zinc-500">
                        Source: {b.source}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop: Table layout */}
              <div className="mt-6 hidden overflow-x-auto md:block">
                <table className="w-full text-[18px]">
                  <thead>
                    <tr className="border-b border-zinc-300">
                      <th className="py-3 pr-8 text-left font-medium text-zinc-900">
                        Entity
                      </th>
                      <th className="py-3 pr-8 text-left font-medium text-zinc-500">
                        Approach
                      </th>
                      <th className="py-3 pr-8 text-left font-medium text-zinc-500">
                        Current Performance
                      </th>
                      <th className="py-3 pr-8 text-left font-medium text-zinc-500">
                        Target/Roadmap
                      </th>
                      <th className="py-3 text-left font-medium text-zinc-500">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {data.current_state_of_art.benchmarks.map((b, idx) => (
                      <tr key={idx}>
                        <td className="py-4 pr-8 align-top font-medium text-[#1e1e1e]">
                          {b.entity}
                        </td>
                        <td className="py-4 pr-8 align-top text-zinc-700">
                          {b.approach}
                        </td>
                        <td className="py-4 pr-8 align-top text-zinc-700">
                          {b.current_performance}
                        </td>
                        <td className="py-4 pr-8 align-top text-zinc-700">
                          {b.target_roadmap}
                        </td>
                        <td className="py-4 align-top text-zinc-500">
                          {b.source}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.current_state_of_art.no_competitors_note && (
                <p className="mt-4 text-[16px] text-zinc-500 italic">
                  {data.current_state_of_art.no_competitors_note}
                </p>
              )}
            </ContentBlock>
          )}

        {/* ROOT CAUSE HYPOTHESES */}
        {data.root_cause_hypotheses &&
          data.root_cause_hypotheses.length > 0 && (
            <ContentBlock withBorder className="max-w-[80ch]">
              <MonoLabel>Root Cause Hypotheses</MonoLabel>
              <div className="mt-6 space-y-6">
                {data.root_cause_hypotheses.map((hypothesis, idx) => (
                  <AccentBorder
                    key={hypothesis.id ?? idx}
                    weight={
                      (hypothesis.confidence_percent ?? 50) >= 70
                        ? 'heavy'
                        : 'medium'
                    }
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-[18px] font-medium text-zinc-900">
                        {hypothesis.name ?? hypothesis.hypothesis}
                      </p>
                      {(hypothesis.confidence_percent !== undefined ||
                        hypothesis.confidence) && (
                        <span className="flex-shrink-0 text-[13px] text-zinc-500">
                          {hypothesis.confidence_percent !== undefined
                            ? `${hypothesis.confidence_percent}% confidence`
                            : hypothesis.confidence}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[18px] leading-[1.3] text-zinc-600">
                      {hypothesis.explanation ??
                        hypothesis.evidence ??
                        hypothesis.implication}
                    </p>
                  </AccentBorder>
                ))}
              </div>
            </ContentBlock>
          )}

        {/* SUCCESS METRICS */}
        {data.success_metrics && data.success_metrics.length > 0 && (
          <ContentBlock withBorder>
            <MonoLabel>Success Metrics</MonoLabel>

            {/* Mobile: Stacked cards */}
            <div className="mt-6 space-y-6 md:hidden">
              {data.success_metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="border-b border-zinc-200 pb-6 last:border-b-0"
                >
                  <p className="text-[17px] font-medium text-[#1e1e1e]">
                    {m.metric}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                    {m.target && (
                      <div>
                        <span className="text-[13px] text-zinc-500">
                          Target:{' '}
                        </span>
                        <span className="text-[15px] font-medium text-emerald-700">
                          {m.target}
                        </span>
                      </div>
                    )}
                    {m.minimum_viable && (
                      <div>
                        <span className="text-[13px] text-zinc-500">Min: </span>
                        <span className="text-[15px] text-zinc-700">
                          {m.minimum_viable}
                        </span>
                      </div>
                    )}
                    {m.stretch && (
                      <div>
                        <span className="text-[13px] text-zinc-500">
                          Stretch:{' '}
                        </span>
                        <span className="text-[15px] text-zinc-700">
                          {m.stretch}
                        </span>
                      </div>
                    )}
                  </div>
                  {m.unit && (
                    <p className="mt-2 text-[13px] text-zinc-500">
                      Unit: {m.unit}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="mt-6 hidden overflow-x-auto md:block">
              <table className="w-full text-[18px]">
                <thead>
                  <tr className="border-b border-zinc-300">
                    <th className="py-3 pr-8 text-left font-medium text-zinc-900">
                      Metric
                    </th>
                    <th className="py-3 pr-8 text-left font-medium text-zinc-500">
                      Target
                    </th>
                    <th className="py-3 pr-8 text-left font-medium text-zinc-500">
                      Minimum Viable
                    </th>
                    <th className="py-3 pr-8 text-left font-medium text-zinc-500">
                      Stretch
                    </th>
                    <th className="py-3 text-left font-medium text-zinc-500">
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.success_metrics.map((m, idx) => (
                    <tr key={idx}>
                      <td className="py-4 pr-8 align-top font-medium text-[#1e1e1e]">
                        {m.metric}
                      </td>
                      <td className="py-4 pr-8 align-top font-medium text-emerald-700">
                        {m.target}
                      </td>
                      <td className="py-4 pr-8 align-top text-zinc-700">
                        {m.minimum_viable}
                      </td>
                      <td className="py-4 pr-8 align-top text-zinc-700">
                        {m.stretch}
                      </td>
                      <td className="py-4 align-top text-zinc-500">{m.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentBlock>
        )}

        {/* Handle any unknown fields gracefully */}
        {Object.entries(data).map(([key, value]) => {
          // Skip known fields
          if (
            [
              'whats_wrong',
              'why_its_hard',
              'first_principles_insight',
              'what_industry_does_today',
              'current_state_of_art',
              'root_cause_hypotheses',
              'success_metrics',
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

export default ProblemAnalysisSection;
