'use client';

import { createContext, useContext, useState } from 'react';

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

// Get initial collapsed state from localStorage (runs once on mount)
function getInitialCollapsed(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored !== null ? stored === 'true' : true;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(getInitialCollapsed);

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
