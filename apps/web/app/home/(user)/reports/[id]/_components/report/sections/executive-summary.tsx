import type { ExecutiveSummary as ExecutiveSummaryType } from '../../../_lib/schema/sparlo-report.schema';
import { ViabilityBadge } from '../shared/badges';
import { SectionHeader } from '../shared/section-header';

interface ExecutiveSummaryProps {
  data: ExecutiveSummaryType;
}

export function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  return (
    <section id="executive-summary" className="space-y-8">
      <SectionHeader id="executive-summary-header" title="Executive Summary">
        <ViabilityBadge
          viability={data.viability}
          label={data.viability_label}
        />
      </SectionHeader>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* The Problem - Dark Box */}
        <div className="col-span-1 flex items-start gap-4 rounded-lg border border-red-100 bg-stone-950/95 p-5 text-slate-950 md:col-span-2">
          <div className="space-y-1">
            <p className="text-base leading-relaxed text-gray-50">
              {data.the_problem}
            </p>
          </div>
        </div>

        {/* Core Insight */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
            The Core Insight
          </h3>
          <p className="text-base leading-relaxed font-medium text-zinc-900">
            {data.core_insight.headline}
          </p>
          <p className="text-base leading-relaxed text-zinc-600">
            {data.core_insight.explanation}
          </p>
        </div>

        {/* Recommended Path */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
            Recommended Path
          </h3>
          <div className="space-y-3">
            {data.recommended_path.map((step) => (
              <div key={step.step_number} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 font-mono text-[10px] font-medium text-zinc-500">
                  {step.step_number}
                </span>
                <p className="text-sm leading-relaxed text-zinc-600">
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
