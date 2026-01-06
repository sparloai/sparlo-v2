'use client';

/**
 * DD Report Core Sections
 *
 * Executive Summary, One Page Summary, and Verdict sections.
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

function VerdictBadge({
  verdict,
  size = 'md',
}: {
  verdict: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const statusMap: Record<string, 'go' | 'warning' | 'nogo'> = {
    PROMISING: 'go',
    VALIDATED: 'go',
    PROCEED: 'go',
    STRONG: 'go',
    NOVEL: 'go',
    HIGH: 'go',
    CAUTION: 'warning',
    PLAUSIBLE: 'warning',
    PROCEED_WITH_CAUTION: 'warning',
    QUESTIONABLE: 'warning',
    MODERATE: 'warning',
    INCREMENTAL: 'warning',
    MEDIUM: 'warning',
    PASS: 'nogo',
    INVALID: 'nogo',
    WEAK: 'nogo',
    DERIVATIVE: 'nogo',
    LOW: 'nogo',
  };
  const status = statusMap[verdict] || 'warning';

  const colorClasses = {
    go: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    nogo: 'bg-red-100 text-red-800 border-red-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        colorClasses[status],
        sizeClasses[size],
      )}
    >
      {verdict.replace(/_/g, ' ')}
    </span>
  );
}

function ScoreCard({
  label,
  score,
  outOf,
  description,
}: {
  label: string;
  score: number;
  outOf: number;
  description: string;
}) {
  const percentage = (score / outOf) * 100;
  const colorClass =
    percentage >= 70
      ? 'text-emerald-600'
      : percentage >= 40
        ? 'text-amber-600'
        : 'text-red-600';

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <MonoLabel variant="muted">{label}</MonoLabel>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={cn('text-3xl font-semibold', colorClass)}>
          {score}
        </span>
        <span className="text-sm text-zinc-400">/{outOf}</span>
      </div>
      {description && (
        <p className="mt-2 text-sm text-zinc-600">{description}</p>
      )}
    </div>
  );
}

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

function KeyValueRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  if (!value) return null;
  return (
    <div className={cn('flex items-start gap-4', className)}>
      <MonoLabel variant="muted" className="w-40 shrink-0">
        {label}
      </MonoLabel>
      <div className="flex-1 text-zinc-700">{value}</div>
    </div>
  );
}

// ============================================
// Executive Summary Section
// ============================================

export function ExecutiveSummarySection({
  data,
}: {
  data: DDReport['executive_summary'];
}) {
  if (!data) return null;

  return (
    <Section id="executive-summary">
      <SectionTitle>Executive Summary</SectionTitle>

      {/* Summary */}
      {data.one_paragraph_summary && (
        <AccentBorder className="mt-8">
          <BodyText size="lg" variant="primary">
            {data.one_paragraph_summary}
          </BodyText>
        </AccentBorder>
      )}

      {/* Scores Grid */}
      {data.scores && Object.keys(data.scores).length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.scores.technical_credibility && (
            <ScoreCard
              label="Technical Credibility"
              score={data.scores.technical_credibility.score}
              outOf={data.scores.technical_credibility.out_of}
              description={data.scores.technical_credibility.one_liner}
            />
          )}
          {data.scores.commercial_viability && (
            <ScoreCard
              label="Commercial Viability"
              score={data.scores.commercial_viability.score}
              outOf={data.scores.commercial_viability.out_of}
              description={data.scores.commercial_viability.one_liner}
            />
          )}
          {data.scores.team_signals && (
            <ScoreCard
              label="Team Signals"
              score={data.scores.team_signals.score}
              outOf={data.scores.team_signals.out_of}
              description={data.scores.team_signals.one_liner}
            />
          )}
          {data.scores.moat_strength && (
            <ScoreCard
              label="Moat Strength"
              score={data.scores.moat_strength.score}
              outOf={data.scores.moat_strength.out_of}
              description={data.scores.moat_strength.one_liner}
            />
          )}
        </div>
      )}

      {/* Key Findings */}
      {data.key_findings.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4">Key Findings</MonoLabel>
          <div className="space-y-3">
            {data.key_findings.map((finding, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4"
              >
                <VerdictBadge verdict={finding.type} size="sm" />
                <div className="flex-1">
                  <p className="text-zinc-700">{finding.finding}</p>
                  <span className="mt-1 text-xs text-zinc-500">
                    Impact: {finding.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verdict & Recommendation */}
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <MonoLabel variant="muted">Verdict:</MonoLabel>
          <VerdictBadge verdict={data.verdict} size="lg" />
        </div>
        <div className="flex items-center gap-2">
          <MonoLabel variant="muted">Confidence:</MonoLabel>
          <VerdictBadge verdict={data.verdict_confidence} size="md" />
        </div>
      </div>

      {data.recommendation && (
        <Card className="mt-6">
          <div className="flex items-center gap-2">
            <MonoLabel>Recommendation:</MonoLabel>
            <VerdictBadge verdict={data.recommendation.action} />
          </div>
          {data.recommendation.rationale && (
            <p className="mt-3 text-zinc-600">
              {data.recommendation.rationale}
            </p>
          )}
          {data.recommendation.key_conditions.length > 0 && (
            <div className="mt-4">
              <MonoLabel variant="muted" className="mb-2">
                Key Conditions
              </MonoLabel>
              <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600">
                {data.recommendation.key_conditions.map((condition, idx) => (
                  <li key={idx}>{condition}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </Section>
  );
}

// ============================================
// One Page Summary Section
// ============================================

export function OnePageSummarySection({
  data,
}: {
  data: DDReport['one_page_summary'];
}) {
  if (!data) return null;

  return (
    <Section id="one-page-summary">
      <SectionTitle size="lg">One Page Summary</SectionTitle>

      {/* Company Info */}
      <Card className="mt-8">
        <div className="space-y-4">
          <KeyValueRow label="Company" value={data.company} />
          <KeyValueRow label="Sector" value={data.sector} />
          <KeyValueRow label="Stage" value={data.stage} />
          <KeyValueRow label="Ask" value={data.ask} />
        </div>
      </Card>

      {/* One Sentence */}
      {data.one_sentence && (
        <HighlightBox variant="strong" className="mt-6">
          <BodyText size="lg" className="text-white">
            {data.one_sentence}
          </BodyText>
        </HighlightBox>
      )}

      {/* The Bet */}
      {data.the_bet && (
        <div className="mt-6">
          <MonoLabel className="mb-2">The Bet</MonoLabel>
          <BodyText>{data.the_bet}</BodyText>
        </div>
      )}

      {/* Key Points */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {data.key_strength && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <MonoLabel className="text-emerald-700">Key Strength</MonoLabel>
            <p className="mt-2 text-emerald-800">{data.key_strength}</p>
          </div>
        )}
        {data.key_risk && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <MonoLabel className="text-red-700">Key Risk</MonoLabel>
            <p className="mt-2 text-red-800">{data.key_risk}</p>
          </div>
        )}
        {data.key_question && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <MonoLabel className="text-amber-700">Key Question</MonoLabel>
            <p className="mt-2 text-amber-800">{data.key_question}</p>
          </div>
        )}
      </div>

      {/* Cases */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {data.bull_case_2_sentences && (
          <div>
            <MonoLabel className="mb-2 text-emerald-600">Bull Case</MonoLabel>
            <BodyText variant="secondary">
              {data.bull_case_2_sentences}
            </BodyText>
          </div>
        )}
        {data.bear_case_2_sentences && (
          <div>
            <MonoLabel className="mb-2 text-red-600">Bear Case</MonoLabel>
            <BodyText variant="secondary">
              {data.bear_case_2_sentences}
            </BodyText>
          </div>
        )}
      </div>

      {/* Comparable & Return */}
      <div className="mt-8 space-y-3">
        <KeyValueRow
          label="Closest Comparable"
          value={data.closest_comparable}
        />
        <KeyValueRow label="Expected Return" value={data.expected_return} />
      </div>

      {/* If You Do One Thing */}
      {data.if_you_do_one_thing && (
        <AccentBorder weight="heavy" className="mt-8">
          <MonoLabel className="mb-2">If You Do One Thing</MonoLabel>
          <BodyText variant="primary">{data.if_you_do_one_thing}</BodyText>
        </AccentBorder>
      )}

      {/* Verdict Box */}
      {data.verdict_box && Object.keys(data.verdict_box).length > 0 && (
        <Card className="mt-8">
          <MonoLabel className="mb-4">Verdict Summary</MonoLabel>
          <div className="space-y-3">
            {data.verdict_box.overall && (
              <KeyValueRow label="Overall" value={data.verdict_box.overall} />
            )}
            {data.verdict_box.technical_validity && (
              <KeyValueRow
                label="Technical"
                value={
                  <span className="flex items-center gap-2">
                    {data.verdict_box.technical_validity.symbol && (
                      <span>{data.verdict_box.technical_validity.symbol}</span>
                    )}
                    {data.verdict_box.technical_validity.verdict}
                  </span>
                }
              />
            )}
            {data.verdict_box.commercial_viability && (
              <KeyValueRow
                label="Commercial"
                value={
                  <span className="flex items-center gap-2">
                    {data.verdict_box.commercial_viability.symbol && (
                      <span>
                        {data.verdict_box.commercial_viability.symbol}
                      </span>
                    )}
                    {data.verdict_box.commercial_viability.verdict}
                  </span>
                }
              />
            )}
            {data.verdict_box.moat_strength && (
              <KeyValueRow
                label="Moat"
                value={
                  <span className="flex items-center gap-2">
                    {data.verdict_box.moat_strength.symbol && (
                      <span>{data.verdict_box.moat_strength.symbol}</span>
                    )}
                    {data.verdict_box.moat_strength.verdict}
                  </span>
                }
              />
            )}
            {data.verdict_box.timing && (
              <KeyValueRow
                label="Timing"
                value={
                  <span className="flex items-center gap-2">
                    {data.verdict_box.timing.symbol && (
                      <span>{data.verdict_box.timing.symbol}</span>
                    )}
                    {data.verdict_box.timing.verdict}
                  </span>
                }
              />
            )}
          </div>
        </Card>
      )}
    </Section>
  );
}

// ============================================
// Verdict Section
// ============================================

export function VerdictSection({
  data,
}: {
  data: DDReport['verdict_and_recommendation'];
}) {
  if (!data) return null;

  return (
    <Section id="verdict">
      <SectionTitle>Verdict & Recommendation</SectionTitle>

      {/* Overall Verdict */}
      {data.overall_verdict && (
        <HighlightBox
          variant={
            data.overall_verdict.verdict === 'PASS' ? 'subtle' : 'strong'
          }
          className="mt-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <MonoLabel
                className={
                  data.overall_verdict.verdict === 'PASS'
                    ? 'text-zinc-600'
                    : 'text-zinc-300'
                }
              >
                Overall Verdict
              </MonoLabel>
              <p
                className={cn(
                  'mt-2 text-3xl font-semibold',
                  data.overall_verdict.verdict === 'PASS'
                    ? 'text-zinc-900'
                    : 'text-white',
                )}
              >
                {data.overall_verdict.verdict.replace(/_/g, ' ')}
              </p>
            </div>
            <VerdictBadge verdict={data.overall_verdict.confidence} />
          </div>
        </HighlightBox>
      )}

      {/* Technical & Commercial Verdicts */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {data.technical_verdict && (
          <Card>
            <MonoLabel className="mb-3">Technical Verdict</MonoLabel>
            {data.technical_verdict.verdict && (
              <VerdictBadge verdict={data.technical_verdict.verdict} />
            )}
            {data.technical_verdict.summary && (
              <p className="mt-3 text-zinc-600">
                {data.technical_verdict.summary}
              </p>
            )}
          </Card>
        )}
        {data.commercial_verdict && (
          <Card>
            <MonoLabel className="mb-3">Commercial Verdict</MonoLabel>
            {data.commercial_verdict.verdict && (
              <p className="font-medium text-zinc-800">
                {data.commercial_verdict.verdict}
              </p>
            )}
            {data.commercial_verdict.summary && (
              <p className="mt-2 text-zinc-600">
                {data.commercial_verdict.summary}
              </p>
            )}
          </Card>
        )}
      </div>

      {/* Recommendation */}
      {data.recommendation && (
        <Card className="mt-8">
          <div className="flex items-center gap-3">
            <MonoLabel>Recommendation:</MonoLabel>
            <VerdictBadge verdict={data.recommendation.action} size="lg" />
          </div>

          {data.recommendation.timeline && (
            <p className="mt-4 text-sm text-zinc-500">
              Timeline: {data.recommendation.timeline}
            </p>
          )}

          {data.recommendation.conditions.length > 0 && (
            <div className="mt-6">
              <MonoLabel variant="muted" className="mb-2">
                Conditions
              </MonoLabel>
              <ul className="list-disc space-y-1 pl-5 text-zinc-600">
                {data.recommendation.conditions.map((condition, idx) => (
                  <li key={idx}>{condition}</li>
                ))}
              </ul>
            </div>
          )}

          {data.recommendation.derisking_steps.length > 0 && (
            <div className="mt-6">
              <MonoLabel variant="muted" className="mb-2">
                De-risking Steps
              </MonoLabel>
              <ul className="list-disc space-y-1 pl-5 text-zinc-600">
                {data.recommendation.derisking_steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Final Word */}
      {data.final_word && (
        <AccentBorder weight="heavy" className="mt-8">
          <MonoLabel className="mb-2">Final Word</MonoLabel>
          <BodyText size="lg">{data.final_word}</BodyText>
        </AccentBorder>
      )}
    </Section>
  );
}
