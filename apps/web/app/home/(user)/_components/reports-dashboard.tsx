'use client';

import { useMemo, useState, useTransition } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Archive,
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

/**
 * Reports Dashboard - Sparlo Design System
 *
 * Air Company Aesthetic - Technical Monograph, Not AI Tool
 *
 * Features:
 * - 42px page title matching New Analysis
 * - Left border accent on cards (border-l-2 border-zinc-900)
 * - Near-monochrome status colors
 * - Typography-driven hierarchy
 */

// Status configuration - subtle near-monochrome palette
const statusConfig: Record<
  ConversationStatus,
  {
    label: string;
    dotClass: string;
    textClass: string;
    bgClass: string;
    borderClass: string;
  }
> = {
  processing: {
    label: 'Processing',
    dotClass: 'bg-zinc-500 animate-pulse',
    textClass: 'text-zinc-500',
    bgClass: 'bg-white',
    borderClass: 'border-l-zinc-900',
  },
  clarifying: {
    label: 'Needs Clarification',
    dotClass: 'bg-amber-500 animate-pulse',
    textClass: 'text-zinc-600',
    bgClass: 'bg-zinc-50',
    borderClass: 'border-l-zinc-900',
  },
  complete: {
    label: 'Complete',
    dotClass: 'bg-zinc-900',
    textClass: 'text-zinc-900',
    bgClass: 'bg-white',
    borderClass: 'border-l-zinc-900',
  },
  failed: {
    label: 'Failed',
    dotClass: 'bg-zinc-400',
    textClass: 'text-zinc-500',
    bgClass: 'bg-white',
    borderClass: 'border-l-zinc-300',
  },
  cancelled: {
    label: 'Cancelled',
    dotClass: 'bg-zinc-300',
    textClass: 'text-zinc-400',
    bgClass: 'bg-white',
    borderClass: 'border-l-zinc-200',
  },
  error: {
    label: 'Error',
    dotClass: 'bg-zinc-400',
    textClass: 'text-zinc-500',
    bgClass: 'bg-white',
    borderClass: 'border-l-zinc-300',
  },
  confirm_rerun: {
    label: 'Processing',
    dotClass: 'bg-zinc-500 animate-pulse',
    textClass: 'text-zinc-500',
    bgClass: 'bg-white',
    borderClass: 'border-l-zinc-900',
  },
};

function getStatusConfig(status: ConversationStatus) {
  return statusConfig[status] || statusConfig.complete;
}

/**
 * ElapsedTime component - shows live updating elapsed time since creation
 */
function ElapsedTime({ createdAt }: { createdAt: string }) {
  const elapsed = useElapsedTime(createdAt);

  return (
    <span className="text-[13px] tracking-[-0.02em] text-zinc-500 tabular-nums">
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
      className="h-8 gap-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
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

/**
 * EmptyState - shown when user has no reports
 */
function EmptyState() {
  return (
    <div className="mt-16 text-center" data-test="reports-empty-state">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-100">
        <FileText className="h-8 w-8 text-zinc-400" />
      </div>
      <p className="mt-6 text-[18px] tracking-[-0.02em] text-zinc-500">
        No reports yet
      </p>
      <p className="mt-2 text-[15px] tracking-[-0.02em] text-zinc-400">
        Get started by creating your first analysis
      </p>
      <Link
        href="/home/reports/new"
        className="mt-8 inline-flex items-center gap-2 bg-zinc-900 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800"
      >
        <Plus className="h-4 w-4" />
        New Analysis
      </Link>
    </div>
  );
}

/**
 * NoResultsState - shown when search yields no matches
 */
function NoResultsState({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div className="mt-12 text-center">
      <p className="text-[16px] tracking-[-0.02em] text-zinc-500">
        No reports match &ldquo;{query}&rdquo;
      </p>
      <button
        onClick={onClear}
        className="mt-4 text-[14px] tracking-[-0.02em] text-zinc-400 underline transition-colors hover:text-zinc-600"
      >
        Clear search
      </button>
    </div>
  );
}

/**
 * ReportCard - individual report card with Sparlo design system styling
 */
function ReportCard({
  report,
  isLast,
  onArchiveStart,
  onArchiveError,
  onRefresh,
}: {
  report: DashboardReport;
  isLast: boolean;
  onArchiveStart: () => void;
  onArchiveError: () => void;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const config = getStatusConfig(report.status);

  const isProcessing =
    report.status === 'processing' || report.status === 'confirm_rerun';
  const isClarifying = report.status === 'clarifying';
  const isComplete = report.status === 'complete';
  const isFailed = report.status === 'failed' || report.status === 'error';
  const isCancelled = report.status === 'cancelled';
  const isClickable = isComplete || isClarifying;

  const displayTitle = report.headline || truncateText(report.title, 80);

  const handleClick = () => {
    if (isClickable) {
      router.push(`/home/reports/${report.id}`);
    }
  };

  return (
    <div
      data-test={`report-card-${report.id}`}
      className={cn(
        'group relative transition-all duration-200',
        'border-l-2 py-6 pr-6 pl-8',
        config.borderClass,
        config.bgClass,
        isClickable && 'cursor-pointer hover:bg-zinc-50',
        !isLast && 'border-b border-zinc-100',
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left content */}
        <div className="min-w-0 flex-1">
          <h3 className="text-[18px] font-medium tracking-[-0.02em] text-zinc-900">
            {displayTitle}
          </h3>

          {/* Status row */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)}
              />
              <span
                className={cn(
                  'text-[13px] font-medium tracking-[0.06em] uppercase',
                  config.textClass,
                )}
              >
                {config.label}
              </span>
            </div>

            <span className="text-zinc-300">·</span>

            {isProcessing ? (
              <ElapsedTime createdAt={report.created_at} />
            ) : (
              <span className="text-[13px] tracking-[-0.02em] text-zinc-500">
                {report.concept_count > 0
                  ? `${report.concept_count} ${report.concept_count === 1 ? 'concept' : 'concepts'}`
                  : formatReportDate(report.created_at)}
              </span>
            )}
          </div>

          {/* Additional messages */}
          {isClarifying && (
            <p className="mt-3 text-[14px] tracking-[-0.02em] text-zinc-500">
              We need more information to continue
            </p>
          )}
          {isFailed && (
            <p className="mt-3 text-[14px] tracking-[-0.02em] text-zinc-500">
              {report.error_message ||
                'Report generation failed. Please try again.'}
            </p>
          )}
        </div>

        {/* Right content */}
        <div
          className="flex flex-col items-end gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[13px] tracking-[-0.02em] text-zinc-400">
            {formatReportDate(report.created_at)}
          </span>

          <div className="flex items-center gap-2">
            {isProcessing && (
              <CancelButton reportId={report.id} onComplete={onRefresh} />
            )}
            {(isComplete || isCancelled || isFailed) && (
              <ArchiveToggleButton
                reportId={report.id}
                isArchived={false}
                onOptimisticStart={onArchiveStart}
                onOptimisticError={onArchiveError}
                onComplete={onRefresh}
              />
            )}
          </div>
        </div>
      </div>

      {/* Navigation chevron */}
      {isClickable && (
        <ChevronRight className="absolute top-1/2 right-6 h-4 w-4 -translate-y-1/2 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  );
}

/**
 * ReportsDashboard - main component
 */
interface ReportsDashboardProps {
  reports: DashboardReport[];
}

export function ReportsDashboard({ reports }: ReportsDashboardProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [optimisticallyHidden, setOptimisticallyHidden] = useState<Set<string>>(
    () => new Set(),
  );

  const filteredReports = useMemo(() => {
    const filtered = reports.filter((r) => !optimisticallyHidden.has(r.id));

    if (!search.trim()) return filtered;

    const query = search.toLowerCase();
    return filtered.filter(
      (report) =>
        report.headline?.toLowerCase().includes(query) ||
        report.title.toLowerCase().includes(query),
    );
  }, [search, reports, optimisticallyHidden]);

  const handleOptimisticArchive = (reportId: string) => {
    setOptimisticallyHidden((prev) => new Set(prev).add(reportId));
  };

  const handleArchiveError = (reportId: string) => {
    setOptimisticallyHidden((prev) => {
      const next = new Set(prev);
      next.delete(reportId);
      return next;
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-8 pt-24 pb-16">
      {/* Header */}
      <div className="flex items-end justify-between">
        <h1 className="font-heading text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
          Reports
        </h1>

        <div className="flex items-center gap-6">
          <Link
            href="/home/archived"
            className="flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600"
          >
            <Archive className="h-3.5 w-3.5" />
            Archived
          </Link>

          <Link
            href="/home/reports/new"
            data-test="new-report-button"
            className="inline-flex items-center gap-2 bg-zinc-900 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            New Analysis
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mt-10 mb-8">
        <div className="group relative">
          <Search className="absolute top-1/2 left-0 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="w-full border-b border-zinc-200 bg-transparent py-3 pr-4 pl-7 text-[16px] text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
            data-test="search-reports-input"
          />
        </div>
      </div>

      {/* Report List */}
      {reports.length === 0 ? (
        <EmptyState />
      ) : filteredReports.length === 0 ? (
        <NoResultsState query={search} onClear={() => setSearch('')} />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            {filteredReports.map((report, index) => (
              <ReportCard
                key={report.id}
                report={report}
                isLast={index === filteredReports.length - 1}
                onArchiveStart={() => handleOptimisticArchive(report.id)}
                onArchiveError={() => handleArchiveError(report.id)}
                onRefresh={() => router.refresh()}
              />
            ))}
          </div>

          {/* Footer count */}
          <div className="mt-4 px-1">
            <span className="text-[13px] tracking-[-0.02em] text-zinc-400">
              Showing {filteredReports.length} of {reports.length} reports
            </span>
          </div>
        </>
      )}
    </div>
  );
}
