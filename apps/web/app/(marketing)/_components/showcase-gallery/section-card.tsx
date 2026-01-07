'use client';

import { memo } from 'react';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@kit/ui/accordion';
import { cn } from '@kit/ui/utils';

import type { SectionId, CardState, SectionMetric } from './types';

interface SectionCardProps {
  id: SectionId;
  title: string;
  headline: string;
  metrics: SectionMetric[];
  cardState: CardState;
  children: React.ReactNode;
}

/**
 * Section Card Component
 *
 * Individual card in the showcase gallery with:
 * - Title and headline preview
 * - Key metrics display
 * - Expandable content area
 * - Accessible accordion pattern via Radix
 */
export const SectionCard = memo(function SectionCard({
  id,
  title,
  headline,
  metrics,
  children,
}: SectionCardProps) {
  return (
    <AccordionItem
      value={id}
      className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
    >
      <AccordionTrigger
        className={cn(
          'w-full px-6 py-5 text-left',
          'flex items-start justify-between gap-4',
          'transition-colors duration-200',
          'hover:bg-zinc-50/50 hover:no-underline',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900',
        )}
      >
        <div className="min-w-0 flex-1 text-left">
          {/* Section Title */}
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-zinc-500">
            {title}
          </span>

          {/* Headline Preview */}
          <p className="mt-1.5 line-clamp-2 text-[15px] leading-snug text-zinc-900">
            {headline}
          </p>

          {/* Depth Indicators / Metrics */}
          {metrics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {metrics.map((metric, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500"
                >
                  <span className="font-medium text-zinc-700">
                    {metric.value}
                  </span>
                  {metric.label && <span>{metric.label}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent className="border-t border-zinc-100 px-6 pb-6 pt-4">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
});
