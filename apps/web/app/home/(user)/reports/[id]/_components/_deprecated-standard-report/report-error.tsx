'use client';

interface ReportErrorProps {
  errorCount: number;
  formattedErrors: unknown;
  reportId: string;
}

export function ReportError({
  errorCount,
  formattedErrors,
  reportId,
}: ReportErrorProps) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="space-y-6 rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-8">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-600"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900">
              Report Data Issue
            </h2>
            <p className="mt-1 text-base text-zinc-600">
              We encountered {errorCount} validation{' '}
              {errorCount === 1 ? 'issue' : 'issues'} with this report.
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3 rounded-xl bg-white/80 p-5">
          <p className="text-sm leading-relaxed text-zinc-700">
            The report data from our analysis engine doesn&apos;t match the
            expected format. This is usually a temporary issue that resolves
            when the report is regenerated.
          </p>
          <p className="text-sm text-zinc-500">
            Report ID:{' '}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono">
              {reportId}
            </code>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <a
            href="/home/reports"
            className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Back to Reports
          </a>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Try Again
          </button>
        </div>

        {/* Technical Details (only shown in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="group">
            <summary className="cursor-pointer text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700">
              Show technical details
            </summary>
            <div className="mt-3 max-h-64 overflow-auto rounded-lg bg-zinc-900 p-4">
              <pre className="font-mono text-xs whitespace-pre-wrap text-zinc-300">
                {JSON.stringify(formattedErrors, null, 2)}
              </pre>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
