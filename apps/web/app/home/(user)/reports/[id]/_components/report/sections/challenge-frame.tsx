import type { ChallengeFrame as ChallengeFrameType } from '../../../_lib/schema/sparlo-report.schema';

import { SectionHeader } from '../shared/section-header';

interface ChallengeFrameProps {
  data: ChallengeFrameType[];
}

export function ChallengeFrame({ data }: ChallengeFrameProps) {
  if (data.length === 0) return null;

  return (
    <section id="challenge-frame" className="space-y-8">
      <SectionHeader
        id="challenge-frame-header"
        title="Challenge the Frame"
      />

      <div className="grid gap-6">
        {data.map((item, index) => (
          <div
            key={index}
            className="border border-amber-200 bg-amber-50/30 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-start gap-3">
              <span className="shrink-0 text-amber-500 text-xl">?</span>
              <h3 className="text-lg font-semibold text-zinc-900">
                {item.question}
              </h3>
            </div>

            <p className="text-base text-zinc-600 leading-relaxed pl-8">
              {item.implication}
            </p>

            <div className="ml-8 bg-white rounded-lg p-4 border border-amber-100">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                {item.action_or_test.label}
              </span>
              <p className="text-sm text-zinc-700 mt-1">
                {item.action_or_test.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
