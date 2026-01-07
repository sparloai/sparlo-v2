/**
 * Centralized animation constants for Framer Motion
 *
 * Fixes:
 * - P1-050: Type assertion easing tuples
 * - P2-055: Animation constants duplication
 */

// Easing curves as properly typed mutable tuples
export const EASING = {
  easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
  easeOut: [0, 0, 0.2, 1] as [number, number, number, number],
  easeInOut: [0.4, 0, 0.6, 1] as [number, number, number, number],
  // Custom easing for page transitions
  custom: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

// Duration values in seconds (for Framer Motion)
export const DURATION = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  // Specific durations
  pageTransition: 0.4,
  pageExit: 0.25,
  pulse: 2,
  spin: 8,
  messageRotation: 3000, // milliseconds for setInterval
};

// Stagger delays for list animations
export const STAGGER = {
  fast: 0.05,
  normal: 0.08,
  slow: 0.12,
};
