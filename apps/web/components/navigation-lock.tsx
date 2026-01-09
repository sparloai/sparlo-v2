'use client';

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

interface NavigationContextValue {
  /**
   * Whether a page transition is currently in progress
   */
  isTransitioning: boolean;
  /**
   * Navigate to a URL, queueing if a transition is in progress
   */
  navigate: (href: string) => void;
  /**
   * Call this when a page transition animation completes
   */
  onTransitionComplete: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

interface NavigationProviderProps {
  children: ReactNode;
}

/**
 * Provider that prevents race conditions during page transitions.
 *
 * When a user navigates during an exit animation, the navigation is queued
 * and executed after the current transition completes.
 *
 * @example
 * ```tsx
 * // In root layout
 * export default function RootLayout({ children }) {
 *   return (
 *     <NavigationProvider>
 *       {children}
 *     </NavigationProvider>
 *   );
 * }
 *
 * // In page template
 * export default function Template({ children }) {
 *   const { onTransitionComplete } = useNavigation();
 *
 *   return (
 *     <AnimatePresence onExitComplete={onTransitionComplete}>
 *       {children}
 *     </AnimatePresence>
 *   );
 * }
 * ```
 */
export function NavigationProvider({ children }: NavigationProviderProps) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pendingNavigation = useRef<string | null>(null);

  const navigate = useCallback(
    (href: string) => {
      if (isTransitioning) {
        // Queue navigation, don't fight ongoing animation
        pendingNavigation.current = href;
        return;
      }
      setIsTransitioning(true);
      router.push(href);
    },
    [isTransitioning, router],
  );

  const onTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
    if (pendingNavigation.current) {
      const next = pendingNavigation.current;
      pendingNavigation.current = null;
      router.push(next);
    }
  }, [router]);

  return (
    <NavigationContext.Provider
      value={{ isTransitioning, navigate, onTransitionComplete }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Hook to access navigation lock context
 *
 * @throws Error if used outside NavigationProvider
 */
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
