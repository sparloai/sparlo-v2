import { Search, Target } from 'lucide-react';

import type { ProblemAnalysis as ProblemAnalysisType } from '../../../_lib/schema/sparlo-report.schema';
import { ConfidenceBadge } from '../shared/badges/confidence-badge';
import { InsightCard } from '../shared/cards/insight-card';
import { RootCauseCard } from '../shared/cards/root-cause-card';
import { BulletList } from '../shared/lists/bullet-list';
import { SectionHeader } from '../shared/section-header';
import { SectionEmptyState } from '../shared/section-skeleton';

interface ProblemAnalysisProps {
  data: ProblemAnalysisType | null;
}

export function ProblemAnalysis({ data }: ProblemAnalysisProps) {
  if (!data) {
    return (
      <section id="problem-analysis" className="space-y-8">
        <SectionHeader
          id="problem-analysis-header"
          title="Problem Analysis"
          icon={Search}
        />
        <SectionEmptyState message="Root cause analysis pending" />
      </section>
    );
  }

  return (
    <section id="problem-analysis" className="space-y-8">
      <SectionHeader
        id="problem-analysis-header"
        title="Problem Analysis"
        icon={Search}
      />

      <div className="grid gap-8 md:grid-cols-2">
        {/* What's Wrong */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-500">
            What&apos;s wrong
          </h3>
          <p className="text-lg leading-relaxed text-zinc-700">
            {data.whats_wrong.prose}
          </p>
          {data.whats_wrong.technical_note && (
            <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
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

        {/* Why It's Hard */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-500">
            Why it&apos;s hard
          </h3>
          <p className="text-lg leading-relaxed text-zinc-700">
            {data.why_its_hard.prose}
          </p>
          <BulletList items={data.why_its_hard.factors} />
          {data.why_its_hard.additional_prose && (
            <p className="text-sm text-zinc-500 italic">
              {data.why_its_hard.additional_prose}
            </p>
          )}
        </div>
      </div>

      {/* First Principles Insight */}
      <InsightCard
        headline={data.first_principles_insight.headline}
        explanation={data.first_principles_insight.explanation}
        variant="featured"
      />

      {/* Root Cause Hypotheses */}
      {data.root_cause_hypotheses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-500">
            Root cause hypotheses
          </h3>
          <div className="grid gap-4">
            {data.root_cause_hypotheses.map((hypothesis) => (
              <RootCauseCard
                key={hypothesis.id}
                id={hypothesis.id}
                name={hypothesis.name}
                confidence={hypothesis.confidence}
                explanation={hypothesis.explanation}
              />
            ))}
          </div>
        </div>
      )}

      {/* Success Metrics */}
      {data.success_metrics.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-500">
            Success metrics
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {data.success_metrics.map((metric, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4"
              >
                <Target
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="font-medium text-zinc-900">{metric.metric}</p>
                  <p className="text-sm text-emerald-700">{metric.target}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
