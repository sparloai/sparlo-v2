/**
 * Innovation Analysis Section
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * Contains:
 * - Reframe (moved from Challenge the Frame)
 * - Domains Searched
 */
import { memo } from 'react';

import type { InnovationAnalysis } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

import {
  ArticleBlock,
  BodyText,
  ContentBlock,
  MonoLabel,
  Section,
  SectionTitle,
} from '../primitives';

interface InnovationAnalysisSectionProps {
  data?: InnovationAnalysis;
  domainsSearched?: string[];
}

export const InnovationAnalysisSection = memo(
  function InnovationAnalysisSection({
    data,
    domainsSearched,
  }: InnovationAnalysisSectionProps) {
    const hasReframe = data?.reframe && data.reframe.trim().length > 0;
    const hasDomains = domainsSearched && domainsSearched.length > 0;

    if (!hasReframe && !hasDomains) return null;

    return (
      <Section id="innovation-analysis">
        <SectionTitle className="mb-12">Innovation Analysis</SectionTitle>

        <ArticleBlock>
          {/* REFRAME */}
          {hasReframe && (
            <ContentBlock withBorder className="max-w-[70ch]">
              <MonoLabel variant="muted">Reframe</MonoLabel>
              <BodyText size="lg" className="mt-4">
                {data?.reframe}
              </BodyText>
            </ContentBlock>
          )}

          {/* DOMAINS SEARCHED */}
          {hasDomains && (
            <ContentBlock withBorder className="max-w-[80ch]">
              <MonoLabel>Domains Searched</MonoLabel>
              <div className="mt-4 flex flex-wrap gap-2">
                {domainsSearched?.map((domain, idx) => (
                  <span
                    key={idx}
                    className="inline-block rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-[14px] font-medium tracking-[-0.01em] text-zinc-700"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </ContentBlock>
          )}
        </ArticleBlock>
      </Section>
    );
  },
);

export default InnovationAnalysisSection;
