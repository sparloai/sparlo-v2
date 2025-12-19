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
            className="border border-zinc-100 rounded-xl p-6 hover:border-zinc-200 transition-colors space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  {pattern.id}
                </span>
                <h3 className="text-lg font-semibold text-zinc-900 mt-1">
                  {pattern.name}
                </h3>
              </div>
              <span className="shrink-0 text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded">
                {pattern.source_industry}
              </span>
            </div>

            <p className="text-base text-zinc-600 leading-relaxed">
              {pattern.description}
            </p>

            <div className="bg-zinc-50 rounded-lg p-4 space-y-2">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Why It Matters
              </h4>
              <p className="text-sm text-zinc-700">{pattern.why_it_matters}</p>
            </div>

            {pattern.patent_refs && pattern.patent_refs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pattern.patent_refs.map((ref, i) => (
                  <span
                    key={i}
                    className="text-xs font-mono text-zinc-500 bg-zinc-100 px-2 py-1 rounded"
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
