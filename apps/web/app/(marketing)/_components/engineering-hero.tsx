'use client';

import { memo, useEffect, useRef, useState } from 'react';

import Link from 'next/link';

/**
 * Engineering Intelligence Hero Section
 *
 * Air Company Aesthetic - Full viewport video background
 *
 * Features:
 * - Autoplay muted video background
 * - Centered typography hierarchy
 * - Minimal, confident copy
 * - Single prominent CTA
 */

// High-quality royalty-free video sources (Pexels)
const VIDEO_SOURCES = [
  'https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4', // Technology/circuit
  'https://videos.pexels.com/video-files/3141207/3141207-uhd_2560_1440_30fps.mp4', // Laboratory
  'https://videos.pexels.com/video-files/4065385/4065385-uhd_2560_1440_30fps.mp4', // Data center
];

export const EngineeringHero = memo(function EngineeringHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = 0.75; // Slightly slower for dramatic effect
    }
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-zinc-950">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setVideoLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-60' : 'opacity-0'
          }`}
          style={{ filter: 'grayscale(30%)' }}
        >
          <source src={VIDEO_SOURCES[0]} type="video/mp4" />
        </video>

        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
      </div>

      {/* Content Layer - Centered */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
        {/* Headline */}
        <h1 className="text-[40px] leading-[1.2] font-medium tracking-[-0.02em] text-white md:text-[64px] lg:text-[80px]">
          Engineering Intelligence Model
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-[45ch] text-[18px] leading-[1.2] tracking-[-0.02em] text-zinc-300/90 md:text-[22px]">
          Innovative solutions to complex technical challenges.
        </p>

        {/* CTA */}
        <Link
          href="/home"
          className="mt-10 rounded-full bg-white/95 px-8 py-3.5 text-[15px] leading-[1.2] font-medium tracking-[-0.02em] text-zinc-900 backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg"
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
