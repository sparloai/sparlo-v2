# Navigation Bar Redesign Implementation Plan

## Overview

Redesign the navigation bar with responsive layouts for desktop (≥1024px), tablet (768px–1023px), and mobile (<768px), featuring glass morphism styling, usage tracking indicator, and improved accessibility.

## Specification Gaps (Resolved)

| Gap | Resolution |
|-----|------------|
| Unauthenticated users | Redirect to login (existing middleware) |
| Usage warning threshold | 80% of report limit |
| Usage critical threshold | 100% of report limit |
| Mobile drawer auto-close | Close on navigation, outside click, Escape |
| Focus trap in mobile drawer | Managed by Sheet component |
| Tab order | Logo → Nav links → Usage → User menu |

## Architecture

### Component Structure (5 files)

```
apps/web/app/home/(user)/_components/navigation/
├── nav-header.tsx        # Main responsive container
├── desktop-nav.tsx       # Desktop + tablet (responsive text via CSS)
├── mobile-nav.tsx        # Mobile hamburger + Sheet drawer (all-in-one)
├── usage-indicator.tsx   # Usage badge with dropdown
└── user-menu.tsx         # User dropdown menu
```

### TypeScript Interfaces

```typescript
// nav-header.tsx
interface NavHeaderProps {
  children?: React.ReactNode;
}

// desktop-nav.tsx / mobile-nav.tsx
interface NavLinkItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// usage-indicator.tsx
interface UsageData {
  used: number;      // reportsUsed from workspace
  limit: number;     // reportLimit from workspace
}

// user-menu.tsx
interface UserMenuProps {
  user: {
    id: string;
    email: string;
  };
  account: {
    name: string | null;
    picture_url: string | null;
  };
}
```

### Data Flow

**Use context, not props.** The layout already provides `UserWorkspaceContextProvider`:

```typescript
// Components read directly from context
function UsageIndicator() {
  const { reportsUsed, reportLimit } = useUserWorkspace();
  const percentage = (reportsUsed / reportLimit) * 100;
  // ...
}

function UserMenu() {
  const { user, account } = useUserWorkspace();
  // ...
}
```

### Styling

- Glass morphism: `backdrop-blur-md bg-[--surface-elevated]/80`
- Progressive enhancement for backdrop-filter
- Design tokens from `sparlo-tokens.css`
- Responsive via Tailwind breakpoints (CSS, not JS detection)

```css
/* Fallback for devices without backdrop-filter support */
@supports not (backdrop-filter: blur(12px)) {
  .nav-header {
    background: var(--surface-elevated);
  }
}
```

## Implementation

### Phase 1: Build Components

**Files to Create:**

#### 1. `nav-header.tsx` - Main Container

```typescript
'use client';

import { DesktopNav } from './desktop-nav';
import { MobileNav } from './mobile-nav';

export function NavHeader() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[--surface-elevated]/80 border-b border-[--border-subtle]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Desktop + Tablet: hidden on mobile */}
        <DesktopNav className="hidden md:flex" />

        {/* Mobile: visible only on mobile */}
        <MobileNav className="flex md:hidden" />
      </div>
    </header>
  );
}
```

#### 2. `desktop-nav.tsx` - Desktop & Tablet (Responsive)

```typescript
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, FileText, BookOpen } from 'lucide-react';
import { cn } from '@kit/ui/utils';
import { AppLogo } from '~/components/app-logo';
import { UsageIndicator } from './usage-indicator';
import { UserMenu } from './user-menu';

const NAV_LINKS = [
  { href: '/home', label: 'Dashboard', icon: Home },
  { href: '/home/reports/new', label: 'New Report', icon: FileText },
  { href: '/docs', label: 'Docs', icon: BookOpen },
] as const;

export function DesktopNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn('items-center justify-between w-full', className)}>
      {/* Left: Logo + Nav Links */}
      <div className="flex items-center gap-6 lg:gap-8">
        <Link href="/home" className="flex-shrink-0">
          <AppLogo />
        </Link>

        <div className="flex items-center gap-4 lg:gap-6">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 transition-colors',
                  isActive
                    ? 'text-[--accent] font-medium'
                    : 'text-[--text-secondary] hover:text-[--text-primary]'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {/* Hide label on tablet, show on desktop */}
                <span className="hidden lg:inline">{label}</span>
                {/* Screen reader text for tablet */}
                <span className="sr-only lg:hidden">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right: Usage + User Menu */}
      <div className="flex items-center gap-3 lg:gap-4">
        <UsageIndicator />
        <UserMenu />
      </div>
    </nav>
  );
}
```

#### 3. `mobile-nav.tsx` - Mobile with Drawer

```typescript
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, FileText, BookOpen, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@kit/ui/sheet';
import { cn } from '@kit/ui/utils';
import { AppLogo } from '~/components/app-logo';
import { useUserWorkspace } from '@kit/accounts/hooks/use-user-workspace';
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';

const NAV_LINKS = [
  { href: '/home', label: 'Dashboard', icon: Home },
  { href: '/home/reports/new', label: 'New Report', icon: FileText },
  { href: '/docs', label: 'Docs', icon: BookOpen },
] as const;

export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, account, reportsUsed, reportLimit } = useUserWorkspace();

  // Close drawer on navigation
  const handleNavClick = () => setOpen(false);

  return (
    <div className={cn('items-center justify-between w-full', className)}>
      {/* Hamburger Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <HamburgerIcon open={open} />
          </button>
        </SheetTrigger>

        <SheetContent side="left" className="w-[280px] p-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-[--border-subtle]">
              <AppLogo />
              <button
                onClick={() => setOpen(false)}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={handleNavClick}
                        className={cn(
                          'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors min-h-[44px]',
                          isActive
                            ? 'bg-[--accent-muted] text-[--accent] font-medium'
                            : 'text-[--text-secondary] hover:bg-[--surface-overlay]'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Usage Section */}
            <div className="p-4 border-t border-[--border-subtle]">
              <div className="text-sm text-[--text-muted] mb-1">Reports Used</div>
              <div className="text-lg font-medium">
                {reportsUsed} / {reportLimit}
              </div>
              <Link
                href="/home/settings/billing"
                onClick={handleNavClick}
                className="text-sm text-[--accent] hover:underline mt-2 inline-block"
              >
                Upgrade Plan
              </Link>
            </div>

            {/* User Section */}
            <div className="p-4 border-t border-[--border-subtle]">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={account?.picture_url ?? undefined} />
                  <AvatarFallback>
                    {account?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{account?.name ?? 'User'}</div>
                  <div className="text-sm text-[--text-muted] truncate">{user?.email}</div>
                </div>
              </div>
              <form action="/auth/sign-out" method="POST">
                <button
                  type="submit"
                  className="w-full text-left px-3 py-2 text-[--status-error] hover:bg-[--surface-overlay] rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </motion.div>
        </SheetContent>
      </Sheet>

      {/* Center: Logo */}
      <Link href="/home" className="absolute left-1/2 -translate-x-1/2">
        <AppLogo />
      </Link>

      {/* Right: Avatar */}
      <Link href="/home/settings" className="p-2 -mr-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={account?.picture_url ?? undefined} />
          <AvatarFallback>
            {account?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
    </div>
  );
}

// Animated hamburger icon (inline, not separate file)
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="relative w-5 h-4 flex flex-col justify-between">
      <motion.span
        className="block h-0.5 w-5 bg-current rounded-full origin-center"
        animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        className="block h-0.5 w-5 bg-current rounded-full"
        animate={open ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.1 }}
      />
      <motion.span
        className="block h-0.5 w-5 bg-current rounded-full origin-center"
        animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2 }}
      />
    </div>
  );
}
```

#### 4. `usage-indicator.tsx` - Usage Badge with Dropdown

```typescript
'use client';

import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { cn } from '@kit/ui/utils';
import { useUserWorkspace } from '@kit/accounts/hooks/use-user-workspace';
import Link from 'next/link';

const WARNING_THRESHOLD = 0.8;  // 80%
const CRITICAL_THRESHOLD = 1.0; // 100%

export function UsageIndicator() {
  const { reportsUsed, reportLimit } = useUserWorkspace();
  const percentage = reportLimit > 0 ? reportsUsed / reportLimit : 0;

  const status =
    percentage >= CRITICAL_THRESHOLD ? 'critical' :
    percentage >= WARNING_THRESHOLD ? 'warning' : 'normal';

  const statusColors = {
    normal: 'text-[--text-secondary]',
    warning: 'text-[--status-warning]',
    critical: 'text-[--status-error]',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 text-sm transition-colors hover:text-[--text-primary]',
            statusColors[status]
          )}
        >
          <span className="hidden lg:inline">
            {reportsUsed} / {reportLimit} reports
          </span>
          <span className="lg:hidden">
            {reportsUsed}/{reportLimit}
          </span>
          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="p-3">
          <div className="text-sm font-medium mb-2">Usage This Month</div>

          {/* Progress bar */}
          <div className="h-2 bg-[--surface-overlay] rounded-full overflow-hidden mb-2">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                status === 'critical' ? 'bg-[--status-error]' :
                status === 'warning' ? 'bg-[--status-warning]' : 'bg-[--accent]'
              )}
              style={{ width: `${Math.min(percentage * 100, 100)}%` }}
            />
          </div>

          <div className="text-xs text-[--text-muted]">
            {reportsUsed} of {reportLimit} reports used ({Math.round(percentage * 100)}%)
          </div>
        </div>

        <DropdownMenuItem asChild>
          <Link href="/home/settings/billing" className="cursor-pointer">
            Upgrade Plan
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### 5. `user-menu.tsx` - User Dropdown

```typescript
'use client';

import { User, CreditCard, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import { useUserWorkspace } from '@kit/accounts/hooks/use-user-workspace';
import Link from 'next/link';

export function UserMenu() {
  const { user, account } = useUserWorkspace();

  const initials = account?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-1 rounded-full hover:bg-[--surface-overlay] transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src={account?.picture_url ?? undefined} alt={account?.name ?? 'User'} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {/* Show name on desktop only */}
          <span className="hidden lg:inline text-sm font-medium max-w-[120px] truncate">
            {account?.name ?? 'User'}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/home/settings" className="cursor-pointer">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/home/settings/billing" className="cursor-pointer">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <form action="/auth/sign-out" method="POST" className="w-full">
            <button type="submit" className="flex items-center w-full text-[--status-error]">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Phase 2: Integration & Testing

**Files to Modify:**

#### Update `layout.tsx`

```typescript
// apps/web/app/home/(user)/layout.tsx
import { NavHeader } from './_components/navigation/nav-header';

export default async function UserHomeLayout({ children }: Props) {
  // ... existing data loading ...

  return (
    <UserWorkspaceContextProvider value={workspace}>
      <NavHeader />
      <main className="flex-1">
        {children}
      </main>
    </UserWorkspaceContextProvider>
  );
}
```

**Testing Checklist:**

- [ ] Desktop (≥1024px): Full nav with labels, usage badge, user name visible
- [ ] Tablet (768-1023px): Icon-only nav links, compact usage, avatar-only user menu
- [ ] Mobile (<768px): Hamburger menu, drawer opens/closes, all touch targets ≥44px
- [ ] Active link highlighted with accent color
- [ ] Usage color changes at 80% (warning) and 100% (critical)
- [ ] Sign out works from all locations
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader announces navigation landmark
- [ ] No layout shift on page load

## Dependencies

**Required (Already in Project):**
- `@kit/ui/dropdown-menu`
- `@kit/ui/sheet`
- `@kit/ui/avatar`
- `@kit/accounts/hooks/use-user-workspace`
- `lucide-react`
- `framer-motion` - For hamburger animation and drawer content transitions

## File Changes Summary

| Action | File |
|--------|------|
| Create | `_components/navigation/nav-header.tsx` |
| Create | `_components/navigation/desktop-nav.tsx` |
| Create | `_components/navigation/mobile-nav.tsx` |
| Create | `_components/navigation/usage-indicator.tsx` |
| Create | `_components/navigation/user-menu.tsx` |
| Modify | `layout.tsx` (replace existing nav) |

## Notes

- **No separate tablet component**: Tablet is desktop with responsive CSS (`hidden lg:inline` for labels)
- **No separate hamburger/drawer files**: Consolidated into `mobile-nav.tsx`
- **Context over props**: All components read from `useUserWorkspace()` directly
- **Framer Motion**: Used for hamburger → X animation and drawer content entrance
- **Sign out**: Uses form POST to `/auth/sign-out` (existing pattern)
