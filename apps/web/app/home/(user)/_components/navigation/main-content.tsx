'use client';

import { useSidebarState } from '../../_lib/sidebar-context';

/**
 * Main content wrapper that responds to sidebar state
 * Shifts content right when sidebar is expanded
 */
export function MainContent({ children }: { children: React.ReactNode }) {
  const { sidebarWidth } = useSidebarState();

  return (
    <main
      className="flex-1 pt-14 transition-[margin-left] duration-300 ease-out"
      style={{ marginLeft: sidebarWidth }}
    >
      {children}
    </main>
  );
}
