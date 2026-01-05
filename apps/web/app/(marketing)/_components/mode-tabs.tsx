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
  { id: 'investors', label: 'For VCs' },
] as const;

/**
 * Mode Tabs Component
 *
 * Tab interface for switching between Engineers and VCs modes.
 * Follows design system: near-monochrome, animated underline indicator.
 */
export function ModeTabs({ mode, onModeChange }: ModeTabsProps) {
  return (
    <div className="bg-white px-6 md:px-16 lg:px-24">
      <div className="mx-auto max-w-[1400px]">
        {/* Single border line at bottom of container */}
        <div className="relative border-b border-zinc-200">
          <div className="flex justify-center gap-8 md:gap-16">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onModeChange(tab.id)}
                className={cn(
                  'relative px-1 py-6 text-[22px] font-medium tracking-[-0.02em] transition-colors duration-200 md:text-[26px]',
                  mode === tab.id
                    ? 'text-zinc-900'
                    : 'text-zinc-400 hover:text-zinc-600',
                )}
              >
                {tab.label}
                {/* Active indicator overlays the border */}
                {mode === tab.id && (
                  <motion.div
                    layoutId="mode-tab-indicator"
                    className="absolute right-0 -bottom-px left-0 h-0.5 bg-zinc-900"
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
    </div>
  );
}
