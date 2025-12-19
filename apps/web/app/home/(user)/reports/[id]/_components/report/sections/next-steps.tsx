import type {
  DecisionPoint,
  NextStep,
} from '../../../_lib/schema/sparlo-report.schema';
import { SectionHeader } from '../shared/section-header';

interface NextStepsProps {
  data: {
    steps: NextStep[];
    decision_point?: DecisionPoint;
  };
}

export function NextSteps({ data }: NextStepsProps) {
  return (
    <section id="next-steps" className="space-y-8">
      <SectionHeader id="next-steps-header" title="Next Steps" />

      <div className="space-y-4">
        {data.steps.map((step) => (
          <div
            key={step.step_number}
            className="flex gap-4 rounded-xl border border-zinc-100 p-4 transition-colors hover:border-zinc-200"
          >
            <div className="flex shrink-0 flex-col items-center gap-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
                {step.step_number}
              </span>
              <span className="text-xs font-medium text-zinc-400">
                {step.timeframe}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-semibold text-zinc-900">
                {step.action}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-600">
                {step.details}
              </p>
            </div>
          </div>
        ))}
      </div>

      {data.decision_point && (
        <div className="space-y-4 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 text-white">
          <h3 className="text-lg font-semibold">{data.decision_point.title}</h3>
          <p className="leading-relaxed text-zinc-300">
            {data.decision_point.description}
          </p>
          {data.decision_point.cta_label && (
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100">
              {data.decision_point.cta_label}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
