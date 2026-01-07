'use client';

import { useEffect, useRef, useState } from 'react';

import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, FileText, Scale } from 'lucide-react';

import { reportSections } from './data/reports';
import type { ExampleReport } from './data/types';
import { ReportContent } from './report-content';

interface ReportViewerProps {
  report: ExampleReport;
}

// Circular progress ring component
function ProgressRing({ progress }: { progress: number }) {
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative h-12 w-12">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-zinc-200"
        />
        <motion.circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-zinc-900"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-zinc-700">
        {Math.round(progress * 100)}%
      </span>
    </div>
  );
}

// Stat item component
function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
        {icon}
      </div>
      <div>
        <p className="text-[15px] font-semibold text-zinc-900">{value}</p>
        <p className="text-[12px] text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

export function ReportViewer({ report }: ReportViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState('executive-summary');
  const [scrollProgress, setScrollProgress] = useState(0);

  // Reset scroll when report changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
      setScrollProgress(0);
      setActiveSection('executive-summary');
    }
  }, [report.id]);

  // Track scroll progress
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = content;
      const progress = scrollTop / (scrollHeight - clientHeight);
      setScrollProgress(Math.min(Math.max(progress, 0), 1));
    };

    content.addEventListener('scroll', handleScroll);
    return () => content.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const content = contentRef.current;
    const section = document.getElementById(`${report.id}-${sectionId}`);
    if (!content || !section) return;

    const offsetTop = section.offsetTop - 24;
    content.scrollTo({ top: offsetTop, behavior: 'smooth' });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/50">
      {/* Header Bar */}
      <div className="border-b border-zinc-100 bg-gradient-to-b from-zinc-50 to-white px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Left: Title and category */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[12px] font-semibold tracking-[0.08em] text-zinc-400 uppercase">
                {report.category}
              </p>
              <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-zinc-900">
                {report.title}
              </h3>
            </div>
          </div>

          {/* Right: Progress and stats */}
          <div className="hidden items-center gap-8 md:flex">
            <StatItem
              icon={<BookOpen className="h-4 w-4" />}
              value={report.pages}
              label="Pages"
            />
            <StatItem
              icon={<Scale className="h-4 w-4" />}
              value={report.patents}
              label="Patents"
            />
            <div className="h-10 w-px bg-zinc-200" />
            <ProgressRing progress={scrollProgress} />
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div
        className="grid grid-cols-1 md:grid-cols-[240px_1fr]"
        style={{ height: '70vh', maxHeight: '700px' }}
      >
        {/* Sidebar - Hidden on mobile */}
        <aside className="hidden overflow-y-auto border-r border-zinc-100 bg-zinc-50/50 p-6 md:block">
          {/* Navigation */}
          <nav>
            <p className="mb-4 text-[11px] font-semibold tracking-[0.1em] text-zinc-400 uppercase">
              Contents
            </p>
            <ul className="space-y-1">
              {reportSections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`group relative flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[14px] transition-all ${
                      activeSection === section.id
                        ? 'bg-zinc-900 font-medium text-white'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Quick Stats */}
          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-4">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.1em] text-zinc-400 uppercase">
              Report Details
            </p>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Read time</span>
                <span className="font-medium text-zinc-900">
                  {report.readTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Patents cited</span>
                <span className="font-medium text-zinc-900">
                  {report.patents}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Papers reviewed</span>
                <span className="font-medium text-zinc-900">
                  {report.papers}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex flex-col overflow-hidden">
          {/* Mobile Section Tabs */}
          <div className="shrink-0 overflow-x-auto border-b border-zinc-100 bg-white md:hidden">
            <div className="flex gap-1 px-4 py-2">
              {reportSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-[13px] whitespace-nowrap transition-all ${
                    activeSection === section.id
                      ? 'bg-zinc-900 font-medium text-white'
                      : 'text-zinc-500 hover:bg-zinc-100'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Content */}
          <div
            ref={contentRef}
            className="report-scroll flex-1 overflow-y-auto"
          >
            <ReportContent
              report={report}
              onActiveSectionChange={setActiveSection}
            />
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t border-zinc-100 bg-gradient-to-t from-zinc-50 to-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] text-zinc-500">
              <span className="font-medium text-zinc-700">Preview mode</span> ·
              Full report available after sign up
            </p>
          </div>
          <motion.a
            href="/auth/sign-up"
            className="group flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-[14px] font-medium text-white shadow-lg shadow-zinc-900/20 transition-all hover:bg-zinc-800 hover:shadow-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Get full access
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </motion.a>
        </div>
      </div>
    </div>
  );
}
