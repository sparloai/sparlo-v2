'use client';

interface SectionHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}

export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/30">
        <Icon className="h-5 w-5 text-violet-700 dark:text-violet-400" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
