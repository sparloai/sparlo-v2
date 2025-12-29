/**
 * ParallelInvestigations
 *
 * Air Company Aesthetic - Technical Monograph, Not AI Tool
 *
 * Innovation concepts recommended with less certainty than the primary.
 * Same rigor and visual weight as Innovation Concepts, with explicit
 * uncertainty and escalation conditions.
 *
 * Visual hierarchy:
 * - Same border treatment as Innovation Concepts (zinc-300)
 * - Same typography scale
 * - Key Uncertainty: prominent caveat
 * - Breakthrough Potential: emphasized payoff
 * - When to Elevate: conditional trigger
 */

import React from 'react';

// ============================================
// TYPES
// ============================================

interface ParallelInvestigation {
  title: string;
  whatItIs: string;
  whyItWorks: string;
  keyUncertainty: string;
  breakthroughPotential: {
    headline: string;
    detail: string;
  };
  whenToElevate: string;
}

interface ParallelInvestigationsProps {
  investigations: ParallelInvestigation[];
}

// ============================================
// PARALLEL INVESTIGATION CARD
// ============================================

function ParallelInvestigationCard({
  title,
  whatItIs,
  whyItWorks,
  keyUncertainty,
  breakthroughPotential,
  whenToElevate,
}: ParallelInvestigation) {
  return (
    <div className="border-l-2 border-zinc-300 pl-8 max-w-[80ch]">
      {/* Label + Title */}
      <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
        Parallel Investigation
      </span>
      <h3 className="mt-3 text-[24px] font-semibold tracking-tight text-zinc-900 leading-tight">
        {title}
      </h3>

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

      {/* Key Uncertainty - prominent caveat */}
      <section className="mt-8">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          Key Uncertainty
        </span>
        <p className="mt-3 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600 italic max-w-[70ch]">
          {keyUncertainty}
        </p>
      </section>

      {/* Breakthrough Potential - emphasized payoff */}
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

      {/* When to Elevate - conditional trigger */}
      <section className="mt-8 border-l-2 border-zinc-200 pl-4">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          When to Elevate
        </span>
        <p className="mt-3 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600 max-w-[70ch]">
          {whenToElevate}
        </p>
      </section>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ParallelInvestigations({
  investigations,
}: ParallelInvestigationsProps) {
  return (
    <section className="mt-16">
      <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900">
        Parallel Investigations
      </h2>

      <div className="mt-12 space-y-20">
        {investigations.map((item) => (
          <ParallelInvestigationCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}

// ============================================
// EXAMPLE WITH REAL DATA
// ============================================

export function ParallelInvestigationsExample() {
  return (
    <div className="max-w-[900px] mx-auto px-10 py-20 bg-white min-h-screen">
      <ParallelInvestigations
        investigations={[
          {
            title: 'Motion-Invariant Morphological Features',
            whatItIs:
              'Investigate whether certain cardiac waveform characteristics (e.g., J-wave amplitude ratios, inter-beat interval patterns) remain stable across different body positions and motion states. If such features exist, they could enable motion-robust vital sign extraction without requiring motion cancellation.',
            whyItWorks:
              'ECG morphology research shows some waveform features are position-independent. If similar invariants exist in BCG or radar signals, they could be extracted even when the overall signal is corrupted by motion.',
            keyUncertainty:
              'Whether motion-invariant features exist at all—the core hypothesis is unproven. This requires fundamental signal analysis before any product relevance.',
            breakthroughPotential: {
              headline:
                'Solve motion rejection at the algorithm level, making any sensing modality viable for moving subjects',
              detail:
                'Would eliminate the single biggest technical barrier in the field. Every existing sensor becomes dramatically more useful.',
            },
            whenToElevate:
              'If initial feature analysis shows promising invariants, this becomes the highest-priority research investment. Fund a 6-month PhD-level investigation.',
          },
          {
            title: 'WiFi Channel State Information (CSI) Sensing',
            whatItIs:
              'Use existing WiFi infrastructure to detect respiration through channel state perturbations. Requires no additional hardware—works with standard routers and devices. Multiple research groups (Origin Wireless, MIT, UIUC) have demonstrated feasibility.',
            whyItWorks:
              'WiFi signals at 2.4/5GHz have wavelengths (12.5cm/6cm) that interact with chest motion. CSI provides fine-grained channel measurements that can detect sub-centimeter displacement.',
            keyUncertainty:
              'Heart rate extraction remains unreliable—most published results focus on respiration only. Multi-path interference in real environments degrades accuracy significantly.',
            breakthroughPotential: {
              headline:
                'Zero hardware cost for basic respiration monitoring across any WiFi-enabled space',
              detail:
                'Every WiFi-enabled space becomes a sensing environment. Ideal for elder care fall detection + breathing monitoring.',
            },
            whenToElevate:
              'If a peer demonstrates reliable heart rate from WiFi CSI, immediately prioritize. Currently best positioned as respiration-only complement to other methods.',
          },
        ]}
      />
    </div>
  );
}

export default ParallelInvestigations;
