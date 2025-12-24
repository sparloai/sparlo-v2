'use client';

import { Check } from 'lucide-react';

import { cn } from '@kit/ui/utils';

interface AuraPlanCardProps {
  name: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  isCurrent?: boolean;
  onSelect: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function AuraPlanCard({
  name,
  price,
  features,
  interval,
  isCurrent,
  onSelect,
  disabled,
  isLoading,
}: AuraPlanCardProps) {
  return (
    <div
      className={cn(
        'group flex flex-col rounded-lg border bg-white p-8 transition-colors duration-300 md:p-10',
        isCurrent
          ? 'border-violet-600 ring-2 ring-violet-600'
          : 'border-zinc-200 hover:border-zinc-300',
      )}
    >
      {/* Plan Name & Price */}
      <div className="mb-8">
        <h3 className="mb-6 text-xs font-medium tracking-widest text-zinc-500 uppercase">
          {name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-tight text-zinc-950">
            ${price}
          </span>
          <span className="text-base font-normal text-zinc-500">
            /{interval}
          </span>
        </div>
      </div>

      {/* Features List */}
      <div className="mb-10 flex-grow space-y-4 border-t border-zinc-100 pt-8">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <Check className="mt-1 h-4 w-4 shrink-0 text-violet-600" />
            <span className="text-base font-normal text-zinc-700">
              {feature}
            </span>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <button
        onClick={onSelect}
        disabled={disabled || isCurrent || isLoading}
        className={cn(
          'block w-full rounded px-4 py-3 text-center text-sm font-medium transition-colors duration-200',
          isCurrent
            ? 'cursor-not-allowed bg-zinc-100 text-zinc-400'
            : 'bg-violet-600 text-white hover:bg-violet-700',
          (disabled || isLoading) && 'cursor-not-allowed opacity-50',
        )}
      >
        {isLoading
          ? 'Loading...'
          : isCurrent
            ? 'Current Plan'
            : `Start with ${name}`}
      </button>
    </div>
  );
}
