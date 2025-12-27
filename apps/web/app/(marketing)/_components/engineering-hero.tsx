'use client';

import { memo, useEffect, useRef } from 'react';

import Link from 'next/link';

/**
 * Engineering Intelligence Hero Section
 *
 * Air Company Aesthetic - Pure, minimal, confident
 *
 * Features:
 * - Looping background video (first 8 seconds)
 * - Dark overlay for text legibility
 * - Light font weight typography
 * - Centered layout
 * - Single prominent CTA
 */

export const EngineeringHero = memo(function EngineeringHero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Loop only the first 8 seconds
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= 8) {
        video.currentTime = 0;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  return (
    <section className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-zinc-950">
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        poster=""
      >
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content Layer - Centered */}
      <div className="relative z-10 flex flex-col items-center px-8 text-center">
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
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <div className="h-12 w-[1px] bg-gradient-to-b from-zinc-500 to-transparent" />
      </div>
    </section>
  );
});

export default EngineeringHero;
