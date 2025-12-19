import type {
  InnovationConcept,
  LeadConcept,
  OtherConcept,
  SolutionConcepts as SolutionConceptsType,
} from '../../../_lib/schema/sparlo-report.schema';

import { ConfidenceBadge, TrackBadge } from '../shared/badges';
import { SectionHeader } from '../shared/section-header';
import { TestGate } from '../shared/test-gate';

interface SolutionConceptsProps {
  data: SolutionConceptsType;
}

function LeadConceptCard({ concept }: { concept: LeadConcept }) {
  return (
    <div className="border-2 border-emerald-100 bg-emerald-50/30 rounded-xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrackBadge track={concept.track} label={concept.track_label} />
            <ConfidenceBadge level={concept.confidence} />
          </div>
          <h3 className="text-xl font-semibold text-zinc-900">
            {concept.title}
          </h3>
        </div>
        <span className="text-xs font-mono text-zinc-400">{concept.id}</span>
      </div>

      <p className="text-base font-medium text-zinc-800 bg-white/50 rounded-lg p-4 border border-emerald-100">
        {concept.bottom_line}
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            What It Is
          </h4>
          <p className="text-sm text-zinc-600 leading-relaxed">
            {concept.what_it_is}
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Why It Works
          </h4>
          <p className="text-sm text-zinc-600 leading-relaxed">
            {concept.why_it_works}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Confidence Rationale
        </h4>
        <p className="text-sm text-zinc-600">{concept.confidence_rationale}</p>
        <p className="text-sm text-zinc-500 italic">
          <span className="font-medium">What would change this:</span>{' '}
          {concept.what_would_change_this}
        </p>
      </div>

      {concept.key_risks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Key Risks
          </h4>
          <div className="grid gap-2">
            {concept.key_risks.map((risk, i) => (
              <div
                key={i}
                className="flex gap-3 p-3 bg-white rounded-lg border border-zinc-100"
              >
                <span className="shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-red-400" />
                <div className="flex-1">
                  <p className="text-sm text-zinc-700">{risk.risk}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Mitigation: {risk.mitigation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          How to Test
        </h4>
        <div className="grid gap-4">
          {concept.how_to_test.map((gate) => (
            <TestGate key={gate.gate_id} gate={gate} />
          ))}
        </div>
      </div>
    </div>
  );
}

function OtherConceptCard({ concept }: { concept: OtherConcept }) {
  return (
    <div className="border border-zinc-200 rounded-xl p-5 space-y-4 hover:border-zinc-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrackBadge track={concept.track} label={concept.track_label} />
            <ConfidenceBadge level={concept.confidence} />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">
            {concept.title}
          </h3>
        </div>
        <span className="text-xs font-mono text-zinc-400">{concept.id}</span>
      </div>

      <p className="text-sm font-medium text-zinc-700">{concept.bottom_line}</p>
      <p className="text-sm text-zinc-600">{concept.what_it_is}</p>

      <div className="bg-zinc-50 rounded-lg p-3 space-y-1">
        <p className="text-xs text-zinc-500">{concept.confidence_rationale}</p>
        <p className="text-xs font-medium text-amber-700">
          Critical validation: {concept.critical_validation}
        </p>
      </div>
    </div>
  );
}

function InnovationConceptCard({ concept }: { concept: InnovationConcept }) {
  return (
    <div className="border-2 border-purple-100 bg-purple-50/30 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded uppercase tracking-wider">
          Innovation Spark
        </span>
        <ConfidenceBadge level={concept.confidence} />
      </div>

      <h3 className="text-lg font-semibold text-zinc-900">{concept.title}</h3>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-purple-600 uppercase">
            Why Interesting
          </h4>
          <p className="text-sm text-zinc-600">{concept.why_interesting}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-purple-600 uppercase">
            Why Uncertain
          </h4>
          <p className="text-sm text-zinc-600">{concept.why_uncertain}</p>
        </div>
      </div>

      <div className="space-y-2 bg-white/50 rounded-lg p-3">
        <p className="text-xs text-zinc-500">
          <span className="font-medium">When to pursue:</span>{' '}
          {concept.when_to_pursue}
        </p>
        <p className="text-xs font-medium text-purple-700">
          Critical validation: {concept.critical_validation}
        </p>
      </div>
    </div>
  );
}

export function SolutionConcepts({ data }: SolutionConceptsProps) {
  return (
    <section id="solution-concepts" className="space-y-8">
      <SectionHeader id="solution-concepts-header" title="Solution Concepts" />

      {/* Lead Concepts */}
      <div className="space-y-6">
        <h3 className="uppercase text-sm font-semibold text-emerald-600 tracking-wider">
          Lead Concepts
        </h3>
        {data.lead_concepts.map((concept) => (
          <LeadConceptCard key={concept.id} concept={concept} />
        ))}
      </div>

      {/* Other Concepts */}
      {data.other_concepts.length > 0 && (
        <div className="space-y-4">
          <h3 className="uppercase text-sm font-semibold text-zinc-400 tracking-wider">
            Other Concepts
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {data.other_concepts.map((concept) => (
              <OtherConceptCard key={concept.id} concept={concept} />
            ))}
          </div>
        </div>
      )}

      {/* Innovation Concept */}
      {data.innovation_concept && (
        <div className="space-y-4">
          <InnovationConceptCard concept={data.innovation_concept} />
        </div>
      )}

      {/* Comparison Table */}
      <div className="space-y-4">
        <h3 className="uppercase text-sm font-semibold text-zinc-400 tracking-wider">
          Concept Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left py-3 px-4 font-semibold text-zinc-500">
                  Concept
                </th>
                <th className="text-left py-3 px-4 font-semibold text-zinc-500">
                  Key Metric
                </th>
                <th className="text-left py-3 px-4 font-semibold text-zinc-500">
                  Confidence
                </th>
                <th className="text-left py-3 px-4 font-semibold text-zinc-500">
                  Capital
                </th>
                <th className="text-left py-3 px-4 font-semibold text-zinc-500">
                  Timeline
                </th>
                <th className="text-left py-3 px-4 font-semibold text-zinc-500">
                  Key Risk
                </th>
              </tr>
            </thead>
            <tbody>
              {data.comparison_table.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-zinc-100 hover:bg-zinc-50"
                >
                  <td className="py-3 px-4 font-medium text-zinc-900">
                    {row.title}
                  </td>
                  <td className="py-3 px-4 text-zinc-600">
                    {row.key_metric_achievable}
                  </td>
                  <td className="py-3 px-4">
                    <ConfidenceBadge level={row.confidence} />
                  </td>
                  <td className="py-3 px-4 text-zinc-600">
                    {row.capital_required}
                  </td>
                  <td className="py-3 px-4 text-zinc-600">{row.timeline}</td>
                  <td className="py-3 px-4 text-zinc-500 text-xs">
                    {row.key_risk}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-zinc-600 italic">{data.comparison_insight}</p>
      </div>
    </section>
  );
}
