/**
 * Risks & Watchouts Section
 *
 * Air Company Aesthetic - Technical Monograph
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
import { memo } from 'react';

import type { RiskAndWatchout } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

import {
  BodyText,
  MonoLabel,
  Section,
  SectionSubtitle,
  SectionTitle,
  SeverityIndicator,
} from '../primitives';

interface RisksWatchoutsSectionProps {
  data?: RiskAndWatchout[];
}

export const RisksWatchoutsSection = memo(function RisksWatchoutsSection({
  data,
}: RisksWatchoutsSectionProps) {
  if (!data || data.length === 0) return null;

  return (
    <Section id="risks-watchouts" className="mt-20">
      <SectionTitle size="lg">Risks & Watchouts</SectionTitle>
      <SectionSubtitle>What could go wrong</SectionSubtitle>

      <div className="mt-10 max-w-[70ch] space-y-10">
        {data.map((risk, idx) => (
          <RiskCard key={idx} {...risk} />
        ))}
      </div>
    </Section>
  );
});

interface RiskCardProps {
  risk?: string;
  category?: string;
  severity?: 'high' | 'medium' | 'low';
  mitigation?: string;
}

const RiskCard = memo(function RiskCard({
  risk,
  category,
  severity = 'medium',
  mitigation,
}: RiskCardProps) {
  return (
    <div
      className={`border-l-2 pl-6 ${
        severity === 'high' ? 'border-zinc-400' : 'border-zinc-200'
      }`}
    >
      {/* Risk description */}
      <p className="text-[18px] leading-[1.3] font-medium tracking-[-0.02em] text-[#1e1e1e]">
        {risk}
      </p>

      {/* Meta row: Category + Severity */}
      <div className="mt-2 flex items-center gap-3 text-[13px]">
        {category && <span className="text-zinc-500">{category}</span>}
        {category && <span className="text-zinc-300">·</span>}
        <SeverityIndicator severity={severity} />
      </div>

      {/* Mitigation */}
      {mitigation && (
        <div className="mt-4">
          <MonoLabel variant="muted">Mitigation</MonoLabel>
          <BodyText className="mt-2" variant="secondary">
            {mitigation}
          </BodyText>
        </div>
      )}
    </div>
  );
});

// ============================================
// GROUPED BY CATEGORY VARIANT
// ============================================

interface RisksWatchoutsGroupedProps {
  data?: RiskAndWatchout[];
}

export const RisksWatchoutsGrouped = memo(function RisksWatchoutsGrouped({
  data,
}: RisksWatchoutsGroupedProps) {
  if (!data || data.length === 0) return null;

  const categories = ['Technical', 'Market', 'Regulatory', 'Resource'];

  return (
    <Section id="risks-watchouts" className="mt-20">
      <SectionTitle size="lg">Risks & Watchouts</SectionTitle>
      <SectionSubtitle>What could go wrong</SectionSubtitle>

      <div className="mt-10 space-y-12">
        {categories.map((category) => {
          const categoryRisks = data.filter((r) => r.category === category);
          if (categoryRisks.length === 0) return null;

          return (
            <div key={category}>
              <MonoLabel variant="muted">{category} Risks</MonoLabel>

              <div className="mt-6 space-y-8">
                {categoryRisks.map((risk, idx) => (
                  <RiskCard key={idx} {...risk} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
});

// ============================================
// TABLE VARIANT
// ============================================

interface RisksWatchoutsTableProps {
  data?: RiskAndWatchout[];
}

export const RisksWatchoutsTable = memo(function RisksWatchoutsTable({
  data,
}: RisksWatchoutsTableProps) {
  if (!data || data.length === 0) return null;

  return (
    <Section id="risks-watchouts" className="mt-20">
      <SectionTitle size="lg">Risks & Watchouts</SectionTitle>
      <SectionSubtitle>What could go wrong</SectionSubtitle>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-[18px]">
          <thead>
            <tr className="border-b border-zinc-300">
              <th className="py-3 pr-8 text-left font-medium text-zinc-900">
                Risk
              </th>
              <th className="w-28 py-3 pr-8 text-left font-medium text-zinc-500">
                Type
              </th>
              <th className="w-28 py-3 pr-8 text-left font-medium text-zinc-500">
                Severity
              </th>
              <th className="py-3 text-left font-medium text-zinc-500">
                Mitigation
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.map((risk, idx) => (
              <tr key={idx}>
                <td className="py-4 pr-8 align-top font-medium text-[#1e1e1e]">
                  {risk.risk}
                </td>
                <td className="py-4 pr-8 align-top text-zinc-500">
                  {risk.category}
                </td>
                <td
                  className={`py-4 pr-8 align-top ${
                    risk.severity === 'high'
                      ? 'font-medium text-zinc-700'
                      : risk.severity === 'medium'
                        ? 'text-zinc-500'
                        : 'text-zinc-400'
                  }`}
                >
                  {risk.severity
                    ? risk.severity.charAt(0).toUpperCase() +
                      risk.severity.slice(1)
                    : 'Medium'}
                </td>
                <td className="py-4 align-top text-zinc-600">
                  {risk.mitigation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
});

export default RisksWatchoutsSection;
