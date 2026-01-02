---
title: PDF Export Styling Mismatch with Web Design System
description: PDF exports had incorrect styling (ALL CAPS labels, wrong read time, heavy title weight) that didn't match the web design system
category: ui
severity: medium
date_solved: 2026-01-02
tags:
  - pdf-export
  - styling
  - design-system
  - typography
  - puppeteer
related_components:
  - print-styles.ts
  - render-report-html.ts
  - brand-system-report.tsx
related_docs:
  - docs/SPARLO-DESIGN-SYSTEM.md
  - docs/solutions/logic-errors/pdf-export-field-name-normalization.md
---

# PDF Export Styling Mismatch with Web Design System

## Problem

PDF exports from reports had multiple styling inconsistencies with the web design system:

1. **ALL CAPS mono labels** - Labels like "The Problem", "Core Insight" appeared in uppercase due to `text-transform: uppercase` CSS
2. **Incorrect read time estimation** - Used naive word count (all text / 200 WPM) instead of content-type specific calculation
3. **Heavy report title** - Font weight was 600 (bold) instead of 400 (regular)
4. **Typography mismatches** - Wrong line heights, letter spacing didn't match web primitives

## Root Cause

Multiple issues:

1. **CSS divergence**: `print-styles.ts` had `text-transform: uppercase` on `.mono-label` classes while web `primitives.tsx` did not
2. **Different read time algorithms**: PDF used recursive text extraction with single WPM rate; web used content-type specific rates
3. **Stale cache**: `.next` cache compiled Dec 30 wasn't recompiling API routes when styles changed

## Solution

### 1. Remove Uppercase from Mono Labels

**File**: `apps/web/app/api/reports/[id]/print/_lib/print-styles.ts`

```css
/* Before */
.mono-label {
  display: block;
  font-size: 10pt;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;  /* REMOVED */
  color: var(--zinc-500);
  margin-bottom: 8px;
}

/* After */
.mono-label {
  display: block;
  font-size: 10pt;
  font-weight: 600;
  letter-spacing: 0.02em;  /* Reduced */
  color: var(--zinc-500);
  margin-bottom: 8px;
}
```

Same change for `.mono-label-strong` and `.mono-label-muted`.

### 2. Fix Report Title Typography

```css
/* Before */
.report-title {
  font-size: 32pt;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--zinc-900);
  margin-bottom: 16px;
}

/* After */
.report-title {
  font-size: 30pt;
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--zinc-900);
  margin-bottom: 16px;
}
```

### 3. Content-Type Specific Read Time Calculation

**File**: `apps/web/app/api/reports/[id]/print/_lib/render-report-html.ts`

Replace naive word count with content-aware calculation matching web implementation:

```typescript
// Reading speed constants (words per minute)
const WPM_PROSE = 150;           // Technical prose - dense
const WPM_HEADLINE = 300;        // Headlines - scanned quickly
const WPM_LIST_ITEM = 220;       // Bullet points - structured
const SECONDS_PER_TABLE_ROW = 3; // Fixed time per table row

function calculateReadTime(data: HybridReportData): number {
  let proseWords = 0;
  let headlineWords = 0;
  let listItemWords = 0;
  let tableRows = 0;

  const countWords = (text: string | undefined | null): number => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // Extract from specific rendered fields...
  proseWords += countWords(data.brief);

  if (data.executive_summary) {
    proseWords += countWords(data.executive_summary.narrative_lead);
    headlineWords += countWords(data.executive_summary.core_insight?.headline);
    // ... etc
  }

  // Calculate weighted time
  const proseMinutes = proseWords / WPM_PROSE;
  const headlineMinutes = headlineWords / WPM_HEADLINE;
  const listMinutes = listItemWords / WPM_LIST_ITEM;
  const tableMinutes = (tableRows * SECONDS_PER_TABLE_ROW) / 60;

  return Math.max(1, Math.round(
    proseMinutes + headlineMinutes + listMinutes + tableMinutes
  ));
}
```

### 4. Clear Cache When Styles Don't Update

```bash
rm -rf apps/web/.next
pnpm dev
```

## Prevention

1. **Keep PDF and web styles in sync** - Consider extracting shared typography constants
2. **Share read time calculation** - The function should be imported from a shared location
3. **Test PDF export after design changes** - Add to PR checklist
4. **Clear `.next` cache** when API route changes aren't reflected

## Related Commits

- `6c50f73` - fix: lighten report title weight and adjust typography
- `0f12fbb` - fix: remove uppercase mono labels and fix PDF read time calculation
- `09e6a6c` - feat: update PDF styles to match web design system

## Files Modified

- `apps/web/app/api/reports/[id]/print/_lib/print-styles.ts`
- `apps/web/app/api/reports/[id]/print/_lib/render-report-html.ts`
