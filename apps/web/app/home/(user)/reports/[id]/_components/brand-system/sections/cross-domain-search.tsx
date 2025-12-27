/**
 * Cross-Domain Search Section
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * Shows how we searched across domains for relevant mechanisms
 * and what we discovered from first principles.
 */

import { memo } from 'react';

import {
  ArticleBlock,
  BodyText,
  ContentBlock,
  MonoLabel,
  Section,
  SectionSubtitle,
  SectionTitle,
} from '../primitives';

import type { CrossDomainSearch } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

interface CrossDomainSearchSectionProps {
  data?: CrossDomainSearch;
}

export const CrossDomainSearchSection = memo(function CrossDomainSearchSection({
  data,
}: CrossDomainSearchSectionProps) {
  if (!data) return null;

  const hasContent =
    data.enhanced_challenge_frame ||
    (data.domains_searched && data.domains_searched.length > 0) ||
    (data.from_scratch_revelations && data.from_scratch_revelations.length > 0);

  if (!hasContent) return null;

  return (
    <Section id="cross-domain-search" className="mt-20">
      <SectionTitle size="lg">Cross-Domain Search</SectionTitle>
      <SectionSubtitle>Where we looked and what we found</SectionSubtitle>

      <ArticleBlock className="mt-10">
        {/* Enhanced challenge frame */}
        {data.enhanced_challenge_frame && (
          <div className="max-w-[65ch]">
            {data.enhanced_challenge_frame.reframing && (
              <>
                <MonoLabel variant="muted">Reframing</MonoLabel>
                <p className="mt-3 text-[20px] font-medium leading-[1.3] tracking-[-0.02em] text-zinc-900">
                  {data.enhanced_challenge_frame.reframing}
                </p>
              </>
            )}
            {data.enhanced_challenge_frame.search_queries &&
              data.enhanced_challenge_frame.search_queries.length > 0 && (
                <div className="mt-4">
                  <span className="text-[13px] font-medium text-zinc-500">Search Queries</span>
                  <ul className="mt-2 space-y-1">
                    {data.enhanced_challenge_frame.search_queries.map((query, idx) => (
                      <li key={idx} className="text-[14px] font-mono text-zinc-600">
                        "{query}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        )}

        {/* Domains searched */}
        {data.domains_searched && data.domains_searched.length > 0 && (
          <ContentBlock withBorder>
            <MonoLabel variant="muted">Domains Explored</MonoLabel>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-[16px]">
                <thead>
                  <tr className="border-b border-zinc-300">
                    <th className="py-3 pr-6 text-left font-medium text-zinc-900">Domain</th>
                    <th className="py-3 pr-6 text-left font-medium text-zinc-500">Mechanism Found</th>
                    <th className="py-3 text-left font-medium text-zinc-500">Relevance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.domains_searched.map((domain, idx) => (
                    <tr key={idx}>
                      <td className="py-3 pr-6 align-top font-medium text-[#1e1e1e]">
                        {domain.domain}
                      </td>
                      <td className="py-3 pr-6 align-top text-zinc-700">
                        {domain.mechanism_found}
                      </td>
                      <td className="py-3 align-top text-zinc-600">{domain.relevance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentBlock>
        )}

        {/* From scratch revelations */}
        {data.from_scratch_revelations && data.from_scratch_revelations.length > 0 && (
          <ContentBlock withBorder className="max-w-[70ch]">
            <MonoLabel variant="muted">First Principles Revelations</MonoLabel>
            <div className="mt-6 space-y-6">
              {data.from_scratch_revelations.map((revelation, idx) => (
                <div key={idx} className="border-l-2 border-zinc-200 pl-4">
                  {revelation.discovery && (
                    <p className="text-[18px] font-medium leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]">
                      {revelation.discovery}
                    </p>
                  )}
                  {revelation.source && (
                    <p className="mt-1 text-[14px] text-zinc-500">
                      Source: {revelation.source}
                    </p>
                  )}
                  {revelation.implication && (
                    <BodyText className="mt-2" variant="secondary">
                      {revelation.implication}
                    </BodyText>
                  )}
                </div>
              ))}
            </div>
          </ContentBlock>
        )}
      </ArticleBlock>
    </Section>
  );
});

export default CrossDomainSearchSection;
