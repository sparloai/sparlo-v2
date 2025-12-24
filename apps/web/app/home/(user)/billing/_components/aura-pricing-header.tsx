'use client';

interface AuraPricingHeaderProps {
  title: string;
  subtitle?: string;
}

export function AuraPricingHeader({ title, subtitle }: AuraPricingHeaderProps) {
  return (
    <div className="mb-10 border-l-4 border-zinc-950 py-1 pl-6">
      <h2 className="mb-3 text-2xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-4xl text-lg leading-relaxed font-normal text-zinc-600">
          {subtitle}
        </p>
      )}
    </div>
  );
}
