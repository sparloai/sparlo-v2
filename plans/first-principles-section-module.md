# First Principles Section Module

## Overview

Implement the "First Principles" landing page section for Sparlo - a premium, typography-driven component that showcases how Sparlo reframes industry assumptions. The design direction is "Research Lab at Night" - Bloomberg Terminal meets Air Company aesthetic with atmospheric depth and confident negative space.

**Key Insight**: The spec provides CSS modules but this project uses **Tailwind CSS 4 exclusively** with Framer Motion for animations. This plan adapts the spec to match the project's established patterns.

## Problem Statement / Motivation

Sparlo's landing page needs to convey deep tech credibility and intellectual rigor—differentiated from generic AI products. This section demonstrates the platform's core value proposition: questioning assumptions and reframing problems.

The component must:
- Feel like "late night in a well-funded research lab" - focused, quiet, premium
- Let the reframe insight land through restraint, not loudness
- Maintain information density while using generous whitespace

## Technical Approach

### Tech Stack (Project Conventions)
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS 4 (NOT CSS modules)
- **Animation**: Framer Motion with `whileInView`
- **Fonts**: Suisse Intl (`font-sans`) + SuisseIntlMono (`font-mono`) - already configured
- **Component Type**: Client Component (`'use client'`) for Framer Motion animations

### File Location
```
apps/web/app/(marketing)/_components/first-principles.tsx
```

### Design System Reference
- **Authoritative Guide**: `docs/SPARLO-DESIGN-SYSTEM.md`
- **Font Config**: `apps/web/lib/fonts.ts`
- **Design Tokens**: `apps/web/styles/sparlo-tokens.css`

## Proposed Solution

### Component Structure

```tsx
// apps/web/app/(marketing)/_components/first-principles.tsx
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@kit/ui/utils';

interface FirstPrinciplesProps {
  constraints?: {
    hard: number;
    negotiable: number;
    assumed: number;
  };
  assumption?: {
    text: string;
    classification: string;
    explanation: string;
  };
  reframe?: {
    question: string;
    statement: string;
    unlocks: string[];
  };
  className?: string;
}
```

### Visual Hierarchy (Top to Bottom)

1. **Header Row**: "FIRST PRINCIPLES" label + "~5 min" time estimate
2. **Question**: "Are we solving the right problem?" (light weight, breathing room)
3. **Constraint Map**: "3 hard · 2 negotiable · 1 assumed" (monospace, dimmed)
4. **Output Card** containing:
   - Industry Assumption block (quoted, subtle left border)
   - Arrow (↓) - dimmed, generous margin
   - Classification block (verdict + explanation)
   - Arrow (↓)
   - **Reframe block** (hero moment - gold left border, elevated background)
     - "REFRAME" label (gold accent)
     - Question: "What if survival doesn't matter?"
     - Statement: core reframe insight
     - "THIS UNLOCKS" with 3 implications

### Color Palette (Adapted to Tailwind)

| Spec Color | Tailwind Equivalent | Usage |
|------------|---------------------|-------|
| `#0a0a0a` | `bg-zinc-950` | Section background |
| `#f0f0f0` | `text-zinc-100` | Primary text |
| `#999999` | `text-zinc-400` | Secondary text |
| `#555555` | `text-zinc-500` | Dimmed text |
| `#333333` | `text-zinc-600` | Very dimmed (arrows) |
| `#c9a861` | Custom `text-[#c9a861]` | Gold accent (REFRAME label, border) |

### Typography Scale

| Element | Tailwind Classes |
|---------|------------------|
| Section label | `font-sans text-[11px] font-medium tracking-[0.08em] uppercase text-zinc-400` |
| Time estimate | `font-mono text-[11px] tracking-tight text-zinc-500` |
| Question | `font-sans text-[28px] md:text-[32px] font-light tracking-tight text-zinc-100` |
| Constraint map | `font-mono text-[11px] text-zinc-500` |
| Assumption quote | `font-sans text-[18px] text-zinc-400` |
| Classification text | `font-sans text-[15px] text-zinc-400 leading-relaxed` |
| Reframe question | `font-sans text-[24px] md:text-[26px] font-normal text-zinc-100` |
| Reframe statement | `font-sans text-[16px] text-zinc-400 leading-relaxed` |
| Unlock items | `font-sans text-[15px] text-zinc-400 leading-relaxed` |

### Spacing System

Following project conventions (generous breathing room):
- Section padding: `py-24 md:py-32 px-6 md:px-16`
- Header to question: `mb-10 md:mb-12`
- Question to constraint map: `mb-14 md:mb-16`
- Output card padding: `p-8 md:p-14`
- Arrow margins: `my-10`
- Reframe block padding: `p-10 md:p-12`

### Animation Strategy

**Approach**: Simple fade-in with Framer Motion, respecting `prefers-reduced-motion`

```tsx
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Usage with reduced motion support
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-100px' }}
  variants={fadeInUp}
  className="motion-reduce:transform-none motion-reduce:opacity-100"
>
```

### Hover State (Reframe Block)

```tsx
// Subtle hover effect - background lightens slightly
className="transition-colors duration-300 hover:bg-white/[0.035]"
```

On mobile/touch: No special touch interaction needed (hover gracefully degrades).

## Implementation Steps

### Phase 1: Component Foundation

- [ ] Create `apps/web/app/(marketing)/_components/first-principles.tsx`
- [ ] Set up props interface with TypeScript
- [ ] Implement default props with sample content
- [ ] Add basic section structure with dark background

### Phase 2: Visual Structure

- [ ] Header row with label + time estimate
- [ ] Question with proper typography
- [ ] Constraint map display
- [ ] Output card container with subtle border
- [ ] Assumption block with left border accent
- [ ] Arrow elements (↓) with proper spacing
- [ ] Classification block
- [ ] Reframe block with gold left border
- [ ] "THIS UNLOCKS" section with list items

### Phase 3: Styling & Polish

- [ ] Apply atmospheric gradient background
- [ ] Fine-tune all typography (sizes, weights, tracking)
- [ ] Adjust spacing for generous breathing room
- [ ] Verify color contrast (WCAG AA compliance)
- [ ] Add reframe block hover state

### Phase 4: Animation & Accessibility

- [ ] Add Framer Motion fade-in animations
- [ ] Implement staggered animation for child elements
- [ ] Add `prefers-reduced-motion` support via Tailwind `motion-reduce:`
- [ ] Ensure semantic HTML structure (`<section>`, proper headings)
- [ ] Add `aria-hidden="true"` to decorative arrows

### Phase 5: Responsive & Integration

- [ ] Test responsive behavior (mobile, tablet, desktop)
- [ ] Adjust font sizes and spacing for mobile
- [ ] Import and add to landing page (`apps/web/app/(marketing)/page.tsx`)
- [ ] Final visual review against spec

## Acceptance Criteria

### Functional Requirements
- [ ] Component renders with default props when no props provided
- [ ] All text content is configurable via props
- [ ] Constraint numbers display correctly (handles 0 gracefully)
- [ ] Unlock items render as a list regardless of array length

### Visual Requirements
- [ ] Dark background (#0a0a0a / zinc-950) with atmospheric gradient
- [ ] Gold accent (#c9a861) appears ONLY on REFRAME label and left border
- [ ] Typography uses Suisse Intl (font-sans) and SuisseIntlMono (font-mono)
- [ ] Generous whitespace - content "breathes"
- [ ] Left borders: subtle white/10 for assumption, gold for reframe
- [ ] Reframe block has hover state (background lightens)

### Accessibility Requirements
- [ ] WCAG AA color contrast compliance (4.5:1 for body text)
- [ ] Semantic HTML with proper heading hierarchy
- [ ] `prefers-reduced-motion` respected (animations disabled)
- [ ] Decorative elements marked with `aria-hidden`

### Performance Requirements
- [ ] Client component only where needed (Framer Motion)
- [ ] No unnecessary re-renders (use `memo`)
- [ ] CSS animations use transform/opacity only (GPU-accelerated)

## Code Skeleton

```tsx
// apps/web/app/(marketing)/_components/first-principles.tsx
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@kit/ui/utils';

interface FirstPrinciplesProps {
  constraints?: { hard: number; negotiable: number; assumed: number };
  assumption?: { text: string; classification: string; explanation: string };
  reframe?: { question: string; statement: string; unlocks: string[] };
  className?: string;
}

const defaultProps = {
  constraints: { hard: 3, negotiable: 2, assumed: 1 },
  assumption: {
    text: 'Electrodes must survive 5+ years in seawater',
    classification: 'ASSUMED',
    explanation: 'Inherited from chlor-alkali plants operating with purified brine. Never validated for seawater.',
  },
  reframe: {
    question: 'What if survival doesn\'t matter?',
    statement: 'Optimize for $/kg-NaOH-lifetime, not component longevity.',
    unlocks: [
      'Modular cartridge electrodes designed for 6-12 month replacement instead of 5-year survival',
      'Simpler materials (carbon, nickel) vs exotic alloys',
      'Design philosophy shifts from "prevent degradation" to "make replacement cheap and fast"',
    ],
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const FirstPrinciples = memo(function FirstPrinciples({
  constraints = defaultProps.constraints,
  assumption = defaultProps.assumption,
  reframe = defaultProps.reframe,
  className,
}: FirstPrinciplesProps) {
  return (
    <section
      className={cn(
        'relative bg-zinc-950 px-6 py-24 md:px-16 md:py-32',
        className,
      )}
    >
      {/* Atmospheric gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 100% 70% at 50% 0%, rgba(25, 25, 25, 1) 0%, rgba(10, 10, 10, 1) 100%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="mb-10 flex items-baseline justify-between motion-reduce:transform-none motion-reduce:opacity-100"
        >
          <h2 className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">
            First Principles
          </h2>
          <span className="font-mono text-[11px] tracking-tight text-zinc-500">
            ~5 min
          </span>
        </motion.div>

        {/* Question */}
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="mb-14 max-w-xl font-sans text-[28px] font-light leading-tight tracking-tight text-zinc-100 md:text-[32px] motion-reduce:transform-none motion-reduce:opacity-100"
        >
          Are we solving the right problem?
        </motion.p>

        {/* Constraint Map */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="mb-10 flex gap-2 font-mono text-[11px] text-zinc-500 motion-reduce:transform-none motion-reduce:opacity-100"
        >
          <span>{constraints.hard} hard</span>
          <span className="text-zinc-600">·</span>
          <span>{constraints.negotiable} negotiable</span>
          <span className="text-zinc-600">·</span>
          <span>{constraints.assumed} assumed</span>
        </motion.div>

        {/* Output Card */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="rounded-sm border border-white/[0.04] bg-white/[0.015] p-8 md:p-14 motion-reduce:transform-none motion-reduce:opacity-100"
        >
          {/* Assumption Block */}
          <div className="rounded-sm border-l border-white/[0.08] bg-white/[0.02] py-6 pl-8 pr-6">
            <span className="mb-3 block font-mono text-[10px] font-medium uppercase tracking-[0.04em] text-zinc-500">
              Industry Assumption
            </span>
            <p className="font-sans text-[18px] text-zinc-400">
              "{assumption.text}"
            </p>
          </div>

          {/* Arrow */}
          <div
            className="my-10 pl-8 text-[14px] text-zinc-600 opacity-50"
            aria-hidden="true"
          >
            ↓
          </div>

          {/* Classification Block */}
          <div className="pl-8">
            <span className="mb-3 block font-mono text-[10px] font-medium uppercase tracking-[0.04em] text-zinc-500">
              Classified:{' '}
              <span className="text-zinc-400">{assumption.classification}</span>
            </span>
            <p className="max-w-lg font-sans text-[15px] leading-relaxed text-zinc-400">
              {assumption.explanation}
            </p>
          </div>

          {/* Arrow */}
          <div
            className="my-10 pl-8 text-[14px] text-zinc-600 opacity-50"
            aria-hidden="true"
          >
            ↓
          </div>

          {/* Reframe Block */}
          <div className="rounded-sm border-l-2 border-[#c9a861] bg-white/[0.025] p-10 transition-colors duration-300 hover:bg-white/[0.035] md:p-12">
            <span className="mb-4 block font-mono text-[10px] font-medium uppercase tracking-[0.04em] text-[#c9a861]">
              Reframe
            </span>
            <h3 className="mb-4 font-sans text-[24px] font-normal leading-tight tracking-tight text-zinc-100 md:text-[26px]">
              {reframe.question}
            </h3>
            <p className="max-w-lg font-sans text-[16px] leading-relaxed text-zinc-400">
              {reframe.statement}
            </p>

            {/* This Unlocks */}
            <div className="mt-10">
              <span className="mb-4 block font-mono text-[10px] font-medium uppercase tracking-[0.04em] text-zinc-500">
                This Unlocks
              </span>
              <ul className="space-y-3">
                {reframe.unlocks.map((item, i) => (
                  <li
                    key={i}
                    className="relative pl-4 font-sans text-[15px] leading-relaxed text-zinc-400"
                  >
                    <span
                      className="absolute left-0 text-zinc-500"
                      aria-hidden="true"
                    >
                      ·
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

export default FirstPrinciples;
```

## Success Metrics

1. **Visual Fidelity**: Component matches "Research Lab at Night" aesthetic - feels like Air Company at night
2. **The Reframe Lands**: The insight stands out through stillness, not volume
3. **Typography Carries Weight**: Suisse Intl does the work, not decoration
4. **Minimal Accent**: Gold appears only twice (REFRAME label + left border)
5. **Information Density**: Constraints, classification, implications all visible
6. **Premium Feel**: Would not look out of place next to Air Company or Aesop

## What to Avoid

- Gradients beyond subtle atmospheric background
- Rounded corners > 2px (use `rounded-sm`)
- Multiple accent colors (gold only)
- Bold weights (stay in 300-500 range for sans)
- Tight spacing (this must breathe)
- Purple/blue AI aesthetics
- Decorative elements of any kind
- Scroll-triggered animations, typing effects, parallax

## References

### Internal
- Design System: `docs/SPARLO-DESIGN-SYSTEM.md`
- Font Config: `apps/web/lib/fonts.ts`
- Example Component: `apps/web/app/(marketing)/_components/engineering-hero.tsx`
- Example Animated Section: `apps/web/app/(marketing)/_components/process-animation.tsx`

### External
- [Framer Motion whileInView](https://www.framer.com/motion/scroll-animations/)
- [Tailwind CSS motion-reduce](https://tailwindcss.com/docs/hover-focus-and-other-states#prefers-reduced-motion)
- [WCAG Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

*Plan created: 2026-01-08*
