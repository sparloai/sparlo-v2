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
            className="flex gap-4 p-4 border border-zinc-100 rounded-xl hover:border-zinc-200 transition-colors"
          >
            <div className="shrink-0 flex flex-col items-center gap-1">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 text-white text-sm font-bold">
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
              <p className="text-sm text-zinc-600 leading-relaxed">
                {step.details}
              </p>
            </div>
          </div>
        ))}
      </div>

      {data.decision_point && (
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">{data.decision_point.title}</h3>
          <p className="text-zinc-300 leading-relaxed">
            {data.decision_point.description}
          </p>
          {data.decision_point.cta_label && (
            <button className="px-4 py-2 bg-white text-zinc-900 rounded-lg font-medium text-sm hover:bg-zinc-100 transition-colors">
              {data.decision_point.cta_label}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
