/**
 * Brand System Primitives
 *
 * Air Company Aesthetic - Technical Monograph, Not AI Tool
 *
 * Typography-driven hierarchy with near-monochrome palette (zinc-50 through zinc-950).
 * Semantic color on TEXT only. No decorative icons.
 *
 * Typography baseline:
 * - Primary body: 18px, #1e1e1e, line-height 1.3, letter-spacing -0.02em
 * - Labels: 13px, uppercase, tracking wide
 * - Headings: font-semibold, tracking-tight
 */

import { cn } from '@kit/ui/utils';
import { memo, type ReactNode } from 'react';

// ============================================
// TYPOGRAPHY PRIMITIVES
// ============================================

interface SectionTitleProps {
  children: ReactNode;
  className?: string;
  size?: 'xl' | 'lg' | 'md';
}

export const SectionTitle = memo(function SectionTitle({
  children,
  className,
  size = 'xl',
}: SectionTitleProps) {
  const sizeClasses = {
    xl: 'text-[36px]',
    lg: 'text-[28px]',
    md: 'text-[24px]',
  };

  return (
    <h1
      className={cn(
        sizeClasses[size],
        'font-semibold tracking-tight text-zinc-900',
        className,
      )}
    >
      {children}
    </h1>
  );
});

interface SectionSubtitleProps {
  children: ReactNode;
  className?: string;
}

export const SectionSubtitle = memo(function SectionSubtitle({
  children,
  className,
}: SectionSubtitleProps) {
  return (
    <p className={cn('mt-2 text-[18px] text-zinc-500', className)}>
      {children}
    </p>
  );
});

interface MonoLabelProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'muted' | 'strong';
}

export const MonoLabel = memo(function MonoLabel({
  children,
  className,
  variant = 'default',
}: MonoLabelProps) {
  const variantClasses = {
    default: 'text-zinc-500',
    muted: 'text-zinc-400',
    strong: 'text-zinc-900',
  };

  return (
    <span
      className={cn(
        'text-[13px] font-semibold uppercase tracking-[0.06em]',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
});

interface BodyTextProps {
  children: ReactNode;
  className?: string;
  size?: 'lg' | 'md' | 'sm';
  variant?: 'primary' | 'secondary' | 'muted';
}

export const BodyText = memo(function BodyText({
  children,
  className,
  size = 'md',
  variant = 'primary',
}: BodyTextProps) {
  const sizeClasses = {
    lg: 'text-[22px]',
    md: 'text-[18px]',
    sm: 'text-[16px]',
  };

  const variantClasses = {
    primary: 'text-[#1e1e1e]',
    secondary: 'text-zinc-600',
    muted: 'text-zinc-500',
  };

  return (
    <p
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        'leading-[1.3] tracking-[-0.02em]',
        className,
      )}
    >
      {children}
    </p>
  );
});

// ============================================
// LAYOUT PRIMITIVES
// ============================================

interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
}

export const Section = memo(function Section({
  id,
  children,
  className,
}: SectionProps) {
  return (
    <section id={id} className={cn('mt-24', className)}>
      {children}
    </section>
  );
});

interface ArticleBlockProps {
  children: ReactNode;
  className?: string;
  variant?: 'bordered' | 'plain';
}

export const ArticleBlock = memo(function ArticleBlock({
  children,
  className,
  variant = 'bordered',
}: ArticleBlockProps) {
  return (
    <article
      className={cn(
        variant === 'bordered' && 'border-l-2 border-zinc-900 pl-10',
        'bg-white',
        className,
      )}
    >
      {children}
    </article>
  );
});

interface ContentBlockProps {
  children: ReactNode;
  className?: string;
  withBorder?: boolean;
}

export const ContentBlock = memo(function ContentBlock({
  children,
  className,
  withBorder = false,
}: ContentBlockProps) {
  return (
    <div
      className={cn(
        withBorder && 'mt-12 border-t border-zinc-200 pt-8',
        className,
      )}
    >
      {children}
    </div>
  );
});

// ============================================
// ACCENT ELEMENTS
// ============================================

interface AccentBorderProps {
  children: ReactNode;
  className?: string;
  weight?: 'light' | 'medium' | 'heavy';
}

export const AccentBorder = memo(function AccentBorder({
  children,
  className,
  weight = 'medium',
}: AccentBorderProps) {
  const weightClasses = {
    light: 'border-l-2 border-zinc-200',
    medium: 'border-l-2 border-zinc-300',
    heavy: 'border-l-4 border-zinc-900',
  };

  return (
    <div className={cn(weightClasses[weight], 'pl-6', className)}>
      {children}
    </div>
  );
});

interface HighlightBoxProps {
  children: ReactNode;
  className?: string;
  variant?: 'subtle' | 'strong';
}

export const HighlightBox = memo(function HighlightBox({
  children,
  className,
  variant = 'subtle',
}: HighlightBoxProps) {
  return (
    <div
      className={cn(
        'rounded-none border p-8',
        variant === 'subtle'
          ? 'border-zinc-200 bg-zinc-50'
          : 'border-zinc-900 bg-zinc-900 text-white',
        className,
      )}
    >
      {children}
    </div>
  );
});

// ============================================
// SEMANTIC SEVERITY (Typography-based, no colors)
// ============================================

interface SeverityIndicatorProps {
  severity: 'high' | 'medium' | 'low';
  className?: string;
}

export const SeverityIndicator = memo(function SeverityIndicator({
  severity,
  className,
}: SeverityIndicatorProps) {
  const severityClasses = {
    high: 'text-zinc-700 font-medium',
    medium: 'text-zinc-500',
    low: 'text-zinc-400',
  };

  const label = severity.charAt(0).toUpperCase() + severity.slice(1);

  return (
    <span className={cn('text-[13px]', severityClasses[severity], className)}>
      {label} severity
    </span>
  );
});

// ============================================
// LIST PRIMITIVES
// ============================================

interface ConstraintListProps {
  items: string[];
  variant: 'hard' | 'soft' | 'assumption';
  className?: string;
}

export const ConstraintList = memo(function ConstraintList({
  items,
  variant,
  className,
}: ConstraintListProps) {
  if (!items || items.length === 0) return null;

  const variantStyles = {
    hard: {
      label: 'Hard Constraints',
      labelClass: 'text-zinc-900',
      bulletClass: 'text-zinc-900',
    },
    soft: {
      label: 'Soft Constraints',
      labelClass: 'text-zinc-600',
      bulletClass: 'text-zinc-400',
    },
    assumption: {
      label: 'Assumptions',
      labelClass: 'text-zinc-500',
      bulletClass: 'text-zinc-300',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className={className}>
      <span
        className={cn(
          'text-[13px] font-medium uppercase tracking-[0.08em]',
          style.labelClass,
        )}
      >
        {style.label}
      </span>
      <ul className="mt-4 space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span
              className={cn(
                'mt-2 h-1 w-1 flex-shrink-0 rounded-full',
                variant === 'hard' && 'bg-zinc-900',
                variant === 'soft' && 'bg-zinc-400',
                variant === 'assumption' && 'bg-zinc-300',
              )}
            />
            <span className="text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});

// ============================================
// NUMBERED ITEMS
// ============================================

interface NumberedItemProps {
  index: number;
  children: ReactNode;
  className?: string;
}

export const NumberedItem = memo(function NumberedItem({
  index,
  children,
  className,
}: NumberedItemProps) {
  return (
    <div className={cn('flex items-start gap-6', className)}>
      <span className="text-[32px] font-semibold leading-none text-zinc-200">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
});

// ============================================
// METADATA GRID
// ============================================

interface MetadataItem {
  label: string;
  value: string | number;
}

interface MetadataGridProps {
  items: MetadataItem[];
  className?: string;
}

export const MetadataGrid = memo(function MetadataGrid({
  items,
  className,
}: MetadataGridProps) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-4 text-[13px] text-zinc-500',
        className,
      )}
    >
      {items.map((item, idx) => (
        <span key={item.label}>
          {idx > 0 && <span className="mr-4 text-zinc-300">·</span>}
          {item.label}: {item.value}
        </span>
      ))}
    </div>
  );
});

// ============================================
// GRACEFUL FALLBACKS FOR UNKNOWN FIELDS
// ============================================

interface UnknownFieldRendererProps {
  data: unknown;
  label?: string;
  className?: string;
}

/**
 * Gracefully renders unknown/unexpected data from JSON.
 * Handles edge cases where schema has new fields not yet typed.
 */
export const UnknownFieldRenderer = memo(function UnknownFieldRenderer({
  data,
  label,
  className,
}: UnknownFieldRendererProps) {
  if (data === null || data === undefined) return null;

  // String
  if (typeof data === 'string') {
    return (
      <div className={className}>
        {label && <MonoLabel variant="muted">{label}</MonoLabel>}
        <BodyText className="mt-2" variant="secondary">
          {data}
        </BodyText>
      </div>
    );
  }

  // Number
  if (typeof data === 'number') {
    return (
      <div className={className}>
        {label && <MonoLabel variant="muted">{label}</MonoLabel>}
        <BodyText className="mt-2" variant="secondary">
          {String(data)}
        </BodyText>
      </div>
    );
  }

  // Boolean
  if (typeof data === 'boolean') {
    return (
      <div className={className}>
        {label && <MonoLabel variant="muted">{label}</MonoLabel>}
        <BodyText className="mt-2" variant="secondary">
          {data ? 'Yes' : 'No'}
        </BodyText>
      </div>
    );
  }

  // Array
  if (Array.isArray(data)) {
    if (data.length === 0) return null;

    // Array of strings
    if (data.every((item) => typeof item === 'string')) {
      return (
        <div className={className}>
          {label && <MonoLabel variant="muted">{label}</MonoLabel>}
          <ul className="mt-3 space-y-2">
            {data.map((item, idx) => (
              <li
                key={idx}
                className="text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-600"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // Array of objects - render each recursively
    return (
      <div className={className}>
        {label && <MonoLabel variant="muted">{label}</MonoLabel>}
        <div className="mt-4 space-y-6">
          {data.map((item, idx) => (
            <UnknownFieldRenderer key={idx} data={item} />
          ))}
        </div>
      </div>
    );
  }

  // Object
  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>).filter(
      ([, value]) => value !== null && value !== undefined,
    );

    if (entries.length === 0) return null;

    return (
      <div className={className}>
        {label && (
          <MonoLabel variant="muted" className="mb-4 block">
            {label}
          </MonoLabel>
        )}
        <div className="space-y-4">
          {entries.map(([key, value]) => (
            <UnknownFieldRenderer
              key={key}
              data={value}
              label={key.replace(/_/g, ' ')}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
});
