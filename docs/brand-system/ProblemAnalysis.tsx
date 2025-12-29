/**
 * ProblemAnalysis
 *
 * Air Company Aesthetic - Technical Monograph, Not AI Tool
 *
 * Structure:
 * 1. What's Wrong — Prose block
 * 2. Why It's Hard — Prose block
 * 3. Governing Equation — Monospace, subtle background
 * 4. First Principles Insight — Dark block (key reframe)
 * 5. What Industry Does Today — List with limitations
 * 6. Current State of the Art — Clean minimal table
 */

import React from 'react';

// ============================================
// TYPES
// ============================================

interface IndustryItem {
  name: string;
  limitation: string;
}

interface StateOfArtRow {
  entity: string;
  approach: string;
  performance: string;
  roadmap: string;
}

interface GoverningEquation {
  equation: string;
  caption: string;
  explanation: string;
}

interface FirstPrinciplesInsight {
  headline: string;
  explanation: string;
}

interface ProblemAnalysisProps {
  whatsWrong: string;
  whyItsHard: string;
  governingEquation: GoverningEquation;
  firstPrinciples: FirstPrinciplesInsight;
  industryToday: IndustryItem[];
  stateOfArt: StateOfArtRow[];
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ProblemAnalysis({
  whatsWrong,
  whyItsHard,
  governingEquation,
  firstPrinciples,
  industryToday,
  stateOfArt,
}: ProblemAnalysisProps) {
  return (
    <article className="border-l-2 border-zinc-900 bg-white pl-10">
      {/* ----------------------------------------
          WHAT'S WRONG
          ---------------------------------------- */}
      <section>
        <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
          What's Wrong
        </span>
        <p className="mt-4 text-[20px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e] max-w-[80ch]">
          {whatsWrong}
        </p>
      </section>

      {/* ----------------------------------------
          WHY IT'S HARD
          ---------------------------------------- */}
      <section className="mt-12 pt-8 border-t border-zinc-200">
        <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
          Why It's Hard
        </span>
        <p className="mt-4 text-[20px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e] max-w-[80ch]">
          {whyItsHard}
        </p>
      </section>

      {/* ----------------------------------------
          GOVERNING EQUATION
          ---------------------------------------- */}
      <section className="mt-12 pt-8 border-t border-zinc-200">
        <div className="bg-zinc-50 border border-zinc-200 p-8 max-w-[80ch]">
          <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
            Governing Equation
          </span>

          {/* The equation itself - monospace, larger */}
          <p className="mt-6 font-mono text-[22px] text-zinc-900">
            {governingEquation.equation}
          </p>
          <p className="mt-2 text-[18px] text-zinc-500 italic">
            {governingEquation.caption}
          </p>

          {/* Supporting explanation */}
          <p className="mt-6 text-[18px] leading-[1.4] text-zinc-600">
            {governingEquation.explanation}
          </p>
        </div>
      </section>

      {/* ----------------------------------------
          FIRST PRINCIPLES INSIGHT
          ---------------------------------------- */}
      <section className="mt-16 mb-16 pt-8 border-t border-zinc-200 max-w-[60ch]">
        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
          First Principles Insight
        </span>
        <h3 className="mt-4 text-[28px] font-medium leading-[1.25] text-zinc-900">
          {firstPrinciples.headline}
        </h3>
        <p className="mt-4 text-[18px] leading-[1.6] text-zinc-500">
          {firstPrinciples.explanation}
        </p>
      </section>

      {/* ----------------------------------------
          WHAT INDUSTRY DOES TODAY
          ---------------------------------------- */}
      <section className="mt-12 pt-8 border-t border-zinc-200">
        <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
          What Industry Does Today
        </span>

        <div className="mt-6 space-y-6 max-w-[80ch]">
          {industryToday.map((item, index) => (
            <div key={index}>
              <h4 className="text-[18px] font-medium text-zinc-900">
                {item.name}
              </h4>
              <p className="mt-1 text-[18px] text-zinc-600">
                <span className="text-zinc-400">Limitation:</span> {item.limitation}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------
          CURRENT STATE OF THE ART - Table
          ---------------------------------------- */}
      <section className="mt-12 pt-8 border-t border-zinc-200">
        <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
          Current State of the Art
        </span>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-[18px]">
            <thead>
              <tr className="border-b border-zinc-300">
                <th className="text-left py-4 pr-8 font-medium text-zinc-500">Entity</th>
                <th className="text-left py-4 pr-8 font-medium text-zinc-500">Approach</th>
                <th className="text-left py-4 pr-8 font-medium text-zinc-500">Performance</th>
                <th className="text-left py-4 font-medium text-zinc-500">Roadmap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {stateOfArt.map((row, index) => (
                <tr key={index}>
                  <td className="py-4 pr-8 font-medium text-zinc-900">{row.entity}</td>
                  <td className="py-4 pr-8 text-zinc-600">{row.approach}</td>
                  <td className="py-4 pr-8 text-zinc-600">{row.performance}</td>
                  <td className="py-4 text-zinc-500 text-[18px]">{row.roadmap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}

// ============================================
// EXAMPLE WITH REAL DATA
// ============================================

export function ProblemAnalysisExample() {
  return (
    <div className="max-w-[900px] mx-auto px-10 py-20 bg-white min-h-screen">
      {/* Section Header */}
      <h1 className="text-[36px] font-semibold tracking-tight text-zinc-900 mb-12">
        Problem Analysis
      </h1>

      <ProblemAnalysis
        whatsWrong="Current non-contact vital sign sensing fails at the 'last mile': detection works in controlled conditions but degrades catastrophically with subject motion, multi-person environments, or varying distances. Commercial products either require stillness (Nest Hub sleep tracking), contact (Sleep Number mattress), or produce unreliable readings that physicians won't trust for clinical decisions."
        whyItsHard="The fundamental challenge is signal-to-noise ratio at physiological scales. Cardiac motion is 0.1-0.5mm; respiratory motion is 5-12mm. Ambient motion from walking, gesturing, or even shifting weight can exceed 100mm. The sensing physics must extract sub-millimeter periodic signals from a background 100-1000x larger in amplitude."
        governingEquation={{
          equation: 'Δφ = 4πd/λ',
          caption: 'Phase shift from displacement d at wavelength λ',
          explanation:
            'At 60GHz (λ=5mm), 0.1mm cardiac displacement creates 7.2° phase shift. Respiration (10mm) creates 720°. Motion rejection requires separating signals differing by 100:1 in amplitude.',
        }}
        firstPrinciples={{
          headline: 'The sensing physics is solved—motion rejection is the remaining problem',
          explanation:
            "Every major sensing modality (radar, camera, acoustic, BCG) can detect the physiological signals in controlled conditions. The gap is robustness to real-world motion. Google's Nest Hub works because it assumes a stationary sleeping subject. The breakthrough needed isn't better sensors—it's better algorithms for separating physiological signals from motion artifacts.",
        }}
        industryToday={[
          {
            name: 'Google Nest Hub (Soli radar)',
            limitation: 'Requires subject to be stationary and within 1m; sleep tracking only',
          },
          {
            name: 'Sleep Number SleepIQ',
            limitation: 'Contact-based BCG; only works in bed',
          },
          {
            name: 'Vayyar (4D imaging radar)',
            limitation: 'Focused on presence detection; vital signs secondary',
          },
          {
            name: 'Origin Wireless (WiFi CSI)',
            limitation: 'Respiration only; heart rate unreliable',
          },
        ]}
        stateOfArt={[
          {
            entity: 'Google Nest Hub',
            approach: '60GHz FMCW with ML',
            performance: '±3 BPM HR',
            roadmap: 'FDA clearance pending',
          },
          {
            entity: 'Sleep Number',
            approach: 'BCG piezoelectric',
            performance: '±2 BPM HR',
            roadmap: 'Expanding to chairs',
          },
          {
            entity: 'Vayyar',
            approach: '4D imaging radar',
            performance: 'Presence + RR',
            roadmap: 'B2B smart home',
          },
          {
            entity: 'Origin Wireless',
            approach: 'WiFi channel state',
            performance: '±1 BPM RR',
            roadmap: 'Elder care focus',
          },
        ]}
      />
    </div>
  );
}

export default ProblemAnalysis;
