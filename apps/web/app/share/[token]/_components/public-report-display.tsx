'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Beaker,
  ChevronRight,
  Lightbulb,
  Sparkles,
  Target,
} from 'lucide-react';

import {
  RecommendationCard,
  SectionHeader,
} from '~/home/(user)/reports/_components/shared';
import type {
  ExecutiveSummary,
  ReportData,
  SharedReport,
} from '~/home/(user)/reports/_lib/types/report-data.types';

interface PublicReportDisplayProps {
  report: SharedReport;
}

function getExecutiveSummary(
  summary: string | ExecutiveSummary | undefined,
): ExecutiveSummary | null {
  if (!summary) return null;
  if (typeof summary === 'string') {
    return { narrative_lead: summary };
  }
  return summary;
}

export function PublicReportDisplay({ report }: PublicReportDisplayProps) {
  const reportData = report.report_data as ReportData | null;
  const innerReport = reportData?.report;
  const executiveSummary = getExecutiveSummary(innerReport?.executive_summary);

  if (!innerReport) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500">Report content not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-8">
      {/* Header */}
      <motion.header
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wider text-violet-600 uppercase dark:text-violet-400">
            <Sparkles className="h-3.5 w-3.5" />
            Sparlo Intelligence Briefing
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-white">
            {report.title}
          </h1>
          {report.headline && (
            <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-300">
              {report.headline}
            </p>
          )}
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Generated {new Date(report.created_at).toLocaleDateString()}
        </div>
      </motion.header>

      <div className="space-y-12">
        {/* Executive Summary */}
        {executiveSummary && (
          <motion.section
            id="executive-summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SectionHeader
              icon={Sparkles}
              title="Executive Summary"
              subtitle="The bottom line"
            />
            <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 dark:border-violet-800 dark:from-violet-900/30 dark:to-zinc-900">
              <div className="space-y-4">
                {executiveSummary.narrative_lead && (
                  <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-200">
                    {executiveSummary.narrative_lead}
                  </p>
                )}
                {executiveSummary.core_insight && (
                  <div className="rounded-lg bg-white/60 p-4 dark:bg-zinc-800/60">
                    <h4 className="mb-2 font-semibold text-zinc-900 dark:text-white">
                      {executiveSummary.core_insight.headline}
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {executiveSummary.core_insight.explanation}
                    </p>
                  </div>
                )}
                {executiveSummary.primary_recommendation && (
                  <p className="text-sm font-medium text-violet-700 dark:text-violet-400">
                    {executiveSummary.primary_recommendation}
                  </p>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* Problem Restatement */}
        {innerReport.problem_restatement && (
          <motion.section
            id="problem-restatement"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <SectionHeader
              icon={AlertTriangle}
              title="Problem Restatement"
              subtitle="Reframing the challenge"
            />
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-200">
                {innerReport.problem_restatement}
              </p>
            </div>
          </motion.section>
        )}

        {/* Decision Architecture */}
        {innerReport.decision_architecture && (
          <motion.section
            id="decision-architecture"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SectionHeader
              icon={Target}
              title="Decision Architecture"
              subtitle="Your action plan with fallback strategies"
            />
            <div className="space-y-6">
              {innerReport.decision_architecture.primary && (
                <RecommendationCard
                  recommendation={innerReport.decision_architecture.primary}
                  type="primary"
                />
              )}
              {innerReport.decision_architecture.fallback && (
                <RecommendationCard
                  recommendation={innerReport.decision_architecture.fallback}
                  type="fallback"
                />
              )}
            </div>
          </motion.section>
        )}

        {/* Key Insights */}
        {innerReport.key_insights && innerReport.key_insights.length > 0 && (
          <motion.section
            id="key-insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <SectionHeader
              icon={Lightbulb}
              title="Key Insights"
              subtitle="Critical learnings from this analysis"
            />
            <div className="space-y-3">
              {innerReport.key_insights.map((insight, idx) => (
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
          </motion.section>
        )}

        {/* Next Steps */}
        {innerReport.next_steps && innerReport.next_steps.length > 0 && (
          <motion.section
            id="next-steps"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SectionHeader
              icon={Beaker}
              title="Next Steps"
              subtitle="Recommended actions in sequence"
            />
            <div className="space-y-3">
              {innerReport.next_steps.map((step, idx) => (
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
          </motion.section>
        )}
      </div>

      {/* Footer */}
      <motion.footer
        className="mt-16 border-t border-zinc-200 pt-8 text-center dark:border-zinc-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Powered by{' '}
          <a
            href="/"
            className="font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            Sparlo
          </a>
        </p>
      </motion.footer>
    </div>
  );
}
