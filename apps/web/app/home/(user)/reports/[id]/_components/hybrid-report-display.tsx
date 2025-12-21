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
  DollarSign,
  FileText,
  Lightbulb,
  ListChecks,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { cn } from '@kit/ui/utils';

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

      {/* Decision Architecture */}
      {decision_architecture && (
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
