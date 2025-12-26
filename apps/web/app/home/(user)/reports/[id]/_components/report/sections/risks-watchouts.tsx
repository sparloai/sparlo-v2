import { AlertTriangle, Shield, Zap } from 'lucide-react';

import type { RiskWatchout } from '../../../_lib/schema/sparlo-report.schema';
import { LikelihoodBadge } from '../shared/badges/likelihood-badge';
import { BaseCard } from '../shared/cards/base-card';
import { SectionHeader } from '../shared/section-header';
import { SectionEmptyState } from '../shared/section-skeleton';

interface RisksWatchoutsProps {
  data: RiskWatchout[] | null;
}

export function RisksWatchouts({ data }: RisksWatchoutsProps) {
  if (!data || data.length === 0) {
    return (
      <section id="risks-watchouts" className="space-y-8">
        <SectionHeader
          id="risks-watchouts-header"
          title="Risks & Watchouts"
          icon={AlertTriangle}
        />
        <SectionEmptyState message="Risk assessment pending" />
      </section>
    );
  }

  return (
    <section id="risks-watchouts" className="space-y-8">
      <SectionHeader
        id="risks-watchouts-header"
        title="Risks & Watchouts"
        icon={AlertTriangle}
        count={data.length}
      />

      <div className="grid gap-4">
        {data.map((risk, index) => (
          <BaseCard
            key={index}
            variant="default"
            emphasis="subtle"
            className="space-y-4 transition-colors hover:border-zinc-300"
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
              <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center gap-2">
                  <Shield
                    className="h-4 w-4 text-emerald-600"
                    strokeWidth={1.5}
                  />
                  <h4 className="text-xs font-semibold text-emerald-700">
                    Mitigation
                  </h4>
                </div>
                <p className="text-sm text-zinc-600">{risk.mitigation}</p>
              </div>
              <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50/50 p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-rose-600" strokeWidth={1.5} />
                  <h4 className="text-xs font-semibold text-rose-700">
                    Trigger
                  </h4>
                </div>
                <p className="text-sm text-zinc-600">{risk.trigger}</p>
              </div>
            </div>
          </BaseCard>
        ))}
      </div>
    </section>
  );
}
