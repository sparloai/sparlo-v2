/**
 * InnovationConcepts
 *
 * Air Company Aesthetic - Technical Monograph, Not AI Tool
 *
 * Higher-risk, higher-reward concepts. Same rigor as Supporting Concepts,
 * but with emphasis on breakthrough potential and cross-domain insight sourcing.
 *
 * Visual hierarchy:
 * - Border: zinc-300 2px (between Primary's zinc-900 and Supporting's none)
 * - Unique sections: Insight block (elevated), Breakthrough Potential (emphasized)
 */

import React from 'react';

// ============================================
// TYPES
// ============================================

interface InnovationConcept {
  title: string;
  confidence: 'high' | 'medium' | 'low';
  whatItIs: string;
  whyItWorks: string;
  insight: {
    headline: string;
    sourceTitle: string;
    sourceDescription: string;
    sourceImplication: string;
  };
  whyIndustryMissed: string;
  breakthroughPotential: {
    headline: string;
    detail: string;
  };
}

interface InnovationConceptsProps {
  intro: string;
  concepts: InnovationConcept[];
}

// ============================================
// INNOVATION CONCEPT CARD
// ============================================

function InnovationConceptCard({
  title,
  confidence,
  whatItIs,
  whyItWorks,
  insight,
  whyIndustryMissed,
  breakthroughPotential,
}: InnovationConcept) {
  return (
    <div className="border-l-2 border-zinc-300 pl-8 max-w-[80ch]">
      {/* Label + Title */}
      <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
        Recommended Innovation
      </span>
      <h3 className="mt-3 text-[24px] font-semibold tracking-tight text-zinc-900 leading-tight">
        {title}
      </h3>

      {/* Confidence - inline */}
      <p className="mt-2 text-[18px] text-zinc-500">
        {confidence.charAt(0).toUpperCase() + confidence.slice(1)} confidence
      </p>

      {/* What it is */}
      <section className="mt-10">
        <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
          What It Is
        </span>
        <p className="mt-3 text-[18px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e] max-w-[70ch]">
          {whatItIs}
        </p>
      </section>

      {/* Why it works */}
      <section className="mt-8">
        <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
          Why It Works
        </span>
        <p className="mt-3 text-[18px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e] max-w-[70ch]">
          {whyItWorks}
        </p>
      </section>

      {/* The Insight - elevated treatment */}
      <section className="mt-10 bg-zinc-50 border border-zinc-200 p-8 max-w-[70ch]">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          The Insight
        </span>
        <p className="mt-4 text-[20px] font-medium leading-[1.3] tracking-[-0.02em] text-zinc-900">
          {insight.headline}
        </p>

        {/* Where we found it - cross-domain source */}
        <div className="mt-6 pt-6 border-t border-zinc-200">
          <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
            Where We Found It
          </span>
          <p className="mt-3 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
            <span className="font-medium text-zinc-700">{insight.sourceTitle}:</span>{' '}
            {insight.sourceDescription}
          </p>
          <p className="mt-3 text-[18px] text-zinc-500 flex items-start gap-2">
            <span className="text-zinc-400">→</span>
            <span>{insight.sourceImplication}</span>
          </p>
        </div>
      </section>

      {/* Why industry missed it */}
      <section className="mt-8">
        <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
          Why Industry Missed It
        </span>
        <p className="mt-3 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600 max-w-[70ch]">
          {whyIndustryMissed}
        </p>
      </section>

      {/* Breakthrough potential - the payoff, emphasized */}
      <section className="mt-10 border-l-4 border-zinc-900 pl-6">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          Breakthrough Potential
        </span>
        <p className="mt-3 text-[20px] font-medium leading-[1.3] tracking-[-0.02em] text-zinc-900">
          {breakthroughPotential.headline}
        </p>
        <p className="mt-2 text-[18px] text-zinc-600">
          {breakthroughPotential.detail}
        </p>
      </section>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function InnovationConcepts({ intro, concepts }: InnovationConceptsProps) {
  return (
    <section className="mt-24">
      <h2 className="text-[36px] font-semibold tracking-tight text-zinc-900">
        Innovation Concepts
      </h2>

      <p className="mt-6 max-w-[70ch] text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
        {intro}
      </p>

      <div className="mt-12 space-y-20">
        {concepts.map((concept) => (
          <InnovationConceptCard key={concept.title} {...concept} />
        ))}
      </div>
    </section>
  );
}

// ============================================
// EXAMPLE WITH REAL DATA
// ============================================

export function InnovationConceptsExample() {
  return (
    <div className="max-w-[900px] mx-auto px-10 py-20 bg-white min-h-screen">
      <InnovationConcepts
        intro="Higher-risk bets with breakthrough potential. These concepts could fundamentally change the economics or capabilities of vital signs sensing—but require validation of novel approaches."
        concepts={[
          {
            title: 'Ultrasonic FMCW Using Smartphone Hardware',
            confidence: 'medium',
            whatItIs:
              "Use the phone's existing speaker and microphone to emit continuous frequency-modulated ultrasonic chirps (18-22kHz) and detect phase shifts from chest motion. This applies FMCW radar principles to acoustic sensing, using commodity audio hardware instead of RF components.",
            whyItWorks:
              'Ultrasonic wavelength at 20kHz is ~17mm, well-matched to respiratory displacement (5-12mm). Modern smartphone audio hardware has sufficient bandwidth and timing precision. The FMCW approach provides range discrimination to separate the target from background reflections.',
            insight: {
              headline:
                'Ultrasonic Doppler sensing using commodity smartphone audio hardware',
              sourceTitle: 'Bat echolocation (Rhinolophus ferrumequinum)',
              sourceDescription:
                'CF-FM waveforms detect insect wingbeats (1mm motion) at 10m range using acoustic frequencies similar to smartphone ultrasound',
              sourceImplication:
                'The physics is identical—acoustic waves reflecting off moving surfaces create Doppler shifts. Bats achieve sub-millimeter motion detection at ranges far exceeding our requirements.',
            },
            whyIndustryMissed:
              "Audio hardware wasn't considered for sensing because it's 'meant for music.' The ultrasonic sensing research community focused on dedicated hardware (Chirp, UltraSense) rather than commodity devices. Cross-pollination from bioacoustics research didn't occur.",
            breakthroughPotential: {
              headline:
                'Vital signs monitoring becomes a software feature on 3 billion smartphones',
              detail:
                'Zero marginal hardware cost vs. $30-200 for dedicated sensors. Every smartphone becomes a contactless vital signs monitor.',
            },
          },
        ]}
      />
    </div>
  );
}

export default InnovationConcepts;
