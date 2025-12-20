# Navigation Redesign

**Solution Documentation**

Minimal, responsive navigation system with hamburger sidebar, glassmorphic styling, and token usage tracking.

## Design Philosophy

1. **Minimal by default** - Hamburger menu + logo + usage indicator
2. **Mobile-first responsive** - Single header pattern across all breakpoints
3. **Glassmorphic aesthetic** - CSS variable theming with backdrop blur
4. **Progressive disclosure** - Sidebar reveals nav links, recent reports, user menu

## Component Architecture

### NavHeader (Fixed Top Bar)
- **Left**: Hamburger trigger + Sparlo logo
- **Right**: Usage indicator (when >= 25% used)
- Fixed positioning with glassmorphic background
- Responsive logo switching (dark/light theme)

### NavSidebar (Slide-out Drawer)
- **Primary nav**: "New Analysis" + "All Reports"
- **Recent reports**: Dynamic list with timestamps
- **Usage section**: Token usage with billing link
- **User menu**: Settings, Billing, Theme toggle, Sign out

### UsageIndicator
- Progress bar with percentage display
- Color states: Normal (default) / Warning (80%+) / Critical (100%)
- Tooltip shows: tokens used/limit, reports count, days until reset
- Links to billing page

## Responsive Behavior

All screen sizes use the same pattern:
- Fixed header at top (h-14 / 56px)
- Hamburger opens sidebar from left
- Sidebar: 288px wide (w-72)
- Usage indicator: hidden on mobile (<768px), visible on desktop

## Evolution Timeline

1. **8647868** - Initial responsive design with desktop/mobile/tablet layouts
2. **b2fecb6** - Simplified to minimal design (wordmark + breadcrumb + avatar)
3. **d9a44ce** - Added Sparlo logo images (dark/light variants)
4. **717dfc8** - Restored nav links and avatar dropdown menu
5. **5a7386c** - Glassmorphic navigation with CSS variable theming
6. **ea51969** - Final refinements with usage enhancements

## Key Files

- `/apps/web/app/home/(user)/_components/navigation/nav-header.tsx`
- `/apps/web/app/home/(user)/_components/navigation/nav-sidebar.tsx`
- `/apps/web/app/home/(user)/_components/usage-indicator.tsx`
- `/apps/web/public/images/sparlo-grid-logo-*.png` (dark/light variants)

## CSS Variables Used

```css
--nav-bg, --nav-border, --nav-blur
--surface-overlay, --surface-elevated
--text-primary, --text-secondary, --text-muted
--border-default
--status-error
```

**Version**: 1.0 | **Updated**: 2025-12-19
