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
              className="font-mono text-xs bg-zinc-100 px-1 py-0.5 rounded text-zinc-700"
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
      <SectionHeader id="constraints-header" title="Constraints & Assumptions" />

      <div className="grid md:grid-cols-2 gap-12">
        {/* From Input */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-zinc-400"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              From Your Input
            </h3>
          </div>
          <ul className="space-y-3">
            {data.from_input.map((item, index) => (
              <li
                key={index}
                className="flex gap-3 text-sm text-zinc-600 leading-relaxed group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 mt-2 shrink-0 group-hover:bg-zinc-900 transition-colors" />
                <span>
                  <ConstraintText
                    text={item.constraint}
                    highlightedTerms={item.highlighted_terms}
                    technicalValues={item.technical_values}
                  />
                  {item.note && (
                    <span className="italic text-zinc-400"> — {item.note}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Assumptions */}
        <div className="bg-zinc-50/80 border-zinc-100/50 border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-orange-400"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h3 className="text-xs font-semibold text-orange-600/80 uppercase tracking-wider">
              Assumptions Made
            </h3>
          </div>
          <ul className="space-y-3">
            {data.assumptions.map((item, index) => (
              <li
                key={index}
                className="flex gap-3 text-sm text-zinc-600 leading-relaxed"
              >
                <div className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-orange-300" />
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
