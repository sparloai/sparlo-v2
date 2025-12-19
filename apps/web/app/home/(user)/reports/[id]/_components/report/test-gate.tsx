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
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
            {gateNumber}
          </span>
          <h4 className="text-base font-semibold text-gray-900">{gate.name}</h4>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {gate.effort}
        </span>
      </div>

      {/* What it tests */}
      <p className="mb-4 text-sm text-gray-600">{gate.what_it_tests}</p>

      {/* Method */}
      <div className="mb-4 rounded-lg bg-gray-50 p-3">
        <p className="text-xs font-medium tracking-wider text-gray-500 uppercase">
          Method
        </p>
        <p className="mt-1 text-sm text-gray-700">{gate.method}</p>
      </div>

      {/* GO / NO-GO columns */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border-l-2 border-emerald-500 bg-emerald-50 p-3">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
            GO if
          </p>
          <p className="mt-1 text-sm text-emerald-800">{gate.go_criteria}</p>
        </div>
        <div className="rounded-lg border-l-2 border-red-500 bg-red-50 p-3">
          <p className="text-xs font-semibold tracking-wider text-red-700 uppercase">
            NO-GO if
          </p>
          <p className="mt-1 text-sm text-red-800">{gate.no_go_criteria}</p>
        </div>
      </div>
    </div>
  );
}
