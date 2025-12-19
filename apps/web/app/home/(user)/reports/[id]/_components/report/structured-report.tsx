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
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight text-gray-900">
          {report.title}
        </h1>
        <p className="text-lg text-gray-500">{report.subtitle}</p>
        <blockquote className="border-l-2 border-violet-300 bg-violet-50/50 py-3 pr-3 pl-4 text-sm text-gray-600 italic">
          &ldquo;{userInput}&rdquo;
        </blockquote>
        <p className="text-xs text-gray-400">
          Generated {new Date(report.generated_at).toLocaleDateString()}
        </p>
      </header>

      <hr className="border-gray-200" />

      {/* Executive Summary */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-[22px] font-semibold text-gray-900">
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

        <p className="mb-6 text-base leading-relaxed text-gray-700">
          {report.executive_summary.problem_essence}
        </p>

        <div className="mb-6 rounded-xl border-l-4 border-violet-500 bg-violet-50 p-5">
          <p className="text-xs font-semibold tracking-wider text-violet-600 uppercase">
            Key Insight
          </p>
          <p className="mt-2 text-base leading-relaxed font-medium text-gray-800">
            {report.executive_summary.key_insight}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-base text-gray-700">
            <span className="font-semibold">Recommendation:</span>{' '}
            {report.executive_summary.primary_recommendation}
          </p>
          <p className="text-sm text-gray-500">
            <span className="font-medium">Fallback:</span>{' '}
            {report.executive_summary.fallback_summary}
          </p>
        </div>

        <p className="mt-4 text-sm text-gray-500 italic">
          {report.executive_summary.viability_rationale}
        </p>
      </section>

      <hr className="border-gray-200" />

      {/* Constraints */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          Constraints
        </h2>

        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
              From Your Input
            </h3>
            <ul className="space-y-3">
              {report.constraints.from_user_input.map((item, i) => (
                <li key={i} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm font-medium text-gray-800">
                    {item.constraint}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    &rarr; {item.interpretation}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
              Assumptions Made
            </h3>
            <ul className="space-y-3">
              {report.constraints.assumptions_made.map((item, i) => (
                <li key={i} className="rounded-lg bg-amber-50 p-3">
                  <p className="text-sm font-medium text-gray-800">
                    {item.assumption}
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    &#9888; {item.flag_if_incorrect}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          {report.constraints.constraint_summary}
        </p>
      </section>

      <hr className="border-gray-200" />

      {/* Problem Analysis */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          Problem Analysis
        </h2>

        <div className="mb-6 rounded-xl bg-red-50 p-5">
          <p className="text-xs font-semibold tracking-wider text-red-600 uppercase">
            What&apos;s Actually Going Wrong
          </p>
          <p className="mt-2 text-base font-medium text-gray-800">
            {report.problem_analysis.what_is_actually_going_wrong}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold tracking-wider text-gray-500 uppercase">
            Why It&apos;s Hard
          </h3>
          <p className="text-base leading-relaxed text-gray-700">
            {report.problem_analysis.why_its_hard}
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50/50 p-5">
          <p className="text-xs font-semibold tracking-wider text-violet-600 uppercase">
            From-Scratch Revelation
          </p>
          <p className="mt-2 text-sm text-gray-700">
            {report.problem_analysis.from_scratch_revelation}
          </p>
        </div>

        {/* Root Cause Hypotheses */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
            Root Cause Hypotheses
          </h3>
          <ol className="space-y-3">
            {report.problem_analysis.root_cause_hypotheses.map((hyp, i) => (
              <li key={i} className="flex gap-3 rounded-lg bg-gray-50 p-4">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800">
                      {hyp.hypothesis}
                    </p>
                    <Badge variant={getConfidenceVariant(hyp.confidence)}>
                      {hyp.confidence}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {hyp.explanation}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Success Metrics */}
        <div>
          <h3 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
            Success Metrics
          </h3>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Metric
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Target
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.problem_analysis.success_metrics.map((m, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-gray-700">{m.metric}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {m.target}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* Key Patterns */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          Key Patterns
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {report.key_patterns.map((pattern, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <h3 className="mb-2 font-semibold text-gray-900">
                {pattern.pattern_name}
              </h3>
              <p className="mb-3 text-sm text-gray-600">{pattern.what_it_is}</p>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-medium">Why it matters:</span>{' '}
                {pattern.why_it_matters_here}
              </p>
              <p className="text-xs text-gray-400">
                From: {pattern.where_it_comes_from} &bull; Precedent:{' '}
                {pattern.precedent}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* Solution Concepts */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          Solution Concepts
        </h2>

        {/* Lead Concepts */}
        <div className="mb-8 space-y-6">
          <h3 className="text-lg font-semibold text-gray-700">Lead Concepts</h3>
          {report.solution_concepts.lead_concepts.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} isLead />
          ))}
        </div>

        {/* Other Concepts */}
        {report.solution_concepts.other_concepts.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-gray-700">
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
            <h3 className="mb-4 text-lg font-semibold text-gray-700">
              Spark Concept
            </h3>
            <SparkConceptCard
              concept={report.solution_concepts.spark_concept}
            />
          </div>
        )}
      </section>

      <hr className="border-gray-200" />

      {/* Concept Comparison */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          Concept Comparison
        </h2>
        <div className="mb-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Concept
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Key Metric
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Capital
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Timeline
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Key Risk
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {report.concept_comparison.comparison_table.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-400">
                      {row.id}
                    </span>{' '}
                    <span className="font-medium text-gray-900">
                      {row.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.key_metric_achievable}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getConfidenceVariant(row.confidence)}>
                      {row.confidence}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.capital_required}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.timeline}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {row.key_risk}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm font-medium text-gray-700">
          {report.concept_comparison.key_insight}
        </p>
      </section>

      <hr className="border-gray-200" />

      {/* Decision Architecture */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          Decision Architecture
        </h2>

        <p className="mb-6 text-lg font-medium text-gray-800">
          {report.decision_architecture.primary_decision}
        </p>

        {/* Decision Tree as styled blocks */}
        <div className="mb-6 space-y-3">
          {report.decision_architecture.decision_tree.map((node, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <p className="text-sm font-semibold text-violet-700">
                {node.condition}
              </p>
              <p className="mt-1 text-sm text-gray-700">
                &rarr; <span className="font-medium">{node.then}</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Otherwise: {node.otherwise}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-violet-50 p-4">
            <p className="text-xs font-semibold tracking-wider text-violet-600 uppercase">
              Primary Path
            </p>
            <p className="mt-1 text-sm text-gray-700">
              {report.decision_architecture.primary_path}
            </p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase">
              Fallback Path
            </p>
            <p className="mt-1 text-sm text-gray-700">
              {report.decision_architecture.fallback_path}
            </p>
          </div>
          <div className="rounded-lg bg-gray-100 p-4">
            <p className="text-xs font-semibold tracking-wider text-gray-600 uppercase">
              Parallel Bet
            </p>
            <p className="mt-1 text-sm text-gray-700">
              {report.decision_architecture.parallel_bet}
            </p>
          </div>
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* What I'd Actually Do */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          What I&apos;d Actually Do
        </h2>

        <p className="mb-6 text-base text-gray-600 italic">
          {report.what_id_actually_do.intro}
        </p>

        {/* Timeline */}
        <div className="mb-6 space-y-4">
          {report.what_id_actually_do.week_by_week.map((week, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0">
                <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700">
                  {week.timeframe}
                </span>
              </div>
              <div className="flex-1">
                <ul className="mb-2 list-inside list-disc space-y-1 text-sm text-gray-700">
                  {week.actions.map((action, j) => (
                    <li key={j}>{action}</li>
                  ))}
                </ul>
                <p className="text-xs font-medium text-gray-500">
                  Decision point: {week.decision_point}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-gray-100 p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Investment summary:</span>{' '}
            {report.what_id_actually_do.investment_summary}
          </p>
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* Challenge the Frame */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          Challenge the Frame
        </h2>
        <div className="space-y-4">
          {report.challenge_the_frame.map((challenge, i) => (
            <div
              key={i}
              className="rounded-lg border-l-2 border-amber-400 bg-amber-50 py-4 pr-5 pl-4"
            >
              <p className="text-base font-medium text-gray-800 italic">
                {challenge.question}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Implication:</span>{' '}
                {challenge.implication}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                <span className="font-medium">Test:</span>{' '}
                {challenge.how_to_test}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* Risks & Watchouts */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          Risks &amp; Watchouts
        </h2>
        <div className="space-y-4">
          {report.risks_and_watchouts.map((risk, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">
                  {risk.risk_name}
                </h3>
                <Badge variant={getLikelihoodVariant(risk.likelihood)}>
                  {risk.likelihood}
                </Badge>
              </div>
              <p className="mb-3 text-sm text-gray-600">{risk.description}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Mitigation
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {risk.mitigation}
                  </p>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-xs font-semibold tracking-wider text-red-600 uppercase">
                    Trigger
                  </p>
                  <p className="mt-1 text-sm text-red-800">{risk.trigger}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* Next Steps */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          Next Steps
        </h2>
        <ol className="space-y-4">
          {report.next_steps.map((step) => (
            <li key={step.step_number} className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                {step.step_number}
              </span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{step.action}</p>
                <p className="mt-1 text-sm text-gray-500">{step.purpose}</p>
                <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
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
