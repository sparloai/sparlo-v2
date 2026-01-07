/**
 * DD Report Display - Due Diligence Report
 *
 * Renders technical due diligence reports for investor analysis.
 * Uses the same brand system primitives as the hybrid report
 * but with DD-specific sections.
 */

'use client';

import { memo, useMemo } from 'react';

import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Download,
  HelpCircle,
  Loader2,
  MinusCircle,
  Share2,
  Shield,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';

import { cn } from '@kit/ui/utils';

import { useReportActions } from '../../_lib/hooks/use-report-actions';
import { Section, SectionTitle } from './primitives';

// Types for the DD report data structure - using any for flexibility with LLM output
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DDReport = any;

export interface DDReportData {
  mode: 'dd';
  report: DDReport;
  claim_extraction?: unknown;
  problem_framing?: unknown;
  solution_space?: unknown;
  claim_validation?: unknown;
  solution_mapping?: unknown;
}

interface DDReportDisplayProps {
  reportData: DDReportData;
  title?: string;
  brief?: string;
  createdAt?: string;
  showActions?: boolean;
  reportId?: string;
}

// Verdict color mapping with default fallback
const verdictColors: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  COMPELLING: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: 'text-emerald-500',
  },
  PROMISING: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
  MIXED: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' },
  CONCERNING: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    icon: 'text-orange-500',
  },
  PASS: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500' },
};

const defaultVerdictStyle = {
  bg: 'bg-zinc-50',
  text: 'text-zinc-700',
  icon: 'text-zinc-500',
};

const severityColors: Record<string, string> = {
  CRITICAL: 'text-red-600 bg-red-50',
  HIGH: 'text-orange-600 bg-orange-50',
  MEDIUM: 'text-amber-600 bg-amber-50',
  LOW: 'text-zinc-600 bg-zinc-50',
};

const moatColors: Record<string, string> = {
  STRONG: 'text-emerald-600',
  MODERATE: 'text-amber-600',
  WEAK: 'text-red-600',
  NONE: 'text-zinc-400',
};

// Reading time calculation
function calculateReadingTime(report: DDReport): number {
  const WPM = 150;
  const text = JSON.stringify(report);
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / WPM);
}

export const DDReportDisplay = memo(function DDReportDisplay({
  reportData,
  title,
  brief: _brief,
  createdAt,
  showActions = true,
  reportId,
}: DDReportDisplayProps) {
  const report = reportData.report;

  // Share and export functionality
  const { handleShare, handleExport, isExporting } = useReportActions({
    reportId: reportId || '',
    reportTitle: title || report.header.company_name,
  });

  const readingTime = useMemo(() => calculateReadingTime(report), [report]);

  const verdictStyle =
    verdictColors[report.executive_summary?.verdict] ?? defaultVerdictStyle;

  return (
    <article className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-zinc-50 px-8 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Report type badge */}
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium tracking-wide text-white">
              TECHNICAL DUE DILIGENCE
            </span>
            <span className="text-sm text-zinc-500">
              {report.header.technology_domain}
            </span>
          </div>

          {/* Company name */}
          <h1 className="mb-4 text-4xl font-semibold tracking-tight text-zinc-900">
            {report.header.company_name}
          </h1>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <span>{report.header.date}</span>
            <span className="text-zinc-300">·</span>
            <span>{readingTime} min read</span>
            {createdAt && (
              <>
                <span className="text-zinc-300">·</span>
                <span>
                  Generated {new Date(createdAt).toLocaleDateString()}
                </span>
              </>
            )}
          </div>

          {/* Action buttons */}
          {showActions && (
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export PDF
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="px-8 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Executive Summary with Verdict */}
          <Section>
            <div className={cn('mb-8 rounded-xl p-6', verdictStyle.bg)}>
              <div className="mb-4 flex items-center gap-3">
                {report.executive_summary.verdict === 'COMPELLING' && (
                  <CheckCircle className={cn('h-6 w-6', verdictStyle.icon)} />
                )}
                {report.executive_summary.verdict === 'PROMISING' && (
                  <TrendingUp className={cn('h-6 w-6', verdictStyle.icon)} />
                )}
                {report.executive_summary.verdict === 'MIXED' && (
                  <MinusCircle className={cn('h-6 w-6', verdictStyle.icon)} />
                )}
                {report.executive_summary.verdict === 'CONCERNING' && (
                  <AlertTriangle className={cn('h-6 w-6', verdictStyle.icon)} />
                )}
                {report.executive_summary.verdict === 'PASS' && (
                  <XCircle className={cn('h-6 w-6', verdictStyle.icon)} />
                )}
                <span
                  className={cn('text-2xl font-semibold', verdictStyle.text)}
                >
                  {report.executive_summary.verdict}
                </span>
                <span className="text-sm text-zinc-500">
                  ({report.executive_summary.verdict_confidence} confidence)
                </span>
              </div>

              <p className="mb-4 text-lg leading-relaxed text-zinc-700">
                {report.executive_summary.one_paragraph_summary}
              </p>

              <div className="flex items-center gap-4 border-t border-zinc-200/50 pt-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-zinc-600">
                    Tech Credibility:{' '}
                    <strong>
                      {
                        report.executive_summary.technical_credibility_score
                          .score
                      }
                      /
                      {
                        report.executive_summary.technical_credibility_score
                          .out_of
                      }
                    </strong>
                  </span>
                </div>
                <span className="text-zinc-300">·</span>
                <span className="text-sm text-zinc-600">
                  {
                    report.executive_summary.technical_credibility_score
                      .one_line
                  }
                </span>
              </div>
            </div>

            {/* Key Findings */}
            <SectionTitle>Key Findings</SectionTitle>
            <div className="space-y-3">
              {report.executive_summary.key_findings.map(
                (
                  finding: {
                    type: string;
                    finding: string;
                    investment_impact: string;
                  },
                  idx: number,
                ) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4"
                  >
                    <span
                      className={cn(
                        'mt-0.5 shrink-0 rounded px-2 py-0.5 text-xs font-medium',
                        severityColors[finding.investment_impact] ||
                          'bg-zinc-100 text-zinc-600',
                      )}
                    >
                      {finding.type}
                    </span>
                    <p className="text-zinc-700">{finding.finding}</p>
                  </div>
                ),
              )}
            </div>

            {/* Recommendation */}
            <div className="mt-6 rounded-lg border-l-4 border-zinc-900 bg-zinc-50 p-4">
              <div className="mb-2 text-sm font-medium text-zinc-500">
                Recommendation
              </div>
              <div className="text-lg font-semibold text-zinc-900">
                {report.executive_summary.recommendation.action}
              </div>
              <p className="mt-1 text-zinc-600">
                {report.executive_summary.recommendation.rationale}
              </p>
              {report.executive_summary.recommendation.key_condition && (
                <p className="mt-2 text-sm text-zinc-500">
                  <strong>Key condition:</strong>{' '}
                  {report.executive_summary.recommendation.key_condition}
                </p>
              )}
            </div>
          </Section>

          {/* Technical Thesis Assessment */}
          <Section>
            <SectionTitle>Technical Thesis Assessment</SectionTitle>

            <div className="mb-6">
              <h4 className="mb-2 text-sm font-medium text-zinc-500">
                Their Thesis
              </h4>
              <p className="text-lg text-zinc-700">
                {report.technical_thesis_assessment.their_thesis}
              </p>
            </div>

            <div className="mb-6 rounded-lg border border-zinc-200 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-500">
                  Thesis Validity:
                </span>
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-sm font-medium',
                    report.technical_thesis_assessment.thesis_validity
                      .verdict === 'SOUND'
                      ? 'bg-emerald-50 text-emerald-700'
                      : report.technical_thesis_assessment.thesis_validity
                            .verdict === 'PLAUSIBLE'
                        ? 'bg-blue-50 text-blue-700'
                        : report.technical_thesis_assessment.thesis_validity
                              .verdict === 'QUESTIONABLE'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700',
                  )}
                >
                  {report.technical_thesis_assessment.thesis_validity.verdict}
                </span>
                <span className="text-sm text-zinc-400">
                  (
                  {
                    report.technical_thesis_assessment.thesis_validity
                      .confidence
                  }{' '}
                  confidence)
                </span>
              </div>
              <p className="text-zinc-600">
                {report.technical_thesis_assessment.thesis_validity.explanation}
              </p>
            </div>

            {/* Performance Claims */}
            <h4 className="mb-3 text-sm font-medium text-zinc-500">
              Performance Claims
            </h4>
            <div className="overflow-hidden rounded-lg border border-zinc-200">
              <table className="w-full">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                      Claim
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                      Theoretical Limit
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                      Verdict
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {report.technical_thesis_assessment.performance_claims.map(
                    (
                      claim: {
                        claim: string;
                        theoretical_limit: string;
                        verdict: string;
                      },
                      idx: number,
                    ) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-zinc-700">
                          {claim.claim}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-500">
                          {claim.theoretical_limit}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'rounded px-2 py-0.5 text-xs font-medium',
                              claim.verdict === 'VALIDATED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : claim.verdict === 'PLAUSIBLE'
                                  ? 'bg-blue-50 text-blue-700'
                                  : claim.verdict === 'QUESTIONABLE'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-red-50 text-red-700',
                            )}
                          >
                            {claim.verdict}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Solution Space Position */}
          <Section>
            <SectionTitle>Solution Space Position</SectionTitle>

            <p className="mb-6 text-zinc-600">
              {report.solution_space_positioning.solution_landscape_summary}
            </p>

            <div className="mb-6 rounded-lg border border-zinc-200 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-sm font-medium text-zinc-700">
                  {report.solution_space_positioning.startup_position.track}
                </span>
                {report.solution_space_positioning.startup_position
                  .is_optimal_position ? (
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Optimal Position
                  </span>
                ) : (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Suboptimal Position
                  </span>
                )}
              </div>
              <p className="text-zinc-600">
                {report.solution_space_positioning.startup_position.explanation}
              </p>
            </div>

            {/* Alternatives */}
            {report.solution_space_positioning.alternatives_analysis
              .stronger_alternatives_exist && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  Stronger Alternatives Exist
                </h4>
                <div className="space-y-3">
                  {report.solution_space_positioning.alternatives_analysis.alternatives.map(
                    (
                      alt: {
                        approach: string;
                        advantages: string;
                        competitive_threat: string;
                      },
                      idx: number,
                    ) => (
                      <div
                        key={idx}
                        className="border-l-2 border-amber-300 pl-3"
                      >
                        <div className="font-medium text-zinc-800">
                          {alt.approach}
                        </div>
                        <div className="text-sm text-zinc-600">
                          {alt.advantages}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          Competitive threat:{' '}
                          <span
                            className={severityColors[alt.competitive_threat]}
                          >
                            {alt.competitive_threat}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </Section>

          {/* Moat Assessment */}
          <Section>
            <SectionTitle>Moat Assessment</SectionTitle>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 p-4 text-center">
                <Shield
                  className={cn(
                    'mx-auto mb-2 h-8 w-8',
                    moatColors[report.moat_assessment.overall_moat.strength],
                  )}
                />
                <div className="text-lg font-semibold text-zinc-900">
                  {report.moat_assessment.overall_moat.strength}
                </div>
                <div className="text-sm text-zinc-500">Overall Moat</div>
              </div>
              <div className="rounded-lg border border-zinc-200 p-4 text-center">
                <div className="text-2xl font-bold text-zinc-900">
                  {report.moat_assessment.overall_moat.durability_years}
                </div>
                <div className="text-sm text-zinc-500">Years Durability</div>
              </div>
              <div className="rounded-lg border border-zinc-200 p-4 text-center">
                <div className="text-sm font-medium text-zinc-700">
                  {report.moat_assessment.overall_moat.primary_source}
                </div>
                <div className="mt-1 text-sm text-zinc-500">Primary Source</div>
              </div>
            </div>

            {/* Moat Breakdown */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3">
                <span className="text-sm text-zinc-600">
                  Technical Barriers
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    moatColors[
                      report.moat_assessment.moat_breakdown.technical_barriers
                    ],
                  )}
                >
                  {report.moat_assessment.moat_breakdown.technical_barriers}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3">
                <span className="text-sm text-zinc-600">
                  Execution Barriers
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    moatColors[
                      report.moat_assessment.moat_breakdown.execution_barriers
                    ],
                  )}
                >
                  {report.moat_assessment.moat_breakdown.execution_barriers}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3">
                <span className="text-sm text-zinc-600">Market Barriers</span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    moatColors[
                      report.moat_assessment.moat_breakdown.market_barriers
                    ],
                  )}
                >
                  {report.moat_assessment.moat_breakdown.market_barriers}
                </span>
              </div>
            </div>

            {/* Vulnerabilities */}
            {report.moat_assessment.moat_vulnerabilities.length > 0 && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                <h4 className="mb-3 text-sm font-medium text-red-800">
                  Vulnerabilities
                </h4>
                <ul className="space-y-2">
                  {report.moat_assessment.moat_vulnerabilities.map(
                    (
                      vuln: { severity: string; vulnerability: string },
                      idx: number,
                    ) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span
                          className={cn(
                            'mt-0.5 rounded px-1.5 py-0.5 text-xs',
                            severityColors[vuln.severity],
                          )}
                        >
                          {vuln.severity}
                        </span>
                        <span className="text-sm text-zinc-700">
                          {vuln.vulnerability}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            <p className="mt-4 text-zinc-600">
              {report.moat_assessment.defensibility_verdict}
            </p>
          </Section>

          {/* Risk Analysis */}
          <Section>
            <SectionTitle>Risk Analysis</SectionTitle>

            <p className="mb-6 text-zinc-600">
              {report.risk_analysis.key_risk_summary}
            </p>

            {/* Technical Risks */}
            <h4 className="mb-3 text-sm font-medium text-zinc-500">
              Technical Risks
            </h4>
            <div className="mb-6 space-y-3">
              {report.risk_analysis.technical_risks.map(
                (
                  risk: {
                    impact: string;
                    probability: string;
                    risk: string;
                    mitigation: string;
                  },
                  idx: number,
                ) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-zinc-200 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 text-xs',
                          severityColors[risk.impact],
                        )}
                      >
                        {risk.impact} impact
                      </span>
                      <span className="text-xs text-zinc-400">
                        {risk.probability} probability
                      </span>
                    </div>
                    <p className="mb-2 font-medium text-zinc-800">
                      {risk.risk}
                    </p>
                    <p className="text-sm text-zinc-500">
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </p>
                  </div>
                ),
              )}
            </div>

            {/* Competitive Risks */}
            <h4 className="mb-3 text-sm font-medium text-zinc-500">
              Competitive Risks
            </h4>
            <div className="space-y-3">
              {report.risk_analysis.competitive_risks.map(
                (
                  risk: { severity: string; risk: string; timeline: string },
                  idx: number,
                ) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-lg bg-zinc-50 p-4"
                  >
                    <span
                      className={cn(
                        'shrink-0 rounded px-2 py-0.5 text-xs',
                        severityColors[risk.severity],
                      )}
                    >
                      {risk.severity}
                    </span>
                    <div>
                      <p className="text-zinc-700">{risk.risk}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Timeline: {risk.timeline}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </Section>

          {/* Founder Questions */}
          <Section>
            <SectionTitle>Founder Questions</SectionTitle>

            <h4 className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-500">
              <HelpCircle className="h-4 w-4" />
              Must-Ask Questions
            </h4>
            <div className="mb-8 space-y-4">
              {report.founder_questions.must_ask.map(
                (
                  q: {
                    question: string;
                    why_critical: string;
                    good_answer: string;
                    concerning_answer: string;
                  },
                  idx: number,
                ) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-zinc-200 p-4"
                  >
                    <p className="mb-2 text-lg font-medium text-zinc-900">
                      {q.question}
                    </p>
                    <p className="mb-3 text-sm text-zinc-500">
                      {q.why_critical}
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <div className="mb-1 flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle className="h-3 w-3" />
                          Good Answer
                        </div>
                        <p className="text-sm text-emerald-800">
                          {q.good_answer}
                        </p>
                      </div>
                      <div className="rounded-lg bg-red-50 p-3">
                        <div className="mb-1 flex items-center gap-1 text-xs font-medium text-red-700">
                          <AlertTriangle className="h-3 w-3" />
                          Concerning Answer
                        </div>
                        <p className="text-sm text-red-800">
                          {q.concerning_answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>

            {/* Technical Deep Dives */}
            <h4 className="mb-4 text-sm font-medium text-zinc-500">
              Technical Deep Dives
            </h4>
            <div className="space-y-4">
              {report.founder_questions.technical_deep_dives.map(
                (
                  dive: { topic: string; specific_questions: string[] },
                  idx: number,
                ) => (
                  <div key={idx} className="rounded-lg bg-zinc-50 p-4">
                    <h5 className="mb-2 font-medium text-zinc-800">
                      {dive.topic}
                    </h5>
                    <ul className="space-y-1">
                      {dive.specific_questions.map(
                        (question: string, qIdx: number) => (
                          <li
                            key={qIdx}
                            className="flex items-start gap-2 text-sm text-zinc-600"
                          >
                            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                            {question}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                ),
              )}
            </div>
          </Section>

          {/* Final Verdict */}
          <Section>
            <SectionTitle>Verdict & Recommendation</SectionTitle>

            <div className={cn('mb-6 rounded-xl p-6', verdictStyle.bg)}>
              <div className="mb-4 flex items-center gap-3">
                <span className={cn('text-2xl font-bold', verdictStyle.text)}>
                  {report.verdict_and_recommendation.technical_verdict.verdict}
                </span>
                <span className="text-sm text-zinc-500">
                  (
                  {
                    report.verdict_and_recommendation.technical_verdict
                      .confidence
                  }{' '}
                  confidence)
                </span>
              </div>
              <p className="text-zinc-700">
                {report.verdict_and_recommendation.technical_verdict.summary}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 p-6">
              <h4 className="mb-4 text-lg font-semibold text-zinc-900">
                Investment Recommendation:{' '}
                {
                  report.verdict_and_recommendation.investment_recommendation
                    .action
                }
              </h4>

              {report.verdict_and_recommendation.investment_recommendation
                .conditions.length > 0 && (
                <div className="mb-4">
                  <h5 className="mb-2 text-sm font-medium text-zinc-500">
                    Conditions
                  </h5>
                  <ul className="space-y-1">
                    {report.verdict_and_recommendation.investment_recommendation.conditions.map(
                      (condition: string, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-zinc-600"
                        >
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                          {condition}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

              {report.verdict_and_recommendation.investment_recommendation
                .key_derisking_steps.length > 0 && (
                <div>
                  <h5 className="mb-2 text-sm font-medium text-zinc-500">
                    Key De-risking Steps
                  </h5>
                  <ul className="space-y-1">
                    {report.verdict_and_recommendation.investment_recommendation.key_derisking_steps.map(
                      (step: string, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-zinc-600"
                        >
                          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600">
                            {idx + 1}
                          </span>
                          {step}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </div>
          </Section>
        </div>
      </main>
    </article>
  );
});
