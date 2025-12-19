import { cn } from '@kit/ui/utils';

import { Badge, getConfidenceVariant, getTrackVariant } from './badge';
import { TestGate } from './test-gate';

// Lead concept - full detail with test gates
interface LeadConceptProps {
  concept: {
    id: string;
    title: string;
    track: string;
    bottom_line: string;
    what_it_is: string;
    why_it_works: string;
    confidence: string;
    confidence_rationale: string;
    what_would_change_this: string;
    key_risks: Array<{ risk: string; mitigation: string }>;
    how_to_test: {
      gate_0: {
        name: string;
        what_it_tests: string;
        method: string;
        go_criteria: string;
        no_go_criteria: string;
        effort: string;
      };
      gate_1?: {
        name: string;
        what_it_tests: string;
        method: string;
        go_criteria: string;
        no_go_criteria: string;
        effort: string;
      };
    };
  };
  isLead?: boolean;
}

export function ConceptCard({ concept, isLead = false }: LeadConceptProps) {
  const trackVariant = getTrackVariant(concept.track);
  const confidenceVariant = getConfidenceVariant(concept.confidence);

  return (
    <article
      className={cn(
        'rounded-xl border bg-white',
        isLead ? 'border-violet-200 shadow-sm' : 'border-gray-200',
      )}
    >
      {/* Header */}
      <div className="border-b border-gray-100 p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-sm text-gray-400">{concept.id}</span>
          <Badge variant={trackVariant}>
            {concept.track === 'best_fit'
              ? 'Best Fit'
              : concept.track === 'simpler_path'
                ? 'Simpler Path'
                : 'Spark'}
          </Badge>
          <Badge variant={confidenceVariant}>{concept.confidence}</Badge>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{concept.title}</h3>
      </div>

      {/* Bottom line - the hook */}
      <div className="border-b border-gray-100 bg-gray-50 p-6">
        <p className="text-base leading-relaxed font-medium text-gray-800">
          {concept.bottom_line}
        </p>
      </div>

      {/* Details */}
      <div className="space-y-6 p-6">
        {/* What it is */}
        <div>
          <h4 className="mb-2 text-sm font-semibold tracking-wider text-gray-500 uppercase">
            What It Is
          </h4>
          <p className="text-base leading-relaxed text-gray-700">
            {concept.what_it_is}
          </p>
        </div>

        {/* Why it works */}
        <div>
          <h4 className="mb-2 text-sm font-semibold tracking-wider text-gray-500 uppercase">
            Why It Works
          </h4>
          <p className="text-base leading-relaxed text-gray-700">
            {concept.why_it_works}
          </p>
        </div>

        {/* Confidence rationale */}
        <div className="rounded-lg bg-gray-50 p-4">
          <h4 className="mb-2 text-sm font-semibold tracking-wider text-gray-500 uppercase">
            Confidence Rationale
          </h4>
          <p className="text-sm text-gray-600">
            {concept.confidence_rationale}
          </p>
        </div>

        {/* What would change this */}
        <div>
          <h4 className="mb-2 text-sm font-semibold tracking-wider text-gray-500 uppercase">
            What Would Change This
          </h4>
          <p className="text-sm text-gray-600 italic">
            {concept.what_would_change_this}
          </p>
        </div>

        {/* Key risks */}
        {concept.key_risks.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
              Key Risks
            </h4>
            <div className="space-y-2">
              {concept.key_risks.map((risk, i) => (
                <div key={i} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-800">
                    {risk.risk}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
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
          <h4 className="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">
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

// Condensed card for "other" concepts
interface OtherConceptCardProps {
  concept: {
    id: string;
    title: string;
    track: string;
    bottom_line: string;
    what_it_is: string;
    confidence: string;
    confidence_rationale: string;
    critical_validation: string;
  };
}

export function OtherConceptCard({ concept }: OtherConceptCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="font-mono text-sm text-gray-400">{concept.id}</span>
        <Badge variant={getTrackVariant(concept.track)}>
          {concept.track === 'simpler_path' ? 'Simpler Path' : concept.track}
        </Badge>
        <Badge variant={getConfidenceVariant(concept.confidence)}>
          {concept.confidence}
        </Badge>
      </div>
      <h4 className="mb-2 text-lg font-semibold text-gray-900">
        {concept.title}
      </h4>
      <p className="mb-3 text-sm text-gray-700">{concept.bottom_line}</p>
      <div className="rounded-lg bg-gray-50 p-3 text-sm">
        <span className="font-medium text-gray-600">Critical validation: </span>
        <span className="text-gray-700">{concept.critical_validation}</span>
      </div>
    </div>
  );
}

// Spark concept - special styling
interface SparkConceptCardProps {
  concept: {
    id: string;
    title: string;
    why_interesting: string;
    why_uncertain: string;
    confidence: string;
    when_to_pursue: string;
    critical_validation: string;
  };
}

export function SparkConceptCard({ concept }: SparkConceptCardProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="font-mono text-sm text-gray-400">{concept.id}</span>
        <Badge variant="track-spark">Spark</Badge>
      </div>
      <h4 className="mb-2 text-lg font-semibold text-gray-900">
        {concept.title}
      </h4>
      <p className="mb-4 text-sm leading-relaxed text-gray-700">
        {concept.why_interesting}
      </p>
      <div className="space-y-3 text-sm">
        <div>
          <span className="font-medium text-amber-700">Why uncertain: </span>
          <span className="text-gray-600">{concept.why_uncertain}</span>
        </div>
        <div>
          <span className="font-medium text-amber-700">When to pursue: </span>
          <span className="text-gray-600">{concept.when_to_pursue}</span>
        </div>
        <div className="rounded-lg bg-amber-100/50 p-3">
          <span className="font-medium text-amber-800">GO/NO-GO: </span>
          <span className="text-amber-900">{concept.critical_validation}</span>
        </div>
      </div>
    </div>
  );
}
