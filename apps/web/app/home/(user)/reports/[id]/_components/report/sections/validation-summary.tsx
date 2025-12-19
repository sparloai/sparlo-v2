import type { ValidationSummary as ValidationSummaryType } from '../../../_lib/schema/sparlo-report.schema';

import { ConfidenceBadge } from '../shared/badges';
import { SectionHeader } from '../shared/section-header';

interface ValidationSummaryProps {
  data: ValidationSummaryType;
}

export function ValidationSummary({ data }: ValidationSummaryProps) {
  return (
    <section id="validation-summary" className="space-y-8">
      <SectionHeader
        id="validation-summary-header"
        title="Validation Summary"
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Failure Modes */}
        <div className="space-y-4">
          <h3 className="uppercase text-xs font-semibold text-zinc-500 tracking-wider">
            Failure Modes Checked
          </h3>
          <div className="space-y-3">
            {data.failure_modes_checked.map((item, index) => (
              <div key={index} className="p-3 bg-zinc-50 rounded-lg space-y-1">
                <p className="text-sm font-medium text-zinc-800">{item.mode}</p>
                <p className="text-xs text-zinc-500">{item.how_addressed}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Parameter Bounds */}
        <div className="space-y-4">
          <h3 className="uppercase text-xs font-semibold text-zinc-500 tracking-wider">
            Parameter Bounds Validated
          </h3>
          <div className="space-y-3">
            {data.parameter_bounds_validated.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
              >
                <span className="text-sm text-zinc-700">{item.bound}</span>
                {item.value && (
                  <code className="text-xs font-mono text-zinc-500 bg-white px-2 py-0.5 rounded">
                    {item.value}
                  </code>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Literature Precedent */}
        <div className="space-y-4">
          <h3 className="uppercase text-xs font-semibold text-zinc-500 tracking-wider">
            Literature Precedent
          </h3>
          <div className="space-y-3">
            {data.literature_precedent.map((item, index) => (
              <div key={index} className="p-3 bg-zinc-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-800">
                    {item.approach}
                  </span>
                  <ConfidenceBadge level={item.precedent_level} />
                </div>
                {item.source && (
                  <p className="text-xs text-zinc-500">{item.source}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
