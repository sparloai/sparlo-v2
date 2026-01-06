'use client';

/**
 * DD Report Risk Sections
 *
 * Risk Analysis, Commercialization, Scenario Analysis, and Pre-Mortem sections.
 */
import { cn } from '@kit/ui/utils';

import {
  AccentBorder,
  BodyText,
  HighlightBox,
  MonoLabel,
  Section,
  SectionTitle,
} from '../brand-system/primitives';
import type { DDReport } from './schema';

// ============================================
// Shared Components
// ============================================

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200 bg-white p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span
      className={cn(
        'rounded px-2 py-0.5 text-xs font-medium',
        colors[severity] || colors.MEDIUM,
      )}
    >
      {severity}
    </span>
  );
}

// ============================================
// Commercialization Section
// ============================================

export function CommercializationSection({
  data,
}: {
  data: DDReport['commercialization_reality'];
}) {
  if (!data) return null;

  return (
    <Section id="commercialization">
      <SectionTitle>Commercialization Reality</SectionTitle>

      {data.summary && (
        <BodyText className="mt-8" variant="secondary">
          {data.summary}
        </BodyText>
      )}

      {data.verdict && (
        <HighlightBox className="mt-6">
          <MonoLabel className="mb-2">Verdict</MonoLabel>
          <p className="text-lg font-medium text-zinc-800">{data.verdict}</p>
        </HighlightBox>
      )}

      {/* Market Readiness */}
      {data.market_readiness && (
        <Card className="mt-8">
          <MonoLabel className="mb-4">Market Readiness</MonoLabel>
          <div className="space-y-3">
            {data.market_readiness.market_exists !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500">Market Exists:</span>
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-sm font-medium',
                    data.market_readiness.market_exists
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700',
                  )}
                >
                  {data.market_readiness.market_exists ? 'Yes' : 'No'}
                </span>
              </div>
            )}
            {data.market_readiness.vitamin_or_painkiller && (
              <p>
                <span className="text-sm text-zinc-500">Type:</span>{' '}
                {data.market_readiness.vitamin_or_painkiller}
              </p>
            )}
            {data.market_readiness.customer_evidence && (
              <p>
                <span className="text-sm text-zinc-500">
                  Customer Evidence:
                </span>{' '}
                {data.market_readiness.customer_evidence}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Unit Economics */}
      {data.unit_economics && (
        <Card className="mt-6">
          <MonoLabel className="mb-4">Unit Economics</MonoLabel>
          <div className="grid gap-4 md:grid-cols-2">
            {data.unit_economics.today && (
              <div>
                <span className="text-sm text-zinc-500">Today:</span>
                <p className="text-zinc-700">{data.unit_economics.today}</p>
              </div>
            )}
            {data.unit_economics.claimed_at_scale && (
              <div>
                <span className="text-sm text-zinc-500">At Scale:</span>
                <p className="text-zinc-700">
                  {data.unit_economics.claimed_at_scale}
                </p>
              </div>
            )}
          </div>
          {data.unit_economics.credibility && (
            <p className="mt-4 text-zinc-600">
              <span className="text-zinc-500">Credibility:</span>{' '}
              {data.unit_economics.credibility}
            </p>
          )}
        </Card>
      )}

      {/* Path to Revenue */}
      {data.path_to_revenue && (
        <Card className="mt-6">
          <MonoLabel className="mb-4">Path to Revenue</MonoLabel>
          <div className="space-y-3">
            {data.path_to_revenue.timeline && (
              <p>
                <span className="text-sm text-zinc-500">Timeline:</span>{' '}
                {data.path_to_revenue.timeline}
              </p>
            )}
            {data.path_to_revenue.capital_required && (
              <p>
                <span className="text-sm text-zinc-500">Capital Required:</span>{' '}
                {data.path_to_revenue.capital_required}
              </p>
            )}
            {data.path_to_revenue.fits_vc_timeline !== undefined && (
              <p>
                <span className="text-sm text-zinc-500">Fits VC Timeline:</span>{' '}
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-sm font-medium',
                    data.path_to_revenue.fits_vc_timeline
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700',
                  )}
                >
                  {data.path_to_revenue.fits_vc_timeline ? 'Yes' : 'No'}
                </span>
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Scale Up Risk */}
      {data.scale_up_risk && (
        <Card className="mt-6 border-l-4 border-l-amber-400">
          <MonoLabel className="mb-4">Scale Up Risk</MonoLabel>
          {data.scale_up_risk.valley_of_death && (
            <div className="mb-3">
              <span className="text-sm text-zinc-500">Valley of Death:</span>
              <p className="text-zinc-700">
                {data.scale_up_risk.valley_of_death}
              </p>
            </div>
          )}
          {data.scale_up_risk.stranding_risk && (
            <div>
              <span className="text-sm text-zinc-500">Stranding Risk:</span>
              <p className="text-zinc-700">
                {data.scale_up_risk.stranding_risk}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* The Hard Truth */}
      {data.the_hard_truth && (
        <AccentBorder weight="heavy" className="mt-8">
          <MonoLabel className="mb-2">The Hard Truth</MonoLabel>
          {data.the_hard_truth.even_if_physics_works && (
            <BodyText className="mb-3">
              {data.the_hard_truth.even_if_physics_works}
            </BodyText>
          )}
          {data.the_hard_truth.critical_commercial_question && (
            <p className="font-medium text-zinc-800">
              {data.the_hard_truth.critical_commercial_question}
            </p>
          )}
        </AccentBorder>
      )}
    </Section>
  );
}

// ============================================
// Risk Analysis Section
// ============================================

export function RiskAnalysisSection({
  data,
}: {
  data: DDReport['risk_analysis'];
}) {
  if (!data) return null;

  return (
    <Section id="risk-analysis">
      <SectionTitle>Risk Analysis</SectionTitle>

      {data.key_risk_summary && (
        <AccentBorder className="mt-8">
          <BodyText size="lg">{data.key_risk_summary}</BodyText>
        </AccentBorder>
      )}

      {/* Technical Risks */}
      {data.technical_risks.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4">Technical Risks</MonoLabel>
          <div className="space-y-3">
            {data.technical_risks.map((risk, idx) => (
              <Card key={idx}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-zinc-800">{risk.risk}</p>
                    {risk.mitigation && (
                      <p className="mt-2 text-sm text-zinc-600">
                        <span className="text-zinc-500">Mitigation:</span>{' '}
                        {risk.mitigation}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {risk.probability && (
                      <span className="text-xs text-zinc-500">
                        P: <SeverityBadge severity={risk.probability} />
                      </span>
                    )}
                    {risk.impact && (
                      <span className="text-xs text-zinc-500">
                        I: <SeverityBadge severity={risk.impact} />
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Commercial Risks */}
      {data.commercial_risks.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4">Commercial Risks</MonoLabel>
          <div className="space-y-3">
            {data.commercial_risks.map((risk, idx) => (
              <Card
                key={idx}
                className="flex items-start justify-between gap-4"
              >
                <p className="text-zinc-700">{risk.risk}</p>
                {risk.severity && <SeverityBadge severity={risk.severity} />}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Competitive Risks */}
      {data.competitive_risks.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4">Competitive Risks</MonoLabel>
          <div className="space-y-3">
            {data.competitive_risks.map((risk, idx) => (
              <Card key={idx}>
                <p className="font-medium text-zinc-800">{risk.risk}</p>
                {risk.timeline && (
                  <p className="mt-2 text-sm text-zinc-500">
                    Timeline: {risk.timeline}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

// ============================================
// Scenario Analysis Section
// ============================================

export function ScenarioAnalysisSection({
  data,
}: {
  data: DDReport['scenario_analysis'];
}) {
  if (!data) return null;

  const renderScenario = (
    scenario:
      | { probability?: string; narrative: string; return?: string }
      | undefined,
    title: string,
    colorClass: string,
    bgClass: string,
  ) => {
    if (!scenario) return null;
    return (
      <Card className={cn('border-l-4', colorClass)}>
        <MonoLabel className="mb-3">{title}</MonoLabel>
        {scenario.probability && (
          <span
            className={cn(
              'mb-2 inline-block rounded px-2 py-0.5 text-sm',
              bgClass,
            )}
          >
            {scenario.probability}
          </span>
        )}
        <p className="mt-2 text-zinc-700">{scenario.narrative}</p>
        {scenario.return && (
          <p className="mt-3 font-medium text-zinc-800">
            Return: {scenario.return}
          </p>
        )}
      </Card>
    );
  };

  return (
    <Section id="scenario-analysis">
      <SectionTitle>Scenario Analysis</SectionTitle>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {renderScenario(
          data.bull_case,
          'Bull Case',
          'border-l-emerald-400',
          'bg-emerald-100 text-emerald-700',
        )}
        {renderScenario(
          data.base_case,
          'Base Case',
          'border-l-zinc-400',
          'bg-zinc-100 text-zinc-700',
        )}
        {renderScenario(
          data.bear_case,
          'Bear Case',
          'border-l-red-400',
          'bg-red-100 text-red-700',
        )}
      </div>

      {/* Expected Value */}
      {data.expected_value && (
        <HighlightBox className="mt-8">
          <MonoLabel className="mb-2">Expected Value</MonoLabel>
          {data.expected_value.weighted_multiple && (
            <p className="text-2xl font-semibold text-zinc-800">
              {data.expected_value.weighted_multiple}
            </p>
          )}
          {data.expected_value.assessment && (
            <p className="mt-2 text-zinc-600">
              {data.expected_value.assessment}
            </p>
          )}
        </HighlightBox>
      )}
    </Section>
  );
}

// ============================================
// Pre-Mortem Section
// ============================================

export function PreMortemSection({ data }: { data: DDReport['pre_mortem'] }) {
  if (!data) return null;

  return (
    <Section id="pre-mortem">
      <SectionTitle>Pre-Mortem Analysis</SectionTitle>

      {data.framing && (
        <BodyText className="mt-8" variant="secondary">
          {data.framing}
        </BodyText>
      )}

      {/* Most Likely Failure */}
      {data.most_likely_failure && (
        <Card className="mt-8 border-l-4 border-l-red-400">
          <div className="flex items-start justify-between gap-4">
            <MonoLabel className="text-red-700">Most Likely Failure</MonoLabel>
            {data.most_likely_failure.probability && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-sm text-red-700">
                {data.most_likely_failure.probability}
              </span>
            )}
          </div>
          <p className="mt-4 text-zinc-700">
            {data.most_likely_failure.scenario}
          </p>
          {data.most_likely_failure.preventable_by && (
            <p className="mt-3 text-sm">
              <span className="text-zinc-500">Preventable by:</span>{' '}
              {data.most_likely_failure.preventable_by}
            </p>
          )}
          {data.most_likely_failure.early_warnings.length > 0 && (
            <div className="mt-4">
              <span className="text-sm text-zinc-500">Early Warnings:</span>
              <ul className="mt-1 list-disc pl-5 text-sm text-zinc-600">
                {data.most_likely_failure.early_warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Second Most Likely */}
      {data.second_most_likely && (
        <Card className="mt-6 border-l-4 border-l-amber-400">
          <div className="flex items-start justify-between gap-4">
            <MonoLabel className="text-amber-700">Second Most Likely</MonoLabel>
            {data.second_most_likely.probability && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-sm text-amber-700">
                {data.second_most_likely.probability}
              </span>
            )}
          </div>
          <p className="mt-4 text-zinc-700">
            {data.second_most_likely.scenario}
          </p>
        </Card>
      )}

      {/* Black Swan */}
      {data.black_swan && (
        <Card className="mt-6 border-l-4 border-l-zinc-900">
          <div className="flex items-start justify-between gap-4">
            <MonoLabel>Black Swan</MonoLabel>
            {data.black_swan.probability && (
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-sm text-zinc-700">
                {data.black_swan.probability}
              </span>
            )}
          </div>
          <p className="mt-4 text-zinc-700">{data.black_swan.scenario}</p>
        </Card>
      )}
    </Section>
  );
}
