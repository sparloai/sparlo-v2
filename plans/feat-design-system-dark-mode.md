# Design System: Premium Dark Mode

## Philosophy

Premium through precision. Typography does the work. No bloat, no breakage.

---

## Design Principles

1. **Typography-driven hierarchy** - White space and type scale, not decorations
2. **Existing tokens** - Use `--sparlo-*` tokens, no duplication
3. **Existing components** - Extend `@kit/ui`, don't recreate
4. **Framer Motion for premium feel** - Smooth page transitions and micro-interactions
5. **Type safety** - Match actual database schema exactly

---

## Phase 1: Token Extension

**File:** `apps/web/styles/sparlo-tokens.css`

Extend existing tokens with semantic dark mode aliases:

```css
@layer base {
  :root {
    /* Surface hierarchy - dark mode */
    --surface-base: var(--sparlo-gray-950);
    --surface-elevated: var(--sparlo-gray-900);
    --surface-overlay: var(--sparlo-gray-800);

    /* Text hierarchy */
    --text-primary: var(--sparlo-gray-50);
    --text-secondary: var(--sparlo-gray-400);
    --text-muted: var(--sparlo-gray-500);

    /* Accent */
    --accent: var(--sparlo-violet);
    --accent-muted: color-mix(in srgb, var(--sparlo-violet) 15%, transparent);

    /* Borders */
    --border-subtle: rgba(255, 255, 255, 0.06);
    --border-default: rgba(255, 255, 255, 0.1);

    /* Semantic status */
    --status-success: var(--sparlo-success);
    --status-warning: var(--sparlo-warning);
    --status-error: var(--sparlo-error);
  }
}
```

**Why this approach:**
- References existing `--sparlo-*` values (no duplication)
- Semantic naming for component authors
- Single source of truth

---

## Phase 2: Dashboard (Your Reports)

**File:** `apps/web/app/home/(user)/page.tsx`

### 2.1 Update Existing Components In-Place

The current `page.tsx` has inline `ReportCard` and empty state. Update colors only:

**ReportCard styling updates:**
```tsx
// Current
className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300"

// Updated
className="bg-[--surface-elevated] rounded-xl border border-[--border-subtle] p-5 hover:border-[--border-default] transition-colors"
```

**Text hierarchy:**
```tsx
// Title
className="text-lg font-semibold text-[--text-primary]"

// Subtitle/description
className="text-sm text-[--text-secondary] mt-1 line-clamp-2"

// Timestamp
className="text-xs text-[--text-muted] mt-3"
```

### 2.2 Status Badge Colors

Use existing Badge component, update variant colors:

| Status | Background | Text |
|--------|------------|------|
| `complete` | `bg-[--status-success]/15` | `text-[--status-success]` |
| `processing` | `bg-[--accent-muted]` | `text-[--accent]` |
| `clarifying` | `bg-[--status-warning]/15` | `text-[--status-warning]` |
| `error` | `bg-[--status-error]/15` | `text-[--status-error]` |

### 2.3 Empty State

```tsx
<div className="flex flex-col items-center justify-center py-20">
  <p className="text-[--text-muted] text-lg">No reports yet</p>
  <p className="text-[--text-muted]/70 text-sm mt-2">Create your first report to get started</p>
  <Button className="mt-6">New Report</Button>
</div>
```

### 2.4 Page Background

```tsx
<div className="min-h-screen bg-[--surface-base]">
```

---

## Phase 3: Processing Screen

**File:** `apps/web/app/home/(user)/_components/processing-screen.tsx`

### 3.1 Framer Motion Animations

**Logo/Spinner Animation:**
```tsx
const pulseVariants = {
  initial: { scale: 1, opacity: 0.8 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const spinVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};
```

**Status Text Animation with Cycling Messages:**
```tsx
const STATUS_MESSAGES = [
  "Analyzing your problem...",
  "Researching patterns...",
  "Generating insights...",
  "Building recommendations..."
];

const textVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } }
};
```

### 3.2 Processing Screen Layout

```tsx
export function ProcessingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[--surface-base] flex items-center justify-center">
      <div className="text-center">
        {/* Animated logo/spinner */}
        <motion.div
          variants={pulseVariants}
          initial="initial"
          animate="animate"
          className="mx-auto mb-8"
        >
          <motion.div variants={spinVariants} animate="animate">
            <Loader2 className="w-12 h-12 text-[--accent]" />
          </motion.div>
        </motion.div>

        {/* Animated status text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            variants={textVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-[--text-secondary] text-lg"
          >
            {STATUS_MESSAGES[messageIndex]}
          </motion.p>
        </AnimatePresence>

        {/* Progress hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[--text-muted] text-sm mt-4"
        >
          This usually takes 30-60 seconds
        </motion.p>

        {/* Subtle progress bar */}
        <motion.div
          className="mt-8 h-1 bg-[--border-subtle] rounded-full overflow-hidden max-w-xs mx-auto"
        >
          <motion.div
            className="h-full bg-[--accent]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 60, ease: "linear" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
```

### 3.3 Reduced Motion Support

```tsx
const prefersReducedMotion = usePrefersReducedMotion();

// Use simpler animations if user prefers reduced motion
const animationProps = prefersReducedMotion
  ? {}
  : { variants: pulseVariants, initial: "initial", animate: "animate" };
```

---

## Phase 4: New Report Page

**File:** `apps/web/app/home/(user)/reports/new/page.tsx`

### 4.1 Form Container

```tsx
<div className="min-h-screen bg-[--surface-base] py-12">
  <div className="max-w-2xl mx-auto px-6">
    <h1 className="text-2xl font-semibold text-[--text-primary]">
      New Report
    </h1>
    <p className="text-[--text-secondary] mt-2">
      Describe the problem you're trying to solve
    </p>

    {/* Form */}
    <Form {...form}>
      {/* ... */}
    </Form>
  </div>
</div>
```

### 4.2 Textarea Styling

Use `@kit/ui/textarea` with dark mode overrides:

```tsx
<Textarea
  className="
    bg-[--surface-elevated]
    border-[--border-subtle]
    text-[--text-primary]
    placeholder:text-[--text-muted]
    focus:border-[--accent]
    focus:ring-1
    focus:ring-[--accent]/20
    min-h-[160px]
    resize-none
  "
  placeholder="What problem are you trying to solve?"
/>
```

### 4.3 Submit Button

Use existing `@kit/ui/button` with accent styling:

```tsx
<Button
  type="submit"
  className="bg-[--accent] hover:bg-[--accent]/90 text-white"
  disabled={isSubmitting}
>
  {isSubmitting ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin mr-2" />
      Generating...
    </>
  ) : (
    'Generate Report'
  )}
</Button>
```

---

## Phase 5: Report Display Components

### 5.1 Badge Component Updates

**File:** `apps/web/app/home/(user)/reports/[id]/_components/report/badge.tsx`

Update variant colors to use semantic tokens:

```tsx
const variants = {
  // Verdict badges
  'verdict-strong': 'bg-[--status-success]/15 text-[--status-success] border-[--status-success]/20',
  'verdict-conditional': 'bg-[--accent-muted] text-[--accent] border-[--accent]/20',
  'verdict-needs': 'bg-[--status-warning]/15 text-[--status-warning] border-[--status-warning]/20',
  'verdict-no': 'bg-[--status-error]/15 text-[--status-error] border-[--status-error]/20',

  // Confidence badges
  'confidence-high': 'bg-[--status-success]/15 text-[--status-success]',
  'confidence-medium': 'bg-[--status-warning]/15 text-[--status-warning]',
  'confidence-low': 'bg-[--status-error]/15 text-[--status-error]',

  // Track badges
  'track-best': 'bg-[--accent-muted] text-[--accent]',
  'track-simpler': 'bg-[--status-success]/15 text-[--status-success]',
  'track-spark': 'bg-[--status-warning]/15 text-[--status-warning]',
} as const;
```

### 5.2 Structured Report Colors

**File:** `apps/web/app/home/(user)/reports/[id]/_components/report/structured-report.tsx`

Color mapping (find/replace):

| Light Mode | Dark Mode |
|------------|-----------|
| `bg-white` | `bg-[--surface-elevated]` |
| `bg-gray-50` | `bg-[--surface-overlay]` |
| `border-gray-200` | `border-[--border-default]` |
| `border-gray-100` | `border-[--border-subtle]` |
| `text-gray-900` | `text-[--text-primary]` |
| `text-gray-700` | `text-[--text-secondary]` |
| `text-gray-500` | `text-[--text-muted]` |
| `text-gray-400` | `text-[--text-muted]/70` |
| `bg-violet-50` | `bg-[--accent-muted]` |
| `text-violet-600` | `text-[--accent]` |
| `border-violet-200` | `border-[--accent]/20` |
| `border-violet-300` | `border-[--accent]/30` |
| `border-violet-500` | `border-[--accent]` |

### 5.3 Concept Card Colors

**File:** `apps/web/app/home/(user)/reports/[id]/_components/report/concept-card.tsx`

Same color mapping as above, plus:

| Light Mode | Dark Mode |
|------------|-----------|
| `bg-amber-50` | `bg-[--status-warning]/10` |
| `text-amber-700` | `text-[--status-warning]` |
| `border-amber-200` | `border-[--status-warning]/20` |

### 5.4 Test Gate Colors

**File:** `apps/web/app/home/(user)/reports/[id]/_components/report/test-gate.tsx`

```tsx
// GO section
<div className="rounded-lg border-l-2 border-[--status-success] bg-[--status-success]/10 p-3">
  <p className="text-xs font-semibold tracking-wider text-[--status-success] uppercase">
    GO if
  </p>
  <p className="mt-1 text-sm text-[--status-success]/90">{gate.go_criteria}</p>
</div>

// NO-GO section
<div className="rounded-lg border-l-2 border-[--status-error] bg-[--status-error]/10 p-3">
  <p className="text-xs font-semibold tracking-wider text-[--status-error] uppercase">
    NO-GO if
  </p>
  <p className="mt-1 text-sm text-[--status-error]/90">{gate.no_go_criteria}</p>
</div>
```

---

## Phase 6: Premium Animations & Interactions

### 6.1 Page Transitions (Framer Motion)

**Create:** `apps/web/app/home/(user)/_components/page-transition.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1], // Custom easing for premium feel
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
```

### 6.2 Card Hover Effects (Framer Motion)

```tsx
const cardVariants = {
  initial: { y: 0 },
  hover: {
    y: -2,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// Usage
<motion.a
  href={`/home/reports/${report.id}`}
  variants={cardVariants}
  initial="initial"
  whileHover="hover"
  whileTap="tap"
  className="block bg-[--surface-elevated] rounded-xl border border-[--border-subtle] p-5"
>
  {/* Card content */}
</motion.a>
```

### 6.3 Staggered List Animation

For dashboard report cards:

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

// Usage
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="show"
  className="grid gap-4"
>
  {reports.map((report) => (
    <motion.div key={report.id} variants={itemVariants}>
      <ReportCard report={report} />
    </motion.div>
  ))}
</motion.div>
```

### 6.4 Button Micro-interactions

```tsx
const buttonVariants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.15 },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// Primary button with shine effect
<motion.button
  variants={buttonVariants}
  initial="idle"
  whileHover="hover"
  whileTap="tap"
  className="relative overflow-hidden bg-[--accent] text-white px-6 py-3 rounded-lg"
>
  {/* Shine overlay on hover */}
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
    initial={{ x: "-100%" }}
    whileHover={{ x: "100%" }}
    transition={{ duration: 0.5, ease: "easeInOut" }}
  />
  <span className="relative">Generate Report</span>
</motion.button>
```

### 6.5 Focus States (CSS)

Add to `sparlo-tokens.css`:

```css
/* Focus ring for accessibility */
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Remove default focus for mouse users */
*:focus:not(:focus-visible) {
  outline: none;
}
```

### 6.6 Reduced Motion Support

```tsx
// Hook for respecting user preferences
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// Usage - disable animations when user prefers reduced motion
const shouldAnimate = !usePrefersReducedMotion();

<motion.div
  initial={shouldAnimate ? "initial" : false}
  animate={shouldAnimate ? "animate" : false}
>
```

---

## Implementation Checklist

### Token Setup
- [ ] Add semantic aliases to `sparlo-tokens.css`
- [ ] Add focus state utilities

### Dashboard
- [ ] Update page background to `--surface-base`
- [ ] Add staggered list animations with Framer Motion
- [ ] Add card hover/tap animations
- [ ] Update ReportCard colors
- [ ] Update empty state colors

### Processing Screen
- [ ] Add Framer Motion pulse/spin animations
- [ ] Add animated status message cycling
- [ ] Add progress bar animation
- [ ] Add reduced motion support

### New Report Page
- [ ] Update form container colors
- [ ] Update textarea styling
- [ ] Add button micro-interactions with shine effect

### Report Display
- [ ] Update `badge.tsx` variant colors
- [ ] Update `structured-report.tsx` colors
- [ ] Update `concept-card.tsx` colors
- [ ] Update `test-gate.tsx` GO/NO-GO colors

### Animations
- [ ] Create `page-transition.tsx` component
- [ ] Create `usePrefersReducedMotion` hook
- [ ] Add staggered list animation
- [ ] Add card hover effects
- [ ] Add button shine effect

### Quality Assurance
- [ ] Test all screens in dark mode
- [ ] Verify contrast ratios (WCAG AA)
- [ ] Test with `prefers-reduced-motion`
- [ ] Test keyboard navigation focus states

---

## Files to Create

1. `apps/web/app/home/(user)/_components/page-transition.tsx` - Page transition wrapper
2. `apps/web/app/home/(user)/_hooks/use-prefers-reduced-motion.ts` - Motion preference hook

## Files to Modify

1. `apps/web/styles/sparlo-tokens.css` - Add semantic tokens + focus states
2. `apps/web/app/home/(user)/page.tsx` - Dashboard with animations
3. `apps/web/app/home/(user)/_components/processing-screen.tsx` - Processing with Framer Motion
4. `apps/web/app/home/(user)/reports/new/page.tsx` - Form colors + button effects
5. `apps/web/app/home/(user)/reports/[id]/_components/report/badge.tsx` - Badge variants
6. `apps/web/app/home/(user)/reports/[id]/_components/report/structured-report.tsx` - Report colors
7. `apps/web/app/home/(user)/reports/[id]/_components/report/concept-card.tsx` - Card colors
8. `apps/web/app/home/(user)/reports/[id]/_components/report/test-gate.tsx` - Gate colors

---

## Performance Guarantees

1. **Framer Motion only where valuable** - Smooth transitions that enhance UX
2. **No duplicate tokens** - References existing `--sparlo-*` values
3. **Respects reduced motion** - `usePrefersReducedMotion` hook
4. **Optimized animations** - Variants defined outside components (no re-creation on render)

## Accessibility Guarantees

1. **WCAG AA contrast** - All text meets 4.5:1 ratio
2. **Visible focus states** - 2px accent outline
3. **Keyboard navigation** - All interactive elements accessible
4. **Motion preferences** - Animations disabled when user requests
