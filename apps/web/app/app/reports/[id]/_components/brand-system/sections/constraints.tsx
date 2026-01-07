/**
 * Constraints & Metrics Section
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * Clear hierarchy: Hard constraints > Soft constraints > Assumptions
 * All communicated through typographic weight, no color coding.
 */
import { memo } from 'react';

import type { ConstraintsAndMetrics } from '~/app/reports/_lib/types/hybrid-report-display.types';

import {
  ArticleBlock,
  ConstraintList,
  ContentBlock,
  MonoLabel,
  Section,
  SectionTitle,
  UnknownFieldRenderer,
} from '../primitives';

interface ConstraintsSectionProps {
  data?: ConstraintsAndMetrics;
  /**
   * Render variant:
   * - 'full': Complete section with all fields (default)
   * - 'preview': Condensed version for showcase gallery cards
   */
  variant?: 'full' | 'preview';
}

export const ConstraintsSection = memo(function ConstraintsSection({
  data,
  variant = 'full',
}: ConstraintsSectionProps) {
  if (!data) return null;

  const hasContent =
    (data.hard_constraints && data.hard_constraints.length > 0) ||
    (data.soft_constraints && data.soft_constraints.length > 0) ||
    (data.assumptions && data.assumptions.length > 0) ||
    (data.success_metrics && data.success_metrics.length > 0);

  if (!hasContent) return null;

  // Preview variant: condensed view for showcase gallery
  if (variant === 'preview') {
    const hardCount = data.hard_constraints?.length || 0;
    const softCount = data.soft_constraints?.length || 0;
    const metricsCount = data.success_metrics?.length || 0;

    return (
      <div className="space-y-4">
        {/* First hard constraint */}
        {data.hard_constraints && data.hard_constraints.length > 0 && (
          <div className="border-l-2 border-zinc-900 pl-4">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
              Hard Constraint
            </p>
            <p className="mt-1 text-[15px] font-medium text-zinc-900">
              {data.hard_constraints[0]}
            </p>
          </div>
        )}

        {/* First soft constraint */}
        {data.soft_constraints && data.soft_constraints.length > 0 && (
          <div className="pl-4">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
              Soft Constraint
            </p>
            <p className="mt-1 text-[15px] text-zinc-700">
              {data.soft_constraints[0]}
            </p>
          </div>
        )}

        {/* Summary counts */}
        <div className="flex flex-wrap gap-3 text-[14px]">
          {hardCount > 0 && (
            <span>
              <span className="font-medium text-zinc-700">{hardCount}</span>{' '}
              <span className="text-zinc-500">hard</span>
            </span>
          )}
          {softCount > 0 && (
            <span>
              <span className="font-medium text-zinc-700">{softCount}</span>{' '}
              <span className="text-zinc-500">soft</span>
            </span>
          )}
          {metricsCount > 0 && (
            <span>
              <span className="font-medium text-zinc-700">{metricsCount}</span>{' '}
              <span className="text-zinc-500">metrics</span>
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Section id="constraints">
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
                        <span className="text-[15px] font-semibold text-emerald-700">
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
