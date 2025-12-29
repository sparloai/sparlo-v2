'use client';

import { useCallback, useEffect, useState } from 'react';

// ============================================
// CONSTANTS
// ============================================

/** Offset from top when scrolling to a section (pixels) */
export const TOC_SCROLL_OFFSET = 100;

/** TOC sticky position from top (Tailwind: top-24 = 96px) */
export const TOC_STICKY_TOP = 96;

/** TOC sticky position for reports nav context (Tailwind: top-28 = 112px) */
export const TOC_STICKY_TOP_WITH_NAV = 112;

/** Root margin for intersection observer */
const OBSERVER_ROOT_MARGIN = '-20% 0px -75% 0px';

/** Threshold for scroll-based visibility (50% of viewport) */
const SCROLL_VISIBILITY_THRESHOLD = 0.5;

// ============================================
// TYPES
// ============================================

export interface TocSection {
  id: string;
  title: string;
  subsections?: { id: string; title: string }[];
}

interface UseTocScrollOptions {
  /** All section IDs to track (including subsections) */
  sectionIds: string[];
  /** Offset from top when scrolling to section */
  scrollOffset?: number;
  /** Enable progress tracking */
  trackProgress?: boolean;
  /** Enable scroll visibility tracking (for floating TOC) */
  trackVisibility?: boolean;
}

interface UseTocScrollReturn {
  /** Currently active section ID */
  activeSection: string;
  /** Navigate to a section by ID */
  navigateToSection: (id: string) => void;
  /** Document scroll progress (0-100) */
  progress: number;
  /** Whether user has scrolled past visibility threshold */
  hasScrolled: boolean;
}

// ============================================
// HOOK
// ============================================

/**
 * Shared hook for TOC scroll tracking and navigation.
 * Consolidates scroll listeners and intersection observers.
 */
export function useTocScroll({
  sectionIds,
  scrollOffset = TOC_SCROLL_OFFSET,
  trackProgress = false,
  trackVisibility = false,
}: UseTocScrollOptions): UseTocScrollReturn {
  const [activeSection, setActiveSection] = useState<string>(
    sectionIds[0] ?? '',
  );
  const [progress, setProgress] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Intersection Observer for active section tracking
  useEffect(() => {
    if (sectionIds.length === 0) return;

    const observerOptions: IntersectionObserverInit = {
      rootMargin: OBSERVER_ROOT_MARGIN,
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      }
    }, observerOptions);

    for (const id of sectionIds) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [sectionIds]);

  // Scroll listener for progress and visibility (only when needed)
  useEffect(() => {
    if (!trackProgress && !trackVisibility) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;

        if (trackVisibility) {
          setHasScrolled(scrollY > windowHeight * SCROLL_VISIBILITY_THRESHOLD);
        }

        if (trackProgress) {
          const docHeight =
            document.documentElement.scrollHeight - windowHeight;
          const newProgress = Math.min((scrollY / docHeight) * 100, 100);
          setProgress(newProgress);
        }

        ticking = false;
      });

      ticking = true;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trackProgress, trackVisibility]);

  // Navigate to section
  const navigateToSection = useCallback(
    (id: string) => {
      const element = document.getElementById(id);
      if (element) {
        const top =
          element.getBoundingClientRect().top + window.scrollY - scrollOffset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    },
    [scrollOffset],
  );

  return {
    activeSection,
    navigateToSection,
    progress,
    hasScrolled,
  };
}

// ============================================
// UTILITY: Flatten sections to IDs
// ============================================

/**
 * Extracts all section IDs (including subsections) from TOC sections.
 */
export function flattenSectionIds(sections: TocSection[]): string[] {
  const ids: string[] = [];
  for (const section of sections) {
    ids.push(section.id);
    if (section.subsections) {
      for (const sub of section.subsections) {
        ids.push(sub.id);
      }
    }
  }
  return ids;
}
