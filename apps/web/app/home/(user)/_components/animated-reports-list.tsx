'use client';

import Link from 'next/link';

import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Plus,
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

import { usePrefersReducedMotion } from '../_hooks/use-prefers-reduced-motion';
import type { ConversationStatus } from '../_lib/types';

interface Report {
  id: string;
  title: string;
  status: ConversationStatus;
  current_step: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
}

// Custom easing as tuple for TypeScript
const easeOut: [number, number, number, number] = [0, 0, 0.2, 1];

// Animation variants - defined outside component for performance
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easeOut,
    },
  },
};

const cardVariants: Variants = {
  initial: { y: 0 },
  hover: {
    y: -2,
    transition: {
      duration: 0.2,
      ease: easeOut,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

function StatusBadge({ status }: { status: ConversationStatus }) {
  const config = {
    processing: {
      icon: Loader2,
      label: 'Processing',
      className: 'bg-[--accent-muted] text-[--accent]',
      iconClassName: 'animate-spin',
    },
    clarifying: {
      icon: Clock,
      label: 'Needs Input',
      className: 'bg-[--status-warning]/15 text-[--status-warning]',
      iconClassName: '',
    },
    complete: {
      icon: CheckCircle2,
      label: 'Complete',
      className: 'bg-[--status-success]/15 text-[--status-success]',
      iconClassName: '',
    },
    error: {
      icon: AlertCircle,
      label: 'Error',
      className: 'bg-[--status-error]/15 text-[--status-error]',
      iconClassName: '',
    },
    failed: {
      icon: AlertCircle,
      label: 'Failed',
      className: 'bg-[--status-warning]/15 text-[--status-warning]',
      iconClassName: '',
    },
    confirm_rerun: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-[--text-muted]/15 text-[--text-muted]',
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

function ReportCard({
  report,
  shouldAnimate,
}: {
  report: Report;
  shouldAnimate: boolean;
}) {
  const timeAgo = formatTimeAgo(new Date(report.created_at));

  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-medium text-[--text-primary] transition-colors group-hover:text-[--accent]">
            {report.title || 'Untitled Report'}
          </h3>
          <p className="mt-1 text-sm text-[--text-muted]">{timeAgo}</p>
        </div>
        <StatusBadge status={report.status} />
      </div>
    </>
  );

  if (shouldAnimate) {
    return (
      <motion.div variants={itemVariants}>
        <Link href={`/home/reports/${report.id}`} className="group block">
          <motion.div
            variants={cardVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="rounded-xl border border-[--border-subtle] bg-[--surface-elevated] p-5 transition-colors hover:border-[--border-default]"
          >
            {cardContent}
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  return (
    <Link
      href={`/home/reports/${report.id}`}
      className="group block rounded-xl border border-[--border-subtle] bg-[--surface-elevated] p-5 transition-colors hover:border-[--border-default]"
    >
      {cardContent}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[--border-default] bg-[--surface-overlay]/50 px-6 py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[--accent-muted]">
        <FileText className="h-7 w-7 text-[--accent]" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-[--text-primary]">
        No reports yet
      </h3>
      <p className="mt-1 text-center text-sm text-[--text-muted]">
        Create your first report to get innovative solutions to your engineering
        challenges.
      </p>
      <Link href="/home/reports/new" className="mt-6">
        <Button className="bg-[--accent] text-white hover:bg-[--accent-hover]">
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </Link>
    </div>
  );
}

interface AnimatedReportsListProps {
  reports: Report[];
}

export function AnimatedReportsList({ reports }: AnimatedReportsListProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldAnimate = !prefersReducedMotion;

  if (reports.length === 0) {
    return <EmptyState />;
  }

  if (shouldAnimate) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            shouldAnimate={shouldAnimate}
          />
        ))}
      </motion.div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          shouldAnimate={shouldAnimate}
        />
      ))}
    </div>
  );
}
