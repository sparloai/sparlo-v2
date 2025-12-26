import type { TestGate as TestGateType } from '../../../_lib/schema/sparlo-report.schema';

interface TestGateProps {
  gate: TestGateType;
}

export function TestGate({ gate }: TestGateProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {gate.gate_id}
        </span>
        <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
          {gate.effort}: {gate.name}
        </span>
      </div>
      <p className="ml-1 border-l-2 border-zinc-200 pl-3 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        {gate.method}
      </p>
      <div className="ml-4 flex flex-col gap-1.5 text-[11px]">
        <div className="flex items-start gap-2">
          <span className="font-medium text-zinc-500 dark:text-zinc-400">Go →</span>
          <span className="text-zinc-600 dark:text-zinc-300">{gate.go_criteria}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-medium text-zinc-500 dark:text-zinc-400">No-go →</span>
          <span className="text-zinc-600 dark:text-zinc-300">{gate.no_go_criteria}</span>
        </div>
      </div>
    </div>
  );
}
