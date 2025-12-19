import type { Brief as BriefType } from '../../../_lib/schema/sparlo-report.schema';

interface BriefProps {
  data: BriefType;
}

export function Brief({ data }: BriefProps) {
  return (
    <section
      id="brief"
      className="bg-zinc-50 rounded-lg border border-zinc-100 p-6 md:p-8"
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-zinc-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" x2="20" y1="19" y2="19" />
            </svg>
            <h3 className="text-sm font-semibold tracking-tight">Brief</h3>
          </div>
        </div>

        <p className="text-sm leading-7 text-zinc-700 font-medium">
          {data.original_problem}
        </p>

        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded text-xs font-medium border border-zinc-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
