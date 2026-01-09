'use client';

import { type ReactNode, useContext, useEffect, useState } from 'react';

import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Maximum time to keep the router context frozen during exit animations.
 * After this time, the context is released to prevent memory leaks.
 */
const MAX_ANIMATION_DURATION = 500;

interface FrozenRouterProps {
  children: ReactNode;
}

/**
 * Freezes the Next.js router context during exit animations.
 *
 * Without this, the router updates immediately on navigation, causing
 * exit animations to break because the component tree changes before
 * the animation completes.
 *
 * This implementation includes a safety timeout to prevent memory leaks
 * if animations stall or don't complete properly.
 *
 * @example
 * ```tsx
 * // In page template
 * export default function Template({ children }) {
 *   return (
 *     <AnimatePresence mode="wait">
 *       <motion.div key={pathname} exit={{ opacity: 0 }}>
 *         <FrozenRouter>{children}</FrozenRouter>
 *       </motion.div>
 *     </AnimatePresence>
 *   );
 * }
 * ```
 */
export function FrozenRouter({ children }: FrozenRouterProps) {
  const context = useContext(LayoutRouterContext);
  // Capture context once via useState initializer (safe to read during render)
  const [frozenContext, setFrozenContext] = useState(() => context);

  useEffect(() => {
    // Force cleanup if animation stalls
    const timeout = setTimeout(() => {
      setFrozenContext(null);
    }, MAX_ANIMATION_DURATION);

    return () => clearTimeout(timeout);
  }, []);

  // If context was released (timeout or null), render children directly
  if (!frozenContext) {
    return <>{children}</>;
  }

  return (
    <LayoutRouterContext.Provider value={frozenContext}>
      {children}
    </LayoutRouterContext.Provider>
  );
}
