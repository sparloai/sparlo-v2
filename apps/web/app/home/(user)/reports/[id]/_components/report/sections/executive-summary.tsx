import type { ExecutiveSummary as ExecutiveSummaryType } from '../../../_lib/schema/sparlo-report.schema';

import { SectionHeader } from '../shared/section-header';
import { ViabilityBadge } from '../shared/badges';

interface ExecutiveSummaryProps {
  data: ExecutiveSummaryType;
}

export function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  return (
    <section id="executive-summary" className="space-y-8">
      <SectionHeader id="executive-summary-header" title="Executive Summary">
        <ViabilityBadge viability={data.viability} label={data.viability_label} />
      </SectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* The Problem - Dark Box */}
        <div className="col-span-1 md:col-span-2 flex gap-4 text-slate-950 bg-stone-950/95 border-red-100 border rounded-lg p-5 items-start">
          <div className="space-y-1">
            <p className="leading-relaxed text-base text-gray-50">
              {data.the_problem}
            </p>
          </div>
        </div>

        {/* Core Insight */}
        <div className="space-y-4">
          <h3 className="uppercase text-sm font-semibold text-zinc-400 tracking-wider">
            The Core Insight
          </h3>
          <p className="leading-relaxed text-base font-medium text-zinc-900">
            {data.core_insight.headline}
          </p>
          <p className="leading-relaxed text-base text-zinc-600">
            {data.core_insight.explanation}
          </p>
        </div>

        {/* Recommended Path */}
        <div className="space-y-4">
          <h3 className="uppercase text-sm font-semibold text-zinc-400 tracking-wider">
            Recommended Path
          </h3>
          <div className="space-y-3">
            {data.recommended_path.map((step) => (
              <div key={step.step_number} className="flex gap-3">
                <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 text-[10px] font-mono font-medium text-zinc-500 border border-zinc-200">
                  {step.step_number}
                </span>
                <p className="leading-relaxed text-sm text-zinc-600">
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
