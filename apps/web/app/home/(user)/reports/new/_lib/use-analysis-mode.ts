'use client';

import { useCallback, useState } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

const STORAGE_KEY = 'sparlo-analysis-mode';

type AnalysisMode = 'technical' | 'dd';

// Type guard for safe validation
function isValidMode(value: string | null): value is AnalysisMode {
  return value === 'technical' || value === 'dd';
}

function getStoredMode(): AnalysisMode {
  if (typeof window === 'undefined') return 'technical';
  const stored = localStorage.getItem(STORAGE_KEY);
  return isValidMode(stored) ? stored : 'technical';
}

export function useAnalysisMode() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // URL param takes priority, then localStorage, then default
  const urlMode = searchParams.get('mode');
  const initialMode = isValidMode(urlMode) ? urlMode : getStoredMode();

  const [mode, setModeState] = useState<AnalysisMode>(initialMode);

  const setMode = useCallback(
    (newMode: AnalysisMode) => {
      setModeState(newMode);

      // Update localStorage (silent fail is acceptable)
      localStorage.setItem(STORAGE_KEY, newMode);

      // Update URL (preserve other params)
      const params = new URLSearchParams(searchParams.toString());
      params.set('mode', newMode);
      window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    },
    [pathname, searchParams],
  );

  return { mode, setMode };
}
