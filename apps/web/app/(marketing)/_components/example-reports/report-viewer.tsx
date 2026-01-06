'use client';

import { useEffect, useRef, useState } from 'react';

import { ExternalLink } from 'lucide-react';

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
      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
      style={{ height: '70vh', maxHeight: '700px' }}
    >
      <div className="grid h-full grid-cols-1 md:grid-cols-[200px_1fr]">
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
            <div className="flex gap-2 px-4 py-2">
              {reportSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`
                    shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] transition-colors
                    ${
                      activeSection === section.id
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-500'
                    }
                  `}
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
          <div className="flex shrink-0 justify-center border-t border-zinc-100 px-6 py-4">
            <a
              href={`/reports/${report.slug}`}
              className="flex items-center gap-1.5 text-[13px] text-zinc-400 transition-colors hover:text-blue-600"
            >
              Open full report
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
