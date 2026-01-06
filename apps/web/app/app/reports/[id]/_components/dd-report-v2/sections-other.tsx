'use client';

/**
 * DD Report Other Sections
 *
 * Problem Primer, Confidence Calibration, Comparable Analysis,
 * Founder Questions, Diligence Roadmap, and Why Wrong sections.
 */
import { cn } from '@kit/ui/utils';

import {
  AccentBorder,
  BodyText,
  ConstraintList,
  HighlightBox,
  MonoLabel,
  NumberedItem,
  Section,
  SectionTitle,
} from '../brand-system/primitives';
import type { DDReport } from './schema';

// ============================================
// Shared Components
// ============================================

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200 bg-white p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ============================================
// Problem Primer Section
// ============================================

export function ProblemPrimerSection({
  data,
}: {
  data: DDReport['problem_primer'];
}) {
  if (!data) return null;

  return (
    <Section id="problem-primer">
      <SectionTitle>Problem Primer</SectionTitle>

      {data.section_purpose && (
        <BodyText className="mt-8" variant="muted">
          {data.section_purpose}
        </BodyText>
      )}

      {/* Problem Overview */}
      {data.problem_overview && (
        <Card className="mt-8">
          <MonoLabel className="mb-4">Problem Overview</MonoLabel>
          <AccentBorder>
            <BodyText size="lg">{data.problem_overview.plain_english}</BodyText>
          </AccentBorder>
          {data.problem_overview.why_it_matters && (
            <div className="mt-6">
              <span className="text-sm text-zinc-500">Why It Matters:</span>
              <p className="mt-1 text-zinc-700">
                {data.problem_overview.why_it_matters}
              </p>
            </div>
          )}
          {data.problem_overview.market_context && (
            <div className="mt-4">
              <span className="text-sm text-zinc-500">Market Context:</span>
              <p className="mt-1 text-zinc-600">
                {data.problem_overview.market_context}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Physics Foundation */}
      {data.physics_foundation && (
        <Card className="mt-6">
          <MonoLabel className="mb-4">Physics Foundation</MonoLabel>

          {data.physics_foundation.governing_principles.length > 0 && (
            <div className="space-y-4">
              {data.physics_foundation.governing_principles.map((p, idx) => (
                <div key={idx} className="border-l-2 border-zinc-200 pl-4">
                  <p className="font-medium text-zinc-800">{p.principle}</p>
                  <p className="mt-1 text-zinc-600">{p.plain_english}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    <span className="font-medium">Implication:</span>{' '}
                    {p.implication}
                  </p>
                </div>
              ))}
            </div>
          )}

          {data.physics_foundation.thermodynamic_limits && (
            <div className="mt-6 rounded bg-zinc-50 p-4">
              <MonoLabel variant="muted" className="mb-3">
                Thermodynamic Limits
              </MonoLabel>
              <div className="grid gap-3 md:grid-cols-3">
                {data.physics_foundation.thermodynamic_limits
                  .theoretical_minimum && (
                  <div>
                    <span className="text-xs text-zinc-500">
                      Theoretical Min:
                    </span>
                    <p className="text-zinc-700">
                      {
                        data.physics_foundation.thermodynamic_limits
                          .theoretical_minimum
                      }
                    </p>
                  </div>
                )}
                {data.physics_foundation.thermodynamic_limits
                  .current_best_achieved && (
                  <div>
                    <span className="text-xs text-zinc-500">
                      Best Achieved:
                    </span>
                    <p className="text-zinc-700">
                      {
                        data.physics_foundation.thermodynamic_limits
                          .current_best_achieved
                      }
                    </p>
                  </div>
                )}
                {data.physics_foundation.thermodynamic_limits
                  .gap_explanation && (
                  <div>
                    <span className="text-xs text-zinc-500">Gap:</span>
                    <p className="text-zinc-700">
                      {
                        data.physics_foundation.thermodynamic_limits
                          .gap_explanation
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {data.physics_foundation.rate_limiting_factors.length > 0 && (
            <div className="mt-6">
              <ConstraintList
                items={data.physics_foundation.rate_limiting_factors}
                variant="hard"
              />
            </div>
          )}
        </Card>
      )}

      {/* Key Contradictions */}
      {data.key_contradictions.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4">Key Contradictions</MonoLabel>
          <div className="space-y-4">
            {data.key_contradictions.map((c, idx) => (
              <Card key={idx} className="border-l-4 border-l-amber-400">
                <p className="font-medium text-zinc-800">{c.tradeoff}</p>
                <div className="mt-3 grid gap-2 text-sm">
                  <p>
                    <span className="text-zinc-500">If you improve:</span>{' '}
                    {c.if_you_improve}
                  </p>
                  <p>
                    <span className="text-zinc-500">Typically worsens:</span>{' '}
                    {c.typically_worsens}
                  </p>
                  {c.how_different_approaches_resolve && (
                    <p>
                      <span className="text-zinc-500">Resolution:</span>{' '}
                      {c.how_different_approaches_resolve}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Key Insight */}
      {data.key_insight && (
        <AccentBorder weight="heavy" className="mt-8">
          <MonoLabel className="mb-2">Key Insight</MonoLabel>
          <BodyText size="lg">{data.key_insight}</BodyText>
        </AccentBorder>
      )}

      {/* Success Requirements */}
      {data.success_requirements && (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {data.success_requirements.physics_gates.length > 0 && (
            <Card>
              <ConstraintList
                items={data.success_requirements.physics_gates}
                variant="hard"
              />
            </Card>
          )}
          {data.success_requirements.engineering_challenges.length > 0 && (
            <Card>
              <ConstraintList
                items={data.success_requirements.engineering_challenges}
                variant="soft"
              />
            </Card>
          )}
          {data.success_requirements.commercial_thresholds.length > 0 && (
            <Card>
              <ConstraintList
                items={data.success_requirements.commercial_thresholds}
                variant="assumption"
              />
            </Card>
          )}
        </div>
      )}

      {/* Where Value Created */}
      {data.where_value_created && (
        <Card className="mt-8">
          <MonoLabel className="mb-4">Where Value Is Created</MonoLabel>
          <div className="space-y-3">
            {data.where_value_created.bottleneck_today && (
              <p>
                <span className="text-sm text-zinc-500">Bottleneck Today:</span>{' '}
                {data.where_value_created.bottleneck_today}
              </p>
            )}
            {data.where_value_created.what_breakthrough_would_unlock && (
              <p>
                <span className="text-sm text-zinc-500">
                  Breakthrough Would Unlock:
                </span>{' '}
                {data.where_value_created.what_breakthrough_would_unlock}
              </p>
            )}
            {data.where_value_created.who_captures_value && (
              <p>
                <span className="text-sm text-zinc-500">
                  Who Captures Value:
                </span>{' '}
                {data.where_value_created.who_captures_value}
              </p>
            )}
          </div>
        </Card>
      )}
    </Section>
  );
}

// ============================================
// Confidence Calibration Section
// ============================================

export function ConfidenceCalibrationSection({
  data,
}: {
  data: DDReport['confidence_calibration'];
}) {
  if (!data) return null;

  const renderConfidenceItems = (
    items: Array<{ assessment: string; basis?: string; confidence?: string }>,
    level: string,
    colorClass: string,
  ) => {
    if (items.length === 0) return null;
    return (
      <div className={cn('border-l-4 pl-4', colorClass)}>
        <MonoLabel className="mb-3">{level} Confidence</MonoLabel>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx}>
              <p className="text-zinc-800">{item.assessment}</p>
              {item.basis && (
                <p className="mt-1 text-sm text-zinc-500">
                  Basis: {item.basis}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Section id="confidence">
      <SectionTitle>Confidence Calibration</SectionTitle>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {renderConfidenceItems(
          data.high_confidence,
          'High',
          'border-l-emerald-400',
        )}
        {renderConfidenceItems(
          data.medium_confidence,
          'Medium',
          'border-l-amber-400',
        )}
        {renderConfidenceItems(data.low_confidence, 'Low', 'border-l-red-400')}
      </div>

      {/* Known Unknowns */}
      {data.known_unknowns.length > 0 && (
        <Card className="mt-8">
          <MonoLabel className="mb-4">Known Unknowns</MonoLabel>
          <ul className="list-disc space-y-2 pl-5 text-zinc-700">
            {data.known_unknowns.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Where Surprises Lurk */}
      {data.where_surprises_lurk.length > 0 && (
        <Card className="mt-6 border-l-4 border-l-zinc-900">
          <MonoLabel className="mb-4">Where Surprises Lurk</MonoLabel>
          <ul className="list-disc space-y-2 pl-5 text-zinc-700">
            {data.where_surprises_lurk.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </Card>
      )}
    </Section>
  );
}

// ============================================
// Comparable Analysis Section
// ============================================

export function ComparableAnalysisSection({
  data,
}: {
  data: DDReport['comparable_analysis'];
}) {
  if (!data) return null;

  return (
    <Section id="comparables">
      <SectionTitle>Comparable Analysis</SectionTitle>

      {/* Base Rate */}
      {data.base_rate && (
        <HighlightBox className="mt-8">
          <MonoLabel className="mb-2">Base Rate</MonoLabel>
          {data.base_rate.category_success_rate && (
            <p className="text-lg font-medium text-zinc-800">
              {data.base_rate.category_success_rate}
            </p>
          )}
          {data.base_rate.this_company_vs_base && (
            <p className="mt-2 text-zinc-600">
              {data.base_rate.this_company_vs_base}
            </p>
          )}
        </HighlightBox>
      )}

      {/* Closest Comparables */}
      {data.closest_comparables.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4">Closest Comparables</MonoLabel>
          <div className="space-y-4">
            {data.closest_comparables.map((comp, idx) => (
              <NumberedItem key={idx} index={idx}>
                <Card>
                  <p className="font-medium text-zinc-800">{comp.company}</p>
                  {comp.similarity && (
                    <p className="mt-2 text-sm">
                      <span className="text-zinc-500">Similarity:</span>{' '}
                      {comp.similarity}
                    </p>
                  )}
                  {comp.outcome && (
                    <p className="mt-1 text-sm">
                      <span className="text-zinc-500">Outcome:</span>{' '}
                      {comp.outcome}
                    </p>
                  )}
                  {comp.lesson && (
                    <p className="mt-2 text-zinc-600">
                      <span className="font-medium">Lesson:</span> {comp.lesson}
                    </p>
                  )}
                </Card>
              </NumberedItem>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

// ============================================
// Founder Questions Section
// ============================================

export function FounderQuestionsSection({
  data,
}: {
  data: DDReport['founder_questions'];
}) {
  if (!data) return null;

  return (
    <Section id="founder-questions">
      <SectionTitle>Questions for Founders</SectionTitle>

      {/* Must Ask */}
      {data.must_ask.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4 text-red-600">Must Ask</MonoLabel>
          <div className="space-y-4">
            {data.must_ask.map((q, idx) => (
              <NumberedItem key={idx} index={idx}>
                <Card className="border-l-4 border-l-red-400">
                  <p className="font-medium text-zinc-800">{q.question}</p>
                  {q.why_critical && (
                    <p className="mt-2 text-sm text-zinc-600">
                      <span className="text-zinc-500">Why Critical:</span>{' '}
                      {q.why_critical}
                    </p>
                  )}
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {q.good_answer && (
                      <div className="rounded bg-emerald-50 p-3">
                        <span className="text-xs font-medium text-emerald-700">
                          Good Answer
                        </span>
                        <p className="mt-1 text-sm text-emerald-800">
                          {q.good_answer}
                        </p>
                      </div>
                    )}
                    {q.bad_answer && (
                      <div className="rounded bg-red-50 p-3">
                        <span className="text-xs font-medium text-red-700">
                          Bad Answer
                        </span>
                        <p className="mt-1 text-sm text-red-800">
                          {q.bad_answer}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </NumberedItem>
            ))}
          </div>
        </div>
      )}

      {/* Technical Deep Dives */}
      {data.technical_deep_dives.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4">Technical Deep Dives</MonoLabel>
          <div className="space-y-4">
            {data.technical_deep_dives.map((dive, idx) => (
              <Card key={idx}>
                <p className="font-medium text-zinc-800">{dive.topic}</p>
                {dive.questions.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-600">
                    {dive.questions.map((q, qIdx) => (
                      <li key={qIdx}>{q}</li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Commercial Deep Dives */}
      {data.commercial_deep_dives.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4">Commercial Deep Dives</MonoLabel>
          <div className="space-y-4">
            {data.commercial_deep_dives.map((dive, idx) => (
              <Card key={idx}>
                <p className="font-medium text-zinc-800">{dive.topic}</p>
                {dive.questions.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-600">
                    {dive.questions.map((q, qIdx) => (
                      <li key={qIdx}>{q}</li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

// ============================================
// Diligence Roadmap Section
// ============================================

export function DiligenceRoadmapSection({
  data,
}: {
  data: DDReport['diligence_roadmap'];
}) {
  if (!data) return null;

  return (
    <Section id="diligence-roadmap">
      <SectionTitle>Diligence Roadmap</SectionTitle>

      {/* Before Term Sheet */}
      {data.before_term_sheet.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4 text-red-600">Before Term Sheet</MonoLabel>
          <div className="space-y-3">
            {data.before_term_sheet.map((item, idx) => (
              <Card key={idx} className="border-l-4 border-l-red-400">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-zinc-800">{item.action}</p>
                    {item.purpose && (
                      <p className="mt-1 text-sm text-zinc-600">
                        {item.purpose}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                      {item.time && <span>Time: {item.time}</span>}
                      {item.cost && <span>Cost: {item.cost}</span>}
                      {item.who && <span>Who: {item.who}</span>}
                    </div>
                  </div>
                  {item.priority && (
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                      {item.priority}
                    </span>
                  )}
                </div>
                {item.deal_breaker_if && (
                  <p className="mt-3 text-sm text-red-600">
                    <span className="font-medium">Deal breaker if:</span>{' '}
                    {item.deal_breaker_if}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* During Diligence */}
      {data.during_diligence.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4">During Diligence</MonoLabel>
          <div className="space-y-2">
            {data.during_diligence.map((item, idx) => (
              <Card key={idx} className="flex items-center justify-between">
                <p className="text-zinc-700">{item.action}</p>
                {item.priority && (
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                    {item.priority}
                  </span>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Documents to Request */}
      {data.documents_to_request.length > 0 && (
        <Card className="mt-8">
          <MonoLabel className="mb-4">Documents to Request</MonoLabel>
          <ul className="list-disc space-y-1 pl-5 text-zinc-700">
            {data.documents_to_request.map((doc, idx) => (
              <li key={idx}>{doc}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Reference Calls */}
      {data.reference_calls.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4">Reference Calls</MonoLabel>
          <div className="space-y-3">
            {data.reference_calls.map((ref, idx) => (
              <Card key={idx}>
                <p className="font-medium text-zinc-800">{ref.who}</p>
                {ref.why && (
                  <p className="mt-1 text-sm text-zinc-600">{ref.why}</p>
                )}
                {ref.key_questions.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-500">
                    {ref.key_questions.map((q, qIdx) => (
                      <li key={qIdx}>{q}</li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Technical Validation */}
      {data.technical_validation.length > 0 && (
        <div className="mt-8">
          <MonoLabel className="mb-4">Technical Validation</MonoLabel>
          <div className="space-y-3">
            {data.technical_validation.map((item, idx) => (
              <Card key={idx}>
                <p className="font-medium text-zinc-800">{item.what}</p>
                {item.how && (
                  <p className="mt-1 text-sm text-zinc-600">{item.how}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                  {item.time && <span>Time: {item.time}</span>}
                  {item.cost && <span>Cost: {item.cost}</span>}
                  {item.who_can_help && <span>Help: {item.who_can_help}</span>}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

// ============================================
// Why Wrong Section
// ============================================

export function WhyWrongSection({
  data,
}: {
  data: DDReport['why_this_might_be_wrong'];
}) {
  if (!data) return null;

  return (
    <Section id="why-wrong">
      <SectionTitle>Why This Might Be Wrong</SectionTitle>

      {/* Strongest Counter Argument */}
      {data.strongest_counter_argument && (
        <AccentBorder weight="heavy" className="mt-8">
          <MonoLabel className="mb-2">Strongest Counter-Argument</MonoLabel>
          <BodyText size="lg">{data.strongest_counter_argument}</BodyText>
          {data.our_response && (
            <div className="mt-4 border-t border-zinc-200 pt-4">
              <span className="text-sm text-zinc-500">Our Response:</span>
              <p className="mt-1 text-zinc-700">{data.our_response}</p>
            </div>
          )}
        </AccentBorder>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* If Too Positive */}
        {data.if_we_are_too_positive && (
          <Card className="border-l-4 border-l-emerald-400">
            <MonoLabel className="mb-4 text-emerald-700">
              If We Are Too Positive
            </MonoLabel>
            {data.if_we_are_too_positive.what_we_might_be_missing && (
              <div className="mb-3">
                <span className="text-sm text-zinc-500">
                  What We Might Be Missing:
                </span>
                <p className="text-zinc-700">
                  {data.if_we_are_too_positive.what_we_might_be_missing}
                </p>
              </div>
            )}
            {data.if_we_are_too_positive.what_would_change_our_mind && (
              <div>
                <span className="text-sm text-zinc-500">
                  What Would Change Our Mind:
                </span>
                <p className="text-zinc-700">
                  {data.if_we_are_too_positive.what_would_change_our_mind}
                </p>
              </div>
            )}
          </Card>
        )}

        {/* If Too Negative */}
        {data.if_we_are_too_negative && (
          <Card className="border-l-4 border-l-red-400">
            <MonoLabel className="mb-4 text-red-700">
              If We Are Too Negative
            </MonoLabel>
            {data.if_we_are_too_negative.what_we_might_be_missing && (
              <div className="mb-3">
                <span className="text-sm text-zinc-500">
                  What We Might Be Missing:
                </span>
                <p className="text-zinc-700">
                  {data.if_we_are_too_negative.what_we_might_be_missing}
                </p>
              </div>
            )}
            {data.if_we_are_too_negative.what_would_change_our_mind && (
              <div>
                <span className="text-sm text-zinc-500">
                  What Would Change Our Mind:
                </span>
                <p className="text-zinc-700">
                  {data.if_we_are_too_negative.what_would_change_our_mind}
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </Section>
  );
}
