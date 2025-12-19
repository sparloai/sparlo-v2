'use client';

import type { Report } from '~/lib/llm/prompts/an5-report';

import {
  Badge,
  getConfidenceVariant,
  getLikelihoodVariant,
  getVerdictVariant,
} from './badge';
import {
  ConceptCard,
  OtherConceptCard,
  SparkConceptCard,
} from './concept-card';

interface StructuredReportProps {
  report: Report;
  userInput: string;
}

export function StructuredReport({ report, userInput }: StructuredReportProps) {
  return (
    <article className="report-page">
      <div className="report-content">
        <div className="report-container">
          {/* Report Header */}
          <header className="report-header animate-fade-in">
            <div className="report-header-meta">
              <span className="report-header-type">
                SPARLO INTELLIGENCE BRIEFING
              </span>
              <span className="report-header-timestamp">
                {new Date(report.generated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <h1 className="report-header-title">{report.title}</h1>
            <p className="report-header-subtitle">{report.subtitle}</p>
            <blockquote className="report-header-quote">
              <span className="report-header-quote-mark">&ldquo;</span>
              {userInput}
              <span className="report-header-quote-mark">&rdquo;</span>
            </blockquote>
          </header>

          {/* Executive Briefing */}
          <section className="report-section executive-briefing animate-fade-in-up animate-delay-1">
            <div className="section-header section-header--violet">
              <span className="section-header-label">Executive Briefing</span>
              <div className="section-header-line" />
            </div>

            <div className="executive-verdict">
              <Badge
                variant={getVerdictVariant(
                  report.executive_summary.viability_verdict,
                )}
              >
                {report.executive_summary.viability_verdict}
              </Badge>
            </div>

            <p className="executive-essence">
              {report.executive_summary.problem_essence}
            </p>

            <div className="callout callout--insight">
              <p className="callout-label">Key Insight</p>
              <p className="callout-text">
                {report.executive_summary.key_insight}
              </p>
            </div>

            <div className="executive-recommendation">
              <p className="executive-recommendation-label">
                Primary Recommendation
              </p>
              <p className="executive-recommendation-text">
                {report.executive_summary.primary_recommendation}
              </p>
            </div>

            <p className="executive-fallback">
              <span className="executive-fallback-label">Fallback:</span>{' '}
              {report.executive_summary.fallback_summary}
            </p>

            <p className="executive-rationale">
              {report.executive_summary.viability_rationale}
            </p>
          </section>

          <div className="section-divider">
            <div className="section-divider-line" />
          </div>

          {/* Constraints */}
          <section className="report-section constraints-section animate-fade-in-up animate-delay-2">
            <div className="section-header">
              <span className="section-header-label">Constraints</span>
              <div className="section-header-line" />
            </div>

            <div className="constraints-grid">
              <div className="constraints-column constraints-column--user">
                <h3 className="constraints-column-header">From Your Input</h3>
                <ul className="constraints-list">
                  {report.constraints.from_user_input.map((item, i) => (
                    <li key={i} className="constraint-item">
                      <p className="constraint-text">{item.constraint}</p>
                      <p className="constraint-interpretation">
                        &rarr; {item.interpretation}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="constraints-column constraints-column--assumed">
                <h3 className="constraints-column-header">Assumptions Made</h3>
                <ul className="constraints-list">
                  {report.constraints.assumptions_made.map((item, i) => (
                    <li
                      key={i}
                      className="constraint-item constraint-item--warning"
                    >
                      <p className="constraint-text">{item.assumption}</p>
                      <p className="constraint-flag">
                        &#9888; {item.flag_if_incorrect}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="constraints-summary">
              {report.constraints.constraint_summary}
            </p>
          </section>

          <div className="section-divider">
            <div className="section-divider-line" />
          </div>

          {/* Problem Analysis */}
          <section className="report-section problem-analysis animate-fade-in-up">
            <div className="section-header">
              <span className="section-header-label">Problem Analysis</span>
              <div className="section-header-line" />
            </div>

            <div className="problem-core">
              <p className="problem-core-label">
                What&apos;s Actually Going Wrong
              </p>
              <p className="problem-core-text">
                {report.problem_analysis.what_is_actually_going_wrong}
              </p>
            </div>

            <div className="problem-difficulty">
              <h3 className="module-section-label">Why It&apos;s Hard</h3>
              <p className="module-section-content">
                {report.problem_analysis.why_its_hard}
              </p>
            </div>

            <div className="problem-revelation">
              <p className="problem-revelation-label">
                From-Scratch Revelation
              </p>
              <p className="problem-revelation-text">
                {report.problem_analysis.from_scratch_revelation}
              </p>
            </div>

            {/* Root Cause Hypotheses */}
            <div className="problem-hypotheses">
              <h3 className="module-section-label">Root Cause Hypotheses</h3>
              <ol className="hypotheses-list">
                {report.problem_analysis.root_cause_hypotheses.map((hyp, i) => (
                  <li key={i} className="hypothesis-item">
                    <span className="hypothesis-number">{i + 1}</span>
                    <div className="hypothesis-content">
                      <div className="hypothesis-header">
                        <p className="hypothesis-text">{hyp.hypothesis}</p>
                        <Badge variant={getConfidenceVariant(hyp.confidence)}>
                          {hyp.confidence}
                        </Badge>
                      </div>
                      <p className="hypothesis-explanation">
                        {hyp.explanation}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Success Metrics */}
            <div className="problem-metrics">
              <h3 className="module-section-label">Success Metrics</h3>
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {report.problem_analysis.success_metrics.map((m, i) => (
                    <tr key={i}>
                      <td>{m.metric}</td>
                      <td>{m.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="section-divider">
            <div className="section-divider-line" />
          </div>

          {/* Key Patterns */}
          <section className="report-section patterns-section animate-fade-in-up">
            <div className="section-header">
              <span className="section-header-label">Key Patterns</span>
              <div className="section-header-line" />
            </div>

            <div className="patterns-grid">
              {report.key_patterns.map((pattern, i) => (
                <div key={i} className="pattern-card">
                  <h3 className="pattern-name">{pattern.pattern_name}</h3>
                  <p className="pattern-description">{pattern.what_it_is}</p>
                  <p className="pattern-relevance">
                    <span className="pattern-relevance-label">
                      Why it matters:
                    </span>{' '}
                    {pattern.why_it_matters_here}
                  </p>
                  <p className="pattern-meta">
                    From: {pattern.where_it_comes_from} &bull; Precedent:{' '}
                    {pattern.precedent}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="section-divider">
            <div className="section-divider-line" />
          </div>

          {/* Solution Concepts */}
          <section className="report-section concepts-section animate-fade-in-up">
            <div className="section-header section-header--violet">
              <span className="section-header-label">Solution Concepts</span>
              <div className="section-header-line" />
            </div>

            {/* Lead Concepts */}
            <div className="concepts-group">
              <h3 className="concepts-group-label">Lead Concepts</h3>
              <div className="module-stack">
                {report.solution_concepts.lead_concepts.map((concept) => (
                  <ConceptCard key={concept.id} concept={concept} isLead />
                ))}
              </div>
            </div>

            {/* Other Concepts */}
            {report.solution_concepts.other_concepts.length > 0 && (
              <div className="concepts-group">
                <h3 className="concepts-group-label">Other Concepts</h3>
                <div className="module-grid module-grid--2">
                  {report.solution_concepts.other_concepts.map((concept) => (
                    <OtherConceptCard key={concept.id} concept={concept} />
                  ))}
                </div>
              </div>
            )}

            {/* Spark Concept */}
            {report.solution_concepts.spark_concept && (
              <div className="concepts-group">
                <h3 className="concepts-group-label concepts-group-label--spark">
                  Spark Concept
                </h3>
                <SparkConceptCard
                  concept={report.solution_concepts.spark_concept}
                />
              </div>
            )}
          </section>

          <div className="section-divider">
            <div className="section-divider-line" />
          </div>

          {/* Concept Comparison */}
          <section className="report-section animate-fade-in-up">
            <div className="section-header">
              <span className="section-header-label">Concept Comparison</span>
              <div className="section-header-line" />
            </div>

            <div className="comparison-wrapper">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Concept</th>
                    <th>Key Metric</th>
                    <th>Confidence</th>
                    <th>Capital</th>
                    <th>Timeline</th>
                    <th>Key Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {report.concept_comparison.comparison_table.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <span className="comparison-id">{row.id}</span>{' '}
                        <span className="comparison-title">{row.title}</span>
                      </td>
                      <td>{row.key_metric_achievable}</td>
                      <td>
                        <Badge variant={getConfidenceVariant(row.confidence)}>
                          {row.confidence}
                        </Badge>
                      </td>
                      <td>{row.capital_required}</td>
                      <td>{row.timeline}</td>
                      <td className="comparison-risk">{row.key_risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="comparison-insight">
              {report.concept_comparison.key_insight}
            </p>
          </section>

          <div className="section-divider">
            <div className="section-divider-line" />
          </div>

          {/* Decision Architecture */}
          <section className="report-section decision-architecture animate-fade-in-up">
            <div className="section-header section-header--violet">
              <span className="section-header-label">
                Decision Architecture
              </span>
              <div className="section-header-line" />
            </div>

            <p className="decision-primary">
              {report.decision_architecture.primary_decision}
            </p>

            {/* Decision Tree */}
            <div className="decision-tree">
              {report.decision_architecture.decision_tree.map((node, i) => (
                <div key={i} className="decision-node">
                  <p className="decision-condition">{node.condition}</p>
                  <p className="decision-then">
                    &rarr; <span>{node.then}</span>
                  </p>
                  <p className="decision-otherwise">
                    Otherwise: {node.otherwise}
                  </p>
                </div>
              ))}
            </div>

            <div className="decision-summary">
              <div className="decision-summary-item decision-summary-item--primary">
                <p className="decision-summary-label">Primary Path</p>
                <p className="decision-summary-text">
                  {report.decision_architecture.primary_path}
                </p>
              </div>
              <div className="decision-summary-item decision-summary-item--fallback">
                <p className="decision-summary-label">Fallback Path</p>
                <p className="decision-summary-text">
                  {report.decision_architecture.fallback_path}
                </p>
              </div>
              <div className="decision-summary-item decision-summary-item--parallel">
                <p className="decision-summary-label">Parallel Bet</p>
                <p className="decision-summary-text">
                  {report.decision_architecture.parallel_bet}
                </p>
              </div>
            </div>
          </section>

          <div className="section-divider">
            <div className="section-divider-line" />
          </div>

          {/* Action Plan / What I'd Actually Do */}
          <section className="report-section action-plan animate-fade-in-up">
            <div className="section-header">
              <span className="section-header-label">Action Plan</span>
              <div className="section-header-line" />
            </div>

            <p className="action-intro">{report.what_id_actually_do.intro}</p>

            <div className="action-timeline">
              {report.what_id_actually_do.week_by_week.map((week, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-badge">{week.timeframe}</div>
                  <div className="timeline-content">
                    <ul className="timeline-actions">
                      {week.actions.map((action, j) => (
                        <li key={j}>{action}</li>
                      ))}
                    </ul>
                    <p className="timeline-decision">
                      Decision point: {week.decision_point}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="action-investment">
              <span className="action-investment-label">
                Investment summary:
              </span>{' '}
              {report.what_id_actually_do.investment_summary}
            </div>
          </section>

          <div className="section-divider">
            <div className="section-divider-line" />
          </div>

          {/* Risks & Watchouts */}
          <section className="report-section risks-section animate-fade-in-up">
            <div className="section-header">
              <span className="section-header-label">
                Risks &amp; Watchouts
              </span>
              <div className="section-header-line" />
            </div>

            <div className="module-stack">
              {report.risks_and_watchouts.map((risk, i) => (
                <div key={i} className="risk-card">
                  <div className="risk-header">
                    <h3 className="risk-name">{risk.risk_name}</h3>
                    <Badge variant={getLikelihoodVariant(risk.likelihood)}>
                      {risk.likelihood}
                    </Badge>
                  </div>
                  <p className="risk-description">{risk.description}</p>
                  <div className="risk-details">
                    <div className="risk-mitigation">
                      <p className="risk-detail-label">Mitigation</p>
                      <p className="risk-detail-text">{risk.mitigation}</p>
                    </div>
                    <div className="risk-trigger">
                      <p className="risk-detail-label">Trigger</p>
                      <p className="risk-detail-text">{risk.trigger}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="section-divider">
            <div className="section-divider-line" />
          </div>

          {/* Next Steps */}
          <section className="report-section next-steps animate-fade-in-up">
            <div className="section-header section-header--violet">
              <span className="section-header-label">Next Steps</span>
              <div className="section-header-line" />
            </div>

            <ol className="steps-list">
              {report.next_steps.map((step) => (
                <li key={step.step_number} className="step-item">
                  <span className="step-number">{step.step_number}</span>
                  <div className="step-content">
                    <p className="step-action">{step.action}</p>
                    <p className="step-purpose">{step.purpose}</p>
                    <span className="step-when">{step.when}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="section-divider">
            <div className="section-divider-line" />
          </div>

          {/* Challenge the Frame */}
          <section className="report-section challenge-section animate-fade-in-up">
            <div className="section-header">
              <span className="section-header-label">Challenge the Frame</span>
              <div className="section-header-line" />
            </div>

            <div className="challenge-list">
              {report.challenge_the_frame.map((challenge, i) => (
                <div key={i} className="challenge-item">
                  <p className="challenge-question">{challenge.question}</p>
                  <p className="challenge-implication">
                    <span className="challenge-label">Implication:</span>{' '}
                    {challenge.implication}
                  </p>
                  <p className="challenge-test">
                    <span className="challenge-label">Test:</span>{' '}
                    {challenge.how_to_test}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
