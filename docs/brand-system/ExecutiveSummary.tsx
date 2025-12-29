/**
 * ExecutiveSummary
 *
 * Air Company Aesthetic - Technical Monograph, Not AI Tool
 *
 * Structure:
 * 1. The Assessment — 1-2 paragraphs stating the landscape and core insight
 * 2. Viability Statement — One line summary of confidence level
 * 3. Primary Recommendation — The headline action to take
 *
 * Visual system:
 * - Section labels: 12px semibold uppercase zinc-500
 * - Body text: 20px, leading 1.3, tracking -0.02em, color #1e1e1e
 * - Accent border: 2px left border in zinc-900
 * - Section spacing: mt-16 between major sections
 */

import React from 'react';

// ============================================
// TYPES
// ============================================

interface ExecutiveSummaryProps {
  assessment: string;
  viability: string;
  primaryRecommendation: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ExecutiveSummary({
  assessment,
  viability,
  primaryRecommendation,
}: ExecutiveSummaryProps) {
  return (
    <article className="border-l-2 border-zinc-900 bg-white pl-10">
      {/* ----------------------------------------
          THE ASSESSMENT
          ---------------------------------------- */}
      <section>
        <h2 className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
          The Assessment
        </h2>
        <p className="mt-8 text-[22px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e] max-w-[80ch]">
          {assessment}
        </p>
      </section>

      {/* ----------------------------------------
          VIABILITY
          ---------------------------------------- */}
      <section className="mt-16">
        <h3 className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
          Viability
        </h3>
        <p className="mt-8 text-[18px] font-medium leading-[1.3] tracking-[-0.02em] text-zinc-900 max-w-[80ch]">
          {viability}
        </p>
      </section>

      {/* ----------------------------------------
          PRIMARY RECOMMENDATION
          ---------------------------------------- */}
      <section className="mt-16">
        <h3 className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
          Primary Recommendation
        </h3>
        <p className="mt-8 text-[20px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e] max-w-[80ch]">
          {primaryRecommendation}
        </p>
      </section>
    </article>
  );
}

// ============================================
// EXAMPLE WITH REAL DATA
// ============================================

export function ExecutiveSummaryExample() {
  return (
    <div className="max-w-[900px] mx-auto px-10 py-20 bg-white min-h-screen">
      {/* Section Header */}
      <h1 className="text-[36px] font-semibold tracking-tight text-zinc-900 mb-12">
        Executive Summary
      </h1>

      <ExecutiveSummary
        assessment="Sleep Number sells BCG mattresses. Google ships Nest Hub with Soli radar. Origin Wireless commercializes WiFi respiration sensing. The sensing physics for non-contact vital signs is solved—the remaining challenge is motion artifact rejection and multi-person separation. Your choice isn't which technology works, but which deployment context you're optimizing for: furniture-integrated BCG for sleep and seated monitoring, 60GHz radar for general room sensing, or WiFi CSI for zero-hardware respiration detection."
        viability="Viable with high confidence for respiration; moderate confidence for heart rate with motion"
        primaryRecommendation="Start with furniture-integrated BCG using commodity piezoelectric films—it's the lowest-risk path with proven accuracy (±2-3 BPM) already deployed in automotive and sleep products. For true air-coupled sensing at 1-3m, 60GHz FMCW radar with transformer-based ML is the state-of-art, but expect $500K-2M in ML development to match Google's motion rejection capability. The paradigm-level opportunity is smartphone ultrasonic sensing—if device variability is manageable, it commoditizes vital signs to any phone at zero hardware cost."
      />
    </div>
  );
}

export default ExecutiveSummary;
