'use client';

import { motion } from 'framer-motion';

import { cn } from '@kit/ui/utils';

export type Mode = 'engineers' | 'investors';

interface ModeTabsProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

const tabs = [
  { id: 'engineers', label: 'For Engineers' },
  { id: 'investors', label: 'For Investors' },
] as const;

/**
 * Mode Tabs Component
 *
 * Tab interface for switching between Engineers and Investors modes.
 * Follows design system: near-monochrome, animated underline indicator.
 */
export function ModeTabs({ mode, onModeChange }: ModeTabsProps) {
  return (
    <div className="border-b border-zinc-200 bg-white px-8 md:px-16 lg:px-24">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex justify-center gap-12 py-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onModeChange(tab.id)}
              className={cn(
                'relative px-2 py-2 text-[18px] font-medium tracking-[-0.02em] transition-colors duration-200',
                mode === tab.id
                  ? 'text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-600',
              )}
            >
              {tab.label}
              {mode === tab.id && (
                <motion.div
                  layoutId="mode-tab-indicator"
                  className="absolute right-0 bottom-0 left-0 h-0.5 bg-zinc-900"
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
