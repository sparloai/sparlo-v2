'use client';

import { Check } from 'lucide-react';

import { Button } from '@kit/ui/button';
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
  interval,
  description,
  features,
  isPopular,
  isCurrent,
  onSelect,
  disabled,
  isLoading,
}: AuraPlanCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-colors duration-300',
        isPopular
          ? 'border-zinc-950 ring-2 ring-zinc-950'
          : 'border-zinc-200 hover:border-zinc-300',
        isCurrent && 'border-emerald-500 ring-2 ring-emerald-500',
      )}
    >
      {/* Popular Badge */}
      {isPopular && !isCurrent && (
        <div className="absolute top-0 right-0 rounded-bl-lg bg-zinc-950 px-3 py-1 font-mono text-xs font-bold tracking-widest text-white uppercase">
          Popular
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrent && (
        <div className="absolute top-0 right-0 rounded-bl-lg bg-emerald-500 px-3 py-1 font-mono text-xs font-bold tracking-widest text-white uppercase">
          Current
        </div>
      )}

      {/* Card Header */}
      <div className="border-b border-zinc-200 bg-zinc-50/50 p-6 md:p-8">
        <span className="font-mono text-xs font-bold tracking-widest text-zinc-600 uppercase">
          {name}
        </span>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-semibold text-zinc-950 sm:text-4xl">
            ${price}
          </span>
          <span className="text-zinc-600">/{interval}</span>
        </div>
        <p className="mt-2 text-sm text-zinc-600">{description}</p>
      </div>

      {/* Features List */}
      <div className="flex-grow space-y-3 p-6 md:p-8">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-950" />
            <span className="text-sm text-zinc-700">{feature}</span>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div className="px-6 pb-6 md:px-8 md:pb-8">
        <Button
          onClick={onSelect}
          disabled={disabled || isCurrent || isLoading}
          className={cn(
            'min-h-[44px] w-full',
            isPopular
              ? 'bg-zinc-950 text-white hover:bg-zinc-800'
              : 'border border-zinc-950 bg-white text-zinc-950 hover:bg-zinc-50',
          )}
        >
          {isLoading
            ? 'Loading...'
            : isCurrent
              ? 'Current Plan'
              : 'Select Plan'}
        </Button>
      </div>
    </div>
  );
}
