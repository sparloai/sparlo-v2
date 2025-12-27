# Sparlo Brand System

## Strategic Foundation

### The Problem We're Solving
Every AI tool looks the same: gradients, purple/blue glows, "magic" language, chat demos, trust badges. This visual language has become a **signal of bullshit**. The more something looks like an AI tool, the less sophisticated users trust it.

Sparlo's output is genuinely different. The design must prove it.

### The Principle
**Confidence demonstrated, not claimed.**

Air Company doesn't need to say they're revolutionary—they show their reactor converting CO₂ to jet fuel. We don't need to say our reports are different—we show the report. The design gets out of the way and lets the work speak.

### Design Philosophy: Research Infrastructure, Not AI Tool

| Aspect | NOT This | THIS |
|--------|----------|------|
| Overall feeling | AI tool, SaaS dashboard | Research infrastructure, technical monograph |
| Density | Sparse, padded, lots of whitespace | Rich, breathing, substantial |
| Color | Gradients, purple/blue, decorative | Near-monochrome, single signal color |
| Typography | Friendly sans-serif, playful | Serious, considered, carrying hierarchy |
| Imagery | Abstract AI visuals, illustrations | None, or technical diagrams only |
| Copy | Marketing speak, superlatives | Engineering speak, declarative |
| Proof | Testimonials, logos, badges | The report itself |
| Motion | Playful, attention-seeking | Weighted, purposeful, or none |

---

## Design Tokens

### Typography Scale

Inspired by Air Company's use of Suisse BP Intl. We use a deliberate scale where **typography carries the hierarchy**, not color or decoration.

```css
/* Font Family */
--font-display: 'Söhne', system-ui, -apple-system, sans-serif;
--font-mono: 'Söhne Mono', 'SF Mono', Consolas, monospace;

/* Letter Spacing */
--tracking-tight: -0.02em;    /* Headlines */
--tracking-normal: 0;          /* Body */
--tracking-wide: 0.05em;       /* Labels, overlines */
--tracking-widest: 0.1em;      /* Mono labels */

/* Font Sizes - Semantic Scale */
--text-display:    48px;   /* Report title only */
--text-headline:   32px;   /* Section headers */
--text-title:      24px;   /* Card titles, major headings */
--text-subtitle:   20px;   /* Key insights, featured content */
--text-body-lg:    18px;   /* Executive summary lead */
--text-body:       16px;   /* Primary body text */
--text-body-sm:    14px;   /* Secondary text, descriptions */
--text-caption:    12px;   /* Metadata, timestamps */
--text-label:      10px;   /* Badge labels, overlines */

/* Font Weights */
--font-light:      300;
--font-regular:    400;
--font-medium:     500;
--font-semibold:   600;
--font-bold:       700;

/* Line Heights */
--leading-tight:   1.2;     /* Headlines */
--leading-snug:    1.35;    /* Titles */
--leading-normal:  1.5;     /* Body */
--leading-relaxed: 1.65;    /* Long-form content */
```

### Typography Application

| Element | Size | Weight | Tracking | Leading |
|---------|------|--------|----------|---------|
| Report Title | display (48px) | semibold | tight | tight |
| Section Header | headline (32px) | semibold | tight | tight |
| Card Title | title (24px) | semibold | tight | snug |
| Featured Insight | subtitle (20px) | medium | normal | snug |
| Executive Summary Lead | body-lg (18px) | light | normal | relaxed |
| Body Text | body (16px) | regular | normal | relaxed |
| Supporting Text | body-sm (14px) | regular | normal | normal |
| Metadata | caption (12px) | medium | normal | normal |
| Overline/Label | label (10px) | bold | widest | tight |
| Badge Text | label (10px) | semibold | wide | tight |

---

### Color System

**Near-monochrome with purposeful accent.** Color is earned, not decorative. Most of the interface is black, white, and grey. Color appears only to communicate specific meaning.

```css
/* Core Palette - Light Mode */
--color-bg:           #ffffff;
--color-bg-subtle:    #fafafa;     /* Section backgrounds */
--color-bg-muted:     #f4f4f5;     /* Card backgrounds (zinc-100) */
--color-bg-emphasis:  #18181b;     /* Dark sections (zinc-900) */

--color-text:         #09090b;     /* Primary text (zinc-950) */
--color-text-secondary: #3f3f46;   /* Secondary text (zinc-700) */
--color-text-muted:   #71717a;     /* Tertiary text (zinc-500) */
--color-text-subtle:  #a1a1aa;     /* Quaternary text (zinc-400) */

--color-border:       #e4e4e7;     /* Default borders (zinc-200) */
--color-border-subtle: #f4f4f5;    /* Subtle dividers (zinc-100) */
--color-border-emphasis: #27272a; /* Dark mode borders (zinc-800) */

/* Dark Mode */
--color-bg-dark:           #09090b;
--color-bg-subtle-dark:    #18181b;
--color-bg-muted-dark:     #27272a;
--color-bg-emphasis-dark:  #fafafa;

--color-text-dark:         #fafafa;
--color-text-secondary-dark: #d4d4d8;
--color-text-muted-dark:   #a1a1aa;
--color-text-subtle-dark:  #71717a;
```

### Semantic Colors

Color communicates **meaning**, not decoration. Use sparingly.

```css
/* Confidence/Status Indicators */
--color-high:         #059669;     /* emerald-600 - High confidence, good */
--color-high-subtle:  #d1fae5;     /* emerald-100 - High background */
--color-medium:       #d97706;     /* amber-600 - Medium, caution */
--color-medium-subtle: #fef3c7;    /* amber-100 - Medium background */
--color-low:          #71717a;     /* zinc-500 - Low, neutral */
--color-low-subtle:   #f4f4f5;     /* zinc-100 - Low background */

/* Track Indicators */
--color-best-fit:     #059669;     /* emerald-600 */
--color-simpler-path: #71717a;     /* zinc-500 */
--color-spark:        #7c3aed;     /* violet-600 - Innovation/breakthrough */
--color-spark-subtle: #ede9fe;     /* violet-100 */

/* Functional */
--color-accent:       #18181b;     /* Primary accent = near-black */
--color-link:         #2563eb;     /* Blue for links only */
--color-destructive:  #dc2626;     /* Red for warnings only */
```

### When Color Appears

| Context | Color | Purpose |
|---------|-------|---------|
| Primary recommendation border | --color-accent (near-black) | Signal importance |
| Confidence badges | Semantic (high/medium/low) | Communicate confidence level |
| Track badges | Track colors | Categorize concepts |
| Dark insight blocks | --color-bg-emphasis | Elevate key insights |
| Links | --color-link | Navigation affordance |
| Warnings/Risks | --color-medium | Draw attention to risks |

---

### Spacing Scale

Modular spacing creates visual rhythm. Based on 4px base unit.

```css
/* Spacing Scale */
--space-0:    0;
--space-1:    4px;      /* 0.25rem */
--space-2:    8px;      /* 0.5rem */
--space-3:    12px;     /* 0.75rem */
--space-4:    16px;     /* 1rem */
--space-5:    20px;     /* 1.25rem */
--space-6:    24px;     /* 1.5rem */
--space-8:    32px;     /* 2rem */
--space-10:   40px;     /* 2.5rem */
--space-12:   48px;     /* 3rem */
--space-16:   64px;     /* 4rem */
--space-20:   80px;     /* 5rem */
--space-24:   96px;     /* 6rem */

/* Semantic Spacing */
--spacing-section:    var(--space-16);  /* Between major sections */
--spacing-subsection: var(--space-10);  /* Between subsections */
--spacing-card:       var(--space-6);   /* Card internal padding */
--spacing-card-lg:    var(--space-8);   /* Large card padding */
--spacing-element:    var(--space-4);   /* Between related elements */
--spacing-tight:      var(--space-2);   /* Tight groupings */
```

### Layout

```css
/* Container */
--container-max:      1200px;    /* Report max width */
--container-narrow:   800px;     /* Reading width for text-heavy sections */
--container-padding:  var(--space-6);  /* Side padding */

/* Border Radius */
--radius-none:        0;
--radius-sm:          4px;
--radius-md:          8px;
--radius-lg:          12px;      /* Cards */
--radius-xl:          16px;      /* Large cards, sections */
--radius-full:        9999px;    /* Pills, badges */

/* Shadows - Subtle, purposeful */
--shadow-sm:          0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md:          0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.06);
--shadow-lg:          0 4px 12px rgba(0, 0, 0, 0.08), 0 16px 32px rgba(0, 0, 0, 0.08);
```

---

## Component Patterns

### 1. Section Header

The anchor for each major report section. Typography-driven hierarchy.

```
┌─────────────────────────────────────────────────────────────────┐
│ Section Title                                        [Optional] │
│ ─────────────────────────────────────────────────────────────── │
│ (subtle border-bottom)                                          │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Title: `--text-title` (24px), `--font-semibold`, `--color-text`
- Border: 1px `--color-border-subtle`
- Margin-bottom: `--spacing-subsection` (40px)
- Optional count badge: `--text-caption`, muted background

---

### 2. Brief Section

The original problem statement. Sets context with restraint.

```
┌─────────────────────────────────────────────────────────────────┐
│ BRIEF                                                           │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ [Brief icon]  BRIEF                                       │   │
│ │                                                           │   │
│ │ The original problem statement text goes here with        │   │
│ │ comfortable line height for readability...                │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Container: Border, rounded-xl, white background
- Padding: `--spacing-card` (24px)
- Label: `--text-label`, tracking-widest, muted color, uppercase
- Content: `--text-body`, `--leading-relaxed`

---

### 3. Executive Summary

The most important section. Large typography, clear hierarchy.

```
┌─────────────────────────────────────────────────────────────────┐
│ EXECUTIVE SUMMARY                                               │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ [Checkmark icon]  EXECUTIVE SUMMARY                       │   │
│ │                                                           │   │
│ │ The larger lead paragraph that captures the key insight   │   │
│ │ in substantial, confident prose...                        │   │
│ │                                                           │   │
│ │ ┌─────────────────────────────────────────────────────┐   │   │
│ │ │ PRIMARY RECOMMENDATION                              │   │   │
│ │ │                                                     │   │   │
│ │ │ The specific, actionable recommendation with        │   │   │
│ │ │ enough detail to understand the path forward...     │   │   │
│ │ └─────────────────────────────────────────────────────┘   │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Lead text: `--text-subtitle` (20px), `--font-light`, `--leading-relaxed`
- Primary recommendation block:
  - Border-left: 4px `--color-accent`
  - Background: `--color-bg-subtle`
  - Label: `--text-label`, tracking-widest, uppercase
  - Content: `--text-body`, `--font-medium`

---

### 4. First Principles Insight (Dark Block)

The key reframe. Dark background elevates importance.

```
┌─────────────────────────────────────────────────────────────────┐
│ ████████████████████████████████████████████████████████████████│
│ █                                                              █│
│ █  FIRST PRINCIPLES INSIGHT                                    █│
│ █                                                              █│
│ █  The problem isn't 'how to dispose of X' but 'who needs      █│
│ █  concentrated X solutions'                                    █│
│ █                                                              █│
│ █  Supporting explanation in lighter text that elaborates      █│
│ █  on the insight with additional context...                   █│
│ █                                                              █│
│ ████████████████████████████████████████████████████████████████│
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Background: `--color-bg-emphasis` (zinc-900)
- Padding: `--spacing-card-lg` (32px)
- Border-radius: `--radius-xl`
- Label: `--text-label`, tracking-widest, zinc-400, uppercase
- Headline: `--text-subtitle` (20px), `--font-medium`, white
- Explanation: `--text-body`, zinc-200

---

### 5. Information Cards (What's Wrong, Current State, etc.)

Standard card for containing information blocks.

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ [Icon]  WHAT'S WRONG                                      │   │
│ │                                                           │   │
│ │ The explanation of the problem in clear prose that        │   │
│ │ demonstrates understanding without being verbose...       │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Border: 1px `--color-border`
- Border-radius: `--radius-xl`
- Background: `--color-bg` (white)
- Shadow: `--shadow-sm`
- Padding: `--spacing-card`
- Label: `--text-label`, tracking-widest, muted, uppercase
- Content: `--text-body`, `--leading-relaxed`

---

### 6. Constraints Table

Structured data in tables. Clean, scannable.

```
┌─────────────────────────────────────────────────────────────────┐
│  Metric              │ Target      │ Minimum    │ Stretch       │
│ ─────────────────────┼─────────────┼────────────┼───────────────│
│  Liquid discharge    │ >90%        │ >50%       │ Zero liquid   │
│  reduction           │ [green]     │            │ discharge     │
│ ─────────────────────┼─────────────┼────────────┼───────────────│
│  LCOW increase       │ <30%        │ <50%       │ Net revenue   │
│                      │ [green]     │            │ generation    │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Container: Border, rounded-xl, white background
- Headers: `--text-body-sm`, `--font-medium`, `--color-text-muted`
- Cells: `--text-body-sm`, left-aligned
- Target values: `--font-semibold`, green when positive
- Row borders: 1px `--color-border-subtle`
- Cell padding: `--space-4` horizontal, `--space-3` vertical

---

### 7. Constraint List Items

For hard/soft constraints with bullet indicators.

```
┌─────────────────────────────────────────────────────────────────┐
│  [●] Must retrofit to existing RO infrastructure without        │
│      major plant redesign                                       │
│                                                                 │
│  [●] Regulatory compliance in tightening Mediterranean/Gulf/    │
│      California frameworks                                      │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Bullet: 8px circle, color indicates severity (red = hard, amber = soft)
- Text: `--text-body-sm`, `--color-text-secondary`
- Item spacing: `--space-2`

---

### 8. Challenge the Frame Cards

Assumption cards that question the framing.

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Assumption: Brine composition is relatively standard      │   │
│ │                                                           │   │
│ │ Challenge: Brackish water sources vary wildly in          │   │
│ │ composition. Some have valuable minerals...               │   │
│ │                                                           │   │
│ │ → If source is brackish rather than seawater, mineral     │   │
│ │   extraction economics change dramatically.               │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Assumption: `--text-body`, `--font-medium`, `--color-text`
- Challenge label: `--font-bold`, `--color-text-secondary`
- Challenge text: `--text-body-sm`, `--color-text-secondary`
- Implication: `--text-body-sm`, blue (link color), starts with →

---

### 9. Recommendation Card (Primary)

The featured solution concept. Elevated treatment.

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│ │                                                             │ │
│ │ [Shield icon]  PRIMARY RECOMMENDATION                       │ │
│ │                                                             │ │
│ │ High-Recovery RO Retrofit with Industrial Brine Sales       │ │
│ │ Pipeline                                                    │ │
│ │                                                             │ │
│ │ [CATALOG badge]  [85% confidence badge]                     │ │
│ │                                                             │ │
│ │ WHAT IT IS                                                  │ │
│ │ Description text...                                         │ │
│ │                                                             │ │
│ │ WHY IT WORKS                                                │ │
│ │ Explanation text...                                         │ │
│ │                                                             │ │
│ │ ┌─────────────────────────────────────────────────────┐     │ │
│ │ │ Expected    │ Timeline      │ Investment            │     │ │
│ │ │ Improvement │               │                       │     │ │
│ │ │ 30-50%      │ 12-18 months  │ $5-15M               │     │ │
│ │ └─────────────────────────────────────────────────────┘     │ │
│ │                                                             │ │
│ │ [THE INSIGHT section with left border]                      │ │
│ │                                                             │ │
│ │ [COUPLED EFFECTS section]                                   │ │
│ │                                                             │ │
│ │ [SUSTAINABILITY FLAG section]                               │ │
│ │                                                             │ │
│ │ [IP CONSIDERATIONS section]                                 │ │
│ │                                                             │ │
│ │ [FIRST VALIDATION STEP section]                             │ │
│ │                                                             │ │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Border: 1px `--color-border`, with subtle green tint for primary
- Border-radius: `--radius-xl`
- Background: Gradient from green-50 to white (subtle)
- Padding: `--spacing-card`
- Label: `--text-label`, green, tracking-widest, uppercase
- Title: `--text-title` (24px), `--font-semibold`
- Badges: See Badge specifications below
- Subsection labels: `--text-label`, tracking-widest, uppercase, muted
- Content: `--text-body-sm`, `--leading-relaxed`
- Economics grid: 3-column, light background, rounded-lg

---

### 10. Supporting Concept Card

Secondary concepts in compact format.

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Membrane Brine Concentration + MVR Thermal Finishing      │   │
│ │ (Proven ZLD Benchmark)                               [FALLBACK]│
│ │                                                           │   │
│ │ Description of the concept...                             │   │
│ │                                                           │   │
│ │ Why it works: Explanation...                              │   │
│ │                                                           │   │
│ │ ┌─────────────────────────────────────────────────────┐   │   │
│ │ │ When to use instead: Context for when this becomes  │   │   │
│ │ │ the preferred option...                             │   │   │
│ │ └─────────────────────────────────────────────────────┘   │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Background: `--color-bg-muted`
- Border-radius: `--radius-lg`
- Padding: `--space-3` (12px)
- Title: `--text-body`, `--font-medium`
- Description: `--text-body-sm`, `--color-text-secondary`
- "When to use" block: Left border (orange), lighter background

---

### 11. Innovation Concept Card

Higher-risk concepts with breakthrough potential.

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ [Sparkle icon]  RECOMMENDED INNOVATION                    │   │
│ │                                                           │   │
│ │ LNG Cold Energy Eutectic Freeze Crystallization           │   │
│ │                                                           │   │
│ │ [CROSS DOMAIN badge]  [55% confidence badge]              │   │
│ │                                                           │   │
│ │ WHAT IT IS                                                │   │
│ │ Description...                                            │   │
│ │                                                           │   │
│ │ WHY IT WORKS                                              │   │
│ │ Explanation...                                            │   │
│ │                                                           │   │
│ │ ┌─────────────────────────────────────────────────────┐   │   │
│ │ │ [Arrow up icon]  BREAKTHROUGH POTENTIAL              │   │   │
│ │ │                                                      │   │   │
│ │ │ Near-zero marginal energy cost...                    │   │   │
│ │ │ Estimated improvement: 70-85% reduction              │   │   │
│ │ └─────────────────────────────────────────────────────┘   │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Same structure as recommendation card, but:
- Label color: `--color-text-secondary` (not green)
- Icon: Sparkle/star instead of shield
- Breakthrough section: Green border, green-50 background

---

### 12. Coupled Effects Section

Shows impact on related systems. Uses color-coded impact indicators.

```
┌─────────────────────────────────────────────────────────────────┐
│ COUPLED EFFECTS                                                 │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Membrane operations                    [WORSE] [MODERATE] │   │
│ │                                                           │   │
│ │ Higher recovery increases membrane fouling risk           │   │
│ │ Quantified: Membrane replacement frequency may increase   │   │
│ │ 20-30%                                                    │   │
│ │                                                           │   │
│ │ Mitigation: Enhanced monitoring, optimized cleaning       │   │
│ │ protocols...                                              │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ LNG terminal operations                [BETTER] [MINOR]   │   │
│ │                                                           │   │
│ │ Brine provides heat sink for regasification               │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Item background: Color-coded based on BETTER/WORSE/NEUTRAL
  - BETTER: Green-50, green border
  - WORSE: Red-50, red border
  - NEUTRAL: Zinc-50, zinc border
- Impact badge: [WORSE/BETTER/NEUTRAL] colored appropriately
- Severity badge: [MINOR/MODERATE/MAJOR] in zinc/neutral
- Mitigation text: Blue color, smaller text

---

### 13. Frontier Technology Card

Technologies to watch. Dark blocks for developments/activity.

```
┌─────────────────────────────────────────────────────────────────┐
│ [1]                                                             │
│ Supercritical Water Brine Separation                            │
│                                         [TRL 3]  [PARADIGM]     │
│                                                                 │
│ Description of the technology...                                │
│                                                                 │
│ ┌─────────────────────────┐  ┌─────────────────────────────┐    │
│ │ TRIGGER TO REVISIT      │  │ EARLIEST VIABILITY          │    │
│ │                         │  │                             │    │
│ │ When X happens...       │  │ 8-12 years                  │    │
│ └─────────────────────────┘  └─────────────────────────────┘    │
│                                                                 │
│ ████████████████████████████████████████████████████████████    │
│ █ RECENT DEVELOPMENTS                                      █    │
│ █ Description of recent activity...                        █    │
│ █                                                          █    │
│ █ COMPETITIVE ACTIVITY                                     █    │
│ █ Description of competitive landscape...                  █    │
│ ████████████████████████████████████████████████████████████    │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Number badge: Amber-100 background, amber text, rounded-full
- TRL badge: Zinc-100 background
- Category badge: Purple-100 for PARADIGM, Blue-100 for EMERGING
- Trigger/Viability: 2-column grid, bordered cards
- Dark section: zinc-900 background, for developments

---

### 14. Badges

Standardized badge system across the report.

```css
/* Base Badge */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: var(--text-label);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
}

/* Confidence Badges */
.badge-confidence-high {
  background: var(--color-high-subtle);
  color: var(--color-high);
  border: 1px solid rgba(5, 150, 105, 0.2);
}

.badge-confidence-medium {
  background: var(--color-medium-subtle);
  color: var(--color-medium);
  border: 1px solid rgba(217, 119, 6, 0.2);
}

.badge-confidence-low {
  background: var(--color-low-subtle);
  color: var(--color-low);
  border: 1px solid var(--color-border);
}

/* Track Badges */
.badge-track-bestfit {
  background: var(--color-high-subtle);
  color: var(--color-high);
}

.badge-track-simpler {
  background: var(--color-bg);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.badge-track-spark {
  background: var(--color-spark-subtle);
  color: var(--color-spark);
}

/* Category Badges */
.badge-catalog {
  background: var(--color-high-subtle);
  color: var(--color-high);
}

.badge-cross-domain {
  background: var(--color-spark-subtle);
  color: var(--color-spark);
}

/* Status Badges */
.badge-trl {
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
}

/* Effect Badges */
.badge-better {
  background: rgba(5, 150, 105, 0.1);
  color: var(--color-high);
}

.badge-worse {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.badge-neutral {
  background: var(--color-bg-muted);
  color: var(--color-text-muted);
}
```

---

### 15. Domain Pills (Innovation Analysis)

Tags showing domains searched.

```
┌─────────────────────────────────────────────────────────────────┐
│ DOMAINS SEARCHED                                                │
│                                                                 │
│ [Chlor-alkali electrochemistry] [Oil & gas drilling fluids]     │
│ [LNG regasification thermodynamics] [Flue gas desulfurization]  │
│ [Halophilic biology] [Mineral carbonation]                      │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Background: `--color-bg-muted` (zinc-100)
- Border-radius: `--radius-full`
- Padding: `--space-1` vertical, `--space-3` horizontal
- Text: `--text-body-sm`, `--color-text-secondary`
- Gap: `--space-2`

---

### 16. Report Footer

Minimal, informational.

```
─────────────────────────────────────────────────────────────────
Report Version 4.0.0 | Generated 2025-01-13
Powered by Sparlo AI
```

**Specifications:**
- Border-top: 1px `--color-border`
- Padding-top: `--spacing-card-lg`
- Text: `--text-body-sm`, `--color-text-muted`, center-aligned
- Line-height: `--leading-relaxed`

---

## Motion & Animation

**Principle: Weighted and purposeful, or none.**

Motion should feel like physical objects with mass, not playful bouncing.

```css
/* Timing Functions */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* Primary - deceleration */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* Symmetrical */

/* Durations */
--duration-fast: 150ms;     /* Micro-interactions */
--duration-normal: 250ms;   /* Standard transitions */
--duration-slow: 400ms;     /* Page transitions, reveals */

/* When to animate */
- Hover states: subtle background shifts
- Focus states: ring appearance
- Expand/collapse: content reveals
- Page transitions: fade or subtle slide

/* When NOT to animate */
- Loading states (use static skeleton)
- Badge appearances
- Color changes on data
- Anything "playful" or "delightful"
```

---

## Iconography

**Principle: Functional only. No decoration.**

Icons appear only when they serve a functional purpose—navigation, affordance, or semantic meaning.

### When Icons Appear:
- Section headers: Optional, to indicate section type
- Badges: Optional, with label (e.g., shield for primary recommendation)
- Interactive elements: Navigation, buttons, links
- Status indicators: Check, warning, etc.

### When Icons Don't Appear:
- Body text
- Decorative purposes
- "Visual interest"
- Every list item

### Icon Style:
- Lucide React icons
- Stroke-based, 1.5-2px stroke
- Single color (inherits from text)
- Sizes: 16px (inline), 20px (headers), 24px (features)

---

## Implementation: Tailwind Configuration

```js
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Söhne', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Söhne Mono', 'SF Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        display: ['48px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        headline: ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        title: ['24px', { lineHeight: '1.35', letterSpacing: '-0.02em' }],
        subtitle: ['20px', { lineHeight: '1.35' }],
        'body-lg': ['18px', { lineHeight: '1.65' }],
        body: ['16px', { lineHeight: '1.5' }],
        'body-sm': ['14px', { lineHeight: '1.5' }],
        caption: ['12px', { lineHeight: '1.5' }],
        label: ['10px', { lineHeight: '1.2', letterSpacing: '0.1em' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.06)',
        'card-dark': '0 2px 8px rgba(0, 0, 0, 0.3)',
      },
    },
  },
};
```

---

## Usage Guidelines

### Do:
- Let typography carry the hierarchy
- Use generous whitespace between sections
- Keep color usage purposeful and semantic
- Maintain consistent spacing rhythm
- Use the full width for tables and data
- Show technical vocabulary without apology

### Don't:
- Add decorative icons or illustrations
- Use gradients or complex backgrounds
- Add "delight" animations
- Use marketing language in the report
- Add AI-related visuals (neural nets, sparkles, etc.)
- Over-explain or hedge

### The Test:
Show the report to a skeptical deep tech VC. Their reaction should be:
> "This doesn't look like AI output. This looks like something a research team produced. How is this possible?"

That cognitive dissonance—the inability to pattern-match to "AI tool"—is the goal.

---

## Component Inventory Checklist

All components that need implementation/update:

### Report Structure
- [ ] ReportContainer (max-width, padding)
- [ ] SectionHeader
- [ ] SectionSkeleton

### Content Blocks
- [ ] BriefSection
- [ ] ExecutiveSummary (with PrimaryRecommendation callout)
- [ ] FirstPrinciplesInsight (dark block)
- [ ] InformationCard (What's Wrong, Current State, etc.)
- [ ] ChallengeTheFrameCard

### Concepts
- [ ] PrimaryRecommendationCard (full featured)
- [ ] SupportingConceptCard
- [ ] InnovationConceptCard
- [ ] ParallelInvestigationCard
- [ ] FrontierTechnologyCard

### Data Display
- [ ] ConstraintsTable
- [ ] SuccessMetricsTable
- [ ] CurrentStateTable
- [ ] ConstraintsList (with bullet indicators)
- [ ] DomainPills

### Sub-components
- [ ] CoupledEffectsSection
- [ ] SustainabilityFlag
- [ ] IPConsiderations
- [ ] ValidationGate
- [ ] EconomicsGrid

### Badges
- [ ] ConfidenceBadge (High/Medium/Low)
- [ ] TrackBadge (Best Fit/Simpler Path/Spark)
- [ ] CategoryBadge (Catalog/Cross Domain)
- [ ] EffectBadge (Better/Worse/Neutral)
- [ ] TRLBadge
- [ ] StatusBadge

### Layout
- [ ] CardWithBorder
- [ ] CardWithLeftBorder
- [ ] DarkSection
- [ ] TwoColumnGrid
- [ ] ThreeColumnGrid

### Footer
- [ ] ReportFooter
