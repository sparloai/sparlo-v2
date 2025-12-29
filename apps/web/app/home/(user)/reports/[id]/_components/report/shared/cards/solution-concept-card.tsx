import type {
  LeadConcept,
  OtherConcept,
} from '../../../../_lib/schema/sparlo-report.schema';
import { ConfidenceBadge } from '../badges/confidence-badge';
import { TrackBadge } from '../badges/track-badge';
import { TestGate } from '../test-gate';
import { BaseCard } from './base-card';

interface LeadConceptCardProps {
  concept: LeadConcept;
}

// Per Jobs Standard: consistent spacing, muted colors, no borders
export function LeadConceptCard({ concept }: LeadConceptCardProps) {
  return (
    <BaseCard variant="lead" emphasis="high" className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <TrackBadge track={concept.track} label={concept.track_label} />
            <ConfidenceBadge level={concept.confidence} />
          </div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {concept.title}
          </h3>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
          {concept.id}
        </span>
      </div>

      <div className="rounded-xl bg-white/60 p-5 dark:bg-zinc-800/40">
        <p className="text-base leading-relaxed font-medium text-zinc-800 dark:text-zinc-200">
          {concept.bottom_line}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
            What it is
          </h4>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {concept.what_it_is}
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
            Why it works
          </h4>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {concept.why_it_works}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
          Confidence rationale
        </h4>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {concept.confidence_rationale}
        </p>
        <p className="text-sm text-zinc-500 italic dark:text-zinc-500">
          <span className="font-medium">Caveat:</span>{' '}
          {concept.what_would_change_this}
        </p>
      </div>

      {concept.key_risks.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
            Key risks
          </h4>
          <div className="grid gap-3">
            {concept.key_risks.map((risk, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-xl bg-white/60 p-4 dark:bg-zinc-800/40"
              >
                <span className="mt-2 h-px w-3 shrink-0 bg-zinc-400 dark:bg-zinc-500" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {risk.risk}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    <span className="font-medium">Mitigation:</span>{' '}
                    {risk.mitigation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
          How to test
        </h4>
        <div className="grid gap-4">
          {concept.how_to_test.map((gate) => (
            <TestGate key={gate.gate_id} gate={gate} />
          ))}
        </div>
      </div>
    </BaseCard>
  );
}

interface OtherConceptCardProps {
  concept: OtherConcept;
}

// Per Jobs Standard: consistent spacing, muted colors
export function OtherConceptCard({ concept }: OtherConceptCardProps) {
  return (
    <BaseCard variant="default" emphasis="subtle" className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <TrackBadge track={concept.track} label={concept.track_label} />
            <ConfidenceBadge level={concept.confidence} />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {concept.title}
          </h3>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
          {concept.id}
        </span>
      </div>

      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {concept.bottom_line}
      </p>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {concept.what_it_is}
      </p>

      <div className="space-y-2 rounded-xl bg-zinc-50/50 p-4 dark:bg-zinc-800/30">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {concept.confidence_rationale}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Critical validation:
          </span>{' '}
          {concept.critical_validation}
        </p>
      </div>
    </BaseCard>
  );
}
