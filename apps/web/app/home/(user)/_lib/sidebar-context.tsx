'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'sparlo-sidebar-collapsed';
const COLLAPSED_WIDTH = 64; // px
const EXPANDED_WIDTH = 260; // px

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  sidebarWidth: number;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: true,
  setCollapsed: () => {},
  sidebarWidth: COLLAPSED_WIDTH,
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(true);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setCollapsedState(stored === 'true');
    }
  }, []);

  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  };

  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarState() {
  return useContext(SidebarContext);
}

export { COLLAPSED_WIDTH, EXPANDED_WIDTH };
