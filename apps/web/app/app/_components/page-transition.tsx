'use client';

import { ReactNode } from 'react';

import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';

import { usePrefersReducedMotion } from '@kit/ui/hooks';

import { DURATION, EASING } from '../_lib/animation-constants';

const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.pageTransition,
      ease: EASING.custom,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: DURATION.pageExit,
      ease: EASING.custom,
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
