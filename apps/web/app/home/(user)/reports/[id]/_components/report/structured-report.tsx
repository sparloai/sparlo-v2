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
    <article className="mx-auto max-w-[760px] space-y-12">
      {/* Problem Header */}
      <header className="space-y-4">
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight text-[--text-primary]">
          {report.title}
        </h1>
        <p className="text-lg text-[--text-muted]">{report.subtitle}</p>
        <blockquote className="border-l-2 border-[--accent]/50 bg-[--accent-muted] py-3 pr-3 pl-4 text-sm text-[--text-secondary] italic">
          &ldquo;{userInput}&rdquo;
        </blockquote>
        <p className="text-xs text-[--text-muted]">
          Generated {new Date(report.generated_at).toLocaleDateString()}
        </p>
      </header>

      <hr className="border-[--border-default]" />

      {/* Executive Summary */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-[22px] font-semibold text-[--text-primary]">
            Executive Summary
          </h2>
          <Badge
            variant={getVerdictVariant(
              report.executive_summary.viability_verdict,
            )}
          >
            {report.executive_summary.viability_verdict}
          </Badge>
        </div>

        <p className="mb-6 text-base leading-relaxed text-[--text-secondary]">
          {report.executive_summary.problem_essence}
        </p>

        <div className="mb-6 rounded-xl border-l-4 border-[--accent] bg-[--accent-muted] p-5">
          <p className="text-xs font-semibold tracking-wider text-[--accent] uppercase">
            Key Insight
          </p>
          <p className="mt-2 text-base leading-relaxed font-medium text-[--text-primary]">
            {report.executive_summary.key_insight}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-base text-[--text-secondary]">
            <span className="font-semibold">Recommendation:</span>{' '}
            {report.executive_summary.primary_recommendation}
          </p>
          <p className="text-sm text-[--text-muted]">
            <span className="font-medium">Fallback:</span>{' '}
            {report.executive_summary.fallback_summary}
          </p>
        </div>

        <p className="mt-4 text-sm text-[--text-muted] italic">
          {report.executive_summary.viability_rationale}
        </p>
      </section>

      <hr className="border-[--border-default]" />

      {/* Constraints */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-[--text-primary]">
          Constraints
        </h2>

        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold tracking-wider text-[--text-muted] uppercase">
              From Your Input
            </h3>
            <ul className="space-y-3">
              {report.constraints.from_user_input.map((item, i) => (
                <li key={i} className="rounded-lg bg-[--surface-overlay] p-3">
                  <p className="text-sm font-medium text-[--text-primary]">
                    {item.constraint}
                  </p>
                  <p className="mt-1 text-xs text-[--text-muted]">
                    &rarr; {item.interpretation}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold tracking-wider text-[--text-muted] uppercase">
              Assumptions Made
            </h3>
            <ul className="space-y-3">
              {report.constraints.assumptions_made.map((item, i) => (
                <li key={i} className="rounded-lg bg-[--status-warning]/10 p-3">
                  <p className="text-sm font-medium text-[--text-primary]">
                    {item.assumption}
                  </p>
                  <p className="mt-1 text-xs text-[--status-warning]">
                    &#9888; {item.flag_if_incorrect}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-sm text-[--text-secondary]">
          {report.constraints.constraint_summary}
        </p>
      </section>

      <hr className="border-[--border-default]" />

      {/* Problem Analysis */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-[--text-primary]">
          Problem Analysis
        </h2>

        <div className="mb-6 rounded-xl bg-[--status-error]/10 p-5">
          <p className="text-xs font-semibold tracking-wider text-[--status-error] uppercase">
            What&apos;s Actually Going Wrong
          </p>
          <p className="mt-2 text-base font-medium text-[--text-primary]">
            {report.problem_analysis.what_is_actually_going_wrong}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold tracking-wider text-[--text-muted] uppercase">
            Why It&apos;s Hard
          </h3>
          <p className="text-base leading-relaxed text-[--text-secondary]">
            {report.problem_analysis.why_its_hard}
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-[--accent]/30 bg-[--accent-muted] p-5">
          <p className="text-xs font-semibold tracking-wider text-[--accent] uppercase">
            From-Scratch Revelation
          </p>
          <p className="mt-2 text-sm text-[--text-secondary]">
            {report.problem_analysis.from_scratch_revelation}
          </p>
        </div>

        {/* Root Cause Hypotheses */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold tracking-wider text-[--text-muted] uppercase">
            Root Cause Hypotheses
          </h3>
          <ol className="space-y-3">
            {report.problem_analysis.root_cause_hypotheses.map((hyp, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-lg bg-[--surface-overlay] p-4"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[--border-default] text-xs font-semibold text-[--text-secondary]">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[--text-primary]">
                      {hyp.hypothesis}
                    </p>
                    <Badge variant={getConfidenceVariant(hyp.confidence)}>
                      {hyp.confidence}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-[--text-secondary]">
                    {hyp.explanation}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Success Metrics */}
        <div>
          <h3 className="mb-3 text-sm font-semibold tracking-wider text-[--text-muted] uppercase">
            Success Metrics
          </h3>
          <div className="overflow-hidden rounded-lg border border-[--border-default]">
            <table className="min-w-full text-sm">
              <thead className="bg-[--surface-overlay]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-[--text-muted] uppercase">
                    Metric
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-[--text-muted] uppercase">
                    Target
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border-subtle]">
                {report.problem_analysis.success_metrics.map((m, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-[--text-secondary]">
                      {m.metric}
                    </td>
                    <td className="px-4 py-3 font-medium text-[--text-primary]">
                      {m.target}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <hr className="border-[--border-default]" />

      {/* Key Patterns */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-[--text-primary]">
          Key Patterns
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {report.key_patterns.map((pattern, i) => (
            <div
              key={i}
              className="rounded-xl border border-[--border-default] bg-[--surface-elevated] p-5"
            >
              <h3 className="mb-2 font-semibold text-[--text-primary]">
                {pattern.pattern_name}
              </h3>
              <p className="mb-3 text-sm text-[--text-secondary]">
                {pattern.what_it_is}
              </p>
              <p className="mb-2 text-sm text-[--text-muted]">
                <span className="font-medium">Why it matters:</span>{' '}
                {pattern.why_it_matters_here}
              </p>
              <p className="text-xs text-[--text-muted]">
                From: {pattern.where_it_comes_from} &bull; Precedent:{' '}
                {pattern.precedent}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-[--border-default]" />

      {/* Solution Concepts */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-[--text-primary]">
          Solution Concepts
        </h2>

        {/* Lead Concepts */}
        <div className="mb-8 space-y-6">
          <h3 className="text-lg font-semibold text-[--text-secondary]">
            Lead Concepts
          </h3>
          {report.solution_concepts.lead_concepts.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} isLead />
          ))}
        </div>

        {/* Other Concepts */}
        {report.solution_concepts.other_concepts.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-[--text-secondary]">
              Other Concepts
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {report.solution_concepts.other_concepts.map((concept) => (
                <OtherConceptCard key={concept.id} concept={concept} />
              ))}
            </div>
          </div>
        )}

        {/* Spark Concept */}
        {report.solution_concepts.spark_concept && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-[--text-secondary]">
              Spark Concept
            </h3>
            <SparkConceptCard
              concept={report.solution_concepts.spark_concept}
            />
          </div>
        )}
      </section>

      <hr className="border-[--border-default]" />

      {/* Concept Comparison */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-[--text-primary]">
          Concept Comparison
        </h2>
        <div className="mb-4 overflow-x-auto rounded-lg border border-[--border-default]">
          <table className="min-w-full text-sm">
            <thead className="bg-[--surface-overlay]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-[--text-muted] uppercase">
                  Concept
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-[--text-muted] uppercase">
                  Key Metric
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-[--text-muted] uppercase">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-[--text-muted] uppercase">
                  Capital
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-[--text-muted] uppercase">
                  Timeline
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-[--text-muted] uppercase">
                  Key Risk
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border-subtle]">
              {report.concept_comparison.comparison_table.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[--text-muted]">
                      {row.id}
                    </span>{' '}
                    <span className="font-medium text-[--text-primary]">
                      {row.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[--text-secondary]">
                    {row.key_metric_achievable}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getConfidenceVariant(row.confidence)}>
                      {row.confidence}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[--text-secondary]">
                    {row.capital_required}
                  </td>
                  <td className="px-4 py-3 text-[--text-secondary]">
                    {row.timeline}
                  </td>
                  <td className="px-4 py-3 text-sm text-[--text-muted]">
                    {row.key_risk}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm font-medium text-[--text-secondary]">
          {report.concept_comparison.key_insight}
        </p>
      </section>

      <hr className="border-[--border-default]" />

      {/* Decision Architecture */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-[--text-primary]">
          Decision Architecture
        </h2>

        <p className="mb-6 text-lg font-medium text-[--text-primary]">
          {report.decision_architecture.primary_decision}
        </p>

        {/* Decision Tree as styled blocks */}
        <div className="mb-6 space-y-3">
          {report.decision_architecture.decision_tree.map((node, i) => (
            <div
              key={i}
              className="rounded-lg border border-[--border-default] bg-[--surface-overlay] p-4"
            >
              <p className="text-sm font-semibold text-[--accent]">
                {node.condition}
              </p>
              <p className="mt-1 text-sm text-[--text-secondary]">
                &rarr; <span className="font-medium">{node.then}</span>
              </p>
              <p className="mt-1 text-xs text-[--text-muted]">
                Otherwise: {node.otherwise}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-[--accent-muted] p-4">
            <p className="text-xs font-semibold tracking-wider text-[--accent] uppercase">
              Primary Path
            </p>
            <p className="mt-1 text-sm text-[--text-secondary]">
              {report.decision_architecture.primary_path}
            </p>
          </div>
          <div className="rounded-lg bg-[--status-warning]/10 p-4">
            <p className="text-xs font-semibold tracking-wider text-[--status-warning] uppercase">
              Fallback Path
            </p>
            <p className="mt-1 text-sm text-[--text-secondary]">
              {report.decision_architecture.fallback_path}
            </p>
          </div>
          <div className="rounded-lg bg-[--surface-overlay] p-4">
            <p className="text-xs font-semibold tracking-wider text-[--text-muted] uppercase">
              Parallel Bet
            </p>
            <p className="mt-1 text-sm text-[--text-secondary]">
              {report.decision_architecture.parallel_bet}
            </p>
          </div>
        </div>
      </section>

      <hr className="border-[--border-default]" />

      {/* What I'd Actually Do */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-[--text-primary]">
          What I&apos;d Actually Do
        </h2>

        <p className="mb-6 text-base text-[--text-secondary] italic">
          {report.what_id_actually_do.intro}
        </p>

        {/* Timeline */}
        <div className="mb-6 space-y-4">
          {report.what_id_actually_do.week_by_week.map((week, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0">
                <span className="inline-block rounded-full bg-[--accent-muted] px-3 py-1 text-sm font-semibold text-[--accent]">
                  {week.timeframe}
                </span>
              </div>
              <div className="flex-1">
                <ul className="mb-2 list-inside list-disc space-y-1 text-sm text-[--text-secondary]">
                  {week.actions.map((action, j) => (
                    <li key={j}>{action}</li>
                  ))}
                </ul>
                <p className="text-xs font-medium text-[--text-muted]">
                  Decision point: {week.decision_point}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-[--surface-overlay] p-4">
          <p className="text-sm text-[--text-secondary]">
            <span className="font-semibold">Investment summary:</span>{' '}
            {report.what_id_actually_do.investment_summary}
          </p>
        </div>
      </section>

      <hr className="border-[--border-default]" />

      {/* Challenge the Frame */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-[--text-primary]">
          Challenge the Frame
        </h2>
        <div className="space-y-4">
          {report.challenge_the_frame.map((challenge, i) => (
            <div
              key={i}
              className="rounded-lg border-l-2 border-[--status-warning] bg-[--status-warning]/10 py-4 pr-5 pl-4"
            >
              <p className="text-base font-medium text-[--text-primary] italic">
                {challenge.question}
              </p>
              <p className="mt-2 text-sm text-[--text-secondary]">
                <span className="font-medium">Implication:</span>{' '}
                {challenge.implication}
              </p>
              <p className="mt-1 text-sm text-[--text-muted]">
                <span className="font-medium">Test:</span>{' '}
                {challenge.how_to_test}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-[--border-default]" />

      {/* Risks & Watchouts */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-[--text-primary]">
          Risks &amp; Watchouts
        </h2>
        <div className="space-y-4">
          {report.risks_and_watchouts.map((risk, i) => (
            <div
              key={i}
              className="rounded-xl border border-[--border-default] bg-[--surface-elevated] p-5"
            >
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-semibold text-[--text-primary]">
                  {risk.risk_name}
                </h3>
                <Badge variant={getLikelihoodVariant(risk.likelihood)}>
                  {risk.likelihood}
                </Badge>
              </div>
              <p className="mb-3 text-sm text-[--text-secondary]">
                {risk.description}
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-[--surface-overlay] p-3">
                  <p className="text-xs font-semibold tracking-wider text-[--text-muted] uppercase">
                    Mitigation
                  </p>
                  <p className="mt-1 text-sm text-[--text-secondary]">
                    {risk.mitigation}
                  </p>
                </div>
                <div className="rounded-lg bg-[--status-error]/10 p-3">
                  <p className="text-xs font-semibold tracking-wider text-[--status-error] uppercase">
                    Trigger
                  </p>
                  <p className="mt-1 text-sm text-[--status-error]/90">
                    {risk.trigger}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-[--border-default]" />

      {/* Next Steps */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-[--text-primary]">
          Next Steps
        </h2>
        <ol className="space-y-4">
          {report.next_steps.map((step) => (
            <li key={step.step_number} className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[--accent-muted] text-sm font-semibold text-[--accent]">
                {step.step_number}
              </span>
              <div className="flex-1">
                <p className="font-medium text-[--text-primary]">
                  {step.action}
                </p>
                <p className="mt-1 text-sm text-[--text-muted]">
                  {step.purpose}
                </p>
                <span className="mt-1 inline-block rounded-full bg-[--surface-overlay] px-2 py-0.5 text-xs font-medium text-[--text-secondary]">
                  {step.when}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
