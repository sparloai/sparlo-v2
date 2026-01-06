'use client';

import { useEffect, useRef, useState } from 'react';

import { ArrowRight } from 'lucide-react';

import { reportSections } from './data/reports';
import type { ExampleReport } from './data/types';
import { ReadingProgress } from './reading-progress';
import { ReportContent } from './report-content';
import { ReportSidebar } from './report-sidebar';

interface ReportViewerProps {
  report: ExampleReport;
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
    <div
      className="overflow-hidden border border-zinc-200 bg-white"
      style={{ height: '75vh', maxHeight: '800px' }}
    >
      <div className="grid h-full grid-cols-1 md:grid-cols-[220px_1fr]">
        {/* Sidebar - Hidden on mobile */}
        <ReportSidebar
          report={report}
          sections={reportSections}
          activeSection={activeSection}
          onSectionClick={scrollToSection}
        />

        {/* Content Area */}
        <div className="flex flex-col overflow-hidden">
          {/* Mobile Section Tabs */}
          <div className="shrink-0 overflow-x-auto border-b border-zinc-200 md:hidden">
            <div className="flex gap-1 px-4 py-2">
              {reportSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`shrink-0 whitespace-nowrap px-3 py-2 text-[13px] tracking-[-0.02em] transition-colors ${
                    activeSection === section.id
                      ? 'border-b-2 border-zinc-900 font-medium text-zinc-900'
                      : 'text-zinc-500'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          {/* Reading Progress */}
          <ReadingProgress progress={scrollProgress} />

          {/* Scrollable Content */}
          <div ref={contentRef} className="report-scroll flex-1 overflow-y-auto">
            <ReportContent
              report={report}
              onActiveSectionChange={setActiveSection}
            />
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 px-6 py-4">
            <span className="text-[13px] tracking-[-0.02em] text-zinc-400">
              Viewing preview · Full report available after sign up
            </span>
            <a
              href="/auth/sign-up"
              className="flex items-center gap-2 text-[13px] font-medium tracking-[-0.02em] text-zinc-900 transition-colors hover:text-zinc-600"
            >
              Get full report
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
