'use client';

import { type ReactNode, useState } from 'react';

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';

import { cn } from '@kit/ui/utils';

import { DURATION, EASE, SPRING } from '~/app/_lib/animation';

interface Tab {
  id: string;
  label: string;
}

interface AnimatedTabsProps {
  /**
   * Array of tab definitions with id and label
   */
  tabs: Tab[];
  /**
   * ID of the initially selected tab
   */
  defaultTab?: string;
  /**
   * Callback when tab changes
   */
  onTabChange?: (tabId: string) => void;
  /**
   * Render function for tab content
   */
  children: (activeTab: string) => ReactNode;
  /**
   * Additional class name for the container
   */
  className?: string;
  /**
   * Unique ID for layoutId (use when multiple AnimatedTabs on same page)
   */
  layoutId?: string;
}

/**
 * Animated tabs component with sliding indicator.
 *
 * Uses Framer Motion's layoutId for smooth indicator transitions -
 * the one animation pattern that CSS cannot replicate well.
 *
 * @example
 * ```tsx
 * <AnimatedTabs
 *   tabs={[
 *     { id: 'overview', label: 'Overview' },
 *     { id: 'details', label: 'Details' },
 *   ]}
 *   defaultTab="overview"
 *   onTabChange={(tab) => console.log('Tab changed:', tab)}
 * >
 *   {(activeTab) => (
 *     activeTab === 'overview' ? <Overview /> : <Details />
 *   )}
 * </AnimatedTabs>
 * ```
 */
export function AnimatedTabs({
  tabs,
  defaultTab,
  onTabChange,
  children,
  className,
  layoutId = 'tab-indicator',
}: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <LayoutGroup id={layoutId}>
      <div className={cn('flex flex-col', className)}>
        {/* Tab list */}
        <div
          className="flex border-b border-zinc-200 dark:border-zinc-800"
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={cn(
                'relative px-4 py-2 text-sm font-medium transition-colors',
                'focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:outline-none',
                activeTab === tab.id
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId={`${layoutId}-underline`}
                  className="absolute right-0 bottom-0 left-0 h-0.5 bg-zinc-900 dark:bg-zinc-100"
                  transition={SPRING.snappy}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content with crossfade */}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{
                duration: DURATION.normal / 1000,
                ease: EASE.out,
              }}
            >
              {children(activeTab)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </LayoutGroup>
  );
}

/**
 * Simple tab button for use without full AnimatedTabs wrapper.
 * Provides the animated indicator without content management.
 */
interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
  layoutId?: string;
  className?: string;
}

export function TabButton({
  isActive,
  onClick,
  children,
  layoutId = 'tab-indicator',
  className,
}: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      className={cn(
        'relative px-4 py-2 text-sm font-medium transition-colors',
        'focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:outline-none',
        isActive
          ? 'text-zinc-900 dark:text-zinc-100'
          : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
        className,
      )}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId={layoutId}
          className="absolute right-0 bottom-0 left-0 h-0.5 bg-zinc-900 dark:bg-zinc-100"
          transition={SPRING.snappy}
        />
      )}
    </button>
  );
}
