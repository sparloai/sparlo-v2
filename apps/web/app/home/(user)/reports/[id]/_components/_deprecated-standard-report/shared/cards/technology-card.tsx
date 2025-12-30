import { BaseCard } from './base-card';

type MaturityLevel = 'emerging' | 'developing' | 'mature';

interface TechnologyCardProps {
  name: string;
  description: string;
  maturity?: MaturityLevel;
  applications?: string[];
  relevance?: string;
}

// Per Jobs Standard: muted colors, no icons, no borders
const maturityConfig = {
  emerging: {
    styles:
      'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400',
    label: 'Emerging',
  },
  developing: {
    styles:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    label: 'Developing',
  },
  mature: {
    styles:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
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

  return (
    <BaseCard variant="default" emphasis="subtle" className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
          {name}
        </h4>
        {maturityInfo && (
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${maturityInfo.styles}`}
          >
            {maturityInfo.label}
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {description}
      </p>

      {applications && applications.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
            Potential applications
          </h5>
          <ul className="space-y-2">
            {applications.map((app, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-400"
              >
                <span className="mt-2.5 h-px w-3 shrink-0 bg-zinc-400 dark:bg-zinc-500" />
                <span className="leading-relaxed">{app}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {relevance && (
        <div className="rounded-xl bg-zinc-50/50 p-4 dark:bg-zinc-800/30">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Relevance:
            </span>{' '}
            {relevance}
          </p>
        </div>
      )}
    </BaseCard>
  );
}
