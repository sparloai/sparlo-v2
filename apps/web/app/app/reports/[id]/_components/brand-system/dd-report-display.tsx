/**
 * DD Report Display - Due Diligence Report (Brand System Redesign)
 *
 * Renders technical due diligence reports using the brand system:
 * - Near-monochrome palette (zinc scale only)
 * - Typography-driven hierarchy (no colored backgrounds)
 * - Antifragile rendering with graceful fallbacks
 * - Supports both old and new DD schema formats
 */

'use client';

import { memo, useMemo, useState } from 'react';

import { ChevronDown, Download, Loader2, Share2 } from 'lucide-react';

import { cn } from '@kit/ui/utils';

import { useReportActions } from '../../_lib/hooks/use-report-actions';
import {
  ArticleBlock,
  BodyText,
  HighlightBox,
  MonoLabel,
  RiskSeverityIndicator,
  ScoreDisplay,
  Section,
  SectionTitle,
  UnknownFieldRenderer,
  VerdictDisplay,
  VerdictIndicator,
} from './primitives';

// ============================================
// TYPES
// ============================================

export interface DDReportData {
  mode: 'dd';
  report: unknown;
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

// New schema types
interface VerdictBox {
  overall?: string;
  technical_validity?: { verdict?: string; symbol?: string };
  commercial_viability?: { verdict?: string; symbol?: string };
  moat_strength?: { verdict?: string; symbol?: string };
  solution_space_position?: { verdict?: string; symbol?: string };
  timing?: { verdict?: string; symbol?: string };
}

interface OnePageSummary {
  company?: string;
  sector?: string;
  stage?: string;
  ask?: string;
  one_sentence?: string;
  executive_paragraph?: string;
  the_bet?: string;
  key_strength?: string;
  key_risk?: string;
  key_question?: string;
  if_you_do_one_thing?: string;
  closest_comparable?: string;
  expected_return?: string;
  bull_case_2_sentences?: string;
  bear_case_2_sentences?: string;
  verdict_box?: VerdictBox;
}

interface Score {
  score: number | string;
  out_of: number;
  one_liner?: string;
}

interface Scores {
  technical_credibility?: Score;
  commercial_viability?: Score;
  moat_strength?: Score;
}

interface Risk {
  risk: string;
  severity?: string;
  mitigation?: string;
}

interface FounderQuestion {
  question: string;
  why_critical?: string;
  good_answer?: string;
  bad_answer?: string;
}

interface Scenario {
  probability?: string;
  return?: string;
  narrative?: string;
}

interface Scenarios {
  bull_case?: Scenario;
  base_case?: Scenario;
  bear_case?: Scenario;
  expected_value?: {
    weighted_multiple?: string;
    assessment?: string;
  };
}

interface DiligenceRoadmapItem {
  action: string;
  priority?: string;
  purpose?: string;
}

interface QuickReference {
  one_page_summary?: OnePageSummary;
  scores?: Scores;
  key_risks?: Risk[];
  founder_questions?: FounderQuestion[];
  scenarios?: Scenarios;
  diligence_roadmap?: DiligenceRoadmapItem[];
}

interface ProseSection {
  content?: string;
  source?: string;
}

interface ProseReport {
  problem_primer?: ProseSection;
  technical_deep_dive?: ProseSection;
  solution_landscape?: ProseSection;
  commercialization_reality?: ProseSection;
  investment_synthesis?: ProseSection;
}

interface Appendix {
  detailed_claim_validation?: unknown[];
  comparable_details?: unknown[];
  all_founder_questions?: unknown;
  detailed_solution_space?: unknown;
  detailed_commercial_analysis?: unknown;
  full_diligence_roadmap?: unknown;
}

interface ReportMetadata {
  company_name?: string;
  date?: string;
  version?: string;
}

interface NormalizedDDReport {
  quick_reference?: QuickReference;
  prose_report?: ProseReport;
  appendix?: Appendix;
  report_metadata?: ReportMetadata;
}

// Old schema types for backwards compatibility
interface OldSchemaReport {
  header?: {
    company_name?: string;
    technology_domain?: string;
    date?: string;
  };
  executive_summary?: {
    verdict?: string;
    verdict_confidence?: string;
    one_paragraph_summary?: string;
    key_findings?: Array<{
      type: string;
      finding: string;
      investment_impact: string;
    }>;
    recommendation?: {
      action?: string;
      rationale?: string;
      key_condition?: string;
    };
    technical_credibility_score?: {
      score: number;
      out_of: number;
      one_line?: string;
    };
  };
  technical_thesis_assessment?: unknown;
  solution_space_positioning?: unknown;
  moat_assessment?: unknown;
  risk_analysis?: unknown;
  founder_questions?: unknown;
  verdict_and_recommendation?: unknown;
}

// ============================================
// TYPE GUARDS
// ============================================

function isNewSchemaFormat(
  data: unknown,
): data is { result: NormalizedDDReport } {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  // New schema wraps content in 'result' with quick_reference or prose_report
  if (obj.result && typeof obj.result === 'object') {
    const result = obj.result as Record<string, unknown>;
    return 'quick_reference' in result || 'prose_report' in result;
  }

  // Or directly has quick_reference/prose_report
  return 'quick_reference' in obj || 'prose_report' in obj;
}

function isOldSchemaFormat(data: unknown): data is OldSchemaReport {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return 'header' in obj || 'executive_summary' in obj;
}

// ============================================
// SCHEMA NORMALIZATION
// ============================================

function normalizeOldSchema(old: OldSchemaReport): NormalizedDDReport {
  const exec = old.executive_summary;

  return {
    quick_reference: {
      one_page_summary: {
        company: old.header?.company_name,
        sector: old.header?.technology_domain,
        executive_paragraph: exec?.one_paragraph_summary,
        verdict_box: {
          overall: exec?.verdict,
        },
      },
      scores: exec?.technical_credibility_score
        ? {
            technical_credibility: {
              score: exec.technical_credibility_score.score,
              out_of: exec.technical_credibility_score.out_of,
              one_liner: exec.technical_credibility_score.one_line,
            },
          }
        : undefined,
      key_risks: exec?.key_findings
        ?.filter((f) => f.investment_impact === 'HIGH' || f.type === 'RISK')
        .map((f) => ({
          risk: f.finding,
          severity: f.investment_impact,
        })),
    },
    report_metadata: {
      company_name: old.header?.company_name,
      date: old.header?.date,
    },
  };
}

function normalizeDDReportData(data: DDReportData): NormalizedDDReport {
  const raw = data.report;

  // Handle new schema format
  if (isNewSchemaFormat(raw)) {
    // Check if wrapped in 'result'
    const obj = raw as Record<string, unknown>;
    if (obj.result) {
      return obj.result as NormalizedDDReport;
    }
    return raw as NormalizedDDReport;
  }

  // Handle old schema format
  if (isOldSchemaFormat(raw)) {
    return normalizeOldSchema(raw);
  }

  // Unknown format - return empty with graceful fallback
  return {};
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function calculateReadingTime(report: NormalizedDDReport): number {
  if (!report) return 0;

  const WPM = 150;
  let wordCount = 0;

  // Count words in prose sections
  const prose = report.prose_report;
  if (prose) {
    const sections = [
      prose.problem_primer?.content,
      prose.technical_deep_dive?.content,
      prose.solution_landscape?.content,
      prose.commercialization_reality?.content,
      prose.investment_synthesis?.content,
    ];

    for (const content of sections) {
      if (content) {
        wordCount += content.split(/\s+/).length;
      }
    }
  }

  // Count words in quick reference
  const quickRef = report.quick_reference;
  if (quickRef?.one_page_summary?.executive_paragraph) {
    wordCount +=
      quickRef.one_page_summary.executive_paragraph.split(/\s+/).length;
  }

  // Minimum 5 minutes for any report
  return Math.max(5, Math.ceil(wordCount / WPM));
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// ============================================
// SUPPORTING COMPONENTS
// ============================================

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  loadingIcon: React.ReactNode;
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
}

const ActionButton = memo(function ActionButton({
  onClick,
  icon,
  loadingIcon,
  label,
  isLoading,
  disabled,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
    >
      {isLoading ? loadingIcon : icon}
      {label}
    </button>
  );
});

const ScenarioCard = memo(function ScenarioCard({
  title,
  probability,
  returnRange,
  narrative,
}: {
  title: string;
  probability?: string;
  returnRange?: string;
  narrative?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <MonoLabel variant="muted">{title}</MonoLabel>
      <div className="mt-2 flex items-baseline gap-2">
        {returnRange && (
          <span className="text-[24px] font-semibold text-zinc-900">
            {returnRange}
          </span>
        )}
        {probability && (
          <span className="text-[13px] text-zinc-500">({probability})</span>
        )}
      </div>
      {narrative && (
        <p className="mt-3 text-[14px] leading-relaxed text-zinc-600">
          {narrative}
        </p>
      )}
    </div>
  );
});

const FounderQuestionCard = memo(function FounderQuestionCard({
  question,
}: {
  question: FounderQuestion;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-6">
      <BodyText variant="primary" className="font-medium">
        {question.question}
      </BodyText>
      {question.why_critical && (
        <p className="mt-2 text-[14px] text-zinc-500">
          {question.why_critical}
        </p>
      )}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {question.good_answer && (
          <div className="rounded-lg bg-zinc-50 p-4">
            <MonoLabel variant="muted" className="text-[11px]">
              Good Answer
            </MonoLabel>
            <p className="mt-2 text-[14px] text-zinc-700">
              {question.good_answer}
            </p>
          </div>
        )}
        {question.bad_answer && (
          <div className="rounded-lg border border-zinc-200 p-4">
            <MonoLabel variant="muted" className="text-[11px]">
              Concerning Answer
            </MonoLabel>
            <p className="mt-2 text-[14px] text-zinc-500">
              {question.bad_answer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

const DiligenceRoadmapCard = memo(function DiligenceRoadmapCard({
  item,
  index,
}: {
  item: DiligenceRoadmapItem;
  index: number;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[14px] font-semibold text-zinc-400">
        {index + 1}.
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <RiskSeverityIndicator
            severity={item.priority || 'MEDIUM'}
            label={item.priority}
          />
        </div>
        <BodyText className="mt-1">{item.action}</BodyText>
        {item.purpose && (
          <p className="mt-1 text-[14px] text-zinc-500">{item.purpose}</p>
        )}
      </div>
    </div>
  );
});

interface CollapsibleSectionProps {
  title: string;
  id: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection = memo(function CollapsibleSection({
  title,
  id,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mt-8 rounded-lg border border-zinc-200 p-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isOpen}
        aria-controls={id}
      >
        <MonoLabel variant="default">{title}</MonoLabel>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-zinc-400 transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      {isOpen && (
        <div id={id} className="mt-6 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================

export const DDReportDisplay = memo(function DDReportDisplay({
  reportData,
  title,
  brief: _brief,
  createdAt,
  showActions = true,
  reportId,
}: DDReportDisplayProps) {
  // Normalize data for backwards compatibility
  const normalizedData = useMemo(
    () => normalizeDDReportData(reportData),
    [reportData],
  );

  const quickRef = normalizedData?.quick_reference;
  const prose = normalizedData?.prose_report;
  const appendix = normalizedData?.appendix;
  const metadata = normalizedData?.report_metadata;

  // Share and export functionality
  const { handleShare, handleExport, isExporting, isGeneratingShare } =
    useReportActions({
      reportId: reportId || '',
      reportTitle:
        title ||
        quickRef?.one_page_summary?.company ||
        metadata?.company_name ||
        'DD Report',
    });

  // Calculate read time
  const readTime = useMemo(
    () => calculateReadingTime(normalizedData),
    [normalizedData],
  );

  // Company name from various sources
  const companyName =
    title ||
    quickRef?.one_page_summary?.company ||
    metadata?.company_name ||
    'Due Diligence Report';

  // Early return for empty data
  if (!quickRef && !prose) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-500">Loading report data...</div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-white">
      {/* Header */}
      <header className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-start justify-between gap-6">
          <div>
            <MonoLabel variant="strong" className="mb-4 block">
              Technical Due Diligence
            </MonoLabel>
            <h1 className="font-heading text-[40px] font-normal tracking-[-0.02em] text-zinc-900">
              {companyName}
            </h1>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex shrink-0 items-center gap-2 pt-2">
              <ActionButton
                onClick={handleShare}
                icon={<Share2 className="h-4 w-4" />}
                loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                label="Share"
                isLoading={isGeneratingShare}
                disabled={!reportId}
              />
              <ActionButton
                onClick={handleExport}
                icon={<Download className="h-4 w-4" />}
                loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                label="Export"
                isLoading={isExporting}
                disabled={!reportId}
              />
            </div>
          )}
        </div>

        {/* Metadata row */}
        <div className="mt-4 flex items-center gap-4 text-[14px] tracking-[-0.02em] text-zinc-500">
          {quickRef?.one_page_summary?.sector && (
            <>
              <span>{quickRef.one_page_summary.sector}</span>
              <span className="text-zinc-300">·</span>
            </>
          )}
          {quickRef?.one_page_summary?.stage && (
            <>
              <span>{quickRef.one_page_summary.stage}</span>
              <span className="text-zinc-300">·</span>
            </>
          )}
          {(createdAt || metadata?.date) && (
            <>
              <span>{formatDate(createdAt || metadata?.date || '')}</span>
              <span className="text-zinc-300">·</span>
            </>
          )}
          <span>{readTime} min read</span>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-6 pb-24">
        {/* Executive Summary */}
        {quickRef?.one_page_summary && (
          <Section id="executive-summary" className="mt-0">
            <SectionTitle>Executive Summary</SectionTitle>

            {/* Verdict Display */}
            {quickRef.one_page_summary.verdict_box?.overall && (
              <div className="mt-8">
                <VerdictDisplay
                  verdict={quickRef.one_page_summary.verdict_box.overall}
                />

                {/* Verdict breakdown grid */}
                <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                  {quickRef.one_page_summary.verdict_box.technical_validity && (
                    <VerdictIndicator
                      label="Technical"
                      verdict={
                        quickRef.one_page_summary.verdict_box.technical_validity
                          .verdict || ''
                      }
                      symbol={
                        quickRef.one_page_summary.verdict_box.technical_validity
                          .symbol
                      }
                    />
                  )}
                  {quickRef.one_page_summary.verdict_box
                    .commercial_viability && (
                    <VerdictIndicator
                      label="Commercial"
                      verdict={
                        quickRef.one_page_summary.verdict_box
                          .commercial_viability.verdict || ''
                      }
                      symbol={
                        quickRef.one_page_summary.verdict_box
                          .commercial_viability.symbol
                      }
                    />
                  )}
                  {quickRef.one_page_summary.verdict_box.moat_strength && (
                    <VerdictIndicator
                      label="Moat"
                      verdict={
                        quickRef.one_page_summary.verdict_box.moat_strength
                          .verdict || ''
                      }
                      symbol={
                        quickRef.one_page_summary.verdict_box.moat_strength
                          .symbol
                      }
                    />
                  )}
                  {quickRef.one_page_summary.verdict_box
                    .solution_space_position && (
                    <VerdictIndicator
                      label="Position"
                      verdict={
                        quickRef.one_page_summary.verdict_box
                          .solution_space_position.verdict || ''
                      }
                      symbol={
                        quickRef.one_page_summary.verdict_box
                          .solution_space_position.symbol
                      }
                    />
                  )}
                  {quickRef.one_page_summary.verdict_box.timing && (
                    <VerdictIndicator
                      label="Timing"
                      verdict={
                        quickRef.one_page_summary.verdict_box.timing.verdict ||
                        ''
                      }
                      symbol={
                        quickRef.one_page_summary.verdict_box.timing.symbol
                      }
                    />
                  )}
                </div>
              </div>
            )}

            {/* Executive paragraph */}
            {quickRef.one_page_summary.executive_paragraph && (
              <ArticleBlock className="mt-8">
                <BodyText size="lg">
                  {quickRef.one_page_summary.executive_paragraph}
                </BodyText>
              </ArticleBlock>
            )}

            {/* The Bet */}
            {quickRef.one_page_summary.the_bet && (
              <HighlightBox variant="subtle" className="mt-8">
                <MonoLabel variant="strong">The Bet</MonoLabel>
                <BodyText className="mt-3">
                  {quickRef.one_page_summary.the_bet}
                </BodyText>
              </HighlightBox>
            )}

            {/* Key insight cards */}
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {quickRef.one_page_summary.key_strength && (
                <div className="rounded-lg border border-zinc-200 p-4">
                  <MonoLabel variant="muted" className="text-[11px]">
                    Key Strength
                  </MonoLabel>
                  <p className="mt-2 text-[14px] text-zinc-700">
                    {quickRef.one_page_summary.key_strength}
                  </p>
                </div>
              )}
              {quickRef.one_page_summary.key_risk && (
                <div className="rounded-lg border border-zinc-200 p-4">
                  <MonoLabel variant="muted" className="text-[11px]">
                    Key Risk
                  </MonoLabel>
                  <p className="mt-2 text-[14px] text-zinc-700">
                    {quickRef.one_page_summary.key_risk}
                  </p>
                </div>
              )}
            </div>

            {/* If you do one thing */}
            {quickRef.one_page_summary.if_you_do_one_thing && (
              <HighlightBox variant="strong" className="mt-8">
                <MonoLabel className="text-zinc-400">
                  If You Do One Thing
                </MonoLabel>
                <p className="mt-2 text-[18px] font-medium text-white">
                  {quickRef.one_page_summary.if_you_do_one_thing}
                </p>
              </HighlightBox>
            )}
          </Section>
        )}

        {/* Scores */}
        {quickRef?.scores && (
          <Section id="scores">
            <SectionTitle size="lg">Assessment Scores</SectionTitle>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {quickRef.scores.technical_credibility && (
                <ScoreDisplay
                  score={quickRef.scores.technical_credibility.score}
                  outOf={quickRef.scores.technical_credibility.out_of}
                  label="Technical Credibility"
                  oneLiner={quickRef.scores.technical_credibility.one_liner}
                />
              )}
              {quickRef.scores.commercial_viability && (
                <ScoreDisplay
                  score={quickRef.scores.commercial_viability.score}
                  outOf={quickRef.scores.commercial_viability.out_of}
                  label="Commercial Viability"
                  oneLiner={quickRef.scores.commercial_viability.one_liner}
                />
              )}
              {quickRef.scores.moat_strength && (
                <ScoreDisplay
                  score={quickRef.scores.moat_strength.score}
                  outOf={quickRef.scores.moat_strength.out_of}
                  label="Moat Strength"
                  oneLiner={quickRef.scores.moat_strength.one_liner}
                />
              )}
            </div>
          </Section>
        )}

        {/* Key Risks */}
        {quickRef?.key_risks && quickRef.key_risks.length > 0 && (
          <Section id="key-risks">
            <SectionTitle size="lg">Key Risks</SectionTitle>
            <div className="mt-8 space-y-4">
              {quickRef.key_risks.map((risk, idx) => (
                <div key={idx} className="border-l-2 border-zinc-200 pl-6">
                  <div className="mb-2 flex items-center gap-3">
                    <RiskSeverityIndicator
                      severity={risk.severity || 'MEDIUM'}
                    />
                  </div>
                  <BodyText variant="primary" className="font-medium">
                    {risk.risk}
                  </BodyText>
                  {risk.mitigation && (
                    <BodyText variant="muted" size="sm" className="mt-2">
                      Mitigation: {risk.mitigation}
                    </BodyText>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Scenarios */}
        {quickRef?.scenarios && (
          <Section id="scenarios">
            <SectionTitle size="lg">Investment Scenarios</SectionTitle>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {quickRef.scenarios.bull_case && (
                <ScenarioCard
                  title="Bull Case"
                  probability={quickRef.scenarios.bull_case.probability}
                  returnRange={quickRef.scenarios.bull_case.return}
                  narrative={quickRef.scenarios.bull_case.narrative}
                />
              )}
              {quickRef.scenarios.base_case && (
                <ScenarioCard
                  title="Base Case"
                  probability={quickRef.scenarios.base_case.probability}
                  returnRange={quickRef.scenarios.base_case.return}
                  narrative={quickRef.scenarios.base_case.narrative}
                />
              )}
              {quickRef.scenarios.bear_case && (
                <ScenarioCard
                  title="Bear Case"
                  probability={quickRef.scenarios.bear_case.probability}
                  returnRange={quickRef.scenarios.bear_case.return}
                  narrative={quickRef.scenarios.bear_case.narrative}
                />
              )}
            </div>

            {quickRef.scenarios.expected_value && (
              <HighlightBox variant="strong" className="mt-8">
                <MonoLabel className="text-zinc-400">Expected Value</MonoLabel>
                <div className="mt-2 text-[32px] font-semibold text-white">
                  {quickRef.scenarios.expected_value.weighted_multiple}
                </div>
                {quickRef.scenarios.expected_value.assessment && (
                  <p className="mt-2 text-[14px] text-zinc-300">
                    {quickRef.scenarios.expected_value.assessment}
                  </p>
                )}
              </HighlightBox>
            )}
          </Section>
        )}

        {/* Prose Report Sections */}
        {prose?.problem_primer?.content && (
          <Section id="problem-primer">
            <SectionTitle>Problem Primer</SectionTitle>
            <ArticleBlock className="mt-8">
              <BodyText parseCited>{prose.problem_primer.content}</BodyText>
            </ArticleBlock>
          </Section>
        )}

        {prose?.technical_deep_dive?.content && (
          <Section id="technical-deep-dive">
            <SectionTitle>Technical Deep Dive</SectionTitle>
            <ArticleBlock className="mt-8">
              <BodyText parseCited>
                {prose.technical_deep_dive.content}
              </BodyText>
            </ArticleBlock>
          </Section>
        )}

        {prose?.solution_landscape?.content && (
          <Section id="solution-landscape">
            <SectionTitle>Solution Landscape</SectionTitle>
            <ArticleBlock className="mt-8">
              <BodyText parseCited>{prose.solution_landscape.content}</BodyText>
            </ArticleBlock>
          </Section>
        )}

        {prose?.commercialization_reality?.content && (
          <Section id="commercialization">
            <SectionTitle>Commercialization Reality</SectionTitle>
            <ArticleBlock className="mt-8">
              <BodyText parseCited>
                {prose.commercialization_reality.content}
              </BodyText>
            </ArticleBlock>
          </Section>
        )}

        {prose?.investment_synthesis?.content && (
          <Section id="investment-synthesis">
            <SectionTitle>Investment Synthesis</SectionTitle>
            <ArticleBlock className="mt-8">
              <BodyText parseCited>
                {prose.investment_synthesis.content}
              </BodyText>
            </ArticleBlock>
          </Section>
        )}

        {/* Founder Questions */}
        {quickRef?.founder_questions &&
          quickRef.founder_questions.length > 0 && (
            <Section id="founder-questions">
              <SectionTitle>Founder Questions</SectionTitle>
              <div className="mt-8 space-y-6">
                {quickRef.founder_questions.map((q, idx) => (
                  <FounderQuestionCard key={idx} question={q} />
                ))}
              </div>
            </Section>
          )}

        {/* Diligence Roadmap */}
        {quickRef?.diligence_roadmap &&
          quickRef.diligence_roadmap.length > 0 && (
            <Section id="diligence-roadmap">
              <SectionTitle>Diligence Roadmap</SectionTitle>
              <div className="mt-8 space-y-4">
                {quickRef.diligence_roadmap.map((item, idx) => (
                  <DiligenceRoadmapCard key={idx} item={item} index={idx} />
                ))}
              </div>
            </Section>
          )}

        {/* Appendix */}
        {appendix && (
          <Section id="appendix">
            <SectionTitle>Appendix</SectionTitle>

            {/* Detailed Claim Validation */}
            {appendix.detailed_claim_validation &&
              Array.isArray(appendix.detailed_claim_validation) &&
              appendix.detailed_claim_validation.length > 0 && (
                <CollapsibleSection
                  title={`Detailed Claim Validation (${appendix.detailed_claim_validation.length})`}
                  id="claim-validation"
                >
                  <div className="space-y-4">
                    {appendix.detailed_claim_validation.map((claim, idx) => (
                      <UnknownFieldRenderer key={idx} data={claim} />
                    ))}
                  </div>
                </CollapsibleSection>
              )}

            {/* Comparable Details */}
            {Array.isArray(appendix.comparable_details) &&
              appendix.comparable_details.length > 0 && (
                <CollapsibleSection
                  title={`Comparable Companies (${appendix.comparable_details.length})`}
                  id="comparables"
                >
                  <div className="space-y-4">
                    {appendix.comparable_details.map((comp, idx) => (
                      <UnknownFieldRenderer key={idx} data={comp} />
                    ))}
                  </div>
                </CollapsibleSection>
              )}

            {/* All Founder Questions (expanded) */}
            {appendix.all_founder_questions != null && (
              <CollapsibleSection
                title="All Founder Questions"
                id="all-founder-questions"
              >
                <UnknownFieldRenderer data={appendix.all_founder_questions} />
              </CollapsibleSection>
            )}

            {/* Detailed Solution Space */}
            {appendix.detailed_solution_space != null && (
              <CollapsibleSection
                title="Detailed Solution Space"
                id="detailed-solution-space"
              >
                <UnknownFieldRenderer data={appendix.detailed_solution_space} />
              </CollapsibleSection>
            )}

            {/* Detailed Commercial Analysis */}
            {appendix.detailed_commercial_analysis != null && (
              <CollapsibleSection
                title="Detailed Commercial Analysis"
                id="detailed-commercial-analysis"
              >
                <UnknownFieldRenderer
                  data={appendix.detailed_commercial_analysis}
                />
              </CollapsibleSection>
            )}

            {/* Full Diligence Roadmap */}
            {appendix.full_diligence_roadmap != null && (
              <CollapsibleSection
                title="Full Diligence Roadmap"
                id="full-diligence-roadmap"
              >
                <UnknownFieldRenderer data={appendix.full_diligence_roadmap} />
              </CollapsibleSection>
            )}
          </Section>
        )}
      </main>
    </article>
  );
});
