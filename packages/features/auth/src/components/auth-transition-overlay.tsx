'use client';

import { AnimatePresence, motion } from 'framer-motion';

const DURATION = {
  fadeOut: 0.35,
  fadeIn: 0.4,
};

const EASING = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

interface AuthTransitionOverlayProps {
  isActive: boolean;
  message?: string;
}

/**
 * Full-screen transition overlay for auth flows.
 * Shows a smooth fade to white with an optional message.
 * Uses fixed positioning to cover the entire viewport.
 */
export function AuthTransitionOverlay({
  isActive,
  message = 'Redirecting...',
}: AuthTransitionOverlayProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: DURATION.fadeOut,
            ease: EASING,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: DURATION.fadeIn,
              delay: DURATION.fadeOut * 0.3,
              ease: EASING,
            }}
            className="text-center"
          >
            <p className="text-lg font-medium tracking-tight text-zinc-900">
              {message}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
