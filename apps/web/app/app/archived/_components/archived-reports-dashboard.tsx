'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  Archive,
  ArrowLeft,
  ChevronRight,
  FileText,
  Search,
} from 'lucide-react';

import { cn } from '@kit/ui/utils';

import { AppLink } from '~/components/app-link';
import { getAppPath } from '~/lib/hooks/use-app-path';

import { ArchiveToggleButton } from '../../_components/shared/archive-toggle-button';
import { ModeLabel } from '../../_components/shared/mode-label';
import type { DashboardReport } from '../../_lib/types';
import { formatReportDate, truncateText } from '../../_lib/utils/report-utils';

interface ArchivedReportsDashboardProps {
  reports: DashboardReport[];
}

function EmptyState() {
  return (
    <div
      className="rounded-lg border border-[--border-subtle] bg-[--surface-elevated] px-6 py-16 text-center"
      data-test="archived-empty-state"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[--surface-overlay]">
        <Archive className="h-7 w-7 text-[--text-muted]" />
      </div>
      <p
        className="mt-4 text-sm text-[--text-muted]"
        style={{ fontFamily: "'Suisse Intl', Inter, sans-serif" }}
      >
        No archived reports
      </p>
      <AppLink
        href="/app"
        className="mt-4 inline-block rounded-sm bg-[--text-primary] px-4 py-2 font-mono text-xs font-medium tracking-wider text-[--surface-base] uppercase transition-colors hover:opacity-90"
        style={{
          fontFamily: "'Suisse Mono', 'SF Mono', ui-monospace, monospace",
        }}
      >
        View All Reports
      </AppLink>
    </div>
  );
}

function NoResultsState({ query }: { query: string }) {
  return (
    <div className="rounded-lg border border-[--border-subtle] bg-[--surface-elevated] px-6 py-12 text-center">
      <p
        className="text-sm text-[--text-muted]"
        style={{ fontFamily: "'Suisse Intl', Inter, sans-serif" }}
      >
        No archived reports match &ldquo;{query}&rdquo;
      </p>
    </div>
  );
}

export function ArchivedReportsDashboard({
  reports,
}: ArchivedReportsDashboardProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  // Optimistic UI: track reports being restored for instant removal
  const [optimisticallyHidden, setOptimisticallyHidden] = useState<Set<string>>(
    () => new Set(),
  );

  const filteredReports = useMemo(() => {
    // First filter out optimistically hidden reports
    const filtered = reports.filter((r) => !optimisticallyHidden.has(r.id));

    if (!search.trim()) return filtered;

    const query = search.toLowerCase();
    return filtered.filter(
      (report) =>
        report.headline?.toLowerCase().includes(query) ||
        report.title.toLowerCase().includes(query),
    );
  }, [search, reports, optimisticallyHidden]);

  // Optimistic restore: hide immediately, revert on error
  const handleOptimisticRestore = (reportId: string) => {
    setOptimisticallyHidden((prev) => new Set(prev).add(reportId));
  };

  const handleRestoreError = (reportId: string) => {
    setOptimisticallyHidden((prev) => {
      const next = new Set(prev);
      next.delete(reportId);
      return next;
    });
  };

  return (
    <div
      className="mx-auto w-full max-w-4xl px-6 py-12 md:py-16"
      style={{ fontFamily: "'Suisse Intl', Inter, sans-serif" }}
    >
      {/* Header Actions */}
      <div className="mb-6 flex items-end justify-between">
        <div className="flex items-center gap-4">
          <AppLink
            href="/app"
            className="flex items-center gap-1 text-[--text-muted] transition-colors hover:text-[--text-secondary]"
          >
            <ArrowLeft className="h-4 w-4" />
          </AppLink>
          <h1
            className="font-mono text-xs font-medium tracking-[0.2em] text-[--text-muted] uppercase"
            style={{
              fontFamily: "'Suisse Mono', 'SF Mono', ui-monospace, monospace",
            }}
          >
            ARCHIVED
          </h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="group relative mb-8">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-4 w-4 text-[--text-muted] transition-colors group-focus-within:text-[--text-secondary]" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search archived reports..."
          className="w-full rounded-lg border border-[--border-subtle] bg-[--surface-elevated] py-3.5 pr-4 pl-11 text-sm text-[--text-primary] shadow-sm transition-all placeholder:text-[--text-muted] focus:border-[--border-default] focus:ring-1 focus:ring-[--border-default] focus:outline-none"
          data-test="search-archived-input"
          style={{ fontFamily: "'Suisse Intl', Inter, sans-serif" }}
        />
      </div>

      {/* Report List */}
      {reports.length === 0 ? (
        <EmptyState />
      ) : filteredReports.length === 0 ? (
        <NoResultsState query={search} />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-[--border-subtle] bg-[--surface-elevated] shadow-sm">
            {filteredReports.map((report, index) => {
              const isLast = index === filteredReports.length - 1;
              const isComplete = report.status === 'complete';
              const isClickable = isComplete;

              const displayTitle =
                report.headline || truncateText(report.title, 80);

              return (
                <div
                  key={report.id}
                  data-test={`archived-card-${report.id}`}
                  className={cn(
                    'group relative flex items-start gap-4 p-5 transition-all',
                    isClickable &&
                      'cursor-pointer hover:bg-[--surface-overlay]',
                    !isLast && 'border-b border-[--border-subtle]',
                  )}
                  onClick={() =>
                    isClickable &&
                    router.push(getAppPath(`/app/reports/${report.id}`))
                  }
                >
                  {/* Status Dot - Gray for archived */}
                  <div className="mt-1.5 flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <ModeLabel mode={report.mode} />
                    <h3
                      className="truncate pr-16 text-sm font-medium text-[--text-muted] transition-colors group-hover:text-[--text-secondary]"
                      style={{ fontFamily: "'Suisse Intl', Inter, sans-serif" }}
                    >
                      {displayTitle}
                    </h3>
                    <div className="mt-2 flex items-center gap-4">
                      <span
                        className="font-mono text-xs text-[--text-muted]"
                        style={{
                          fontFamily:
                            "'Suisse Mono', 'SF Mono', ui-monospace, monospace",
                        }}
                      >
                        {formatReportDate(report.created_at)}
                      </span>
                      {isComplete && report.concept_count > 0 && (
                        <>
                          <span className="h-3 w-px bg-[--border-default]" />
                          <span
                            className="flex items-center gap-1.5 font-mono text-xs text-[--text-muted]"
                            style={{
                              fontFamily:
                                "'Suisse Mono', 'SF Mono', ui-monospace, monospace",
                            }}
                          >
                            <FileText className="h-3 w-3" />
                            {report.concept_count}{' '}
                            {report.concept_count === 1
                              ? 'CONCEPT'
                              : 'CONCEPTS'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-1/2 right-5 flex -translate-y-1/2 items-center gap-1">
                    <ArchiveToggleButton
                      reportId={report.id}
                      isArchived={true}
                      onOptimisticStart={() =>
                        handleOptimisticRestore(report.id)
                      }
                      onOptimisticError={() => handleRestoreError(report.id)}
                      onComplete={() => router.refresh()}
                    />
                    {isClickable && (
                      <ChevronRight className="h-4 w-4 -translate-x-2 text-[--text-muted] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <div className="mt-4 flex items-center justify-between px-1">
            <span
              className="font-mono text-[10px] tracking-wider text-[--text-secondary] uppercase"
              style={{
                fontFamily: "'Suisse Mono', 'SF Mono', ui-monospace, monospace",
              }}
            >
              {filteredReports.length} ARCHIVED{' '}
              {filteredReports.length === 1 ? 'REPORT' : 'REPORTS'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
