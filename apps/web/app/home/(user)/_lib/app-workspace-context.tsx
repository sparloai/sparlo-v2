'use client';

import { createContext, useContext } from 'react';

import type { UserWorkspace } from './server/load-user-workspace';

/**
 * App-specific workspace context that extends the base UserWorkspace
 * with app-specific fields like reportsUsed and reportLimit.
 */
export const AppWorkspaceContext = createContext<UserWorkspace | null>(null);

export function AppWorkspaceProvider({
  value,
  children,
}: {
  value: UserWorkspace;
  children: React.ReactNode;
}) {
  return (
    <AppWorkspaceContext.Provider value={value}>
      {children}
    </AppWorkspaceContext.Provider>
  );
}

export function useAppWorkspace() {
  const ctx = useContext(AppWorkspaceContext);

  if (!ctx) {
    throw new Error(
      'useAppWorkspace must be used within an AppWorkspaceProvider',
    );
  }

  return ctx;
}
