/**
 * Self Critique Section
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * Honest assessment of what we might be wrong about.
 * Shows intellectual honesty and builds trust.
 */
import { memo } from 'react';

import type { SelfCritique } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

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

/** Title case a confidence level string (e.g., "high" -> "High") */
function titleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

interface SelfCritiqueSectionProps {
  data?: SelfCritique;
}

export const SelfCritiqueSection = memo(function SelfCritiqueSection({
  data,
}: SelfCritiqueSectionProps) {
  if (!data) return null;

  const hasContent =
    data.confidence_level ||
    data.overall_confidence ||
    (data.what_we_might_be_wrong_about &&
      data.what_we_might_be_wrong_about.length > 0) ||
    (data.unexplored_directions && data.unexplored_directions.length > 0) ||
    (data.validation_gaps && data.validation_gaps.length > 0);

  if (!hasContent) return null;

  return (
    <Section id="self-critique" className="mt-20">
      <SectionTitle size="lg">Self-Critique</SectionTitle>
      <SectionSubtitle>Where we might be wrong.</SectionSubtitle>

      <ArticleBlock className="mt-10">
        {/* Confidence level */}
        {(data.confidence_level || data.overall_confidence) && (
          <div className="max-w-[60ch]">
            <MonoLabel variant="muted">Overall Confidence</MonoLabel>
            <p className="mt-3 text-[20px] leading-[1.3] font-medium tracking-[-0.02em] text-zinc-900">
              {titleCase(
                data.overall_confidence || data.confidence_level || '',
              )}
            </p>
            {data.confidence_rationale && (
              <BodyText className="mt-2" variant="secondary">
                {data.confidence_rationale}
              </BodyText>
            )}
          </div>
        )}

        {/* What we might be wrong about */}
        {data.what_we_might_be_wrong_about &&
          data.what_we_might_be_wrong_about.length > 0 && (
            <ContentBlock withBorder className="max-w-[65ch]">
              <AccentBorder>
                <MonoLabel variant="muted">
                  What We Might Be Wrong About
                </MonoLabel>
                <ul className="mt-4 space-y-3">
                  {data.what_we_might_be_wrong_about.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-400" />
                      <p className="text-[18px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]">
                        {item}
                      </p>
                    </li>
                  ))}
                </ul>
              </AccentBorder>
            </ContentBlock>
          )}

        {/* Unexplored directions */}
        {data.unexplored_directions &&
          data.unexplored_directions.length > 0 && (
            <ContentBlock withBorder className="max-w-[65ch]">
              <MonoLabel variant="muted">Unexplored Directions</MonoLabel>
              <ul className="mt-4 space-y-3">
                {data.unexplored_directions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-300" />
                    <p className="text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </ContentBlock>
          )}

        {/* Validation gaps */}
        {data.validation_gaps && data.validation_gaps.length > 0 && (
          <ContentBlock withBorder>
            <MonoLabel variant="muted">Validation Gaps</MonoLabel>

            {/* Mobile: Stacked cards */}
            <div className="mt-4 space-y-4 md:hidden">
              {data.validation_gaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="border-b border-zinc-200 pb-4 last:border-b-0"
                >
                  <p className="text-[16px] font-medium text-[#1e1e1e]">
                    {gap.concern}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[13px] text-zinc-500">Status:</span>
                    <ValidationStatus status={gap.status} />
                  </div>
                  {gap.rationale && (
                    <p className="mt-2 text-[15px] leading-[1.4] text-zinc-600">
                      {gap.rationale}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full text-[16px]">
                <thead>
                  <tr className="border-b border-zinc-300">
                    <th className="py-3 pr-6 text-left font-medium text-zinc-900">
                      Concern
                    </th>
                    <th className="w-40 py-3 pr-6 text-left font-medium text-zinc-500">
                      Status
                    </th>
                    <th className="py-3 text-left font-medium text-zinc-500">
                      Rationale
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.validation_gaps.map((gap, idx) => (
                    <tr key={idx}>
                      <td className="py-3 pr-6 align-top font-medium text-[#1e1e1e]">
                        {gap.concern}
                      </td>
                      <td className="py-3 pr-6 align-top">
                        <ValidationStatus status={gap.status} />
                      </td>
                      <td className="py-3 align-top text-zinc-600">
                        {gap.rationale}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentBlock>
        )}
      </ArticleBlock>
    </Section>
  );
});

const ValidationStatus = memo(function ValidationStatus({
  status,
}: {
  status: 'ADDRESSED' | 'EXTENDED_NEEDED' | 'ACCEPTED_RISK';
}) {
  const statusStyles = {
    ADDRESSED: 'text-zinc-700 font-medium',
    EXTENDED_NEEDED: 'text-zinc-500',
    ACCEPTED_RISK: 'text-zinc-400 italic',
  };

  const statusLabels = {
    ADDRESSED: 'Addressed',
    EXTENDED_NEEDED: 'Extended Needed',
    ACCEPTED_RISK: 'Accepted Risk',
  };

  return (
    <span className={statusStyles[status] || 'text-zinc-500'}>
      {statusLabels[status] || status}
    </span>
  );
});

export default SelfCritiqueSection;
