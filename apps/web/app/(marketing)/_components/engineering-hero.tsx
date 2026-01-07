'use client';

import { memo, useEffect, useRef } from 'react';

import Link from 'next/link';

/**
 * Engineering Intelligence Hero Section
 *
 * Air Company Aesthetic - Pure, minimal, confident
 *
 * Features:
 * - Looping background video (6 seconds, precise RAF loop)
 * - Dark overlay for text legibility
 * - Light font weight typography
 * - Centered layout
 * - Single prominent CTA
 */

// Video timing - skip first 0.5s (scene transition) and loop at 6.5s
const VIDEO_START_TIME = 0.5;
const VIDEO_END_TIME = 6.5;

export const EngineeringHero = memo(function EngineeringHero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use requestAnimationFrame for precise frame-accurate looping
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId: number;

    const checkLoop = () => {
      // Loop back to start time when reaching end
      if (video.currentTime >= VIDEO_END_TIME) {
        video.currentTime = VIDEO_START_TIME;
      }
      rafId = requestAnimationFrame(checkLoop);
    };

    // Set initial start position and begin loop check
    const handleLoadedData = () => {
      video.currentTime = VIDEO_START_TIME;
    };

    const handlePlay = () => {
      rafId = requestAnimationFrame(checkLoop);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', handlePlay);

    // If video is already loaded, set start position
    if (video.readyState >= 2) {
      video.currentTime = VIDEO_START_TIME;
    }

    // If video is already playing, start checking immediately
    if (!video.paused) {
      rafId = requestAnimationFrame(checkLoop);
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', handlePlay);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-zinc-950">
      {/* Background Video - custom 6s loop using RAF for precision */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content Layer - Centered */}
      <div className="relative z-10 flex flex-col items-center px-8 text-center">
        {/* Headline */}
        <h1 className="font-heading text-[40px] leading-[1.2] font-light tracking-[-0.02em] text-white md:text-[64px] lg:text-[80px]">
          Engineering AI
        </h1>

        {/* Subtitle */}
        <p className="font-heading mt-6 max-w-[45ch] text-[18px] leading-[1.2] font-light tracking-[-0.02em] text-white/70 md:text-[22px]">
          Sparlo solves deep tech problems with rigorous first principles thinking.
        </p>

        {/* CTA */}
        <Link
          href="/app"
          className="font-heading mt-10 inline-flex min-h-[44px] items-center rounded-md bg-white px-8 py-3.5 text-base leading-[1.2] font-medium tracking-[-0.02em] text-zinc-900 shadow-lg transition-all hover:bg-zinc-100 hover:shadow-xl"
        >
          Run Analysis
        </Link>

        {/* Value Prop - More prominent */}
        <p className="mt-4 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium tracking-[-0.02em] text-white/80 backdrop-blur-sm">
          First Report Free
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <div className="h-12 w-[1px] bg-gradient-to-b from-zinc-500 to-transparent" />
      </div>
    </section>
  );
});

export default EngineeringHero;
