'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ChevronRight, FileText, Loader2, Plus, Search } from 'lucide-react';

import { cn } from '@kit/ui/utils';

import type { ConversationStatus } from '../_lib/types';

interface Report {
  id: string;
  title: string;
  headline: string | null;
  status: ConversationStatus;
  current_step: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
  concept_count: number;
}

interface ReportsDashboardProps {
  reports: Report[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isThisYear = date.getFullYear() === now.getFullYear();

  return date
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      ...(isThisYear ? {} : { year: 'numeric' }),
    })
    .toUpperCase();
}

function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + '...';
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

  // Check if report is in a processing state (not complete)
  const isProcessing = (status: ConversationStatus) =>
    status === 'processing' ||
    status === 'clarifying' ||
    status === 'confirm_rerun';

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
              const isClickable = isComplete;

              // Use headline if available, otherwise truncate title
              const displayTitle =
                report.headline || truncate(report.title, 80);

              if (processing) {
                // Processing state - purple theme, not clickable
                return (
                  <div
                    key={report.id}
                    data-test={`report-card-${report.id}`}
                    className={cn(
                      'relative block cursor-default bg-violet-500/5 p-5 dark:bg-neutral-900/20',
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
                        </div>
                      </div>

                      {/* Loader Icon */}
                      <div className="absolute top-1/2 right-5 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-violet-500/50" />
                      </div>
                    </div>
                  </div>
                );
              }

              // Complete or other states - clickable
              return (
                <button
                  key={report.id}
                  onClick={() =>
                    isClickable && router.push(`/home/reports/${report.id}`)
                  }
                  disabled={!isClickable}
                  data-test={`report-card-${report.id}`}
                  className={cn(
                    'group relative block w-full p-5 text-left transition-all',
                    isClickable &&
                      'cursor-pointer hover:bg-[--surface-overlay]',
                    !isLast && 'border-b border-[--border-subtle]',
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Status Dot - Green for complete, Gray for other */}
                    <div className="mt-1.5 flex-shrink-0">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          isComplete
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                            : 'bg-[--text-muted]',
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <h3
                        className="truncate pr-8 text-sm font-medium text-[--text-secondary] transition-colors group-hover:text-[--text-primary]"
                        style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                      >
                        {displayTitle}
                      </h3>
                      <div className="mt-2 flex items-center gap-4">
                        <span
                          className="font-mono text-xs text-[--text-primary]"
                          style={{
                            fontFamily:
                              'Soehne Mono, JetBrains Mono, monospace',
                          }}
                        >
                          {formatDate(report.created_at)}
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

                    {/* Arrow (visible on hover) */}
                    {isClickable && (
                      <div className="absolute top-1/2 right-5 -translate-x-2 -translate-y-1/2 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                        <ChevronRight className="h-4 w-4 text-[--text-muted]" />
                      </div>
                    )}
                  </div>
                </button>
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
