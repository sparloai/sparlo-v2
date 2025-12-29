/**
 * RisksWatchouts
 *
 * Air Company Aesthetic - Technical Monograph, Not AI Tool
 *
 * Risk register with category, severity, and mitigations.
 * Feels like a clear-eyed assessment, not an alarming dashboard.
 *
 * Visual elements:
 * - No color coding (no red/yellow/green)
 * - Severity communicated through typographic weight
 * - Border weight differentiates high severity
 * - Mitigation directly beneath each risk shows "we have a plan"
 */

import React from 'react';

// ============================================
// TYPES
// ============================================

interface Risk {
  description: string;
  category: 'Market' | 'Regulatory' | 'Technical' | 'Resource';
  severity: 'high' | 'medium' | 'low';
  mitigation: string;
}

interface RisksWatchoutsProps {
  risks: Risk[];
}

// ============================================
// RISK CARD
// ============================================

function RiskCard({ description, category, severity, mitigation }: Risk) {
  return (
    <div
      className={`
        border-l-2 pl-6
        ${severity === 'high' ? 'border-zinc-400' : 'border-zinc-200'}
      `}
    >
      {/* Risk description */}
      <p className="text-[18px] font-medium leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]">
        {description}
      </p>

      {/* Meta row: Category + Severity */}
      <div className="mt-2 flex items-center gap-3 text-[13px]">
        <span className="text-zinc-500">{category}</span>
        <span className="text-zinc-300">·</span>
        <span
          className={`
            ${severity === 'high' ? 'text-zinc-700 font-medium' : ''}
            ${severity === 'medium' ? 'text-zinc-500' : ''}
            ${severity === 'low' ? 'text-zinc-400' : ''}
          `}
        >
          {severity.charAt(0).toUpperCase() + severity.slice(1)} severity
        </span>
      </div>

      {/* Mitigation */}
      <div className="mt-4">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          Mitigation
        </span>
        <p className="mt-2 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
          {mitigation}
        </p>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function RisksWatchouts({ risks }: RisksWatchoutsProps) {
  return (
    <section className="mt-20">
      <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900">
        Risks & Watchouts
      </h2>
      <p className="mt-2 text-[18px] text-zinc-500">
        What could go wrong
      </p>

      <div className="mt-10 space-y-10 max-w-[70ch]">
        {risks.map((risk) => (
          <RiskCard key={risk.description} {...risk} />
        ))}
      </div>
    </section>
  );
}

// ============================================
// GROUPED BY CATEGORY VARIANT
// ============================================

export function RisksWatchoutsGrouped({ risks }: RisksWatchoutsProps) {
  const categories: Risk['category'][] = ['Technical', 'Market', 'Regulatory', 'Resource'];

  return (
    <section className="mt-20">
      <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900">
        Risks & Watchouts
      </h2>
      <p className="mt-2 text-[18px] text-zinc-500">
        What could go wrong
      </p>

      <div className="mt-10 space-y-12">
        {categories.map((category) => {
          const categoryRisks = risks.filter((r) => r.category === category);
          if (categoryRisks.length === 0) return null;

          return (
            <div key={category}>
              <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
                {category} Risks
              </span>

              <div className="mt-6 space-y-8">
                {categoryRisks.map((risk) => (
                  <RiskCard key={risk.description} {...risk} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================
// TABLE VARIANT
// ============================================

export function RisksWatchoutsTable({ risks }: RisksWatchoutsProps) {
  return (
    <section className="mt-20">
      <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900">
        Risks & Watchouts
      </h2>
      <p className="mt-2 text-[18px] text-zinc-500">
        What could go wrong
      </p>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-[18px]">
          <thead>
            <tr className="border-b border-zinc-300">
              <th className="text-left py-3 pr-8 font-medium text-zinc-900">Risk</th>
              <th className="text-left py-3 pr-8 font-medium text-zinc-500 w-28">Type</th>
              <th className="text-left py-3 pr-8 font-medium text-zinc-500 w-28">Severity</th>
              <th className="text-left py-3 font-medium text-zinc-500">Mitigation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {risks.map((risk) => (
              <tr key={risk.description}>
                <td className="py-4 pr-8 text-[#1e1e1e] font-medium align-top">
                  {risk.description}
                </td>
                <td className="py-4 pr-8 text-zinc-500 align-top">{risk.category}</td>
                <td
                  className={`py-4 pr-8 align-top
                    ${risk.severity === 'high' ? 'text-zinc-700 font-medium' : ''}
                    ${risk.severity === 'medium' ? 'text-zinc-500' : ''}
                    ${risk.severity === 'low' ? 'text-zinc-400' : ''}
                  `}
                >
                  {risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1)}
                </td>
                <td className="py-4 text-zinc-600 align-top">{risk.mitigation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ============================================
// EXAMPLE WITH REAL DATA
// ============================================

export function RisksWatchoutsExample() {
  const risks: Risk[] = [
    {
      description: 'BCG signal quality degrades significantly with clothing layers or irregular body positions',
      category: 'Technical',
      severity: 'high',
      mitigation:
        'Implement adaptive gain control and multi-sensor fusion. Validate across 50+ clothing/position combinations before production commitment.',
    },
    {
      description: 'FDA may reclassify non-contact vital signs monitors requiring 510(k) clearance',
      category: 'Regulatory',
      severity: 'medium',
      mitigation:
        'Design system architecture to support clinical validation pathway. Maintain documentation suitable for 510(k) submission if required.',
    },
    {
      description: 'Sleep Number or Withings may announce furniture-integrated BCG product before our launch',
      category: 'Market',
      severity: 'medium',
      mitigation:
        'Focus on differentiated use cases (office chairs, automotive) rather than competing directly in sleep monitoring.',
    },
    {
      description: 'Key signal processing expertise concentrated in single team member',
      category: 'Resource',
      severity: 'high',
      mitigation:
        'Document all algorithms thoroughly. Hire second DSP engineer within 3 months. Cross-train firmware team on core signal processing.',
    },
    {
      description: 'Piezoelectric film suppliers have 12-week lead times',
      category: 'Resource',
      severity: 'low',
      mitigation:
        'Qualify secondary supplier. Maintain 6-month buffer stock for critical components.',
    },
  ];

  return (
    <div className="max-w-[900px] mx-auto px-10 py-20 bg-white min-h-screen">
      <RisksWatchouts risks={risks} />
    </div>
  );
}

export default RisksWatchouts;
