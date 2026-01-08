'use client';

import { motion } from 'framer-motion';

import { useSidebarState } from '../../_lib/sidebar-context';

/**
 * Main content wrapper that responds to sidebar state
 * Shifts content right when sidebar is expanded
 * Includes fade-in animation for page transitions
 */
export function MainContent({ children }: { children: React.ReactNode }) {
  const { sidebarWidth } = useSidebarState();

  return (
    <motion.main
      className="flex-1 pt-14 transition-[margin-left] duration-300 ease-out"
      style={{ marginLeft: sidebarWidth }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.main>
  );
}
