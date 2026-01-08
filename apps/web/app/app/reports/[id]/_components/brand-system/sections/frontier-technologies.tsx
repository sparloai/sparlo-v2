/**
 * Frontier Technologies Section
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * Technologies to watch - not ready for prime time,
 * but worth monitoring for future potential.
 */
import { memo } from 'react';

import type { FrontierWatch } from '~/app/reports/_lib/types/hybrid-report-display.types';

import {
  ArticleBlock,
  BodyText,
  ContentBlock,
  MonoLabel,
  Section,
  SectionSubtitle,
  SectionTitle,
} from '../primitives';

interface FrontierTechnologiesSectionProps {
  data?: FrontierWatch[];
  /**
   * Render variant:
   * - 'full': Complete section with all fields (default)
   * - 'preview': Condensed version for showcase gallery cards
   */
  variant?: 'full' | 'preview';
}

export const FrontierTechnologiesSection = memo(
  function FrontierTechnologiesSection({
    data,
    variant = 'full',
  }: FrontierTechnologiesSectionProps) {
    if (!data || data.length === 0) return null;

    // Preview variant: condensed view for showcase gallery
    if (variant === 'preview') {
      const firstTech = data[0];

      return (
        <div className="space-y-4">
          {/* First technology */}
          {firstTech && (
            <div className="border-l-2 border-zinc-900 pl-4">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium text-zinc-900">
                  {firstTech.title}
                </p>
                {firstTech.trl_estimate && (
                  <span className="text-[14px] text-zinc-500">
                    TRL {firstTech.trl_estimate}
                  </span>
                )}
              </div>
              {firstTech.one_liner && (
                <p className="mt-1 text-[14px] text-zinc-600">
                  {firstTech.one_liner}
                </p>
              )}
            </div>
          )}

          {/* Count if more */}
          {data.length > 1 && (
            <p className="text-[14px] text-zinc-500">
              <span className="font-medium text-zinc-700">{data.length}</span>{' '}
              technologies to monitor
            </p>
          )}
        </div>
      );
    }

    return (
      <Section id="frontier-technologies" className="mt-20">
        <SectionTitle size="lg">Frontier Watch</SectionTitle>
        <SectionSubtitle>Technologies worth monitoring.</SectionSubtitle>

        <ArticleBlock className="mt-10">
          <div className="grid gap-8 md:grid-cols-2">
            {data.map((tech, idx) => (
              <FrontierCard key={tech.id || idx} tech={tech} />
            ))}
          </div>
        </ArticleBlock>
      </Section>
    );
  },
);

const FrontierCard = memo(function FrontierCard({
  tech,
}: {
  tech: FrontierWatch;
}) {
  return (
    <ContentBlock className="border border-zinc-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-[18px] leading-[1.3] font-medium tracking-[-0.02em] text-zinc-900">
            {tech.title}
          </h4>
          {tech.innovation_type && (
            <span className="mt-1 inline-block text-[12px] font-medium tracking-wider text-zinc-400 uppercase">
              {tech.innovation_type}
            </span>
          )}
        </div>
        {tech.trl_estimate && (
          <div className="text-right">
            <span className="text-[12px] text-zinc-400">TRL</span>
            <p className="text-[18px] font-semibold text-zinc-700">
              {tech.trl_estimate}
            </p>
          </div>
        )}
      </div>

      {tech.one_liner && (
        <p className="mt-3 text-[16px] leading-[1.3] text-zinc-600">
          {tech.one_liner}
        </p>
      )}

      {tech.why_interesting && (
        <div className="mt-4">
          <MonoLabel variant="muted">Why Interesting</MonoLabel>
          <BodyText className="mt-1" variant="secondary">
            {tech.why_interesting}
          </BodyText>
        </div>
      )}

      {tech.why_not_now && (
        <div className="mt-3">
          <MonoLabel variant="muted">Why Not Now</MonoLabel>
          <BodyText className="mt-1" variant="secondary">
            {tech.why_not_now}
          </BodyText>
        </div>
      )}

      <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-[14px]">
        {tech.trigger_to_revisit && (
          <p className="text-zinc-600">
            <span className="font-medium text-zinc-700">Trigger:</span>{' '}
            {tech.trigger_to_revisit}
          </p>
        )}
        {tech.earliest_viability && (
          <p className="text-zinc-500">
            <span className="font-medium">Earliest viability:</span>{' '}
            {tech.earliest_viability}
          </p>
        )}
        {tech.who_to_monitor && (
          <p className="text-zinc-500">
            <span className="font-medium">Monitor:</span> {tech.who_to_monitor}
          </p>
        )}
      </div>
    </ContentBlock>
  );
});

export default FrontierTechnologiesSection;
