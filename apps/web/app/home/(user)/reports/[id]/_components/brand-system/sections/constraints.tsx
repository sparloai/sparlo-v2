/**
 * Constraints & Metrics Section
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * Clear hierarchy: Hard constraints > Soft constraints > Assumptions
 * All communicated through typographic weight, no color coding.
 */

import { memo } from 'react';

import {
  ArticleBlock,
  ConstraintList,
  ContentBlock,
  MonoLabel,
  Section,
  SectionTitle,
  UnknownFieldRenderer,
} from '../primitives';

import type { ConstraintsAndMetrics } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

interface ConstraintsSectionProps {
  data?: ConstraintsAndMetrics;
}

export const ConstraintsSection = memo(function ConstraintsSection({
  data,
}: ConstraintsSectionProps) {
  if (!data) return null;

  const hasContent =
    (data.hard_constraints && data.hard_constraints.length > 0) ||
    (data.soft_constraints && data.soft_constraints.length > 0) ||
    (data.assumptions && data.assumptions.length > 0) ||
    (data.success_metrics && data.success_metrics.length > 0);

  if (!hasContent) return null;

  return (
    <Section id="constraints-metrics">
      <SectionTitle className="mb-12">Constraints</SectionTitle>

      <ArticleBlock>
        {/* Three-column grid for constraints */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* HARD CONSTRAINTS */}
          {data.hard_constraints && data.hard_constraints.length > 0 && (
            <ConstraintList items={data.hard_constraints} variant="hard" />
          )}

          {/* SOFT CONSTRAINTS */}
          {data.soft_constraints && data.soft_constraints.length > 0 && (
            <ConstraintList items={data.soft_constraints} variant="soft" />
          )}

          {/* ASSUMPTIONS */}
          {data.assumptions && data.assumptions.length > 0 && (
            <ConstraintList items={data.assumptions} variant="assumption" />
          )}
        </div>

        {/* SUCCESS METRICS TABLE */}
        {data.success_metrics && data.success_metrics.length > 0 && (
          <ContentBlock withBorder>
            <MonoLabel>Success Metrics</MonoLabel>
            <div className="mt-6 overflow-x-auto">
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
                      <td className="py-4 pr-8 align-top font-semibold text-emerald-700">
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
          if (
            [
              'hard_constraints',
              'soft_constraints',
              'assumptions',
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

export default ConstraintsSection;
