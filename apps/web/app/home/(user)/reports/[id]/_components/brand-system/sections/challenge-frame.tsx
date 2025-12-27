/**
 * Challenge the Frame Section
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * Questioning assumptions and reframing the problem.
 * Emphasis on provocative reframes that unlock new solution spaces.
 */

import { memo } from 'react';

import {
  AccentBorder,
  ArticleBlock,
  BodyText,
  ContentBlock,
  MonoLabel,
  Section,
  SectionTitle,
} from '../primitives';

import type { ChallengeTheFrame } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

interface ChallengeFrameSectionProps {
  data?: ChallengeTheFrame[];
  reframe?: string;
  firstPrinciples?: string;
  insight?: string;
}

export const ChallengeFrameSection = memo(function ChallengeFrameSection({
  data,
  reframe,
  firstPrinciples,
  insight,
}: ChallengeFrameSectionProps) {
  const hasContent =
    (data && data.length > 0) || reframe || firstPrinciples || insight;

  if (!hasContent) return null;

  return (
    <Section id="challenge-the-frame">
      <SectionTitle className="mb-12">Challenge the Frame</SectionTitle>

      <ArticleBlock>
        {/* THE REFRAME - Main pull quote */}
        {reframe && (
          <div className="max-w-[60ch]">
            <MonoLabel variant="muted">The Reframe</MonoLabel>
            <p className="mt-4 text-[22px] font-medium leading-[1.3] tracking-[-0.02em] text-zinc-900">
              {reframe}
            </p>
          </div>
        )}

        {/* FIRST PRINCIPLES */}
        {firstPrinciples && (
          <ContentBlock withBorder className="max-w-[60ch]">
            <MonoLabel variant="muted">First Principles</MonoLabel>
            <BodyText className="mt-4">{firstPrinciples}</BodyText>
          </ContentBlock>
        )}

        {/* THE INSIGHT */}
        {insight && (
          <ContentBlock withBorder className="max-w-[60ch]">
            <AccentBorder weight="heavy">
              <MonoLabel variant="muted">The Insight</MonoLabel>
              <p className="mt-3 text-[20px] font-medium leading-[1.3] tracking-[-0.02em] text-zinc-900">
                {insight}
              </p>
            </AccentBorder>
          </ContentBlock>
        )}

        {/* CHALLENGE THE FRAME ITEMS */}
        {data && data.length > 0 && (
          <ContentBlock withBorder>
            <MonoLabel>Assumptions Challenged</MonoLabel>
            <ul className="mt-6 space-y-6">
              {data.map((item, idx) => (
                <li key={idx} className="max-w-[70ch]">
                  {/* Assumption */}
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-900" />
                    <div>
                      <p className="text-[18px] font-medium leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]">
                        {item.assumption}
                      </p>

                      {/* Challenge */}
                      {item.challenge && (
                        <p className="mt-2 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
                          <span className="font-medium text-zinc-500">
                            Challenge:
                          </span>{' '}
                          {item.challenge}
                        </p>
                      )}

                      {/* Implication */}
                      {item.implication && (
                        <p className="mt-2 border-l-2 border-zinc-300 pl-4 text-[18px] italic leading-[1.3] tracking-[-0.02em] text-zinc-600">
                          {item.implication}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ContentBlock>
        )}
      </ArticleBlock>
    </Section>
  );
});

export default ChallengeFrameSection;
