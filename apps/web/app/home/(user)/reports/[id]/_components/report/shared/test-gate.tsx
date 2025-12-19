import type { TestGate as TestGateType } from '../../../_lib/schema/sparlo-report.schema';

interface TestGateProps {
  gate: TestGateType;
}

export function TestGate({ gate }: TestGateProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-500">
          {gate.gate_id}
        </span>
        <span className="text-xs font-semibold text-zinc-900">
          {gate.effort}: {gate.name}
        </span>
      </div>
      <p className="ml-1 border-l-2 border-zinc-200 pl-2 text-xs text-zinc-600">
        {gate.method}
      </p>
      <div className="flex flex-col gap-1 pl-3">
        <div className="text-[10px]">
          <span className="font-semibold text-emerald-600">GO:</span>{' '}
          <span className="text-zinc-600">{gate.go_criteria}</span>
        </div>
        <div className="text-[10px]">
          <span className="font-semibold text-red-600">NO-GO:</span>{' '}
          <span className="text-zinc-600">{gate.no_go_criteria}</span>
        </div>
      </div>
    </div>
  );
}
