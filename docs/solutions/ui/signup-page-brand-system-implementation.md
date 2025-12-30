---
title: "Signup Page Brand System Implementation"
description: "Redesigned signup page according to SPARLO-DESIGN-SYSTEM.md with improved copy, accessibility enhancements, and interactive button states"
category: ui
severity: medium
date_solved: 2025-12-30
tags:
  - accessibility
  - branding
  - design-system
  - internationalization
  - user-experience
  - form-design
  - aria-labels
  - dark-mode
related_components:
  - SignUpPage (apps/web/app/auth/sign-up/page.tsx)
  - AuthLayoutShell (packages/features/auth/src/components/auth-layout.tsx)
  - PasswordInput (packages/features/auth/src/components/password-input.tsx)
  - Button (packages/ui/src/shadcn/button.tsx)
  - auth.json (apps/web/public/locales/en/auth.json)
related_docs:
  - docs/SPARLO-DESIGN-SYSTEM.md
  - CLAUDE.md
  - docs/archive/brand-identity.md.archived
design_system_reference: docs/SPARLO-DESIGN-SYSTEM.md
---

# Signup Page Brand System Implementation

## Problem

The signup page at `/auth/sign-up` was not following the established brand guidelines documented in `SPARLO-DESIGN-SYSTEM.md`. Several issues needed addressing:

1. **Brand Inconsistency**: Generic copy instead of value-focused messaging
2. **Typography Misalignment**: Text styling didn't follow design system's near-monochrome hierarchy
3. **Missing Translation**: Password confirmation field lacked description
4. **Accessibility Gaps**: Password toggle missing aria attributes
5. **Missing Interactive States**: Button component lacked cursor-pointer and active states
6. **Documentation Conflict**: Outdated `brand-identity.md` alongside authoritative design system

## Solution

### 1. Auth Layout Shell (`auth-layout.tsx`)

Updated with near-monochrome card styling:

```tsx
<div className={cn(
  'flex w-full flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm transition-shadow duration-200 dark:border-zinc-800 dark:bg-zinc-900',
  contentClassName,
)}>
```

**Key patterns:**
- Card: `rounded-xl border border-zinc-200 bg-white p-8 shadow-sm`
- Dark mode: `dark:border-zinc-800 dark:bg-zinc-900`
- Animation: `animate-in fade-in slide-in-from-bottom-4 duration-500`

### 2. Signup Page Content (`sign-up/page.tsx`)

Updated heading and subheading:

```tsx
<h1 className="text-[28px] font-semibold tracking-tight text-zinc-900 dark:text-white">
  Create Account
</h1>

<p className="text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
  First Analysis Free
</p>
```

**Typography decisions:**
- Heading: 28px semibold (Title size from design system)
- Subheading: 15px (Body Small)
- Color hierarchy: zinc-900 → zinc-500

### 3. Password Input Accessibility (`password-input.tsx`)

Added aria attributes to toggle button:

```tsx
<Button
  aria-label={showPassword ? 'Hide password' : 'Show password'}
  aria-pressed={showPassword}
>
```

### 4. Button Component (`button.tsx`)

Enhanced interactive states:

```tsx
'cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed'
```

### 5. Translation (`auth.json`)

Added repeat password description:

```json
"repeatPasswordDescription": "Repeat password to confirm."
```

### 6. Documentation Updates

- Added Design System section to `CLAUDE.md`
- Archived `brand-identity.md` to `docs/archive/`

## Files Modified

| File | Change |
|------|--------|
| `packages/features/auth/src/components/auth-layout.tsx` | Near-monochrome card styling |
| `apps/web/app/auth/sign-up/page.tsx` | New heading/subheading copy |
| `packages/features/auth/src/components/password-input.tsx` | aria-label, aria-pressed |
| `packages/ui/src/shadcn/button.tsx` | cursor-pointer, active:scale |
| `apps/web/public/locales/en/auth.json` | repeatPasswordDescription |
| `CLAUDE.md` | Design System section |
| `docs/solutions/ui/brand-identity.md` | Archived |

## Design System Reference

### Color Palette (Near-Monochrome)

| Token | Tailwind | Usage |
|-------|----------|-------|
| ink | zinc-950 | Primary text |
| secondary | zinc-700 | Secondary text |
| muted | zinc-500 | Tertiary text |
| subtle | zinc-400 | Quaternary text |

### Focus States

```tsx
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:focus-visible:ring-white"
```

## Prevention Strategies

### Pre-Development Checklist

- [ ] Review `docs/SPARLO-DESIGN-SYSTEM.md` first
- [ ] Identify reusable patterns from design system
- [ ] Check existing components for consistency

### Interactive States Checklist

- [ ] Hover state implemented
- [ ] Focus state with visible ring
- [ ] Active/pressed state
- [ ] Disabled state (opacity + cursor)
- [ ] Loading state (spinner + disabled)
- [ ] Dark mode variants

### Accessibility Checklist

- [ ] All inputs have labels
- [ ] Icon buttons have aria-label
- [ ] Toggle buttons have aria-pressed
- [ ] Focus indicators visible (3:1 contrast)
- [ ] Keyboard navigation tested

## Related Documentation

- **Primary**: `docs/SPARLO-DESIGN-SYSTEM.md` (authoritative)
- **Architecture**: `docs/solutions/ui/aura-inspired-redesign.md`
- **Component Library**: `docs/solutions/ui/shared-component-library-extraction-20251223.md`
- **Archived**: `docs/archive/brand-identity.md.archived`

## Commits

- `ea20c5f` - Redesign signup page with Sparlo design system
- `5f9c31c` - Update signup page copy
