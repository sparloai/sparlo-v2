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
import { type ReactNode, memo, useMemo, Component, type ErrorInfo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import { cn } from '@kit/ui/utils';
import {
  PROSE_SANITIZE_SCHEMA,
  PROSE_MARKDOWN_COMPONENTS,
} from '~/lib/shared/markdown-components';

// ============================================
// CITATION PARSING UTILITY
// ============================================

/**
 * Parse text containing inline citations like `<sup>[1]</sup>` and render as React elements.
 * Returns an array of strings and React elements that can be rendered.
 */
export function parseCitations(text: string): (string | ReactNode)[] {
  if (!text) return [];

  // Match <sup>[N]</sup> pattern (case-insensitive, handles whitespace)
  const citationRegex = /<sup>\s*\[(\d+)\]\s*<\/sup>/gi;

  const parts: (string | ReactNode)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    // Add text before the citation
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the citation as a superscript element
    const citationNumber = match[1];
    parts.push(
      <sup
        key={`citation-${match.index}`}
        className="ml-0.5 text-[11px] font-medium text-zinc-500"
      >
        [{citationNumber}]
      </sup>,
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last citation
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * CitedText component - renders text with inline citations parsed.
 * Use this for any prose text that might contain <sup>[N]</sup> citations.
 */
interface CitedTextProps {
  children: string;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

export const CitedText = memo(function CitedText({
  children,
  className,
  as: Component = 'p',
}: CitedTextProps) {
  const parsedContent = useMemo(() => parseCitations(children), [children]);

  return <Component className={className}>{parsedContent}</Component>;
});

// ============================================
// PROSE MARKDOWN COMPONENT (Antifragile)
// ============================================

/**
 * Error boundary for ProseMarkdown - catches any rendering errors
 * and falls back to displaying plain text.
 */
interface ProseMarkdownErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ProseMarkdownErrorBoundaryProps {
  children: ReactNode;
  fallbackContent: string;
}

class ProseMarkdownErrorBoundary extends Component<
  ProseMarkdownErrorBoundaryProps,
  ProseMarkdownErrorBoundaryState
> {
  constructor(props: ProseMarkdownErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ProseMarkdownErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error but don't crash - antifragile behavior
    console.error('ProseMarkdown rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback: render as plain text with paragraph splitting
      const paragraphs = this.props.fallbackContent
        .split(/\n\n+/)
        .filter((p) => p.trim());

      return (
        <div className="prose-fallback">
          {paragraphs.map((paragraph, idx) => (
            <p
              key={idx}
              className="mb-4 text-[18px] leading-[1.7] text-zinc-700 last:mb-0"
              style={{ fontFamily: 'var(--font-heading), system-ui, sans-serif' }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * ProseMarkdown - Renders markdown content with brand system typography.
 *
 * Antifragile design:
 * - Empty/null content returns null (no crash)
 * - Error boundary catches ReactMarkdown failures and shows plain text fallback
 * - Sanitizes all HTML to prevent XSS
 * - Allows <sup> for citations
 */
interface ProseMarkdownProps {
  children: string | null | undefined;
  className?: string;
}

export const ProseMarkdown = memo(function ProseMarkdown({
  children,
  className,
}: ProseMarkdownProps) {
  // Antifragile: handle empty/null content gracefully
  if (!children || typeof children !== 'string' || !children.trim()) {
    return null;
  }

  const content = children.trim();

  return (
    <ProseMarkdownErrorBoundary fallbackContent={content}>
      <div className={cn('prose-content', className)}>
        <ReactMarkdown
          rehypePlugins={[[rehypeSanitize, PROSE_SANITIZE_SCHEMA]]}
          components={PROSE_MARKDOWN_COMPONENTS}
        >
          {content}
        </ReactMarkdown>
      </div>
    </ProseMarkdownErrorBoundary>
  );
});

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
        'text-[13px] font-semibold tracking-[0.06em] uppercase',
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
  /** When true, parses <sup>[N]</sup> patterns and renders as proper superscript elements */
  parseCited?: boolean;
}

export const BodyText = memo(function BodyText({
  children,
  className,
  size = 'md',
  variant = 'primary',
  parseCited = true,
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

  // Parse citations if children is a string and parseCited is true
  const content = useMemo(() => {
    if (parseCited && typeof children === 'string') {
      return parseCitations(children);
    }
    return children;
  }, [children, parseCited]);

  return (
    <p
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        'leading-[1.3] tracking-[-0.02em]',
        className,
      )}
    >
      {content}
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
        // Mobile: no border for max reading width; Desktop: elegant left border
        variant === 'bordered' && 'md:border-l-2 md:border-zinc-900 md:pl-10',
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
  // Mobile: minimal borders for reading width; Desktop: full accent borders
  const weightClasses = {
    light: 'md:border-l-2 md:border-zinc-200',
    medium: 'md:border-l-2 md:border-zinc-300',
    heavy: 'md:border-l-4 md:border-zinc-900',
  };

  return (
    <div className={cn(weightClasses[weight], 'md:pl-6', className)}>
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
          'text-[13px] font-medium tracking-[0.08em] uppercase',
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
      <span className="text-[32px] leading-none font-semibold text-zinc-200">
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

// ============================================
// DD REPORT SPECIFIC PRIMITIVES
// Typography-based verdict/severity indicators
// ============================================

/**
 * Verdict Display - Typography-based verdict indicator
 * Replaces colored boxes with weight/size hierarchy
 * Larger + bolder + thicker border = more positive verdict
 */
type VerdictLevel =
  | 'COMPELLING'
  | 'PROMISING'
  | 'MIXED'
  | 'CAUTION'
  | 'CONCERNING'
  | 'PASS';

interface VerdictDisplayProps {
  verdict: string;
  confidence?: string;
  className?: string;
}

const VERDICT_STYLES: Record<string, { text: string; border: string }> = {
  COMPELLING: {
    text: 'text-[28px] font-semibold text-zinc-900',
    border: 'border-l-4 border-zinc-900',
  },
  PROMISING: {
    text: 'text-[24px] font-medium text-zinc-800',
    border: 'border-l-4 border-zinc-700',
  },
  MIXED: {
    text: 'text-[22px] font-medium text-zinc-700',
    border: 'border-l-2 border-zinc-500',
  },
  CAUTION: {
    text: 'text-[20px] font-normal text-zinc-600',
    border: 'border-l-2 border-zinc-400',
  },
  CONCERNING: {
    text: 'text-[20px] font-normal text-zinc-500',
    border: 'border-l-2 border-zinc-300',
  },
  PASS: {
    text: 'text-[18px] font-normal text-zinc-500',
    border: 'border-l border-zinc-200',
  },
};

const DEFAULT_VERDICT_STYLE = {
  text: 'text-[22px] font-medium text-zinc-700',
  border: 'border-l-2 border-zinc-500',
};

function normalizeVerdict(verdict: string | undefined): VerdictLevel {
  if (!verdict) return 'MIXED';
  // Strip annotations like "WEAK - needs improvement" → "WEAK"
  const cleaned = verdict
    .toUpperCase()
    .replace(/\s*-.*$/, '')
    .trim();
  if (cleaned in VERDICT_STYLES) return cleaned as VerdictLevel;
  return 'MIXED';
}

export const VerdictDisplay = memo(function VerdictDisplay({
  verdict,
  confidence,
  className,
}: VerdictDisplayProps) {
  const normalizedVerdict = normalizeVerdict(verdict);
  // Get style with guaranteed fallback
  const lookupStyle = VERDICT_STYLES[normalizedVerdict];
  const text = lookupStyle ? lookupStyle.text : DEFAULT_VERDICT_STYLE.text;
  const border = lookupStyle
    ? lookupStyle.border
    : DEFAULT_VERDICT_STYLE.border;

  return (
    <div
      className={cn('py-4 pl-6', border, className)}
      role="status"
      aria-label={`Verdict: ${normalizedVerdict}${confidence ? `, ${confidence} confidence` : ''}`}
    >
      <span className={text}>{normalizedVerdict}</span>
      {confidence && (
        <span className="ml-3 text-[14px] text-zinc-400">
          ({confidence} confidence)
        </span>
      )}
    </div>
  );
});

/**
 * Risk Severity Indicator - Typography-based with dots
 * Replaces colored badges with weight/size hierarchy
 */
interface RiskSeverityIndicatorProps {
  severity: string;
  label?: string;
  className?: string;
}

const SEVERITY_STYLES: Record<string, { dot: string; text: string }> = {
  CRITICAL: { dot: 'bg-zinc-900', text: 'font-semibold text-zinc-900' },
  HIGH: { dot: 'bg-zinc-700', text: 'font-medium text-zinc-700' },
  MEDIUM: { dot: 'bg-zinc-500', text: 'font-normal text-zinc-600' },
  LOW: { dot: 'bg-zinc-300', text: 'font-normal text-zinc-400' },
};

const DEFAULT_SEVERITY_STYLE = {
  dot: 'bg-zinc-500',
  text: 'font-normal text-zinc-600',
};

function normalizeSeverity(
  severity: string | undefined,
): keyof typeof SEVERITY_STYLES {
  if (!severity) return 'MEDIUM';
  const cleaned = severity.toUpperCase().trim();
  if (cleaned in SEVERITY_STYLES)
    return cleaned as keyof typeof SEVERITY_STYLES;
  return 'MEDIUM';
}

export const RiskSeverityIndicator = memo(function RiskSeverityIndicator({
  severity,
  label,
  className,
}: RiskSeverityIndicatorProps) {
  const normalizedSeverity = normalizeSeverity(severity);
  // Get style with guaranteed fallback
  const lookupStyle = SEVERITY_STYLES[normalizedSeverity];
  const dot = lookupStyle ? lookupStyle.dot : DEFAULT_SEVERITY_STYLE.dot;
  const textClass = lookupStyle
    ? lookupStyle.text
    : DEFAULT_SEVERITY_STYLE.text;

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      <span className={cn('text-[13px]', textClass)}>
        {label || normalizedSeverity}
      </span>
    </span>
  );
});

/**
 * Score Display - For ratings like 6.5/10
 * Clean card with large number and optional one-liner
 */
interface ScoreDisplayProps {
  score: number | string;
  outOf: number;
  label?: string;
  oneLiner?: string;
  className?: string;
}

export const ScoreDisplay = memo(function ScoreDisplay({
  score,
  outOf,
  label,
  oneLiner,
  className,
}: ScoreDisplayProps) {
  // Handle string scores like "6.5" → 6.5
  const numericScore =
    typeof score === 'string' ? parseFloat(score) || 0 : score;

  return (
    <div className={cn('rounded-lg border border-zinc-200 p-4', className)}>
      <div className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
        {label || 'Score'}
      </div>
      <div className="mt-1 text-[32px] font-semibold text-zinc-900">
        {numericScore}
        <span className="text-[18px] text-zinc-400">/{outOf}</span>
      </div>
      {oneLiner && <p className="mt-2 text-[14px] text-zinc-500">{oneLiner}</p>}
    </div>
  );
});

/**
 * Verdict Indicator - Compact version for grid display
 * Shows label + verdict in a small card
 */
interface VerdictIndicatorProps {
  label: string;
  verdict: string;
  symbol?: string;
  className?: string;
}

const INDICATOR_VERDICT_STYLES: Record<string, string> = {
  SOUND: 'text-zinc-900 font-medium',
  STRONG: 'text-zinc-900 font-medium',
  GOOD: 'text-zinc-800',
  REASONABLE: 'text-zinc-700',
  CHALLENGING: 'text-zinc-600',
  WEAK: 'text-zinc-500',
  RIGHT_TIME: 'text-zinc-800 font-medium',
};

export const VerdictIndicator = memo(function VerdictIndicator({
  label,
  verdict,
  symbol,
  className,
}: VerdictIndicatorProps) {
  if (!verdict) return null;

  const normalizedVerdict = verdict
    .toUpperCase()
    .replace(/\s*-.*$/, '')
    .trim();
  const textStyle =
    INDICATOR_VERDICT_STYLES[normalizedVerdict] || 'text-zinc-600';

  return (
    <div className={cn('rounded-lg border border-zinc-200 p-3', className)}>
      <div className="text-[11px] font-medium tracking-[0.06em] text-zinc-400 uppercase">
        {label}
      </div>
      <div
        className={cn('mt-1 flex items-center gap-1 text-[14px]', textStyle)}
      >
        {symbol && <span className="text-[12px]">{symbol}</span>}
        <span>{verdict}</span>
      </div>
    </div>
  );
});
