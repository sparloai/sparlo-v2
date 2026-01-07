'use client';

import { useEffect } from 'react';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ReportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('[Report Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="mb-4 text-2xl font-semibold text-zinc-900">
          Something went wrong
        </h2>
        <p className="mb-6 text-zinc-600">
          We encountered an error while loading this report. This has been
          logged for investigation.
        </p>
        {error.message && (
          <div className="mb-6 rounded-lg bg-zinc-100 p-4 text-left">
            <p className="font-mono text-sm text-zinc-700">{error.message}</p>
          </div>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-white transition-colors hover:bg-zinc-800"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
