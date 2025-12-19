import type { ProblemAnalysis as ProblemAnalysisType } from '../../../_lib/schema/sparlo-report.schema';
import { ConfidenceBadge } from '../shared/badges';
import { SectionHeader } from '../shared/section-header';

interface ProblemAnalysisProps {
  data: ProblemAnalysisType;
}

export function ProblemAnalysis({ data }: ProblemAnalysisProps) {
  return (
    <section id="problem-analysis" className="space-y-8">
      <SectionHeader id="problem-analysis-header" title="Problem Analysis" />

      <div className="grid gap-8 md:grid-cols-2">
        {/* What&apos;s Wrong */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
            What&apos;s Wrong
          </h3>
          <p className="text-base leading-relaxed text-zinc-700">
            {data.whats_wrong.prose}
          </p>
          {data.whats_wrong.technical_note && (
            <div className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
              {data.whats_wrong.technical_note.equation && (
                <code className="block font-mono text-sm text-zinc-800">
                  {data.whats_wrong.technical_note.equation}
                </code>
              )}
              <p className="text-sm text-zinc-600">
                {data.whats_wrong.technical_note.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Why It&apos;s Hard */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
            Why It&apos;s Hard
          </h3>
          <p className="text-base leading-relaxed text-zinc-700">
            {data.why_its_hard.prose}
          </p>
          <ul className="space-y-2">
            {data.why_its_hard.factors.map((factor, index) => (
              <li key={index} className="flex gap-2 text-sm text-zinc-600">
                <span className="text-zinc-400">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
          {data.why_its_hard.additional_prose && (
            <p className="text-sm text-zinc-500 italic">
              {data.why_its_hard.additional_prose}
            </p>
          )}
        </div>
      </div>

      {/* First Principles Insight */}
      <div className="space-y-3 rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100/50 p-6">
        <h3 className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
          First Principles Insight
        </h3>
        <p className="text-lg font-semibold text-zinc-900">
          {data.first_principles_insight.headline}
        </p>
        <p className="text-base leading-relaxed text-zinc-600">
          {data.first_principles_insight.explanation}
        </p>
      </div>

      {/* Root Cause Hypotheses */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
          Root Cause Hypotheses
        </h3>
        <div className="grid gap-4">
          {data.root_cause_hypotheses.map((hypothesis) => (
            <div
              key={hypothesis.id}
              className="flex gap-4 rounded-lg border border-zinc-100 p-4 transition-colors hover:border-zinc-200"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-600">
                {hypothesis.id}
              </span>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900">
                    {hypothesis.name}
                  </span>
                  <ConfidenceBadge level={hypothesis.confidence} />
                </div>
                <p className="text-sm leading-relaxed text-zinc-600">
                  {hypothesis.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Metrics */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
          Success Metrics
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {data.success_metrics.map((metric, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3"
            >
              <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
              <div>
                <p className="font-medium text-zinc-900">{metric.metric}</p>
                <p className="text-sm text-emerald-700">{metric.target}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
