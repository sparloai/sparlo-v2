'use client';

/**
 * Table of Contents Component
 *
 * Air Company Aesthetic - Typography-driven navigation
 *
 * Features:
 * - Fixed sidebar (desktop lg+)
 * - Mobile dropdown
 * - Intersection Observer for active tracking (via shared hook)
 * - Smooth scrolling with offset
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ChevronDown } from 'lucide-react';

import { cn } from '@kit/ui/utils';

import {
  TOC_SCROLL_OFFSET,
  type TocSection,
  flattenSectionIds,
  useTocScroll,
} from '../../_lib/hooks/use-toc-scroll';

// Re-export for consumers
export type { TocSection };

interface TableOfContentsProps {
  sections: TocSection[];
  variant?: 'sidebar';
  scrollOffset?: number;
  /**
   * Whether the TOC is inside a layout with the app sidebar.
   * When true (default), TOC is positioned at left-16 (64px) to clear the app sidebar.
   * When false (landing page), TOC is positioned at left-0.
   */
  hasAppSidebar?: boolean;
}

// ============================================
// SIDEBAR TOC (Desktop)
// ============================================

interface SidebarTocProps {
  sections: TocSection[];
  activeSection: string;
  onNavigate: (id: string) => void;
  progress: number;
  hasAppSidebar: boolean;
}

const SidebarToc = memo(function SidebarToc({
  sections,
  activeSection,
  onNavigate,
  progress,
  hasAppSidebar,
}: SidebarTocProps) {
  return (
    <aside
      className={cn(
        'fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-56 overflow-y-auto border-r border-zinc-100 bg-white/95 p-6 backdrop-blur-sm lg:block',
        hasAppSidebar ? 'left-16' : 'left-0',
      )}
    >
      {/* Contents label */}
      <p className="text-[12px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
        Contents
      </p>

      {/* Navigation */}
      <nav className="relative mt-6 pl-4">
        {/* Progress line */}
        <div
          className="absolute top-0 left-0 h-full w-px bg-zinc-100"
          style={{
            background: `linear-gradient(to bottom, #18181b ${progress}%, #e4e4e7 ${progress}%)`,
          }}
        />

        <ul className="space-y-1">
          {sections.map((section, idx) => (
            <li
              key={section.id}
              className="toc-item"
              style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
            >
              <button
                onClick={() => onNavigate(section.id)}
                className={cn(
                  'toc-link relative block w-full py-2 text-left text-[14px] transition-colors',
                  activeSection === section.id
                    ? 'font-medium text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900',
                )}
              >
                {section.title}
              </button>

              {/* Subsections */}
              {section.subsections && section.subsections.length > 0 && (
                <ul className="mt-1 ml-4 space-y-1">
                  {section.subsections.map((sub) => (
                    <li key={sub.id}>
                      <button
                        onClick={() => onNavigate(sub.id)}
                        className={cn(
                          'block w-full py-1 text-left text-[13px] transition-colors',
                          activeSection === sub.id
                            ? 'text-zinc-700'
                            : 'text-zinc-400 hover:text-zinc-600',
                        )}
                      >
                        {sub.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <style jsx>{`
        .toc-item {
          animation: slideInLeft 0.4s ease-out forwards;
          opacity: 0;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .toc-link::before {
          content: '';
          position: absolute;
          left: -16px;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 0;
          background: #18181b;
          transition: height 0.2s ease;
        }

        .toc-link:hover::before,
        .toc-link.active::before {
          height: 100%;
        }
      `}</style>
    </aside>
  );
});

// ============================================
// MOBILE TOC (Dropdown)
// ============================================

interface MobileTocProps {
  sections: TocSection[];
  activeSection: string;
  onNavigate: (id: string) => void;
}

const MobileToc = memo(function MobileToc({
  sections,
  activeSection,
  onNavigate,
}: MobileTocProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentSection = useMemo(
    () => sections.find((s) => s.id === activeSection),
    [sections, activeSection],
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = useCallback(
    (id: string) => {
      onNavigate(id);
      setIsOpen(false);
    },
    [onNavigate],
  );

  return (
    <div
      ref={dropdownRef}
      className="sticky top-0 z-50 border-b border-zinc-100 bg-white/95 backdrop-blur-sm lg:hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="text-[14px] text-zinc-600">
          {currentSection?.title || 'Contents'}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-zinc-400 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 left-0 border-b border-zinc-200 bg-white shadow-lg duration-200">
          <nav className="px-6 py-4">
            <ul className="space-y-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => handleNavigate(section.id)}
                    className={cn(
                      'block w-full py-2 text-left text-[14px] transition-colors',
                      activeSection === section.id
                        ? 'font-medium text-zinc-900'
                        : 'text-zinc-600 hover:text-zinc-900',
                    )}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================

export const TableOfContents = memo(function TableOfContents({
  sections,
  scrollOffset = TOC_SCROLL_OFFSET,
  hasAppSidebar = true,
}: TableOfContentsProps) {
  // Flatten section IDs for tracking
  const sectionIds = useMemo(() => flattenSectionIds(sections), [sections]);

  // Use shared scroll tracking hook
  const { activeSection, navigateToSection, progress } = useTocScroll({
    sectionIds,
    scrollOffset,
    trackProgress: true,
  });

  return (
    <>
      {/* Mobile */}
      <MobileToc
        sections={sections}
        activeSection={activeSection}
        onNavigate={navigateToSection}
      />

      {/* Desktop Sidebar */}
      <SidebarToc
        sections={sections}
        activeSection={activeSection}
        onNavigate={navigateToSection}
        progress={progress}
        hasAppSidebar={hasAppSidebar}
      />
    </>
  );
});

// ============================================
// UTILITY: Generate sections from report data
// ============================================

/**
 * Generates TOC sections from hybrid report data.
 * Gracefully handles missing sections.
 */
export function generateTocSections(
  reportData: Record<string, unknown>,
  hasBrief = false,
): TocSection[] {
  const sections: TocSection[] = [];

  // Brief (user's original input) - first if present
  if (hasBrief) {
    sections.push({
      id: 'brief',
      title: 'The Brief',
    });
  }

  // Executive Summary (always present)
  if (reportData.executive_summary || reportData.brief) {
    sections.push({
      id: 'executive-summary',
      title: 'Executive Summary',
    });
  }

  // Problem Analysis
  if (reportData.problem_analysis) {
    sections.push({
      id: 'problem-analysis',
      title: 'Problem Analysis',
    });
  }

  // Constraints
  if (reportData.constraints_and_metrics) {
    sections.push({
      id: 'constraints-metrics',
      title: 'Constraints',
    });
  }

  // Challenge the Frame
  if (
    reportData.challenge_the_frame &&
    Array.isArray(reportData.challenge_the_frame) &&
    reportData.challenge_the_frame.length > 0
  ) {
    sections.push({
      id: 'challenge-the-frame',
      title: 'Challenge the Frame',
    });
  }

  // Innovation Analysis
  if (reportData.innovation_analysis) {
    sections.push({
      id: 'innovation-analysis',
      title: 'Innovation Analysis',
    });
  }

  // Execution Track / Solution Concepts
  if (reportData.execution_track) {
    sections.push({
      id: 'solution-concepts',
      title: 'Solution Concepts',
      subsections: [
        ...(reportData.execution_track
          ? [{ id: 'primary-recommendation', title: 'Primary Recommendation' }]
          : []),
      ],
    });
  }

  // Innovation Portfolio
  if (reportData.innovation_portfolio) {
    const portfolio = reportData.innovation_portfolio as {
      parallel_investigations?: unknown[];
    };
    sections.push({
      id: 'innovation-concepts',
      title: 'Innovation Concepts',
      subsections: portfolio?.parallel_investigations?.length
        ? [{ id: 'parallel-investigations', title: 'Parallel Investigations' }]
        : [],
    });
  }

  // Frontier Technologies
  if (
    (reportData.innovation_portfolio as { frontier_watch?: unknown[] })
      ?.frontier_watch?.length
  ) {
    sections.push({
      id: 'frontier-technologies',
      title: 'Frontier Technologies',
    });
  }

  // Strategic Integration
  if (reportData.strategic_integration) {
    sections.push({
      id: 'strategic-integration',
      title: 'Strategic Integration',
    });
  }

  // Risks & Watchouts
  if (
    reportData.risks_and_watchouts &&
    Array.isArray(reportData.risks_and_watchouts) &&
    reportData.risks_and_watchouts.length > 0
  ) {
    sections.push({
      id: 'risks-watchouts',
      title: 'Risks & Watchouts',
    });
  }

  // Self-Critique
  if (reportData.self_critique || reportData.honest_assessment) {
    sections.push({
      id: 'self-critique',
      title: 'Self-Critique',
    });
  }

  // Recommendation
  const strategicIntegration = reportData.strategic_integration as
    | {
        personal_recommendation?: unknown;
      }
    | undefined;
  if (
    reportData.what_id_actually_do ||
    strategicIntegration?.personal_recommendation
  ) {
    sections.push({
      id: 'recommendation',
      title: 'Recommendation',
    });
  }

  return sections;
}

export default TableOfContents;
