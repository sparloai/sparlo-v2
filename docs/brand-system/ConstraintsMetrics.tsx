/**
 * ConstraintsMetrics
 *
 * Air Company Aesthetic - Technical Monograph, Not AI Tool
 *
 * Structure:
 * 1. Three-column constraint lists (Hard, Soft, Assumptions)
 * 2. Success Metrics table
 *
 * Visual hierarchy through color gradient:
 * - Hard Constraints: zinc-900 (darkest, most important)
 * - Soft Constraints: zinc-500 (medium)
 * - Assumptions: zinc-400 (lightest)
 */

import React from 'react';

// ============================================
// TYPES
// ============================================

interface Metric {
  name: string;
  target: string;
  minimum: string;
  stretch: string;
}

interface ConstraintsMetricsProps {
  hardConstraints: string[];
  softConstraints: string[];
  assumptions: string[];
  metrics: Metric[];
}

// ============================================
// CONSTRAINT LIST COMPONENT
// ============================================

interface ConstraintListProps {
  type: 'hard' | 'soft' | 'assumptions';
  items: string[];
}

function ConstraintList({ type, items }: ConstraintListProps) {
  const config = {
    hard: {
      label: 'Hard Constraints',
      labelColor: 'text-zinc-900',
      bulletColor: 'bg-zinc-900',
      textColor: 'text-zinc-800',
    },
    soft: {
      label: 'Soft Constraints',
      labelColor: 'text-zinc-500',
      bulletColor: 'bg-zinc-400',
      textColor: 'text-zinc-600',
    },
    assumptions: {
      label: 'Assumptions',
      labelColor: 'text-zinc-400',
      bulletColor: 'bg-zinc-300',
      textColor: 'text-zinc-500',
    },
  };

  const { label, labelColor, bulletColor, textColor } = config[type];

  return (
    <div>
      <span className={`text-[13px] font-medium tracking-[0.08em] ${labelColor} uppercase`}>
        {label}
      </span>
      <ul className="mt-4 space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className={`mt-2 h-1.5 w-1.5 rounded-full ${bulletColor} flex-shrink-0`} />
            <span className={`text-[18px] leading-[1.5] ${textColor}`}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// METRICS TABLE COMPONENT
// ============================================

interface MetricsTableProps {
  metrics: Metric[];
}

function MetricsTable({ metrics }: MetricsTableProps) {
  return (
    <div className="mt-16">
      <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
        Success Metrics
      </span>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-[18px]">
          <thead>
            <tr className="border-b border-zinc-300">
              <th className="text-left py-3 pr-8 font-medium text-zinc-900">Metric</th>
              <th className="text-left py-3 pr-8 font-medium text-zinc-900">Target</th>
              <th className="text-left py-3 pr-8 font-medium text-zinc-500">Minimum Viable</th>
              <th className="text-left py-3 font-medium text-zinc-500">Stretch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {metrics.map((metric, index) => (
              <tr key={index}>
                <td className="py-4 pr-8 text-zinc-800">{metric.name}</td>
                <td className="py-4 pr-8 text-zinc-900 font-medium">{metric.target}</td>
                <td className="py-4 pr-8 text-zinc-500">{metric.minimum}</td>
                <td className="py-4 text-zinc-500">{metric.stretch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ConstraintsMetrics({
  hardConstraints,
  softConstraints,
  assumptions,
  metrics,
}: ConstraintsMetricsProps) {
  return (
    <article className="border-l-2 border-zinc-900 bg-white pl-10">
      {/* Three-column constraint lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <ConstraintList type="hard" items={hardConstraints} />
        <ConstraintList type="soft" items={softConstraints} />
        <ConstraintList type="assumptions" items={assumptions} />
      </div>

      {/* Metrics table */}
      <MetricsTable metrics={metrics} />
    </article>
  );
}

// ============================================
// EXAMPLE WITH REAL DATA
// ============================================

export function ConstraintsMetricsExample() {
  return (
    <div className="max-w-[900px] mx-auto px-10 py-20 bg-white min-h-screen">
      {/* Section Header */}
      <h1 className="text-[36px] font-semibold tracking-tight text-zinc-900 mb-12">
        Constraints & Metrics
      </h1>

      <ConstraintsMetrics
        hardConstraints={[
          'No contact with user required',
          'Works in ambient lighting conditions',
          'Consumer-grade hardware (<$100 BOM)',
          'Privacy-preserving (no video storage)',
        ]}
        softConstraints={[
          'Range of 1-3 meters preferred',
          'Multi-person separation capability',
          'Works through light clothing',
          'Battery-powered option available',
        ]}
        assumptions={[
          'Indoor use only initially',
          'Stationary subject for first version',
          'Adult users (not infants/children)',
          'No FDA clearance required for v1',
        ]}
        metrics={[
          {
            name: 'Heart rate accuracy',
            target: '±3 BPM',
            minimum: '±5 BPM',
            stretch: '±2 BPM',
          },
          {
            name: 'Respiration rate accuracy',
            target: '±1 BPM',
            minimum: '±2 BPM',
            stretch: '±0.5 BPM',
          },
          {
            name: 'Time to first reading',
            target: '<30 sec',
            minimum: '<60 sec',
            stretch: '<15 sec',
          },
          {
            name: 'Valid reading availability',
            target: '>90%',
            minimum: '>80%',
            stretch: '>95%',
          },
        ]}
      />
    </div>
  );
}

export default ConstraintsMetrics;
