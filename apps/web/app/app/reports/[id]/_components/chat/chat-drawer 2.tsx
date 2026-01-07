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
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <motion.aside
            className={`fixed right-0 z-50 flex w-full flex-col overflow-hidden bg-white ${
              fullHeight ? 'top-0 h-screen' : 'top-16 h-[calc(100%-4rem)]'
            }`}
            style={{
              width: `min(100%, ${CHAT_DRAWER_WIDTH}px)`,
              borderLeft: '1px solid #e4e4e7',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            role="complementary"
            aria-label="Go Deeper"
          >
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
