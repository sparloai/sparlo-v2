import { memo } from 'react';

/**
 * Process & Methodology Section
 *
 * Air Company Aesthetic - Two-column layout with superscript citations
 *
 * Features:
 * - Left: Section title
 * - Right: Content with numbered steps as superscripts
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
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
            {/* Left column - Title */}
            <div className="md:col-span-3">
              <h2 className="text-[18px] leading-[1.2] font-normal tracking-[-0.02em] text-zinc-900 md:text-[20px]">
                The Process
              </h2>
            </div>

            {/* Right column - Steps (starts at column 5) */}
            <div className="md:col-span-8 md:col-start-5">
              <div className="space-y-6">
                {processSteps.map((step, idx) => (
                  <p
                    key={idx}
                    className="max-w-[55ch] text-[22px] leading-[1.2] font-normal tracking-[-0.02em] text-zinc-900 md:text-[26px]"
                  >
                    <sup className="mr-0.5 text-[14px] font-normal text-zinc-400 md:text-[16px]">
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
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
            {/* Left column - Title */}
            <div className="md:col-span-3">
              <h2 className="text-[18px] leading-[1.2] font-normal tracking-[-0.02em] text-zinc-900 md:text-[20px]">
                The Methodology
              </h2>
            </div>

            {/* Right column - Steps (starts at column 5) */}
            <div className="md:col-span-8 md:col-start-5">
              <div className="space-y-6">
                {methodologySteps.map((step, idx) => (
                  <p
                    key={idx}
                    className="text-[22px] leading-[1.2] font-normal tracking-[-0.02em] text-zinc-900 md:text-[26px]"
                  >
                    <sup className="mr-0.5 text-[14px] font-normal text-zinc-400 md:text-[16px]">
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
