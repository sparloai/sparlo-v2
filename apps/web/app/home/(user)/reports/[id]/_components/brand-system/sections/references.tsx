/**
 * References Section
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * Displays inline citations used throughout the report.
 * Links to source material where available.
 */
import { memo } from 'react';

import { ExternalLink } from 'lucide-react';

import type { Reference } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

import { ContentBlock, MonoLabel, Section, SectionTitle } from '../primitives';

interface ReferencesSectionProps {
  data?: Reference[];
}

export const ReferencesSection = memo(function ReferencesSection({
  data,
}: ReferencesSectionProps) {
  if (!data || data.length === 0) return null;

  return (
    <Section id="references" className="mt-20">
      <SectionTitle size="lg">References</SectionTitle>

      <ContentBlock className="mt-8 max-w-[65ch]">
        <MonoLabel variant="muted">Cited Sources</MonoLabel>
        <ol className="mt-4 space-y-4">
          {data.map((ref) => (
            <li key={ref.id} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center text-[13px] font-medium text-zinc-500">
                [{ref.id}]
              </span>
              <div className="flex-1">
                <p className="text-[16px] leading-[1.5] tracking-[-0.01em] text-zinc-700">
                  {ref.citation}
                </p>
                {ref.url && (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[14px] text-zinc-500 transition-colors hover:text-zinc-900"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="max-w-[400px] truncate">{ref.url}</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </ContentBlock>
    </Section>
  );
});

export default ReferencesSection;
