import type { Constraints as ConstraintsType } from '../../../_lib/schema/sparlo-report.schema';
import { SectionHeader } from '../shared/section-header';

interface ConstraintsProps {
  data: ConstraintsType;
}

/**
 * Renders text with highlighted terms as React elements (XSS-safe).
 * Highlighted terms get bold styling, technical values get mono styling.
 */
function ConstraintText({
  text,
  technicalValues,
}: {
  text: string;
  highlightedTerms?: string[];
  technicalValues?: string[];
}) {
  return (
    <>
      <span>{text}</span>
      {technicalValues && technicalValues.length > 0 && (
        <span className="ml-2 inline-flex gap-1">
          {technicalValues.map((value, i) => (
            <code
              key={i}
              className="rounded bg-zinc-100 px-1.5 py-1 font-mono text-base text-zinc-700"
            >
              {value}
            </code>
          ))}
        </span>
      )}
    </>
  );
}

export function Constraints({ data }: ConstraintsProps) {
  return (
    <section id="constraints" className="space-y-8">
      <SectionHeader
        id="constraints-header"
        title="Constraints & Assumptions"
      />

      <div className="grid gap-12 md:grid-cols-2">
        {/* From Input */}
        <div>
          <div className="mb-6 flex items-center gap-2">
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
              className="text-zinc-500"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h3 className="text-base font-semibold tracking-wider text-zinc-600 uppercase">
              From Your Input
            </h3>
          </div>
          <ul className="space-y-4">
            {data.from_input.map((item, index) => (
              <li
                key={index}
                className="group flex gap-3 text-lg leading-relaxed text-zinc-700"
              >
                <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-zinc-300 transition-colors group-hover:bg-zinc-900" />
                <span>
                  <ConstraintText
                    text={item.constraint}
                    highlightedTerms={item.highlighted_terms}
                    technicalValues={item.technical_values}
                  />
                  {item.note && (
                    <span className="text-zinc-500 italic"> — {item.note}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Assumptions */}
        <div className="rounded-lg border border-zinc-100/50 bg-zinc-50/80 p-6">
          <div className="mb-6 flex items-center gap-2">
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
              className="text-orange-500"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h3 className="text-base font-semibold tracking-wider text-orange-700 uppercase">
              Assumptions Made
            </h3>
          </div>
          <ul className="space-y-4">
            {data.assumptions.map((item, index) => (
              <li
                key={index}
                className="flex gap-3 text-lg leading-relaxed text-zinc-700"
              >
                <div className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-orange-400" />
                <ConstraintText
                  text={item.assumption}
                  technicalValues={item.technical_values}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
