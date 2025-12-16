'use client';

import { createContext, useContext } from 'react';

import type { SparloReport } from './server/sparlo-reports-server-actions';
import { useSparlo } from './use-sparlo';

type SparloContextType = ReturnType<typeof useSparlo>;

const SparloContext = createContext<SparloContextType | null>(null);

interface SparloProviderProps {
  children: React.ReactNode;
  initialReports?: SparloReport[];
}

export function SparloProvider({
  children,
  initialReports,
}: SparloProviderProps) {
  const sparlo = useSparlo(initialReports);

  return (
    <SparloContext.Provider value={sparlo}>{children}</SparloContext.Provider>
  );
}

export function useSparloContext() {
  const context = useContext(SparloContext);
  if (!context) {
    throw new Error('useSparloContext must be used within a SparloProvider');
  }
  return context;
}
