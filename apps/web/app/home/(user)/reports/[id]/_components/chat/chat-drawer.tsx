'use client';

import type { ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { CHAT_DRAWER_WIDTH } from '../../_lib/constants';
import './chat-theme.css';

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
          {/* Backdrop - atmospheric blur with depth */}
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(8, 11, 18, 0.85) 0%, rgba(8, 11, 18, 0.95) 100%)',
              backdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sidebar - Glass morphism panel */}
          <motion.aside
            className={`chat-altitude chat-noise-overlay fixed right-0 z-50 flex w-full flex-col overflow-hidden ${
              fullHeight ? 'top-0 h-screen' : 'top-16 h-[calc(100%-4rem)]'
            }`}
            style={{
              width: `min(100%, ${CHAT_DRAWER_WIDTH}px)`,
              background:
                'linear-gradient(180deg, rgba(13, 17, 23, 0.98) 0%, rgba(8, 11, 18, 0.99) 100%)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.04)',
              boxShadow:
                '-20px 0 60px -20px rgba(0, 0, 0, 0.5), inset 1px 0 0 0 rgba(255, 255, 255, 0.02)',
            }}
            initial={{ x: '100%', opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.8 }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
            role="complementary"
            aria-label="Report Assistant"
          >
            {/* Subtle top gradient accent */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(100, 181, 246, 0.3) 50%, transparent 100%)',
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
