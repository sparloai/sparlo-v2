'use client';

import { memo } from 'react';

import {
  AlertTriangle,
  ArrowRight,
  Beaker,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  GitBranch,
  Layers,
  Lightbulb,
  ListChecks,
  MessageSquare,
  PieChart,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

// Jobs Standard: Typography does the work. No decorative icons.
// Only functional icons retained (none needed in report content)

import {
  AuraBadge,
  AuraTable,
  CardWithHeader,
  DarkSection,
  MetadataInfoCard,
  MonoLabel,
  NumberedHeader,
  SectionHeader,
  ViabilityAssessment,
} from '@kit/ui/aura';
import { cn } from '@kit/ui/utils';

import type {
  ChallengeTheFrame,
  ConceptRecommendation,
  ConstraintsAndMetrics,
  CoupledEffect,
  CrossDomainSearch,
  ExecutionTrack,
  ExecutionTrackPrimary,
  FrontierWatch,
  HonestAssessment,
  HybridReportDisplayProps,
  IPConsiderations,
  InnovationAnalysis,
  InnovationPortfolio,
  InsightBlock,
  ParallelInvestigation,
  ProblemAnalysis,
  RecommendedInnovation,
  RiskAndWatchout,
  StrategicIntegration,
  SupportingConcept,
  SustainabilityFlag,
} from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

import { BrandSystemReport } from './brand-system';

/**
 * Hybrid Report Display Component
 *
 * Renders hybrid mode reports with decision architecture:
 * - Executive Summary
 * - Problem Restatement
 * - Primary Recommendation
 * - Fallback Strategy
 * - Parallel Explorations
 * - Key Insights
 * - Next Steps
 * - Self-Critique
 */

// ============================================
// Report-specific Badge Components
// ============================================

const TRACK_CONFIG: Record<string, { label: string; cssClass: string }> = {
  simpler_path: { label: 'Simpler Path', cssClass: 'track-badge--simpler' },
  best_fit: { label: 'Best Fit', cssClass: 'track-badge--bestfit' },
  paradigm_shift: { label: 'Paradigm Shift', cssClass: 'track-badge--neutral' },
  frontier_transfer: {
    label: 'Frontier Transfer',
    cssClass: 'track-badge--spark',
  },
};

const TrackBadge = memo(function TrackBadge({ track }: { track?: string }) {
  const config = track ? TRACK_CONFIG[track] : null;
  if (!config) return null;

  return (
    <span className={cn('track-badge', config.cssClass)}>{config.label}</span>
  );
});

const CONFIDENCE_CSS: Record<string, string> = {
  high: 'confidence-badge--high',
  medium: 'confidence-badge--medium',
  low: 'confidence-badge--low',
};

const ConfidenceBadge = memo(function ConfidenceBadge({
  level,
}: {
  level?: string;
}) {
  const cssClass = level ? CONFIDENCE_CSS[level] : CONFIDENCE_CSS.medium;

  return (
    <span className={cn('confidence-badge', cssClass)}>
      {level || 'Medium'} Confidence
    </span>
  );
});

/**
 * Convert numeric confidence (0-100) to High/Medium/Low label
 */
function getConfidenceLabel(confidence: number): string {
  if (confidence >= 70) return 'High';
  if (confidence >= 40) return 'Medium';
  return 'Low';
}

function RecommendationCard({
  recommendation,
  type,
}: {
  recommendation: ConceptRecommendation;
  type: 'primary' | 'fallback';
}) {
  const isPrimary = type === 'primary';

  return (
    <div
      className={cn(
        'rounded-xl border p-6',
        isPrimary
          ? 'border-l-4 border-zinc-200 border-l-zinc-900 bg-zinc-50/50 dark:border-zinc-700 dark:border-l-zinc-100 dark:bg-zinc-800/50'
          : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/50',
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            {isPrimary ? (
              <Target className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            ) : (
              <ArrowRight className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                isPrimary
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-zinc-500 dark:text-zinc-400',
              )}
            >
              {isPrimary ? 'Primary recommendation' : 'Fallback strategy'}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {recommendation.title}
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <TrackBadge track={recommendation.track} />
          <ConfidenceBadge level={recommendation.confidence_level} />
        </div>
      </div>

      {/* Executive Summary */}
      {recommendation.executive_summary && (
        <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {recommendation.executive_summary}
        </p>
      )}

      {/* Why It Wins */}
      {recommendation.why_it_wins && (
        <div className="mb-4 rounded-lg bg-white/60 p-4 dark:bg-zinc-800/60">
          <div className="mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-zinc-900 dark:text-white">
              Why this wins
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {recommendation.why_it_wins}
          </p>
        </div>
      )}

      {/* Timeline & Investment */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {recommendation.estimated_timeline && (
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 text-zinc-400" />
            <div>
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Timeline
              </span>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                {recommendation.estimated_timeline}
              </p>
            </div>
          </div>
        )}
        {recommendation.estimated_investment && (
          <div className="flex items-start gap-2">
            <DollarSign className="mt-0.5 h-4 w-4 text-zinc-400" />
            <div>
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Investment
              </span>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                {recommendation.estimated_investment}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* How to Test */}
      {recommendation.how_to_test && recommendation.how_to_test.length > 0 && (
        <div className="mb-4">
          <div className="mb-3 flex items-center gap-2">
            <Beaker className="h-4 w-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-900 dark:text-white">
              How to test
            </span>
          </div>
          <div className="space-y-3">
            {recommendation.how_to_test.map((test, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {test.name}
                  </span>
                  <div className="flex gap-2 text-xs text-zinc-500">
                    {test.estimated_time && <span>{test.estimated_time}</span>}
                    {test.estimated_cost && (
                      <span>• {test.estimated_cost}</span>
                    )}
                  </div>
                </div>
                {test.description && (
                  <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {test.description}
                  </p>
                )}
                {test.success_criteria && (
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {test.success_criteria}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Risks */}
      {recommendation.key_risks && recommendation.key_risks.length > 0 && (
        <div className="mb-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-zinc-900 dark:text-white">
              Key risks
            </span>
          </div>
          <div className="space-y-2">
            {recommendation.key_risks.map((risk, idx) => (
              <div
                key={idx}
                className="border-l-2 border-l-zinc-300 py-2 pl-4 dark:border-l-zinc-600"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {risk.risk}
                  </span>
                  <span className="badge-tag badge-tag--warning">
                    {risk.likelihood} / {risk.impact}
                  </span>
                </div>
                {risk.mitigation && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    <span className="font-medium">Mitigation:</span>{' '}
                    {risk.mitigation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prior Art */}
      {recommendation.prior_art_summary &&
        recommendation.prior_art_summary.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Prior art
              </span>
            </div>
            <div className="space-y-2">
              {recommendation.prior_art_summary.map((art, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="text-sm font-medium text-zinc-900 dark:text-white">
                    {art.source}
                  </div>
                  {art.relevance && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {art.relevance}
                    </p>
                  )}
                  {art.what_it_proves && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      {art.what_it_proves}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

// ============================================
// NEW: Execution Track + Innovation Portfolio Components
// ============================================

const SOURCE_TYPE_CONFIG: Record<string, { label: string; cssClass: string }> =
  {
    CATALOG: { label: 'Catalog Solution', cssClass: 'badge-pill--accent' },
    TRANSFER: {
      label: 'Cross-Domain Transfer',
      cssClass: 'badge-pill--neutral',
    },
    OPTIMIZATION: { label: 'Optimization', cssClass: 'badge-pill--go' },
    FIRST_PRINCIPLES: {
      label: 'First Principles',
      cssClass: 'badge-pill--warning',
    },
  };

const SourceTypeBadge = memo(function SourceTypeBadge({
  sourceType,
}: {
  sourceType?: string;
}) {
  const typeConfig = sourceType ? SOURCE_TYPE_CONFIG[sourceType] : null;
  if (!typeConfig) return null;

  return (
    <span className={cn('badge-pill badge-pill--sm', typeConfig.cssClass)}>
      {typeConfig.label}
    </span>
  );
});

const INNOVATION_TYPE_CONFIG: Record<
  string,
  { label: string; cssClass: string }
> = {
  PARADIGM_SHIFT: { label: 'Paradigm Shift', cssClass: 'badge-pill--neutral' },
  CROSS_DOMAIN_TRANSFER: {
    label: 'Cross-Domain',
    cssClass: 'badge-pill--neutral',
  },
  TECHNOLOGY_REVIVAL: {
    label: 'Tech Revival',
    cssClass: 'badge-pill--warning',
  },
  FIRST_PRINCIPLES: {
    label: 'First Principles',
    cssClass: 'badge-pill--accent',
  },
};

const InnovationTypeBadge = memo(function InnovationTypeBadge({
  innovationType,
}: {
  innovationType?: string;
}) {
  const typeConfig = innovationType
    ? INNOVATION_TYPE_CONFIG[innovationType]
    : null;
  if (!typeConfig) return null;

  return (
    <span className={cn('badge-pill badge-pill--sm', typeConfig.cssClass)}>
      {typeConfig.label}
    </span>
  );
});

function FrontierWatchCard({
  item,
  index,
}: {
  item: FrontierWatch;
  index: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      {/* Numbered Header */}
      <NumberedHeader index={index} title={item.title ?? 'Untitled'} />

      {/* Metadata Info Card */}
      <MetadataInfoCard
        items={[
          ...(item.innovation_type
            ? [{ label: 'Type', value: item.innovation_type }]
            : []),
          ...(item.earliest_viability
            ? [{ label: 'Earliest Viability', value: item.earliest_viability }]
            : []),
          ...(item.trl_estimate
            ? [{ label: 'Current TRL', value: `TRL ${item.trl_estimate}` }]
            : []),
        ]}
      />

      <div className="space-y-8 p-8 sm:p-10">
        {/* One-liner / What It Is */}
        {item.one_liner && (
          <div>
            <MonoLabel>What it is</MonoLabel>
            <p className="mt-3 text-base leading-relaxed font-normal text-zinc-900">
              {item.one_liner}
            </p>
          </div>
        )}

        {/* Why Interesting */}
        {item.why_interesting && (
          <div>
            <MonoLabel>Why it&apos;s interesting</MonoLabel>
            <p className="mt-3 text-base leading-relaxed font-normal text-zinc-700">
              {item.why_interesting}
            </p>
          </div>
        )}

        {/* Why Not Now */}
        {item.why_not_now && (
          <div>
            <MonoLabel>Why not now</MonoLabel>
            <p className="mt-3 text-base leading-relaxed font-normal text-zinc-700">
              {item.why_not_now}
            </p>
          </div>
        )}

        {/* Monitoring Details Grid */}
        {(item.trigger_to_revisit || item.who_to_monitor) && (
          <div className="grid gap-6 md:grid-cols-2">
            {item.trigger_to_revisit && (
              <div className="rounded-lg border border-zinc-200 p-6">
                <MonoLabel>Trigger to revisit</MonoLabel>
                <p className="mt-3 text-sm leading-relaxed text-zinc-700">
                  {item.trigger_to_revisit}
                </p>
              </div>
            )}
            {item.who_to_monitor && (
              <div className="rounded-lg border border-zinc-200 p-6">
                <MonoLabel>Who to monitor</MonoLabel>
                <p className="mt-3 text-sm leading-relaxed text-zinc-700">
                  {item.who_to_monitor}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Web search enhanced fields - dark section */}
        {(item.recent_developments || item.competitive_activity) && (
          <DarkSection label="Web Search Intelligence">
            <div className="space-y-4 text-sm">
              {item.recent_developments && (
                <div>
                  <span className="mb-2 block text-xs font-semibold text-zinc-300">
                    Recent developments
                  </span>
                  <p className="leading-relaxed text-zinc-100">
                    {item.recent_developments}
                  </p>
                </div>
              )}
              {item.competitive_activity && (
                <div>
                  <span className="mb-2 block text-xs font-semibold text-zinc-300">
                    Competitive activity
                  </span>
                  <p className="leading-relaxed text-zinc-100">
                    {item.competitive_activity}
                  </p>
                </div>
              )}
            </div>
          </DarkSection>
        )}

        {/* Viability Assessment footer */}
        {(item.earliest_viability || item.why_not_now) && (
          <ViabilityAssessment
            headline={item.why_not_now ?? 'Monitoring recommended'}
            revisitTimeframe={item.earliest_viability}
            revisitReason={item.trigger_to_revisit}
          />
        )}
      </div>
    </div>
  );
}

function FrontierWatchSection({
  items,
}: {
  items: FrontierWatch[] | null | undefined;
}) {
  if (!items?.length) return null;

  return (
    <section id="frontier-watch">
      <SectionHeader
        title="Frontier Technologies"
        subtitle="Emerging technologies and innovations to monitor"
      />
      <div className="space-y-12">
        {items.map((item, idx) => (
          <FrontierWatchCard
            key={item.id ?? `frontier-${idx}`}
            item={item}
            index={idx + 1}
          />
        ))}
      </div>
    </section>
  );
}

function InsightBlockDisplay({ insight }: { insight?: InsightBlock }) {
  if (!insight) return null;

  return (
    <div className="space-y-3 rounded-lg border-l-4 border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-600 dark:bg-zinc-800/50">
      <div className="flex items-start gap-2">
        <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-600 dark:text-zinc-400" />
        <div>
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            The insight
          </span>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
            {insight.what}
          </p>
        </div>
      </div>

      {insight.where_we_found_it && (
        <div className="ml-6 rounded-lg bg-white/60 p-3 dark:bg-zinc-800/60">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Where we found it
          </span>
          <p className="text-sm text-zinc-700 dark:text-zinc-200">
            <strong>{insight.where_we_found_it.domain}:</strong>{' '}
            {insight.where_we_found_it.how_they_use_it}
          </p>
          {insight.where_we_found_it.why_it_transfers && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              → {insight.where_we_found_it.why_it_transfers}
            </p>
          )}
        </div>
      )}

      {insight.why_industry_missed_it && (
        <div className="ml-6">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Why industry missed it
          </span>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {insight.why_industry_missed_it}
          </p>
        </div>
      )}

      {insight.physics && (
        <div className="ml-6">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            The physics
          </span>
          <p className="font-mono text-sm text-zinc-600 dark:text-zinc-300">
            {insight.physics}
          </p>
        </div>
      )}
    </div>
  );
}

function HonestAssessmentSection({
  assessment,
}: {
  assessment?: HonestAssessment;
}) {
  if (!assessment) return null;

  return (
    <section id="honest-assessment">
      <SectionHeader
        title="Honest Assessment"
        subtitle="What we're actually delivering"
      />
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {/* Header with problem type */}
        {assessment.problem_type && (
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/50 p-6">
            <MonoLabel>Problem Type</MonoLabel>
            <AuraBadge variant="neutral">
              {assessment.problem_type.replace(/_/g, ' ')}
            </AuraBadge>
          </div>
        )}

        <div className="space-y-8 p-8 sm:p-10">
          {/* Value Range Table */}
          {assessment.expected_value_range && (
            <AuraTable headers={['Floor', 'Most Likely', 'Ceiling']}>
              <tr>
                <td className="px-6 py-4 text-sm font-normal text-zinc-700">
                  {assessment.expected_value_range.floor}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-green-700">
                  {assessment.expected_value_range.most_likely}
                </td>
                <td className="px-6 py-4 text-sm font-normal text-zinc-700">
                  {assessment.expected_value_range.ceiling}
                </td>
              </tr>
            </AuraTable>
          )}

          {/* Candid Assessment */}
          {assessment.candid_assessment && (
            <div>
              <MonoLabel>Candid assessment</MonoLabel>
              <p className="mt-3 text-base leading-relaxed font-normal text-zinc-900">
                {assessment.candid_assessment}
              </p>
            </div>
          )}

          {/* What Would Need to Change */}
          {assessment.if_value_is_limited && (
            <div className="border-l-2 border-l-zinc-300 py-3 pl-5 dark:border-l-zinc-600">
              <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                What would need to change
              </p>
              <p className="text-base leading-relaxed text-zinc-600 italic dark:text-zinc-300">
                {assessment.if_value_is_limited}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CrossDomainSearchSection({ search }: { search?: CrossDomainSearch }) {
  if (!search) return null;

  return (
    <section id="cross-domain-search">
      <SectionHeader
        title="Cross-Domain Search"
        subtitle="Where we looked and what we found"
      />
      <div className="space-y-8">
        {/* The Reframe - Dark Section */}
        {search.enhanced_challenge_frame && (
          <DarkSection label="The Reframe">
            <p className="mb-8 max-w-3xl text-lg leading-relaxed font-light text-zinc-100 sm:text-xl">
              {search.enhanced_challenge_frame.reframing}
            </p>
            {search.enhanced_challenge_frame.search_queries &&
              search.enhanced_challenge_frame.search_queries.length > 0 && (
                <div className="border-t border-zinc-800 pt-8">
                  <h4 className="mb-4 text-xs font-semibold tracking-wide text-zinc-300">
                    Search queries
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {search.enhanced_challenge_frame.search_queries.map(
                      (query, idx) => (
                        <span
                          key={idx}
                          className="rounded-full border border-zinc-600 bg-zinc-800/50 px-3 py-1.5 font-mono text-xs font-medium text-zinc-100"
                        >
                          {query}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
          </DarkSection>
        )}

        {/* Domains Searched */}
        {search.domains_searched && search.domains_searched.length > 0 && (
          <CardWithHeader icon={Layers} label="Domains searched">
            <div className="space-y-4">
              {search.domains_searched.map((domain, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-200 p-6 transition-colors hover:border-zinc-400"
                >
                  <h5 className="mb-2 font-semibold text-zinc-950">
                    {domain.domain}
                  </h5>
                  {domain.mechanism_found && (
                    <p className="text-sm leading-relaxed text-zinc-700">
                      {domain.mechanism_found}
                    </p>
                  )}
                  {domain.relevance && (
                    <p className="mt-2 text-xs text-zinc-500">
                      → {domain.relevance}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardWithHeader>
        )}

        {/* Revelations */}
        {search.from_scratch_revelations &&
          search.from_scratch_revelations.length > 0 && (
            <CardWithHeader icon={Sparkles} label="Key revelations">
              <ul className="space-y-4">
                {search.from_scratch_revelations.map((rev, idx) => (
                  <li key={idx} className="group flex items-start gap-4">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-300 transition-colors group-hover:bg-zinc-950" />
                    <div>
                      <p className="text-base leading-relaxed font-medium text-zinc-950">
                        {rev.discovery}
                      </p>
                      {rev.source && (
                        <p className="mt-1 text-xs text-zinc-500">
                          Source: {rev.source}
                        </p>
                      )}
                      {rev.implication && (
                        <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                          → {rev.implication}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardWithHeader>
          )}
      </div>
    </section>
  );
}

const ExecutionTrackSection = memo(function ExecutionTrackSection({
  track,
  coupledEffects,
  sustainabilityFlag,
  ipConsiderations,
}: {
  track?: ExecutionTrack;
  coupledEffects?: CoupledEffect[];
  sustainabilityFlag?: SustainabilityFlag;
  ipConsiderations?: IPConsiderations;
}) {
  if (!track) return null;

  return (
    <section id="solution-concepts">
      <SectionHeader
        title="Solution Concepts"
        subtitle="Proven approaches using validated technologies"
      />
      <div className="space-y-6">
        {track.intro && (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {track.intro}
          </p>
        )}

        {/* Primary Recommendation */}
        {track.primary && (
          <div className="rounded-xl border border-l-4 border-zinc-200 border-l-zinc-900 bg-zinc-50/50 p-6 dark:border-zinc-700 dark:border-l-zinc-100 dark:bg-zinc-800/50">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Primary recommendation
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  {track.primary.title}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <SourceTypeBadge sourceType={track.primary.source_type} />
                {track.primary.confidence !== undefined && (
                  <ConfidenceBadge
                    level={getConfidenceLabel(
                      track.primary.confidence,
                    ).toLowerCase()}
                  />
                )}
              </div>
            </div>

            {track.primary.bottom_line && (
              <p className="mb-4 text-base font-medium text-zinc-700 dark:text-zinc-200">
                {track.primary.bottom_line}
              </p>
            )}

            {/* What It Is */}
            {track.primary.what_it_is && (
              <div className="mb-4">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  What it is
                </span>
                <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                  {track.primary.what_it_is}
                </p>
              </div>
            )}

            {/* Why It Works */}
            {track.primary.why_it_works && (
              <div className="mb-4">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Why it works
                </span>
                <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                  {track.primary.why_it_works}
                </p>
              </div>
            )}

            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              {track.primary.expected_improvement && (
                <div className="rounded-lg bg-white/60 p-3 dark:bg-zinc-800/60">
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Expected improvement
                  </span>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    {track.primary.expected_improvement}
                  </p>
                </div>
              )}
              {track.primary.timeline && (
                <div className="flex items-start gap-2 rounded-lg bg-white/60 p-3 dark:bg-zinc-800/60">
                  <Clock className="mt-0.5 h-4 w-4 text-zinc-400" />
                  <div>
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Timeline
                    </span>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200">
                      {track.primary.timeline}
                    </p>
                  </div>
                </div>
              )}
              {track.primary.investment && (
                <div className="flex items-start gap-2 rounded-lg bg-white/60 p-3 dark:bg-zinc-800/60">
                  <DollarSign className="mt-0.5 h-4 w-4 text-zinc-400" />
                  <div>
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Investment
                    </span>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200">
                      {track.primary.investment}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <InsightBlockDisplay insight={track.primary.the_insight} />

            {/* Validation Gates */}
            {track.primary.validation_gates &&
              track.primary.validation_gates.length > 0 && (
                <div className="mt-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      Validation gates
                    </span>
                  </div>
                  <div className="space-y-2">
                    {track.primary.validation_gates.map((gate, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-zinc-900 dark:text-white">
                            {gate.week}: {gate.test}
                          </span>
                          {gate.cost && (
                            <span className="text-sm text-zinc-500">
                              {gate.cost}
                            </span>
                          )}
                        </div>
                        {gate.success_criteria && (
                          <p className="mt-1 flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                            {gate.success_criteria}
                          </p>
                        )}
                        {gate.decision_point && (
                          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            Decision: {gate.decision_point}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Coupled Effects */}
            {coupledEffects && coupledEffects.length > 0 && (
              <div className="mt-4">
                <div className="mb-3 flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    Coupled effects
                  </span>
                </div>
                <div className="space-y-2">
                  {coupledEffects.map((effect, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'rounded-lg border p-3',
                        effect.direction === 'BETTER'
                          ? 'border-l-4 border-zinc-200 border-l-green-500 bg-zinc-50/50 dark:border-zinc-700 dark:border-l-green-600 dark:bg-zinc-800/50'
                          : effect.direction === 'WORSE'
                            ? 'border-l-4 border-zinc-200 border-l-red-500 bg-zinc-50/50 dark:border-zinc-700 dark:border-l-red-600 dark:bg-zinc-800/50'
                            : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/50',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-zinc-900 dark:text-white">
                          {effect.domain}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'badge-pill badge-pill--sm',
                              effect.direction === 'BETTER'
                                ? 'badge-pill--go'
                                : effect.direction === 'WORSE'
                                  ? 'badge-pill--nogo'
                                  : 'badge-pill--neutral',
                            )}
                          >
                            {effect.direction}
                          </span>
                          {effect.magnitude && (
                            <span className="badge-tag badge-tag--neutral">
                              {effect.magnitude}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        {effect.effect}
                      </p>
                      {effect.quantified && (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Quantified: {effect.quantified}
                        </p>
                      )}
                      {effect.mitigation && (
                        <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                          Mitigation: {effect.mitigation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sustainability Flag */}
            {sustainabilityFlag && sustainabilityFlag.type !== 'NONE' && (
              <div
                className={cn(
                  'mt-4 border-l-2 py-2 pl-4',
                  sustainabilityFlag.type === 'BENEFIT'
                    ? 'border-l-emerald-400 dark:border-l-emerald-500'
                    : sustainabilityFlag.type === 'CAUTION' ||
                        sustainabilityFlag.type === 'LIFECYCLE_TRADEOFF'
                      ? 'border-l-amber-400 dark:border-l-amber-500'
                      : 'border-l-zinc-300 dark:border-l-zinc-600',
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles
                    className={cn(
                      'h-4 w-4',
                      sustainabilityFlag.type === 'BENEFIT'
                        ? 'text-green-600 dark:text-green-400'
                        : sustainabilityFlag.type === 'CAUTION' ||
                            sustainabilityFlag.type === 'LIFECYCLE_TRADEOFF'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-zinc-400',
                    )}
                  />
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    Sustainability
                  </span>
                  <span
                    className={cn(
                      'badge-pill badge-pill--sm',
                      sustainabilityFlag.type === 'BENEFIT'
                        ? 'badge-pill--go'
                        : sustainabilityFlag.type === 'CAUTION' ||
                            sustainabilityFlag.type === 'LIFECYCLE_TRADEOFF'
                          ? 'badge-pill--warning'
                          : 'badge-pill--neutral',
                    )}
                  >
                    {sustainabilityFlag.type?.replace(/_/g, ' ')}
                  </span>
                </div>
                {sustainabilityFlag.summary && (
                  <p className="text-sm text-zinc-700 dark:text-zinc-200">
                    {sustainabilityFlag.summary}
                  </p>
                )}
                {sustainabilityFlag.detail && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {sustainabilityFlag.detail}
                  </p>
                )}
                {sustainabilityFlag.alternative && (
                  <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                    Alternative: {sustainabilityFlag.alternative}
                  </p>
                )}
              </div>
            )}

            {/* IP Considerations */}
            {ipConsiderations && (
              <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      IP considerations
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ipConsiderations.freedom_to_operate && (
                      <span
                        className={cn(
                          'badge-pill badge-pill--sm',
                          ipConsiderations.freedom_to_operate === 'GREEN'
                            ? 'badge-pill--go'
                            : ipConsiderations.freedom_to_operate === 'YELLOW'
                              ? 'badge-pill--warning'
                              : 'badge-pill--nogo',
                        )}
                      >
                        FTO: {ipConsiderations.freedom_to_operate}
                      </span>
                    )}
                    {ipConsiderations.patentability_potential && (
                      <span className="badge-tag badge-tag--accent">
                        Patentability:{' '}
                        {ipConsiderations.patentability_potential}
                      </span>
                    )}
                  </div>
                </div>
                {ipConsiderations.rationale && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {ipConsiderations.rationale}
                  </p>
                )}
                {ipConsiderations.key_patents_to_review &&
                  ipConsiderations.key_patents_to_review.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Key patents to review
                      </span>
                      <ul className="mt-1 space-y-1">
                        {ipConsiderations.key_patents_to_review.map(
                          (patent, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-zinc-600 dark:text-zinc-300"
                            >
                              • {patent}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Supplier Arbitrage (for CATALOG source type) */}
        {track.supplier_arbitrage && (
          <div className="rounded-xl border border-l-4 border-zinc-200 border-l-blue-500 bg-zinc-50/50 p-6 dark:border-zinc-700 dark:border-l-blue-600 dark:bg-zinc-800/50">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Supplier negotiation guide
              </span>
            </div>
            {track.supplier_arbitrage.who_to_call && (
              <p className="mb-3 text-sm text-zinc-700 dark:text-zinc-200">
                <strong>Contact:</strong> {track.supplier_arbitrage.who_to_call}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {track.supplier_arbitrage.what_to_ask &&
                track.supplier_arbitrage.what_to_ask.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      What to ask
                    </span>
                    <ul className="mt-1 space-y-1">
                      {track.supplier_arbitrage.what_to_ask.map((q, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300"
                        >
                          <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              {track.supplier_arbitrage.what_to_push_back_on &&
                track.supplier_arbitrage.what_to_push_back_on.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      What to push back on
                    </span>
                    <ul className="mt-1 space-y-1">
                      {track.supplier_arbitrage.what_to_push_back_on.map(
                        (p, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300"
                          >
                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                            {p}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Why Not Obvious (for TRANSFER/FIRST_PRINCIPLES) */}
        {track.why_not_obvious && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Why this wasn&apos;t obvious
              </span>
            </div>
            <div className="space-y-3">
              {track.why_not_obvious.industry_gap && (
                <div>
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Industry gap
                  </span>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {track.why_not_obvious.industry_gap}
                  </p>
                </div>
              )}
              {track.why_not_obvious.knowledge_barrier && (
                <div>
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Knowledge barrier
                  </span>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {track.why_not_obvious.knowledge_barrier}
                  </p>
                </div>
              )}
              {track.why_not_obvious.our_contribution && (
                <div>
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Our contribution
                  </span>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {track.why_not_obvious.our_contribution}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Supporting Concepts */}
        {track.supporting_concepts && track.supporting_concepts.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="mb-4 flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Supporting concepts
              </span>
            </div>
            <div className="space-y-3">
              {track.supporting_concepts.map((concept, idx) => (
                <div
                  key={concept.id ?? `concept-${idx}-${concept.title ?? ''}`}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-zinc-900 dark:text-white">
                        {concept.title}
                      </h5>
                    </div>
                    <span className="badge-tag badge-tag--neutral">
                      {concept.relationship?.toLowerCase()}
                    </span>
                  </div>
                  {concept.one_liner && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      {concept.one_liner}
                    </p>
                  )}
                  {concept.what_it_is && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                      <span className="font-medium">What it is: </span>
                      {concept.what_it_is}
                    </p>
                  )}
                  {concept.why_it_works && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="font-medium">Why it works: </span>
                      {concept.why_it_works}
                    </p>
                  )}
                  {concept.when_to_use_instead && (
                    <div className="mt-3 border-l-2 border-l-zinc-300 py-1 pl-3 text-xs text-zinc-600 dark:border-l-zinc-600 dark:text-zinc-400">
                      <span className="font-medium">When to use instead: </span>
                      <span className="italic">
                        {concept.when_to_use_instead}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fallback Trigger */}
        {track.fallback_trigger && (
          <div className="border-l-2 border-l-zinc-300 py-3 pl-4 dark:border-l-zinc-600">
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              When to pivot
            </p>
            {track.fallback_trigger.conditions &&
              track.fallback_trigger.conditions.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {track.fallback_trigger.conditions.map((cond, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-zinc-600 dark:text-zinc-300"
                    >
                      • {cond}
                    </li>
                  ))}
                </ul>
              )}
            {track.fallback_trigger.pivot_to && (
              <p className="text-sm text-orange-700 dark:text-orange-400">
                → Pivot to: {track.fallback_trigger.pivot_to}
              </p>
            )}
            {track.fallback_trigger.sunk_cost_limit && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Sunk cost limit: {track.fallback_trigger.sunk_cost_limit}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
});

const InnovationPortfolioSection = memo(function InnovationPortfolioSection({
  portfolio,
}: {
  portfolio?: InnovationPortfolio;
}) {
  if (!portfolio) return null;

  return (
    <section id="innovation-concepts">
      <SectionHeader
        title="Innovation Concepts"
        subtitle="Higher-risk bets with breakthrough potential"
      />
      <div className="space-y-6">
        {portfolio.intro && (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {portfolio.intro}
          </p>
        )}

        {/* Recommended Innovation */}
        {portfolio.recommended_innovation && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Recommended innovation
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {portfolio.recommended_innovation.title}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <InnovationTypeBadge
                  innovationType={
                    portfolio.recommended_innovation.innovation_type
                  }
                />
                {portfolio.recommended_innovation.confidence !== undefined && (
                  <ConfidenceBadge
                    level={getConfidenceLabel(
                      portfolio.recommended_innovation.confidence,
                    ).toLowerCase()}
                  />
                )}
              </div>
            </div>

            {/* What It Is */}
            {portfolio.recommended_innovation.what_it_is && (
              <div className="mb-4">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  What it is
                </span>
                <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                  {portfolio.recommended_innovation.what_it_is}
                </p>
              </div>
            )}

            {/* Why It Works */}
            {portfolio.recommended_innovation.why_it_works && (
              <div className="mb-4">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Why it works
                </span>
                <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                  {portfolio.recommended_innovation.why_it_works}
                </p>
              </div>
            )}

            {portfolio.recommended_innovation.selection_rationale
              ?.why_this_one && (
              <div className="mb-4 rounded-lg bg-white/60 p-4 dark:bg-zinc-800/60">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Why this one
                </span>
                <p className="text-sm text-zinc-700 dark:text-zinc-200">
                  {
                    portfolio.recommended_innovation.selection_rationale
                      .why_this_one
                  }
                </p>
                {portfolio.recommended_innovation.selection_rationale
                  .ceiling_if_works && (
                  <p className="mt-2 text-sm font-medium text-violet-700 dark:text-violet-400">
                    Ceiling:{' '}
                    {
                      portfolio.recommended_innovation.selection_rationale
                        .ceiling_if_works
                    }
                  </p>
                )}
              </div>
            )}

            <InsightBlockDisplay
              insight={portfolio.recommended_innovation.the_insight}
            />

            {portfolio.recommended_innovation.breakthrough_potential
              ?.if_it_works && (
              <div className="mt-4 rounded-lg border border-l-4 border-zinc-200 border-l-green-500 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:border-l-green-600 dark:bg-zinc-800/50">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    Breakthrough potential
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {
                    portfolio.recommended_innovation.breakthrough_potential
                      .if_it_works
                  }
                </p>
                {portfolio.recommended_innovation.breakthrough_potential
                  .estimated_improvement && (
                  <p className="mt-1 text-sm font-medium text-green-700 dark:text-green-400">
                    {
                      portfolio.recommended_innovation.breakthrough_potential
                        .estimated_improvement
                    }
                  </p>
                )}
              </div>
            )}

            {portfolio.recommended_innovation.validation_path && (
              <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <div className="mb-2 flex items-center gap-2">
                  <Beaker className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    Validation path
                  </span>
                </div>
                {portfolio.recommended_innovation.validation_path
                  .gating_question && (
                  <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Gating Question:{' '}
                    {
                      portfolio.recommended_innovation.validation_path
                        .gating_question
                    }
                  </p>
                )}
                <div className="grid gap-2 text-sm sm:grid-cols-3">
                  {portfolio.recommended_innovation.validation_path
                    .first_test && (
                    <div>
                      <span className="text-sm text-zinc-500">First Test:</span>
                      <p className="text-zinc-700 dark:text-zinc-200">
                        {
                          portfolio.recommended_innovation.validation_path
                            .first_test
                        }
                      </p>
                    </div>
                  )}
                  {(portfolio.recommended_innovation.validation_path.cost ||
                    portfolio.recommended_innovation.validation_path
                      .timeline) && (
                    <div>
                      <span className="text-sm text-zinc-500">
                        Cost/Timeline:
                      </span>
                      <p className="text-zinc-700 dark:text-zinc-200">
                        {portfolio.recommended_innovation.validation_path
                          .cost ?? '—'}{' '}
                        /{' '}
                        {portfolio.recommended_innovation.validation_path
                          .timeline ?? '—'}
                      </p>
                    </div>
                  )}
                  {portfolio.recommended_innovation.validation_path
                    .go_no_go && (
                    <div>
                      <span className="text-sm text-zinc-500">Go/No-Go:</span>
                      <p className="text-zinc-700 dark:text-zinc-200">
                        {
                          portfolio.recommended_innovation.validation_path
                            .go_no_go
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Parallel Investigations */}
        {portfolio.parallel_investigations &&
          portfolio.parallel_investigations.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  Parallel investigations
                </span>
                <span className="badge-pill badge-pill--sm badge-pill--accent">
                  {portfolio.parallel_investigations.length}
                </span>
              </div>
              <div className="space-y-4">
                {portfolio.parallel_investigations.map((inv, idx) => (
                  <div
                    key={inv.id ?? `investigation-${idx}-${inv.title ?? ''}`}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-zinc-900 dark:text-white">
                          {inv.title}
                        </h5>
                      </div>
                      <InnovationTypeBadge
                        innovationType={inv.innovation_type}
                      />
                    </div>
                    {inv.one_liner && (
                      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-300">
                        {inv.one_liner}
                      </p>
                    )}
                    {inv.what_it_is && (
                      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-300">
                        <span className="font-medium">What it is: </span>
                        {inv.what_it_is}
                      </p>
                    )}
                    {inv.why_it_works && (
                      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="font-medium">Why it works: </span>
                        {inv.why_it_works}
                      </p>
                    )}
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      {inv.ceiling && (
                        <div>
                          <span className="text-sm text-zinc-500">
                            Ceiling:
                          </span>
                          <p className="text-green-700 dark:text-green-400">
                            {inv.ceiling}
                          </p>
                        </div>
                      )}
                      {inv.key_uncertainty && (
                        <div>
                          <span className="text-sm text-zinc-500">
                            Key uncertainty:
                          </span>
                          <p className="text-amber-700 dark:text-amber-400">
                            {inv.key_uncertainty}
                          </p>
                        </div>
                      )}
                    </div>
                    {inv.investment_recommendation && (
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        Recommendation: {inv.investment_recommendation}
                      </p>
                    )}
                    {inv.when_to_elevate && (
                      <div className="mt-3 rounded border-l-4 border-l-zinc-400 bg-zinc-50 p-2 text-xs text-zinc-700 dark:border-l-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                        <strong>When to elevate: </strong>
                        {inv.when_to_elevate}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </section>
  );
});

// ============================================
// Problem Analysis Section
// ============================================

const ProblemAnalysisSection = memo(function ProblemAnalysisSection({
  analysis,
}: {
  analysis?: ProblemAnalysis;
}) {
  if (!analysis) return null;

  return (
    <section id="problem-analysis">
      <SectionHeader
        title="Problem Analysis"
        subtitle="Understanding the landscape"
      />
      <div className="space-y-8">
        {/* 1. What's Wrong */}
        {analysis.whats_wrong?.prose && (
          <CardWithHeader icon={AlertTriangle} label="What's Wrong">
            <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-200">
              {analysis.whats_wrong.prose}
            </p>
          </CardWithHeader>
        )}

        {/* 2. Why It's Hard */}
        {analysis.why_its_hard && (
          <CardWithHeader icon={AlertTriangle} label="Why It's Hard">
            <div className="space-y-6">
              {analysis.why_its_hard.prose && (
                <p className="text-base leading-relaxed text-zinc-700">
                  {analysis.why_its_hard.prose}
                </p>
              )}
              {analysis.why_its_hard.governing_equation && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <MonoLabel>Governing equation</MonoLabel>
                  <p className="mt-2 font-mono text-sm text-zinc-900">
                    {analysis.why_its_hard.governing_equation.equation}
                  </p>
                  {analysis.why_its_hard.governing_equation.explanation && (
                    <p className="mt-2 text-sm text-zinc-600">
                      {analysis.why_its_hard.governing_equation.explanation}
                    </p>
                  )}
                </div>
              )}
              {analysis.why_its_hard.factors &&
                analysis.why_its_hard.factors.length > 0 && (
                  <div className="space-y-2">
                    {analysis.why_its_hard.factors.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-zinc-900">
                            {f.factor}
                          </p>
                          {f.explanation && (
                            <p className="mt-1 text-sm text-zinc-600">
                              {f.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </CardWithHeader>
        )}

        {/* 3. First Principles Insight */}
        {analysis.first_principles_insight && (
          <DarkSection label="First Principles Insight">
            <p className="text-xl leading-relaxed font-medium text-white">
              {analysis.first_principles_insight.headline}
            </p>
            {analysis.first_principles_insight.explanation && (
              <p className="mt-4 text-base leading-relaxed text-zinc-200">
                {analysis.first_principles_insight.explanation}
              </p>
            )}
          </DarkSection>
        )}

        {/* 4. What Industry Does Today */}
        {analysis.what_industry_does_today &&
          analysis.what_industry_does_today.length > 0 && (
            <CardWithHeader icon={Users} label="What Industry Does Today">
              <div className="space-y-3">
                {analysis.what_industry_does_today.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-zinc-200 p-4"
                  >
                    <p className="font-medium text-zinc-900">{item.approach}</p>
                    {item.limitation && (
                      <p className="mt-1 text-sm text-orange-700">
                        Limitation: {item.limitation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardWithHeader>
          )}

        {/* 5. Current State of the Art - Benchmarks Table */}
        {analysis.current_state_of_art?.benchmarks &&
          analysis.current_state_of_art.benchmarks.length > 0 && (
            <CardWithHeader icon={Target} label="Current State of the Art">
              <AuraTable
                headers={[
                  'Entity',
                  'Approach',
                  'Current Performance',
                  'Target/Roadmap',
                  'Source',
                ]}
              >
                {analysis.current_state_of_art.benchmarks.map((b, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                      {b.entity}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700">
                      {b.approach}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700">
                      {b.current_performance}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700">
                      {b.target_roadmap}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {b.source}
                    </td>
                  </tr>
                ))}
              </AuraTable>
              {analysis.current_state_of_art.no_competitors_note && (
                <p className="mt-4 text-sm text-zinc-500 italic">
                  {analysis.current_state_of_art.no_competitors_note}
                </p>
              )}
            </CardWithHeader>
          )}

        {/* Root Cause Hypotheses */}
        {analysis.root_cause_hypotheses &&
          analysis.root_cause_hypotheses.length > 0 && (
            <CardWithHeader icon={Brain} label="Root Cause Hypotheses">
              <div className="space-y-4">
                {analysis.root_cause_hypotheses.map((hypothesis, idx) => (
                  <div
                    key={
                      hypothesis.id ??
                      `hypothesis-${idx}-${hypothesis.name ?? hypothesis.hypothesis ?? ''}`
                    }
                    className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {hypothesis.name ?? hypothesis.hypothesis}
                      </span>
                      {(hypothesis.confidence_percent !== undefined ||
                        hypothesis.confidence) && (
                        <ConfidenceBadge
                          level={
                            hypothesis.confidence_percent !== undefined
                              ? getConfidenceLabel(
                                  hypothesis.confidence_percent,
                                ).toLowerCase()
                              : (hypothesis.confidence?.toLowerCase() ??
                                'medium')
                          }
                        />
                      )}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {hypothesis.explanation ??
                        hypothesis.evidence ??
                        hypothesis.implication}
                    </p>
                  </div>
                ))}
              </div>
            </CardWithHeader>
          )}
      </div>
    </section>
  );
});

// ============================================
// Constraints & Metrics Section
// ============================================

const ConstraintsSection = memo(function ConstraintsSection({
  constraints,
}: {
  constraints?: ConstraintsAndMetrics;
}) {
  if (!constraints) return null;

  return (
    <section id="constraints">
      <SectionHeader
        title="Constraints & Metrics"
        subtitle="Requirements and success criteria"
      />
      <div className="space-y-6">
        {/* Hard Constraints */}
        {constraints.hard_constraints &&
          constraints.hard_constraints.length > 0 && (
            <CardWithHeader icon={Shield} label="Hard Constraints">
              <ul className="space-y-2">
                {constraints.hard_constraints.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    <span className="text-zinc-700">{c}</span>
                  </li>
                ))}
              </ul>
            </CardWithHeader>
          )}

        {/* Soft Constraints */}
        {constraints.soft_constraints &&
          constraints.soft_constraints.length > 0 && (
            <CardWithHeader icon={ListChecks} label="Soft Constraints">
              <ul className="space-y-2">
                {constraints.soft_constraints.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                    <span className="text-zinc-700">{c}</span>
                  </li>
                ))}
              </ul>
            </CardWithHeader>
          )}

        {/* Assumptions */}
        {constraints.assumptions && constraints.assumptions.length > 0 && (
          <CardWithHeader icon={Brain} label="Assumptions">
            <ul className="space-y-2">
              {constraints.assumptions.map((a, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-zinc-400" />
                  <span className="text-zinc-600">{a}</span>
                </li>
              ))}
            </ul>
          </CardWithHeader>
        )}

        {/* Success Metrics Table */}
        {constraints.success_metrics &&
          constraints.success_metrics.length > 0 && (
            <CardWithHeader icon={Target} label="Success Metrics">
              <AuraTable
                headers={[
                  'Metric',
                  'Target',
                  'Minimum Viable',
                  'Stretch',
                  'Unit',
                ]}
              >
                {constraints.success_metrics.map((m, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                      {m.metric}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-700">
                      {m.target}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700">
                      {m.minimum_viable}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700">
                      {m.stretch}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {m.unit}
                    </td>
                  </tr>
                ))}
              </AuraTable>
            </CardWithHeader>
          )}
      </div>
    </section>
  );
});

// ============================================
// Challenge the Frame Section
// ============================================

const ChallengeTheFrameSection = memo(function ChallengeTheFrameSection({
  challenges,
}: {
  challenges?: ChallengeTheFrame[];
}) {
  if (!challenges || challenges.length === 0) return null;

  return (
    <section id="challenge-the-frame">
      <SectionHeader
        title="Challenge the Frame"
        subtitle="Questioning key assumptions"
      />
      <div className="space-y-4">
        {challenges.map((c, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-6 dark:border-zinc-700 dark:bg-zinc-800/30"
          >
            <div className="mb-3">
              <MonoLabel>Assumption</MonoLabel>
              <p className="mt-1 font-medium text-zinc-900">{c.assumption}</p>
            </div>
            <div className="mb-3">
              <MonoLabel>Challenge</MonoLabel>
              <p className="mt-1 text-zinc-700">{c.challenge}</p>
            </div>
            {c.implication && (
              <div className="rounded-lg border border-amber-200 bg-white/50 p-3">
                <MonoLabel>Implication</MonoLabel>
                <p className="mt-1 text-sm text-amber-800">{c.implication}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
});

// ============================================
// Risks & Watchouts Section
// ============================================

function RisksSection({ risks }: { risks?: RiskAndWatchout[] }) {
  if (!risks || risks.length === 0) return null;

  return (
    <section id="risks">
      <SectionHeader title="Risks & Watchouts" subtitle="What could go wrong" />
      <div className="space-y-3">
        {risks.map((r, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-zinc-900">{r.risk}</span>
              </div>
              <div className="flex gap-2">
                {r.category && (
                  <span className="badge-tag badge-tag--neutral">
                    {r.category}
                  </span>
                )}
                {r.severity && (
                  <span
                    className={cn(
                      'badge-pill badge-pill--sm',
                      r.severity === 'high'
                        ? 'badge-pill--nogo'
                        : r.severity === 'medium'
                          ? 'badge-pill--warning'
                          : 'badge-pill--neutral',
                    )}
                  >
                    {r.severity}
                  </span>
                )}
              </div>
            </div>
            {r.mitigation && (
              <p className="ml-6 text-sm text-zinc-600">
                <span className="font-medium">Mitigation:</span> {r.mitigation}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================
// Recommendation Section
// ============================================

function RecommendationSection({ content }: { content?: string }) {
  if (!content) return null;

  return (
    <section id="recommendation">
      <SectionHeader
        title="Recommendation"
        subtitle="Personal recommendation from the analysis"
      />
      <DarkSection label="If This Were My Project">
        <div className="prose prose-invert max-w-none">
          {content.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="text-base leading-relaxed text-zinc-100">
              {paragraph}
            </p>
          ))}
        </div>
      </DarkSection>
    </section>
  );
}

// ============================================
// Innovation Analysis Section
// ============================================

function InnovationAnalysisSection({
  analysis,
}: {
  analysis?: InnovationAnalysis;
}) {
  if (!analysis) return null;

  return (
    <section id="innovation-analysis">
      <SectionHeader
        title="Innovation Analysis"
        subtitle="How we approached the search"
      />
      <div className="space-y-6">
        {analysis.reframe && (
          <DarkSection label="The Reframe">
            <p className="text-lg leading-relaxed text-zinc-100">
              {analysis.reframe}
            </p>
          </DarkSection>
        )}
        {analysis.domains_searched && analysis.domains_searched.length > 0 && (
          <CardWithHeader icon={Layers} label="Domains searched">
            <div className="flex flex-wrap gap-2">
              {analysis.domains_searched.map((domain, idx) => (
                <span
                  key={idx}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-700"
                >
                  {domain}
                </span>
              ))}
            </div>
          </CardWithHeader>
        )}
      </div>
    </section>
  );
}

function StrategicIntegrationSection({
  integration,
}: {
  integration?: StrategicIntegration;
}) {
  if (!integration) return null;

  return (
    <section id="strategic-integration">
      <SectionHeader
        title="Strategic Integration"
        subtitle="How to allocate resources across the portfolio"
      />
      <div className="space-y-6">
        {/* Portfolio View */}
        {integration.portfolio_view && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Portfolio View
              </span>
            </div>
            <div className="space-y-3">
              {integration.portfolio_view.execution_track_role && (
                <div className="rounded-lg border border-l-4 border-zinc-200 border-l-green-500 bg-zinc-50 p-3 dark:border-zinc-700 dark:border-l-green-600 dark:bg-zinc-800">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    Execution Track
                  </span>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {integration.portfolio_view.execution_track_role}
                  </p>
                </div>
              )}
              {integration.portfolio_view.innovation_portfolio_role && (
                <div className="rounded-lg border border-l-4 border-zinc-200 border-l-zinc-500 bg-zinc-50 p-3 dark:border-zinc-700 dark:border-l-zinc-400 dark:bg-zinc-800">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Innovation Portfolio
                  </span>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {integration.portfolio_view.innovation_portfolio_role}
                  </p>
                </div>
              )}
              {integration.portfolio_view.combined_strategy && (
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {integration.portfolio_view.combined_strategy}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Resource Allocation */}
        {integration.resource_allocation && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Resource Allocation
              </span>
            </div>
            <div className="mb-4 grid gap-2 sm:grid-cols-4">
              {integration.resource_allocation.execution_track_percent !==
                undefined && (
                <div className="rounded-lg border border-l-4 border-zinc-200 border-l-green-500 bg-zinc-50 p-3 text-center dark:border-zinc-700 dark:border-l-green-600 dark:bg-zinc-800">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {integration.resource_allocation.execution_track_percent}%
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Execution
                  </div>
                </div>
              )}
              {integration.resource_allocation
                .recommended_innovation_percent !== undefined && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center dark:border-zinc-700 dark:bg-zinc-800">
                  <div className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                    {
                      integration.resource_allocation
                        .recommended_innovation_percent
                    }
                    %
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Innovation
                  </div>
                </div>
              )}
              {integration.resource_allocation
                .parallel_investigations_percent !== undefined && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center dark:border-zinc-700 dark:bg-zinc-800">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {
                      integration.resource_allocation
                        .parallel_investigations_percent
                    }
                    %
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Parallel
                  </div>
                </div>
              )}
              {integration.resource_allocation.frontier_watch_percent !==
                undefined && (
                <div className="rounded-lg bg-zinc-100 p-3 text-center dark:bg-zinc-700">
                  <div className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                    {integration.resource_allocation.frontier_watch_percent}%
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Watch
                  </div>
                </div>
              )}
            </div>
            {integration.resource_allocation.rationale && (
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {integration.resource_allocation.rationale}
              </p>
            )}
          </div>
        )}

        {/* Decision Architecture */}
        {integration.decision_architecture?.primary_tradeoff && (
          <div className="rounded-xl border border-l-4 border-zinc-200 border-l-zinc-500 bg-zinc-50/50 p-6 dark:border-zinc-700 dark:border-l-zinc-400 dark:bg-zinc-800/50">
            <div className="mb-4 flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                The Primary Tradeoff
              </span>
            </div>
            {integration.decision_architecture.primary_tradeoff.question && (
              <p className="mb-4 text-base font-medium text-zinc-900 dark:text-white">
                {integration.decision_architecture.primary_tradeoff.question}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {integration.decision_architecture.primary_tradeoff.option_a && (
                <div className="rounded-lg border border-green-200 bg-white p-4 dark:border-green-800 dark:bg-zinc-800">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    {
                      integration.decision_architecture.primary_tradeoff
                        .option_a.condition
                    }
                  </span>
                  <p className="mt-1 font-medium text-zinc-900 dark:text-white">
                    →{' '}
                    {
                      integration.decision_architecture.primary_tradeoff
                        .option_a.path
                    }
                  </p>
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    ✓{' '}
                    {
                      integration.decision_architecture.primary_tradeoff
                        .option_a.what_you_get
                    }
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    ✗{' '}
                    {
                      integration.decision_architecture.primary_tradeoff
                        .option_a.what_you_give_up
                    }
                  </p>
                </div>
              )}
              {integration.decision_architecture.primary_tradeoff.option_b && (
                <div className="rounded-lg border border-violet-200 bg-white p-4 dark:border-violet-800 dark:bg-zinc-800">
                  <span className="text-xs font-medium text-violet-700 dark:text-violet-400">
                    {
                      integration.decision_architecture.primary_tradeoff
                        .option_b.condition
                    }
                  </span>
                  <p className="mt-1 font-medium text-zinc-900 dark:text-white">
                    →{' '}
                    {
                      integration.decision_architecture.primary_tradeoff
                        .option_b.path
                    }
                  </p>
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    ✓{' '}
                    {
                      integration.decision_architecture.primary_tradeoff
                        .option_b.what_you_get
                    }
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    ✗{' '}
                    {
                      integration.decision_architecture.primary_tradeoff
                        .option_b.what_you_give_up
                    }
                  </p>
                </div>
              )}
            </div>
            {integration.decision_architecture.primary_tradeoff
              .if_uncertain && (
              <p className="mt-4 rounded-lg bg-white/60 p-3 text-sm text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200">
                <strong>If uncertain:</strong>{' '}
                {
                  integration.decision_architecture.primary_tradeoff
                    .if_uncertain
                }
              </p>
            )}
          </div>
        )}

        {/* Action Plan */}
        {integration.action_plan && integration.action_plan.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="mb-4 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Action Plan
              </span>
            </div>
            <div className="space-y-4">
              {integration.action_plan.map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="badge-tag badge-tag--accent">
                      {step.timeframe}
                    </span>
                  </div>
                  {step.actions && step.actions.length > 0 && (
                    <ul className="space-y-1">
                      {step.actions.map((action, actionIdx) => (
                        <li
                          key={actionIdx}
                          className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300"
                        >
                          <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-500" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  )}
                  {step.decision_gate && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      Decision gate: {step.decision_gate}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal Recommendation */}
        {integration.personal_recommendation && (
          <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 dark:border-violet-800 dark:from-violet-900/30 dark:to-zinc-900">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Personal Recommendation
              </span>
            </div>
            {integration.personal_recommendation.intro && (
              <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-300">
                {integration.personal_recommendation.intro}
              </p>
            )}
            {integration.personal_recommendation.key_insight && (
              <p className="text-base font-medium text-violet-700 dark:text-violet-400">
                {integration.personal_recommendation.key_insight}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export function HybridReportDisplay({
  reportData,
  useBrandSystem = true,
  showToc = true,
  brief,
  title,
  createdAt,
  hasAppSidebar = true,
  isChatOpen = false,
  showActions = true,
  reportId,
  compactTitle = false,
}: HybridReportDisplayProps) {
  const report = reportData.report;

  if (!report) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">Report data not available</p>
      </div>
    );
  }

  // Use the new brand system styling if requested
  if (useBrandSystem) {
    return (
      <BrandSystemReport
        reportData={report}
        title={title || report.title}
        showToc={showToc && !isChatOpen}
        brief={brief}
        createdAt={createdAt}
        hasAppSidebar={hasAppSidebar}
        isChatOpen={isChatOpen}
        showActions={showActions}
        reportId={reportId}
        compactTitle={compactTitle}
      />
    );
  }

  const { decision_architecture, self_critique } = report;

  // Normalize field names: support both old (solution_concepts/innovation_concepts)
  // and new (execution_track/innovation_portfolio) naming conventions
  const rawReport = report as Record<string, unknown>;

  // Map solution_concepts → execution_track with proper field name normalization
  const rawSolutionConcepts = rawReport.solution_concepts as
    | {
        intro?: string;
        primary?: {
          id?: string;
          title?: string;
          confidence_percent?: number;
          source_type?: string;
          what_it_is?: string;
          why_it_works?: string;
          economics?: {
            expected_outcome?: {
              value?: string;
              basis?: string;
              rationale?: string;
            };
            investment?: { value?: string; basis?: string; rationale?: string };
            timeline?: { value?: string; basis?: string; rationale?: string };
            roi_rationale?: string;
          };
          the_insight?: InsightBlock;
          first_validation_step?: {
            test?: string;
            cost?: string;
            timeline?: string;
            go_criteria?: string;
            no_go_criteria?: string;
            replicates?: number;
          };
          key_risks?: Array<{ risk?: string; mitigation?: string }>;
          coupled_effects?: CoupledEffect[];
          sustainability_flag?: SustainabilityFlag;
          ip_considerations?: IPConsiderations;
        };
        supporting?: Array<{
          id?: string;
          title?: string;
          relationship?: string;
          what_it_is?: string;
          why_it_works?: string;
          when_to_use_instead?: string;
          confidence_percent?: number;
          key_risk?: string;
          economics?: {
            expected_outcome?: string;
            investment?: string;
            timeline?: string;
          };
          the_insight?: InsightBlock;
          sustainability_flag?: SustainabilityFlag;
        }>;
      }
    | undefined;

  const executionTrack: ExecutionTrack | undefined =
    report.execution_track ??
    (rawSolutionConcepts
      ? {
          intro: rawSolutionConcepts.intro,
          primary: rawSolutionConcepts.primary
            ? {
                id: rawSolutionConcepts.primary.id,
                title: rawSolutionConcepts.primary.title,
                confidence: rawSolutionConcepts.primary.confidence_percent,
                source_type: rawSolutionConcepts.primary
                  .source_type as ExecutionTrackPrimary['source_type'],
                what_it_is: rawSolutionConcepts.primary.what_it_is,
                why_it_works: rawSolutionConcepts.primary.why_it_works,
                expected_improvement:
                  rawSolutionConcepts.primary.economics?.expected_outcome
                    ?.value,
                investment:
                  rawSolutionConcepts.primary.economics?.investment?.value,
                timeline:
                  rawSolutionConcepts.primary.economics?.timeline?.value,
                the_insight: rawSolutionConcepts.primary.the_insight,
                validation_gates: rawSolutionConcepts.primary
                  .first_validation_step
                  ? [
                      {
                        test: rawSolutionConcepts.primary.first_validation_step
                          .test,
                        cost: rawSolutionConcepts.primary.first_validation_step
                          .cost,
                        success_criteria:
                          rawSolutionConcepts.primary.first_validation_step
                            .go_criteria,
                      },
                    ]
                  : undefined,
              }
            : undefined,
          supporting_concepts: rawSolutionConcepts.supporting?.map((s) => ({
            id: s.id,
            title: s.title,
            relationship: s.relationship as SupportingConcept['relationship'],
            one_liner: s.key_risk,
            what_it_is: s.what_it_is,
            why_it_works: s.why_it_works,
            when_to_use_instead: s.when_to_use_instead,
            confidence: s.confidence_percent,
          })),
        }
      : undefined);

  // Map innovation_concepts → innovation_portfolio with field name normalization
  const rawInnovationConcepts = rawReport.innovation_concepts as
    | {
        intro?: string;
        recommended?: RecommendedInnovation & { confidence_percent?: number };
        parallel?: Array<
          ParallelInvestigation & { confidence_percent?: number }
        >;
        frontier_watch?: FrontierWatch[];
      }
    | undefined;

  const innovationPortfolio: InnovationPortfolio | undefined =
    report.innovation_portfolio ??
    (rawInnovationConcepts
      ? {
          intro: rawInnovationConcepts.intro,
          recommended_innovation: rawInnovationConcepts.recommended
            ? {
                ...rawInnovationConcepts.recommended,
                confidence:
                  rawInnovationConcepts.recommended.confidence_percent ??
                  rawInnovationConcepts.recommended.confidence,
              }
            : undefined,
          parallel_investigations: rawInnovationConcepts.parallel?.map((p) => ({
            ...p,
            confidence: p.confidence_percent ?? p.confidence,
          })),
          frontier_watch: rawInnovationConcepts.frontier_watch,
        }
      : undefined);

  // Detect if using new Execution Track + Innovation Portfolio framework
  const usesNewFramework = executionTrack || innovationPortfolio;

  return (
    <div className="space-y-12">
      {/* Report Title */}
      {report.title && (
        <header className="border-b border-zinc-200 pb-8 dark:border-zinc-800">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-zinc-900 md:text-4xl lg:text-[2.5rem] dark:text-white">
            {report.title}
          </h1>
        </header>
      )}

      {/* Brief - Original Problem Statement */}
      {report.brief && (
        <section id="brief">
          <SectionHeader
            title="The Brief"
            subtitle="Original problem statement"
          />
          <CardWithHeader icon={FileText} label="Brief">
            <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-200">
              {report.brief}
            </p>
          </CardWithHeader>
        </section>
      )}

      {/* Executive Summary */}
      {report.executive_summary && (
        <section id="executive-summary">
          <SectionHeader title="Executive Summary" subtitle="The bottom line" />
          <CardWithHeader icon={Target} label="Executive Summary">
            {typeof report.executive_summary === 'string' ? (
              <p className="text-xl leading-relaxed font-light text-zinc-950 sm:text-2xl">
                {report.executive_summary}
              </p>
            ) : (
              <div className="space-y-6">
                {/* Narrative lead */}
                {report.executive_summary.narrative_lead && (
                  <p className="text-xl leading-relaxed font-light text-zinc-950 sm:text-2xl">
                    {report.executive_summary.narrative_lead}
                  </p>
                )}
                {/* Core insight */}
                {report.executive_summary.core_insight && (
                  <div className="rounded-r-lg border-l-4 border-zinc-950 bg-zinc-50/50 py-2 pl-8">
                    <MonoLabel>Core Insight</MonoLabel>
                    <p className="mt-3 text-xl leading-relaxed font-medium text-zinc-950">
                      {report.executive_summary.core_insight.headline}
                    </p>
                    {report.executive_summary.core_insight.explanation && (
                      <p className="mt-2 max-w-4xl text-base leading-relaxed font-normal text-zinc-600">
                        {report.executive_summary.core_insight.explanation}
                      </p>
                    )}
                  </div>
                )}
                {/* Viability badge */}
                {report.executive_summary.viability && (
                  <div className="flex items-center gap-3">
                    <MonoLabel>Viability</MonoLabel>
                    <AuraBadge
                      variant={
                        report.executive_summary.viability_label
                          ?.toLowerCase()
                          .includes('high') ||
                        report.executive_summary.viability_label
                          ?.toLowerCase()
                          .includes('achievable')
                          ? 'success'
                          : report.executive_summary.viability_label
                                ?.toLowerCase()
                                .includes('low')
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {report.executive_summary.viability_label ??
                        report.executive_summary.viability}
                    </AuraBadge>
                  </div>
                )}
                {/* Primary recommendation */}
                {report.executive_summary.primary_recommendation && (
                  <div className="rounded-xl border border-l-4 border-zinc-200 border-l-zinc-900 bg-zinc-50/30 p-6 dark:border-zinc-700 dark:border-l-zinc-100 dark:bg-zinc-800/30">
                    <MonoLabel>Primary Recommendation</MonoLabel>
                    <p className="mt-3 text-base leading-relaxed font-medium text-zinc-900 dark:text-white">
                      {report.executive_summary.primary_recommendation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardWithHeader>
        </section>
      )}

      {/* NEW: Honest Assessment */}
      <HonestAssessmentSection assessment={report.honest_assessment} />

      {/* Problem Analysis - from AN5-M output */}
      <ProblemAnalysisSection analysis={report.problem_analysis} />

      {/* Constraints & Metrics */}
      <ConstraintsSection constraints={report.constraints_and_metrics} />

      {/* Challenge the Frame */}
      <ChallengeTheFrameSection challenges={report.challenge_the_frame} />

      {/* Innovation Analysis */}
      <InnovationAnalysisSection analysis={report.innovation_analysis} />

      {/* Problem Restatement */}
      {report.problem_restatement && (
        <section id="problem-restatement">
          <SectionHeader
            title="Problem Restatement"
            subtitle="Reframing the challenge"
          />
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-200">
              {report.problem_restatement}
            </p>
          </div>
        </section>
      )}

      {/* NEW: Cross-Domain Search */}
      <CrossDomainSearchSection search={report.cross_domain_search} />

      {/* NEW: Execution Track (new framework) */}
      <ExecutionTrackSection
        track={executionTrack}
        coupledEffects={rawSolutionConcepts?.primary?.coupled_effects}
        sustainabilityFlag={rawSolutionConcepts?.primary?.sustainability_flag}
        ipConsiderations={rawSolutionConcepts?.primary?.ip_considerations}
      />

      {/* NEW: Innovation Portfolio (new framework) */}
      <InnovationPortfolioSection portfolio={innovationPortfolio} />

      {/* NEW: Frontier Watch as top-level section */}
      <FrontierWatchSection items={innovationPortfolio?.frontier_watch} />

      {/* NEW: Strategic Integration (new framework) */}
      <StrategicIntegrationSection integration={report.strategic_integration} />

      {/* Decision Architecture (legacy framework) */}
      {decision_architecture && !usesNewFramework && (
        <section id="decision-architecture">
          <SectionHeader
            title="Decision Architecture"
            subtitle="Your action plan with fallback strategies"
          />

          <div className="space-y-6">
            {/* Primary Recommendation */}
            {decision_architecture.primary && (
              <RecommendationCard
                recommendation={decision_architecture.primary}
                type="primary"
              />
            )}

            {/* Fallback Strategy */}
            {decision_architecture.fallback && (
              <RecommendationCard
                recommendation={decision_architecture.fallback}
                type="fallback"
              />
            )}

            {/* Parallel Explorations */}
            {decision_architecture.parallel_exploration &&
              decision_architecture.parallel_exploration.length > 0 && (
                <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
                  <div className="mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      Parallel Explorations
                    </h4>
                  </div>
                  <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                    Worth investigating alongside the primary path
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {decision_architecture.parallel_exploration.map(
                      (concept, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <h5 className="font-medium text-zinc-900 dark:text-white">
                              {concept.title}
                            </h5>
                            {concept.merit_score !== undefined && (
                              <span className="badge-score badge-score--high">
                                Merit: {concept.merit_score}/10
                              </span>
                            )}
                          </div>
                          <div className="mb-2">
                            <TrackBadge track={concept.track} />
                          </div>
                          {concept.one_liner && (
                            <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-300">
                              {concept.one_liner}
                            </p>
                          )}
                          {concept.when_to_consider && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              <span className="font-medium">
                                When to consider:
                              </span>{' '}
                              {concept.when_to_consider}
                            </p>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
          </div>
        </section>
      )}

      {/* Key Insights */}
      {report.key_insights && report.key_insights.length > 0 && (
        <section id="key-insights">
          <SectionHeader
            title="Key Insights"
            subtitle="Critical learnings from this analysis"
          />
          <div className="space-y-3">
            {report.key_insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                  {idx + 1}
                </div>
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Next Steps */}
      {report.next_steps && report.next_steps.length > 0 && (
        <section id="next-steps">
          <SectionHeader
            title="Next Steps"
            subtitle="Recommended actions in sequence"
          />
          <div className="space-y-3">
            {report.next_steps.map((step, idx) => (
              <div
                key={idx}
                className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <ChevronRight className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-500" />
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Other Concepts */}
      {report.other_concepts && report.other_concepts.length > 0 && (
        <section id="other-concepts">
          <SectionHeader
            title="Other Concepts Considered"
            subtitle="Lower priority but potentially valuable"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {report.other_concepts.map((concept, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h5 className="font-medium text-zinc-900 dark:text-white">
                    {concept.title}
                  </h5>
                  {concept.merit_score !== undefined && (
                    <span className="badge-score badge-score--high">
                      Merit: {concept.merit_score}/10
                    </span>
                  )}
                </div>
                <div className="mb-2">
                  <TrackBadge track={concept.track} />
                </div>
                {concept.one_liner && (
                  <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {concept.one_liner}
                  </p>
                )}
                {concept.when_to_consider && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="font-medium">When to consider:</span>{' '}
                    {concept.when_to_consider}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Self-Critique */}
      {self_critique && (
        <section id="self-critique">
          <SectionHeader
            title="Self-Critique"
            subtitle="Honest assessment of this analysis"
          />
          <div className="space-y-4">
            {/* Confidence - v4.0 uses overall_confidence, fallback to confidence_level */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Overall Confidence
              </span>
              <ConfidenceBadge
                level={
                  self_critique.overall_confidence ??
                  self_critique.confidence_level
                }
              />
            </div>

            {self_critique.confidence_rationale && (
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
                {self_critique.confidence_rationale}
              </p>
            )}

            {/* What We Might Be Wrong About */}
            {self_critique.what_we_might_be_wrong_about &&
              self_critique.what_we_might_be_wrong_about.length > 0 && (
                <div className="mb-4">
                  <h5 className="mb-2 text-sm font-medium text-zinc-900 dark:text-white">
                    What We Might Be Wrong About
                  </h5>
                  <ul className="space-y-2">
                    {self_critique.what_we_might_be_wrong_about.map(
                      (item, idx) => (
                        <li
                          key={idx}
                          className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-300"
                        >
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
                          {item}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

            {/* Unexplored Directions */}
            {self_critique.unexplored_directions &&
              self_critique.unexplored_directions.length > 0 && (
                <div>
                  <h5 className="mb-2 text-sm font-medium text-zinc-900 dark:text-white">
                    Unexplored Directions
                  </h5>
                  <ul className="space-y-2">
                    {self_critique.unexplored_directions.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-300"
                      >
                        <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Validation Gaps */}
            {self_critique.validation_gaps &&
              self_critique.validation_gaps.length > 0 && (
                <div className="mt-4">
                  <h5 className="mb-2 text-sm font-medium text-zinc-900 dark:text-white">
                    Validation Gaps
                  </h5>
                  <div className="space-y-2">
                    {self_critique.validation_gaps.map((gap, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-900 dark:text-white">
                            {gap.concern}
                          </span>
                          <span
                            className={cn(
                              'badge-pill badge-pill--sm',
                              gap.status === 'ADDRESSED' && 'badge-pill--go',
                              gap.status === 'EXTENDED_NEEDED' &&
                                'badge-pill--warning',
                              gap.status === 'ACCEPTED_RISK' &&
                                'badge-pill--nogo',
                            )}
                          >
                            {gap.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">
                          {gap.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </section>
      )}

      {/* Risks & Watchouts */}
      <RisksSection risks={report.risks_and_watchouts} />

      {/* Recommendation */}
      <RecommendationSection content={report.what_id_actually_do} />
    </div>
  );
}
