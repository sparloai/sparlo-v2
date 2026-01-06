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
    <aside className="hidden overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-5 md:block">
      {/* Contents */}
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        Contents
      </p>
      <nav className="mb-6 space-y-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className={`
              w-full rounded-md px-3 py-2 text-left text-[13px] transition-all
              ${
                activeSection === section.id
                  ? 'bg-white font-medium text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:bg-white/50 hover:text-zinc-900'
              }
            `}
          >
            {section.title}
          </button>
        ))}
      </nav>

      {/* Report Stats */}
      <div className="border-t border-zinc-200 pt-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          Report
        </p>
        <div className="space-y-1.5 text-[12px] text-zinc-500">
          <p>{report.pages} pages</p>
          <p>{report.patents} patents cited</p>
          <p>{report.papers} papers reviewed</p>
          <p>{report.readTime} read</p>
        </div>
      </div>
    </aside>
  );
}
