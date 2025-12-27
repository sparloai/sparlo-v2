'use client';

import { memo, useEffect, useState } from 'react';

import Link from 'next/link';

/**
 * Engineering Intelligence Hero Section
 *
 * Air Company Aesthetic - Full viewport, image-driven
 *
 * Features:
 * - Rotating background images with crossfade
 * - Typography-driven hierarchy
 * - Minimal, confident copy
 * - Domain indicator synced with images
 */

const domains = [
  {
    image: '/images/hero/desalination.jpg',
    label: 'Water & Desalination',
  },
  {
    image: '/images/hero/biotech-lab.jpg',
    label: 'Biotechnology',
  },
  {
    image: '/images/hero/energy-infrastructure.jpg',
    label: 'Energy Systems',
  },
  {
    image: '/images/hero/materials-testing.jpg',
    label: 'Materials Science',
  },
  {
    image: '/images/hero/manufacturing.jpg',
    label: 'Advanced Manufacturing',
  },
];

// Fallback gradients when images aren't available
const fallbackGradients = [
  'from-zinc-900 via-zinc-800 to-zinc-950',
  'from-slate-900 via-slate-800 to-zinc-950',
  'from-neutral-900 via-neutral-800 to-zinc-950',
  'from-stone-900 via-stone-800 to-zinc-950',
  'from-gray-900 via-gray-800 to-zinc-950',
];

export const EngineeringHero = memo(function EngineeringHero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>(
    new Array(domains.length).fill(false),
  );

  // Rotate images every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % domains.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Preload images
  useEffect(() => {
    domains.forEach((domain, index) => {
      const img = new Image();
      img.onload = () => {
        setImagesLoaded((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
      };
      img.src = domain.image;
    });
  }, []);

  const currentDomain = domains[currentIndex];

  return (
    <section className="font-sans relative h-screen w-full overflow-hidden bg-black">
      {/* Background Image Layer */}
      <div className="absolute inset-0">
        {/* Images with crossfade */}
        {domains.map((domain, index) => (
          <div
            key={domain.label}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {imagesLoaded[index] ? (
              <img
                src={domain.image}
                alt=""
                className="h-full w-full object-cover opacity-50"
                style={{ filter: 'grayscale(20%)' }}
              />
            ) : (
              <div
                className={`h-full w-full bg-gradient-to-br ${fallbackGradients[index % fallbackGradients.length]}`}
              />
            )}
          </div>
        ))}

        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
      </div>

      {/* Navigation */}
      <nav className="absolute top-0 right-0 left-0 z-20 flex items-center justify-between px-8 py-6 md:px-16">
        {/* Logo */}
        <Link
          href="/"
          className="text-[18px] font-semibold tracking-[-0.02em] text-white"
        >
          Sparlo
        </Link>

        {/* Links */}
        <div className="flex items-center gap-8">
          <Link
            href="/how-it-works"
            className="hidden text-[14px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-white sm:block"
          >
            How It Works
          </Link>
          <Link
            href="/pricing"
            className="hidden text-[14px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-white sm:block"
          >
            Pricing
          </Link>
          <Link href="/auth/sign-in" className="text-[14px] tracking-[-0.02em] text-white">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Content Layer */}
      <div className="relative z-10 flex h-full flex-col justify-center px-8 md:px-16 lg:px-24">
        {/* Headline */}
        <h1 className="text-[36px] font-semibold leading-[1.2] tracking-[-0.02em] text-white md:text-[56px] lg:text-[72px]">
          Engineering Intelligence
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-[50ch] text-[18px] leading-[1.2] tracking-[-0.02em] text-zinc-300 md:text-[20px]">
          Research infrastructure for problems that span disciplines.
        </p>

        {/* Domain indicator */}
        <div className="mt-8 flex items-center gap-3">
          <span className="text-[13px] uppercase tracking-[0.1em] text-zinc-500">
            {currentDomain?.label}
          </span>
          {/* Progress dots */}
          <div className="ml-4 flex items-center gap-2">
            {domains.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-4 bg-zinc-400'
                    : 'bg-zinc-600 hover:bg-zinc-500'
                }`}
                aria-label={`View ${domains[index]?.label}`}
              />
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-12 flex items-center gap-6">
          <Link
            href="/auth/sign-up"
            className="rounded bg-white px-6 py-3 text-[15px] font-medium tracking-[-0.02em] text-zinc-900 transition-colors hover:bg-zinc-100"
          >
            See Sample Report
          </Link>
          <Link
            href="/how-it-works"
            className="text-[15px] tracking-[-0.02em] text-zinc-300 transition-colors hover:text-white"
          >
            How It Works
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="h-12 w-[1px] bg-gradient-to-b from-zinc-500 to-transparent" />
      </div>
    </section>
  );
});

export default EngineeringHero;
