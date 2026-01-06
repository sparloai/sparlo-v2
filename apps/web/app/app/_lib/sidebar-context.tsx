'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';

const STORAGE_KEY = 'sparlo-sidebar-collapsed';
const COLLAPSED_WIDTH = 64; // px
const EXPANDED_WIDTH = 260; // px
const MOBILE_BREAKPOINT = 768; // md breakpoint

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  sidebarWidth: number;
  isMobile: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: true,
  setCollapsed: () => {},
  sidebarWidth: COLLAPSED_WIDTH,
  isMobile: false,
  mobileMenuOpen: false,
  setMobileMenuOpen: () => {},
});

// Subscribe to localStorage changes for collapsed state
function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getCollapsedSnapshot(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored !== null ? stored === 'true' : true;
}

function getCollapsedServerSnapshot(): boolean {
  return true; // Server-safe default
}

// Check if we're on mobile
function getIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Use useSyncExternalStore for localStorage to avoid hydration mismatches
  const collapsedFromStorage = useSyncExternalStore(
    subscribeToStorage,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );
  const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(
    null,
  );
  const collapsed = collapsedOverride ?? collapsedFromStorage;

  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check for mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      const nowMobile = getIsMobile();
      setIsMobile(nowMobile);
      // Close mobile menu when switching to desktop (done in same callback to avoid cascading renders)
      if (!nowMobile) {
        setMobileMenuOpen(false);
      }
    };

    // Initial check
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const setCollapsed = (value: boolean) => {
    setCollapsedOverride(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  };

  // On mobile, sidebar width is 0 (hidden)
  const sidebarWidth = isMobile
    ? 0
    : collapsed
      ? COLLAPSED_WIDTH
      : EXPANDED_WIDTH;

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        sidebarWidth,
        isMobile,
        mobileMenuOpen,
        setMobileMenuOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarState() {
  return useContext(SidebarContext);
}

export { COLLAPSED_WIDTH, EXPANDED_WIDTH };
