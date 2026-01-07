# Sparlo Process Animation

## Overview

Replace the existing 780-line `analysis-animation.tsx` with a minimal, elegant scroll-driven animation showing: **Problem → Reframe → Analysis (fragment flicker) → Report transition**.

**Key Differences from Current Implementation:**
- Single centered column (vs. multi-column phases)
- 200vh scroll distance (vs. 300-500vh)
- Fragment flicker effect (vs. phase-based content switching)
- Sticky positioning (vs. fixed overlay)
- No accent colors, gradients, or glows - hierarchy through opacity only

## Problem Statement

The current animation is over-engineered with 8 phases, complex visual elements (grid backgrounds, timeline spines, connection lines), and unreliable scroll behavior. Users reported "the scrolling logic is all wrong" and content scrolling past before animations complete.

**Goal:** Create a restrained, confident animation that conveys "They analyzed a lot, found something clever, and produced a real output" in 8-12 seconds of engaged scrolling.

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  <section ref={containerRef} height="200vh">                │
│                                                             │
│    <div position="sticky" top="0" height="100vh">          │
│                                                             │
│      [PROBLEM TEXT] - always visible                        │
│      ─────────────  - divider 1 (scaleX animation)         │
│      [REFRAME TEXT] - fade in + y transform                │
│      ─────────────  - divider 2                            │
│      Analyzing      - fade in                              │
│      [FRAGMENTS]    - staggered flicker                    │
│      3,310 patents · 8 domains · 47 papers                 │
│      [DOMAIN TAGS]  - staggered reveal                     │
│      12 concepts → 6 solutions                             │
│      ─────────────  - divider 3                            │
│      20-page report · 14 citations · 3 protocols           │
│                                                             │
│    </div>                                                   │
│                                                             │
│  </section>                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Scroll Timeline (200vh = 100% progress)

| Progress | Element | Animation |
|----------|---------|-----------|
| 0-15% | Problem statement | Visible (no animation) |
| 15-20% | Divider 1 | `scaleX: 0→1`, `origin-left` |
| 20-28% | Reframe text | `opacity: 0→1`, `y: 8→0` |
| 28-42% | — | Hold for reading |
| 42-46% | Divider 2 | `scaleX: 0→1` |
| 46-50% | "Analyzing" label | `opacity: 0→1` |
| 48-65% | Fragment flicker | 10 fragments, staggered fade+blur |
| 64-68% | Stats line | `opacity: 0→1`, `y: 8→0` |
| 68-77% | Domain tags | Staggered reveal (2% each) |
| 76-80% | Output line | `opacity: 0→1`, `y: 8→0` |
| 80-84% | Divider 3 | `scaleX: 0→1` |
| 84-92% | Report transition | `opacity: 0→1`, `y: 8→0` |
| 92-100% | Entire section | `opacity: 1→0.5` |

### Fragment Flicker Implementation

```typescript
const fragments = [
  { text: 'US9,073,003', x: 15, y: 10, start: 0.48, end: 0.54 },
  { text: 'Mikhaylin 2016', x: 55, y: 40, start: 0.49, end: 0.55 },
  { text: '[Desalination]', x: 8, y: 65, start: 0.50, end: 0.56 },
  { text: 'ΔG = -237 kJ/mol', x: 50, y: 20, start: 0.51, end: 0.57 },
  { text: 'polarity reversal', x: 20, y: 50, start: 0.52, end: 0.58 },
  { text: 'Kuang et al.', x: 60, y: 75, start: 0.53, end: 0.59 },
  { text: 'US10,892,401', x: 12, y: 35, start: 0.54, end: 0.60 },
  { text: 'Cl⁻ < 5%', x: 58, y: 55, start: 0.55, end: 0.61 },
  { text: 'E_cell = E° + η', x: 25, y: 80, start: 0.56, end: 0.62 },
  { text: '[Geothermal]', x: 48, y: 8, start: 0.57, end: 0.63 },
];

// Each fragment animation:
// start → start+0.015: opacity 0→0.7
// hold at 0.7
// end-0.015 → end: opacity 0.7→0, blur 0→2px
```

At any scroll position during 48-63%, 2-4 fragments are visible simultaneously.

## Implementation Steps

### Step 1: Create New Component File

**File:** `apps/web/app/(marketing)/_components/process-animation.tsx`

```typescript
'use client';

import { memo, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from '@kit/ui/hooks';

// Content constants
const CONTENT = {
  problem: `Electrochemical ocean alkalinity enhancement produces NaOH at sea to absorb atmospheric CO₂. But marine electrolysis faces severe corrosion, biofouling, and membrane fouling. Need electrolyzer architecture that survives 5+ years in marine environment at <$80/ton CO₂ equivalent alkalinity cost.`,
  reframe: `Instead of asking "how do we make components survive 5 years in seawater," we asked "how do we make replacement so cheap that survival doesn't matter."`,
  stats: '3,310 patents  ·  8 domains  ·  47 papers',
  domains: ['Desalination', 'Geothermal', 'Marine Biology', 'Aerospace'],
  output: '12 concepts → 6 solutions',
  report: '20-page report  ·  14 citations  ·  3 validation protocols',
};

const fragments = [
  { text: 'US9,073,003', x: 15, y: 10, start: 0.48, end: 0.54 },
  // ... rest of fragments
];

export const ProcessAnimation = memo(function ProcessAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // If reduced motion, render static version
  if (prefersReducedMotion) {
    return <StaticContent />;
  }

  return (
    <section
      ref={containerRef}
      aria-label="Analysis Process"
      className="relative h-[200vh] bg-[#09090B]"
    >
      <h2 className="sr-only">How Sparlo Analyzes Your Problem</h2>
      <div className="sticky top-0 flex h-screen items-center justify-center px-4 md:px-6">
        <AnimatedContent scrollYProgress={scrollYProgress} />
      </div>
    </section>
  );
});
```

### Step 2: Implement Animated Content Component

```typescript
function AnimatedContent({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  // Divider animations
  const divider1Scale = useTransform(scrollYProgress, [0.15, 0.20], [0, 1]);
  const divider2Scale = useTransform(scrollYProgress, [0.42, 0.46], [0, 1]);
  const divider3Scale = useTransform(scrollYProgress, [0.80, 0.84], [0, 1]);

  // Reframe animation
  const reframeOpacity = useTransform(scrollYProgress, [0.20, 0.28], [0, 1]);
  const reframeY = useTransform(scrollYProgress, [0.20, 0.28], [8, 0]);

  // Analyzing label
  const analyzingOpacity = useTransform(scrollYProgress, [0.46, 0.50], [0, 1]);

  // Fragment container
  const fragmentContainerOpacity = useTransform(
    scrollYProgress,
    [0.46, 0.48, 0.62, 0.65],
    [0, 1, 1, 0]
  );

  // Stats
  const statsOpacity = useTransform(scrollYProgress, [0.64, 0.68], [0, 1]);
  const statsY = useTransform(scrollYProgress, [0.64, 0.68], [8, 0]);

  // Domain tags (staggered)
  const domainOpacities = [
    useTransform(scrollYProgress, [0.68, 0.71], [0, 1]),
    useTransform(scrollYProgress, [0.70, 0.73], [0, 1]),
    useTransform(scrollYProgress, [0.72, 0.75], [0, 1]),
    useTransform(scrollYProgress, [0.74, 0.77], [0, 1]),
  ];

  // Output
  const outputOpacity = useTransform(scrollYProgress, [0.76, 0.80], [0, 1]);
  const outputY = useTransform(scrollYProgress, [0.76, 0.80], [8, 0]);

  // Report
  const reportOpacity = useTransform(scrollYProgress, [0.84, 0.92], [0, 1]);
  const reportY = useTransform(scrollYProgress, [0.84, 0.92], [8, 0]);

  // Section fade
  const sectionOpacity = useTransform(scrollYProgress, [0.92, 1.0], [1, 0.5]);

  return (
    <motion.div
      className="w-full max-w-[680px] text-center"
      style={{ opacity: sectionOpacity }}
    >
      {/* Problem */}
      <p className="text-lg leading-relaxed text-[#FAFAFA]">
        {CONTENT.problem}
      </p>

      {/* Divider 1 */}
      <Divider scaleX={divider1Scale} />

      {/* Reframe */}
      <motion.p
        className="mx-auto max-w-[600px] text-base leading-relaxed"
        style={{ opacity: reframeOpacity, y: reframeY }}
      >
        <span className="text-[#A1A1AA]">↳ Reframed: </span>
        <span className="text-[#FAFAFA]">{CONTENT.reframe}</span>
      </motion.p>

      {/* Divider 2 */}
      <Divider scaleX={divider2Scale} />

      {/* Analyzing Label */}
      <motion.p
        className="mb-2 text-sm tracking-wide text-[#A1A1AA]"
        style={{ opacity: analyzingOpacity }}
      >
        Analyzing
      </motion.p>

      {/* Fragment Flicker */}
      <FragmentFlicker
        fragments={fragments}
        scrollYProgress={scrollYProgress}
        containerOpacity={fragmentContainerOpacity}
      />

      {/* Stats */}
      <motion.p
        className="mb-6 text-sm text-[#A1A1AA]"
        style={{ opacity: statsOpacity, y: statsY }}
      >
        {CONTENT.stats}
      </motion.p>

      {/* Domain Tags */}
      <div className="mb-6 flex flex-col justify-center gap-2 sm:flex-row sm:gap-6">
        {CONTENT.domains.map((domain, i) => (
          <motion.span
            key={domain}
            className="font-mono text-[13px] text-[#A1A1AA]"
            style={{ opacity: domainOpacities[i] }}
          >
            {domain}
          </motion.span>
        ))}
      </div>

      {/* Output */}
      <motion.p
        className="mb-12 text-[15px] font-medium text-[#FAFAFA]"
        style={{ opacity: outputOpacity, y: outputY }}
      >
        {CONTENT.output}
      </motion.p>

      {/* Divider 3 */}
      <Divider scaleX={divider3Scale} />

      {/* Report */}
      <motion.p
        className="text-sm text-[#A1A1AA]"
        style={{ opacity: reportOpacity, y: reportY }}
      >
        {CONTENT.report}
      </motion.p>
    </motion.div>
  );
}
```

### Step 3: Implement Fragment Flicker Component

```typescript
function Fragment({
  text,
  x,
  y,
  start,
  end,
  scrollYProgress,
}: {
  text: string;
  x: number;
  y: number;
  start: number;
  end: number;
  scrollYProgress: MotionValue<number>;
}) {
  const opacity = useTransform(
    scrollYProgress,
    [start, start + 0.015, end - 0.015, end],
    [0, 0.7, 0.7, 0]
  );

  const blur = useTransform(
    scrollYProgress,
    [end - 0.015, end],
    [0, 2]
  );

  return (
    <motion.span
      className="pointer-events-none absolute whitespace-nowrap font-mono text-[13px] text-white"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        opacity,
        filter: useTransform(blur, (b) => `blur(${b}px)`),
      }}
    >
      {text}
    </motion.span>
  );
}

function FragmentFlicker({
  fragments,
  scrollYProgress,
  containerOpacity,
}: {
  fragments: typeof fragments;
  scrollYProgress: MotionValue<number>;
  containerOpacity: MotionValue<number>;
}) {
  return (
    <motion.div
      className="relative mx-auto my-8 h-[100px] w-[280px] sm:h-[120px] sm:w-[320px]"
      style={{ opacity: containerOpacity }}
    >
      {fragments.map((frag, i) => (
        <Fragment key={i} {...frag} scrollYProgress={scrollYProgress} />
      ))}
    </motion.div>
  );
}
```

### Step 4: Implement Helper Components

```typescript
function Divider({ scaleX }: { scaleX: MotionValue<number> }) {
  return (
    <div className="my-12 flex justify-center">
      <motion.div
        className="h-px w-20 origin-left bg-white/15"
        style={{ scaleX }}
      />
    </div>
  );
}

function StaticContent() {
  return (
    <section
      aria-label="Analysis Process"
      className="bg-[#09090B] px-4 py-24 md:px-6"
    >
      <div className="mx-auto max-w-[680px] text-center">
        <p className="text-lg leading-relaxed text-[#FAFAFA]">
          {CONTENT.problem}
        </p>
        <div className="my-12 flex justify-center">
          <div className="h-px w-20 bg-white/15" />
        </div>
        <p className="mx-auto max-w-[600px] text-base leading-relaxed">
          <span className="text-[#A1A1AA]">↳ Reframed: </span>
          <span className="text-[#FAFAFA]">{CONTENT.reframe}</span>
        </p>
        <div className="my-12 flex justify-center">
          <div className="h-px w-20 bg-white/15" />
        </div>
        <p className="mb-6 text-sm text-[#A1A1AA]">{CONTENT.stats}</p>
        <div className="mb-6 flex flex-col justify-center gap-2 sm:flex-row sm:gap-6">
          {CONTENT.domains.map((domain) => (
            <span key={domain} className="font-mono text-[13px] text-[#A1A1AA]">
              {domain}
            </span>
          ))}
        </div>
        <p className="mb-12 text-[15px] font-medium text-[#FAFAFA]">
          {CONTENT.output}
        </p>
        <div className="my-12 flex justify-center">
          <div className="h-px w-20 bg-white/15" />
        </div>
        <p className="text-sm text-[#A1A1AA]">{CONTENT.report}</p>
      </div>
    </section>
  );
}
```

### Step 5: Update Landing Page Integration

**File:** `apps/web/app/(marketing)/page.tsx`

```diff
- import { AnalysisAnimation } from './_components/analysis-animation';
+ import { ProcessAnimation } from './_components/process-animation';

function Home() {
  // ...
  return (
    <>
      <EngineeringHero />
-     <AnalysisAnimation />
+     <ProcessAnimation />
      <ModeTabs mode={mode} onModeChange={handleModeChange} />
      // ...
    </>
  );
}
```

### Step 6: Update Test Landing Page

**File:** `apps/web/app/(marketing)/testlp/page.tsx`

Same change as Step 5.

### Step 7: Delete Old Component

Remove `apps/web/app/(marketing)/_components/analysis-animation.tsx` (780 lines).

## Acceptance Criteria

### Functional Requirements
- [ ] Problem statement visible immediately on section entry
- [ ] Dividers draw left-to-right at specified scroll percentages
- [ ] Reframe text fades in with upward motion
- [ ] "Analyzing" label appears before fragment flicker
- [ ] 2-4 fragments visible simultaneously during flicker (48-63%)
- [ ] Fragments fade with slight blur on exit
- [ ] Stats, domains, output, report appear in sequence
- [ ] Section fades to 50% opacity at end
- [ ] Scroll reversal shows smooth reverse animations

### Non-Functional Requirements
- [ ] Uses only GPU-accelerated properties (transform, opacity, filter)
- [ ] No layout thrashing during scroll
- [ ] Reduced motion shows static content immediately
- [ ] Works on iOS Safari with dynamic viewport
- [ ] Component under 200 lines (vs current 780)

### Quality Gates
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint:fix` passes
- [ ] Manual test on Chrome, Safari, Firefox
- [ ] Manual test on iPhone and Android
- [ ] Reduced motion test (Chrome DevTools → Rendering → prefers-reduced-motion)

## Design Constraints

### Do
- Keep everything centered on a single vertical axis
- Let text breathe with generous spacing (48px between sections)
- Make fragments feel like glimpses, not a display
- Use real content from actual Sparlo reports

### Don't
- Add boxes, borders, or containers around elements
- Add progress bars or percentage indicators
- Add icons or decorative graphics
- Add hover states or click interactions
- Add color beyond white at varying opacities
- Add multiple columns or parallel tracks
- Make fragments move or bounce — only fade

## Colors

```css
--bg: #09090B;
--text-primary: #FAFAFA;
--text-secondary: #A1A1AA;
--text-muted: #52525B;
--line: rgba(255, 255, 255, 0.15);
```

## Typography

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Problem | Inter | 18px | 400 | #FAFAFA |
| Reframe prefix | Inter | 16px | 400 | #A1A1AA |
| Reframe text | Inter | 16px | 400 | #FAFAFA |
| Analyzing | Inter | 14px | 400 | #A1A1AA |
| Fragments | JetBrains Mono | 13px | 400 | white |
| Stats | Inter | 14px | 400 | #A1A1AA |
| Domains | JetBrains Mono | 13px | 400 | #A1A1AA |
| Output | Inter | 15px | 500 | #FAFAFA |
| Report | Inter | 14px | 400 | #A1A1AA |

## Mobile Responsive (< 768px)

- Problem text: 16px instead of 18px
- Max-width: 100% with px-4 padding
- Domain tags: stack vertically with gap-2
- Fragment container: 220px × 80px (vs 280px × 100px)
- Scroll height remains 200vh

## Success Metrics

A user scrolling at normal speed should:
1. Read the problem — recognize it's hard
2. See the reframe — understand the insight
3. Watch fragments flicker — feel work happening
4. See summary emerge — 3,310 patents, 8 domains, 12→6 concepts
5. Transition to report — understand something substantial was produced

**Total time:** 8-12 seconds of engaged scrolling
**Feeling:** "They analyzed a lot, found something clever, and produced a real output."

## References

### Internal
- Current animation: `apps/web/app/(marketing)/_components/analysis-animation.tsx`
- Animation constants: `apps/web/app/app/_lib/animation-constants.ts`
- Design system: `docs/SPARLO-DESIGN-SYSTEM.md`
- Reduced motion hook: `packages/ui/src/hooks/use-prefers-reduced-motion.ts`

### External
- [Framer Motion useScroll](https://www.framer.com/motion/scroll-animations/)
- [Framer Motion useTransform](https://www.framer.com/motion/use-transform/)
- [WCAG 2.1 Animation Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
