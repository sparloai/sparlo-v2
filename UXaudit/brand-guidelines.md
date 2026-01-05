# Sparlo Brand Guidelines

## Design Philosophy

Sparlo's design language is inspired by **Air Company** and **Palantir**: restraint, confidence, technical precision, and near-monochromatic styling. We are a deep-tech platform, not a typical consumer SaaS tool.

**Core Principles:**
1. **Restraint over decoration** - Every element must earn its place
2. **Typography-driven hierarchy** - Let the content speak
3. **Technical confidence** - We serve engineers, speak their language
4. **Industrial aesthetic** - Think lab equipment, not lifestyle app

---

## Color System

### Primary Palette (Zinc Only)

| Token | Hex | Usage |
|-------|-----|-------|
| zinc-950 | #09090b | Primary background |
| zinc-900 | #18181b | Secondary background, cards |
| zinc-800 | #27272a | Elevated surfaces |
| zinc-700 | #3f3f46 | Borders, dividers |
| zinc-600 | #52525b | Hover borders |
| zinc-500 | #71717a | Disabled text |
| zinc-400 | #a1a1aa | Secondary text |
| zinc-300 | #d4d4d8 | Tertiary text |
| zinc-50 | #fafafa | Primary text |

### Forbidden Colors
Do NOT use saturated colors in the UI. These break the industrial aesthetic:
- ❌ Blue (#3b82f6)
- ❌ Green (#22c55e) 
- ❌ Red (#ef4444)
- ❌ Yellow (#eab308)
- ❌ Purple (#8b5cf6)

**Exception:** Semantic colors for system states only:
- Success: zinc-400 with subtle green tint OR text indicator
- Error: zinc-400 with subtle red tint OR text indicator
- Warning: Text-only, no colored backgrounds

---

## Typography

### Font Stack
```css
font-family: 'Suisse Intl', system-ui, -apple-system, sans-serif;
```

### Type Scale

| Element | Class | Properties |
|---------|-------|------------|
| H1 | text-4xl | font-medium tracking-tight |
| H2 | text-2xl | font-medium |
| H3 | text-xl | font-medium |
| H4 | text-lg | font-medium |
| Body | text-base | font-normal |
| Small | text-sm | font-normal text-zinc-400 |
| Caption | text-xs | font-normal text-zinc-500 |

### Rules
- No bold text except for emphasis within body copy
- Headings use `font-medium`, never `font-bold`
- Line height: 1.5 for body, 1.2 for headings
- Letter spacing: tight (-0.025em) for headings only

---

## Spacing System

Base unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Inline spacing, icon gaps |
| space-2 | 8px | Tight element spacing |
| space-3 | 12px | Related element groups |
| space-4 | 16px | Standard padding |
| space-6 | 24px | Card padding |
| space-8 | 32px | Section spacing |
| space-12 | 48px | Major section breaks |
| space-16 | 64px | Page section spacing |

---

## Components

### Buttons

```css
/* Primary */
.btn-primary {
  @apply bg-zinc-50 text-zinc-900 
         hover:bg-zinc-200 
         px-4 py-2 
         text-sm font-medium
         rounded-md;
}

/* Secondary */
.btn-secondary {
  @apply bg-transparent text-zinc-50 
         border border-zinc-700 
         hover:border-zinc-500 hover:bg-zinc-800/50
         px-4 py-2 
         text-sm font-medium
         rounded-md;
}

/* Ghost */
.btn-ghost {
  @apply bg-transparent text-zinc-400 
         hover:text-zinc-50 hover:bg-zinc-800/50
         px-3 py-2 
         text-sm
         rounded-md;
}
```

**Button Rules:**
- No gradients
- No shadows
- Border radius: 6px max (rounded-md)
- Transitions: 150ms ease

### Cards

```css
.card {
  @apply bg-zinc-900/50 
         border border-zinc-700/50 
         rounded-lg 
         p-6;
}

.card-elevated {
  @apply bg-zinc-800/50 
         border border-zinc-700 
         rounded-lg 
         p-6;
}
```

**Card Rules:**
- No drop shadows
- Subtle border only
- Semi-transparent backgrounds for depth

### Inputs

```css
.input {
  @apply bg-zinc-900 
         border border-zinc-700 
         rounded-md 
         px-4 py-2 
         text-zinc-50 
         placeholder:text-zinc-500
         focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500;
}
```

---

## Microinteractions

### Transitions
- Default duration: 150ms
- Hover states: 200ms
- Page transitions: 300ms
- Easing: ease-out for enter, ease-in for exit

### Hover States
Every interactive element MUST have a visible hover state:
- Buttons: Background color change
- Links: Color change (zinc-400 → zinc-50)
- Cards: Border color change

### Focus States
WCAG compliant focus indicators:
- Focus ring: 2px zinc-500
- Or: Outline offset with high contrast

### Loading States
- Use skeleton loaders for content areas
- Use subtle pulse animation for skeleton
- Spinner for actions (submit buttons)

---

## Iconography

### Style
- Line icons only (no filled)
- Stroke width: 1.5px
- Size: 16px (small), 20px (default), 24px (large)

### Source
- Lucide icons (lucide.dev)
- Custom icons must match Lucide style

---

## Voice & Tone

### Do:
- "Generate your report"
- "Analysis complete"
- "3 concepts identified"
- "View detailed breakdown"

### Don't:
- "🎉 Exciting news!"
- "Your amazing report is ready!"
- "We found some super cool concepts!"
- "Click here to see the magic!"

### Content Rules:
- No emoji in UI (except user-generated content)
- No exclamation marks in UI copy
- Technical but accessible language
- Confident, not boastful

---

## Anti-Patterns

These are explicitly FORBIDDEN:

1. **Gradient backgrounds** - Flat colors only
2. **Drop shadows** - Use borders for elevation
3. **Rounded pill buttons** - Max border-radius is 8px
4. **Colorful illustrations** - Monochrome or photo only
5. **Playful animations** - Subtle, purposeful motion only
6. **Marketing buzzwords** - "Revolutionary", "Game-changing"
7. **Stock photography** - Industrial/technical imagery only
8. **Emoji** - Never in official UI
9. **Multiple font families** - Suisse Intl only
10. **Colored badges/tags** - Zinc palette only

---

## Implementation Checklist

Before shipping any UI:

- [ ] All colors are from zinc palette
- [ ] Typography follows scale exactly
- [ ] Spacing uses 4px grid
- [ ] All interactive elements have hover states
- [ ] Focus states are WCAG compliant
- [ ] No forbidden patterns present
- [ ] Loading/empty states are styled
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] Voice/tone matches guidelines
