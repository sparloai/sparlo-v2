/**
 * InnovationAnalysis
 *
 * Air Company Aesthetic - Technical Monograph, Not AI Tool
 *
 * Methodology transparency—showing HOW we searched, not just WHAT we found.
 * Should feel like "behind the curtain" without being dry.
 *
 * Structure:
 * 1. The Reframe — Pull quote style (22px), the key methodological insight
 * 2. Domains Searched — Minimal tags or inline list showing cross-domain exploration
 */

import React from 'react';

// ============================================
// TYPES
// ============================================

interface InnovationAnalysisProps {
  reframe: string;
  domainsSearched: string[];
  variant?: 'tags' | 'inline'; // Choose display style for domains
}

// ============================================
// MAIN COMPONENT
// ============================================

export function InnovationAnalysis({
  reframe,
  domainsSearched,
  variant = 'tags',
}: InnovationAnalysisProps) {
  return (
    <article className="border-l-2 border-zinc-900 bg-white pl-10">
      {/* ----------------------------------------
          THE REFRAME - Pull quote style
          ---------------------------------------- */}
      <section className="max-w-[60ch]">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          The Reframe
        </span>
        <p className="mt-4 text-[22px] font-medium leading-[1.35] text-zinc-900">
          {reframe}
        </p>
      </section>

      {/* ----------------------------------------
          DOMAINS SEARCHED
          ---------------------------------------- */}
      <section className="mt-12 pt-8 border-t border-zinc-200">
        <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
          Domains Searched
        </span>

        {variant === 'tags' ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {domainsSearched.map((domain, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-zinc-100 text-zinc-600 text-[14px] rounded"
              >
                {domain}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-[18px] leading-[1.8] text-zinc-600 max-w-[80ch]">
            {domainsSearched.join(' · ')}
          </p>
        )}
      </section>
    </article>
  );
}

// ============================================
// EXAMPLE WITH REAL DATA
// ============================================

export function InnovationAnalysisExample() {
  return (
    <div className="max-w-[900px] mx-auto px-10 py-20 bg-white min-h-screen">
      {/* Section Header */}
      <h1 className="text-[36px] font-semibold tracking-tight text-zinc-900 mb-12">
        Innovation Analysis
      </h1>

      <InnovationAnalysis
        reframe="Instead of asking 'which sensor can detect vital signs at range,' we asked 'which approach has the most tractable motion rejection problem and the best SNR physics.'"
        domainsSearched={[
          'Automotive BCG',
          'Bat echolocation',
          'Electric fish electrolocation',
          'Submarine sonar',
          'Volcano seismology',
          'Weather radar polarimetry',
          'LIGO interferometry',
          'NASA astronaut monitoring',
        ]}
        variant="tags"
      />
    </div>
  );
}

export default InnovationAnalysis;
