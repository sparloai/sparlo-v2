'use client';

import { memo } from 'react';

import { motion } from 'framer-motion';

import { Tabs, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { cn } from '@kit/ui/utils';

import type { ReportId } from './types';

interface ReportTabsProps {
  reports: Array<{ id: ReportId; title: string; shortTitle: string }>;
  activeId: ReportId;
  onSelect: (id: ReportId) => void;
}

/**
 * Report Tabs Component
 *
 * Sticky horizontal tabs for switching between reports.
 * Features:
 * - Animated active indicator with layoutId
 * - Responsive (short title on mobile)
 * - Accessible via Radix Tabs
 */
export const ReportTabs = memo(function ReportTabs({
  reports,
  activeId,
  onSelect,
}: ReportTabsProps) {
  return (
    <Tabs
      value={activeId}
      onValueChange={(v: string) => onSelect(v as ReportId)}
    >
      <TabsList
        className="sticky top-16 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-sm"
        aria-label="Select a report"
      >
        <div className="mx-auto max-w-4xl px-4">
          <div className="no-scrollbar flex gap-1 overflow-x-auto py-3">
            {reports.map((report) => {
              const isActive = activeId === report.id;
              return (
                <TabsTrigger
                  key={report.id}
                  value={report.id}
                  className={cn(
                    'relative rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap',
                    'transition-colors duration-150',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900',
                    isActive
                      ? 'text-zinc-900'
                      : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700',
                  )}
                >
                  {/* Mobile: short title, Desktop: full title */}
                  <span className="hidden sm:inline">{report.title}</span>
                  <span className="sm:hidden">{report.shortTitle}</span>

                  {/* Active Indicator with smooth animation */}
                  {isActive && (
                    <motion.div
                      layoutId="activeReportIndicator"
                      className="absolute inset-0 -z-10 rounded-lg bg-zinc-100"
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </TabsTrigger>
              );
            })}
          </div>
        </div>
      </TabsList>
    </Tabs>
  );
});
