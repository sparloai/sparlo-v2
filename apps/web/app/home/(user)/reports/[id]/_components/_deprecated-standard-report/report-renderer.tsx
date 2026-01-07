import type { SparloReport } from '../../_lib/schema/sparlo-report.schema';
import { AdditionalContent } from './sections/additional-content';
import { Brief } from './sections/brief';
import { ChallengeFrame } from './sections/challenge-frame';
import { Constraints } from './sections/constraints';
import { ExecutiveSummary } from './sections/executive-summary';
import { KeyPatterns } from './sections/key-patterns';
import { NextSteps } from './sections/next-steps';
import { ProblemAnalysis } from './sections/problem-analysis';
import { RisksWatchouts } from './sections/risks-watchouts';
import { SolutionConcepts } from './sections/solution-concepts';
import { ValidationSummary } from './sections/validation-summary';

interface ReportRendererProps {
  report: SparloReport;
}

/**
 * Main report composition component.
 * All child components are Server Components - no 'use client' needed.
 *
 * AdditionalContent renders at the end for any LLM-generated sections
 * that don't fit the predefined structure.
 */
export function ReportRenderer({ report }: ReportRendererProps) {
  return (
    <main className="min-w-0 flex-1 space-y-16">
      <Brief data={report.brief} />
      <ExecutiveSummary data={report.executive_summary} />
      <Constraints data={report.constraints} />
      <ProblemAnalysis data={report.problem_analysis} />
      <KeyPatterns data={report.key_patterns} />
      <SolutionConcepts data={report.solution_concepts} />
      <ValidationSummary data={report.validation_summary} />
      <ChallengeFrame data={report.challenge_the_frame} />
      <RisksWatchouts data={report.risks_and_watchouts} />
      <NextSteps data={report.next_steps} />

      {/* Flexible content for LLM creativity - renders any additional sections */}
      <AdditionalContent data={report.additional_content} />
    </main>
  );
}
