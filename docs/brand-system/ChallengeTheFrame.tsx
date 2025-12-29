/**
 * ChallengeTheFrame
 *
 * Air Company Aesthetic - Technical Monograph, Not AI Tool
 *
 * Structure:
 * 1. The Reframe — Provocative headline that challenges conventional thinking
 * 2. Conventional Thinking — What industry/experts currently believe
 * 3. The Actual Situation — Evidence-based reframe
 * 4. Why This Matters — Implications of accepting the new frame
 * 5. Questions This Raises — Open questions for exploration
 */

import React from 'react';

// ============================================
// TYPES
// ============================================

interface ConventionalThinking {
  belief: string;
  source: string;
}

interface EvidencePoint {
  claim: string;
  evidence: string;
}

interface OpenQuestion {
  question: string;
  context?: string;
}

interface ChallengeTheFrameProps {
  reframeHeadline: string;
  reframeExplanation: string;
  conventionalThinking: ConventionalThinking[];
  actualSituation: EvidencePoint[];
  whyThisMatters: string;
  questionsRaised: OpenQuestion[];
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ChallengeTheFrame({
  reframeHeadline,
  reframeExplanation,
  conventionalThinking,
  actualSituation,
  whyThisMatters,
  questionsRaised,
}: ChallengeTheFrameProps) {
  return (
    <article className="border-l-2 border-zinc-900 bg-white pl-10">
      {/* ----------------------------------------
          THE REFRAME - Key insight, light treatment
          ---------------------------------------- */}
      <section className="max-w-[60ch]">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          The Reframe
        </span>
        <h3 className="mt-4 text-[28px] font-medium leading-[1.25] text-zinc-900">
          {reframeHeadline}
        </h3>
        <p className="mt-4 text-[18px] leading-[1.6] text-zinc-500">
          {reframeExplanation}
        </p>
      </section>

      {/* ----------------------------------------
          CONVENTIONAL THINKING
          ---------------------------------------- */}
      <section className="mt-12 pt-8 border-t border-zinc-200">
        <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
          Conventional Thinking
        </span>

        <div className="mt-6 space-y-6 max-w-[80ch]">
          {conventionalThinking.map((item, index) => (
            <div key={index}>
              <p className="text-[20px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]">
                "{item.belief}"
              </p>
              <p className="mt-2 text-[18px] text-zinc-500">
                — {item.source}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------
          THE ACTUAL SITUATION
          ---------------------------------------- */}
      <section className="mt-12 pt-8 border-t border-zinc-200">
        <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
          The Actual Situation
        </span>

        <div className="mt-6 space-y-8 max-w-[80ch]">
          {actualSituation.map((point, index) => (
            <div key={index}>
              <h4 className="text-[18px] font-medium text-zinc-900">
                {point.claim}
              </h4>
              <p className="mt-2 text-[18px] leading-[1.5] text-zinc-600">
                {point.evidence}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------
          WHY THIS MATTERS
          ---------------------------------------- */}
      <section className="mt-12 pt-8 border-t border-zinc-200">
        <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
          Why This Matters
        </span>
        <p className="mt-4 text-[20px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e] max-w-[80ch]">
          {whyThisMatters}
        </p>
      </section>

      {/* ----------------------------------------
          QUESTIONS THIS RAISES
          ---------------------------------------- */}
      <section className="mt-12 pt-8 border-t border-zinc-200">
        <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
          Questions This Raises
        </span>

        <ul className="mt-6 space-y-4 max-w-[80ch]">
          {questionsRaised.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
              <div>
                <p className="text-[18px] leading-[1.5] text-zinc-800">
                  {item.question}
                </p>
                {item.context && (
                  <p className="mt-1 text-[18px] text-zinc-500">
                    {item.context}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

// ============================================
// EXAMPLE WITH REAL DATA
// ============================================

export function ChallengeTheFrameExample() {
  return (
    <div className="max-w-[900px] mx-auto px-10 py-20 bg-white min-h-screen">
      {/* Section Header */}
      <h1 className="text-[36px] font-semibold tracking-tight text-zinc-900 mb-12">
        Challenge the Frame
      </h1>

      <ChallengeTheFrame
        reframeHeadline="Non-contact sensing isn't about removing hardware—it's about removing friction"
        reframeExplanation="The industry frames non-contact vital signs as a hardware problem: how do we sense without touching? But the real opportunity is a UX problem: how do we make health monitoring disappear into daily life? Contact-based solutions that require zero user action (like a mattress) beat non-contact solutions that require positioning, stillness, or attention."
        conventionalThinking={[
          {
            belief: "Non-contact sensing is technically superior because it doesn't require any device on the body",
            source: "Common framing in radar/camera sensing research",
          },
          {
            belief: "Wearables will always be more accurate because direct contact provides better signal quality",
            source: "Medical device industry perspective",
          },
          {
            belief: "Consumers won't accept furniture-integrated sensors due to privacy concerns",
            source: "Market research assumption",
          },
        ]}
        actualSituation={[
          {
            claim: "Sleep Number's contact-based BCG outsells all non-contact competitors combined",
            evidence: "Sleep Number has 650+ retail locations and $2B+ annual revenue. Their SleepIQ technology is contact-based (you sleep on the mattress) but requires zero user action—it's truly invisible. Meanwhile, Nest Hub's non-contact Soli radar requires deliberate bedside placement and sleep tracking mode activation.",
          },
          {
            claim: "The most successful 'non-contact' sensing is actually zero-friction contact",
            evidence: "Automotive BCG (Bosch, Continental) embeds sensors in seats you're already sitting in. No user action, no awareness, no friction. The 'contact' is invisible because it's the furniture you already use.",
          },
          {
            claim: "True air-coupled sensing is solving a problem users don't actually have",
            evidence: "Focus groups show users don't object to sitting in a chair or lying in a bed. They object to charging wearables, remembering to put them on, and skin irritation. 'Non-contact' addresses the wrong friction point.",
          },
        ]}
        whyThisMatters="This reframe redirects R&D investment from solving hard physics problems (air-coupled sensing at distance) toward solving easier integration problems (furniture-embedded sensors). It suggests the winning strategy isn't better sensing technology—it's better furniture partnerships and invisible integration."
        questionsRaised={[
          {
            question: "Should we partner with furniture manufacturers rather than develop standalone devices?",
            context: "Sleep Number, Tempur-Pedic, Herman Miller all have distribution and brand trust",
          },
          {
            question: "What other 'invisible contact' surfaces exist in daily life?",
            context: "Car seats, office chairs, toilet seats, yoga mats, standing desk mats",
          },
          {
            question: "Is the 1-3m air sensing use case actually valuable, or is it a research artifact?",
            context: "What real scenario requires sensing someone from across the room?",
          },
          {
            question: "How do we position BCG-based sensing when the market expects 'contactless'?",
          },
        ]}
      />
    </div>
  );
}

export default ChallengeTheFrame;
