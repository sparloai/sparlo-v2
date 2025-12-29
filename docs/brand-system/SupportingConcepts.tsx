/**
 * SupportingConcepts
 *
 * Air Company Aesthetic - Technical Monograph, Not AI Tool
 *
 * Alternatives to Primary Recommendation—valuable but secondary.
 * Same information structure, visually subordinate.
 *
 * Visual hierarchy vs Primary Recommendation:
 * - No left border (or border-zinc-200)
 * - Smaller title (20px vs 24px)
 * - Body text 16px, zinc-700 (vs 17px, zinc-800)
 * - Type indicator inline right-aligned
 * - Available, not competing
 */

import React from 'react';

// ============================================
// TYPES
// ============================================

interface SupportingConcept {
  title: string;
  type: 'complementary' | 'fallback';
  limitation: string;
  whatItIs: string;
  whyItWorks: string;
  whenToUse: string;
}

interface SupportingConceptsProps {
  concepts: SupportingConcept[];
}

// ============================================
// SUPPORTING CONCEPT CARD
// ============================================

function SupportingConceptCard({
  title,
  type,
  limitation,
  whatItIs,
  whyItWorks,
  whenToUse,
}: SupportingConcept) {
  return (
    <div className="max-w-[70ch]">
      {/* Title + Type */}
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-[20px] font-semibold tracking-tight text-zinc-900">
          {title}
        </h3>
        <span className="text-[13px] text-zinc-400 uppercase tracking-wide flex-shrink-0">
          {type}
        </span>
      </div>

      {/* Risk/Limitation callout */}
      <p className="mt-3 text-[18px] text-zinc-500 italic">{limitation}</p>

      {/* What it is */}
      <div className="mt-6">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          What It Is
        </span>
        <p className="mt-2 text-[18px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]">{whatItIs}</p>
      </div>

      {/* Why it works */}
      <div className="mt-6">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          Why It Works
        </span>
        <p className="mt-2 text-[18px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]">{whyItWorks}</p>
      </div>

      {/* When to use instead - visually distinct */}
      <div className="mt-6 border-l-2 border-zinc-200 pl-4">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          When To Use Instead
        </span>
        <p className="mt-2 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">{whenToUse}</p>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SupportingConcepts({ concepts }: SupportingConceptsProps) {
  return (
    <section className="mt-20">
      <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900">
        Supporting Concepts
      </h2>

      <div className="mt-10 space-y-16">
        {concepts.map((concept) => (
          <SupportingConceptCard key={concept.title} {...concept} />
        ))}
      </div>
    </section>
  );
}

// ============================================
// EXAMPLE WITH REAL DATA
// ============================================

export function SupportingConceptsExample() {
  return (
    <div className="max-w-[900px] mx-auto px-10 py-20 bg-white min-h-screen">
      <SupportingConcepts
        concepts={[
          {
            title: '60GHz FMCW Radar with Transformer-Based ML',
            type: 'complementary',
            limitation:
              'ML models require extensive labeled training data; motion rejection may hit fundamental limits',
            whatItIs:
              "Use commodity 60GHz radar modules (Infineon BGT60LTR11, Texas Instruments IWR6843) with modern deep learning for vital sign extraction. The radar provides raw I/Q phase data; the ML model learns to separate physiological signals from motion artifacts. This is Google's Nest Hub approach, now commoditized.",
            whyItWorks:
              'At 60GHz, chest displacement from breathing (5-12mm) creates measurable phase shifts (720°+). Heart displacement (0.1-0.5mm) creates smaller but detectable shifts (7-36°). Transformer architectures can learn temporal patterns that distinguish periodic physiological signals from aperiodic motion noise.',
            whenToUse:
              "When you need true air-coupled sensing at 1-3m range and can invest in ML development. Best for standalone devices (smart speakers, wall-mounted monitors) where furniture integration isn't possible.",
          },
          {
            title: 'Smartphone Ultrasonic Sensing',
            type: 'fallback',
            limitation:
              'Device variability is high; may only work reliably on specific phone models',
            whatItIs:
              "Use the phone's existing speaker and microphone to emit and receive ultrasonic pulses (18-22kHz). Chest motion from breathing modulates the reflected signal. No additional hardware required—works on any smartphone with appropriate app.",
            whyItWorks:
              "Ultrasonic wavelength at 20kHz is ~17mm, similar to respiratory displacement. The phone's audio hardware is designed for precise timing. Research from University of Washington (ApneaApp, BreathJunior) demonstrates feasibility.",
            whenToUse:
              'When zero hardware cost is paramount and you can accept device-specific limitations. Best for screening applications where false negatives are acceptable, or as a supplement to other methods.',
          },
        ]}
      />
    </div>
  );
}

export default SupportingConcepts;
