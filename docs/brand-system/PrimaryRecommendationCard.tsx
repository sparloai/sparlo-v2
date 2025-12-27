/**
 * PrimaryRecommendationCard
 *
 * Air Company Aesthetic - Technical Monograph, Not AI Tool
 *
 * Key principles:
 * - Typography and spacing carry ALL hierarchy
 * - Near-zero color. Color appears on TEXT only for semantic meaning
 * - NO badge pills, NO colored backgrounds, NO icons
 * - Badges become inline text
 * - Only visual distinction: 2px left border in zinc-900
 * - Prose width constrained to 65ch for optimal readability
 * - Premium typography scale: larger, more confident
 * - Font: Suisse Int'l (Regular for body, Medium for emphasis, Semibold for titles)
 */

import React from 'react';

// ============================================
// TYPES
// ============================================

interface CoupledEffect {
  system: string;
  impact: 'BETTER' | 'WORSE' | 'NEUTRAL';
  severity: 'MINOR' | 'MODERATE' | 'MAJOR';
  description: string;
  details: string;
}

interface ValidationGate {
  description: string;
  cost: string;
  successCriteria: string;
}

interface IPConsiderations {
  ftoStatus: 'GREEN' | 'YELLOW' | 'RED';
  patentability: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  keyPatents: string[];
}

interface SustainabilityFlag {
  type: 'BENEFIT' | 'CONCERN' | 'NEUTRAL';
  headline: string;
  details: string;
}

interface InsightBlock {
  headline: string;
  source: string;
  sourceDetail: string;
  implication: string;
  whyMissed: string;
}

interface PrimaryRecommendationCardProps {
  subsectionLabel?: string; // e.g., "Primary Recommendation", "Supporting Concept"
  title: string;
  category: string;
  confidence: string;
  whatItIs: string;
  whyItWorks: string;
  expectedImprovement: string;
  timeline: string;
  investment: string;
  insight: InsightBlock;
  coupledEffects: CoupledEffect[];
  sustainability: SustainabilityFlag;
  ipConsiderations: IPConsiderations;
  validationGate: ValidationGate;
}

// ============================================
// HELPER: Effect text color
// ============================================

function getImpactColor(impact: 'BETTER' | 'WORSE' | 'NEUTRAL'): string {
  switch (impact) {
    case 'BETTER':
      return 'text-emerald-600';
    case 'WORSE':
      return 'text-red-600';
    default:
      return 'text-zinc-500';
  }
}

function getFtoColor(status: 'GREEN' | 'YELLOW' | 'RED'): string {
  switch (status) {
    case 'GREEN':
      return 'text-emerald-600';
    case 'YELLOW':
      return 'text-amber-600';
    case 'RED':
      return 'text-red-600';
  }
}

function getSustainabilityColor(type: 'BENEFIT' | 'CONCERN' | 'NEUTRAL'): string {
  switch (type) {
    case 'BENEFIT':
      return 'text-emerald-600';
    case 'CONCERN':
      return 'text-amber-600';
    default:
      return 'text-zinc-500';
  }
}

function capitalize(str: string): string {
  return str.charAt(0) + str.slice(1).toLowerCase();
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PrimaryRecommendationCard({
  subsectionLabel = 'Primary Recommendation',
  title,
  category,
  confidence,
  whatItIs,
  whyItWorks,
  expectedImprovement,
  timeline,
  investment,
  insight,
  coupledEffects,
  sustainability,
  ipConsiderations,
  validationGate,
}: PrimaryRecommendationCardProps) {
  return (
    <article className="border-l-2 border-zinc-900 bg-white pl-10 space-y-12">
      {/* ----------------------------------------
          HEADER
          ---------------------------------------- */}
      <header className="space-y-4">
        {/* Subsection label */}
        <span className="text-[11px] font-medium tracking-[0.06em] text-zinc-400 uppercase">
          {subsectionLabel}
        </span>

        {/* Title - the actual concept name */}
        <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900 leading-tight">
          {title}
        </h2>

        {/* Meta line */}
        <p className="text-[15px] tracking-wide text-zinc-500">
          {category} · {confidence} confidence
        </p>
      </header>

      {/* ----------------------------------------
          WHAT IT IS
          ---------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-[11px] font-medium tracking-[0.06em] text-zinc-400 uppercase">
          What it is
        </h3>
        <p className="text-[18px] leading-relaxed text-zinc-600 max-w-[65ch]">
          {whatItIs}
        </p>
      </section>

      {/* ----------------------------------------
          WHY IT WORKS
          ---------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-[11px] font-medium tracking-[0.06em] text-zinc-400 uppercase">
          Why it works
        </h3>
        <p className="text-[18px] leading-relaxed text-zinc-600 max-w-[65ch]">
          {whyItWorks}
        </p>
      </section>

      {/* ----------------------------------------
          ECONOMICS GRID - zinc-50, no borders
          ---------------------------------------- */}
      <section className="grid grid-cols-3 gap-10 bg-zinc-50 p-8 -ml-10 pl-10">
        <div>
          <span className="text-[11px] font-medium tracking-[0.06em] text-zinc-400 uppercase block mb-3">
            Expected improvement
          </span>
          <p className="text-[18px] font-medium text-zinc-900">{expectedImprovement}</p>
        </div>
        <div>
          <span className="text-[11px] font-medium tracking-[0.06em] text-zinc-400 uppercase block mb-3">
            Timeline
          </span>
          <p className="text-[18px] font-medium text-zinc-900">{timeline}</p>
        </div>
        <div>
          <span className="text-[11px] font-medium tracking-[0.06em] text-zinc-400 uppercase block mb-3">
            Investment
          </span>
          <p className="text-[18px] font-medium text-zinc-900">{investment}</p>
        </div>
      </section>

      {/* ----------------------------------------
          THE INSIGHT - Dark Block
          ---------------------------------------- */}
      <section className="bg-zinc-900 p-10 -ml-10 pl-10 space-y-8">
        <span className="text-[11px] font-medium tracking-[0.06em] text-zinc-500 uppercase">
          The insight
        </span>
        <p className="text-[22px] font-semibold leading-snug text-white max-w-[65ch]">
          {insight.headline}
        </p>

        {/* Nested section - border separation */}
        <div className="mt-8 pt-8 border-t border-zinc-800 space-y-6">
          <div>
            <span className="text-[11px] font-medium tracking-[0.06em] text-zinc-500 uppercase block mb-3">
              Where we found it
            </span>
            <p className="text-[15px] text-zinc-300 max-w-[65ch]">
              <span className="text-zinc-100 font-medium">{insight.source}:</span>{' '}
              {insight.sourceDetail}
            </p>
            <p className="text-[15px] text-zinc-300 mt-3">{insight.implication}</p>
          </div>
        </div>

        <div className="pt-6">
          <span className="text-[11px] font-medium tracking-[0.06em] text-zinc-500 uppercase block mb-3">
            Why industry missed it
          </span>
          <p className="text-[15px] text-zinc-400 max-w-[65ch]">{insight.whyMissed}</p>
        </div>
      </section>

      {/* ----------------------------------------
          VALIDATION GATE
          ---------------------------------------- */}
      <section className="space-y-5">
        <h3 className="text-[11px] font-medium tracking-[0.06em] text-zinc-400 uppercase">
          First validation step
        </h3>
        <div className="space-y-4">
          <p className="text-[18px] font-medium text-zinc-900 max-w-[65ch]">
            {validationGate.description}
          </p>
          <p className="text-[15px] text-zinc-500">{validationGate.cost}</p>
          <p className="text-[15px] text-zinc-600 max-w-[65ch]">
            <span className="text-zinc-900 font-medium">Success criteria:</span>{' '}
            {validationGate.successCriteria}
          </p>
        </div>
      </section>

      {/* ----------------------------------------
          COUPLED EFFECTS - Inline text, no pills
          ---------------------------------------- */}
      <section className="space-y-8">
        <h3 className="text-[11px] font-medium tracking-[0.06em] text-zinc-400 uppercase">
          Coupled effects
        </h3>

        <div className="space-y-8">
          {coupledEffects.map((effect, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[18px] font-medium text-zinc-900">{effect.system}</h4>
                <span className="text-[15px]">
                  <span className={getImpactColor(effect.impact)}>
                    {capitalize(effect.impact)}
                  </span>
                  <span className="mx-2 text-zinc-300">·</span>
                  <span className="text-zinc-400">
                    {capitalize(effect.severity)}
                  </span>
                </span>
              </div>
              <p className="text-[15px] text-zinc-600 max-w-[65ch]">{effect.description}</p>
              <p className="text-[15px] text-zinc-500 max-w-[65ch]">{effect.details}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------
          SUSTAINABILITY - No colored background
          ---------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-baseline gap-4">
          <h3 className="text-[11px] font-medium tracking-[0.06em] text-zinc-400 uppercase">
            Sustainability
          </h3>
          <span className={`text-[15px] ${getSustainabilityColor(sustainability.type)}`}>
            {capitalize(sustainability.type)}
          </span>
        </div>
        <p className="text-[18px] text-zinc-600 max-w-[65ch]">{sustainability.headline}</p>
        <p className="text-[15px] text-zinc-500 max-w-[65ch]">{sustainability.details}</p>
      </section>

      {/* ----------------------------------------
          IP CONSIDERATIONS - Inline text
          ---------------------------------------- */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[11px] font-medium tracking-[0.06em] text-zinc-400 uppercase">
            IP considerations
          </h3>
          <span className="text-[15px]">
            <span className={getFtoColor(ipConsiderations.ftoStatus)}>
              FTO: {capitalize(ipConsiderations.ftoStatus)}
            </span>
            <span className="mx-2 text-zinc-300">·</span>
            <span className="text-zinc-500">
              Patentability: {capitalize(ipConsiderations.patentability)}
            </span>
          </span>
        </div>
        <p className="text-[15px] text-zinc-600 max-w-[65ch]">{ipConsiderations.summary}</p>
        <div className="pt-2">
          <span className="text-[11px] font-medium tracking-[0.06em] text-zinc-400 uppercase block mb-3">
            Key patents to review
          </span>
          <ul className="text-[15px] text-zinc-600 space-y-2">
            {ipConsiderations.keyPatents.map((patent, index) => (
              <li key={index}>{patent}</li>
            ))}
          </ul>
        </div>
      </section>
    </article>
  );
}

// ============================================
// EXAMPLE WITH REAL DATA
// ============================================

export function PrimaryRecommendationCardExample() {
  return (
    <div className="max-w-[900px] mx-auto px-10 py-20 bg-white min-h-screen">
      {/* Section Header - Main section title */}
      <h1 className="text-[36px] font-semibold tracking-tight text-zinc-900 mb-12">
        Solution Concepts
      </h1>

      <PrimaryRecommendationCard
        title="Smart Furniture BCG with Commodity Piezoelectric Films"
        category="Catalog solution"
        confidence="High"
        whatItIs="Embed low-cost piezoelectric polymer films (PVDF or EMFi) in chair seats, bed mattresses, or floor mats to detect ballistocardiographic signals from heartbeat mechanical recoil. This redefines 'non-contact' as 'no worn device' rather than 'no physical coupling.' The approach is already commercial: Sleep Number's SleepIQ mattresses, Bosch and Toyota's driver drowsiness detection, and Murata's BCG sensor modules. The innovation opportunity isn't the sensing—it's extending to chairs, floors, and other furniture at consumer price points. PVDF films cost $5-20 per sensor, electronics are simple charge amplifiers plus microcontroller ($10-30), and the signal processing algorithms exist from automotive applications. Total BOM under $50 for a complete system."
        whyItWorks="Each heartbeat ejects ~70mL of blood into the aorta, creating a mechanical impulse of 0.1-0.3 N·s that propagates through the body and into contact surfaces. The body's center of mass shifts 0.1-0.5mm with each beat, producing forces of 1-5 mN detectable by piezoelectric films. Respiration creates 10-100x larger signals (chest expansion 5-12mm). PVDF piezoelectric coefficient is 23 pC/N; EMFi is 10-20x more sensitive at 200-400 pC/N. The signal transmits through furniture padding with minimal attenuation because the mechanical coupling is direct."
        expectedImprovement="±2-3 BPM HR, ±1 BPM RR"
        timeline="3-6 months to prototype"
        investment="$50-200K pilot"
        insight={{
          headline: 'Direct mechanical coupling provides 40-60dB better SNR than air-coupled sensing',
          source: 'Automotive driver monitoring (Bosch, Continental, Ford, Toyota)',
          sourceDetail:
            'BCG sensors in car seats detect driver heart rate and drowsiness despite engine vibration',
          implication: '→ Home environment is actually easier—no engine vibration, more stable seating',
          whyMissed:
            "Industry didn't miss it—it's already commercial. The gap is that 'non-contact vital signs' research focused on air-coupled sensing as the differentiator, while BCG was siloed in automotive and sleep monitoring.",
        }}
        coupledEffects={[
          {
            system: 'Furniture design',
            impact: 'NEUTRAL',
            severity: 'MINOR',
            description: 'Sensor integration affects furniture compliance and feel',
            details:
              'PVDF films are 28-110µm thick; imperceptible under fabric. Use thin films; place under existing padding.',
          },
          {
            system: 'Multi-occupancy',
            impact: 'WORSE',
            severity: 'MAJOR',
            description: 'Cannot separate signals from multiple people on same surface',
            details:
              'Fails completely for shared surfaces like couches. Use individual seating; array of sensors for spatial separation; accept single-person limitation.',
          },
        ]}
        sustainability={{
          type: 'BENEFIT',
          headline: 'Minimal materials, no RF emissions, extremely low power consumption',
          details:
            'PVDF films require minimal raw materials. System runs on milliwatts. No electromagnetic emissions. 10-20 year sensor lifetime. Significantly lower environmental impact than wearables requiring batteries and periodic replacement.',
        }}
        ipConsiderations={{
          ftoStatus: 'YELLOW',
          patentability: 'MEDIUM',
          summary:
            "Search for 'ballistocardiography furniture patent' returned multiple relevant filings: US 10,123,xxx (Sleep Number, mattress BCG), US 9,xxx,xxx (Bosch, automotive seat sensing). Core BCG physics is not patentable, but specific implementations may require licensing or design-around.",
          keyPatents: [
            'Sleep Number mattress sensing patents',
            'Bosch/Continental automotive BCG patents',
            'Murata sensor module patents',
          ],
        }}
        validationGate={{
          description: 'Validate HR detection accuracy through standard office chair cushion',
          cost: '$5-10K · Sensors, ECG reference, 10-subject pilot',
          successCriteria:
            'HR accuracy ±3 BPM vs. ECG across 10 subjects, >90% valid reading rate while seated',
        }}
      />
    </div>
  );
}

export default PrimaryRecommendationCard;
