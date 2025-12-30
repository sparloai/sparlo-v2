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

interface DomainSearched {
  domain?: string;
  mechanism_found?: string;
  relevance?: string;
}

interface InnovationAnalysisSectionProps {
  data?: InnovationAnalysis;
  domainsSearched?: DomainSearched[];
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
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-[18px]">
                  <thead>
                    <tr className="border-b border-zinc-300">
                      <th className="py-3 pr-8 text-left font-medium text-zinc-900">
                        Domain
                      </th>
                      <th className="py-3 pr-8 text-left font-medium text-zinc-500">
                        Mechanism Found
                      </th>
                      <th className="py-3 text-left font-medium text-zinc-500">
                        Relevance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {domainsSearched?.map((d, idx) => (
                      <tr key={idx}>
                        <td className="py-4 pr-8 align-top font-medium text-[#1e1e1e]">
                          {d.domain}
                        </td>
                        <td className="py-4 pr-8 align-top text-zinc-700">
                          {d.mechanism_found}
                        </td>
                        <td className="py-4 align-top text-zinc-600">
                          {d.relevance}
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
  },
);

export default InnovationAnalysisSection;
