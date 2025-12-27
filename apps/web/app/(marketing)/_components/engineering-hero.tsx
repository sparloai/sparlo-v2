'use client';

import { memo } from 'react';

import Link from 'next/link';

/**
 * Engineering Intelligence Hero Section
 *
 * Air Company Aesthetic - Pure, minimal, confident
 *
 * Features:
 * - Solid dark background (no video)
 * - Light font weight typography
 * - Centered layout
 * - Single prominent CTA
 */

export const EngineeringHero = memo(function EngineeringHero() {
  return (
    <section className="relative flex h-screen w-full items-center justify-center bg-zinc-950">
      {/* Content Layer - Centered */}
      <div className="flex flex-col items-center px-8 text-center">
        {/* Headline */}
        <h1
          className="text-[40px] leading-[1.2] font-light tracking-[-0.02em] text-white md:text-[64px] lg:text-[80px]"
          style={{
            fontFamily:
              "'Suisse Intl', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          Engineering Intelligence Model
        </h1>

        {/* Subtitle */}
        <p
          className="mt-6 max-w-[45ch] text-[18px] leading-[1.2] font-light tracking-[-0.02em] text-white/70 md:text-[22px]"
          style={{
            fontFamily:
              "'Suisse Intl', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          Innovative solutions to complex technical challenges.
        </p>

        {/* CTA */}
        <Link
          href="/home"
          className="mt-10 bg-white px-8 py-3.5 text-[15px] leading-[1.2] font-medium tracking-[-0.02em] text-zinc-900 transition-colors hover:bg-zinc-100"
          style={{
            fontFamily:
              "'Suisse Intl', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          Run Analysis
        </Link>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="h-12 w-[1px] bg-gradient-to-b from-zinc-500 to-transparent" />
      </div>
    </section>
  );
});

export default EngineeringHero;
