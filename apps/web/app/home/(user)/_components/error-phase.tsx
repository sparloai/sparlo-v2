'use client';

import { RotateCcw, X } from 'lucide-react';

import { Button } from '@kit/ui/button';

interface ErrorPhaseProps {
  error: string;
  onStartNew: () => void;
}

export function ErrorPhase({ error, onStartNew }: ErrorPhaseProps) {
  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-[#FAFAFA] p-6 dark:bg-neutral-950">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/20">
          <X className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-[#1A1A1A] dark:text-white">
            Something went wrong
          </h2>
          <p className="text-[#6B6B6B] dark:text-neutral-400">{error}</p>
        </div>
        <Button
          onClick={onStartNew}
          className="bg-[#7C3AED] hover:bg-[#6D28D9]"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Start Over
        </Button>
      </div>
    </div>
  );
}
