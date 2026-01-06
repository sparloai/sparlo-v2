import type { ExampleReport, ReportSection } from './data/types';

interface ReportSidebarProps {
  report: ExampleReport;
  sections: ReportSection[];
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

export function ReportSidebar({
  report,
  sections,
  activeSection,
  onSectionClick,
}: ReportSidebarProps) {
  return (
    <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50/50 p-6 md:block">
      {/* Contents label */}
      <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
        Contents
      </p>

      {/* Navigation */}
      <nav className="mb-8">
        <ul className="space-y-1 border-l border-zinc-200 pl-4">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => onSectionClick(section.id)}
                className={`relative block min-h-[36px] w-full py-2 text-left text-[15px] leading-[1.4] tracking-[-0.02em] transition-colors ${
                  activeSection === section.id
                    ? 'font-medium text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {/* Active indicator */}
                {activeSection === section.id && (
                  <span className="absolute -left-4 top-1/2 h-4 w-0.5 -translate-y-1/2 bg-zinc-900" />
                )}
                {section.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Report Stats */}
      <div className="border-t border-zinc-200 pt-6">
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
          Report
        </p>
        <div className="space-y-2 text-[13px] tracking-[-0.02em] text-zinc-500">
          <p>{report.pages} pages</p>
          <p>{report.patents} patents cited</p>
          <p>{report.papers} papers reviewed</p>
          <p>{report.readTime} read</p>
        </div>
      </div>
    </aside>
  );
}
