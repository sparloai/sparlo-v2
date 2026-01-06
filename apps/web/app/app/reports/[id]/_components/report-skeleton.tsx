'use client';

import { memo } from 'react';

import { motion } from 'framer-motion';
import {
  BookOpen,
  FileText,
  Lightbulb,
  ListChecks,
  Shield,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';

import { cn } from '@kit/ui/utils';

/**
 * Report Skeleton Component
 *
 * Premium skeleton loading state for reports that mirrors the actual
 * report structure. Designed to feel intentional and crafted, not generic.
 *
 * Structure:
 * - Left sidebar with table of contents skeleton
 * - Main content with section skeletons matching report layout
 */

const STAGGER_DELAY = 0.05;
const SHIMMER_DURATION = 1.5;

// Sidebar section items with icons
const TOC_ITEMS = [
  { icon: FileText, label: 'Brief' },
  { icon: Sparkles, label: 'Executive Summary' },
  { icon: Target, label: 'Constraints' },
  { icon: Zap, label: 'Problem Analysis' },
  { icon: Lightbulb, label: 'Challenge Frame' },
  { icon: BookOpen, label: 'Innovation Analysis' },
  { icon: ListChecks, label: 'Solution Concepts' },
  { icon: Shield, label: 'Risks & Watchouts' },
];

// Custom shimmer skeleton with premium animation
const ShimmerSkeleton = memo(function ShimmerSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-zinc-800/50',
        className,
      )}
      {...props}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{
          translateX: ['100%', '-100%'],
        }}
        transition={{
          duration: SHIMMER_DURATION,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
});

// Sidebar skeleton
const SidebarSkeleton = memo(function SidebarSkeleton() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-800/50 lg:block">
      <div className="sticky top-0 h-screen overflow-y-auto px-6 py-8">
        {/* Logo area */}
        <div className="mb-8">
          <ShimmerSkeleton className="h-6 w-20" />
        </div>

        {/* Contents label */}
        <div className="mb-4">
          <ShimmerSkeleton className="h-3 w-16" />
        </div>

        {/* Table of contents items */}
        <nav className="space-y-1">
          {TOC_ITEMS.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * STAGGER_DELAY, duration: 0.3 }}
              className="flex items-center gap-3 rounded-md px-3 py-2"
            >
              <item.icon className="h-4 w-4 text-zinc-700" />
              <ShimmerSkeleton className="h-4 flex-1" />
            </motion.div>
          ))}
        </nav>
      </div>
    </aside>
  );
});

// Card skeleton with optional header
const CardSkeleton = memo(function CardSkeleton({
  variant = 'light',
  showHeader = true,
  headerWidth = 'w-32',
  lines = 3,
  className,
}: {
  variant?: 'light' | 'dark';
  showHeader?: boolean;
  headerWidth?: string;
  lines?: number;
  className?: string;
}) {
  const bgColor = variant === 'dark' ? 'bg-zinc-900/50' : 'bg-zinc-800/30';

  return (
    <div className={cn('rounded-lg p-6', bgColor, className)}>
      {showHeader && (
        <div className="mb-4 flex items-center gap-2">
          <ShimmerSkeleton className="h-4 w-4 rounded" />
          <ShimmerSkeleton className={cn('h-4', headerWidth)} />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, idx) => (
          <ShimmerSkeleton
            key={idx}
            className={cn('h-4', idx === lines - 1 ? 'w-4/5' : 'w-full')}
          />
        ))}
      </div>
    </div>
  );
});

// Main content skeleton
const ContentSkeleton = memo(function ContentSkeleton() {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[680px] px-6 py-10 md:px-8 lg:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          {/* Back link */}
          <ShimmerSkeleton className="mb-6 h-4 w-32" />

          {/* Title */}
          <ShimmerSkeleton className="mb-3 h-10 w-3/4" />
          <ShimmerSkeleton className="mb-2 h-10 w-1/2" />

          {/* Metadata row */}
          <div className="mt-4 flex items-center gap-4">
            <ShimmerSkeleton className="h-5 w-24" />
            <ShimmerSkeleton className="h-5 w-20" />
            <ShimmerSkeleton className="h-5 w-16" />
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center gap-3">
            <ShimmerSkeleton className="h-9 w-24 rounded-md" />
            <ShimmerSkeleton className="h-9 w-20 rounded-md" />
          </div>
        </motion.div>

        {/* Brief section (dark card) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8"
        >
          <CardSkeleton variant="dark" headerWidth="w-16" lines={4} />
        </motion.div>

        {/* Executive Summary (light card with more prominence) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-8"
        >
          <div className="rounded-lg border border-zinc-700/30 bg-white/5 p-6 shadow-lg shadow-black/10">
            <div className="mb-4 flex items-center gap-2">
              <ShimmerSkeleton className="h-5 w-5 rounded" />
              <ShimmerSkeleton className="h-5 w-40" />
            </div>
            <div className="space-y-3">
              <ShimmerSkeleton className="h-4 w-full" />
              <ShimmerSkeleton className="h-4 w-full" />
              <ShimmerSkeleton className="h-4 w-full" />
              <ShimmerSkeleton className="h-4 w-3/4" />
            </div>
            {/* Viability badge */}
            <div className="mt-6">
              <ShimmerSkeleton className="h-6 w-32 rounded-full" />
            </div>
          </div>
        </motion.div>

        {/* Primary Recommendation (dark card) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mb-8"
        >
          <div className="rounded-lg bg-zinc-900/60 p-6">
            <div className="mb-4 flex items-center gap-2">
              <ShimmerSkeleton className="h-5 w-5 rounded" />
              <ShimmerSkeleton className="h-5 w-48" />
            </div>
            <div className="space-y-3">
              <ShimmerSkeleton className="h-4 w-full" />
              <ShimmerSkeleton className="h-4 w-full" />
              <ShimmerSkeleton className="h-4 w-5/6" />
            </div>
          </div>
        </motion.div>

        {/* Problem Analysis section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mb-8 space-y-6"
        >
          {/* What's Wrong */}
          <CardSkeleton
            variant="light"
            headerWidth="w-28"
            lines={3}
            className="border border-zinc-700/20"
          />

          {/* Why It's Hard */}
          <CardSkeleton
            variant="light"
            headerWidth="w-24"
            lines={4}
            className="border border-zinc-700/20"
          />
        </motion.div>

        {/* Constraints section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mb-8 grid gap-6 md:grid-cols-2"
        >
          {/* Hard Constraints */}
          <div className="rounded-lg border-l-2 border-zinc-300 bg-zinc-100/50 p-5 dark:border-zinc-600 dark:bg-zinc-800/30">
            <div className="mb-4 flex items-center gap-2">
              <ShimmerSkeleton className="h-4 w-4 rounded" />
              <ShimmerSkeleton className="h-4 w-32" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-zinc-400/50" />
                  <ShimmerSkeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Soft Constraints */}
          <div className="rounded-lg border-l-2 border-amber-200 bg-amber-50/50 p-5 dark:border-amber-700 dark:bg-amber-900/20">
            <div className="mb-4 flex items-center gap-2">
              <ShimmerSkeleton className="h-4 w-4 rounded" />
              <ShimmerSkeleton className="h-4 w-32" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-amber-400/50" />
                  <ShimmerSkeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Table skeleton (Current State of Art) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mb-8"
        >
          <div className="mb-4 flex items-center gap-2">
            <ShimmerSkeleton className="h-4 w-4 rounded" />
            <ShimmerSkeleton className="h-4 w-40" />
          </div>
          <div className="overflow-hidden rounded-lg border border-zinc-700/30">
            {/* Table header */}
            <div className="flex gap-4 border-b border-zinc-700/30 bg-zinc-800/30 px-4 py-3">
              {['w-24', 'w-32', 'w-28', 'w-24', 'w-20'].map((width, idx) => (
                <ShimmerSkeleton key={idx} className={cn('h-3', width)} />
              ))}
            </div>
            {/* Table rows */}
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="flex gap-4 border-b border-zinc-700/20 px-4 py-4 last:border-0"
              >
                {['w-24', 'w-32', 'w-28', 'w-24', 'w-20'].map((width, idx) => (
                  <ShimmerSkeleton key={idx} className={cn('h-4', width)} />
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
});

/**
 * Main Report Skeleton Component
 *
 * Combines sidebar and content skeletons for the full loading experience.
 */
export const ReportSkeleton = memo(function ReportSkeleton() {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <SidebarSkeleton />
      <ContentSkeleton />
    </div>
  );
});

export default ReportSkeleton;
