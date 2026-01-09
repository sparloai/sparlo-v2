'use client';

import { useCallback, useState } from 'react';

import { createPortal } from 'react-dom';

import { AnimatePresence, motion } from 'framer-motion';

import { signOutAction } from '../_lib/server/signout-action';

const DURATION = {
  fadeOut: 0.3,
  fadeIn: 0.4,
  hold: 0.5,
};

const EASING = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

interface SignOutButtonProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Sign out button with smooth full-screen transition animation.
 * Fades to black, then redirects to home page.
 */
export function SignOutButton({ children, className }: SignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);

    // Wait for fade animation to complete before signing out
    await new Promise((resolve) =>
      setTimeout(resolve, (DURATION.fadeOut + DURATION.hold) * 1000),
    );

    // Call the server action
    await signOutAction();
  }, []);

  return (
    <>
      <button type="button" onClick={handleSignOut} className={className}>
        {children}
      </button>

      {/* Full-screen transition overlay */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isSigningOut && (
              <motion.div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: DURATION.fadeOut,
                  ease: EASING,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: DURATION.fadeIn,
                    delay: DURATION.fadeOut * 0.5,
                    ease: EASING,
                  }}
                  className="text-center"
                >
                  <p className="text-lg font-medium tracking-tight text-white">
                    Signing out...
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
