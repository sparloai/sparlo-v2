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
    <div className="mb-10 border-l-4 border-[--accent-primary] py-1 pl-6 dark:border-[--accent-light]">
      <h2 className="mb-3 text-3xl font-semibold tracking-tight text-[--text-primary]">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-4xl text-lg leading-relaxed font-normal text-[--text-secondary]">
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
        'overflow-hidden rounded-lg border border-[--border-default] bg-[--void-black] shadow-[--elevation-2] transition-shadow hover:shadow-[--elevation-hover]',
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-[--border-subtle] bg-[--void-elevated] p-6">
        {Icon && <Icon className="h-5 w-5 text-[--accent-primary]" />}
        <h3 className="font-mono text-sm font-bold tracking-widest text-[--text-tertiary] uppercase">
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
    <span className="font-mono text-sm font-bold tracking-widest text-[--text-tertiary] uppercase">
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
    <div className="overflow-hidden rounded-lg border border-[--border-default] shadow-[--elevation-1]">
      <table className="w-full text-left">
        <thead className="border-b border-[--border-subtle] bg-[--void-elevated]">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-6 py-4 font-mono text-xs font-bold tracking-wider text-[--text-tertiary] uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[--border-subtle] bg-[--void-black]">{children}</tbody>
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
    <div className="relative overflow-hidden rounded-lg border border-[--border-strong] bg-[--void-deep] p-8 text-[--text-primary] shadow-[--elevation-3] sm:p-10">
      <h4 className="mb-4 font-mono text-xs font-bold tracking-widest text-[--accent-light] uppercase">
        {label}
      </h4>
      {children}
    </div>
  );
}

export type AuraBadgeVariant = 'success' | 'warning' | 'info' | 'neutral';

const AURA_BADGE_VARIANTS: Record<AuraBadgeVariant, string> = {
  success: 'bg-[--go-bg] text-[--go-text] border-[--go-border]',
  warning: 'bg-[--warning-bg] text-[--warning-text] border-[--warning-border]',
  info: 'bg-[--accent-subtle] text-[--accent-primary] border-[--accent-muted]',
  neutral: 'bg-[--void-surface] text-[--text-secondary] border-[--border-default]',
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
        'rounded-[--radius-sm] border px-2.5 py-1 font-mono text-xs font-medium tracking-widest uppercase',
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
      <div className="flex h-8 w-8 items-center justify-center rounded-[--radius-sm] bg-[--accent-primary] font-mono text-sm font-medium text-white shadow-[--glow-violet]">
        {String(index).padStart(2, '0')}
      </div>
      <h2 className="text-3xl font-semibold tracking-tight text-[--text-primary]">
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
    <div className="mb-8 rounded-lg border border-[--border-default] bg-[--void-elevated] p-4 md:p-6">
      <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs md:text-sm">
        {items.map((item, idx) => (
          <div key={item.label} className="flex items-center gap-2">
            {idx > 0 && (
              <div className="mr-6 hidden h-4 w-px bg-[--border-strong] md:block" />
            )}
            <span className="tracking-wider text-[--text-muted] uppercase">
              {item.label}:
            </span>
            <span className="font-semibold text-[--text-primary]">{item.value}</span>
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
    <div className="relative overflow-hidden rounded-lg bg-[--void-deep] p-6 text-[--text-primary] shadow-[--elevation-3] md:p-8">
      <h3 className="mb-4 font-mono text-xs font-bold tracking-widest text-[--accent-light] uppercase">
        Viability Assessment
      </h3>
      <p className="mb-4 text-lg font-medium">{headline}</p>
      {description && (
        <p className="mb-6 max-w-3xl text-base leading-relaxed text-[--text-secondary]">
          {description}
        </p>
      )}
      {(revisitTimeframe || alternativeStrategy) && (
        <div className="grid gap-6 border-t border-[--border-strong] pt-6 text-base md:grid-cols-2">
          {revisitTimeframe && (
            <div>
              <strong className="mb-1 block text-[--text-primary]">
                Revisit in {revisitTimeframe}
              </strong>
              {revisitReason && (
                <span className="text-[--text-secondary]">{revisitReason}</span>
              )}
            </div>
          )}
          {alternativeStrategy && (
            <div>
              <strong className="mb-1 block text-[--text-primary]">
                Alternative Strategy
              </strong>
              <span className="text-[--text-secondary]">{alternativeStrategy}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
