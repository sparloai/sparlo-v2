interface TestGateProps {
  gate: {
    name: string;
    what_it_tests: string;
    method: string;
    go_criteria: string;
    no_go_criteria: string;
    effort: string;
  };
  gateNumber: number;
}

export function TestGate({ gate, gateNumber }: TestGateProps) {
  return (
    <div className="rounded-xl border border-[--border-default] bg-[--surface-elevated] p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[--accent-muted] text-sm font-semibold text-[--accent]">
            {gateNumber}
          </span>
          <h4 className="text-base font-semibold text-[--text-primary]">
            {gate.name}
          </h4>
        </div>
        <span className="rounded-full bg-[--surface-overlay] px-3 py-1 text-xs font-medium text-[--text-muted]">
          {gate.effort}
        </span>
      </div>

      {/* What it tests */}
      <p className="mb-4 text-sm text-[--text-secondary]">
        {gate.what_it_tests}
      </p>

      {/* Method */}
      <div className="mb-4 rounded-lg bg-[--surface-overlay] p-3">
        <p className="text-xs font-medium tracking-wider text-[--text-muted] uppercase">
          Method
        </p>
        <p className="mt-1 text-sm text-[--text-secondary]">{gate.method}</p>
      </div>

      {/* GO / NO-GO columns */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border-l-2 border-[--status-success] bg-[--status-success]/10 p-3">
          <p className="text-xs font-semibold tracking-wider text-[--status-success] uppercase">
            GO if
          </p>
          <p className="mt-1 text-sm text-[--status-success]/90">
            {gate.go_criteria}
          </p>
        </div>
        <div className="rounded-lg border-l-2 border-[--status-error] bg-[--status-error]/10 p-3">
          <p className="text-xs font-semibold tracking-wider text-[--status-error] uppercase">
            NO-GO if
          </p>
          <p className="mt-1 text-sm text-[--status-error]/90">
            {gate.no_go_criteria}
          </p>
        </div>
      </div>
    </div>
  );
}
