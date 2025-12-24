import * as React from 'react';
import { memo } from 'react';

import { cn } from '../lib/utils';

// ============================================
// Aura Design System Components
// ============================================

export const SectionHeader = memo(function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10 border-l-4 border-zinc-950 py-1 pl-6">
      <h2 className="mb-3 text-3xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-4xl text-lg leading-relaxed font-normal text-zinc-600">
          {subtitle}
        </p>
      )}
    </div>
  );
});

export function CardWithHeader({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm',
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-50/50 p-6">
        {Icon && <Icon className="h-5 w-5 text-zinc-950" />}
        <h3 className="font-mono text-base font-bold tracking-widest text-zinc-600 uppercase">
          {label}
        </h3>
      </div>
      <div className="p-8 sm:p-10">{children}</div>
    </section>
  );
}

export const MonoLabel = memo(function MonoLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="font-mono text-base font-bold tracking-widest text-zinc-600 uppercase">
      {children}
    </span>
  );
});

export function AuraTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
      <table className="w-full text-left">
        <thead className="border-b border-zinc-200 bg-zinc-50/50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-6 py-4 font-mono text-base font-bold tracking-wider text-zinc-600 uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white">{children}</tbody>
      </table>
    </div>
  );
}

export function DarkSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-white shadow-lg sm:p-10">
      <h4 className="mb-4 font-mono text-base font-bold tracking-widest text-zinc-100 uppercase">
        {label}
      </h4>
      {children}
    </div>
  );
}

export type AuraBadgeVariant = 'success' | 'warning' | 'info' | 'neutral';

const AURA_BADGE_VARIANTS: Record<AuraBadgeVariant, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

export const AuraBadge = memo(function AuraBadge({
  children,
  variant = 'neutral',
}: {
  children: React.ReactNode;
  variant?: AuraBadgeVariant;
}) {
  return (
    <span
      className={cn(
        'rounded border px-2.5 py-1 font-mono text-xs font-medium tracking-widest uppercase',
        AURA_BADGE_VARIANTS[variant],
      )}
    >
      {children}
    </span>
  );
});

export const NumberedHeader = memo(function NumberedHeader({
  index,
  title,
}: {
  index: number;
  title: string;
}) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-950 font-mono text-sm font-medium text-white">
        {String(index).padStart(2, '0')}
      </div>
      <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
        {title}
      </h2>
    </div>
  );
});

export const MetadataInfoCard = memo(function MetadataInfoCard({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="mb-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4 md:p-6">
      <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs md:text-sm">
        {items.map((item, idx) => (
          <div key={item.label} className="flex items-center gap-2">
            {idx > 0 && (
              <div className="mr-6 hidden h-4 w-px bg-zinc-300 md:block" />
            )}
            <span className="tracking-wider text-zinc-500 uppercase">
              {item.label}:
            </span>
            <span className="font-semibold text-zinc-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export const ViabilityAssessment = memo(function ViabilityAssessment({
  headline,
  description,
  revisitTimeframe,
  revisitReason,
  alternativeStrategy,
}: {
  headline: string;
  description?: string;
  revisitTimeframe?: string;
  revisitReason?: string;
  alternativeStrategy?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-zinc-950 p-6 text-white md:p-8">
      <h3 className="mb-4 font-mono text-base font-bold tracking-widest text-zinc-100 uppercase">
        Viability Assessment
      </h3>
      <p className="mb-4 text-lg font-medium">{headline}</p>
      {description && (
        <p className="mb-6 max-w-3xl text-base leading-relaxed text-zinc-200">
          {description}
        </p>
      )}
      {(revisitTimeframe || alternativeStrategy) && (
        <div className="grid gap-6 border-t border-zinc-800 pt-6 text-base md:grid-cols-2">
          {revisitTimeframe && (
            <div>
              <strong className="mb-1 block text-white">
                Revisit in {revisitTimeframe}
              </strong>
              {revisitReason && (
                <span className="text-zinc-300">{revisitReason}</span>
              )}
            </div>
          )}
          {alternativeStrategy && (
            <div>
              <strong className="mb-1 block text-white">
                Alternative Strategy
              </strong>
              <span className="text-zinc-300">{alternativeStrategy}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
