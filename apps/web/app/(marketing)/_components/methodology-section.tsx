import { memo } from 'react';

/**
 * Innovation Methodology Section
 *
 * Air Company Aesthetic - Two-column layout
 *
 * Left: Section label
 * Right: Methodology description as flowing prose
 */

export const MethodologySection = memo(function MethodologySection() {
  return (
    <section className="bg-white px-8 py-24 md:px-16 lg:px-24">
      {/* Top border */}
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-16 h-px w-full bg-zinc-200" />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-16">
          {/* Left column - Label */}
          <div className="md:col-span-3">
            <h2 className="text-[18px] font-normal leading-[1.2] tracking-[-0.02em] text-zinc-900">
              Innovation Methodology
            </h2>
          </div>

          {/* Right column - Description */}
          <div className="md:col-span-9">
            <p className="max-w-[65ch] text-[28px] font-normal leading-[1.2] tracking-[-0.02em] text-zinc-900">
              Root cause analysis, first principles reasoning, problem
              reframing, simple solutions, cross-domain innovation, frontier
              technology landscape, IP landscape, sustainability assessment,
              constraint feasibility, commercial viability, structured
              recommendation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
});

export default MethodologySection;
