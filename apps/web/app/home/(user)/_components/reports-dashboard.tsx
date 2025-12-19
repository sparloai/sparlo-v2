'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FileText, Search } from 'lucide-react';

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
}

interface ReportsDashboardProps {
  reports: Report[];
}

const STATUS_CONFIG: Record<
  ConversationStatus,
  {
    label: string | null;
    dotClass: string;
  }
> = {
  complete: {
    label: null, // Don't show label for complete - green dot says it
    dotClass: 'bg-[#4ADE80]',
  },
  processing: {
    label: 'Processing',
    dotClass: 'bg-[#A78BFA] animate-pulse',
  },
  clarifying: {
    label: 'Needs Input',
    dotClass: 'bg-[#FBBF24]',
  },
  error: {
    label: 'Error',
    dotClass: 'bg-[#EF4444]',
  },
  failed: {
    label: 'Failed',
    dotClass: 'bg-[#EF4444]',
  },
  confirm_rerun: {
    label: 'Pending',
    dotClass: 'bg-[#71717A]',
  },
};

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
      className="rounded-[3px] border border-[--border-subtle] bg-[--surface-elevated] px-6 py-16 text-center"
      data-test="reports-empty-state"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[--accent-muted]">
        <FileText className="h-7 w-7 text-[--accent]" />
      </div>
      <p className="mt-4 text-sm text-[--text-muted]">No reports yet</p>
      <button
        onClick={() => router.push('/home/reports/new')}
        className="mt-4 rounded-[2px] bg-[--text-primary] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[--surface-base] transition-colors hover:opacity-90"
      >
        Create Your First Report
      </button>
    </div>
  );
}

function NoResultsState({ query }: { query: string }) {
  return (
    <div className="rounded-[3px] border border-[--border-subtle] bg-[--surface-elevated] px-6 py-12 text-center">
      <p className="text-sm text-[--text-muted]">
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

  return (
    <div className="mx-auto max-w-[800px] px-6 py-12">
      {/* Header Row */}
      <div className="mb-2 flex items-end justify-between">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-[--text-muted]">
          Reports
        </span>
        <Link href="/home/reports/new">
          <button
            data-test="new-report-button"
            className="rounded-[2px] bg-[--text-primary] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[--surface-base] transition-colors hover:opacity-90"
          >
            + New Problem
          </button>
        </Link>
      </div>

      {/* Divider */}
      <div className="mb-5 h-px bg-[--border-default]" />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[--text-ghost]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reports..."
          className="w-full rounded-[3px] border border-[--border-subtle] bg-[--surface-elevated] py-3 pl-11 pr-4 text-sm text-[--text-primary] transition-colors placeholder:text-[--text-ghost] focus:border-[--border-strong] focus:outline-none"
          data-test="search-reports-input"
        />
      </div>

      {/* Report List */}
      {reports.length === 0 ? (
        <EmptyState />
      ) : filteredReports.length === 0 ? (
        <NoResultsState query={search} />
      ) : (
        <div className="overflow-hidden rounded-[3px] border border-[--border-subtle]">
          {filteredReports.map((report, index) => {
            const config = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.processing;
            const isLast = index === filteredReports.length - 1;
            const isClickable = report.status === 'complete';

            // Use headline if available, otherwise truncate title
            const displayTitle = report.headline || truncate(report.title, 60);

            return (
              <button
                key={report.id}
                onClick={() =>
                  isClickable && router.push(`/home/reports/${report.id}`)
                }
                disabled={!isClickable}
                data-test={`report-card-${report.id}`}
                className={cn(
                  'w-full bg-[--surface-elevated] px-5 py-4 text-left transition-colors',
                  isClickable
                    ? 'cursor-pointer hover:bg-[--surface-overlay]'
                    : 'cursor-default',
                  !isLast && 'border-b border-[--border-subtle]',
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Status Dot */}
                  <div
                    className={cn(
                      'mt-[7px] h-2 w-2 flex-shrink-0 rounded-full',
                      config.dotClass,
                    )}
                    role="status"
                    aria-label={`Status: ${config.label ?? 'Complete'}`}
                  />

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {/* Headline/Title */}
                    <p
                      className={cn(
                        'text-sm leading-[1.4]',
                        report.headline
                          ? 'text-[--text-primary]'
                          : 'text-[--text-muted]',
                      )}
                    >
                      {displayTitle}
                    </p>

                    {/* Metadata */}
                    <div className="mt-1.5 flex items-center gap-2">
                      {config.label ? (
                        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[#A78BFA]">
                          {config.label}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] tracking-[0.02em] text-[--text-ghost]">
                          {formatDate(report.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
