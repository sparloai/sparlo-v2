import { type Variants } from 'framer-motion';

import { DURATION, EASE, STAGGER } from '~/app/_lib/animation';

/**
 * Dropdown/menu animation variants for deep tech aesthetic.
 * Subtle slide and fade with optional stagger for items.
 */
export const dropdownVariants: {
  container: Variants;
  item: Variants;
} = {
  container: {
    hidden: { opacity: 0, y: -8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DURATION.fast / 1000,
        ease: EASE.out,
        staggerChildren: STAGGER.fast,
        delayChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      y: -4,
      transition: { duration: DURATION.instant / 1000 },
    },
  },
  item: {
    hidden: { opacity: 0, x: -8 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: DURATION.fast / 1000 },
    },
  },
};

/**
 * Dropdown variants for users with reduced motion preference.
 * Opacity-only transitions with no stagger.
 */
export const dropdownVariantsReduced: {
  container: Variants;
  item: Variants;
} = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.1 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.05 },
    },
  },
  item: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.05 },
    },
  },
};

/**
 * Helper to get appropriate dropdown variants based on reduced motion preference.
 */
export function getDropdownVariants(prefersReducedMotion: boolean) {
  return prefersReducedMotion ? dropdownVariantsReduced : dropdownVariants;
}
