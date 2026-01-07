import { memo } from 'react';

import type { Mode } from './mode-tabs';

/**
 * Process & Methodology Section
 *
 * Air Company Aesthetic - Two column layout
 *
 * Features:
 * - Left column: Large section title
 * - Right column: Content with superscript numbers (left-aligned text)
 * - Typography: -0.02em tracking, 1.2 line-height
 * - Near-monochrome palette
 * - Mode-aware content (Engineers vs Investors)
 */

const ENGINEERS_CONTENT = {
  process:
    'Input a detailed technical challenge. Sparlo runs a systematic innovation methodology to generate a thorough problem analysis with solution pathways, and delivers the report in 30 minutes.',
  methodology: [
    'Root Cause Analysis',
    'Problem Reframe',
    'Non-Inventive Solutions',
    'Cross-Domain Innovation',
    'Commercial Viability',
    'Sustainability Assessment',
  ],
};

const INVESTORS_CONTENT = {
  process:
    'Upload a pitch deck or investment memo. Sparlo validates technical claims against physics and literature, maps the competitive solution space, and delivers a due diligence report in 30 minutes.',
  methodology: [
    'Claims Extraction',
    'Physics Validation',
    'Solution Space Mapping',
    'Commercialization Reality Check',
    'Risk & Scenario Analysis',
    'Diligence Roadmap',
  ],
};

interface MethodologySectionProps {
  mode: Mode;
}

export const MethodologySection = memo(function MethodologySection({
  mode,
}: MethodologySectionProps) {
  const content = mode === 'engineers' ? ENGINEERS_CONTENT : INVESTORS_CONTENT;

  return (
    <section className="bg-white px-8 py-24 md:px-16 lg:px-24">
      <div className="mx-auto max-w-[1400px]">
        {/* The Process */}
        <div className="border-t border-zinc-200 pt-16">
          <div className="flex flex-col gap-8 md:flex-row md:justify-between">
            {/* Left - Title */}
            <div className="md:w-1/3">
              <h2 className="text-[28px] leading-[1.2] font-normal tracking-[-0.02em] text-zinc-900 md:text-[36px]">
                The Process
              </h2>
            </div>

            {/* Right - Description */}
            <div className="md:w-2/3">
              <p className="text-[32px] leading-[1.2] font-normal tracking-[-0.02em] text-zinc-900 md:text-[40px]">
                {content.process}
              </p>
            </div>
          </div>
        </div>

        {/* The Methodology */}
        <div className="mt-24 border-t border-zinc-200 pt-16">
          <div className="flex flex-col gap-8 md:flex-row md:justify-between">
            {/* Left - Title */}
            <div className="md:w-1/3">
              <h2 className="text-[28px] leading-[1.2] font-normal tracking-[-0.02em] text-zinc-900 md:text-[36px]">
                The Methodology
              </h2>
            </div>

            {/* Right - Steps (in right column, left-aligned text) */}
            <div className="md:w-1/2">
              <div className="space-y-6">
                {content.methodology.map((step, idx) => (
                  <p
                    key={idx}
                    className="text-[20px] leading-[1.3] font-normal tracking-[-0.02em] text-zinc-900 md:text-[24px]"
                  >
                    <sup className="mr-1 text-[12px] font-normal text-zinc-400 md:text-[14px]">
                      {idx + 1}
                    </sup>
                    {step}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default MethodologySection;
