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

export function LeadConceptCard({ concept }: LeadConceptCardProps) {
  return (
    <BaseCard variant="lead" emphasis="high" className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <TrackBadge
              track={concept.track}
              label={concept.track_label}
              showIcon
            />
            <ConfidenceBadge level={concept.confidence} showIcon />
          </div>
          <h3 className="text-xl font-semibold text-zinc-900">
            {concept.title}
          </h3>
        </div>
        <span className="shrink-0 font-mono text-xs text-zinc-400">
          {concept.id}
        </span>
      </div>

      <div className="rounded-lg border border-emerald-100 bg-white/50 p-4">
        <p className="text-base font-medium text-zinc-800">
          {concept.bottom_line}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            What It Is
          </h4>
          <p className="text-sm leading-relaxed text-zinc-600">
            {concept.what_it_is}
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            Why It Works
          </h4>
          <p className="text-sm leading-relaxed text-zinc-600">
            {concept.why_it_works}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
          Confidence Rationale
        </h4>
        <p className="text-sm text-zinc-600">{concept.confidence_rationale}</p>
        <p className="text-sm text-zinc-500 italic">
          <span className="font-medium">What would change this:</span>{' '}
          {concept.what_would_change_this}
        </p>
      </div>

      {concept.key_risks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            Key Risks
          </h4>
          <div className="grid gap-2">
            {concept.key_risks.map((risk, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-lg border border-zinc-100 bg-white p-3"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                <div className="flex-1">
                  <p className="text-sm text-zinc-700">{risk.risk}</p>
                  <p className="mt-1 text-xs text-zinc-500">
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
        <h4 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
          How to Test
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

export function OtherConceptCard({ concept }: OtherConceptCardProps) {
  return (
    <BaseCard
      variant="default"
      emphasis="subtle"
      className="space-y-4 transition-colors hover:border-zinc-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <TrackBadge track={concept.track} label={concept.track_label} />
            <ConfidenceBadge level={concept.confidence} />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">
            {concept.title}
          </h3>
        </div>
        <span className="shrink-0 font-mono text-xs text-zinc-400">
          {concept.id}
        </span>
      </div>

      <p className="text-sm font-medium text-zinc-700">{concept.bottom_line}</p>
      <p className="text-sm text-zinc-600">{concept.what_it_is}</p>

      <div className="space-y-1 rounded-lg bg-zinc-50 p-3">
        <p className="text-xs text-zinc-500">{concept.confidence_rationale}</p>
        <p className="text-xs font-medium text-amber-700">
          <span className="font-semibold">Critical validation:</span>{' '}
          {concept.critical_validation}
        </p>
      </div>
    </BaseCard>
  );
}
