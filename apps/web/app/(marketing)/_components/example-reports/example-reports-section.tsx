'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { FileText, List, Lock, Target, X } from 'lucide-react';

import { CardWithHeader, MonoLabel, SectionHeader } from '@kit/ui/aura';
import { Button } from '@kit/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@kit/ui/sheet';
import { cn } from '@kit/ui/utils';

import { EXAMPLE_REPORTS } from './example-reports-data';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

export function ExampleReportsSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showToc, setShowToc] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const report = EXAMPLE_REPORTS[activeTab]!;

  // Generate TOC from report sections
  const tocItems: TocItem[] = useMemo(() => {
    return report.sections.map((section) => ({
      id: section.id,
      title: section.title,
      level: 2,
    }));
  }, [report.sections]);

  // Track active section on scroll
  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        const scrollPosition = window.scrollY + 200;
        for (let i = tocItems.length - 1; i >= 0; i--) {
          const item = tocItems[i];
          if (!item) continue;
          const element = document.getElementById(item.id);
          if (element && element.offsetTop <= scrollPosition) {
            setActiveSection(item.id);
            break;
          }
        }
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [tocItems]);

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 180;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  }, []);

  return (
    <section
      id="example-reports"
      className="relative min-h-screen bg-white dark:bg-zinc-950"
    >
      {/* Tab Navigation - Sticky below main nav */}
      <div className="sticky top-14 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="no-scrollbar flex gap-1 overflow-x-auto py-1">
            {EXAMPLE_REPORTS.map((r, i) => (
              <button
                key={r.id}
                onClick={() => {
                  setActiveTab(i);
                  setActiveSection(null);
                  window.scrollTo({
                    top:
                      document.getElementById('example-reports')?.offsetTop ??
                      0,
                    behavior: 'smooth',
                  });
                }}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all',
                  activeTab === i
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
                )}
              >
                {r.title}
                {r.locked && <Lock className="h-3.5 w-3.5 opacity-50" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Sticky TOC Sidebar */}
        <AnimatePresence>
          {showToc && !report.locked && (
            <motion.aside
              className="hidden w-64 flex-shrink-0 lg:block"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="sticky top-32 h-[calc(100vh-140px)] overflow-y-auto border-r border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-mono text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                      Contents
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
                      onClick={() => setShowToc(false)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <nav className="space-y-0.5">
                    {tocItems.map((item, index) => (
                      <button
                        key={`${item.id}-${index}`}
                        onClick={() => scrollToSection(item.id)}
                        className={cn(
                          'group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] transition-all',
                          activeSection === item.id
                            ? 'bg-violet-100 font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
                        )}
                      >
                        <span className="font-mono text-xs text-zinc-400 dark:text-zinc-600">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="truncate">{item.title}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* TOC Toggle */}
        {!showToc && !report.locked && (
          <motion.button
            className="fixed top-36 left-4 z-40 hidden items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 lg:flex dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            onClick={() => setShowToc(true)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <List className="h-4 w-4" />
            <span className="text-xs">Contents</span>
          </motion.button>
        )}

        {/* Report Content */}
        <div
          className={cn(
            'min-w-0 flex-1 px-4 py-10 transition-all md:px-6 lg:px-8',
          )}
        >
          <div className="mx-auto max-w-4xl">
            {/* Report Header */}
            <header className="mb-12">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 lg:text-5xl dark:text-white">
                  {report.title}
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                  {report.subtitle}
                </p>
                <div className="flex items-center gap-3 font-mono text-sm text-zinc-500 dark:text-zinc-500">
                  <span>{report.metadata.readTime}</span>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span>{report.metadata.dataPoints}</span>
                </div>
              </div>
            </header>

            {/* Report Content */}
            {report.locked ? (
              <LockedOverlay report={report} />
            ) : (
              <ReportContent report={report} activeSection={activeSection} />
            )}

            <div className="h-32" />
          </div>
        </div>
      </div>

      {/* Mobile TOC Button */}
      <div className="fixed right-6 bottom-6 z-50 lg:hidden">
        {!report.locked && (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900">
              <List className="h-4 w-4" />
              Contents
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh]">
              <SheetHeader>
                <SheetTitle>Report Contents</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 space-y-1">
                {tocItems.map((item, index) => (
                  <button
                    key={`mobile-${item.id}`}
                    onClick={() => {
                      scrollToSection(item.id);
                      setSheetOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm transition-all',
                      activeSection === item.id
                        ? 'bg-violet-100 font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
                    )}
                  >
                    <span className="font-mono text-xs text-zinc-400">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {item.title}
                  </button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </section>
  );
}

interface Report {
  id: string;
  title: string;
  subtitle: string;
  locked: boolean;
  metadata: {
    readTime: string;
    dataPoints: string;
  };
  sections: {
    id: string;
    number: string;
    title: string;
    content: React.ReactNode;
  }[];
}

function LockedOverlay({ report }: { report: Report }) {
  return (
    <div className="relative min-h-[500px]">
      <div className="pointer-events-none opacity-40 blur-sm">
        <SectionHeader title="Executive Summary" subtitle="The bottom line" />
        <CardWithHeader icon={Target} label="Executive Summary">
          <div className="space-y-4">
            <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </CardWithHeader>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-zinc-950/90">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Lock className="h-6 w-6 text-zinc-500" />
          </div>
          <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Premium Report
          </h3>
          <p className="mt-2 max-w-sm text-zinc-600 dark:text-zinc-400">
            Sign up to access the full {report.title} analysis and all other
            intelligence reports.
          </p>
          <a
            href="/auth/sign-up"
            className="mt-6 inline-block rounded-md bg-violet-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-700"
          >
            Get Started Free
          </a>
        </div>
      </div>
    </div>
  );
}

function ReportContent({
  report,
}: {
  report: Report;
  activeSection: string | null;
}) {
  return (
    <div className="space-y-16">
      {report.sections.map((section, index) => (
        <section key={section.id} id={section.id} className="scroll-mt-48">
          <SectionHeader
            title={section.title}
            subtitle={getSectionSubtitle(section.id)}
          />
          <CardWithHeader
            icon={getSectionIcon(section.id)}
            label={section.title}
          >
            <div className="prose prose-zinc dark:prose-invert prose-p:text-base prose-p:leading-relaxed prose-p:text-zinc-700 dark:prose-p:text-zinc-300 max-w-none">
              {section.content}
            </div>
          </CardWithHeader>
        </section>
      ))}
    </div>
  );
}

function getSectionSubtitle(sectionId: string): string {
  const subtitles: Record<string, string> = {
    brief: 'Original problem statement',
    'executive-summary': 'The bottom line',
    'challenge-the-frame': 'Questioning assumptions',
    'primary-solution': 'Recommended approach',
    'innovation-concept': 'Cross-domain insight',
    risks: 'What could go wrong',
    'next-steps': 'Actionable recommendations',
  };
  return subtitles[sectionId] ?? '';
}

function getSectionIcon(
  sectionId: string,
): React.ComponentType<{ className?: string }> {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    brief: FileText,
    'executive-summary': Target,
    'challenge-the-frame': FileText,
    'primary-solution': Target,
    'innovation-concept': Target,
    risks: FileText,
    'next-steps': FileText,
  };
  return icons[sectionId] ?? FileText;
}
