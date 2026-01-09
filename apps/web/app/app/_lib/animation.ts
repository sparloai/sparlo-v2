/**
 * Consolidated Animation System for Sparlo
 *
 * This module provides:
 * - Duration constants in milliseconds
 * - Easing curves for CSS and Framer Motion
 * - Spring presets for physics-based animations
 * - Stagger configuration with performance caps
 * - Type-safe variant factories
 *
 * @see https://motion.dev/docs for Framer Motion docs
 */
import { type Transition, type Variants } from 'framer-motion';

// Duration (in milliseconds)
export const DURATION = {
  instant: 100, // toggles, checkboxes
  fast: 150, // hover states
  normal: 200, // standard UI
  moderate: 250, // modals, dropdowns
  relaxed: 300, // panels, cards
  page: 400, // route changes
} as const satisfies Record<string, number>;

// Easing curves (cubic-bezier format for Framer Motion)
export const EASE = {
  out: [0.25, 1, 0.5, 1] as const, // ease-out-quart (entering)
  in: [0.4, 0, 1, 1] as const, // ease-in (exiting)
  inOut: [0.83, 0, 0.17, 1] as const, // ease-in-out-quint (morphing)
  outExpo: [0.16, 1, 0.3, 1] as const, // ease-out-expo (premium feel)
} satisfies Record<string, readonly [number, number, number, number]>;

// CSS easing values (for use in CSS transitions)
export const CSS_EASE = {
  out: 'cubic-bezier(0.25, 1, 0.5, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  inOut: 'cubic-bezier(0.83, 0, 0.17, 1)',
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

// Spring presets for Framer Motion
export const SPRING = {
  snappy: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
    mass: 1,
  } as Transition,
  smooth: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 1,
  } as Transition,
  gentle: {
    type: 'spring',
    stiffness: 200,
    damping: 25,
    mass: 1,
  } as Transition,
  // Mobile-optimized (faster settling)
  mobile: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
    mass: 0.8,
  } as Transition,
} as const;

// Stagger delays (in seconds)
export const STAGGER = {
  fast: 0.03,
  normal: 0.04,
  relaxed: 0.06,
  // Performance caps
  maxItems: 20,
  maxDuration: 0.5, // 500ms total cap
} as const;

/**
 * Creates fade + slide variants for page transitions
 * @param yOffset - Vertical offset in pixels (default 8)
 */
export function createFadeSlideVariants(yOffset: number = 8): Variants {
  return {
    initial: { opacity: 0, y: yOffset },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DURATION.relaxed / 1000,
        ease: EASE.out,
      },
    },
    exit: {
      opacity: 0,
      y: -yOffset / 2,
      transition: {
        duration: DURATION.fast / 1000,
        ease: EASE.in,
      },
    },
  } satisfies Variants;
}

// Preset variants
export const fadeVariants = createFadeSlideVariants(0);
export const slideUpVariants = createFadeSlideVariants(8);

/**
 * Creates stagger container variants with performance caps
 * @param delay - Base delay between children (default STAGGER.normal)
 */
export function createStaggerContainer(
  delay: number = STAGGER.normal,
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: Math.min(
          delay,
          STAGGER.maxDuration / STAGGER.maxItems,
        ),
        delayChildren: delay / 2,
      },
    },
  } satisfies Variants;
}

/**
 * Standard item variants for stagger animations
 */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.relaxed / 1000,
      ease: EASE.out,
    },
  },
};

// Legacy exports for backwards compatibility
export const EASING = EASE;
export const TIMING = {
  fast: DURATION.fast / 1000,
  normal: DURATION.normal / 1000,
  slow: DURATION.relaxed / 1000,
  pageTransition: DURATION.page / 1000,
  pageExit: DURATION.moderate / 1000,
  pulse: 2,
  spin: 8,
  messageRotation: 3000,
};
