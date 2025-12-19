import { cn } from '@kit/ui/utils';

import type {
  InnovationConcept,
  LeadConcept,
  OtherConcept,
} from '../../_lib/schema/sparlo-report.schema';

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
        'module',
        isLead && concept.track === 'best_fit' && 'module--primary',
        concept.track === 'spark' && 'module--spark',
      )}
    >
      {/* Module Header */}
      <div className="module-header">
        <div className="module-header-left">
          <span className="module-id">{concept.id}</span>
          <Badge variant={trackVariant}>
            {concept.track === 'best_fit'
              ? 'Best Fit'
              : concept.track === 'simpler_path'
                ? 'Simpler Path'
                : 'Spark'}
          </Badge>
        </div>
        <div className="module-header-right">
          <Badge variant={confidenceVariant}>{concept.confidence}</Badge>
        </div>
      </div>

      {/* Concept Title / Bottom Line */}
      <div className="concept-hook">
        <h3 className="concept-title">{concept.title}</h3>
        <p className="concept-bottom-line">{concept.bottom_line}</p>
      </div>

      {/* Module Body */}
      <div className="module-body">
        {/* What it is */}
        <div className="module-section">
          <p className="module-section-label">What It Is</p>
          <p className="module-section-content">{concept.what_it_is}</p>
        </div>

        {/* Why it works */}
        <div className="module-section">
          <p className="module-section-label">Why It Works</p>
          <p className="module-section-content">{concept.why_it_works}</p>
        </div>

        {/* Confidence rationale */}
        <div className="module-thesis">
          <p className="module-section-label">Confidence Rationale</p>
          <p className="module-thesis-text">{concept.confidence_rationale}</p>
        </div>

        {/* What would change this */}
        <div className="module-section">
          <p className="module-section-label">What Would Change This</p>
          <p className="concept-change-text">
            {concept.what_would_change_this}
          </p>
        </div>

        {/* Key risks */}
        {concept.key_risks.length > 0 && (
          <div className="module-section">
            <p className="module-section-label">Key Risks</p>
            <div className="concept-risks">
              {concept.key_risks.map((risk, i) => (
                <div key={i} className="concept-risk-item">
                  <p className="concept-risk-text">{risk.risk}</p>
                  <p className="concept-risk-mitigation">
                    <span className="concept-risk-label">Mitigation:</span>{' '}
                    {risk.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test gates (v12: how_to_test is now an array) */}
        {concept.how_to_test.length > 0 && (
          <div className="module-section">
            <p className="module-section-label">How to Test</p>
            <div className="concept-gates">
              {concept.how_to_test.map((gate, index) => (
                <TestGate key={gate.gate_id} gate={gate} gateNumber={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

interface OtherConceptCardProps {
  concept: OtherConcept;
}

export function OtherConceptCard({ concept }: OtherConceptCardProps) {
  return (
    <div className="module">
      <div className="module-header">
        <div className="module-header-left">
          <span className="module-id">{concept.id}</span>
          <Badge variant={getTrackVariant(concept.track)}>
            {concept.track === 'simpler_path' ? 'Simpler Path' : concept.track}
          </Badge>
        </div>
        <div className="module-header-right">
          <Badge variant={getConfidenceVariant(concept.confidence)}>
            {concept.confidence}
          </Badge>
        </div>
      </div>
      <div className="module-body module-body--compact">
        <h4 className="concept-title-sm">{concept.title}</h4>
        <p className="concept-bottom-line-sm">{concept.bottom_line}</p>
        <div className="concept-validation">
          <span className="concept-validation-label">
            Critical validation:{' '}
          </span>
          <span className="concept-validation-text">
            {concept.critical_validation}
          </span>
        </div>
      </div>
    </div>
  );
}

interface SparkConceptCardProps {
  concept: InnovationConcept;
}

export function SparkConceptCard({ concept }: SparkConceptCardProps) {
  return (
    <div className="module module--spark">
      <div className="module-header">
        <div className="module-header-left">
          <span className="module-id">{concept.id}</span>
          <Badge variant="track-spark">
            <span className="spark-icon">&#10022;</span> Spark
          </Badge>
        </div>
      </div>
      <div className="module-body">
        <h4 className="concept-title-sm">{concept.title}</h4>
        <p className="spark-why-interesting">{concept.why_interesting}</p>

        <div className="spark-details">
          <div className="spark-detail">
            <span className="spark-detail-label">Why uncertain: </span>
            <span className="spark-detail-text">{concept.why_uncertain}</span>
          </div>
          <div className="spark-detail">
            <span className="spark-detail-label">When to pursue: </span>
            <span className="spark-detail-text">{concept.when_to_pursue}</span>
          </div>
        </div>

        <div className="spark-validation">
          <span className="spark-validation-label">GO/NO-GO: </span>
          <span className="spark-validation-text">
            {concept.critical_validation}
          </span>
        </div>
      </div>
    </div>
  );
}
