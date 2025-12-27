import { memo } from 'react';

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
 */

const processSteps = [
  'Input detailed technical challenge.',
  'Model runs systematic innovation methodology to generate solutions.',
  'Report delivered in 30 minutes.',
];

const methodologySteps = [
  'Root Cause Analysis',
  'Problem Reframe',
  'Non-Inventive Solutions',
  'Cross-Domain Innovation',
  'Commercial Viability',
  'Sustainability Assessment',
];

export const MethodologySection = memo(function MethodologySection() {
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

            {/* Right - Steps (in right column, left-aligned text) */}
            <div className="md:w-1/2">
              <div className="space-y-6">
                {processSteps.map((step, idx) => (
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
                {methodologySteps.map((step, idx) => (
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
