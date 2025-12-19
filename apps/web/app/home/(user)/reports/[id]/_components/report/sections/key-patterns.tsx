import type { KeyPattern } from '../../../_lib/schema/sparlo-report.schema';
import { SectionHeader } from '../shared/section-header';

interface KeyPatternsProps {
  data: KeyPattern[];
}

export function KeyPatterns({ data }: KeyPatternsProps) {
  if (data.length === 0) return null;

  return (
    <section id="key-patterns" className="space-y-8">
      <SectionHeader id="key-patterns-header" title="Key Patterns" />

      <div className="grid gap-6">
        {data.map((pattern) => (
          <div
            key={pattern.id}
            className="space-y-4 rounded-xl border border-zinc-100 p-6 transition-colors hover:border-zinc-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-xs tracking-wider text-zinc-400 uppercase">
                  {pattern.id}
                </span>
                <h3 className="mt-1 text-lg font-semibold text-zinc-900">
                  {pattern.name}
                </h3>
              </div>
              <span className="shrink-0 rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500">
                {pattern.source_industry}
              </span>
            </div>

            <p className="text-base leading-relaxed text-zinc-600">
              {pattern.description}
            </p>

            <div className="space-y-2 rounded-lg bg-zinc-50 p-4">
              <h4 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                Why It Matters
              </h4>
              <p className="text-sm text-zinc-700">{pattern.why_it_matters}</p>
            </div>

            {pattern.patent_refs && pattern.patent_refs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pattern.patent_refs.map((ref, i) => (
                  <span
                    key={i}
                    className="rounded bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-500"
                  >
                    {ref}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
