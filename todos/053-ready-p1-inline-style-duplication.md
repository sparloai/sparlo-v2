---
status: ready
priority: p1
issue_id: "053"
tags: [css, duplication, design-system, dark-mode]
dependencies: ["051"]
---

# Duplicated Inline Shadow Style

## Problem Statement

The exact same inline style for box-shadow is duplicated across 3 files. This violates DRY principle, doesn't use design tokens, and won't respect dark mode properly.

**Maintenance Impact:** Changes require updating 3 files; dark mode colors hardcoded.

## Findings

- **Files with duplicate:**
  - `apps/web/app/home/(user)/page.tsx` (line 75)
  - `apps/web/app/home/(user)/_components/processing-screen.tsx` (line 237)
  - `apps/web/app/home/(user)/reports/new/page.tsx` (line 231)

**Duplicated code:**
```typescript
style={{ boxShadow: '0 4px 14px -2px rgba(139, 92, 246, 0.4)' }}
```

**Problems:**
1. Same value in 3 places
2. Hardcoded RGB color (violet)
3. No dark mode variant
4. Not using CSS custom properties

**Reviewers identifying this:**
- Pattern Recognition: P1 - Inline Shadow Duplication
- Code Simplicity: P2 - Magic values in inline styles

## Proposed Solutions

### Option 1: Add to Design Tokens

**Approach:** Add shadow as CSS custom property.

```css
/* sparlo-tokens.css */
:root {
  --shadow-accent: 0 4px 14px -2px rgba(139, 92, 246, 0.4);
}

.dark {
  --shadow-accent: 0 4px 14px -2px rgba(139, 92, 246, 0.6); /* Brighter in dark */
}
```

**Usage:**
```tsx
<button className="shadow-[var(--shadow-accent)]">
```

**Pros:**
- Single source of truth
- Dark mode support
- Uses design system

**Cons:**
- Tailwind arbitrary value syntax verbose

**Effort:** 30 minutes

**Risk:** Very Low

---

### Option 2: Create Tailwind Utility Class

**Approach:** Define custom utility in Tailwind config or CSS.

```css
/* globals.css */
@layer utilities {
  .shadow-accent {
    box-shadow: 0 4px 14px -2px var(--sparlo-violet-glow);
  }
}
```

**Usage:**
```tsx
<button className="shadow-accent">
```

**Pros:**
- Clean class name
- Consistent with Tailwind patterns
- Easy to use

**Cons:**
- Another abstraction layer

**Effort:** 30 minutes

**Risk:** Very Low

---

### Option 3: Component Prop

**Approach:** Add shadow prop to Button component.

```tsx
<Button variant="accent" shadow>
```

**Pros:**
- Semantic usage
- Type-safe

**Cons:**
- Over-engineered for one shadow
- Component API change

**Effort:** 1 hour

**Risk:** Low

## Recommended Action

Implement Option 1 (design tokens) first, then Option 2 (utility class):

1. Add `--shadow-accent` to `sparlo-tokens.css` with light/dark variants
2. Create `.shadow-accent` utility class
3. Update all 3 files to use utility class
4. Remove inline styles

## Technical Details

**Files to update:**
- `apps/web/styles/sparlo-tokens.css` - add token
- `apps/web/styles/globals.css` - add utility class
- `apps/web/app/home/(user)/page.tsx` - replace inline style
- `apps/web/app/home/(user)/_components/processing-screen.tsx` - replace inline style
- `apps/web/app/home/(user)/reports/new/page.tsx` - replace inline style

**Token definition:**
```css
:root {
  --sparlo-violet-glow: rgba(139, 92, 246, 0.4);
  --shadow-accent: 0 4px 14px -2px var(--sparlo-violet-glow);
}

.dark {
  --sparlo-violet-glow: rgba(167, 139, 250, 0.5);
}
```

## Acceptance Criteria

- [ ] Shadow token added to design system
- [ ] Dark mode variant defined
- [ ] Utility class created
- [ ] All 3 files updated to use class
- [ ] No inline shadow styles remain
- [ ] Visual appearance unchanged in light mode
- [ ] Dark mode shadow appropriately visible

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Parallel Review Agents)

**Actions:**
- Identified by Pattern Recognition reviewer
- Found exact duplicates in 3 files
- Documented token-based solution

**Learnings:**
- Inline styles are a code smell for repeated values
- Design tokens enable dark mode "for free"
- Shadow opacity often needs adjustment for dark backgrounds
