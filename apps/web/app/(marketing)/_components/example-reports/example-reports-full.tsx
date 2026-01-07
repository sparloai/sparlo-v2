'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';

import {
  AnimatePresence,
  type MotionValue,
  motion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { ArrowRight, ChevronDown, List, X } from 'lucide-react';

import { cn } from '@kit/ui/utils';

import BrandSystemReport from '~/app/reports/[id]/_components/brand-system/brand-system-report';
import type { HybridReportData } from '~/app/reports/_lib/types/hybrid-report-display.types';

import { exampleReportsConfig } from './data/example-reports-data';

/**
 * Example Reports Section - Full Report Display
 *
 * Renders complete BrandSystemReport inline with:
 * - Sticky category tabs at top
 * - Scroll progress indicator
 * - Mobile TOC via bottom sheet
 * - Exit ramp CTA
 *
 * Design goals:
 * - No scroll-within-scroll (report flows naturally)
 * - Clear visual boundaries
 * - 10/10 reading experience
 */
export const ExampleReportsFull = memo(function ExampleReportsFull() {
  const [activeReportId, setActiveReportId] = useState(
    exampleReportsConfig[0]!.id,
  );
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Get active report data
  const activeReport = useMemo(
    () => exampleReportsConfig.find((r) => r.id === activeReportId)!,
    [activeReportId],
  );

  // Scroll progress for progress bar
  const { scrollYProgress } = useScroll({
    target: reportContainerRef,
    offset: ['start start', 'end end'],
  });

  // Transform scroll progress to width percentage
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  // Handle tab change with smooth scroll to report start
  const handleTabChange = useCallback((reportId: string) => {
    setActiveReportId(reportId);
    // Scroll to report section smoothly
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Close mobile TOC on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileTocOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="example-reports"
      className="relative bg-zinc-50"
    >
      {/* Section Header */}
      <SectionHeader />

      {/* Sticky Tab Bar */}
      <StickyTabBar
        activeReportId={activeReportId}
        onTabChange={handleTabChange}
        progressWidth={progressWidth}
      />

      {/* Report Container - full BrandSystemReport */}
      <div ref={reportContainerRef} className="relative">
        {/* Visual boundary - top */}
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="border-b border-zinc-200 pt-8 pb-4">
            <p className="text-[13px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
              Viewing Example Report
            </p>
            <h3 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-zinc-900 md:text-[28px]">
              {activeReport.hybridData.title}
            </h3>
          </div>
        </div>

        {/* Report Content - AnimatePresence for transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeReportId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <BrandSystemReport
              reportData={activeReport.hybridData}
              brief={activeReport.hybridData.brief}
              showToc={true}
              showActions={false}
              hasAppSidebar={false}
              compactTitle={true}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Exit Ramp CTA */}
      <ExitRampCTA />

      {/* Mobile TOC Button */}
      <MobileTocButton
        isOpen={isMobileTocOpen}
        onClick={() => setIsMobileTocOpen(true)}
      />

      {/* Mobile TOC Bottom Sheet */}
      <MobileTocSheet
        isOpen={isMobileTocOpen}
        onClose={() => setIsMobileTocOpen(false)}
        reports={exampleReportsConfig}
        activeReportId={activeReportId}
        onSelectReport={(id) => {
          handleTabChange(id);
          setIsMobileTocOpen(false);
        }}
      />
    </section>
  );
});

// ============================================
// SECTION HEADER
// ============================================

const SectionHeader = memo(function SectionHeader() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl"
      >
        <span className="text-[13px] font-semibold tracking-[0.1em] text-zinc-500 uppercase">
          Intelligence in Action
        </span>
        <h2 className="mt-4 text-[42px] leading-[1.1] font-semibold tracking-tight text-zinc-900 md:text-[52px]">
          See the depth of a Sparlo report
        </h2>
        <p className="mt-5 text-[18px] leading-relaxed text-zinc-600">
          Real reports. Real insights. Browse complete examples across
          industries—from carbon removal to energy systems—and see exactly how
          deep technical analysis unlocks breakthrough solutions.
        </p>
      </motion.div>
    </div>
  );
});

// ============================================
// STICKY TAB BAR WITH PROGRESS
// ============================================

interface StickyTabBarProps {
  activeReportId: string;
  onTabChange: (id: string) => void;
  progressWidth: MotionValue<string>;
}

const StickyTabBar = memo(function StickyTabBar({
  activeReportId,
  onTabChange,
  progressWidth,
}: StickyTabBarProps) {
  const [isSticky, setIsSticky] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Track if bar is stuck using IntersectionObserver
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the sentinel goes out of view at the top, we're sticky
        setIsSticky(!entry!.isIntersecting);
      },
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' },
    );

    // Create a sentinel element at the original position
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    sentinel.style.position = 'absolute';
    sentinel.style.top = '0';
    bar.parentElement?.insertBefore(sentinel, bar);
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={barRef}
        className={cn(
          'sticky top-0 z-40 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-sm transition-shadow duration-200',
          isSticky && 'shadow-sm',
        )}
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto py-3 md:gap-2">
            {exampleReportsConfig.map((report) => (
              <button
                key={report.id}
                onClick={() => onTabChange(report.id)}
                className={cn(
                  'shrink-0 rounded-lg px-4 py-2 text-[14px] font-medium transition-all',
                  report.id === activeReportId
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
                )}
              >
                {report.category}
              </button>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="h-0.5 w-full bg-zinc-200">
            <motion.div
              className="h-full bg-zinc-900"
              style={{ width: progressWidth }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// EXIT RAMP CTA
// ============================================

const ExitRampCTA = memo(function ExitRampCTA() {
  return (
    <div className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h3 className="text-[32px] font-semibold tracking-[-0.02em] text-zinc-900 md:text-[40px]">
            Want analysis like this for your problem?
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-[18px] leading-relaxed text-zinc-600">
            Get the same depth of technical analysis, patent landscape mapping,
            and actionable recommendations for your specific challenge.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/sign-up"
              className="group inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-8 py-4 text-[16px] font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Run Analysis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <span className="text-[14px] text-zinc-500">
              First report free • No credit card required
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
});

// ============================================
// MOBILE TOC BUTTON
// ============================================

interface MobileTocButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

const MobileTocButton = memo(function MobileTocButton({
  isOpen,
  onClick,
}: MobileTocButtonProps) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-transform hover:scale-105 lg:hidden"
      aria-label="Open table of contents"
    >
      <List className="h-5 w-5" />
    </button>
  );
});

// ============================================
// MOBILE TOC BOTTOM SHEET
// ============================================

interface MobileTocSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reports: typeof exampleReportsConfig;
  activeReportId: string;
  onSelectReport: (id: string) => void;
}

const MobileTocSheet = memo(function MobileTocSheet({
  isOpen,
  onClose,
  reports,
  activeReportId,
  onSelectReport,
}: MobileTocSheetProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white shadow-xl lg:hidden"
            style={{ maxHeight: '70vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-zinc-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 pb-4">
              <h4 className="text-[16px] font-semibold text-zinc-900">
                Example Reports
              </h4>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Report List */}
            <div className="overflow-y-auto px-4 py-4">
              <div className="space-y-2">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => onSelectReport(report.id)}
                    className={cn(
                      'w-full rounded-xl p-4 text-left transition-colors',
                      report.id === activeReportId
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-50 hover:bg-zinc-100',
                    )}
                  >
                    <div
                      className={cn(
                        'text-[12px] font-medium tracking-[0.08em] uppercase',
                        report.id === activeReportId
                          ? 'text-zinc-400'
                          : 'text-zinc-500',
                      )}
                    >
                      {report.category}
                    </div>
                    <div
                      className={cn(
                        'mt-1 text-[15px] font-medium',
                        report.id === activeReportId
                          ? 'text-white'
                          : 'text-zinc-900',
                      )}
                    >
                      {report.shortTitle}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Safe area padding for iOS */}
            <div className="h-8" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default ExampleReportsFull;
