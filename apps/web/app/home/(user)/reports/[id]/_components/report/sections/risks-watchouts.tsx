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
            className="border border-zinc-200 rounded-xl p-5 space-y-4 hover:border-zinc-300 transition-colors"
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

            <p className="text-base text-zinc-600 leading-relaxed">
              {risk.description}
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 space-y-1">
                <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Mitigation
                </h4>
                <p className="text-sm text-zinc-600">{risk.mitigation}</p>
              </div>
              <div className="bg-red-50/50 border border-red-100 rounded-lg p-3 space-y-1">
                <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wider">
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
