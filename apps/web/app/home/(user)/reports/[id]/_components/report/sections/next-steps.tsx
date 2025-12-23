import { ArrowRight, Clock, Flag } from 'lucide-react';

import type {
  DecisionPoint,
  NextStep,
} from '../../../_lib/schema/sparlo-report.schema';
import { BaseCard } from '../shared/cards/base-card';
import { SectionHeader } from '../shared/section-header';
import { SectionEmptyState } from '../shared/section-skeleton';

interface NextStepsProps {
  data: {
    steps: NextStep[];
    decision_point?: DecisionPoint;
  } | null;
}

export function NextSteps({ data }: NextStepsProps) {
  if (!data || data.steps.length === 0) {
    return (
      <section id="next-steps" className="space-y-8">
        <SectionHeader
          id="next-steps-header"
          title="Next Steps"
          icon={ArrowRight}
        />
        <SectionEmptyState message="Next steps being formulated" />
      </section>
    );
  }

  return (
    <section id="next-steps" className="space-y-8">
      <SectionHeader
        id="next-steps-header"
        title="Next Steps"
        icon={ArrowRight}
        count={data.steps.length}
      />

      <div className="space-y-4">
        {data.steps.map((step) => (
          <BaseCard
            key={step.step_number}
            variant="default"
            emphasis="subtle"
            className="flex gap-4 transition-colors hover:border-zinc-300"
          >
            <div className="flex shrink-0 flex-col items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
                {step.step_number}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
                <Clock className="h-3 w-3" strokeWidth={1.5} />
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
          </BaseCard>
        ))}
      </div>

      {data.decision_point && (
        <div className="space-y-4 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 text-white">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-amber-400" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold">
              {data.decision_point.title}
            </h3>
          </div>
          <p className="leading-relaxed text-zinc-300">
            {data.decision_point.description}
          </p>
          {data.decision_point.cta_label && (
            <button className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100">
              {data.decision_point.cta_label}
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
