import { cn } from '@kit/ui/utils';

interface InsightCalloutProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function InsightCallout({
  title,
  subtitle,
  children,
  className,
}: InsightCalloutProps) {
  return (
    <div
      className={cn(
        'rounded-r-lg border-l-[3px] border-blue-500 bg-blue-50 p-5',
        className,
      )}
    >
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
        {title}
      </p>
      {subtitle && (
        <p className="text-[15px] font-medium leading-snug text-zinc-900">
          {subtitle}
        </p>
      )}
      {children && (
        <div className="mt-2 text-[13px] text-zinc-600">{children}</div>
      )}
    </div>
  );
}
