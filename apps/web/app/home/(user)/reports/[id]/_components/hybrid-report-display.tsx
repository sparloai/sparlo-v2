'use client';

import {
  AlertTriangle,
  ArrowRight,
  Beaker,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  DollarSign,
  Eye,
  FileText,
  Gauge,
  GitBranch,
  Layers,
  Lightbulb,
  ListChecks,
  MessageSquare,
  PieChart,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { cn } from '@kit/ui/utils';

// ============================================
// NEW: Execution Track + Innovation Portfolio Types
// ============================================

interface WhereWeFoundIt {
  domain?: string;
  how_they_use_it?: string;
  why_it_transfers?: string;
}

interface InsightBlock {
  what?: string;
  where_we_found_it?: WhereWeFoundIt;
  why_industry_missed_it?: string;
  physics?: string;
}

interface ValidationGate {
  week?: string;
  test?: string;
  method?: string;
  success_criteria?: string;
  cost?: string;
  decision_point?: string;
}

interface ExecutionTrackPrimary {
  id?: string;
  title?: string;
  score?: number;
  confidence?: number;
  source_type?: 'CATALOG' | 'TRANSFER' | 'OPTIMIZATION' | 'FIRST_PRINCIPLES';
  source?: string;
  bottom_line?: string;
  expected_improvement?: string;
  timeline?: string;
  investment?: string;
  why_safe?: {
    track_record?: string;
    precedent?: string[];
    failure_modes_understood?: boolean;
  };
  the_insight?: InsightBlock;
  what_it_is?: string;
  why_it_works?: string;
  why_it_might_fail?: string[];
  validation_gates?: ValidationGate[];
}

interface SupportingConcept {
  id?: string;
  title?: string;
  relationship?: 'COMPLEMENTARY' | 'FALLBACK' | 'PREREQUISITE';
  one_liner?: string;
  confidence?: number;
  validation_summary?: string;
}

interface ExecutionTrack {
  intro?: string;
  primary?: ExecutionTrackPrimary;
  supplier_arbitrage?: {
    who_to_call?: string;
    what_to_ask?: string[];
    what_to_push_back_on?: string[];
    what_they_wont_volunteer?: string[];
    how_to_verify?: string[];
    competitor_alternative?: string;
  };
  why_not_obvious?: {
    industry_gap?: string;
    knowledge_barrier?: string;
    our_contribution?: string;
  };
  supporting_concepts?: SupportingConcept[];
  fallback_trigger?: {
    conditions?: string[];
    pivot_to?: string;
    sunk_cost_limit?: string;
  };
}

interface RecommendedInnovation {
  id?: string;
  title?: string;
  score?: number;
  confidence?: number;
  selection_rationale?: {
    why_this_one?: string;
    ceiling_if_works?: string;
    vs_execution_track?: string;
  };
  innovation_type?: string;
  source_domain?: string;
  the_insight?: InsightBlock;
  how_it_works?: string[];
  breakthrough_potential?: {
    if_it_works?: string;
    estimated_improvement?: string;
    industry_impact?: string;
  };
  risks?: {
    physics_risks?: string[];
    implementation_challenges?: string[];
    mitigation?: string[];
  };
  validation_path?: {
    gating_question?: string;
    first_test?: string;
    cost?: string;
    timeline?: string;
    go_no_go?: string;
  };
  relationship_to_execution_track?: {
    run_in_parallel?: boolean;
    when_to_elevate?: string;
    complementary?: boolean;
  };
}

interface ParallelInvestigation {
  id?: string;
  title?: string;
  score?: number;
  confidence?: number;
  innovation_type?: string;
  source_domain?: string;
  one_liner?: string;
  the_insight?: InsightBlock;
  ceiling?: string;
  key_uncertainty?: string;
  validation_approach?: {
    test?: string;
    cost?: string;
    timeline?: string;
    go_no_go?: string;
  };
  when_to_elevate?: string;
  investment_recommendation?: string;
}

interface FrontierWatch {
  id?: string;
  title?: string;
  one_liner?: string;
  innovation_type?: string;
  source_domain?: string;
  why_interesting?: string;
  why_not_now?: string;
  trigger_to_revisit?: string;
  who_to_monitor?: string;
  earliest_viability?: string;
}

interface InnovationPortfolio {
  intro?: string;
  recommended_innovation?: RecommendedInnovation;
  parallel_investigations?: ParallelInvestigation[];
  frontier_watch?: FrontierWatch[];
}

interface HonestAssessment {
  problem_type?: string;
  expected_value_range?: {
    floor?: string;
    ceiling?: string;
    most_likely?: string;
  };
  candid_assessment?: string;
  if_value_is_limited?: string;
}

interface CrossDomainSearch {
  enhanced_challenge_frame?: {
    reframing?: string;
    search_queries?: string[];
  };
  domains_searched?: Array<{
    domain?: string;
    mechanism_found?: string;
    relevance?: string;
  }>;
  from_scratch_revelations?: Array<{
    discovery?: string;
    source?: string;
    implication?: string;
  }>;
}

interface StrategicIntegration {
  portfolio_view?: {
    execution_track_role?: string;
    innovation_portfolio_role?: string;
    combined_strategy?: string;
  };
  resource_allocation?: {
    execution_track_percent?: number;
    recommended_innovation_percent?: number;
    parallel_investigations_percent?: number;
    frontier_watch_percent?: number;
    rationale?: string;
  };
  decision_architecture?: {
    primary_tradeoff?: {
      question?: string;
      option_a?: {
        condition?: string;
        path?: string;
        what_you_get?: string;
        what_you_give_up?: string;
      };
      option_b?: {
        condition?: string;
        path?: string;
        what_you_get?: string;
        what_you_give_up?: string;
      };
      if_uncertain?: string;
    };
    flowchart?: string;
    summary?: string;
  };
  action_plan?: Array<{
    timeframe?: string;
    actions?: string[];
    rationale?: string;
    decision_gate?: string;
  }>;
  personal_recommendation?: {
    intro?: string;
    key_insight?: string;
  };
}

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

// Structured executive summary format (new)
interface StructuredExecutiveSummary {
  narrative_lead?: string;
  viability?: string;
  viability_label?: string;
  the_problem?: string;
  core_insight?: {
    headline?: string;
    explanation?: string;
  };
  primary_recommendation?: string;
  recommended_path?: Array<{
    step?: number;
    action?: string;
    rationale?: string;
  }>;
}

interface HybridReportDisplayProps {
  reportData: {
    mode: 'hybrid';
    report?: {
      executive_summary?: string | StructuredExecutiveSummary;
      problem_restatement?: string;
      key_insights?: string[];
      next_steps?: string[];
      decision_architecture?: {
        primary?: ConceptRecommendation;
        fallback?: ConceptRecommendation;
        parallel_exploration?: ParallelConcept[];
      };
      other_concepts?: ParallelConcept[];
      self_critique?: {
        confidence_level?: string;
        confidence_rationale?: string;
        what_we_might_be_wrong_about?: string[];
        unexplored_directions?: string[];
      };
      // NEW: Execution Track + Innovation Portfolio Framework
      honest_assessment?: HonestAssessment;
      cross_domain_search?: CrossDomainSearch;
      execution_track?: ExecutionTrack;
      innovation_portfolio?: InnovationPortfolio;
      strategic_integration?: StrategicIntegration;
    };
  };
}

interface ConceptRecommendation {
  id?: string;
  title?: string;
  track?: string;
  executive_summary?: string;
  why_it_wins?: string;
  confidence_level?: string;
  estimated_timeline?: string;
  estimated_investment?: string;
  how_to_test?: TestStep[];
  key_risks?: Risk[];
  prior_art_summary?: PriorArt[];
}

interface TestStep {
  name?: string;
  description?: string;
  success_criteria?: string;
  estimated_time?: string;
  estimated_cost?: string;
}

interface Risk {
  risk?: string;
  likelihood?: string;
  impact?: string;
  mitigation?: string;
}

interface PriorArt {
  source?: string;
  relevance?: string;
  what_it_proves?: string;
}

interface ParallelConcept {
  id?: string;
  title?: string;
  track?: string;
  one_liner?: string;
  merit_score?: number;
  when_to_consider?: string;
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/30">
        <Icon className="h-5 w-5 text-violet-700 dark:text-violet-400" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function TrackBadge({ track }: { track?: string }) {
  const trackConfig: Record<string, { label: string; className: string }> = {
    simpler_path: {
      label: 'Simpler Path',
      className:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
    best_fit: {
      label: 'Best Fit',
      className:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    },
    paradigm_shift: {
      label: 'Paradigm Shift',
      className:
        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    },
    frontier_transfer: {
      label: 'Frontier Transfer',
      className:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    },
  };

  const config = track ? trackConfig[track] : null;
  if (!config) return null;

  return (
    <Badge variant="secondary" className={cn('text-xs', config.className)}>
      {config.label}
    </Badge>
  );
}

function ConfidenceBadge({ level }: { level?: string }) {
  const levelConfig: Record<string, { className: string }> = {
    high: {
      className:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
    medium: {
      className:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    low: {
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    },
  };

  const config = level ? levelConfig[level] : levelConfig.medium;

  return (
    <Badge
      variant="secondary"
      className={cn('text-xs capitalize', config?.className)}
    >
      {level || 'Medium'} Confidence
    </Badge>
  );
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
          ? 'border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-900/20'
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
                'text-xs font-medium tracking-wider uppercase',
                isPrimary
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-zinc-500 dark:text-zinc-400',
              )}
            >
              {isPrimary ? 'Primary Recommendation' : 'Fallback Strategy'}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {recommendation.title}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
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
              Why This Wins
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
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
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
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
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
              Validation Steps
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
              Key Risks
            </span>
          </div>
          <div className="space-y-2">
            {recommendation.key_risks.map((risk, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-900/20"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {risk.risk}
                  </span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {risk.likelihood} likelihood / {risk.impact} impact
                  </Badge>
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
                Prior Art
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
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
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

function SourceTypeBadge({ sourceType }: { sourceType?: string }) {
  const config: Record<string, { label: string; className: string }> = {
    CATALOG: {
      label: 'Catalog Solution',
      className:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    },
    TRANSFER: {
      label: 'Cross-Domain Transfer',
      className:
        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    },
    OPTIMIZATION: {
      label: 'Optimization',
      className:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
    FIRST_PRINCIPLES: {
      label: 'First Principles',
      className:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    },
  };

  const typeConfig = sourceType ? config[sourceType] : null;
  if (!typeConfig) return null;

  return (
    <Badge variant="secondary" className={cn('text-xs', typeConfig.className)}>
      {typeConfig.label}
    </Badge>
  );
}

function InnovationTypeBadge({ innovationType }: { innovationType?: string }) {
  const config: Record<string, { label: string; className: string }> = {
    PARADIGM_SHIFT: {
      label: 'Paradigm Shift',
      className:
        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    },
    CROSS_DOMAIN_TRANSFER: {
      label: 'Cross-Domain',
      className:
        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    },
    TECHNOLOGY_REVIVAL: {
      label: 'Tech Revival',
      className:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    },
    FIRST_PRINCIPLES: {
      label: 'First Principles',
      className:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    },
  };

  const typeConfig = innovationType ? config[innovationType] : null;
  if (!typeConfig) return null;

  return (
    <Badge variant="secondary" className={cn('text-xs', typeConfig.className)}>
      {typeConfig.label}
    </Badge>
  );
}

function InsightBlockDisplay({ insight }: { insight?: InsightBlock }) {
  if (!insight) return null;

  return (
    <div className="space-y-3 rounded-lg border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-800 dark:bg-violet-900/20">
      <div className="flex items-start gap-2">
        <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-600 dark:text-violet-400" />
        <div>
          <span className="text-xs font-medium tracking-wider text-violet-600 uppercase dark:text-violet-400">
            The Insight
          </span>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
            {insight.what}
          </p>
        </div>
      </div>

      {insight.where_we_found_it && (
        <div className="ml-6 rounded-lg bg-white/60 p-3 dark:bg-zinc-800/60">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Where We Found It
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
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Why Industry Missed It
          </span>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {insight.why_industry_missed_it}
          </p>
        </div>
      )}

      {insight.physics && (
        <div className="ml-6">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            The Physics
          </span>
          <p className="text-sm font-mono text-zinc-600 dark:text-zinc-300">
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
        icon={Gauge}
        title="Honest Assessment"
        subtitle="What we're actually delivering"
      />
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-800/50 dark:bg-amber-900/20">
        {assessment.problem_type && (
          <div className="mb-4">
            <Badge variant="outline" className="text-sm capitalize">
              {assessment.problem_type.replace(/_/g, ' ')}
            </Badge>
          </div>
        )}

        {assessment.expected_value_range && (
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-white/60 p-3 dark:bg-zinc-800/60">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Floor
              </span>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {assessment.expected_value_range.floor}
              </p>
            </div>
            <div className="rounded-lg bg-white/60 p-3 dark:bg-zinc-800/60">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Most Likely
              </span>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                {assessment.expected_value_range.most_likely}
              </p>
            </div>
            <div className="rounded-lg bg-white/60 p-3 dark:bg-zinc-800/60">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Ceiling
              </span>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {assessment.expected_value_range.ceiling}
              </p>
            </div>
          </div>
        )}

        {assessment.candid_assessment && (
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
            {assessment.candid_assessment}
          </p>
        )}

        {assessment.if_value_is_limited && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-white/60 p-3 dark:border-amber-700 dark:bg-zinc-800/60">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              What Would Need to Change
            </span>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {assessment.if_value_is_limited}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function CrossDomainSearchSection({ search }: { search?: CrossDomainSearch }) {
  if (!search) return null;

  return (
    <section id="cross-domain-search">
      <SectionHeader
        icon={Search}
        title="Cross-Domain Search"
        subtitle="Where we looked and what we found"
      />
      <div className="space-y-4">
        {search.enhanced_challenge_frame && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="mb-3 flex items-center gap-2">
              <Compass className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Problem Reframing
              </span>
            </div>
            <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
              {search.enhanced_challenge_frame.reframing}
            </p>
            {search.enhanced_challenge_frame.search_queries &&
              search.enhanced_challenge_frame.search_queries.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {search.enhanced_challenge_frame.search_queries.map(
                    (query, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs"
                      >
                        {query}
                      </Badge>
                    ),
                  )}
                </div>
              )}
          </div>
        )}

        {search.domains_searched && search.domains_searched.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Domains Searched
              </span>
            </div>
            <div className="space-y-3">
              {search.domains_searched.map((domain, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
                >
                  <div className="font-medium text-zinc-900 dark:text-white">
                    {domain.domain}
                  </div>
                  {domain.mechanism_found && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      {domain.mechanism_found}
                    </p>
                  )}
                  {domain.relevance && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      → {domain.relevance}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {search.from_scratch_revelations &&
          search.from_scratch_revelations.length > 0 && (
            <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-6 dark:border-violet-800 dark:bg-violet-900/20">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  Revelations from Our Search
                </span>
              </div>
              <div className="space-y-3">
                {search.from_scratch_revelations.map((rev, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-white/60 p-3 dark:bg-zinc-800/60"
                  >
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {rev.discovery}
                    </p>
                    {rev.source && (
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Source: {rev.source}
                      </p>
                    )}
                    {rev.implication && (
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        → {rev.implication}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </section>
  );
}

function ExecutionTrackSection({ track }: { track?: ExecutionTrack }) {
  if (!track) return null;

  return (
    <section id="execution-track">
      <SectionHeader
        icon={Target}
        title="Execution Track"
        subtitle="Your primary recommendation - the safe bet"
      />
      <div className="space-y-6">
        {track.intro && (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {track.intro}
          </p>
        )}

        {/* Primary Recommendation */}
        {track.primary && (
          <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-6 dark:border-green-800 dark:from-green-900/30 dark:to-zinc-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium tracking-wider text-green-600 uppercase dark:text-green-400">
                    Primary Recommendation
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {track.primary.title}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <SourceTypeBadge sourceType={track.primary.source_type} />
                {track.primary.confidence !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    {track.primary.confidence}% confidence
                  </Badge>
                )}
              </div>
            </div>

            {track.primary.bottom_line && (
              <p className="mb-4 text-base font-medium text-zinc-700 dark:text-zinc-200">
                {track.primary.bottom_line}
              </p>
            )}

            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              {track.primary.expected_improvement && (
                <div className="rounded-lg bg-white/60 p-3 dark:bg-zinc-800/60">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Expected Improvement
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
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
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
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
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
                      Validation Gates
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
                            <span className="text-xs text-zinc-500">
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
          </div>
        )}

        {/* Supplier Arbitrage (for CATALOG source type) */}
        {track.supplier_arbitrage && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Supplier Negotiation Guide
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
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      What to Ask
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
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      What to Push Back On
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
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-6 dark:border-purple-800 dark:bg-purple-900/20">
            <div className="mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Why This Wasn&apos;t Obvious
              </span>
            </div>
            <div className="space-y-3">
              {track.why_not_obvious.industry_gap && (
                <div>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Industry Gap
                  </span>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {track.why_not_obvious.industry_gap}
                  </p>
                </div>
              )}
              {track.why_not_obvious.knowledge_barrier && (
                <div>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Knowledge Barrier
                  </span>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {track.why_not_obvious.knowledge_barrier}
                  </p>
                </div>
              )}
              {track.why_not_obvious.our_contribution && (
                <div>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Our Contribution
                  </span>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
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
                Supporting Concepts
              </span>
            </div>
            <div className="space-y-3">
              {track.supporting_concepts.map((concept, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-medium text-zinc-900 dark:text-white">
                      {concept.title}
                    </h5>
                    <Badge variant="outline" className="text-xs capitalize">
                      {concept.relationship?.toLowerCase()}
                    </Badge>
                  </div>
                  {concept.one_liner && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      {concept.one_liner}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fallback Trigger */}
        {track.fallback_trigger && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                When to Pivot
              </span>
            </div>
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
              <p className="text-sm text-amber-700 dark:text-amber-400">
                → Pivot to: {track.fallback_trigger.pivot_to}
              </p>
            )}
            {track.fallback_trigger.sunk_cost_limit && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Sunk cost limit: {track.fallback_trigger.sunk_cost_limit}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function InnovationPortfolioSection({
  portfolio,
}: {
  portfolio?: InnovationPortfolio;
}) {
  if (!portfolio) return null;

  return (
    <section id="innovation-portfolio">
      <SectionHeader
        icon={Rocket}
        title="Innovation Portfolio"
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
          <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 dark:border-violet-800 dark:from-violet-900/30 dark:to-zinc-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs font-medium tracking-wider text-violet-600 uppercase dark:text-violet-400">
                    Recommended Innovation
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
                  <Badge variant="outline" className="text-xs">
                    {portfolio.recommended_innovation.confidence}% confidence
                  </Badge>
                )}
              </div>
            </div>

            {portfolio.recommended_innovation.selection_rationale && (
              <div className="mb-4 rounded-lg bg-white/60 p-4 dark:bg-zinc-800/60">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Why This One
                </span>
                <p className="text-sm text-zinc-700 dark:text-zinc-200">
                  {portfolio.recommended_innovation.selection_rationale.why_this_one}
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

            {portfolio.recommended_innovation.breakthrough_potential && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    Breakthrough Potential
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {portfolio.recommended_innovation.breakthrough_potential.if_it_works}
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
                    Validation Path
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
                  <div>
                    <span className="text-xs text-zinc-500">First Test:</span>
                    <p className="text-zinc-700 dark:text-zinc-200">
                      {
                        portfolio.recommended_innovation.validation_path
                          .first_test
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500">Cost/Timeline:</span>
                    <p className="text-zinc-700 dark:text-zinc-200">
                      {portfolio.recommended_innovation.validation_path.cost} /{' '}
                      {portfolio.recommended_innovation.validation_path.timeline}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500">Go/No-Go:</span>
                    <p className="text-zinc-700 dark:text-zinc-200">
                      {portfolio.recommended_innovation.validation_path.go_no_go}
                    </p>
                  </div>
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
                  Parallel Investigations
                </span>
                <Badge variant="secondary" className="text-xs">
                  {portfolio.parallel_investigations.length}
                </Badge>
              </div>
              <div className="space-y-4">
                {portfolio.parallel_investigations.map((inv, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h5 className="font-medium text-zinc-900 dark:text-white">
                        {inv.title}
                      </h5>
                      <InnovationTypeBadge innovationType={inv.innovation_type} />
                    </div>
                    {inv.one_liner && (
                      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-300">
                        {inv.one_liner}
                      </p>
                    )}
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      {inv.ceiling && (
                        <div>
                          <span className="text-xs text-zinc-500">Ceiling:</span>
                          <p className="text-green-700 dark:text-green-400">
                            {inv.ceiling}
                          </p>
                        </div>
                      )}
                      {inv.key_uncertainty && (
                        <div>
                          <span className="text-xs text-zinc-500">
                            Key Uncertainty:
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
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Frontier Watch */}
        {portfolio.frontier_watch && portfolio.frontier_watch.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Frontier Watch
              </span>
              <Badge variant="outline" className="text-xs">
                Monitor Only
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {portfolio.frontier_watch.map((fw, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h5 className="font-medium text-zinc-900 dark:text-white">
                      {fw.title}
                    </h5>
                    <InnovationTypeBadge innovationType={fw.innovation_type} />
                  </div>
                  {fw.one_liner && (
                    <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {fw.one_liner}
                    </p>
                  )}
                  {fw.why_not_now && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Why not now: {fw.why_not_now}
                    </p>
                  )}
                  {fw.earliest_viability && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Earliest viability: {fw.earliest_viability}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
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
        icon={PieChart}
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
                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    Execution Track
                  </span>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {integration.portfolio_view.execution_track_role}
                  </p>
                </div>
              )}
              {integration.portfolio_view.innovation_portfolio_role && (
                <div className="rounded-lg bg-violet-50 p-3 dark:bg-violet-900/20">
                  <span className="text-xs font-medium text-violet-700 dark:text-violet-400">
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
                <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-900/20">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {integration.resource_allocation.execution_track_percent}%
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Execution
                  </div>
                </div>
              )}
              {integration.resource_allocation.recommended_innovation_percent !==
                undefined && (
                <div className="rounded-lg bg-violet-50 p-3 text-center dark:bg-violet-900/20">
                  <div className="text-2xl font-bold text-violet-700 dark:text-violet-400">
                    {
                      integration.resource_allocation
                        .recommended_innovation_percent
                    }
                    %
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Innovation
                  </div>
                </div>
              )}
              {integration.resource_allocation.parallel_investigations_percent !==
                undefined && (
                <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-900/20">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {
                      integration.resource_allocation
                        .parallel_investigations_percent
                    }
                    %
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
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
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
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
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-800/50 dark:bg-amber-900/20">
            <div className="mb-4 flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-amber-600 dark:text-amber-400" />
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
            {integration.decision_architecture.primary_tradeoff.if_uncertain && (
              <p className="mt-4 rounded-lg bg-white/60 p-3 text-sm text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200">
                <strong>If uncertain:</strong>{' '}
                {integration.decision_architecture.primary_tradeoff.if_uncertain}
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
                    <Badge variant="outline" className="text-xs">
                      {step.timeframe}
                    </Badge>
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

export function HybridReportDisplay({ reportData }: HybridReportDisplayProps) {
  const report = reportData.report;

  if (!report) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">Report data not available</p>
      </div>
    );
  }

  const { decision_architecture, self_critique } = report;

  // Detect if using new Execution Track + Innovation Portfolio framework
  const usesNewFramework =
    report.execution_track || report.innovation_portfolio;

  return (
    <div className="space-y-12">
      {/* Executive Summary */}
      {report.executive_summary && (
        <section id="executive-summary">
          <SectionHeader
            icon={Sparkles}
            title="Executive Summary"
            subtitle="The bottom line"
          />
          <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 dark:border-violet-800 dark:from-violet-900/30 dark:to-zinc-900">
            {typeof report.executive_summary === 'string' ? (
              <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-200">
                {report.executive_summary}
              </p>
            ) : (
              <div className="space-y-4">
                {/* Narrative lead */}
                {report.executive_summary.narrative_lead && (
                  <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-200">
                    {report.executive_summary.narrative_lead}
                  </p>
                )}
                {/* Core insight */}
                {report.executive_summary.core_insight && (
                  <div className="rounded-lg bg-white/60 p-4 dark:bg-zinc-800/60">
                    <h4 className="mb-2 font-semibold text-zinc-900 dark:text-white">
                      {report.executive_summary.core_insight.headline}
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {report.executive_summary.core_insight.explanation}
                    </p>
                  </div>
                )}
                {/* Primary recommendation */}
                {report.executive_summary.primary_recommendation && (
                  <p className="text-sm font-medium text-violet-700 dark:text-violet-400">
                    {report.executive_summary.primary_recommendation}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* NEW: Honest Assessment */}
      <HonestAssessmentSection assessment={report.honest_assessment} />

      {/* Problem Restatement */}
      {report.problem_restatement && (
        <section id="problem-restatement">
          <SectionHeader
            icon={FileText}
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
      <ExecutionTrackSection track={report.execution_track} />

      {/* NEW: Innovation Portfolio (new framework) */}
      <InnovationPortfolioSection portfolio={report.innovation_portfolio} />

      {/* NEW: Strategic Integration (new framework) */}
      <StrategicIntegrationSection integration={report.strategic_integration} />

      {/* Decision Architecture (legacy framework) */}
      {decision_architecture && !usesNewFramework && (
        <section id="decision-architecture">
          <SectionHeader
            icon={Target}
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
                              <Badge variant="outline" className="text-xs">
                                Merit: {concept.merit_score}/10
                              </Badge>
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
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
            icon={Lightbulb}
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
            icon={ListChecks}
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
            icon={Brain}
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
                    <Badge variant="outline" className="text-xs">
                      Merit: {concept.merit_score}/10
                    </Badge>
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
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
            icon={MessageSquare}
            title="Self-Critique"
            subtitle="Honest assessment of this analysis"
          />
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-800/50 dark:bg-amber-900/20">
            {/* Confidence */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Overall Confidence:
              </span>
              <ConfidenceBadge level={self_critique.confidence_level} />
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
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
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
          </div>
        </section>
      )}
    </div>
  );
}
