import type { RiskWatchout } from '../../../_lib/schema/sparlo-report.schema';
import { LikelihoodBadge } from '../shared/badges';
import { SectionHeader } from '../shared/section-header';

interface RisksWatchoutsProps {
  data: RiskWatchout[];
}

export function RisksWatchouts({ data }: RisksWatchoutsProps) {
  if (data.length === 0) return null;

  return (
    <section id="risks-watchouts" className="space-y-8">
      <SectionHeader id="risks-watchouts-header" title="Risks & Watchouts" />

      <div className="grid gap-4">
        {data.map((risk, index) => (
          <div
            key={index}
            className="space-y-4 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-300"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-zinc-900">
                {risk.name}
              </h3>
              <LikelihoodBadge
                color={risk.likelihood_color}
                label={risk.likelihood_label}
              />
            </div>

            <p className="text-base leading-relaxed text-zinc-600">
              {risk.description}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                <h4 className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
                  Mitigation
                </h4>
                <p className="text-sm text-zinc-600">{risk.mitigation}</p>
              </div>
              <div className="space-y-1 rounded-lg border border-red-100 bg-red-50/50 p-3">
                <h4 className="text-xs font-semibold tracking-wider text-red-700 uppercase">
                  Trigger
                </h4>
                <p className="text-sm text-zinc-600">{risk.trigger}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
