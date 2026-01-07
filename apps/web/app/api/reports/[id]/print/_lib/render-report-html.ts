import 'server-only';

import type {
  ChallengeTheFrame,
  ConstraintsAndMetrics,
  ExecutionTrack,
  ExecutionTrackPrimary,
  FrontierWatch,
  HybridReportData,
  InnovationAnalysis,
  InnovationPortfolio,
  InsightBlock,
  ParallelInvestigation,
  ProblemAnalysis,
  RecommendedInnovation,
  RiskAndWatchout,
  SelfCritique,
  StructuredExecutiveSummary,
  SupportingConcept,
  ValidationGate,
} from '~/app/app/reports/_lib/types/hybrid-report-display.types';

import { LOGO_BASE64, PRINT_STYLES } from './print-styles';

// ============================================
// DATA NORMALIZATION
// ============================================

/**
 * Normalize report data to handle both old (v3) and new (v4) schema field names.
 * Maps: solution_concepts → execution_track, innovation_concepts → innovation_portfolio
 *
 * This function mirrors the normalization in brand-system-report.tsx to ensure
 * PDF export renders the same sections as the web view.
 */
function normalizeReportData(data: HybridReportData): HybridReportData {
  const raw = data as Record<string, unknown>;

  // Check if data already has the expected field names
  const hasExecutionTrack = Boolean(data.execution_track);
  const hasInnovationPortfolio = Boolean(data.innovation_portfolio);
  // Check for v12 schema field names that need normalization
  const hasSolutionConcepts = Boolean(raw.solution_concepts);
  const hasInnovationConcepts = Boolean(raw.innovation_concepts);

  // If using old schema field names AND doesn't have new names, skip normalization
  if (hasExecutionTrack && hasInnovationPortfolio) {
    return {
      ...data,
      constraints_and_metrics:
        data.constraints_and_metrics ??
        (raw.constraints as HybridReportData['constraints_and_metrics']),
    };
  }

  // If no solution/innovation concepts at all, return as-is
  if (
    !hasSolutionConcepts &&
    !hasInnovationConcepts &&
    !hasExecutionTrack &&
    !hasInnovationPortfolio
  ) {
    return {
      ...data,
      constraints_and_metrics:
        data.constraints_and_metrics ??
        (raw.constraints as HybridReportData['constraints_and_metrics']),
    };
  }

  // Normalize solution_concepts → execution_track
  const solutionConcepts = raw.solution_concepts as
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
            expected_outcome?: { value?: string };
            investment?: { value?: string };
            timeline?: { value?: string };
          };
          the_insight?: unknown;
          first_validation_step?: {
            test?: string;
            cost?: string;
            go_criteria?: string;
          };
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
        }>;
      }
    | undefined;

  const executionTrack: HybridReportData['execution_track'] = solutionConcepts
    ? {
        intro: solutionConcepts.intro,
        primary: solutionConcepts.primary
          ? {
              id: solutionConcepts.primary.id,
              title: solutionConcepts.primary.title,
              confidence: solutionConcepts.primary.confidence_percent,
              source_type: solutionConcepts.primary.source_type as
                | 'CATALOG'
                | 'TRANSFER'
                | 'OPTIMIZATION'
                | 'FIRST_PRINCIPLES'
                | undefined,
              what_it_is: solutionConcepts.primary.what_it_is,
              why_it_works: solutionConcepts.primary.why_it_works,
              expected_improvement:
                solutionConcepts.primary.economics?.expected_outcome?.value,
              investment: solutionConcepts.primary.economics?.investment?.value,
              timeline: solutionConcepts.primary.economics?.timeline?.value,
              the_insight: solutionConcepts.primary
                .the_insight as HybridReportData['execution_track'] extends {
                primary?: { the_insight?: infer T };
              }
                ? T
                : never,
              validation_gates: solutionConcepts.primary.first_validation_step
                ? [
                    {
                      test: solutionConcepts.primary.first_validation_step.test,
                      cost: solutionConcepts.primary.first_validation_step.cost,
                      success_criteria:
                        solutionConcepts.primary.first_validation_step
                          .go_criteria,
                    },
                  ]
                : undefined,
            }
          : undefined,
        supporting_concepts: solutionConcepts.supporting?.map((s) => ({
          id: s.id,
          title: s.title,
          relationship: s.relationship as
            | 'COMPLEMENTARY'
            | 'FALLBACK'
            | 'PREREQUISITE'
            | undefined,
          one_liner: s.key_risk,
          what_it_is: s.what_it_is,
          why_it_works: s.why_it_works,
          when_to_use_instead: s.when_to_use_instead,
          confidence: s.confidence_percent,
        })),
      }
    : undefined;

  // Normalize innovation_concepts → innovation_portfolio
  const innovationConcepts = raw.innovation_concepts as
    | {
        intro?: string;
        recommended?: {
          id?: string;
          title?: string;
          confidence_percent?: number;
          confidence?: number;
          [key: string]: unknown;
        };
        parallel?: Array<{
          id?: string;
          title?: string;
          confidence_percent?: number;
          confidence?: number;
          [key: string]: unknown;
        }>;
        frontier_watch?: HybridReportData['innovation_portfolio'] extends {
          frontier_watch?: infer T;
        }
          ? T
          : never;
      }
    | undefined;

  const innovationPortfolio: HybridReportData['innovation_portfolio'] =
    innovationConcepts
      ? {
          intro: innovationConcepts.intro,
          recommended_innovation: innovationConcepts.recommended
            ? ({
                ...innovationConcepts.recommended,
                confidence:
                  innovationConcepts.recommended.confidence_percent ??
                  innovationConcepts.recommended.confidence,
              } as HybridReportData['innovation_portfolio'] extends {
                recommended_innovation?: infer T;
              }
                ? T
                : never)
            : undefined,
          parallel_investigations: innovationConcepts.parallel?.map((p) => ({
            ...p,
            confidence: p.confidence_percent ?? p.confidence,
          })) as HybridReportData['innovation_portfolio'] extends {
            parallel_investigations?: infer T;
          }
            ? T
            : never,
          frontier_watch: innovationConcepts.frontier_watch,
        }
      : undefined;

  // Normalize constraints → constraints_and_metrics
  const constraintsAndMetrics =
    data.constraints_and_metrics ??
    (raw.constraints as HybridReportData['constraints_and_metrics']);

  // Use normalized data if available, otherwise preserve original
  return {
    ...data,
    execution_track: executionTrack ?? data.execution_track,
    innovation_portfolio: innovationPortfolio ?? data.innovation_portfolio,
    constraints_and_metrics: constraintsAndMetrics,
  };
}

interface RenderOptions {
  reportData: HybridReportData;
  title: string;
  brief?: string;
  createdAt?: string;
}

// Reading speed constants (words per minute)
const WPM_PROSE = 150; // Technical prose - dense, requires comprehension
const WPM_HEADLINE = 300; // Headlines - scanned quickly
const WPM_LIST_ITEM = 220; // Bullet points - structured, easier to parse
const SECONDS_PER_TABLE_ROW = 3; // Fixed time per table/data row

/**
 * Calculate estimated read time by extracting only rendered content
 * and applying content-type specific reading speeds.
 *
 * This function explicitly extracts text from fields that are actually
 * rendered to users, avoiding metadata, IDs, and non-displayed content.
 */
function calculateReadTime(data: HybridReportData): number {
  let proseWords = 0;
  let headlineWords = 0;
  let listItemWords = 0;
  let tableRows = 0;

  const countWords = (text: string | undefined | null): number => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // Brief - user's original input
  proseWords += countWords(data.brief);

  // Executive Summary
  if (typeof data.executive_summary === 'string') {
    proseWords += countWords(data.executive_summary);
  } else if (data.executive_summary) {
    proseWords += countWords(data.executive_summary.narrative_lead);
    proseWords += countWords(data.executive_summary.the_problem);
    proseWords += countWords(data.executive_summary.core_insight?.explanation);
    proseWords += countWords(data.executive_summary.primary_recommendation);
    headlineWords += countWords(data.executive_summary.core_insight?.headline);
  }

  // Problem Analysis
  if (data.problem_analysis) {
    proseWords += countWords(data.problem_analysis.whats_wrong?.prose);
    proseWords += countWords(data.problem_analysis.why_its_hard?.prose);
    proseWords += countWords(
      data.problem_analysis.first_principles_insight?.explanation,
    );
    headlineWords += countWords(
      data.problem_analysis.first_principles_insight?.headline,
    );

    // Root cause hypotheses
    data.problem_analysis.root_cause_hypotheses?.forEach((h) => {
      listItemWords += countWords(h.hypothesis);
      listItemWords += countWords(h.explanation);
    });

    // Industry approaches
    data.problem_analysis.what_industry_does_today?.forEach((item) => {
      listItemWords += countWords(item.approach);
      listItemWords += countWords(item.limitation);
    });

    // Benchmarks table
    tableRows +=
      data.problem_analysis.current_state_of_art?.benchmarks?.length || 0;
  }

  // Constraints & Metrics
  if (data.constraints_and_metrics) {
    data.constraints_and_metrics.hard_constraints?.forEach((c) => {
      listItemWords += countWords(c);
    });
    data.constraints_and_metrics.soft_constraints?.forEach((c) => {
      listItemWords += countWords(c);
    });
    data.constraints_and_metrics.assumptions?.forEach((a) => {
      listItemWords += countWords(a);
    });
    tableRows += data.constraints_and_metrics.success_metrics?.length || 0;
  }

  // Challenge the Frame
  data.challenge_the_frame?.forEach((c) => {
    listItemWords += countWords(c.assumption);
    listItemWords += countWords(c.challenge);
    listItemWords += countWords(c.implication);
  });

  // Execution Track (Solution Concepts)
  if (data.execution_track) {
    proseWords += countWords(data.execution_track.intro);

    if (data.execution_track.primary) {
      const p = data.execution_track.primary;
      headlineWords += countWords(p.title);
      headlineWords += countWords(p.bottom_line);
      proseWords += countWords(p.what_it_is);
      proseWords += countWords(p.why_it_works);
      proseWords += countWords(p.expected_improvement);
      tableRows += p.validation_gates?.length || 0;

      // Why it might fail
      p.why_it_might_fail?.forEach((reason) => {
        listItemWords += countWords(reason);
      });
    }

    // Supporting concepts
    data.execution_track.supporting_concepts?.forEach((c) => {
      headlineWords += countWords(c.title);
      listItemWords += countWords(c.one_liner);
      proseWords += countWords(c.what_it_is);
      proseWords += countWords(c.why_it_works);
    });
  }

  // Innovation Portfolio
  if (data.innovation_portfolio) {
    proseWords += countWords(data.innovation_portfolio.intro);

    if (data.innovation_portfolio.recommended_innovation) {
      const r = data.innovation_portfolio.recommended_innovation;
      headlineWords += countWords(r.title);
      proseWords += countWords(r.what_it_is);
      proseWords += countWords(r.why_it_works);
      proseWords += countWords(r.the_insight?.what);
      proseWords += countWords(r.the_insight?.why_industry_missed_it);
    }

    // Parallel investigations
    data.innovation_portfolio.parallel_investigations?.forEach((inv) => {
      headlineWords += countWords(inv.title);
      listItemWords += countWords(inv.one_liner);
      proseWords += countWords(inv.what_it_is);
      proseWords += countWords(inv.why_it_works);
    });

    // Frontier watch
    data.innovation_portfolio.frontier_watch?.forEach((fw) => {
      headlineWords += countWords(fw.title);
      listItemWords += countWords(fw.one_liner);
      proseWords += countWords(fw.why_interesting);
      proseWords += countWords(fw.why_not_now);
    });
  }

  // Risks & Watchouts
  data.risks_and_watchouts?.forEach((r) => {
    listItemWords += countWords(r.risk);
    listItemWords += countWords(r.mitigation);
  });

  // Self Critique
  if (data.self_critique) {
    proseWords += countWords(data.self_critique.confidence_rationale);
    data.self_critique.what_we_might_be_wrong_about?.forEach((w) => {
      listItemWords += countWords(w);
    });
    data.self_critique.unexplored_directions?.forEach((d) => {
      listItemWords += countWords(d);
    });
  }

  // Strategic Integration
  if (data.strategic_integration) {
    proseWords += countWords(
      data.strategic_integration.portfolio_view?.combined_strategy,
    );
    proseWords += countWords(
      data.strategic_integration.personal_recommendation?.intro,
    );
    proseWords += countWords(
      data.strategic_integration.personal_recommendation?.key_insight,
    );

    data.strategic_integration.action_plan?.forEach((action) => {
      listItemWords += countWords(action.rationale);
      action.actions?.forEach((a) => {
        listItemWords += countWords(a);
      });
    });
  }

  // Final Recommendation
  proseWords += countWords(data.what_id_actually_do);

  // Key Insights & Next Steps
  data.key_insights?.forEach((i) => (listItemWords += countWords(i)));
  data.next_steps?.forEach((s) => (listItemWords += countWords(s)));

  // Calculate time for each content type
  const proseMinutes = proseWords / WPM_PROSE;
  const headlineMinutes = headlineWords / WPM_HEADLINE;
  const listMinutes = listItemWords / WPM_LIST_ITEM;
  const tableMinutes = (tableRows * SECONDS_PER_TABLE_ROW) / 60;

  const totalMinutes =
    proseMinutes + headlineMinutes + listMinutes + tableMinutes;

  return Math.max(1, Math.round(totalMinutes));
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function escapeHtml(text: unknown, allowSup = false): string {
  if (text === null || text === undefined) return '';
  // Handle non-string types (objects, arrays, numbers)
  if (typeof text !== 'string') {
    // For objects/arrays, stringify them
    if (typeof text === 'object') {
      return escapeHtml(JSON.stringify(text), allowSup);
    }
    // For numbers, booleans, etc.
    return escapeHtml(String(text), allowSup);
  }
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Restore superscript tags if allowed (used for citations like [1], [2])
  if (allowSup) {
    escaped = escaped
      .replace(/&lt;sup&gt;/gi, '<sup>')
      .replace(/&lt;\/sup&gt;/gi, '</sup>');
  }

  return escaped;
}

/**
 * Convert a string to Title Case (e.g., "HIGH" -> "High", "MEDIUM" -> "Medium")
 * Handles compound labels like "HIGH VIABILITY" -> "High Viability"
 */
function toTitleCase(text: unknown): string {
  if (text === null || text === undefined) return '';
  if (typeof text !== 'string') return String(text);
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Whitelist sanitizers for values used in CSS class names to prevent XSS
const VALID_SEVERITIES = ['high', 'medium', 'low'] as const;
const VALID_GAP_STATUSES = [
  'open',
  'closed',
  'in-progress',
  'not-started',
  'needs-work',
] as const;

function sanitizeSeverity(severity: unknown): string {
  if (!severity || typeof severity !== 'string') return 'medium';
  const normalized = severity.toLowerCase().trim();
  return VALID_SEVERITIES.includes(
    normalized as (typeof VALID_SEVERITIES)[number],
  )
    ? normalized
    : 'medium';
}

function sanitizeGapStatus(status: unknown): string {
  if (!status || typeof status !== 'string') return 'open';
  const normalized = status.toLowerCase().replace(/_/g, '-').trim();
  return VALID_GAP_STATUSES.includes(
    normalized as (typeof VALID_GAP_STATUSES)[number],
  )
    ? normalized
    : 'open';
}

/**
 * Extract domains searched as simple string array from multiple possible locations.
 * Handles both cross_domain_search.domains_searched and innovation_analysis.domains_searched.
 */
function extractDomainsSearched(data: HybridReportData): string[] | undefined {
  // Try cross_domain_search first
  if (
    data.cross_domain_search?.domains_searched &&
    data.cross_domain_search.domains_searched.length > 0
  ) {
    return data.cross_domain_search.domains_searched.map((d) =>
      typeof d === 'string' ? d : (d as { domain?: string }).domain || '',
    );
  }

  // Fall back to innovation_analysis
  if (
    data.innovation_analysis?.domains_searched &&
    data.innovation_analysis.domains_searched.length > 0
  ) {
    return data.innovation_analysis.domains_searched;
  }

  return undefined;
}

// ============================================
// SECTION RENDERERS
// ============================================

function renderHeader(
  title: string,
  createdAt?: string,
  readTime?: number,
): string {
  return `
    <header class="report-header">
      <div class="report-logo">
        <img src="${LOGO_BASE64}" alt="Sparlo" />
      </div>
      <h1 class="report-title">${escapeHtml(title)}</h1>
      <div class="report-meta">
        ${createdAt ? `<span>${formatDate(createdAt)}</span>` : ''}
        ${createdAt && readTime ? '<span class="meta-separator">·</span>' : ''}
        ${readTime ? `<span>${readTime} min read</span>` : ''}
      </div>
    </header>
  `;
}

function renderBrief(brief?: string): string {
  if (!brief) return '';
  return `
    <section class="section" id="brief">
      <h2 class="section-title">The Brief</h2>
      <div class="brief-box">
        <p class="body-text">${escapeHtml(brief)}</p>
      </div>
    </section>
  `;
}

function renderExecutiveSummary(
  data?: string | StructuredExecutiveSummary,
): string {
  if (!data) return '';

  if (typeof data === 'string') {
    return `
      <section class="section" id="executive-summary">
        <h2 class="section-title">Executive Summary</h2>
        <p class="body-text">${escapeHtml(data)}</p>
      </section>
    `;
  }

  return `
    <section class="section" id="executive-summary">
      <h2 class="section-title">Executive Summary</h2>

      ${data.narrative_lead ? `<p class="lead-text">${escapeHtml(data.narrative_lead)}</p>` : ''}

      ${
        data.viability || data.viability_label
          ? `
        <div class="viability-box">
          ${data.viability_label ? `<span class="viability-label">${escapeHtml(toTitleCase(data.viability_label))}</span>` : ''}
          ${data.viability ? `<span class="viability-badge">${escapeHtml(toTitleCase(data.viability))}</span>` : ''}
        </div>
      `
          : ''
      }

      ${data.the_problem ? `<div class="content-block"><span class="mono-label">The Problem</span><p class="body-text">${escapeHtml(data.the_problem)}</p></div>` : ''}

      ${
        data.core_insight
          ? `
        <div class="insight-box">
          <span class="mono-label">Core Insight</span>
          ${data.core_insight.headline ? `<p class="insight-headline">${escapeHtml(data.core_insight.headline)}</p>` : ''}
          ${data.core_insight.explanation ? `<p class="body-text">${escapeHtml(data.core_insight.explanation)}</p>` : ''}
        </div>
      `
          : ''
      }

      ${data.primary_recommendation ? `<div class="content-block"><span class="mono-label">Primary Recommendation</span><p class="body-text">${escapeHtml(data.primary_recommendation)}</p></div>` : ''}

      ${
        data.recommended_path && data.recommended_path.length > 0
          ? `
        <div class="content-block">
          <span class="mono-label">Recommended Path</span>
          <ol class="numbered-list">
            ${data.recommended_path.map((step) => `<li class="numbered-item"><span class="step-number">${step.step}</span><div class="step-content"><p class="body-text">${escapeHtml(step.action)}</p>${step.rationale ? `<p class="step-rationale">${escapeHtml(step.rationale)}</p>` : ''}</div></li>`).join('')}
          </ol>
        </div>
      `
          : ''
      }
    </section>
  `;
}

function renderProblemAnalysis(data?: ProblemAnalysis): string {
  if (!data) return '';

  return `
    <section class="section" id="problem-analysis">
      <h2 class="section-title">Problem Analysis</h2>

      ${
        data.whats_wrong?.prose
          ? `
        <div class="content-block">
          <span class="mono-label">What's Wrong</span>
          <p class="body-text">${escapeHtml(data.whats_wrong.prose)}</p>
        </div>
      `
          : ''
      }

      ${
        data.current_state_of_art?.benchmarks &&
        data.current_state_of_art.benchmarks.length > 0
          ? `
        <div class="content-block">
          <span class="mono-label">Current State of Art</span>
          <div class="benchmark-table">
            <table>
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Approach</th>
                  <th>Current Performance</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                ${data.current_state_of_art.benchmarks
                  .map(
                    (b) => `
                  <tr>
                    <td>${escapeHtml(b.entity)}</td>
                    <td>${escapeHtml(b.approach)}</td>
                    <td>${escapeHtml(b.current_performance)}</td>
                    <td>${escapeHtml(b.target_roadmap)}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      `
          : ''
      }

      ${
        data.why_its_hard?.prose
          ? `
        <div class="content-block">
          <span class="mono-label">Why It's Hard</span>
          <p class="body-text">${escapeHtml(data.why_its_hard.prose)}</p>
          ${
            data.why_its_hard.governing_equation
              ? `
            <div class="equation-box">
              <code>${escapeHtml(data.why_its_hard.governing_equation.equation)}</code>
              ${data.why_its_hard.governing_equation.explanation ? `<p class="equation-explanation">${escapeHtml(data.why_its_hard.governing_equation.explanation)}</p>` : ''}
            </div>
          `
              : ''
          }
        </div>
      `
          : ''
      }

      ${
        data.first_principles_insight
          ? `
        <div class="insight-box">
          <span class="mono-label">First Principles Insight</span>
          ${data.first_principles_insight.headline ? `<p class="insight-headline">${escapeHtml(data.first_principles_insight.headline)}</p>` : ''}
          ${data.first_principles_insight.explanation ? `<p class="body-text">${escapeHtml(data.first_principles_insight.explanation)}</p>` : ''}
        </div>
      `
          : ''
      }

      ${
        data.root_cause_hypotheses && data.root_cause_hypotheses.length > 0
          ? `
        <div class="content-block">
          <span class="mono-label">Root Cause Hypotheses</span>
          <div class="hypothesis-list">
            ${data.root_cause_hypotheses
              .map(
                (h) => `
              <div class="hypothesis-item">
                <div class="hypothesis-header">
                  <span class="hypothesis-name">${escapeHtml(h.name)}</span>
                  ${h.confidence_percent !== undefined ? `<span class="confidence-badge">${h.confidence_percent}% confidence</span>` : ''}
                </div>
                ${h.explanation ? `<p class="body-text">${escapeHtml(h.explanation)}</p>` : ''}
              </div>
            `,
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }
    </section>
  `;
}

function renderConstraints(data?: ConstraintsAndMetrics): string {
  if (!data) return '';

  const hasContent =
    (data.hard_constraints && data.hard_constraints.length > 0) ||
    (data.soft_constraints && data.soft_constraints.length > 0) ||
    (data.assumptions && data.assumptions.length > 0);

  if (!hasContent) return '';

  return `
    <section class="section" id="constraints">
      <h2 class="section-title">Constraints & Metrics</h2>

      ${
        data.hard_constraints && data.hard_constraints.length > 0
          ? `
        <div class="content-block">
          <span class="mono-label-strong">Hard Constraints</span>
          <ul class="constraint-list hard">
            ${data.hard_constraints.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
          </ul>
        </div>
      `
          : ''
      }

      ${
        data.soft_constraints && data.soft_constraints.length > 0
          ? `
        <div class="content-block">
          <span class="mono-label">Soft Constraints</span>
          <ul class="constraint-list soft">
            ${data.soft_constraints.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
          </ul>
        </div>
      `
          : ''
      }

      ${
        data.assumptions && data.assumptions.length > 0
          ? `
        <div class="content-block">
          <span class="mono-label-muted">Assumptions</span>
          <ul class="constraint-list assumption">
            ${data.assumptions.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}
          </ul>
        </div>
      `
          : ''
      }
    </section>
  `;
}

function renderChallengeFrame(data?: ChallengeTheFrame[]): string {
  if (!data || data.length === 0) return '';

  return `
    <section class="section" id="challenge-frame">
      <h2 class="section-title">Challenge the Frame</h2>
      <div class="challenge-list">
        ${data
          .map(
            (item) => `
          <div class="challenge-item">
            ${item.assumption ? `<div class="challenge-assumption"><span class="mono-label">Assumption</span><p class="body-text">${escapeHtml(item.assumption)}</p></div>` : ''}
            ${item.challenge ? `<div class="challenge-challenge"><span class="mono-label">Challenge</span><p class="body-text">${escapeHtml(item.challenge)}</p></div>` : ''}
            ${item.implication ? `<div class="challenge-implication"><span class="mono-label-muted">Implication</span><p class="body-text-secondary">${escapeHtml(item.implication)}</p></div>` : ''}
          </div>
        `,
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderInnovationAnalysis(
  data?: InnovationAnalysis,
  domainsSearched?: string[],
): string {
  const hasReframe = data?.reframe && data.reframe.trim().length > 0;
  const hasDomains = domainsSearched && domainsSearched.length > 0;

  if (!hasReframe && !hasDomains) return '';

  return `
    <section class="section" id="innovation-analysis">
      <h2 class="section-title">Innovation Analysis</h2>

      ${
        hasReframe
          ? `
        <div class="content-block border-left">
          <span class="mono-label-muted">Reframe</span>
          <p class="body-text-lg">${escapeHtml(data?.reframe)}</p>
        </div>
      `
          : ''
      }

      ${
        hasDomains
          ? `
        <div class="content-block">
          <span class="mono-label">Domains Searched</span>
          <div class="domains-list">
            ${domainsSearched?.map((domain) => `<span class="domain-tag">${escapeHtml(domain)}</span>`).join('')}
          </div>
        </div>
      `
          : ''
      }
    </section>
  `;
}

function renderInsightBlock(insight?: InsightBlock): string {
  if (!insight) return '';

  return `
    <div class="insight-block">
      <span class="mono-label-muted">The Insight</span>
      ${insight.what ? `<p class="insight-what">${escapeHtml(insight.what, true)}</p>` : ''}
      ${
        insight.where_we_found_it
          ? `
        <div class="insight-source">
          ${insight.where_we_found_it.domain ? `<p><span class="label">Domain:</span> ${escapeHtml(insight.where_we_found_it.domain)}</p>` : ''}
          ${insight.where_we_found_it.how_they_use_it ? `<p><span class="label">How they use it:</span> ${escapeHtml(insight.where_we_found_it.how_they_use_it, true)}</p>` : ''}
          ${insight.where_we_found_it.why_it_transfers ? `<p><span class="label">Why it transfers:</span> ${escapeHtml(insight.where_we_found_it.why_it_transfers, true)}</p>` : ''}
        </div>
      `
          : ''
      }
      ${insight.why_industry_missed_it ? `<p class="insight-missed"><em>Why industry missed it:</em> ${escapeHtml(insight.why_industry_missed_it, true)}</p>` : ''}
      ${insight.physics ? `<div class="physics-box"><span class="label">Physics</span><code>${escapeHtml(insight.physics)}</code></div>` : ''}
    </div>
  `;
}

function renderValidationGates(gates?: ValidationGate[]): string {
  if (!gates || gates.length === 0) return '';

  return `
    <div class="validation-gates">
      <span class="mono-label">Validation Gates</span>
      <div class="gates-list">
        ${gates
          .map(
            (gate) => `
          <div class="gate-item">
            <div class="gate-header">
              <div class="gate-info">
                ${gate.week ? `<span class="gate-week">${escapeHtml(gate.week)}</span>` : ''}
                ${gate.test ? `<p class="gate-test">${escapeHtml(gate.test)}</p>` : ''}
              </div>
              ${gate.cost ? `<span class="gate-cost">${escapeHtml(gate.cost)}</span>` : ''}
            </div>
            ${gate.method ? `<p class="gate-detail"><span class="label">Method:</span> ${escapeHtml(gate.method)}</p>` : ''}
            ${gate.success_criteria ? `<p class="gate-detail"><span class="label">Success:</span> ${escapeHtml(gate.success_criteria)}</p>` : ''}
            ${gate.decision_point ? `<p class="gate-decision">${escapeHtml(gate.decision_point)}</p>` : ''}
          </div>
        `,
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderPrimaryRecommendation(data?: ExecutionTrackPrimary): string {
  if (!data) return '';

  return `
    <div class="primary-recommendation">
      <header class="recommendation-header">
        <span class="mono-label">Primary Recommendation</span>
        <h3 class="recommendation-title">${escapeHtml(data.title)}</h3>
        <div class="recommendation-meta">
          ${typeof data.source_type === 'string' ? `<span>${escapeHtml(data.source_type.replace(/_/g, ' '))}</span>` : ''}
          ${data.source ? `<span class="meta-separator">·</span><span>${escapeHtml(data.source)}</span>` : ''}
          ${data.confidence !== undefined ? `<span class="meta-separator">·</span><span class="confidence">${data.confidence}% confidence</span>` : ''}
        </div>
      </header>

      ${data.bottom_line ? `<div class="content-block"><span class="mono-label">Bottom Line</span><p class="body-text">${escapeHtml(data.bottom_line, true)}</p></div>` : ''}

      ${data.what_it_is ? `<div class="content-block"><span class="mono-label">What It Is</span><p class="body-text">${escapeHtml(data.what_it_is, true)}</p></div>` : ''}

      ${data.why_it_works ? `<div class="content-block"><span class="mono-label">Why It Works</span><p class="body-text">${escapeHtml(data.why_it_works, true)}</p></div>` : ''}

      ${renderInsightBlock(data.the_insight)}

      ${
        data.expected_improvement || data.timeline || data.investment
          ? `
        <div class="metrics-grid">
          ${data.expected_improvement ? `<div class="metric-item"><span class="mono-label-muted">Expected Improvement</span><p class="metric-value">${escapeHtml(data.expected_improvement)}</p></div>` : ''}
          ${data.timeline ? `<div class="metric-item"><span class="mono-label-muted">Timeline</span><p class="metric-value">${escapeHtml(data.timeline)}</p></div>` : ''}
          ${data.investment ? `<div class="metric-item"><span class="mono-label-muted">Investment</span><p class="metric-value">${escapeHtml(data.investment)}</p></div>` : ''}
        </div>
      `
          : ''
      }

      ${
        data.why_it_might_fail && data.why_it_might_fail.length > 0
          ? `
        <div class="warning-box">
          <span class="mono-label">Why It Might Fail</span>
          <ul class="warning-list">
            ${data.why_it_might_fail.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')}
          </ul>
        </div>
      `
          : ''
      }

      ${renderValidationGates(data.validation_gates)}
    </div>
  `;
}

function renderSupportingConcepts(concepts?: SupportingConcept[]): string {
  if (!concepts || concepts.length === 0) return '';

  return `
    <div class="supporting-concepts">
      <h3 class="subsection-title">Supporting Concepts</h3>
      <div class="concepts-list">
        ${concepts
          .map(
            (concept) => `
          <div class="concept-item">
            <div class="concept-header">
              <h4 class="concept-title">${escapeHtml(concept.title)}</h4>
              ${concept.relationship ? `<span class="concept-relationship">${escapeHtml(concept.relationship)}</span>` : ''}
            </div>
            ${concept.one_liner ? `<p class="concept-oneliner">${escapeHtml(concept.one_liner, true)}</p>` : ''}
            ${concept.what_it_is ? `<div class="concept-detail"><span class="mono-label">What It Is</span><p class="body-text">${escapeHtml(concept.what_it_is, true)}</p></div>` : ''}
            ${concept.why_it_works ? `<div class="concept-detail"><span class="mono-label">Why It Works</span><p class="body-text">${escapeHtml(concept.why_it_works, true)}</p></div>` : ''}
            ${concept.when_to_use_instead ? `<div class="concept-when"><span class="mono-label-muted">When to Use Instead</span><p class="body-text-secondary">${escapeHtml(concept.when_to_use_instead, true)}</p></div>` : ''}
          </div>
        `,
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderSolutionConcepts(data?: ExecutionTrack): string {
  if (!data) return '';

  return `
    <section class="section" id="solution-concepts">
      <h2 class="section-title">Solution Concepts</h2>

      ${data.intro ? `<p class="section-intro">${escapeHtml(data.intro)}</p>` : ''}

      ${renderPrimaryRecommendation(data.primary)}

      ${renderSupportingConcepts(data.supporting_concepts)}
    </section>
  `;
}

function renderRecommendedInnovation(data?: RecommendedInnovation): string {
  if (!data) return '';

  return `
    <div class="recommended-innovation">
      <header class="innovation-header">
        <span class="mono-label">Recommended Innovation</span>
        <h3 class="innovation-title">${escapeHtml(data.title)}</h3>
        <div class="innovation-meta">
          ${data.innovation_type ? `<span>${escapeHtml(data.innovation_type)}</span>` : ''}
          ${data.source_domain ? `<span class="meta-separator">·</span><span>${escapeHtml(data.source_domain)}</span>` : ''}
          ${data.confidence !== undefined ? `<span class="meta-separator">·</span><span class="confidence">${data.confidence}% confidence</span>` : ''}
        </div>
      </header>

      ${data.what_it_is ? `<div class="content-block"><span class="mono-label">What It Is</span><p class="body-text">${escapeHtml(data.what_it_is, true)}</p></div>` : ''}

      ${data.why_it_works ? `<div class="content-block"><span class="mono-label">Why It Works</span><p class="body-text">${escapeHtml(data.why_it_works, true)}</p></div>` : ''}

      ${renderInsightBlock(data.the_insight)}

      ${
        data.breakthrough_potential
          ? `
        <div class="breakthrough-box">
          <span class="mono-label">Breakthrough Potential</span>
          ${data.breakthrough_potential.if_it_works ? `<p class="body-text">${escapeHtml(data.breakthrough_potential.if_it_works, true)}</p>` : ''}
          ${data.breakthrough_potential.estimated_improvement ? `<p class="metric-highlight">${escapeHtml(data.breakthrough_potential.estimated_improvement)}</p>` : ''}
        </div>
      `
          : ''
      }

      ${
        data.validation_path
          ? `
        <div class="validation-path">
          <span class="mono-label">Validation Path</span>
          ${data.validation_path.first_test ? `<p class="body-text"><strong>First test:</strong> ${escapeHtml(data.validation_path.first_test)}</p>` : ''}
          <div class="validation-meta">
            ${data.validation_path.cost ? `<span>Cost: ${escapeHtml(data.validation_path.cost)}</span>` : ''}
            ${data.validation_path.timeline ? `<span>Timeline: ${escapeHtml(data.validation_path.timeline)}</span>` : ''}
          </div>
          ${data.validation_path.go_no_go ? `<p class="go-no-go">${escapeHtml(data.validation_path.go_no_go)}</p>` : ''}
        </div>
      `
          : ''
      }

      ${
        data.risks
          ? `
        <div class="warning-box">
          <span class="mono-label">Risks</span>
          ${
            data.risks.physics_risks && data.risks.physics_risks.length > 0
              ? `
            <div class="risk-section">
              <span class="risk-label">Physics Risks</span>
              <ul class="warning-list">${data.risks.physics_risks.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
            </div>
          `
              : ''
          }
          ${
            data.risks.implementation_challenges &&
            data.risks.implementation_challenges.length > 0
              ? `
            <div class="risk-section">
              <span class="risk-label">Implementation Challenges</span>
              <ul class="warning-list">${data.risks.implementation_challenges.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
            </div>
          `
              : ''
          }
        </div>
      `
          : ''
      }
    </div>
  `;
}

function renderParallelInvestigations(
  investigations?: ParallelInvestigation[],
): string {
  if (!investigations || investigations.length === 0) return '';

  return `
    <div class="parallel-investigations">
      <h3 class="subsection-title">Parallel Investigations</h3>
      <div class="investigations-list">
        ${investigations
          .map(
            (inv) => `
          <div class="investigation-item">
            <div class="investigation-header">
              <h4 class="investigation-title">${escapeHtml(inv.title)}</h4>
              ${inv.confidence !== undefined ? `<span class="confidence-badge">${inv.confidence}%</span>` : ''}
            </div>
            ${inv.one_liner ? `<p class="investigation-oneliner">${escapeHtml(inv.one_liner)}</p>` : ''}
            ${inv.what_it_is ? `<p class="body-text">${escapeHtml(inv.what_it_is)}</p>` : ''}
            ${inv.ceiling ? `<p class="ceiling"><strong>Ceiling:</strong> ${escapeHtml(inv.ceiling)}</p>` : ''}
            ${inv.key_uncertainty ? `<p class="uncertainty"><strong>Key uncertainty:</strong> ${escapeHtml(inv.key_uncertainty)}</p>` : ''}
          </div>
        `,
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderInnovationPortfolio(data?: InnovationPortfolio): string {
  if (!data) return '';

  return `
    <section class="section" id="innovation-portfolio">
      <h2 class="section-title">Innovation Portfolio</h2>

      ${data.intro ? `<p class="section-intro">${escapeHtml(data.intro)}</p>` : ''}

      ${renderRecommendedInnovation(data.recommended_innovation)}

      ${renderParallelInvestigations(data.parallel_investigations)}
    </section>
  `;
}

function renderFrontierTechnologies(data?: FrontierWatch[]): string {
  if (!data || data.length === 0) return '';

  return `
    <section class="section" id="frontier-technologies">
      <h2 class="section-title">Frontier Watch</h2>
      <p class="section-subtitle">Technologies worth monitoring.</p>

      <div class="frontier-grid">
        ${data
          .map(
            (tech) => `
          <div class="frontier-card">
            <div class="frontier-header">
              <div>
                <h4 class="frontier-title">${escapeHtml(tech.title)}</h4>
                ${tech.innovation_type ? `<span class="frontier-type">${escapeHtml(tech.innovation_type)}</span>` : ''}
              </div>
              ${
                tech.trl_estimate
                  ? `
                <div class="frontier-trl">
                  <span class="trl-label">TRL</span>
                  <span class="trl-value">${tech.trl_estimate}</span>
                </div>
              `
                  : ''
              }
            </div>

            ${tech.one_liner ? `<p class="frontier-oneliner">${escapeHtml(tech.one_liner)}</p>` : ''}

            ${tech.why_interesting ? `<div class="frontier-detail"><span class="mono-label-muted">Why Interesting</span><p class="body-text-secondary">${escapeHtml(tech.why_interesting)}</p></div>` : ''}

            ${tech.why_not_now ? `<div class="frontier-detail"><span class="mono-label-muted">Why Not Now</span><p class="body-text-secondary">${escapeHtml(tech.why_not_now)}</p></div>` : ''}

            <div class="frontier-meta">
              ${tech.trigger_to_revisit ? `<p><strong>Trigger:</strong> ${escapeHtml(tech.trigger_to_revisit)}</p>` : ''}
              ${tech.earliest_viability ? `<p><strong>Earliest viability:</strong> ${escapeHtml(tech.earliest_viability)}</p>` : ''}
              ${tech.who_to_monitor ? `<p><strong>Monitor:</strong> ${escapeHtml(tech.who_to_monitor)}</p>` : ''}
            </div>
          </div>
        `,
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderRisksWatchouts(data?: RiskAndWatchout[]): string {
  if (!data || data.length === 0) return '';

  return `
    <section class="section" id="risks-watchouts">
      <h2 class="section-title">Risks & Watchouts</h2>
      <div class="risks-list">
        ${data
          .map(
            (risk) => `
          <div class="risk-item ${sanitizeSeverity(risk.severity)}">
            <div class="risk-header">
              ${risk.category ? `<span class="risk-category">${escapeHtml(risk.category)}</span>` : ''}
              ${risk.severity ? `<span class="risk-severity ${sanitizeSeverity(risk.severity)}">${escapeHtml(risk.severity)} severity</span>` : ''}
            </div>
            <p class="risk-description">${escapeHtml(risk.risk)}</p>
            ${risk.mitigation ? `<p class="risk-mitigation"><strong>Mitigation:</strong> ${escapeHtml(risk.mitigation)}</p>` : ''}
          </div>
        `,
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderSelfCritique(data?: SelfCritique): string {
  if (!data) return '';

  return `
    <section class="section" id="self-critique">
      <h2 class="section-title">Self-Critique</h2>

      ${
        data.confidence_level || data.overall_confidence
          ? `
        <div class="confidence-box">
          <span class="mono-label">Confidence Level</span>
          <p class="confidence-value">${escapeHtml(toTitleCase(data.confidence_level || data.overall_confidence))}</p>
          ${data.confidence_rationale ? `<p class="body-text-secondary">${escapeHtml(data.confidence_rationale)}</p>` : ''}
        </div>
      `
          : ''
      }

      ${
        data.what_we_might_be_wrong_about &&
        data.what_we_might_be_wrong_about.length > 0
          ? `
        <div class="content-block">
          <span class="mono-label">What We Might Be Wrong About</span>
          <ul class="critique-list">
            ${data.what_we_might_be_wrong_about.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      `
          : ''
      }

      ${
        data.unexplored_directions && data.unexplored_directions.length > 0
          ? `
        <div class="content-block">
          <span class="mono-label">Unexplored Directions</span>
          <ul class="critique-list">
            ${data.unexplored_directions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      `
          : ''
      }

      ${
        data.validation_gaps && data.validation_gaps.length > 0
          ? `
        <div class="content-block">
          <span class="mono-label">Validation Gaps</span>
          <div class="validation-gaps">
            ${data.validation_gaps
              .map(
                (gap) => `
              <div class="gap-item ${sanitizeGapStatus(gap.status)}">
                <div class="gap-header">
                  <span class="gap-status">${escapeHtml(typeof gap.status === 'string' ? gap.status.replace('_', ' ') : '')}</span>
                </div>
                <p class="gap-concern">${escapeHtml(gap.concern)}</p>
                <p class="gap-rationale">${escapeHtml(gap.rationale)}</p>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }
    </section>
  `;
}

function renderRecommendation(
  whatIdActuallyDo?: string,
  personalRecommendation?: { intro?: string; key_insight?: string },
): string {
  if (!whatIdActuallyDo && !personalRecommendation) return '';

  return `
    <section class="section" id="recommendation">
      <h2 class="section-title">What I'd Actually Do</h2>

      ${whatIdActuallyDo ? `<p class="body-text-lg">${escapeHtml(whatIdActuallyDo)}</p>` : ''}

      ${
        personalRecommendation
          ? `
        <div class="personal-recommendation">
          ${personalRecommendation.intro ? `<p class="body-text">${escapeHtml(personalRecommendation.intro)}</p>` : ''}
          ${personalRecommendation.key_insight ? `<p class="key-insight">${escapeHtml(personalRecommendation.key_insight)}</p>` : ''}
        </div>
      `
          : ''
      }
    </section>
  `;
}

// ============================================
// MAIN RENDER FUNCTION
// ============================================

export function renderReportToHtml({
  reportData,
  title,
  brief,
  createdAt,
}: RenderOptions): string {
  // Normalize field names for backward compatibility with v3 schema
  const normalizedData = normalizeReportData(reportData);
  const readTime = calculateReadTime(normalizedData);

  // Extract domains searched from multiple possible locations
  const domainsSearched = extractDomainsSearched(normalizedData);

  const bodyContent = `
    ${renderHeader(title, createdAt, readTime)}
    ${renderBrief(brief)}
    ${renderExecutiveSummary(normalizedData.executive_summary)}
    ${renderProblemAnalysis(normalizedData.problem_analysis)}
    ${renderConstraints(normalizedData.constraints_and_metrics)}
    ${renderChallengeFrame(normalizedData.challenge_the_frame)}
    ${renderInnovationAnalysis(normalizedData.innovation_analysis, domainsSearched)}
    ${renderSolutionConcepts(normalizedData.execution_track)}
    ${renderInnovationPortfolio(normalizedData.innovation_portfolio)}
    ${renderFrontierTechnologies(normalizedData.innovation_portfolio?.frontier_watch)}
    ${renderRisksWatchouts(normalizedData.risks_and_watchouts)}
    ${renderSelfCritique(normalizedData.self_critique)}
    ${renderRecommendation(normalizedData.what_id_actually_do, normalizedData.strategic_integration?.personal_recommendation)}
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Report</title>
  <style>
${PRINT_STYLES}
  </style>
</head>
<body>
  <div class="report-container">
    ${bodyContent}
  </div>
</body>
</html>`;
}
