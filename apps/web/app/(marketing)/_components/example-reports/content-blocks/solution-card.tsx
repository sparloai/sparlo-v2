'use client';

import { useState } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@kit/ui/utils';

interface SolutionCardProps {
  title: string;
  type: 'CATALOG' | 'FALLBACK' | 'COMPLEMENTARY' | 'PARADIGM';
  confidence: number;
  investment?: string;
  timeline?: string;
  summary: string;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

const typeLabels = {
  CATALOG: 'Catalog',
  FALLBACK: 'Fallback',
  COMPLEMENTARY: 'Complementary',
  PARADIGM: 'Paradigm',
};

export function SolutionCard({
  title,
  type,
  confidence,
  investment,
  timeline,
  summary,
  children,
  defaultExpanded = false,
  className,
}: SolutionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50',
        className,
      )}
    >
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h4 className="text-[15px] font-semibold leading-snug text-zinc-900">
            {title}
          </h4>
          <span className="shrink-0 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
            {confidence}%
          </span>
        </div>

        <p className="mb-3 text-[12px] text-zinc-500">
          {typeLabels[type]} {type === 'CATALOG' && '· Primary Recommendation'}
        </p>

        <p className="text-[13px] leading-relaxed text-zinc-600">{summary}</p>

        {(investment || timeline) && (
          <div className="mt-3 flex gap-4 text-[12px] text-zinc-500">
            {investment && <span>Investment: {investment}</span>}
            {timeline && <span>Timeline: {timeline}</span>}
          </div>
        )}
      </div>

      {children && (
        <>
          {expanded && (
            <div className="border-t border-zinc-200 px-5 pb-5 pt-3">
              {children}
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-center gap-1 border-t border-zinc-200 px-5 py-3 text-[13px] text-blue-600 transition-colors hover:bg-zinc-100"
          >
            {expanded ? 'Show less' : 'Show details'}
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </>
      )}
    </div>
  );
}
