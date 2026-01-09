'use client';

import { usePathname } from 'next/navigation';

import { AnimatePresence, motion } from 'framer-motion';

import { DURATION, EASE } from '~/app/_lib/animation';
import { FrozenRouter } from '~/components/frozen-router';

/**
 * Page transition template for the app routes.
 *
 * Uses AnimatePresence + FrozenRouter for smooth page transitions:
 * - FrozenRouter keeps router context stable during exit animations
 * - AnimatePresence with mode="wait" ensures clean exit/enter sequencing
 * - Subtle opacity + translateY creates premium feel without being distracting
 *
 * @example
 * Navigation flow:
 * 1. User clicks link → exit animation starts
 * 2. FrozenRouter keeps old page visible during exit
 * 3. Exit completes → new page enters with fresh animation
 */
export default function AppTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          duration: DURATION.page / 1000,
          ease: EASE.out,
        }}
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
