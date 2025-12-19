---
status: ready
priority: p2
issue_id: "053"
tags: [performance, animation, css, framer-motion]
dependencies: []
---

# TOC Sidebar Animates Width Property (Causes Reflow)

## Problem Statement

The Table of Contents sidebar toggle animation uses `width` property changes, which triggers expensive layout recalculations (reflow) on every animation frame. This causes stuttering on slower devices.

## Findings

**File:** `/apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`
**Lines:** 365-409

```typescript
// Current implementation causing reflow:
<motion.aside
  initial={{ opacity: 0, width: 0 }}
  animate={{ opacity: 1, width: 256 }}
  exit={{ opacity: 0, width: 0 }}
>
```

**Performance Review findings:**
- Animating `width` causes layout recalculation every frame
- Impact: 16-20ms per frame during animation
- Results in stuttering on slower devices
- Should use transform-based animation instead

## Proposed Solutions

### Option 1: Transform-Based Animation

**Approach:** Use `translateX` instead of `width` for sidebar animation.

```typescript
<motion.aside
  initial={{ opacity: 0, x: -256 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -256 }}
  className="absolute left-0 w-64"  // Fixed width, positioned absolutely
>
```

**Pros:**
- GPU-accelerated (no reflow)
- Smooth 60fps on all devices
- Standard animation best practice

**Cons:**
- Requires layout restructuring
- Sidebar needs absolute positioning

**Effort:** 2-3 hours

**Risk:** Low

---

### Option 2: CSS-Only Slide Animation

**Approach:** Use CSS transforms with `overflow: hidden` wrapper.

```css
.toc-sidebar {
  transform: translateX(0);
  transition: transform 200ms ease;
}
.toc-sidebar[data-hidden="true"] {
  transform: translateX(-100%);
}
```

**Pros:**
- No JS animation library needed
- Pure CSS, simpler

**Cons:**
- Less control over animation
- No spring physics

**Effort:** 1-2 hours

**Risk:** Low

## Recommended Action

Implement Option 1 - use transform-based animation with Framer Motion. This maintains the spring animation feel while achieving 60fps performance.

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx:365-409`

**Layout changes needed:**
- Sidebar positioned absolutely or use CSS Grid
- Main content area doesn't resize (padding/margin instead)

## Acceptance Criteria

- [ ] Sidebar animation uses transform, not width
- [ ] Animation runs at 60fps (Chrome DevTools verification)
- [ ] No layout shift during animation
- [ ] Spring physics feel preserved
- [ ] Works correctly on mobile viewports

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Performance Review Agent)

**Actions:**
- Identified width animation as performance bottleneck
- Measured 16-20ms reflow cost per frame
- Proposed transform-based alternatives

**Learnings:**
- Avoid animating layout properties (width, height, top, left)
- Use transform and opacity for performant animations
- GPU-accelerated properties: transform, opacity, filter
