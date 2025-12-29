import { Building2, Layers } from 'lucide-react';

import type { KeyPattern } from '../../../_lib/schema/sparlo-report.schema';
import { BaseCard } from '../shared/cards/base-card';
import { SectionHeader } from '../shared/section-header';
import { SectionEmptyState } from '../shared/section-skeleton';

interface KeyPatternsProps {
  data: KeyPattern[] | null;
}

export function KeyPatterns({ data }: KeyPatternsProps) {
  if (!data || data.length === 0) {
    return (
      <section id="key-patterns" className="space-y-8">
        <SectionHeader
          id="key-patterns-header"
          title="Key Patterns"
          icon={Layers}
        />
        <SectionEmptyState message="Pattern analysis pending" />
      </section>
    );
  }

  return (
    <section id="key-patterns" className="space-y-8">
      <SectionHeader
        id="key-patterns-header"
        title="Key Patterns"
        icon={Layers}
        count={data.length}
      />

      <div className="grid gap-6">
        {data.map((pattern) => (
          <BaseCard
            key={pattern.id}
            variant="default"
            emphasis="subtle"
            className="space-y-4 transition-colors hover:border-zinc-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs text-zinc-400">{pattern.id}</span>
                <h3 className="mt-1 text-lg font-semibold text-zinc-900">
                  {pattern.name}
                </h3>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600">
                <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                {pattern.source_industry}
              </span>
            </div>

            <p className="text-base leading-relaxed text-zinc-600">
              {pattern.description}
            </p>

            <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h4 className="text-xs font-semibold text-zinc-500">
                Why it matters
              </h4>
              <p className="text-sm text-zinc-700">{pattern.why_it_matters}</p>
            </div>

            {pattern.patent_refs && pattern.patent_refs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pattern.patent_refs.map((ref, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 font-mono text-xs text-zinc-500"
                  >
                    {ref}
                  </span>
                ))}
              </div>
            )}
          </BaseCard>
        ))}
      </div>
    </section>
  );
}
