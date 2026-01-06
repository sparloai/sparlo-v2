import type { ExampleReport } from './data/types';

interface ReportCardProps {
  report: ExampleReport;
  isActive: boolean;
  onClick: () => void;
}

export function ReportCard({ report, isActive, onClick }: ReportCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        group w-[280px] shrink-0 border-l-2 py-4 pl-6 pr-4 text-left transition-all
        ${
          isActive
            ? 'border-l-zinc-900 bg-zinc-50'
            : 'border-l-zinc-200 hover:border-l-zinc-400 hover:bg-zinc-50/50'
        }
      `}
    >
      {/* Category label */}
      <span
        className={`text-[13px] font-semibold uppercase tracking-[0.06em] ${
          isActive ? 'text-zinc-900' : 'text-zinc-400'
        }`}
      >
        {report.category}
      </span>

      {/* Title */}
      <p
        className={`mt-2 text-[18px] font-medium leading-[1.3] tracking-[-0.02em] ${
          isActive ? 'text-zinc-900' : 'text-zinc-700'
        }`}
      >
        {report.title}
      </p>

      {/* Subtitle */}
      <p className="mt-1 text-[15px] leading-[1.4] tracking-[-0.02em] text-zinc-500">
        {report.subtitle}
      </p>

      {/* Metadata */}
      <div className="mt-4 flex items-center gap-2 text-[13px] tracking-[-0.02em] text-zinc-400">
        <span>{report.pages} pages</span>
        <span className="text-zinc-300">·</span>
        <span>{report.patents} patents</span>
        <span className="text-zinc-300">·</span>
        <span>{report.papers} papers</span>
      </div>
    </button>
  );
}
