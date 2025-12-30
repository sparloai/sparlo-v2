import 'server-only';

import type {
  ChallengeTheFrame,
  ConstraintsAndMetrics,
  ExecutionTrack,
  ExecutionTrackPrimary,
  HybridReportData,
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
} from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

import { LOGO_BASE64, PRINT_STYLES } from './print-styles';

interface RenderOptions {
  reportData: HybridReportData;
  title: string;
  brief?: string;
  createdAt?: string;
}

/**
 * Calculate estimated read time based on word count.
 */
function calculateReadTime(data: HybridReportData): number {
  const textParts: string[] = [];

  function isProseContent(str: string): boolean {
    if (str.length < 20) return false;
    if (/^https?:\/\//.test(str)) return false;
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        str,
      )
    )
      return false;
    const letterRatio = (str.match(/[a-zA-Z]/g) || []).length / str.length;
    if (letterRatio < 0.5) return false;
    if (!str.includes(' ')) return false;
    return true;
  }

  function extractText(value: unknown): void {
    if (value === null || value === undefined) return;

    if (typeof value === 'string' && isProseContent(value)) {
      textParts.push(value);
    } else if (Array.isArray(value)) {
      value.forEach(extractText);
    } else if (typeof value === 'object') {
      Object.values(value).forEach(extractText);
    }
  }

  extractText(data);
  const text = textParts.join(' ');
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.round(wordCount / 200));
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

function sanitizeSeverity(severity: string | undefined | null): string {
  if (!severity) return 'medium';
  const normalized = severity.toLowerCase().trim();
  return VALID_SEVERITIES.includes(
    normalized as (typeof VALID_SEVERITIES)[number],
  )
    ? normalized
    : 'medium';
}

function sanitizeGapStatus(status: string | undefined | null): string {
  if (!status) return 'open';
  const normalized = status.toLowerCase().replace(/_/g, '-').trim();
  return VALID_GAP_STATUSES.includes(
    normalized as (typeof VALID_GAP_STATUSES)[number],
  )
    ? normalized
    : 'open';
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
        data.viability
          ? `
        <div class="viability-box">
          ${data.viability_label ? `<span class="mono-label">${escapeHtml(data.viability_label)}</span>` : ''}
          <p class="body-text-lg">${escapeHtml(data.viability)}</p>
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

function renderInsightBlock(insight?: InsightBlock): string {
  if (!insight) return '';

  return `
    <div class="insight-block">
      <span class="mono-label-muted">The Insight</span>
      ${insight.what ? `<p class="insight-what">${escapeHtml(insight.what)}</p>` : ''}
      ${
        insight.where_we_found_it
          ? `
        <div class="insight-source">
          ${insight.where_we_found_it.domain ? `<p><span class="label">Domain:</span> ${escapeHtml(insight.where_we_found_it.domain)}</p>` : ''}
          ${insight.where_we_found_it.how_they_use_it ? `<p><span class="label">How they use it:</span> ${escapeHtml(insight.where_we_found_it.how_they_use_it)}</p>` : ''}
          ${insight.where_we_found_it.why_it_transfers ? `<p><span class="label">Why it transfers:</span> ${escapeHtml(insight.where_we_found_it.why_it_transfers)}</p>` : ''}
        </div>
      `
          : ''
      }
      ${insight.why_industry_missed_it ? `<p class="insight-missed"><em>Why industry missed it:</em> ${escapeHtml(insight.why_industry_missed_it)}</p>` : ''}
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
          ${data.source_type ? `<span>${escapeHtml(data.source_type.replace(/_/g, ' '))}</span>` : ''}
          ${data.source ? `<span class="meta-separator">·</span><span>${escapeHtml(data.source)}</span>` : ''}
          ${data.confidence !== undefined ? `<span class="meta-separator">·</span><span class="confidence">${data.confidence}% confidence</span>` : ''}
        </div>
      </header>

      ${data.bottom_line ? `<div class="content-block"><span class="mono-label">Bottom Line</span><p class="body-text">${escapeHtml(data.bottom_line)}</p></div>` : ''}

      ${data.what_it_is ? `<div class="content-block"><span class="mono-label">What It Is</span><p class="body-text">${escapeHtml(data.what_it_is)}</p></div>` : ''}

      ${data.why_it_works ? `<div class="content-block"><span class="mono-label">Why It Works</span><p class="body-text">${escapeHtml(data.why_it_works)}</p></div>` : ''}

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
            ${concept.one_liner ? `<p class="concept-oneliner">${escapeHtml(concept.one_liner)}</p>` : ''}
            ${concept.what_it_is ? `<div class="concept-detail"><span class="mono-label">What It Is</span><p class="body-text">${escapeHtml(concept.what_it_is)}</p></div>` : ''}
            ${concept.why_it_works ? `<div class="concept-detail"><span class="mono-label">Why It Works</span><p class="body-text">${escapeHtml(concept.why_it_works)}</p></div>` : ''}
            ${concept.when_to_use_instead ? `<div class="concept-when"><span class="mono-label-muted">When to Use Instead</span><p class="body-text-secondary">${escapeHtml(concept.when_to_use_instead)}</p></div>` : ''}
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

      ${data.what_it_is ? `<div class="content-block"><span class="mono-label">What It Is</span><p class="body-text">${escapeHtml(data.what_it_is)}</p></div>` : ''}

      ${data.why_it_works ? `<div class="content-block"><span class="mono-label">Why It Works</span><p class="body-text">${escapeHtml(data.why_it_works)}</p></div>` : ''}

      ${renderInsightBlock(data.the_insight)}

      ${
        data.breakthrough_potential
          ? `
        <div class="breakthrough-box">
          <span class="mono-label">Breakthrough Potential</span>
          ${data.breakthrough_potential.if_it_works ? `<p class="body-text">${escapeHtml(data.breakthrough_potential.if_it_works)}</p>` : ''}
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
          <p class="confidence-value">${escapeHtml(data.confidence_level || data.overall_confidence)}</p>
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
                  <span class="gap-status">${escapeHtml(gap.status.replace('_', ' '))}</span>
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
  const readTime = calculateReadTime(reportData);

  const bodyContent = `
    ${renderHeader(title, createdAt, readTime)}
    ${renderBrief(brief)}
    ${renderExecutiveSummary(reportData.executive_summary)}
    ${renderProblemAnalysis(reportData.problem_analysis)}
    ${renderConstraints(reportData.constraints_and_metrics)}
    ${renderChallengeFrame(reportData.challenge_the_frame)}
    ${renderSolutionConcepts(reportData.execution_track)}
    ${renderInnovationPortfolio(reportData.innovation_portfolio)}
    ${renderRisksWatchouts(reportData.risks_and_watchouts)}
    ${renderSelfCritique(reportData.self_critique)}
    ${renderRecommendation(reportData.what_id_actually_do, reportData.strategic_integration?.personal_recommendation)}
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
