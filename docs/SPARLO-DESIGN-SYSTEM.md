# Sparlo Design System

> **Air Company Aesthetic - Technical Monograph, Not AI Tool**

Sparlo's design language positions us as **research infrastructure** rather than just another AI tool. Confidence through restraint. Typography-driven hierarchy with near-monochrome palette. Semantic color on text only—never decorative.

---

## Core Principles

1. **Near-Monochrome First** - Color is earned, not decorative
2. **Typography-Driven Hierarchy** - Size and weight create structure, not color
3. **Purposeful Restraint** - Every element justifies its existence
4. **Technical Confidence** - Clean, precise, professional

---

## Color Palette

### Primary Palette (Near-Monochrome)

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `ink` | `#09090b` | `zinc-950` | Primary text, borders, accents |
| `secondary` | `#3f3f46` | `zinc-700` | Secondary text |
| `muted` | `#71717a` | `zinc-500` | Tertiary text |
| `subtle` | `#a1a1aa` | `zinc-400` | Quaternary text |

### Surfaces

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `surface` | `#ffffff` | `white` | Card backgrounds |
| `surface-subtle` | `#fafafa` | `zinc-50` | Page backgrounds |
| `surface-muted` | `#f4f4f5` | `zinc-100` | Subtle fills, hover states |
| `surface-emphasis` | `#18181b` | `zinc-900` | Dark sections, CTAs |

### Borders

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `line` | `#e4e4e7` | `zinc-200` | Default borders |
| `line-subtle` | `#f4f4f5` | `zinc-100` | Subtle dividers |
| `line-emphasis` | `#27272a` | `zinc-800` | Dark borders |

### Semantic Colors (Text Only)

Use these **only on text**, never as decorative backgrounds.

| Status | Text Color | Dot/Icon | Usage |
|--------|------------|----------|-------|
| Success | `text-zinc-900` | `bg-zinc-900` | Complete states |
| Warning | `text-zinc-600` | `bg-amber-500` | Needs attention |
| Error | `text-zinc-500` | `bg-zinc-400` | Failed states |
| Processing | `text-zinc-500` | `bg-zinc-500 animate-pulse` | In progress |
| Inactive | `text-zinc-400` | `bg-zinc-300` | Cancelled, archived |

### Accent (CTAs Only)

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `accent` | `#18181b` | `zinc-900` | Primary buttons |
| `accent-hover` | `#27272a` | `zinc-800` | Button hover |
| `accent-alt` | `#7c3aed` | `violet-600` | Landing page CTAs only |

---

## Typography

### Font Families

```css
--font-heading: 'Suisse Intl', system-ui, sans-serif;
--font-body: 'Suisse Intl', system-ui, sans-serif;
--font-mono: 'Söhne Mono', 'JetBrains Mono', monospace;
```

### Type Scale

| Name | Size | Weight | Line Height | Tracking | Usage |
|------|------|--------|-------------|----------|-------|
| Display | 56px | 600 | 1.1 | -0.02em | Report titles only |
| Headline | 36px | 600 | 1.2 | -0.02em | Section headers |
| Title | 28px | 600 | 1.3 | -0.01em | Card titles |
| Page Title | 42px | 400 | 1.2 | -0.02em | Page headings (New Analysis style) |
| Subtitle | 22px | 500 | 1.4 | 0 | Key insights |
| Body Large | 20px | 400 | 1.6 | 0 | Lead paragraphs |
| **Body** | **18px** | **400** | **1.3** | **-0.02em** | **Primary text (baseline)** |
| Body Small | 15px | 400 | 1.5 | 0 | Secondary text |
| Caption | 13px | 500 | 1.5 | 0 | Metadata, timestamps |
| Label | 13px | 600 | 1.3 | 0.06em | Section labels (uppercase) |
| Micro | 11px | 600 | 1.3 | 0.08em | Overlines |

### Typography Classes

```tsx
// Page Title (New Analysis style)
className="font-heading text-[42px] font-normal tracking-[-0.02em] text-zinc-900"

// Section Title
className="text-[36px] font-semibold tracking-tight text-zinc-900"

// Body Text (Primary)
className="text-[18px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]"

// Mono Label (uppercase labels)
className="text-[13px] font-semibold tracking-[0.06em] uppercase text-zinc-500"

// Caption/Metadata
className="text-[13px] tracking-[-0.02em] text-zinc-400"
```

---

## Signature Patterns

### Left Border Accent

The signature visual element of the Sparlo design system. Creates structure and visual anchor.

```tsx
// Standard (content areas)
className="border-l-2 border-zinc-900 pl-10"

// Heavy (section headers)
className="border-l-4 border-zinc-900 pl-6"

// Light (secondary content)
className="border-l-2 border-zinc-200 pl-6"
```

**Usage:**
- New Analysis textarea container
- Report section headers
- Card accents
- Article blocks

### Card Pattern

```tsx
// Standard Card
<div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
  {/* Card Header (optional) */}
  <div className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-4">
    <span className="text-[13px] font-semibold tracking-[0.06em] uppercase text-zinc-500">
      {label}
    </span>
  </div>
  {/* Card Body */}
  <div className="p-8 sm:p-10">
    {children}
  </div>
</div>
```

### Section Header Pattern

```tsx
<div className="mb-10 border-l-4 border-zinc-950 pl-6 py-1">
  <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 mb-3">
    {title}
  </h2>
  <p className="text-lg text-zinc-600 font-normal leading-relaxed max-w-4xl">
    {subtitle}
  </p>
</div>
```

---

## Components

### Buttons

```tsx
// Primary (dark)
<button className="bg-zinc-900 px-8 py-4 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800">
  Run Analysis
</button>

// Secondary (outline)
<button className="border border-zinc-300 px-6 py-3 text-[15px] font-medium text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900">
  Cancel
</button>

// Ghost
<button className="text-[14px] text-zinc-500 transition-colors hover:text-zinc-700">
  Back
</button>

// Icon Button
<span className="flex h-5 w-5 items-center justify-center rounded border border-zinc-300 transition-all group-hover:border-zinc-900 group-hover:bg-zinc-900 group-hover:text-white">
  <Plus className="h-3 w-3" />
</span>
```

### Status Indicators

```tsx
// Status Dot
<div className={cn(
  'h-1.5 w-1.5 rounded-full',
  status === 'complete' && 'bg-zinc-900',
  status === 'processing' && 'bg-zinc-500 animate-pulse',
  status === 'clarifying' && 'bg-amber-500 animate-pulse',
  status === 'failed' && 'bg-zinc-400',
  status === 'cancelled' && 'bg-zinc-300',
)} />

// Status Label
<span className="text-[13px] font-medium tracking-[0.06em] uppercase text-zinc-500">
  {statusLabel}
</span>
```

### Search Input

```tsx
<div className="group relative">
  <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 transition-colors group-focus-within:text-zinc-600" />
  <input
    type="text"
    placeholder="Search..."
    className="w-full border-b border-zinc-200 bg-transparent py-3 pl-7 pr-4 text-[16px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none transition-colors"
  />
</div>
```

### Detection Indicators

Used in New Analysis to show detected patterns:

```tsx
<div className="flex items-center gap-2">
  <div className={cn(
    'h-1.5 w-1.5 rounded-full transition-colors duration-300',
    detected ? 'bg-zinc-900' : 'bg-zinc-300',
  )} />
  <span className={cn(
    'text-[13px] tracking-[-0.02em] transition-colors duration-300',
    detected ? 'text-zinc-700' : 'text-zinc-400',
  )}>
    {label}
  </span>
</div>
```

---

## Layout

### Container Widths

| Name | Max Width | Usage |
|------|-----------|-------|
| Reading | `max-w-3xl` (768px) | Forms, input pages |
| Content | `max-w-4xl` (896px) | Lists, dashboards |
| Wide | `max-w-5xl` (1024px) | Reports |
| Full | `max-w-7xl` (1280px) | Landing pages |

### Page Structure

```tsx
// Standard page (New Analysis style)
<main className="min-h-screen bg-white">
  <div className="mx-auto max-w-3xl px-8 pt-24 pb-16">
    {/* Back link */}
    <Link href="/home" className="mb-6 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600">
      <ArrowLeft className="h-3.5 w-3.5" />
      Dashboard
    </Link>

    {/* Page title */}
    <h1 className="font-heading text-[42px] font-normal tracking-[-0.02em] text-zinc-900 mb-12">
      Page Title
    </h1>

    {/* Content with left border */}
    <div className="border-l-2 border-zinc-900 pl-10">
      {children}
    </div>
  </div>
</main>
```

### Spacing Scale

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| Section | 96px | `mt-24` | Between major sections |
| Subsection | 40px | `mt-10` | Within sections |
| Card padding | 32-40px | `p-8 sm:p-10` | Inside cards |
| Element | 16-24px | `gap-4` to `gap-6` | Between elements |

---

## Animation

### Timing

```ts
const DURATION = {
  fast: 0.15,    // 150ms - micro interactions
  normal: 0.25,  // 250ms - standard transitions
  slow: 0.4,     // 400ms - page transitions
};

const EASING = {
  easeOut: [0.16, 1, 0.3, 1],      // Weighted, purposeful
  easeInOut: [0.65, 0, 0.35, 1],   // Smooth
};
```

### Transitions

```tsx
// Standard hover
className="transition-colors duration-200"

// Card hover
className="transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-50"

// Focus ring
className="focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
```

### Respect Motion Preferences

```tsx
import { usePrefersReducedMotion } from '@kit/ui/hooks';

const prefersReducedMotion = usePrefersReducedMotion();
if (prefersReducedMotion) {
  // Disable animations
}
```

---

## Primitives (Component Library)

Import from: `app/home/(user)/reports/[id]/_components/brand-system/primitives.tsx`

### Available Primitives

| Component | Props | Usage |
|-----------|-------|-------|
| `SectionTitle` | `size: 'xl' \| 'lg' \| 'md'` | Section headings |
| `SectionSubtitle` | - | Subheadings |
| `MonoLabel` | `variant: 'default' \| 'muted' \| 'strong'` | Uppercase labels |
| `BodyText` | `size: 'lg' \| 'md' \| 'sm'`, `variant: 'primary' \| 'secondary' \| 'muted'` | Body copy |
| `Section` | `id` | Section wrapper with spacing |
| `ArticleBlock` | `variant: 'bordered' \| 'plain'` | Content blocks |
| `ContentBlock` | `withBorder` | Sub-sections |
| `AccentBorder` | `weight: 'light' \| 'medium' \| 'heavy'` | Left border accent |
| `HighlightBox` | `variant: 'subtle' \| 'strong'` | Callout boxes |
| `SeverityIndicator` | `severity: 'high' \| 'medium' \| 'low'` | Risk indicators |
| `ConstraintList` | `variant: 'hard' \| 'soft' \| 'assumption'` | Constraint lists |
| `NumberedItem` | `index` | Numbered list items |
| `MetadataGrid` | `items: {label, value}[]` | Inline metadata |

---

## Dark Mode

Use semantic color classes for automatic dark mode support:

```tsx
// Good - semantic (auto dark mode)
className="bg-background text-foreground border-border"

// Avoid - hardcoded (no dark mode)
className="bg-white text-black border-gray-200"
```

### Dark Mode Overrides

```tsx
// When explicit control needed
className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
```

---

## Accessibility

### Contrast Requirements

- Normal text: 4.5:1 minimum (WCAG AA)
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

### Focus States

```tsx
// All interactive elements
className="focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
```

### Screen Reader

- Use `aria-label` for icon-only buttons
- Announce status changes with `aria-live="polite"`
- Provide text alternatives for status colors

---

## File References

| File | Purpose |
|------|---------|
| `docs/brand-system/tailwind.config.js` | Design token definitions |
| `docs/brand-system/globals.css` | Global style overrides |
| `apps/web/styles/sparlo-tokens.css` | CSS custom properties |
| `apps/web/app/home/(user)/reports/[id]/_components/brand-system/primitives.tsx` | Component primitives |
| `apps/web/app/home/(user)/_lib/animation-constants.ts` | Animation timing |

---

## Quick Reference

### Most Common Patterns

```tsx
// Page title
className="font-heading text-[42px] font-normal tracking-[-0.02em] text-zinc-900"

// Body text
className="text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-900"

// Label
className="text-[13px] font-semibold tracking-[0.06em] uppercase text-zinc-500"

// Left border accent
className="border-l-2 border-zinc-900 pl-10"

// Primary button
className="bg-zinc-900 px-8 py-4 text-[15px] font-medium text-white hover:bg-zinc-800"

// Card
className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm"

// Hover state
className="transition-colors hover:bg-zinc-50"

// Metadata text
className="text-[13px] tracking-[-0.02em] text-zinc-400"
```
