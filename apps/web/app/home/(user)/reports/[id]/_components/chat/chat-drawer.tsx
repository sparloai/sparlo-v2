'use client';

import type { ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { CHAT_DRAWER_WIDTH } from '../../_lib/constants';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Whether this is the hybrid report layout (full height) vs standard (below nav) */
  fullHeight?: boolean;
}

export function ChatDrawer({
  isOpen,
  onClose,
  children,
  fullHeight = false,
}: ChatDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - click to close on mobile */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <motion.aside
            className={`fixed right-0 z-50 flex w-full flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 ${
              fullHeight ? 'top-0 h-screen' : 'top-16 h-[calc(100%-4rem)]'
            }`}
            style={{ width: `min(100%, ${CHAT_DRAWER_WIDTH}px)` }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            role="complementary"
            aria-label="Chat with report"
          >
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
