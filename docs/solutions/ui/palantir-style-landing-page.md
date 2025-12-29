---
title: "Palantir-Style Technical Landing Page"
category: ui
tags: [landing-page, css-animations, design-system, accessibility, dark-mode]
severity: low
date_documented: 2025-12-24
---

# Palantir-Style Technical Landing Page

## Problem

Needed a distinctive, technical-looking landing page that conveys AI/engineering sophistication. The design needed to feel enterprise-grade, modern, and visually distinctive while maintaining usability and accessibility.

## Solution

Implemented a Palantir-inspired hero section with advanced CSS techniques and carefully orchestrated animations. The approach leverages CSS gradients, masks, and staggered animations to create a sophisticated technical aesthetic.

### Technical Grid Background

The foundation is a fixed technical grid that creates depth and visual interest:

```css
/* Technical Grid Background */
.technical-grid-bg {
  position: fixed;
  inset: 0;
  background-size: 40px 40px;
  background-image:
    linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}
```

**Key aspects:**
- **Fixed positioning**: Creates a persistent background that doesn't scroll
- **Grid pattern**: Two perpendicular gradients create the grid effect
- **Subtle opacity**: `rgba(0,0,0,0.03)` ensures the grid doesn't overpower content
- **Mask gradient**: Fades the grid out toward the bottom for a refined effect
- **Pointer events**: Grid doesn't interfere with interactive elements

### Staggered Animation Reveals

Animate headline elements with carefully timed sequences:

```css
/* Base animation */
@keyframes headline-reveal {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 0;
    opacity: 1;
    transform: translateY(0);
  }
}

/* Staggered reveal class */
.animate-headline-reveal {
  animation: headline-reveal 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 300ms;
  opacity: 0;
}
```

**Animation variables:**
- **Duration**: 600ms - long enough to feel intentional but not sluggish
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` - custom easing for elegant deceleration
- **Delay**: 300ms - creates visual hierarchy among elements

Apply different delays to sequential elements:

```css
.headline-line-1 { animation-delay: 300ms; }
.headline-line-2 { animation-delay: 450ms; }
.headline-line-3 { animation-delay: 600ms; }
.cta-button { animation-delay: 750ms; }
```

### Blinking Cursor Effect

Create a terminal-like cursor for technical authenticity:

```css
@keyframes cursor-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.blinking-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: currentColor;
  animation: cursor-blink 1s ease-in-out infinite;
  margin-left: 4px;
}
```

**Considerations:**
- **Pulse effect**: 1-second cycle for human-readable timing
- **Thin line**: 2px width mimics terminal cursor
- **Color inheritance**: Uses `currentColor` to adapt to theme

### Corner Registration Marks

Add design authenticity with registration marks in corners:

```css
.registration-mark {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 1px solid rgba(100, 200, 255, 0.3);
}

.registration-mark::before,
.registration-mark::after {
  content: '';
  position: absolute;
  background-color: rgba(100, 200, 255, 0.3);
}

.registration-mark::before {
  width: 100%;
  height: 1px;
  top: 50%;
  left: 0;
}

.registration-mark::after {
  width: 1px;
  height: 100%;
  top: 0;
  left: 50%;
}

/* Position in corners */
.registration-mark.top-left { top: 0; left: 0; }
.registration-mark.top-right { top: 0; right: 0; }
.registration-mark.bottom-left { bottom: 0; left: 0; }
.registration-mark.bottom-right { bottom: 0; right: 0; }
```

### Stats Ticker with System Metrics

Display system-like metrics in a technical font:

```css
.stats-ticker {
  display: flex;
  gap: 32px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: rgba(100, 200, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  opacity: 0.6;
  font-size: 10px;
}

.stat-value {
  font-weight: bold;
  color: rgba(100, 200, 255, 1);
  font-size: 14px;
}
```

### Dark Mode Support

Leverage CSS custom properties for theme flexibility:

```css
:root {
  /* Light mode */
  --grid-color: rgba(0, 0, 0, 0.03);
  --accent-color: rgb(100, 200, 255);
  --accent-color-light: rgba(100, 200, 255, 0.7);
  --text-color: rgb(0, 0, 0);
  --bg-color: rgb(255, 255, 255);
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark mode */
    --grid-color: rgba(255, 255, 255, 0.03);
    --accent-color: rgb(100, 200, 255);
    --accent-color-light: rgba(100, 200, 255, 0.5);
    --text-color: rgb(255, 255, 255);
    --bg-color: rgb(10, 10, 20);
  }
}

/* Apply variables */
.technical-grid-bg {
  background-image:
    linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px);
}

.stats-ticker {
  color: var(--accent-color-light);
}
```

## Accessibility Considerations

### Reduced Motion Support

Respect user preferences for animations:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .animate-headline-reveal {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

### Focus States on CTAs

Ensure keyboard navigation is visible:

```css
.cta-button {
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.cta-button:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

.cta-button:hover {
  box-shadow: 0 0 24px rgba(100, 200, 255, 0.4);
  transform: scale(1.05);
}
```

### Semantic HTML

Use proper heading hierarchy and ARIA labels where needed:

```html
<header role="banner">
  <h1>Your Product Headline</h1>
  <p>Subheading text</p>
  <button aria-label="Get started with our platform">Get Started</button>
</header>
```

## Implementation Pattern

1. **Layer structure**: Fixed grid background → Content → Interactive elements
2. **Z-index strategy**: Grid at 0, content at 10+, modals at 1000+
3. **Animation sequence**: Sequential delays create visual narrative
4. **Performance**: Use `will-change` sparingly on animated elements

```css
/* Optional: Optimize animation performance */
.animate-headline-reveal {
  will-change: opacity, transform;
}

/* Remove will-change after animation completes */
.animate-headline-reveal:not(:hover) {
  will-change: auto;
}
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Gradients: Full support
- CSS Masks: Full support in modern browsers
- Custom Properties: Full support
- Reduced Motion: Widely supported

## Related Patterns

- CSS Animation Easing: Use cubic-bezier() for custom timing functions
- Mask Gradients: Create sophisticated depth effects with `mask-image`
- Theme Switching: Leverage CSS custom properties for mode toggles
- Performance Optimization: Monitor paint/composite operations in DevTools

## References

- [CSS Animations on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/animation)
- [CSS Mask on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/mask)
- [Prefers Reduced Motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Focus Visible Styles](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
