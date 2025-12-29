/**
 * FrontierTechnologies
 *
 * Air Company Aesthetic - Technical Monograph, Not AI Tool
 *
 * "Watch list" items—technologies to monitor, not act on now.
 * Highly structured with timeline, TRL, triggers, and competitive intelligence.
 *
 * Visual elements:
 * - Large faded numbers for scannable landmarks
 * - Trigger to Revisit as key actionable element
 * - Web Search Intelligence box for research evidence
 */

import React from 'react';

// ============================================
// TYPES
// ============================================

interface FrontierTechnology {
  title: string;
  type: 'PARADIGM' | 'EMERGING_SCIENCE' | 'EMERGING_PRACTICE';
  earliestViability: string;
  trl: number;
  whyInteresting: string;
  whyNotNow: string;
  trigger: string;
  triggerShort: string;
  whoToMonitor: string[];
  recentDevelopments: string;
  competitiveActivity: string;
  breakthroughPotential: {
    headline: string;
    detail: string;
  };
  viabilitySummary: string;
}

interface FrontierTechnologiesProps {
  technologies: FrontierTechnology[];
}

// ============================================
// FRONTIER TECHNOLOGY CARD
// ============================================

interface FrontierTechnologyCardProps extends FrontierTechnology {
  index: number;
}

function FrontierTechnologyCard({
  index,
  title,
  type,
  earliestViability,
  trl,
  whyInteresting,
  whyNotNow,
  trigger,
  triggerShort,
  whoToMonitor,
  recentDevelopments,
  competitiveActivity,
  breakthroughPotential,
  viabilitySummary,
}: FrontierTechnologyCardProps) {
  const typeLabel = type.replace('_', ' ').toLowerCase();

  return (
    <div className="max-w-[75ch]">
      {/* Header Row: Number, Title, Meta */}
      <div className="flex items-start gap-6">
        {/* Number - large but faded */}
        <span className="text-[32px] font-semibold text-zinc-200 leading-none">
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="flex-1">
          {/* Title */}
          <h3 className="text-[20px] font-semibold tracking-tight text-zinc-900">
            {title}
          </h3>

          {/* Meta row: Type, Viability, TRL */}
          <div className="mt-2 flex items-center gap-4 text-[13px]">
            <span className="text-zinc-500 capitalize">{typeLabel}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-zinc-500">{earliestViability}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-zinc-500">TRL {trl}</span>
          </div>
        </div>
      </div>

      {/* Why it's interesting */}
      <div className="mt-8 ml-14">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          Why It's Interesting
        </span>
        <p className="mt-2 text-[18px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]">{whyInteresting}</p>
      </div>

      {/* Why not now */}
      <div className="mt-6 ml-14">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          Why Not Now
        </span>
        <p className="mt-2 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">{whyNotNow}</p>
      </div>

      {/* Trigger to revisit - emphasized */}
      <div className="mt-6 ml-14 border-l-2 border-zinc-300 pl-4">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          Trigger to Revisit
        </span>
        <p className="mt-2 text-[18px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e] font-medium">
          {trigger}
        </p>
      </div>

      {/* Who to monitor */}
      <div className="mt-6 ml-14">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          Who to Monitor
        </span>
        <ul className="mt-2 space-y-1">
          {whoToMonitor.map((entity) => (
            <li key={entity} className="text-[18px] text-zinc-600">
              {entity}
            </li>
          ))}
        </ul>
      </div>

      {/* Web Search Intelligence - subtle box */}
      <div className="mt-8 ml-14 bg-zinc-50 border border-zinc-200 p-6">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          Web Search Intelligence
        </span>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent developments */}
          <div>
            <span className="text-[13px] font-medium text-zinc-500">
              Recent Developments
            </span>
            <p className="mt-1 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
              {recentDevelopments}
            </p>
          </div>

          {/* Competitive activity */}
          <div>
            <span className="text-[13px] font-medium text-zinc-500">
              Competitive Activity
            </span>
            <p className="mt-1 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
              {competitiveActivity}
            </p>
          </div>
        </div>
      </div>

      {/* Breakthrough Potential - emphasized payoff */}
      <div className="mt-10 ml-14 border-l-4 border-zinc-900 pl-6">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          Breakthrough Potential
        </span>
        <p className="mt-3 text-[20px] font-medium leading-[1.3] tracking-[-0.02em] text-zinc-900">
          {breakthroughPotential.headline}
        </p>
        <p className="mt-2 text-[18px] text-zinc-600">
          {breakthroughPotential.detail}
        </p>
      </div>

      {/* Viability Assessment Summary - bottom callout */}
      <div className="mt-6 ml-14 pt-6 border-t border-zinc-200">
        <div className="flex items-start justify-between gap-8">
          <p className="text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-500 max-w-[50ch]">
            {viabilitySummary}
          </p>
          <div className="text-right flex-shrink-0">
            <p className="text-[18px] font-medium text-zinc-700">
              Revisit in {earliestViability}
            </p>
            <p className="mt-1 text-[13px] text-zinc-500">{triggerShort}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function FrontierTechnologies({ technologies }: FrontierTechnologiesProps) {
  return (
    <section className="mt-24">
      <h2 className="text-[36px] font-semibold tracking-tight text-zinc-900">
        Frontier Technologies
      </h2>
      <p className="mt-3 text-[18px] text-zinc-500">
        Emerging technologies and innovations to monitor
      </p>

      <div className="mt-12 space-y-16">
        {technologies.map((tech, index) => (
          <FrontierTechnologyCard key={tech.title} index={index} {...tech} />
        ))}
      </div>
    </section>
  );
}

// ============================================
// EXAMPLE WITH REAL DATA
// ============================================

export function FrontierTechnologiesExample() {
  return (
    <div className="max-w-[900px] mx-auto px-10 py-20 bg-white min-h-screen">
      <FrontierTechnologies
        technologies={[
          {
            title: 'Terahertz Imaging for Cardiac Motion',
            type: 'EMERGING_SCIENCE',
            earliestViability: '5-7 years',
            trl: 2,
            whyInteresting:
              'THz waves (0.1-10 THz) penetrate clothing and skin but reflect off water-containing tissue. Could potentially image heart motion directly through the chest wall with sub-millimeter resolution.',
            whyNotNow:
              'THz sources are expensive ($50K+), require cryogenic cooling, and have limited range (< 1m). No published demonstrations of cardiac imaging through intact chest wall. Fundamental physics may limit penetration depth.',
            trigger:
              'Publication demonstrating cardiac motion detection through chest wall at room temperature with compact source. Or: THz source cost drops below $1K with room-temperature operation.',
            triggerShort: 'Room-temp THz cardiac demo',
            whoToMonitor: [
              'MIT Lincoln Labs (THz imaging)',
              'University of Leeds (biomedical THz)',
              'TeraView Ltd (commercial THz)',
              'Menlo Systems (THz sources)',
            ],
            recentDevelopments:
              'Room-temperature quantum cascade lasers reaching 1 THz (2023). Graphene-based THz detectors showing promise for compact systems.',
            competitiveActivity:
              'No major players pursuing cardiac THz. Most THz medical research focuses on cancer detection (skin, breast) where penetration requirements are lower.',
            breakthroughPotential: {
              headline:
                'Non-contact cardiac imaging with sub-millimeter resolution through clothing',
              detail:
                'Would enable real-time visualization of heart wall motion without ECG electrodes or ultrasound gel. Could revolutionize cardiac screening in primary care settings.',
            },
            viabilitySummary:
              'Interesting physics but too early for product consideration. Monitor for source cost breakthroughs.',
          },
          {
            title: 'Polarimetric Radar for Tissue Characterization',
            type: 'PARADIGM',
            earliestViability: '3-5 years',
            trl: 3,
            whyInteresting:
              'Different tissue types (blood, muscle, fat) have different dielectric properties that affect radar polarization. Could potentially distinguish between respiratory motion and cardiac motion by polarization signature.',
            whyNotNow:
              'Theory is sound but no published validation specific to vital signs. Requires dual-polarization radar hardware (more complex than current FMCW). Signal processing for polarimetric separation is non-trivial.',
            trigger:
              'Publication demonstrating measurable polarization difference between cardiac and respiratory returns. Or: Commercial dual-pol radar module under $50.',
            triggerShort: 'Polarization vital signs demo',
            whoToMonitor: [
              'University of Hawaii (radar vital signs)',
              'Texas Instruments (radar modules)',
              'Infineon (60GHz radar)',
              'Vayyar (imaging radar)',
            ],
            recentDevelopments:
              'TI AWR1642 supports dual-polarization but not optimized for vital signs. Academic papers on polarimetric ground-penetrating radar showing tissue discrimination.',
            competitiveActivity:
              'Vayyar uses 4D imaging but single polarization. No known competitors pursuing polarimetric vital signs specifically.',
            breakthroughPotential: {
              headline:
                'Distinguish cardiac from respiratory motion without algorithmic post-processing',
              detail:
                'Physical separation of signal sources at the antenna level would dramatically simplify signal processing and improve reliability in motion-rich environments.',
            },
            viabilitySummary:
              'Promising direction that could differentiate from current approaches. Worth small exploratory investment.',
          },
        ]}
      />
    </div>
  );
}

export default FrontierTechnologies;
