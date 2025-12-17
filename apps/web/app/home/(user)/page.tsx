import { Suspense } from 'react';

import Link from 'next/link';

import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Plus,
  Sparkles,
} from 'lucide-react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

import type { ConversationStatus } from './_lib/types';

interface Report {
  id: string;
  title: string;
  status: ConversationStatus;
  current_step: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
}

async function getReports(): Promise<Report[]> {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select('id, title, status, current_step, created_at, updated_at, archived')
    .eq('archived', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch reports:', error);
    return [];
  }

  return (data as Report[]) ?? [];
}

function StatusBadge({ status }: { status: ConversationStatus }) {
  const config = {
    processing: {
      icon: Loader2,
      label: 'Processing',
      className:
        'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      iconClassName: 'animate-spin',
    },
    clarifying: {
      icon: Clock,
      label: 'Needs Input',
      className:
        'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
      iconClassName: '',
    },
    complete: {
      icon: CheckCircle2,
      label: 'Complete',
      className:
        'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
      iconClassName: '',
    },
    error: {
      icon: AlertCircle,
      label: 'Error',
      className: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      iconClassName: '',
    },
    confirm_rerun: {
      icon: Clock,
      label: 'Pending',
      className:
        'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
      iconClassName: '',
    },
  };

  const {
    icon: Icon,
    label,
    className,
    iconClassName,
  } = config[status] ?? config.processing;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        className,
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', iconClassName)} />
      {label}
    </span>
  );
}

function ReportCard({ report }: { report: Report }) {
  const timeAgo = formatTimeAgo(new Date(report.created_at));

  return (
    <Link
      href={`/home/reports/${report.id}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-[#7C3AED]/30 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-[#7C3AED]/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-medium text-gray-900 group-hover:text-[#7C3AED] dark:text-white">
            {report.title || 'Untitled Report'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {timeAgo}
          </p>
        </div>
        <StatusBadge status={report.status} />
      </div>
    </Link>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 py-16 dark:border-neutral-800 dark:bg-neutral-900/50">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#7C3AED]/10">
        <FileText className="h-7 w-7 text-[#7C3AED]" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        No reports yet
      </h3>
      <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
        Create your first report to get innovative solutions to your engineering
        challenges.
      </p>
      <Link href="/home/reports/new" className="mt-6">
        <Button className="bg-[#7C3AED] hover:bg-[#6D28D9]">
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </Link>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-[#7C3AED]" />
      <p className="mt-4 text-sm text-gray-500">Loading reports...</p>
    </div>
  );
}

async function ReportsList() {
  const reports = await getReports();

  if (reports.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#FAFAFA] dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              <Sparkles className="h-6 w-6 text-[#7C3AED]" />
              Your Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Innovation reports for your engineering challenges
            </p>
          </div>
          <Link href="/home/reports/new">
            <Button
              size="lg"
              className="bg-[#7C3AED] hover:bg-[#6D28D9]"
              style={{ boxShadow: '0 4px 14px -2px rgba(124, 58, 237, 0.4)' }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </Link>
        </div>

        {/* Reports List */}
        <Suspense fallback={<LoadingState />}>
          <ReportsList />
        </Suspense>
      </div>
    </div>
  );
}
