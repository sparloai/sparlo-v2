# Report Design Improvements: Apple x Palantir Aesthetic

## Overview

Redesign report rendering components to achieve a cleaner, more professional aesthetic inspired by Apple and Palantir design principles. The goal is bigger, bolder text with enhanced contrast, legibility, and a clean document feel.

## Problem Statement

Current report rendering has:
- H1 headers at `text-3xl` (too small for premium feel)
- Purplish/violet background hue instead of clean white
- Body text that's too small for comfortable reading
- `zinc-400` text on dark backgrounds (poor contrast)
- Inconsistent typography hierarchy lacking Apple-level polish

## Proposed Solution

Update typography scale, colors, and spacing across all report components to achieve a premium Apple x Palantir document aesthetic.

---

## Technical Approach

### Files to Modify

| File | Purpose | Changes |
|------|---------|---------|
| `apps/web/styles/report-tokens.css` | Design tokens | Update typography scale, remove purple gradients |
| `apps/web/app/home/(user)/reports/[id]/_components/discovery-report-display.tsx` | Discovery reports | Update all typography classes |
| `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx` | Hybrid reports | Update all typography classes |
| `apps/web/app/home/(user)/reports/[id]/_components/report/shared/section-header.tsx` | Section headers | Update to `text-3xl` |
| `packages/ui/src/aura/index.tsx` | Aura design system | Update shared component styling |

---

## Implementation Plan

### Phase 1: Background & Canvas

**Task 1.1: Remove purplish background hue**

**File:** `apps/web/styles/report-tokens.css`

Replace violet gradient overlays with pure white:

```css
/* BEFORE */
--void-gradient: linear-gradient(
  180deg,
  rgba(124, 58, 237, 0.03) 0%,
  transparent 30%
), var(--void-black);

/* AFTER */
--void-gradient: var(--void-black);
--void-black: #ffffff;
--void-deep: #ffffff;
```

**Acceptance Criteria:**
- [ ] Report background is pure white (#ffffff)
- [ ] No purple/violet tint visible
- [ ] Grid texture removed or made fully transparent

---

### Phase 2: H1 Header Typography & Metadata

**Task 2.1: Update main report header**

**File:** `apps/web/app/home/(user)/reports/[id]/_components/discovery-report-display.tsx`

```tsx
// BEFORE (line ~244)
<h1 className="mb-3 text-3xl font-bold text-zinc-900">

// AFTER
<h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 lg:text-5xl">
```

**Task 2.2: Remove "Sparlo Intelligence Briefing" header**

Remove the "Sparlo Intelligence Briefing" text that appears above the main title.

**Task 2.3: Add reading time and metadata row**

Add a metadata row beneath the H1 with date, time, and reading estimate:

```tsx
// After H1, add metadata row
<div className="mt-4 flex items-center gap-3 text-sm text-zinc-500">
  <span>12/23/2025</span>
  <span className="text-zinc-300">•</span>
  <span>16:33</span>
  <span className="text-zinc-300">•</span>
  <span>X min read</span>
</div>
```

**File:** `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`

Apply same patterns to hybrid report.

**Acceptance Criteria:**
- [ ] H1 renders at `text-4xl` (36px) on mobile
- [ ] H1 renders at `text-5xl` (48px) on lg screens (1024px+)
- [ ] Font weight is bold (700)
- [ ] Tracking is tight for large display text
- [ ] "Sparlo Intelligence Briefing" header is removed
- [ ] Metadata row shows: date • time • X min read
- [ ] Metadata is styled subtly (text-sm text-zinc-500)

---

### Phase 3: Section Headers

**Task 3.1: Update section headers to text-3xl**

**File:** `apps/web/app/home/(user)/reports/[id]/_components/report/shared/section-header.tsx`

```tsx
// BEFORE (line ~34)
<h2 className="text-2xl font-semibold text-zinc-900">{title}</h2>

// AFTER
<h2 className="text-3xl font-semibold tracking-tight text-zinc-900">{title}</h2>
```

**File:** `packages/ui/src/aura/index.tsx` - SectionHeader component

```tsx
// BEFORE
<h2 className="mb-3 text-2xl font-semibold tracking-tight text-zinc-950">

// AFTER
<h2 className="mb-3 text-3xl font-semibold tracking-tight text-zinc-950">
```

**Acceptance Criteria:**
- [ ] All section headers render at `text-3xl` (30px)
- [ ] Consistent across Discovery, Hybrid, and Aura components

---

### Phase 4: Card Headers (All Caps)

**Task 4.1: Update card all-caps headers to text-base**

**File:** `packages/ui/src/aura/index.tsx` - CardWithHeader, MonoLabel

```tsx
// BEFORE
<h3 className="font-mono text-xs font-bold tracking-widest text-zinc-600 uppercase">

// AFTER
<h3 className="font-mono text-base font-bold tracking-widest text-zinc-600 uppercase">
```

**File:** `apps/web/app/home/(user)/reports/[id]/_components/report/shared/cards/*.tsx`

Update all card header patterns from `text-xs` to `text-base`.

**Acceptance Criteria:**
- [ ] All-caps card labels render at `text-base` (16px)
- [ ] Tracking remains `tracking-widest` for all-caps legibility

---

### Phase 5: Contrast Fixes (zinc-400 on dark)

**Task 5.1: Replace zinc-400 with high-contrast alternatives**

Identify all instances of `text-zinc-400` on dark backgrounds and replace:

**File:** `packages/ui/src/aura/index.tsx` - DarkSection

```tsx
// BEFORE
<h4 className="mb-4 font-mono text-sm font-bold tracking-widest text-zinc-400 uppercase">

// AFTER
<h4 className="mb-4 font-mono text-sm font-bold tracking-widest text-zinc-100 uppercase">
```

**Rule:** On dark backgrounds (zinc-800, zinc-900, zinc-950, black):
- Replace `text-zinc-400` → `text-zinc-100` (primary)
- Replace `text-zinc-500` → `text-zinc-200` (secondary)
- Never use colors darker than `zinc-300` on dark backgrounds

**Acceptance Criteria:**
- [ ] All text on dark backgrounds meets WCAG AA contrast (4.5:1)
- [ ] No `zinc-400` or darker text on `zinc-800+` backgrounds
- [ ] Visual: Text is clearly legible, high contrast

---

### Phase 6: Specific Section Text Sizing

**Task 6.1: "What industry does" section - 2 sizes larger**

Locate the "What industry does" section and increase body text:

```tsx
// BEFORE (if text-sm/14px)
<p className="text-sm text-zinc-600">

// AFTER (2 sizes up: sm → base → lg)
<p className="text-lg text-zinc-700">
```

**Task 6.2: "Current state of the art" section - 2 sizes larger**

Same pattern - identify current size and bump up 2 levels on Tailwind scale.

**Task 6.3: "Constraints" section - 3 sizes larger**

```tsx
// BEFORE (if text-sm/14px)
<p className="text-sm text-zinc-600">

// AFTER (3 sizes up: sm → base → lg → xl)
<p className="text-xl text-zinc-700">
```

**Acceptance Criteria:**
- [ ] Industry section text is 2 Tailwind sizes larger than current
- [ ] State of the art text is 2 Tailwind sizes larger than current
- [ ] Constraints text is 3 Tailwind sizes larger than current

---

### Phase 7: Body Text Baseline

**Task 7.1: Ensure minimum 14px, target 18px for body text**

Update all body text to use `text-lg` (18px) for Apple feel:

**File:** `apps/web/styles/report-tokens.css`

```css
/* Update base body text size */
--text-body: 18px;
--text-body-line-height: 1.7;
```

**Pattern for all report components:**

```tsx
// Standard body paragraphs
<p className="text-lg leading-relaxed text-zinc-700">

// Secondary/supporting text (minimum 14px)
<p className="text-sm text-zinc-600">  /* 14px - minimum acceptable */
```

**Acceptance Criteria:**
- [ ] Primary body text is 18px (`text-lg`)
- [ ] No body text smaller than 14px (`text-sm`)
- [ ] Line height is relaxed (1.625-1.7) for comfortable reading

---

### Phase 8: Additional Apple x Palantir Refinements

Based on senior UX/UI design lead perspective, these additional changes enhance the premium feel:

**Task 8.1: Increase overall spacing**

Larger text needs more breathing room:

```tsx
// Section spacing
className="mb-12"  // was mb-8

// Card internal padding
className="p-8"    // was p-6

// Between paragraphs
className="space-y-6"  // was space-y-4
```

**Task 8.2: Enhance font weight hierarchy**

```
H1:              font-bold (700)
Section Headers: font-semibold (600)
Card Headers:    font-bold (700)
Body Text:       font-normal (400)
Emphasis:        font-medium (500)
```

**Task 8.3: Tighten letter-spacing on large headers**

```tsx
// H1 and large display text
className="tracking-tight"  // -0.025em

// All-caps labels
className="tracking-widest" // 0.1em
```

**Task 8.4: Increase text color contrast**

On white backgrounds, shift darker:
- Body text: `text-zinc-600` → `text-zinc-700`
- Headings: `text-zinc-900` (keep)
- Secondary: `text-zinc-500` → `text-zinc-600`

---

## Typography Scale Summary

| Element | Current | New | Line Height |
|---------|---------|-----|-------------|
| H1 (Page Title) | text-3xl | text-4xl lg:text-5xl | 1.1-1.2 |
| Section Headers | text-2xl | text-3xl | 1.3 |
| Card Headers (all-caps) | text-xs | text-base | 1.5 |
| Body Text | text-base (16px) | text-lg (18px) | 1.7 |
| Secondary Text | text-sm | text-sm (14px min) | 1.5 |
| Labels | text-xs | text-xs (12px) | 1.4 |

---

## Color System Summary

| Context | Text Color | Notes |
|---------|------------|-------|
| White/light background | zinc-900 (headings), zinc-700 (body) | High contrast |
| Dark background (zinc-800+) | zinc-50/white (headings), zinc-100 (body) | Never zinc-400 or darker |
| Background | #ffffff | Pure white, no purple tint |

---

## Acceptance Criteria (Global)

### Typography
- [ ] H1 is text-4xl on mobile, text-5xl on lg+ screens
- [ ] Section headers are text-3xl
- [ ] Card all-caps headers are text-base
- [ ] Body text is 18px (text-lg)
- [ ] No text smaller than 14px

### Colors & Contrast
- [ ] Background is pure white (#ffffff)
- [ ] No purplish hue anywhere
- [ ] All text on dark backgrounds is zinc-200 or lighter
- [ ] WCAG AA contrast compliance (4.5:1 for normal text)

### Specific Sections
- [ ] "What industry does" body text is 2 sizes larger
- [ ] "Current state of the art" text is 2 sizes larger
- [ ] "Constraints" text is 3 sizes larger

### Feel
- [ ] Overall aesthetic feels premium, clean, Apple-inspired
- [ ] Typography hierarchy is clear and professional
- [ ] Generous whitespace and breathing room
- [ ] Sohne font is used throughout with appropriate weights

---

## Testing Plan

1. **Visual Regression**
   - Screenshot Discovery report before/after
   - Screenshot Hybrid report before/after
   - Compare at mobile, tablet, desktop breakpoints

2. **Accessibility**
   - Run WAVE or axe DevTools on all report pages
   - Verify contrast ratios meet WCAG AA
   - Test with browser zoom at 200%

3. **Cross-Browser**
   - Chrome, Safari, Firefox on desktop
   - iOS Safari, Android Chrome on mobile

4. **Responsive**
   - Test at 320px, 768px, 1024px, 1440px widths
   - Verify H1 breakpoint transition at lg (1024px)

---

## References

### Internal Files
- `apps/web/styles/report-tokens.css` - Design tokens
- `apps/web/styles/report-base.css` - Base typography
- `apps/web/app/home/(user)/reports/[id]/_components/discovery-report-display.tsx:244` - H1 header
- `apps/web/app/home/(user)/reports/[id]/_components/report/shared/section-header.tsx:34` - Section headers
- `packages/ui/src/aura/index.tsx` - Aura design system

### Design Principles
- Apple Human Interface Guidelines - Typography
- WCAG 2.1 Contrast Guidelines (4.5:1 AA standard)
- Tailwind CSS Typography best practices
