'use client';

/**
 * DD Report v2 Display
 *
 * Main wrapper component for rendering Due Diligence reports.
 * Uses existing brand system primitives for consistent styling.
 */
import { Component, type ReactNode } from 'react';

import { MonoLabel } from '../brand-system/primitives';
import { type DDReport, parseDDReport } from './schema';
import {
  ClaimValidationSection,
  MoatSection,
  NoveltySection,
  SolutionLandscapeSection,
  TechnicalThesisSection,
} from './sections-analysis';
import {
  ExecutiveSummarySection,
  OnePageSummarySection,
  VerdictSection,
} from './sections-core';
import {
  ComparableAnalysisSection,
  ConfidenceCalibrationSection,
  DiligenceRoadmapSection,
  FounderQuestionsSection,
  ProblemPrimerSection,
  WhyWrongSection,
} from './sections-other';
import {
  CommercializationSection,
  PreMortemSection,
  RiskAnalysisSection,
  ScenarioAnalysisSection,
} from './sections-risk';

// ============================================
// Error Boundary
// ============================================

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class DDReportErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[DDReport] Render error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="mb-2">
            <MonoLabel variant="strong">Render Error</MonoLabel>
          </div>
          <p className="font-medium text-red-700">Failed to render report</p>
          <p className="mt-2 text-sm text-red-600">
            {this.state.error?.message || 'Unknown error'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// Main Components
// ============================================

interface DDReportDisplayProps {
  data: unknown;
  reportId: string;
}

function DDReportContent({ report }: { report: DDReport }) {
  return (
    <div className="space-y-16">
      {/* Header */}
      <header className="border-b border-zinc-200 pb-8">
        <div className="mb-4 flex items-center gap-4">
          <MonoLabel>
            {report.header.report_type || 'Technical Due Diligence Report'}
          </MonoLabel>
          {report.header.date && (
            <span className="text-sm text-zinc-500">{report.header.date}</span>
          )}
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          {report.header.company_name}
        </h1>
        {report.header.technology_domain && (
          <div className="mt-4">
            <span className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-600">
              {report.header.technology_domain}
            </span>
          </div>
        )}
      </header>

      {/* Core Sections */}
      <ExecutiveSummarySection data={report.executive_summary} />
      <OnePageSummarySection data={report.one_page_summary} />
      <VerdictSection data={report.verdict_and_recommendation} />

      {/* Analysis Sections */}
      <ProblemPrimerSection data={report.problem_primer} />
      <TechnicalThesisSection data={report.technical_thesis_assessment} />
      <ClaimValidationSection data={report.claim_validation_summary} />
      <SolutionLandscapeSection data={report.solution_landscape} />
      <NoveltySection data={report.novelty_assessment} />
      <MoatSection data={report.moat_assessment} />

      {/* Risk Sections */}
      <CommercializationSection data={report.commercialization_reality} />
      <RiskAnalysisSection data={report.risk_analysis} />
      <ScenarioAnalysisSection data={report.scenario_analysis} />
      <PreMortemSection data={report.pre_mortem} />

      {/* Other Sections */}
      <ConfidenceCalibrationSection data={report.confidence_calibration} />
      <ComparableAnalysisSection data={report.comparable_analysis} />
      <FounderQuestionsSection data={report.founder_questions} />
      <DiligenceRoadmapSection data={report.diligence_roadmap} />
      <WhyWrongSection data={report.why_this_might_be_wrong} />
    </div>
  );
}

export function DDReportDisplay({ data, reportId }: DDReportDisplayProps) {
  const report = parseDDReport(data);

  return (
    <DDReportErrorBoundary>
      <article
        className="mx-auto max-w-4xl px-6 py-12"
        data-test="dd-report"
        data-report-id={reportId}
      >
        <DDReportContent report={report} />
      </article>
    </DDReportErrorBoundary>
  );
}
