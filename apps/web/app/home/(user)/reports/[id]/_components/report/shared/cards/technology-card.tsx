import { Cpu, TrendingUp, Zap } from 'lucide-react';

import { BaseCard } from './base-card';

type MaturityLevel = 'emerging' | 'developing' | 'mature';

interface TechnologyCardProps {
  name: string;
  description: string;
  maturity?: MaturityLevel;
  applications?: string[];
  relevance?: string;
}

const maturityConfig = {
  emerging: {
    styles: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Zap,
    label: 'Emerging',
  },
  developing: {
    styles: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: TrendingUp,
    label: 'Developing',
  },
  mature: {
    styles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Cpu,
    label: 'Mature',
  },
} as const;

export function TechnologyCard({
  name,
  description,
  maturity,
  applications,
  relevance,
}: TechnologyCardProps) {
  const maturityInfo = maturity ? maturityConfig[maturity] : null;
  const MaturityIcon = maturityInfo?.icon;

  return (
    <BaseCard variant="default" emphasis="subtle" className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-zinc-400" strokeWidth={1.5} />
          <h4 className="font-semibold text-zinc-900">{name}</h4>
        </div>
        {maturityInfo && MaturityIcon && (
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${maturityInfo.styles}`}
          >
            <MaturityIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {maturityInfo.label}
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-600">{description}</p>

      {applications && applications.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            Potential Applications
          </h5>
          <ul className="space-y-1">
            {applications.map((app, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-zinc-600"
              >
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
                {app}
              </li>
            ))}
          </ul>
        </div>
      )}

      {relevance && (
        <div className="rounded-lg bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500">
            <span className="font-medium">Relevance:</span> {relevance}
          </p>
        </div>
      )}
    </BaseCard>
  );
}
