'use client';

interface AuraPricingHeaderProps {
  title: string;
  subtitle?: string;
}

export function AuraPricingHeader({ title }: AuraPricingHeaderProps) {
  return (
    <div className="mb-12">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl">
        {title}
      </h1>
    </div>
  );
}
