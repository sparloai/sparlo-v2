'use client';

import { REPORT_MODE_LABELS, type ReportMode } from '../../_lib/types';

interface ModeLabelProps {
  mode: ReportMode;
}

export function ModeLabel({ mode }: ModeLabelProps) {
  return (
    <span
      className="font-mono text-[10px] tracking-wider text-[--text-muted] uppercase"
      style={{ fontFamily: "'Suisse Mono', 'SF Mono', ui-monospace, monospace" }}
    >
      [{REPORT_MODE_LABELS[mode]}]
    </span>
  );
}
