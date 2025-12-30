import type { ChallengeFrame as ChallengeFrameType } from '../../../_lib/schema/sparlo-report.schema';
import { SectionHeader } from '../shared/section-header';

interface ChallengeFrameProps {
  data: ChallengeFrameType[];
}

export function ChallengeFrame({ data }: ChallengeFrameProps) {
  if (data.length === 0) return null;

  return (
    <section id="challenge-frame" className="space-y-8">
      <SectionHeader id="challenge-frame-header" title="Challenge the Frame" />

      <div className="grid gap-6">
        {data.map((item, index) => (
          <div
            key={index}
            className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/30 p-6"
          >
            <div className="flex items-start gap-3">
              <span className="shrink-0 text-xl text-amber-500">?</span>
              <h3 className="text-lg font-semibold text-zinc-900">
                {item.question}
              </h3>
            </div>

            <p className="pl-8 text-base leading-relaxed text-zinc-600">
              {item.implication}
            </p>

            <div className="ml-8 rounded-lg border border-amber-100 bg-white p-4">
              <span className="text-xs font-semibold text-amber-600">
                {item.action_or_test.label}
              </span>
              <p className="mt-1 text-sm text-zinc-700">
                {item.action_or_test.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
