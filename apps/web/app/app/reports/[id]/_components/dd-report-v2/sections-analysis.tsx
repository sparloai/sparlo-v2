'use client';

/**
 * DD Report Analysis Sections
 *
 * Technical Thesis, Claim Validation, Solution Landscape, Novelty, and Moat sections.
 */
import { cn } from '@kit/ui/utils';

import {
  AccentBorder,
  BodyText,
  HighlightBox,
  MonoLabel,
  NumberedItem,
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
    VALIDATED: 'go',
    STRONG: 'go',
    NOVEL: 'go',
    HIGH: 'go',
    PLAUSIBLE: 'warning',
    MODERATE: 'warning',
    INCREMENTAL: 'warning',
    MEDIUM: 'warning',
    QUESTIONABLE: 'warning',
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
// Technical Thesis Section
// ============================================

export function TechnicalThesisSection({
  data,
}: {
  data: DDReport['technical_thesis_assessment'];
}) {
  if (!data) return null;

  return (
    <Section id="technical-thesis">
      <SectionTitle>Technical Thesis Assessment</SectionTitle>

      {/* Their Thesis */}
      {data.their_thesis && (
        <AccentBorder className="mt-8">
          <MonoLabel className="mb-2">Their Thesis</MonoLabel>
          <BodyText size="lg">{data.their_thesis}</BodyText>
        </AccentBorder>
      )}

      {/* Thesis Validity */}
      {data.thesis_validity && (
        <Card className="mt-8">
          <div className="flex items-center justify-between">
            <MonoLabel>Thesis Validity</MonoLabel>
            <div className="flex items-center gap-2">
              <VerdictBadge verdict={data.thesis_validity.verdict} />
              <VerdictBadge
                verdict={data.thesis_validity.confidence}
                size="sm"
              />
            </div>
          </div>
          {data.thesis_validity.explanation && (
            <p className="mt-4 text-zinc-600">
              {data.thesis_validity.explanation}
            </p>
          )}
        </Card>
      )}

      {/* Mechanism Assessment */}
      {data.mechanism_assessment && (
        <Card className="mt-6">
          <MonoLabel className="mb-4">Mechanism Assessment</MonoLabel>
          <div className="space-y-4">
            {data.mechanism_assessment.mechanism && (
              <div>
                <span className="text-sm text-zinc-500">Mechanism:</span>
                <p className="text-zinc-700">
                  {data.mechanism_assessment.mechanism}
                </p>
              </div>
            )}
            {data.mechanism_assessment.physics_validity && (
              <div>
                <span className="text-sm text-zinc-500">Physics Validity:</span>
                <p className="text-zinc-700">
                  {data.mechanism_assessment.physics_validity}
                </p>
              </div>
            )}
            {data.mechanism_assessment.precedent && (
              <div>
                <span className="text-sm text-zinc-500">Precedent:</span>
                <p className="text-zinc-700">
                  {data.mechanism_assessment.precedent}
                </p>
              </div>
            )}
            {data.mechanism_assessment.key_uncertainty && (
              <div>
                <span className="text-sm text-zinc-500">Key Uncertainty:</span>
                <p className="text-amber-700">
                  {data.mechanism_assessment.key_uncertainty}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Performance Claims */}
      {data.performance_claims.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4">Performance Claims</MonoLabel>
          <div className="space-y-4">
            {data.performance_claims.map((claim, idx) => (
              <Card key={idx} className="border-l-4 border-l-zinc-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-zinc-800">{claim.claim}</p>
                    {claim.theoretical_limit && (
                      <p className="mt-1 text-sm text-zinc-500">
                        Theoretical limit: {claim.theoretical_limit}
                      </p>
                    )}
                    {claim.explanation && (
                      <p className="mt-2 text-zinc-600">{claim.explanation}</p>
                    )}
                  </div>
                  <VerdictBadge verdict={claim.verdict} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

// ============================================
// Claim Validation Section
// ============================================

export function ClaimValidationSection({
  data,
}: {
  data: DDReport['claim_validation_summary'];
}) {
  if (!data) return null;

  return (
    <Section id="claim-validation">
      <SectionTitle>Claim Validation Summary</SectionTitle>

      {data.overview && (
        <BodyText className="mt-8" variant="secondary">
          {data.overview}
        </BodyText>
      )}

      {/* Critical Claims */}
      {data.critical_claims.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4">Critical Claims</MonoLabel>
          <div className="space-y-4">
            {data.critical_claims.map((claim, idx) => (
              <NumberedItem key={idx} index={idx}>
                <Card>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-zinc-800">{claim.claim}</p>
                      <p className="mt-2 text-zinc-600">
                        {claim.plain_english}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <VerdictBadge verdict={claim.verdict} />
                      <span className="text-xs text-zinc-500">
                        Confidence: {claim.confidence}
                      </span>
                    </div>
                  </div>
                </Card>
              </NumberedItem>
            ))}
          </div>
        </div>
      )}

      {/* TRIZ Findings */}
      {data.triz_findings && (
        <Card className="mt-8">
          <MonoLabel className="mb-4">TRIZ Analysis</MonoLabel>
          {data.triz_findings.key_contradictions && (
            <div className="mb-4">
              <span className="text-sm text-zinc-500">Key Contradictions:</span>
              <p className="text-zinc-700">
                {data.triz_findings.key_contradictions}
              </p>
            </div>
          )}
          {data.triz_findings.resolution_quality && (
            <div>
              <span className="text-sm text-zinc-500">Resolution Quality:</span>
              <p className="text-zinc-700">
                {data.triz_findings.resolution_quality}
              </p>
            </div>
          )}
        </Card>
      )}
    </Section>
  );
}

// ============================================
// Solution Landscape Section
// ============================================

export function SolutionLandscapeSection({
  data,
}: {
  data: DDReport['solution_landscape'];
}) {
  if (!data) return null;

  const renderTrack = (
    track:
      | {
          track_description?: string;
          concepts: Array<{
            name: string;
            one_liner: string;
            mechanism?: string;
            maturity?: string;
            key_advantage?: string;
            key_challenge?: string;
            current_players: string[];
            threat_to_startup: string;
            threat_reasoning?: string;
          }>;
        }
      | undefined,
    title: string,
  ) => {
    if (!track || track.concepts.length === 0) return null;
    return (
      <div className="mt-6">
        <MonoLabel className="mb-2">{title}</MonoLabel>
        {track.track_description && (
          <p className="mb-4 text-sm text-zinc-500">
            {track.track_description}
          </p>
        )}
        <div className="space-y-4">
          {track.concepts.map((concept, idx) => (
            <Card key={idx}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-zinc-800">{concept.name}</p>
                  <p className="mt-1 text-zinc-600">{concept.one_liner}</p>
                  {concept.maturity && (
                    <span className="mt-2 inline-block rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                      {concept.maturity}
                    </span>
                  )}
                </div>
                <SeverityBadge severity={concept.threat_to_startup} />
              </div>
              {concept.current_players.length > 0 && (
                <p className="mt-3 text-sm text-zinc-500">
                  Players: {concept.current_players.join(', ')}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Section id="solution-landscape">
      <SectionTitle>Solution Landscape</SectionTitle>

      {data.section_purpose && (
        <BodyText className="mt-8" variant="secondary">
          {data.section_purpose}
        </BodyText>
      )}

      {/* Landscape Overview */}
      {data.landscape_overview && (
        <Card className="mt-8">
          <MonoLabel className="mb-4">Overview</MonoLabel>
          {data.landscape_overview.total_approaches_analyzed !== undefined && (
            <p className="text-3xl font-semibold text-zinc-800">
              {data.landscape_overview.total_approaches_analyzed} approaches
              analyzed
            </p>
          )}
          {data.landscape_overview.key_insight && (
            <p className="mt-4 text-zinc-600">
              {data.landscape_overview.key_insight}
            </p>
          )}
        </Card>
      )}

      {/* Solution Tracks */}
      {data.solution_space_by_track && (
        <div className="mt-8">
          {renderTrack(
            data.solution_space_by_track.simpler_path,
            'Simpler Path',
          )}
          {renderTrack(data.solution_space_by_track.best_fit, 'Best Fit')}
          {renderTrack(
            data.solution_space_by_track.frontier_transfer,
            'Frontier Transfer',
          )}
          {renderTrack(
            data.solution_space_by_track.paradigm_shift,
            'Paradigm Shift',
          )}
        </div>
      )}

      {/* Startup Positioning */}
      {data.startup_positioning && (
        <HighlightBox className="mt-8">
          <MonoLabel className="mb-4">Startup Positioning</MonoLabel>
          <div className="space-y-3">
            {data.startup_positioning.which_track && (
              <p>
                <span className="text-zinc-500">Track:</span>{' '}
                {data.startup_positioning.which_track}
              </p>
            )}
            {data.startup_positioning.positioning_verdict && (
              <p className="font-medium text-zinc-800">
                {data.startup_positioning.positioning_verdict}
              </p>
            )}
            {data.startup_positioning.positioning_explanation && (
              <p className="text-zinc-600">
                {data.startup_positioning.positioning_explanation}
              </p>
            )}
          </div>
        </HighlightBox>
      )}

      {/* The Implicit Bet */}
      {data.the_implicit_bet && (
        <Card className="mt-8">
          <MonoLabel className="mb-4">The Implicit Bet</MonoLabel>
          {data.the_implicit_bet.what_they_are_betting_on && (
            <div className="mb-4">
              <span className="text-sm text-zinc-500">Betting On:</span>
              <p className="text-zinc-700">
                {data.the_implicit_bet.what_they_are_betting_on}
              </p>
            </div>
          )}
          {data.the_implicit_bet.what_they_are_betting_against.length > 0 && (
            <div className="mb-4">
              <span className="text-sm text-zinc-500">Betting Against:</span>
              <ul className="mt-1 list-disc pl-5 text-zinc-700">
                {data.the_implicit_bet.what_they_are_betting_against.map(
                  (item, idx) => (
                    <li key={idx}>{item}</li>
                  ),
                )}
              </ul>
            </div>
          )}
          {data.the_implicit_bet.bet_quality && (
            <p className="font-medium text-zinc-800">
              {data.the_implicit_bet.bet_quality}
            </p>
          )}
        </Card>
      )}

      {/* Strategic Insight */}
      {data.strategic_insight && (
        <AccentBorder weight="heavy" className="mt-8">
          <MonoLabel className="mb-2">Strategic Insight</MonoLabel>
          <BodyText size="lg">{data.strategic_insight}</BodyText>
        </AccentBorder>
      )}
    </Section>
  );
}

// ============================================
// Novelty Section
// ============================================

export function NoveltySection({
  data,
}: {
  data: DDReport['novelty_assessment'];
}) {
  if (!data) return null;

  return (
    <Section id="novelty">
      <SectionTitle>Novelty Assessment</SectionTitle>

      <div className="mt-8 flex items-center gap-4">
        <MonoLabel>Verdict:</MonoLabel>
        <VerdictBadge verdict={data.verdict} size="lg" />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {data.what_is_novel && (
          <Card className="border-l-4 border-l-emerald-400">
            <MonoLabel className="mb-3 text-emerald-700">
              What Is Novel
            </MonoLabel>
            <BodyText variant="secondary">{data.what_is_novel}</BodyText>
          </Card>
        )}
        {data.what_is_not_novel && (
          <Card className="border-l-4 border-l-zinc-300">
            <MonoLabel className="mb-3 text-zinc-500">
              What Is Not Novel
            </MonoLabel>
            <BodyText variant="secondary">{data.what_is_not_novel}</BodyText>
          </Card>
        )}
      </div>

      {/* Prior Art */}
      {data.key_prior_art.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4">Key Prior Art</MonoLabel>
          <div className="space-y-3">
            {data.key_prior_art.map((art, idx) => (
              <Card key={idx}>
                <p className="font-medium text-zinc-800">{art.reference}</p>
                {art.relevance && (
                  <p className="mt-2 text-sm text-zinc-600">
                    <span className="text-zinc-500">Relevance:</span>{' '}
                    {art.relevance}
                  </p>
                )}
                {art.impact && (
                  <p className="mt-1 text-sm text-zinc-600">
                    <span className="text-zinc-500">Impact:</span> {art.impact}
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
// Moat Section
// ============================================

export function MoatSection({ data }: { data: DDReport['moat_assessment'] }) {
  if (!data) return null;

  return (
    <Section id="moat">
      <SectionTitle>Moat Assessment</SectionTitle>

      {/* Overall */}
      {data.overall && (
        <Card className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <MonoLabel className="mb-2">Overall Moat Strength</MonoLabel>
              <VerdictBadge verdict={data.overall.strength} size="lg" />
            </div>
            {data.overall.durability_years !== undefined && (
              <div className="text-right">
                <MonoLabel variant="muted">Durability</MonoLabel>
                <p className="text-2xl font-semibold text-zinc-800">
                  {data.overall.durability_years} years
                </p>
              </div>
            )}
          </div>
          {data.overall.primary_source && (
            <p className="mt-4 text-zinc-600">
              <span className="text-zinc-500">Primary Source:</span>{' '}
              {data.overall.primary_source}
            </p>
          )}
        </Card>
      )}

      {/* Breakdown */}
      {data.breakdown && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {data.breakdown.technical && (
            <Card>
              <MonoLabel variant="muted">Technical</MonoLabel>
              <div className="mt-2">
                <VerdictBadge verdict={data.breakdown.technical} />
              </div>
            </Card>
          )}
          {data.breakdown.market && (
            <Card>
              <MonoLabel variant="muted">Market</MonoLabel>
              <div className="mt-2">
                <VerdictBadge verdict={data.breakdown.market} />
              </div>
            </Card>
          )}
          {data.breakdown.execution && (
            <Card>
              <MonoLabel variant="muted">Execution</MonoLabel>
              <div className="mt-2">
                <VerdictBadge verdict={data.breakdown.execution} />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Vulnerabilities */}
      {data.vulnerabilities.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4">Vulnerabilities</MonoLabel>
          <div className="space-y-3">
            {data.vulnerabilities.map((vuln, idx) => (
              <Card
                key={idx}
                className="flex items-start justify-between gap-4"
              >
                <p className="text-zinc-700">{vuln.vulnerability}</p>
                <SeverityBadge severity={vuln.severity} />
              </Card>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
