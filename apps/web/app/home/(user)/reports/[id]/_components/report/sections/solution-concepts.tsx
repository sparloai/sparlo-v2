import { Lightbulb } from 'lucide-react';

import type { SolutionConcepts as SolutionConceptsType } from '../../../_lib/schema/sparlo-report.schema';
import { ConfidenceBadge } from '../shared/badges/confidence-badge';
import { InnovationConceptCard } from '../shared/cards/innovation-concept-card';
import {
  LeadConceptCard,
  OtherConceptCard,
} from '../shared/cards/solution-concept-card';
import { SectionHeader } from '../shared/section-header';
import { SectionEmptyState } from '../shared/section-skeleton';

interface SolutionConceptsProps {
  data: SolutionConceptsType | null;
}

export function SolutionConcepts({ data }: SolutionConceptsProps) {
  if (!data) {
    return (
      <section id="solution-concepts" className="space-y-8">
        <SectionHeader
          id="solution-concepts-header"
          title="Solution Concepts"
          icon={Lightbulb}
        />
        <SectionEmptyState message="Solution concepts being developed" />
      </section>
    );
  }

  const totalConcepts =
    data.lead_concepts.length +
    data.other_concepts.length +
    (data.innovation_concept ? 1 : 0);

  return (
    <section id="solution-concepts" className="space-y-8">
      <SectionHeader
        id="solution-concepts-header"
        title="Solution Concepts"
        icon={Lightbulb}
        count={totalConcepts}
      />

      {/* Lead Concepts */}
      {data.lead_concepts.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">
            Lead Concepts
          </h3>
          {data.lead_concepts.map((concept) => (
            <LeadConceptCard key={concept.id} concept={concept} />
          ))}
        </div>
      )}

      {/* Other Concepts */}
      {data.other_concepts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            Other Concepts
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
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
      {data.comparison_table.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            Concept Comparison
          </h3>
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="sticky left-0 bg-zinc-50 px-4 py-3 text-left font-semibold text-zinc-700">
                    Concept
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                    Key Metric
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                    Confidence
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                    Capital
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                    Timeline
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                    Key Risk
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.comparison_table.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50">
                    <td className="sticky left-0 bg-white px-4 py-3 font-medium text-zinc-900">
                      {row.title}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {row.key_metric_achievable}
                    </td>
                    <td className="px-4 py-3">
                      <ConfidenceBadge level={row.confidence} />
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {row.capital_required}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{row.timeline}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {row.key_risk}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-zinc-600 italic">
            {data.comparison_insight}
          </p>
        </div>
      )}
    </section>
  );
}
