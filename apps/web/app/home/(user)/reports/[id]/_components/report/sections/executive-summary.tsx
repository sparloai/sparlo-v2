import { ArrowRight, FileText } from 'lucide-react';

import type { ExecutiveSummary as ExecutiveSummaryType } from '../../../_lib/schema/sparlo-report.schema';
import { ViabilityBadge } from '../shared/badges/viability-badge';
import { SectionHeader } from '../shared/section-header';
import { SectionEmptyState } from '../shared/section-skeleton';

interface ExecutiveSummaryProps {
  data: ExecutiveSummaryType | null;
}

export function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  if (!data) {
    return (
      <section id="executive-summary" className="space-y-8">
        <SectionHeader
          id="executive-summary-header"
          title="Executive Summary"
          icon={FileText}
        />
        <SectionEmptyState message="Executive summary being prepared" />
      </section>
    );
  }

  return (
    <section id="executive-summary" className="space-y-8">
      <SectionHeader
        id="executive-summary-header"
        title="Executive Summary"
        icon={FileText}
      >
        <ViabilityBadge
          viability={data.viability}
          label={data.viability_label}
        />
      </SectionHeader>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* The Problem - Dark Box */}
        <div className="col-span-1 rounded-xl bg-zinc-900 p-6 md:col-span-2">
          <p className="text-lg leading-relaxed text-zinc-100">
            {data.the_problem}
          </p>
        </div>

        {/* Core Insight */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">
            The Core Insight
          </h3>
          <p className="text-xl font-semibold text-zinc-900">
            {data.core_insight.headline}
          </p>
          <p className="text-lg leading-relaxed text-zinc-600">
            {data.core_insight.explanation}
          </p>
        </div>

        {/* Recommended Path */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">
            Recommended Path
          </h3>
          <div className="space-y-3">
            {data.recommended_path.map((step) => (
              <div key={step.step_number} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                  {step.step_number}
                </span>
                <p className="text-base leading-relaxed text-zinc-600">
                  {step.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
