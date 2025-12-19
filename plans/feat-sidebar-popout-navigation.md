# feat: Sidebar Popout Navigation (Simplified)

## Overview

Move primary navigation from the fixed header to a sidebar popout menu for personal account pages (`/home/(user)`). The sidebar will provide streamlined access to core navigation, recent reports, usage monitoring, and user settings—styled with the existing "Palantir x Apple" aesthetic already established in the codebase.

## Problem Statement / Motivation

The current fixed header navigation takes up vertical screen real estate and doesn't scale well for additional navigation items. A sidebar popout pattern:
- Maximizes vertical content space when closed
- Provides room for contextual content (recent reports, usage)
- Follows established team account navigation patterns already in the codebase
- Aligns with modern SaaS navigation conventions (Linear, Notion, Figma)

## Proposed Solution

Implement a Sheet-based sidebar popout using the existing Shadcn Sheet component, triggered from a hamburger menu icon in the header. The sidebar contains:

1. **Primary Navigation**: New Analysis, All Reports
2. **Recent Reports Section**: Last 5 completed reports with same card styling as `/home` dashboard
3. **Usage Indicator**: Reuse existing `UsageIndicator` component (only visible when usage ≥25%)
4. **User Section**: Reuse existing user dropdown from header

```
┌──────────────────────────────────────────────────┐
│ ☰ Sparlo                                         │  ← Header (simplified)
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────┐                             │
│  │ ✕               │                             │
│  │                 │                             │
│  │ New Analysis    │                             │
│  │ All Reports     │                             │
│  │                 │                             │
│  │ ─────────────── │                             │
│  │ RECENT          │                             │
│  │                 │                             │
│  │ ┌─────────────┐ │                             │
│  │ │ Report 1    │ │     Main Content Area       │
│  │ │ 2 hours ago │ │                             │
│  │ └─────────────┘ │                             │
│  │ ┌─────────────┐ │                             │
│  │ │ Report 2    │ │                             │
│  │ │ Yesterday   │ │                             │
│  │ └─────────────┘ │                             │
│  │ ...             │                             │
│  │                 │                             │
│  │ ─────────────── │                             │
│  │ ▓▓▓▓▓▓░░░░ 62% │  ← Usage (reuse existing)   │
│  │                 │                             │
│  │ [👤 User Menu]  │  ← Reuse existing dropdown  │
│  └─────────────────┘                             │
│                                                  │
└──────────────────────────────────────────────────┘
```

## Technical Approach (Simplified)

### Architecture

**Minimal File Structure (2 new files, not 8):**
```
apps/web/app/home/(user)/
├── layout.tsx                         # MODIFY: Add recent reports fetch
├── _components/
│   └── navigation/
│       ├── nav-header.tsx             # MODIFY: Add hamburger trigger
│       └── nav-sidebar.tsx            # NEW: Complete sidebar (~120 lines)
├── _lib/
│   └── server/
│       └── recent-reports.loader.ts   # NEW: Simple 20-line loader
```

**Data Flow (Props, not Context):**
```
layout.tsx (Server Component)
    ↓ Promise.all([loadUserUsage(), loadRecentReports()])
    ↓ Pass as props
NavHeader (receives recentReports, usage, user as props)
    └── NavSidebar (Client Component - all sections inline)
        ├── Primary nav links (inline, 2 links)
        ├── Recent reports list (inline map)
        ├── UsageIndicator (reuse existing component)
        └── User dropdown (reuse existing from header)
```

**Key Simplifications from Review Feedback:**
- ✅ No custom context provider - just props
- ✅ Reuse existing `UsageIndicator` component (not create new)
- ✅ Reuse existing user dropdown logic
- ✅ One sidebar file with all sections inline
- ✅ Sheet handles animations, focus trap, ESC key automatically (no custom code)
- ✅ Server-side data fetch = no loading skeletons needed

### Implementation

**1. Recent Reports Loader (20 lines)**

```tsx
// apps/web/app/home/(user)/_lib/server/recent-reports.loader.ts
import 'server-only';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function loadRecentReports(userId: string) {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('reports')
    .select('id, title, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('[Reports] Failed to load recent:', error);
    return [];
  }

  return data ?? [];
}
```

**2. Layout Modification (add 3 lines)**

```tsx
// apps/web/app/home/(user)/layout.tsx
import { loadRecentReports } from './_lib/server/recent-reports.loader';

async function UserHomeLayout({ children }: React.PropsWithChildren) {
  const workspace = await loadUserWorkspace();

  // Add recentReports to existing parallel fetch
  const [usage, recentReports] = await Promise.all([
    loadUserUsage(workspace.user.id),
    loadRecentReports(workspace.user.id), // NEW
  ]);

  return (
    <UserWorkspaceContextProvider value={workspace}>
      <AppWorkspaceProvider value={workspace}>
        <div className="flex min-h-screen flex-col bg-[--surface-base]">
          <NavHeader
            usage={usage}
            recentReports={recentReports}  // NEW prop
            user={workspace.user}
          />
          <main className="flex-1 pt-14">{children}</main>
        </div>
      </AppWorkspaceProvider>
    </UserWorkspaceContextProvider>
  );
}
```

**3. NavHeader Modification (add trigger + pass props)**

```tsx
// apps/web/app/home/(user)/_components/navigation/nav-header.tsx
'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { NavSidebar } from './nav-sidebar';

interface NavHeaderProps {
  usage: UsageData | null;
  recentReports: RecentReport[];
  user: User;
}

export function NavHeader({ usage, recentReports, user }: NavHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-[--nav-border] bg-[--nav-bg] backdrop-blur-[var(--nav-blur)]">
        <div className="flex h-full items-center px-4">
          {/* Hamburger trigger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-[--surface-overlay] transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5 text-[--text-secondary]" />
          </button>

          {/* Logo */}
          <Link href="/home" className="ml-3">
            <Image src={logoSrc} alt="Sparlo" ... />
          </Link>

          <div className="flex-1" />

          {/* Keep minimal right-side actions if needed */}
        </div>
      </header>

      {/* Sidebar - all data passed as props */}
      <NavSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        usage={usage}
        recentReports={recentReports}
        user={user}
      />
    </>
  );
}
```

**4. Complete Sidebar Component (~120 lines)**

```tsx
// apps/web/app/home/(user)/_components/navigation/nav-sidebar.tsx
'use client';

import { Sheet, SheetContent } from '@kit/ui/shadcn/sheet';
import { X, FileText, PlusCircle, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { UsageIndicator } from './usage-indicator'; // Reuse existing!
import { cn } from '@kit/ui/cn';

interface NavSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usage: UsageData | null;
  recentReports: RecentReport[];
  user: User;
}

export function NavSidebar({
  open,
  onOpenChange,
  usage,
  recentReports,
  user
}: NavSidebarProps) {
  const close = () => onOpenChange(false);

  const navItems = [
    { href: '/home/reports/new', label: 'New Analysis', icon: PlusCircle },
    { href: '/home', label: 'All Reports', icon: FolderOpen },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-72 p-0 bg-[--surface-elevated] border-[--border-subtle] flex flex-col"
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-[--border-subtle]">
          <span className="text-sm font-medium text-[--text-primary]">Menu</span>
          <button
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-[--surface-overlay]"
            aria-label="Close menu"
          >
            <X className="h-4 w-4 text-[--text-muted]" />
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="p-2 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[--surface-overlay] transition-colors"
            >
              <Icon className="h-4 w-4 text-[--text-muted]" />
              <span className="text-sm font-medium text-[--text-secondary]">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Recent Reports */}
        <div className="flex-1 overflow-y-auto border-t border-[--border-subtle]">
          <div className="px-4 py-3">
            <h3 className="text-xs font-medium text-[--text-muted] uppercase tracking-wider">
              Recent
            </h3>
          </div>

          {recentReports.length === 0 ? (
            <p className="px-4 text-sm text-[--text-muted]">No reports yet</p>
          ) : (
            <div className="px-2 space-y-1">
              {recentReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/home/reports/${report.id}`}
                  onClick={close}
                  className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[--surface-overlay] transition-colors"
                >
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[--text-secondary] truncate">
                      {report.title || 'Untitled Report'}
                    </p>
                    <p className="text-xs text-[--text-muted] font-mono">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <FileText className="h-3.5 w-3.5 text-[--text-muted] flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Usage + User */}
        <div className="border-t border-[--border-subtle]">
          {/* Reuse existing UsageIndicator - only shows if >= 25% */}
          {usage && usage.percentage >= 25 && (
            <div className="px-4 py-3 border-b border-[--border-subtle]">
              <UsageIndicator usage={usage} compact />
            </div>
          )}

          {/* Reuse existing user dropdown - extract from nav-header or import */}
          <UserDropdown user={user} onItemClick={close} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### Styling (Palantir x Apple Aesthetic)

Follow existing design tokens from `styles/sparlo-tokens.css`:

- **Background**: `bg-[--surface-elevated]` - subtle elevation
- **Borders**: `border-[--border-subtle]` - minimal visual weight
- **Typography**: Söhne for text, Söhne Mono for timestamps
- **Transitions**: Default Sheet animations are smooth enough (Radix UI handles this)
- **Spacing**: Use existing spacing scale (px-4, py-3, gap-3)
- **Colors**: Emerald status dots, muted icons, secondary text

No custom CSS variables or Framer Motion needed - Sheet component provides all animations.

## Acceptance Criteria

### Functional Requirements
- [ ] Hamburger menu icon in header opens sidebar from left
- [ ] Clicking outside sidebar (backdrop) closes it
- [ ] ESC key closes sidebar (built into Sheet)
- [ ] X button in sidebar header closes it
- [ ] "New Analysis" navigates to `/home/reports/new` and closes sidebar
- [ ] "All Reports" navigates to `/home` and closes sidebar
- [ ] Recent Reports section shows last 5 completed reports
- [ ] Clicking a recent report navigates to `/home/reports/[id]` and closes sidebar
- [ ] Usage indicator appears only when usage ≥ 25% (reuse existing component)
- [ ] User dropdown includes: Settings, Billing, Theme Toggle, Docs, Sign Out (reuse existing)

### Non-Functional Requirements
- [ ] Sidebar animates smoothly (Sheet default animation)
- [ ] Respects `prefers-reduced-motion` (Sheet handles this)
- [ ] Works on mobile (Sheet is responsive by default)
- [ ] Keyboard navigable with focus trap (Sheet handles this)
- [ ] ARIA labels for screen readers

### Visual Requirements
- [ ] Matches existing Sparlo design tokens
- [ ] Dark mode support (uses CSS variables)
- [ ] Consistent with existing nav-header styling

## Files to Create/Modify

### New Files (2 only)
```
apps/web/app/home/(user)/_components/navigation/nav-sidebar.tsx  # ~120 lines
apps/web/app/home/(user)/_lib/server/recent-reports.loader.ts    # ~20 lines
```

### Modified Files (2 only)
```
apps/web/app/home/(user)/layout.tsx                              # Add loader call, pass props
apps/web/app/home/(user)/_components/navigation/nav-header.tsx   # Add hamburger, sidebar state
```

### Components to Reuse (not recreate)
```
apps/web/app/home/(user)/_components/usage-indicator.tsx         # Existing usage display
packages/features/accounts/src/components/personal-account-dropdown.tsx  # User menu
packages/ui/src/shadcn/sheet.tsx                                 # Sheet/drawer component
```

## Implementation Estimate

- **Total new code**: ~140 lines (not 300+)
- **Complexity**: Low (no custom context, no animations code)
- **Time**: 1-2 hours

## Open Questions

1. **Usage data threshold**: Current implementation shows usage at ≥25%. Confirm this is correct.
2. **"Docs" link**: What URL should docs link to? (External site or internal docs page?)

## References

### Internal References
- Current header: `apps/web/app/home/(user)/_components/navigation/nav-header.tsx`
- Reports styling: `apps/web/app/home/(user)/_components/reports-dashboard.tsx`
- Usage indicator: `apps/web/app/home/(user)/_components/usage-indicator.tsx`
- Sheet component: `packages/ui/src/shadcn/sheet.tsx`
- Design tokens: `apps/web/styles/sparlo-tokens.css`

### External References
- [Shadcn UI Sheet](https://ui.shadcn.com/docs/components/sheet)
- [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)

---

*Plan created: 2025-12-19*
*Simplified based on code review feedback*
