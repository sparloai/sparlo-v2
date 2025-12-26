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
    <div
      className="mb-10 border-l-4 py-1 pl-6"
      style={{ borderColor: 'var(--accent-primary, #7c3aed)' }}
    >
      <h2
        className="mb-3 text-3xl font-semibold tracking-tight"
        style={{ color: 'var(--text-primary, #09090b)' }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="max-w-4xl text-lg leading-relaxed font-normal"
          style={{ color: 'var(--text-secondary, #52525b)' }}
        >
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
        'overflow-hidden rounded-lg border transition-shadow',
        className,
      )}
      style={{
        borderColor: 'var(--border-default, rgba(0,0,0,0.1))',
        backgroundColor: 'var(--void-black, #ffffff)',
        boxShadow: 'var(--elevation-2, 0 2px 4px rgba(0,0,0,0.06))',
      }}
    >
      <div
        className="flex items-center gap-3 border-b p-6"
        style={{
          borderColor: 'var(--border-subtle, rgba(0,0,0,0.06))',
          backgroundColor: 'var(--void-elevated, #f5f5f5)',
        }}
      >
        {Icon && (
          <span style={{ color: 'var(--accent-primary, #7c3aed)' }}>
            <Icon className="h-5 w-5" />
          </span>
        )}
        <h3
          className="font-mono text-sm font-bold tracking-widest uppercase"
          style={{ color: 'var(--text-tertiary, rgba(0,0,0,0.55))' }}
        >
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
    <span
      className="font-mono text-sm font-bold tracking-widest uppercase"
      style={{ color: 'var(--text-tertiary, rgba(0,0,0,0.55))' }}
    >
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
    <div
      className="overflow-hidden rounded-lg border"
      style={{
        borderColor: 'var(--border-default, rgba(0,0,0,0.1))',
        boxShadow: 'var(--elevation-1, 0 1px 2px rgba(0,0,0,0.05))',
      }}
    >
      <table className="w-full text-left">
        <thead
          className="border-b"
          style={{
            borderColor: 'var(--border-subtle, rgba(0,0,0,0.06))',
            backgroundColor: 'var(--void-elevated, #f5f5f5)',
          }}
        >
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-6 py-4 font-mono text-xs font-bold tracking-wider uppercase"
                style={{ color: 'var(--text-tertiary, rgba(0,0,0,0.55))' }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          className="divide-y"
          style={{
            backgroundColor: 'var(--void-black, #ffffff)',
          }}
        >
          {children}
        </tbody>
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
    <div
      className="relative overflow-hidden rounded-lg border p-8 sm:p-10"
      style={{
        borderColor: 'rgba(63, 63, 70, 0.5)',
        backgroundColor: '#18181b',
        color: '#fafafa',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <h4
        className="mb-4 font-mono text-xs font-bold tracking-widest uppercase"
        style={{ color: '#a78bfa' }}
      >
        {label}
      </h4>
      {children}
    </div>
  );
}

export type AuraBadgeVariant = 'success' | 'warning' | 'info' | 'neutral';

const AURA_BADGE_STYLES: Record<AuraBadgeVariant, React.CSSProperties> = {
  success: {
    backgroundColor: 'var(--go-bg, rgba(34,197,94,0.1))',
    color: 'var(--go-text, #16a34a)',
    borderColor: 'var(--go-border, rgba(34,197,94,0.3))',
  },
  warning: {
    backgroundColor: 'var(--warning-bg, rgba(234,179,8,0.1))',
    color: 'var(--warning-text, #ca8a04)',
    borderColor: 'var(--warning-border, rgba(234,179,8,0.3))',
  },
  info: {
    backgroundColor: 'var(--accent-subtle, rgba(124,58,237,0.05))',
    color: 'var(--accent-primary, #7c3aed)',
    borderColor: 'var(--accent-muted, rgba(124,58,237,0.1))',
  },
  neutral: {
    backgroundColor: 'var(--void-surface, #ebebeb)',
    color: 'var(--text-secondary, rgba(0,0,0,0.7))',
    borderColor: 'var(--border-default, rgba(0,0,0,0.1))',
  },
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
      className="rounded border px-2.5 py-1 font-mono text-xs font-medium tracking-widest uppercase"
      style={AURA_BADGE_STYLES[variant]}
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
      <div
        className="flex h-8 w-8 items-center justify-center rounded font-mono text-sm font-medium text-white"
        style={{
          backgroundColor: 'var(--accent-primary, #7c3aed)',
          boxShadow: 'var(--glow-violet, 0 2px 8px rgba(124,58,237,0.15))',
        }}
      >
        {String(index).padStart(2, '0')}
      </div>
      <h2
        className="text-3xl font-semibold tracking-tight"
        style={{ color: 'var(--text-primary, #09090b)' }}
      >
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
    <div
      className="mb-8 rounded-lg border p-4 md:p-6"
      style={{
        borderColor: 'var(--border-default, rgba(0,0,0,0.1))',
        backgroundColor: 'var(--void-elevated, #f5f5f5)',
      }}
    >
      <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs md:text-sm">
        {items.map((item, idx) => (
          <div key={item.label} className="flex items-center gap-2">
            {idx > 0 && (
              <div
                className="mr-6 hidden h-4 w-px md:block"
                style={{
                  backgroundColor: 'var(--border-strong, rgba(0,0,0,0.15))',
                }}
              />
            )}
            <span
              className="tracking-wider uppercase"
              style={{ color: 'var(--text-muted, rgba(0,0,0,0.4))' }}
            >
              {item.label}:
            </span>
            <span
              className="font-semibold"
              style={{ color: 'var(--text-primary, #09090b)' }}
            >
              {item.value}
            </span>
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
    <div
      className="relative overflow-hidden rounded-lg p-6 md:p-8"
      style={{
        backgroundColor: 'var(--void-deep, #fafafa)',
        color: 'var(--text-primary, #09090b)',
        boxShadow: 'var(--elevation-3, 0 4px 8px rgba(0,0,0,0.08))',
      }}
    >
      <h3
        className="mb-4 font-mono text-xs font-bold tracking-widest uppercase"
        style={{ color: 'var(--accent-light, #8b5cf6)' }}
      >
        Viability Assessment
      </h3>
      <p className="mb-4 text-lg font-medium">{headline}</p>
      {description && (
        <p
          className="mb-6 max-w-3xl text-base leading-relaxed"
          style={{ color: 'var(--text-secondary, rgba(0,0,0,0.7))' }}
        >
          {description}
        </p>
      )}
      {(revisitTimeframe || alternativeStrategy) && (
        <div
          className="grid gap-6 border-t pt-6 text-base md:grid-cols-2"
          style={{ borderColor: 'var(--border-strong, rgba(0,0,0,0.15))' }}
        >
          {revisitTimeframe && (
            <div>
              <strong
                className="mb-1 block"
                style={{ color: 'var(--text-primary, #09090b)' }}
              >
                Revisit in {revisitTimeframe}
              </strong>
              {revisitReason && (
                <span
                  style={{ color: 'var(--text-secondary, rgba(0,0,0,0.7))' }}
                >
                  {revisitReason}
                </span>
              )}
            </div>
          )}
          {alternativeStrategy && (
            <div>
              <strong
                className="mb-1 block"
                style={{ color: 'var(--text-primary, #09090b)' }}
              >
                Alternative Strategy
              </strong>
              <span style={{ color: 'var(--text-secondary, rgba(0,0,0,0.7))' }}>
                {alternativeStrategy}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
