'use client';

import { ReactNode } from 'react';

import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';

import { usePrefersReducedMotion } from '../_hooks/use-prefers-reduced-motion';

// Custom easing as const to satisfy TypeScript tuple requirement
const customEasing = [0.25, 0.1, 0.25, 1] as const;

const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: customEasing as unknown as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.25,
      ease: customEasing as unknown as [number, number, number, number],
    },
  },
};

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}
