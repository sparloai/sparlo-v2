# Aura-Inspired UI/UX Redesign

**Solution Documentation**

Premium UI redesign with glassmorphic navigation, Söhne typography, and cohesive theming.

## Design Philosophy

- **Premium through precision** - Typography does the work
- **Technical authority** - Monospace for data
- **Ambient presence** - Subtle glows, not hard edges

## Typography

```css
/* Prose */
font-family: 'Soehne', 'Inter', sans-serif;

/* Data/Labels */
font-family: 'Soehne Mono', 'JetBrains Mono', monospace;
```

## Color System (OKLCH)

```css
:root {
  --surface-base: oklch(100% 0 0);
  --text-primary: oklch(15% 0 0);
  --accent: oklch(55% 0.15 270);
}

.dark {
  --surface-base: oklch(12% 0 0);
  --text-primary: oklch(95% 0 0);
}
```

## Component Patterns

### Glassmorphic Card
```tsx
<div className="bg-[--surface-overlay] backdrop-blur-xl rounded-2xl">
```

### Status Indicators
- Processing: Purple + pulse animation
- Complete: Green + glow shadow
- Failed: Red solid

### Report States
- Processing: `bg-violet-500/5`
- Complete: Hover with chevron
- Failed: `bg-red-500/5` + retry button

## Key Files

- `/apps/web/styles/sparlo-tokens.css`
- `/apps/web/lib/fonts.ts`
- `/apps/web/app/home/(user)/_lib/animation-constants.ts`

**Version**: 1.0 | **Updated**: 2025-12-19
