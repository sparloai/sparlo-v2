/**
 * Recommendation
 *
 * Air Company Aesthetic - Technical Monograph, Not AI Tool
 *
 * Personal, opinionated take—direct advice from the analysis.
 * Should feel like a senior advisor speaking plainly.
 *
 * Visual elements:
 * - Larger lead paragraph (the "if you read nothing else" takeaway)
 * - Flowing prose, no bullet points
 * - Generous line height for conversational pacing
 * - "If This Were My Project" label signals personal voice
 */

import React from 'react';

// ============================================
// TYPES
// ============================================

interface RecommendationProps {
  paragraphs: string[];
}

interface RecommendationWithCalloutProps {
  leadAdvice: string;
  leadDetail: string;
  paragraphs: string[];
}

interface ActionSummary {
  label: string;
  action: string;
}

interface RecommendationWithSummaryProps {
  paragraphs: string[];
  actions: ActionSummary[];
}

// ============================================
// MAIN COMPONENT - FLOWING PROSE
// ============================================

export function Recommendation({ paragraphs }: RecommendationProps) {
  return (
    <section className="mt-20">
      <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900">
        Recommendation
      </h2>
      <p className="mt-2 text-[18px] text-zinc-500">
        Personal recommendation from the analysis
      </p>

      <div className="mt-10 max-w-[65ch]">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          If This Were My Project
        </span>

        <div className="mt-6 space-y-6">
          {paragraphs.map((para, index) => (
            <p
              key={index}
              className={`
                leading-[1.3] tracking-[-0.02em]
                ${index === 0 ? 'text-[20px] text-[#1e1e1e]' : 'text-[18px] text-zinc-600'}
              `}
            >
              {para}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// WITH CALLOUT VARIANT
// ============================================

export function RecommendationWithCallout({
  leadAdvice,
  leadDetail,
  paragraphs,
}: RecommendationWithCalloutProps) {
  return (
    <section className="mt-20">
      <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900">
        Recommendation
      </h2>
      <p className="mt-2 text-[18px] text-zinc-500">
        Personal recommendation from the analysis
      </p>

      <div className="mt-10 max-w-[65ch]">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          If This Were My Project
        </span>

        {/* Lead advice - emphasized with border */}
        <div className="mt-6 border-l-2 border-zinc-900 pl-6">
          <p className="text-[20px] leading-[1.3] tracking-[-0.02em] text-zinc-900 font-medium">
            {leadAdvice}
          </p>
          <p className="mt-3 text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">{leadDetail}</p>
        </div>

        {/* Secondary recommendations */}
        <div className="mt-10 space-y-6">
          {paragraphs.map((para, index) => (
            <p key={index} className="text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
              {para}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// WITH ACTION SUMMARY VARIANT
// ============================================

export function RecommendationWithSummary({
  paragraphs,
  actions,
}: RecommendationWithSummaryProps) {
  return (
    <section className="mt-20">
      <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900">
        Recommendation
      </h2>
      <p className="mt-2 text-[18px] text-zinc-500">
        Personal recommendation from the analysis
      </p>

      <div className="mt-10 max-w-[65ch]">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          If This Were My Project
        </span>

        <div className="mt-6 space-y-6">
          {paragraphs.map((para, index) => (
            <p
              key={index}
              className={`
                leading-[1.3] tracking-[-0.02em]
                ${index === 0 ? 'text-[20px] text-[#1e1e1e]' : 'text-[18px] text-zinc-600'}
              `}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Quick summary */}
        <div className="mt-10 pt-8 border-t border-zinc-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[18px]">
            {actions.map((item) => (
              <div key={item.label}>
                <span className="font-medium text-zinc-900">{item.label}:</span>
                <span className="text-zinc-600 ml-2">{item.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// EXAMPLE WITH REAL DATA
// ============================================

export function RecommendationExample() {
  return (
    <div className="max-w-[900px] mx-auto px-10 py-20 bg-white min-h-screen">
      <Recommendation
        paragraphs={[
          "If this were my project, I'd start with BCG tomorrow. Buy a Murata SCA11H sensor module, tape it under a chair cushion, and validate HR detection in a week. The physics is proven, the algorithms exist, and you'll have working vital signs monitoring before you've finished your radar ML architecture document.",
          "For true air-coupled sensing, I'd license or partner rather than build. Google has spent years on Soli; Vayyar has the MIMO array expertise. The ML development cost ($500K-2M) only makes sense if you have a differentiated go-to-market or are building a platform. Otherwise, you're recreating Google's work.",
          "The smartphone ultrasonic approach is the moonshot I'd fund with 10-15% of budget. If device variability is manageable, it's transformative. If not, you've learned quickly and cheaply. The validation is straightforward—characterize 10 phones, implement respiration detection, see what works.",
          "I'd explicitly deprioritize the paradigm-level research (motion-invariant features, polarimetric separation) unless you have academic partners or long time horizons. These are 2-5 year research bets, not product development. They're worth tracking and potentially funding small feasibility studies, but they shouldn't delay shipping a BCG or radar product.",
        ]}
      />
    </div>
  );
}

export function RecommendationWithCalloutExample() {
  return (
    <div className="max-w-[900px] mx-auto px-10 py-20 bg-white min-h-screen">
      <RecommendationWithCallout
        leadAdvice="I'd start with BCG tomorrow."
        leadDetail="Buy a Murata SCA11H sensor module, tape it under a chair cushion, and validate HR detection in a week. The physics is proven, the algorithms exist, and you'll have working vital signs monitoring before you've finished your radar ML architecture document."
        paragraphs={[
          "For true air-coupled sensing, I'd license or partner rather than build. Google has spent years on Soli; Vayyar has the MIMO array expertise. The ML development cost ($500K-2M) only makes sense if you have a differentiated go-to-market or are building a platform.",
          "The smartphone ultrasonic approach is the moonshot I'd fund with 10-15% of budget. If device variability is manageable, it's transformative. If not, you've learned quickly and cheaply.",
          "I'd explicitly deprioritize the paradigm-level research unless you have academic partners or long time horizons. These are 2-5 year research bets, not product development.",
        ]}
      />
    </div>
  );
}

export default Recommendation;
