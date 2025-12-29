# Fix TOC, Sidebar, and Chat Panel Coordination on Reports Page

## Overview

The Reports page has three main UI panels (TOC, App Sidebar, Chat) that currently operate independently without awareness of each other's state. When the sidebar minimizes, the TOC doesn't adjust. When the chat opens, the TOC doesn't yield space. This creates awkward layouts and overlapping UI elements.

## Problem Statement

**Current Issues:**
1. TOC is fixed at `left-16` (64px) regardless of sidebar state
2. When chat drawer opens (420px), TOC doesn't minimize or shift
3. Brand System reports don't shift content when chat opens (Standard reports do)
4. All panel state is local—no coordination between components
5. No shared state management for UI panel visibility

**User Impact:**
- Awkward spacing when sidebar minimizes
- TOC may overlap with chat or create unusable content area
- Inconsistent behavior between report types

## Proposed Solution

Create a coordinated panel layout system using:
1. **PanelContext** - Shared React context for panel state coordination
2. **CSS Custom Properties** - Dynamic layout calculations
3. **Framer Motion** - Smooth panel transitions
4. **Unified Layout Component** - Single source of truth for panel positioning

### Layout Behavior Matrix

| Sidebar | TOC | Chat | TOC Behavior | Content Margins |
|---------|-----|------|--------------|-----------------|
| Expanded (280px) | Full (224px) | Closed | `left-[280px]` | `ml-[504px]` |
| Expanded (280px) | Icons (64px) | Open (420px) | `left-[280px]` | `ml-[344px] mr-[420px]` |
| Minimized (64px) | Full (224px) | Closed | `left-[64px]` | `ml-[288px]` |
| Minimized (64px) | Icons (64px) | Open (420px) | `left-[64px]` | `ml-[128px] mr-[420px]` |

**Key Rule:** When chat opens, TOC minimizes to icon-only mode (64px) to yield space.

## Technical Approach

### Phase 1: Create PanelContext

**File:** `apps/web/app/home/(user)/reports/_lib/contexts/panel-context.tsx`

```typescript
'use client';

import { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';

// Panel widths as constants
export const PANEL_WIDTHS = {
  SIDEBAR_EXPANDED: 280,
  SIDEBAR_MINIMIZED: 64,
  TOC_FULL: 224,
  TOC_ICONS: 64,
  CHAT: 420,
} as const;

interface PanelState {
  sidebarExpanded: boolean;
  tocVisible: boolean;
  tocIconMode: boolean;
  chatOpen: boolean;
}

type PanelAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; expanded: boolean }
  | { type: 'TOGGLE_TOC' }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'SET_CHAT'; open: boolean };

const initialState: PanelState = {
  sidebarExpanded: true,
  tocVisible: true,
  tocIconMode: false,
  chatOpen: false,
};

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarExpanded: !state.sidebarExpanded };
    case 'SET_SIDEBAR':
      return { ...state, sidebarExpanded: action.expanded };
    case 'TOGGLE_TOC':
      return { ...state, tocVisible: !state.tocVisible };
    case 'TOGGLE_CHAT':
      // When chat opens, TOC goes to icon mode
      const chatOpen = !state.chatOpen;
      return {
        ...state,
        chatOpen,
        tocIconMode: chatOpen && state.tocVisible,
      };
    case 'SET_CHAT':
      return {
        ...state,
        chatOpen: action.open,
        tocIconMode: action.open && state.tocVisible,
      };
    default:
      return state;
  }
}

// Computed layout values
function computeLayout(state: PanelState) {
  const sidebarWidth = state.sidebarExpanded
    ? PANEL_WIDTHS.SIDEBAR_EXPANDED
    : PANEL_WIDTHS.SIDEBAR_MINIMIZED;

  const tocWidth = !state.tocVisible
    ? 0
    : state.tocIconMode
      ? PANEL_WIDTHS.TOC_ICONS
      : PANEL_WIDTHS.TOC_FULL;

  const chatWidth = state.chatOpen ? PANEL_WIDTHS.CHAT : 0;

  return {
    sidebarWidth,
    tocWidth,
    chatWidth,
    tocLeft: sidebarWidth,
    contentMarginLeft: sidebarWidth + tocWidth,
    contentMarginRight: chatWidth,
  };
}

const PanelContext = createContext<{
  state: PanelState;
  layout: ReturnType<typeof computeLayout>;
  dispatch: React.Dispatch<PanelAction>;
} | null>(null);

export function PanelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(panelReducer, initialState);
  const layout = useMemo(() => computeLayout(state), [state]);

  return (
    <PanelContext.Provider value={{ state, layout, dispatch }}>
      {children}
    </PanelContext.Provider>
  );
}

export function usePanelContext() {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error('usePanelContext must be used within PanelProvider');
  }
  return context;
}

// Convenience hooks
export function useSidebar() {
  const { state, dispatch } = usePanelContext();
  return {
    isExpanded: state.sidebarExpanded,
    toggle: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    setExpanded: (expanded: boolean) => dispatch({ type: 'SET_SIDEBAR', expanded }),
  };
}

export function useToc() {
  const { state, dispatch, layout } = usePanelContext();
  return {
    isVisible: state.tocVisible,
    isIconMode: state.tocIconMode,
    width: layout.tocWidth,
    left: layout.tocLeft,
    toggle: () => dispatch({ type: 'TOGGLE_TOC' }),
  };
}

export function useChat() {
  const { state, dispatch, layout } = usePanelContext();
  return {
    isOpen: state.chatOpen,
    width: layout.chatWidth,
    toggle: () => dispatch({ type: 'TOGGLE_CHAT' }),
    setOpen: (open: boolean) => dispatch({ type: 'SET_CHAT', open }),
  };
}
```

### Phase 2: Create TOC Icon Mode Component

**File:** `apps/web/app/home/(user)/reports/[id]/_components/brand-system/toc-icons.tsx`

```typescript
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useToc } from '../../_lib/contexts/panel-context';
import type { TocSection } from '../../_lib/hooks/use-toc-scroll';

interface TocIconsProps {
  sections: TocSection[];
  activeSection: string;
  onNavigate: (id: string) => void;
}

export const TocIcons = memo(function TocIcons({
  sections,
  activeSection,
  onNavigate,
}: TocIconsProps) {
  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-2 p-2"
    >
      {sections.map((section, index) => {
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => onNavigate(section.id)}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
              isActive
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
            title={section.title}
          >
            <span className="text-sm font-medium">{index + 1}</span>

            {/* Tooltip on hover */}
            <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              {section.title}
            </span>
          </button>
        );
      })}
    </motion.nav>
  );
});
```

### Phase 3: Update TableOfContents Component

**File:** `apps/web/app/home/(user)/reports/[id]/_components/brand-system/table-of-contents.tsx`

Update to use PanelContext and support icon mode:

```typescript
// Key changes to existing file:

import { useToc, PANEL_WIDTHS } from '../../_lib/contexts/panel-context';
import { TocIcons } from './toc-icons';

export const TableOfContents = memo(function TableOfContents({
  sections,
  variant = 'default',
  scrollOffset = TOC_SCROLL_OFFSET,
}: TableOfContentsProps) {
  const { isVisible, isIconMode, left, width } = useToc();
  const sectionIds = useMemo(() => flattenSectionIds(sections), [sections]);
  const { activeSection, navigateToSection } = useTocScroll({
    sectionIds,
    scrollOffset,
  });

  if (!isVisible) return null;

  return (
    <motion.aside
      initial={false}
      animate={{
        width: width,
        left: left,
        opacity: 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      className="fixed top-14 z-40 hidden h-[calc(100vh-3.5rem)] overflow-hidden border-r border-zinc-100 bg-white/95 backdrop-blur-sm lg:block"
    >
      <AnimatePresence mode="wait">
        {isIconMode ? (
          <TocIcons
            key="icons"
            sections={sections}
            activeSection={activeSection}
            onNavigate={navigateToSection}
          />
        ) : (
          <motion.div
            key="full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full overflow-y-auto p-6"
          >
            {/* Existing full TOC content */}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
});
```

### Phase 4: Update ReportDisplay Component

**File:** `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`

Key changes:
1. Remove local `isChatOpen` state
2. Use `useChat()` hook from PanelContext
3. Update content margin to use computed layout values

```typescript
// Replace local state with context
const { isOpen: isChatOpen, toggle: toggleChat, setOpen: setChatOpen } = useChat();
const { layout } = usePanelContext();

// Update main content wrapper
<div
  className="min-w-0 flex-1 px-6 py-10 transition-all duration-300"
  style={{
    marginLeft: layout.contentMarginLeft,
    marginRight: layout.contentMarginRight,
  }}
>
```

### Phase 5: Update BrandSystemReport Component

**File:** `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx`

Apply same content margin logic as Standard reports:

```typescript
const { layout } = usePanelContext();

// Update main wrapper
<main
  className="min-w-0 flex-1 transition-all duration-300"
  style={{
    marginRight: layout.contentMarginRight,
  }}
>
```

### Phase 6: Wrap Reports Layout with PanelProvider

**File:** `apps/web/app/home/(user)/reports/layout.tsx`

```typescript
import { PanelProvider } from './_lib/contexts/panel-context';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelProvider>
      {children}
    </PanelProvider>
  );
}
```

### Phase 7: Integrate with App Sidebar

The app sidebar likely has its own state management. We need to sync it with PanelContext.

**Option A: If sidebar exposes state via context**
```typescript
// In PanelProvider, subscribe to sidebar context
const { isExpanded } = useAppSidebar();

useEffect(() => {
  dispatch({ type: 'SET_SIDEBAR', expanded: isExpanded });
}, [isExpanded]);
```

**Option B: If sidebar uses local state**
Create a wrapper that lifts sidebar state to PanelContext.

## Acceptance Criteria

### Functional Requirements
- [ ] When app sidebar minimizes (280px → 64px), TOC shifts left to `left-[64px]`
- [ ] When chat opens, TOC transitions to icon-only mode (224px → 64px)
- [ ] When chat closes, TOC expands back to full mode
- [ ] Content area margins adjust dynamically based on panel states
- [ ] Brand System reports and Standard reports behave identically
- [ ] All transitions animate smoothly (300ms spring animation)
- [ ] Mobile behavior unchanged (overlay patterns)

### Non-Functional Requirements
- [ ] No layout shift or content reflow during transitions
- [ ] Scroll position preserved when panels change
- [ ] No duplicate scroll listeners or observers
- [ ] Re-renders minimized (only affected components re-render)
- [ ] Respects `prefers-reduced-motion` (instant transitions)

### Testing
- [ ] Desktop: sidebar expanded + TOC full + chat closed
- [ ] Desktop: sidebar expanded + TOC icons + chat open
- [ ] Desktop: sidebar minimized + TOC full + chat closed
- [ ] Desktop: sidebar minimized + TOC icons + chat open
- [ ] Tablet (768-1024px): graceful degradation
- [ ] Mobile (<768px): overlay patterns work

## File Changes Summary

### New Files
1. `apps/web/app/home/(user)/reports/_lib/contexts/panel-context.tsx` - Shared panel state
2. `apps/web/app/home/(user)/reports/[id]/_components/brand-system/toc-icons.tsx` - Icon-only TOC

### Modified Files
1. `apps/web/app/home/(user)/reports/layout.tsx` - Add PanelProvider wrapper
2. `apps/web/app/home/(user)/reports/[id]/_components/brand-system/table-of-contents.tsx` - Use context, support icon mode
3. `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx` - Use context for chat state
4. `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx` - Add content margin for chat

## Dependencies

- `framer-motion` (already installed)
- No new dependencies required

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| App sidebar integration unknown | Research sidebar component first, may need wrapper |
| Re-render performance | Memoize components, use selective context subscriptions |
| Animation jank | Use CSS custom properties + Framer Motion layout animations |
| Mobile breakage | Test mobile overlay patterns remain unchanged |

## Open Questions

1. **How does app sidebar expose its minimized/expanded state?** Need to investigate sidebar component.
2. **Should panel states persist across page navigation?** Currently assumes no persistence.
3. **What's the minimum content width before panels must overlay?** Assumes 400px minimum.

## Estimated Complexity

- **Phase 1-2**: Low - New context and icon component
- **Phase 3-4**: Medium - Refactoring existing components
- **Phase 5-6**: Low - Layout wrapper and integration
- **Phase 7**: Unknown - Depends on sidebar architecture

## References

- Current TOC: `apps/web/app/home/(user)/reports/[id]/_components/brand-system/table-of-contents.tsx`
- Current chat: `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx:1147-1317`
- Shared scroll hook: `apps/web/app/home/(user)/reports/[id]/_lib/hooks/use-toc-scroll.ts`
- react-resizable-panels (alternative): https://react-resizable-panels.vercel.app/
