import type { ExampleReport } from './data/types';

interface ReportCardProps {
  report: ExampleReport;
  isActive: boolean;
  onClick: () => void;
}

const categoryColors = {
  emerald: 'text-emerald-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  amber: 'text-amber-600',
  rose: 'text-rose-600',
};

export function ReportCard({ report, isActive, onClick }: ReportCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-[200px] shrink-0 rounded-xl border p-5 text-left transition-all
        ${
          isActive
            ? 'border-blue-500 bg-white shadow-sm'
            : 'border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-sm'
        }
      `}
    >
      <p
        className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${categoryColors[report.categoryColor]}`}
      >
        {report.category}
      </p>
      <p className="mb-1 text-[14px] font-semibold leading-snug text-zinc-900">
        {report.title}
      </p>
      <p className="mb-3 line-clamp-1 text-[12px] text-zinc-500">
        {report.subtitle}
      </p>
      <p className="text-[11px] text-zinc-400">
        {report.pages} pages · {report.patents} patents
      </p>

      {isActive && <div className="mt-4 h-0.5 rounded-full bg-blue-500" />}
    </button>
  );
}
