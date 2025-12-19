import { cn } from '@kit/ui/utils';

import type {
  LeadConcept,
  OtherConcept,
  SparkConcept,
} from '~/lib/llm/prompts/an5-report';

import { Badge, getConfidenceVariant, getTrackVariant } from './badge';
import { TestGate } from './test-gate';

interface LeadConceptProps {
  concept: LeadConcept;
  isLead?: boolean;
}

export function ConceptCard({ concept, isLead = false }: LeadConceptProps) {
  const trackVariant = getTrackVariant(concept.track);
  const confidenceVariant = getConfidenceVariant(concept.confidence);

  return (
    <article
      className={cn(
        'rounded-xl border bg-[--surface-elevated]',
        isLead ? 'border-[--accent]/30 shadow-sm' : 'border-[--border-default]',
      )}
    >
      {/* Header */}
      <div className="border-b border-[--border-subtle] p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-sm text-[--text-muted]">
            {concept.id}
          </span>
          <Badge variant={trackVariant}>
            {concept.track === 'best_fit'
              ? 'Best Fit'
              : concept.track === 'simpler_path'
                ? 'Simpler Path'
                : 'Spark'}
          </Badge>
          <Badge variant={confidenceVariant}>{concept.confidence}</Badge>
        </div>
        <h3 className="text-xl font-semibold text-[--text-primary]">
          {concept.title}
        </h3>
      </div>

      {/* Bottom line - the hook */}
      <div className="border-b border-[--border-subtle] bg-[--surface-overlay] p-6">
        <p className="text-base leading-relaxed font-medium text-[--text-primary]">
          {concept.bottom_line}
        </p>
      </div>

      {/* Details */}
      <div className="space-y-6 p-6">
        {/* What it is */}
        <div>
          <h4 className="mb-2 text-sm font-semibold tracking-wider text-[--text-muted] uppercase">
            What It Is
          </h4>
          <p className="text-base leading-relaxed text-[--text-secondary]">
            {concept.what_it_is}
          </p>
        </div>

        {/* Why it works */}
        <div>
          <h4 className="mb-2 text-sm font-semibold tracking-wider text-[--text-muted] uppercase">
            Why It Works
          </h4>
          <p className="text-base leading-relaxed text-[--text-secondary]">
            {concept.why_it_works}
          </p>
        </div>

        {/* Confidence rationale */}
        <div className="rounded-lg bg-[--surface-overlay] p-4">
          <h4 className="mb-2 text-sm font-semibold tracking-wider text-[--text-muted] uppercase">
            Confidence Rationale
          </h4>
          <p className="text-sm text-[--text-secondary]">
            {concept.confidence_rationale}
          </p>
        </div>

        {/* What would change this */}
        <div>
          <h4 className="mb-2 text-sm font-semibold tracking-wider text-[--text-muted] uppercase">
            What Would Change This
          </h4>
          <p className="text-sm text-[--text-secondary] italic">
            {concept.what_would_change_this}
          </p>
        </div>

        {/* Key risks */}
        {concept.key_risks.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-semibold tracking-wider text-[--text-muted] uppercase">
              Key Risks
            </h4>
            <div className="space-y-2">
              {concept.key_risks.map((risk, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[--border-default] p-3"
                >
                  <p className="text-sm font-medium text-[--text-primary]">
                    {risk.risk}
                  </p>
                  <p className="mt-1 text-sm text-[--text-muted]">
                    <span className="font-medium">Mitigation:</span>{' '}
                    {risk.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test gates */}
        <div>
          <h4 className="mb-4 text-sm font-semibold tracking-wider text-[--text-muted] uppercase">
            How to Test
          </h4>
          <div className="space-y-4">
            <TestGate gate={concept.how_to_test.gate_0} gateNumber={0} />
            {concept.how_to_test.gate_1 && (
              <TestGate gate={concept.how_to_test.gate_1} gateNumber={1} />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

interface OtherConceptCardProps {
  concept: OtherConcept;
}

export function OtherConceptCard({ concept }: OtherConceptCardProps) {
  return (
    <div className="rounded-xl border border-[--border-default] bg-[--surface-elevated] p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="font-mono text-sm text-[--text-muted]">
          {concept.id}
        </span>
        <Badge variant={getTrackVariant(concept.track)}>
          {concept.track === 'simpler_path' ? 'Simpler Path' : concept.track}
        </Badge>
        <Badge variant={getConfidenceVariant(concept.confidence)}>
          {concept.confidence}
        </Badge>
      </div>
      <h4 className="mb-2 text-lg font-semibold text-[--text-primary]">
        {concept.title}
      </h4>
      <p className="mb-3 text-sm text-[--text-secondary]">
        {concept.bottom_line}
      </p>
      <div className="rounded-lg bg-[--surface-overlay] p-3 text-sm">
        <span className="font-medium text-[--text-secondary]">
          Critical validation:{' '}
        </span>
        <span className="text-[--text-secondary]">
          {concept.critical_validation}
        </span>
      </div>
    </div>
  );
}

interface SparkConceptCardProps {
  concept: SparkConcept;
}

export function SparkConceptCard({ concept }: SparkConceptCardProps) {
  return (
    <div className="rounded-xl border border-[--status-warning]/30 bg-gradient-to-br from-[--status-warning]/10 to-[--surface-elevated] p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="font-mono text-sm text-[--text-muted]">
          {concept.id}
        </span>
        <Badge variant="track-spark">Spark</Badge>
      </div>
      <h4 className="mb-2 text-lg font-semibold text-[--text-primary]">
        {concept.title}
      </h4>
      <p className="mb-4 text-sm leading-relaxed text-[--text-secondary]">
        {concept.why_interesting}
      </p>
      <div className="space-y-3 text-sm">
        <div>
          <span className="font-medium text-[--status-warning]">
            Why uncertain:{' '}
          </span>
          <span className="text-[--text-secondary]">
            {concept.why_uncertain}
          </span>
        </div>
        <div>
          <span className="font-medium text-[--status-warning]">
            When to pursue:{' '}
          </span>
          <span className="text-[--text-secondary]">
            {concept.when_to_pursue}
          </span>
        </div>
        <div className="rounded-lg bg-[--status-warning]/15 p-3">
          <span className="font-medium text-[--status-warning]">
            GO/NO-GO:{' '}
          </span>
          <span className="text-[--text-primary]">
            {concept.critical_validation}
          </span>
        </div>
      </div>
    </div>
  );
}
