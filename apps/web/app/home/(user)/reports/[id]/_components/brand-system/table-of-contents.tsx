'use client';

/**
 * Table of Contents Component
 *
 * Air Company Aesthetic - Typography-driven navigation
 *
 * Features:
 * - Fixed sidebar (desktop lg+)
 * - Floating minimal dots (xl+)
 * - Mobile dropdown
 * - Intersection Observer for active tracking
 * - Smooth scrolling with offset
 */

import { cn } from '@kit/ui/utils';
import { ChevronDown } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ============================================
// TYPES
// ============================================

export interface TocSection {
  id: string;
  title: string;
  subsections?: { id: string; title: string }[];
}

interface TableOfContentsProps {
  sections: TocSection[];
  variant?: 'sidebar' | 'floating' | 'both';
  scrollOffset?: number;
}

// ============================================
// SIDEBAR TOC (Desktop)
// ============================================

interface SidebarTocProps {
  sections: TocSection[];
  activeSection: string;
  onNavigate: (id: string) => void;
  progress: number;
}

const SidebarToc = memo(function SidebarToc({
  sections,
  activeSection,
  onNavigate,
  progress,
}: SidebarTocProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 overflow-y-auto border-r border-zinc-100 bg-white/95 p-8 backdrop-blur-sm lg:block">
      {/* Contents label */}
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-zinc-400">
        Contents
      </p>

      {/* Navigation */}
      <nav className="relative mt-6 pl-4">
        {/* Progress line */}
        <div
          className="absolute left-0 top-0 h-full w-px bg-zinc-100"
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
                <ul className="ml-4 mt-1 space-y-1">
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
// FLOATING TOC (XL screens)
// ============================================

interface FloatingTocProps {
  sections: TocSection[];
  activeSection: string;
  onNavigate: (id: string) => void;
  visible: boolean;
}

const FloatingToc = memo(function FloatingToc({
  sections,
  activeSection,
  onNavigate,
  visible,
}: FloatingTocProps) {
  return (
    <nav
      className={cn(
        'fixed right-8 top-1/2 z-40 hidden -translate-y-1/2 xl:block',
        'transition-all duration-300',
        visible
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0 translate-y-2',
      )}
    >
      <ul className="space-y-3">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => onNavigate(section.id)}
              className="group flex items-center gap-3"
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full transition-all duration-200',
                  activeSection === section.id
                    ? 'scale-125 bg-zinc-900'
                    : 'bg-zinc-300 group-hover:bg-zinc-400',
                )}
              />
              <span
                className={cn(
                  'whitespace-nowrap text-[12px] transition-opacity',
                  'opacity-0 group-hover:opacity-100',
                  activeSection === section.id
                    ? 'text-zinc-900'
                    : 'text-zinc-500',
                )}
              >
                {section.title}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
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
        <div className="absolute left-0 right-0 animate-in fade-in slide-in-from-top-2 border-b border-zinc-200 bg-white shadow-lg duration-200">
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
  variant = 'both',
  scrollOffset = 100,
}: TableOfContentsProps) {
  const [activeSection, setActiveSection] = useState<string>(
    sections[0]?.id || '',
  );
  const [hasScrolled, setHasScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  // All section IDs including subsections
  const allSectionIds = useMemo(() => {
    const ids: string[] = [];
    sections.forEach((section) => {
      ids.push(section.id);
      section.subsections?.forEach((sub) => ids.push(sub.id));
    });
    return ids;
  }, [sections]);

  // Intersection Observer for active section
  useEffect(() => {
    const observerOptions: IntersectionObserverInit = {
      rootMargin: '-20% 0px -75% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    allSectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [allSectionIds]);

  // Scroll listener for floating TOC visibility and progress
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const windowHeight = window.innerHeight;
          const docHeight =
            document.documentElement.scrollHeight - windowHeight;

          // Show floating TOC after scrolling past 50% of viewport
          setHasScrolled(scrollY > windowHeight * 0.5);

          // Update progress
          const newProgress = Math.min((scrollY / docHeight) * 100, 100);
          setProgress(newProgress);

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigate to section
  const handleNavigate = useCallback(
    (id: string) => {
      const element = document.getElementById(id);
      if (element) {
        const top =
          element.getBoundingClientRect().top + window.scrollY - scrollOffset;
        window.scrollTo({
          top,
          behavior: 'smooth',
        });
      }
    },
    [scrollOffset],
  );

  const showSidebar = variant === 'sidebar' || variant === 'both';
  const showFloating = variant === 'floating' || variant === 'both';

  return (
    <>
      {/* Mobile */}
      <MobileToc
        sections={sections}
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      {/* Desktop Sidebar */}
      {showSidebar && (
        <SidebarToc
          sections={sections}
          activeSection={activeSection}
          onNavigate={handleNavigate}
          progress={progress}
        />
      )}

      {/* Floating (XL only) */}
      {showFloating && (
        <FloatingToc
          sections={sections}
          activeSection={activeSection}
          onNavigate={handleNavigate}
          visible={hasScrolled}
        />
      )}
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
): TocSection[] {
  const sections: TocSection[] = [];

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

  // Constraints & Metrics
  if (reportData.constraints_and_metrics) {
    sections.push({
      id: 'constraints-metrics',
      title: 'Constraints & Metrics',
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
  const strategicIntegration = reportData.strategic_integration as {
    personal_recommendation?: unknown;
  } | undefined;
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
