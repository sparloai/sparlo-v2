'use client';

import { useMemo, useState, useTransition } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  AlertCircle,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  Search,
  X,
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

import { cancelReportGeneration } from '../_lib/server/sparlo-reports-server-actions';
import type { ConversationStatus, DashboardReport } from '../_lib/types';
import { formatElapsed, useElapsedTime } from '../_lib/utils/elapsed-time';
import { formatReportDate, truncateText } from '../_lib/utils/report-utils';
import { ArchiveToggleButton } from './shared/archive-toggle-button';
import { ModeLabel } from './shared/mode-label';

/**
 * ElapsedTime component - shows live updating elapsed time since creation
 */
function ElapsedTime({ createdAt }: { createdAt: string }) {
  const elapsed = useElapsedTime(createdAt);

  return (
    <span
      className="font-mono text-xs text-violet-600 tabular-nums dark:text-violet-400"
      style={{ fontFamily: 'Soehne Mono, JetBrains Mono, monospace' }}
    >
      {formatElapsed(elapsed)}
    </span>
  );
}

/**
 * CancelButton component - cancels a processing report with confirmation
 */
function CancelButton({
  reportId,
  onComplete,
}: {
  reportId: string;
  onComplete: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this report?',
    );

    if (!confirmed) return;

    startTransition(async () => {
      try {
        await cancelReportGeneration({ reportId });
        onComplete();
      } catch (error) {
        console.error('Failed to cancel report:', error);
        alert(
          error instanceof Error ? error.message : 'Failed to cancel report',
        );
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        handleCancel();
      }}
      disabled={isPending}
      className="h-8 gap-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20 dark:hover:text-amber-300"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <X className="h-3.5 w-3.5" />
      )}
      Cancel
    </Button>
  );
}

interface ReportsDashboardProps {
  reports: DashboardReport[];
}

function EmptyState() {
  const router = useRouter();

  return (
    <div
      className="rounded-lg border border-[--border-subtle] bg-[--surface-elevated] px-6 py-16 text-center"
      data-test="reports-empty-state"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[--surface-overlay]">
        <FileText className="h-7 w-7 text-[--text-muted]" />
      </div>
      <p
        className="mt-4 text-sm text-[--text-muted]"
        style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
      >
        No reports yet
      </p>
      <button
        onClick={() => router.push('/home/reports/new')}
        className="mt-4 rounded-sm bg-[--text-primary] px-4 py-2 font-mono text-xs font-medium tracking-wider text-[--surface-base] uppercase transition-colors hover:opacity-90"
        style={{ fontFamily: 'Soehne Mono, JetBrains Mono, monospace' }}
      >
        Create Your First Report
      </button>
    </div>
  );
}

function NoResultsState({ query }: { query: string }) {
  return (
    <div className="rounded-lg border border-[--border-subtle] bg-[--surface-elevated] px-6 py-12 text-center">
      <p
        className="text-sm text-[--text-muted]"
        style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
      >
        No reports match &ldquo;{query}&rdquo;
      </p>
    </div>
  );
}

export function ReportsDashboard({ reports }: ReportsDashboardProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filteredReports = useMemo(() => {
    if (!search.trim()) return reports;

    const query = search.toLowerCase();
    return reports.filter(
      (report) =>
        report.headline?.toLowerCase().includes(query) ||
        report.title.toLowerCase().includes(query),
    );
  }, [search, reports]);

  // Check if report is in a processing state (not complete, not clarifying)
  const isProcessing = (status: ConversationStatus) =>
    status === 'processing' || status === 'confirm_rerun';

  return (
    <div
      className="mx-auto w-full max-w-4xl px-6 py-12 md:py-16"
      style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
    >
      {/* Header Actions */}
      <div className="mb-6 flex items-end justify-between">
        <h1
          className="font-mono text-xs font-medium tracking-[0.2em] text-[--text-muted] uppercase"
          style={{ fontFamily: 'Soehne Mono, JetBrains Mono, monospace' }}
        >
          REPORTS
        </h1>

        <Link href="/home/reports/new" className="group">
          <button
            data-test="new-report-button"
            className="flex items-center gap-2 font-mono text-xs font-medium text-[--text-primary] transition-colors hover:text-[--text-secondary]"
            style={{ fontFamily: 'Soehne Mono, JetBrains Mono, monospace' }}
          >
            NEW ANALYSIS
            <span className="flex h-4 w-4 items-center justify-center rounded-sm border border-[--border-default] text-[--text-muted] transition-all group-hover:border-[--text-muted] group-hover:text-[--text-primary]">
              <Plus className="h-3 w-3" />
            </span>
          </button>
        </Link>
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
          placeholder="Search reports..."
          className="w-full rounded-lg border border-[--border-subtle] bg-[--surface-elevated] py-3.5 pr-4 pl-11 text-sm text-[--text-primary] shadow-sm transition-all placeholder:text-[--text-muted] focus:border-[--border-default] focus:ring-1 focus:ring-[--border-default] focus:outline-none"
          data-test="search-reports-input"
          style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
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
              const processing = isProcessing(report.status);
              const isComplete = report.status === 'complete';
              const isFailed =
                report.status === 'failed' || report.status === 'error';
              const isCancelled = report.status === 'cancelled';
              const isClarifying = report.status === 'clarifying';
              const isClickable = isComplete;

              // Use headline if available, otherwise truncate title
              const displayTitle =
                report.headline || truncateText(report.title, 80);

              if (processing) {
                // Processing state - purple theme, not clickable
                return (
                  <div
                    key={report.id}
                    data-test={`report-card-${report.id}`}
                    className={cn(
                      'group relative block cursor-default bg-violet-500/5 p-5 dark:bg-neutral-900/20',
                      !isLast && 'border-b border-[--border-subtle]',
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Status Dot (Pulsing Purple) */}
                      <div className="relative mt-1.5 flex-shrink-0">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
                        <div className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-violet-500 opacity-75" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <ModeLabel mode={report.mode} />
                        <h3
                          className="truncate pr-8 text-sm font-medium text-[--text-secondary] opacity-90"
                          style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                        >
                          {displayTitle}
                        </h3>
                        <div className="mt-2 flex items-center gap-3">
                          <span
                            className="font-mono text-xs tracking-wider text-violet-600 uppercase dark:text-violet-400"
                            style={{
                              fontFamily:
                                'Soehne Mono, JetBrains Mono, monospace',
                            }}
                          >
                            Processing
                          </span>
                          <span className="h-3 w-px bg-[--border-default]" />
                          <ElapsedTime createdAt={report.created_at} />
                        </div>
                      </div>

                      {/* Cancel Button */}
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <CancelButton
                          reportId={report.id}
                          onComplete={() => router.refresh()}
                        />
                        <Loader2 className="h-4 w-4 animate-spin text-violet-500/50" />
                      </div>
                    </div>
                  </div>
                );
              }

              if (isClarifying) {
                // Clarifying state - amber theme, clickable to answer question
                return (
                  <Link
                    key={report.id}
                    href={`/home/reports/${report.id}`}
                    data-test={`report-card-${report.id}`}
                    className={cn(
                      'group relative flex items-start gap-4 p-5 transition-all duration-200',
                      'cursor-pointer hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)] dark:hover:bg-amber-900/20',
                      'bg-amber-50/50 dark:bg-amber-900/10',
                      !isLast && 'border-b border-[--border-subtle]',
                    )}
                  >
                    {/* Status Dot (Amber, pulsing) */}
                    <div className="relative mt-1.5 flex-shrink-0">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                      <div className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-amber-500 opacity-75" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <ModeLabel mode={report.mode} />
                      <h3
                        className="truncate pr-8 text-sm font-medium text-[--text-secondary]"
                        style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                      >
                        {displayTitle}
                      </h3>
                      <div className="mt-2 flex items-center gap-3">
                        <span
                          className="font-mono text-xs tracking-wider text-amber-600 uppercase dark:text-amber-400"
                          style={{
                            fontFamily:
                              'Soehne Mono, JetBrains Mono, monospace',
                          }}
                        >
                          Needs Clarification
                        </span>
                        <span className="h-3 w-px bg-[--border-default]" />
                        <ElapsedTime createdAt={report.created_at} />
                      </div>
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        We need more information to continue
                      </p>
                    </div>

                    {/* Action indicator */}
                    <div className="absolute top-1/2 right-5 flex -translate-y-1/2 items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <ChevronRight className="h-4 w-4 -translate-x-2 text-amber-600 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 dark:text-amber-400" />
                    </div>
                  </Link>
                );
              }

              if (isCancelled) {
                // Cancelled state - zinc/gray theme, shows cancelled status and archive option
                return (
                  <div
                    key={report.id}
                    data-test={`report-card-${report.id}`}
                    className={cn(
                      'group relative block cursor-default bg-zinc-500/5 p-5 dark:bg-zinc-800/20',
                      !isLast && 'border-b border-[--border-subtle]',
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Status Dot (Gray) */}
                      <div className="mt-1.5 flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <ModeLabel mode={report.mode} />
                        <h3
                          className="truncate pr-8 text-sm font-medium text-[--text-secondary] opacity-75"
                          style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                        >
                          {displayTitle}
                        </h3>
                        <div className="mt-2 flex items-center gap-3">
                          <span
                            className="font-mono text-xs tracking-wider text-zinc-500 uppercase dark:text-zinc-400"
                            style={{
                              fontFamily:
                                'Soehne Mono, JetBrains Mono, monospace',
                            }}
                          >
                            Cancelled
                          </span>
                          <span className="h-3 w-px bg-[--border-default]" />
                          <span
                            className="font-mono text-xs text-[--text-muted]"
                            style={{
                              fontFamily:
                                'Soehne Mono, JetBrains Mono, monospace',
                            }}
                          >
                            {formatReportDate(report.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <ArchiveToggleButton
                          reportId={report.id}
                          isArchived={false}
                          onComplete={() => router.refresh()}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              if (isFailed) {
                // Failed state - red theme, shows error and retry button
                return (
                  <div
                    key={report.id}
                    data-test={`report-card-${report.id}`}
                    className={cn(
                      'group relative block cursor-default bg-red-500/5 p-5 dark:bg-red-900/10',
                      !isLast && 'border-b border-[--border-subtle]',
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Status Dot (Red) */}
                      <div className="mt-1.5 flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <ModeLabel mode={report.mode} />
                        <h3
                          className="truncate pr-8 text-sm font-medium text-[--text-secondary] opacity-90"
                          style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                        >
                          {displayTitle}
                        </h3>
                        <div className="mt-2 flex items-center gap-3">
                          <span
                            className="font-mono text-xs tracking-wider text-red-600 uppercase dark:text-red-400"
                            style={{
                              fontFamily:
                                'Soehne Mono, JetBrains Mono, monospace',
                            }}
                          >
                            Failed
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[--text-muted]">
                          {report.error_message ||
                            'Your report failed. Please submit a new analysis request and contact support for help if it happens repeatedly.'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <ArchiveToggleButton
                          reportId={report.id}
                          isArchived={false}
                          onComplete={() => router.refresh()}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push('/home/reports/new')}
                          className="gap-1.5"
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                          New Analysis
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Complete or other states - clickable
              return (
                <div
                  key={report.id}
                  data-test={`report-card-${report.id}`}
                  className={cn(
                    'group relative flex items-start gap-4 p-5 transition-all duration-200',
                    isClickable &&
                      'cursor-pointer hover:-translate-y-0.5 hover:bg-violet-500/5 hover:shadow-[0_4px_12px_rgba(139,92,246,0.1)] dark:hover:bg-violet-500/10',
                    !isLast && 'border-b border-[--border-subtle]',
                  )}
                  onClick={() =>
                    isClickable && router.push(`/home/reports/${report.id}`)
                  }
                >
                  {/* Status Dot - Green for complete, Gray for other */}
                  <div className="mt-1.5 flex-shrink-0">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full transition-all duration-200',
                        isComplete
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                          : 'bg-[--text-muted]',
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <ModeLabel mode={report.mode} />
                    <h3
                      className="truncate pr-16 text-sm font-medium text-[--text-secondary] transition-colors group-hover:text-[--text-primary]"
                      style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                    >
                      {displayTitle}
                    </h3>
                    <div className="mt-2 flex items-center gap-4">
                      <span
                        className="font-mono text-xs text-[--text-primary]"
                        style={{
                          fontFamily: 'Soehne Mono, JetBrains Mono, monospace',
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
                                'Soehne Mono, JetBrains Mono, monospace',
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
                  <div
                    className="absolute top-1/2 right-5 flex -translate-y-1/2 items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ArchiveToggleButton
                      reportId={report.id}
                      isArchived={false}
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
              style={{ fontFamily: 'Soehne Mono, JetBrains Mono, monospace' }}
            >
              Showing {filteredReports.length} of {reports.length} REPORTS
            </span>
          </div>
        </>
      )}
    </div>
  );
}
