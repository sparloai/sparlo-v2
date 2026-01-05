# Prevention Strategies for PDF Export Styling Issues

## Overview

This document outlines prevention strategies to avoid the styling inconsistencies and build issues that occurred during PDF export implementation. The issues included divergent styles between web and PDF (MonoLabel uppercase styling), different read time calculations, and stale Next.js cache preventing API route recompilation.

---

## Issue 1: PDF & Web Styles Divergence

### Problem
- **Symptom**: MonoLabel component rendered with `uppercase` in PDF but not in web
- **Root Cause**: Print styles (`print-styles.ts`) and web primitives (`primitives.tsx`) evolved independently without shared constants
- **Impact**: Visual inconsistencies between exported PDF and web display

### Prevention Strategy 1.1: Extract Shared Style Constants

**Action**: Create a centralized constants file for typography and styling values that both web and PDF can reference.

**File**: `/apps/web/app/home/(user)/reports/_lib/constants/design-tokens.ts`

```typescript
/**
 * Shared design tokens for web and PDF rendering
 * This is the single source of truth for typography and styling
 */

// Typography - Font Sizes
export const TYPOGRAPHY = {
  // Headings
  heading: {
    xl: { size: 36, weight: 600, lineHeight: 1.2, letterSpacing: -0.02 },
    lg: { size: 28, weight: 600, lineHeight: 1.2, letterSpacing: -0.02 },
    md: { size: 24, weight: 600, lineHeight: 1.2, letterSpacing: -0.02 },
  },

  // Body text
  body: {
    lg: { size: 22, weight: 400, lineHeight: 1.3, letterSpacing: -0.02 },
    md: { size: 18, weight: 400, lineHeight: 1.3, letterSpacing: -0.02 },
    sm: { size: 16, weight: 400, lineHeight: 1.3, letterSpacing: -0.02 },
  },

  // Labels (MonoLabel)
  label: {
    size: 13,
    weight: 600,
    lineHeight: 1.2,
    letterSpacing: 0.06, // 0.06em = 6%
    textTransform: 'uppercase' as const, // SHARED: Must appear in both web and PDF
  },
};

// Color palette - Zinc monochrome
export const COLORS = {
  zinc: {
    950: '#09090b',
    900: '#18181b',
    800: '#27272a',
    700: '#3f3f46',
    600: '#52525b',
    500: '#71717a',
    400: '#a1a1aa',
    300: '#d4d4d8',
    200: '#e4e4e7',
    100: '#f4f4f5',
    50: '#fafafa',
  },
  white: '#ffffff',
};

// MonoLabel variant colors
export const MONO_LABEL_VARIANTS = {
  default: {
    color: COLORS.zinc[500],
  },
  muted: {
    color: COLORS.zinc[400],
  },
  strong: {
    color: COLORS.zinc[900],
  },
} as const;

// Spacing scale
export const SPACING = {
  px: 1,
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
  16: 64,
  24: 96,
} as const;
```

**File**: `/apps/web/app/home/(user)/reports/_components/brand-system/primitives.tsx`

Update to use constants:

```typescript
import { TYPOGRAPHY, MONO_LABEL_VARIANTS } from '../_lib/constants/design-tokens';

export const MonoLabel = memo(function MonoLabel({
  children,
  className,
  variant = 'default',
}: MonoLabelProps) {
  const variantClasses = {
    default: cn('text-zinc-500'),
    muted: cn('text-zinc-400'),
    strong: cn('text-zinc-900'),
  };

  return (
    <span
      className={cn(
        // Use constants for all typography properties
        `text-[${TYPOGRAPHY.label.size}px]`,
        'font-semibold',
        `tracking-[${TYPOGRAPHY.label.letterSpacing}em]`,
        'uppercase', // EXPLICITLY SET - also in print-styles
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
});
```

**File**: `/apps/web/app/api/reports/[id]/print/_lib/print-styles.ts`

Update PDF styles to use same constants:

```typescript
import { TYPOGRAPHY, COLORS } from '../../../home/(user)/reports/_lib/constants/design-tokens';

const styles = StyleSheet.create({
  monoLabel: {
    fontSize: TYPOGRAPHY.label.size,
    fontWeight: TYPOGRAPHY.label.weight,
    letterSpacing: TYPOGRAPHY.label.letterSpacing * 10, // PDF uses raw value
    textTransform: TYPOGRAPHY.label.textTransform, // 'uppercase'
    color: COLORS.zinc[500],
  },
  monoLabelMuted: {
    color: COLORS.zinc[400],
  },
  monoLabelStrong: {
    color: COLORS.zinc[900],
  },
});
```

### Prevention Strategy 1.2: Regular Style Audits

**Action**: Create a test that validates parity between web and PDF component styling.

**File**: `/apps/e2e/tests/pdf-style-parity.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('PDF Export Style Parity', () => {
  test('MonoLabel renders with uppercase in both web and PDF', async ({ page }) => {
    // 1. Navigate to report with MonoLabels
    await page.goto('/home/personal/reports/test-report');

    // 2. Check web rendering - MonoLabel should have uppercase
    const webMonoLabel = page.locator('[data-test="mono-label"]').first();
    const webText = await webMonoLabel.textContent();
    expect(webText?.trim()).toBe(webText?.trim().toUpperCase());

    // 3. Export PDF
    const pdfPromise = page.waitForEvent('popup');
    await page.click('[data-test="export-pdf"]');
    const pdfPage = await pdfPromise;

    // 4. Extract text from PDF
    const pdfText = await pdfPage.textContent();

    // 5. Verify MonoLabel appears in uppercase in PDF
    // (Check PDF contains uppercase version of label text)
    expect(pdfText).toContain(webText?.toUpperCase());
  });

  test('All typography sizes match between web and PDF', async ({ page }) => {
    // Validate heading sizes, body sizes, etc. are consistent
    // Compare computed styles with expected design token values
  });
});
```

### Prevention Strategy 1.3: Version Lock Design Tokens

**Action**: When updating `design-tokens.ts`, require updates to ALL affected files.

**Pre-commit Hook**: Add to `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check if design tokens were modified
if git diff --cached --name-only | grep -q "design-tokens.ts"; then
  # Require that print-styles.ts is also updated in the same commit
  if ! git diff --cached --name-only | grep -q "print-styles.ts"; then
    echo "ERROR: design-tokens.ts was modified but print-styles.ts was not updated"
    echo "When updating design tokens, you must update ALL files that reference them:"
    echo "  - primitives.tsx (web components)"
    echo "  - print-styles.ts (PDF styles)"
    exit 1
  fi
fi

pnpm lint:fix
```

---

## Issue 2: Read Time Calculation Divergence

### Problem
- **Symptom**: Read time showed 42 min in PDF, 5 min on web for same content
- **Root Cause**: Different calculation logic or different content extraction between web and PDF
- **Impact**: User confusion about content complexity and actual reading time

### Prevention Strategy 2.1: Extract Shared Read Time Function

**Action**: Create a single, shared `calculateReadTime` function that both web and PDF use.

**File**: `/apps/web/app/home/(user)/reports/_lib/utils/calculate-read-time.ts`

```typescript
/**
 * Accurate read time calculation based on content type
 * Used by both web UI and PDF export
 *
 * Reading speeds by content type (research-based):
 * - Technical prose: 150 WPM (requires comprehension)
 * - Narrative prose: 180 WPM (easier flow)
 * - Headlines: 300 WPM (scanned quickly)
 * - List items: 220 WPM (structured, easier to parse)
 * - Table rows: 3 seconds each (fixed time per row)
 */

import type { HybridReportData } from '../types/hybrid-report-display.types';

// Constants for reading speeds - SHARED SOURCE OF TRUTH
export const WPM_PROSE = 150;
export const WPM_HEADLINE = 300;
export const WPM_LIST_ITEM = 220;
export const SECONDS_PER_TABLE_ROW = 3;

const countWords = (text: string | undefined | null): number => {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

/**
 * Calculate read time by extracting ONLY rendered content fields
 * and applying content-type specific reading speeds
 */
export function calculateReadTime(data: HybridReportData): number {
  let proseWords = 0;
  let headlineWords = 0;
  let listItemWords = 0;
  let tableRows = 0;

  // === PROSE CONTENT (150 WPM) ===
  // Brief (always rendered)
  proseWords += countWords(data.brief);

  // Executive Summary
  if (typeof data.executive_summary === 'string') {
    proseWords += countWords(data.executive_summary);
  } else if (data.executive_summary) {
    proseWords += countWords(data.executive_summary.narrative_lead);
    proseWords += countWords(data.executive_summary.the_problem);
    proseWords += countWords(data.executive_summary.core_insight?.explanation);
    proseWords += countWords(data.executive_summary.primary_recommendation);
  }

  // Problem Analysis
  if (data.problem_analysis) {
    proseWords += countWords(data.problem_analysis.whats_wrong?.prose);
    proseWords += countWords(data.problem_analysis.why_its_hard?.prose);
    proseWords += countWords(data.problem_analysis.first_principles_insight?.explanation);
    tableRows += data.problem_analysis.current_state_of_art?.benchmarks?.length || 0;
  }

  // Constraints
  if (data.constraints_and_metrics) {
    data.constraints_and_metrics.hard_constraints?.forEach(c => {
      listItemWords += countWords(c);
    });
    data.constraints_and_metrics.soft_constraints?.forEach(c => {
      listItemWords += countWords(c);
    });
    data.constraints_and_metrics.assumptions?.forEach(a => {
      listItemWords += countWords(a);
    });
    tableRows += data.constraints_and_metrics.success_metrics?.length || 0;
  }

  // Challenge the Frame
  data.challenge_the_frame?.forEach(c => {
    listItemWords += countWords(c.assumption);
    listItemWords += countWords(c.challenge);
    listItemWords += countWords(c.implication);
  });

  // Execution Track
  if (data.execution_track?.primary) {
    const p = data.execution_track.primary;
    headlineWords += countWords(p.title);
    headlineWords += countWords(p.bottom_line);
    proseWords += countWords(p.what_it_is);
    proseWords += countWords(p.why_it_works);
    tableRows += p.validation_gates?.length || 0;
  }

  // Innovation Portfolio
  if (data.innovation_portfolio?.recommended_innovation) {
    const r = data.innovation_portfolio.recommended_innovation;
    headlineWords += countWords(r.title);
    proseWords += countWords(r.what_it_is);
    proseWords += countWords(r.why_it_works);
  }

  // Risks & Watchouts
  data.risks_and_watchouts?.forEach(r => {
    listItemWords += countWords(r.risk);
    listItemWords += countWords(r.mitigation);
  });

  // Self Critique
  if (data.self_critique) {
    proseWords += countWords(data.self_critique.confidence_rationale);
    data.self_critique.what_we_might_be_wrong_about?.forEach(w => {
      listItemWords += countWords(w);
    });
  }

  // Final Recommendation
  proseWords += countWords(data.what_id_actually_do);

  // Key Insights & Next Steps
  data.key_insights?.forEach(i => listItemWords += countWords(i));
  data.next_steps?.forEach(s => listItemWords += countWords(s));

  // === CALCULATE TOTAL TIME ===
  const proseMinutes = proseWords / WPM_PROSE;
  const headlineMinutes = headlineWords / WPM_HEADLINE;
  const listMinutes = listItemWords / WPM_LIST_ITEM;
  const tableMinutes = (tableRows * SECONDS_PER_TABLE_ROW) / 60;

  const totalMinutes = proseMinutes + headlineMinutes + listMinutes + tableMinutes;

  return Math.max(1, Math.round(totalMinutes));
}
```

**File**: `/apps/web/app/home/(user)/reports/_components/brand-system/brand-system-report.tsx`

Update to import shared function:

```typescript
import { calculateReadTime } from '../_lib/utils/calculate-read-time';

// Remove old calculateReadTime function (lines 100-141)
// Replace with import above

// Usage remains the same:
const readTime = useMemo(() => calculateReadTime(data), [data]);
```

**File**: `/apps/web/app/api/reports/[id]/pdf/_components/report-pdf-document.tsx`

Update PDF generation to use same function:

```typescript
import { calculateReadTime } from '../../../home/(user)/reports/_lib/utils/calculate-read-time';

// In the PDF document component where metadata is rendered:
const readTime = calculateReadTime(reportData);

// Render read time in PDF header/metadata using same calculation
<Text>{readTime} min read</Text>
```

### Prevention Strategy 2.2: Test Read Time Calculation Independently

**File**: `/apps/web/app/home/(user)/reports/_lib/utils/__tests__/calculate-read-time.test.ts`

```typescript
import { calculateReadTime } from '../calculate-read-time';
import type { HybridReportData } from '../../types/hybrid-report-display.types';

describe('calculateReadTime', () => {
  it('should calculate read time with known test data', () => {
    const testData: Partial<HybridReportData> = {
      brief: 'A'.repeat(1000), // ~1000 words
      executive_summary: {
        narrative_lead: 'B'.repeat(500), // ~500 words
        // ... other fields
      },
      // ... other sections
    };

    const readTime = calculateReadTime(testData as HybridReportData);

    // With ~1500 prose words at 150 WPM = 10 minutes
    expect(readTime).toBe(10);
  });

  it('should match between web and PDF calculations', () => {
    const reportData = require('../../fixtures/test-report.json');

    const webReadTime = calculateReadTime(reportData);
    // Both use same function now, so they're guaranteed to match
    expect(webReadTime).toBeGreaterThan(0);
  });
});
```

### Prevention Strategy 2.3: Display Read Time Source Information

**Action**: Add comments to show where read time is calculated for transparency.

**Web UI**: Add data attribute showing calculation

```typescript
<span data-calculation="calculateReadTime" data-location="brand-system-report.tsx">
  {readTime} min read
</span>
```

**PDF**: Add comment in PDF indicating calculation source

```typescript
// In report-pdf-document.tsx
<Text style={{ fontSize: 9, color: '#999' }}>
  {readTime} min read (calculated via shared calculateReadTime utility)
</Text>
```

---

## Issue 3: Stale Next.js Cache Preventing API Route Recompilation

### Problem
- **Symptom**: Changes to API routes don't reflect in PDF output; `.next` cache is stale
- **Root Cause**: Next.js caches compiled API routes; clearing cache manually required
- **Impact**: Developers spend time debugging when solution is cache invalidation

### Prevention Strategy 3.1: Automatic Cache Clearing on Development Start

**File**: `/apps/web/package.json`

Update dev script to clear cache:

```json
{
  "scripts": {
    "dev": "rm -rf .next && next dev",
    "dev:incremental": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

### Prevention Strategy 3.2: Cache Invalidation on API Route Changes

**File**: `/apps/web/.husky/post-checkout`

Create post-checkout hook to clear cache after git checkout:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Clear .next cache after checkout to prevent stale API routes
if [ -d ".next" ]; then
  echo "Clearing .next cache after branch switch..."
  rm -rf .next
fi
```

### Prevention Strategy 3.3: Document Cache Troubleshooting

**File**: `/docs/TROUBLESHOOTING.md`

Add section:

```markdown
## PDF Export Issues

### PDF Shows Old Content or Styling

**Problem**: You've updated PDF styling or API routes, but the PDF export shows old content.

**Solution**: Clear Next.js cache

```bash
# Option 1: Automatic (on next dev start)
rm -rf apps/web/.next
pnpm dev

# Option 2: Manual cache clear during development
rm -rf apps/web/.next
pnpm dev:incremental
```

**Why this happens**:
- Next.js compiles and caches API routes in `.next/` directory
- Changes to files in `app/api/` won't be picked up until cache is invalidated
- This is particularly important for PDF export routes that depend on styling imports

**When to clear cache**:
- ✓ After updating `app/api/reports/[id]/pdf/*`
- ✓ After updating `app/api/reports/[id]/print/_lib/print-styles.ts`
- ✓ After adding/modifying shared style constants
- ✓ If switching git branches (automatic via post-checkout hook)

**Prevention**:
- Run `pnpm dev` (not `pnpm dev:incremental`) to auto-clear on startup
- The post-checkout hook auto-clears when changing branches
```

### Prevention Strategy 3.4: Add Health Check for API Routes

**File**: `/apps/web/scripts/verify-api-routes.ts`

Create verification script:

```typescript
/**
 * Verify API routes are compiled and responding correctly
 * Run this after clearing .next cache or after major updates
 */

import fs from 'fs';
import path from 'path';

const API_ROUTE_PATHS = [
  '.next/server/app/api/reports/[id]/pdf/route',
  '.next/server/app/api/reports/[id]/print/route',
];

function verifyApiRoutes() {
  console.log('Checking API route compilation...\n');

  let allPresent = true;

  for (const routePath of API_ROUTE_PATHS) {
    const fullPath = path.join(process.cwd(), routePath + '.js');
    const exists = fs.existsSync(fullPath);

    const status = exists ? '✓' : '✗';
    console.log(`${status} ${routePath}`);

    if (!exists) allPresent = false;
  }

  if (!allPresent) {
    console.error('\n⚠️  Some API routes are not compiled!');
    console.error('Run: rm -rf .next && pnpm dev\n');
    process.exit(1);
  }

  console.log('\n✓ All API routes compiled successfully\n');
}

verifyApiRoutes();
```

Add to `package.json`:

```json
{
  "scripts": {
    "verify:api-routes": "ts-node scripts/verify-api-routes.ts"
  }
}
```

### Prevention Strategy 3.5: Add CI Check for Cache Issues

**File**: `.github/workflows/pdf-export.yml`

Add workflow check:

```yaml
name: PDF Export Tests

on: [push, pull_request]

jobs:
  pdf-export:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup pnpm
        uses: pnpm/action-setup@v2

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      # CRITICAL: Clear cache to ensure fresh API route compilation
      - name: Clear Next.js cache
        run: rm -rf apps/web/.next

      - name: Install dependencies
        run: pnpm install

      - name: Build web app
        run: pnpm --filter web build

      - name: Verify API routes compiled
        run: pnpm --filter web verify:api-routes

      - name: Run PDF export tests
        run: pnpm test:pdf-export
```

---

## Summary Checklist: Preventing Future Styling Issues

Use this checklist when working on PDF export or design system changes:

### Before Making Style Changes
- [ ] Read this document section: "Issue 1: PDF & Web Styles Divergence"
- [ ] Identify all files that need updates (web + PDF)
- [ ] Check if design tokens need updating

### Making Changes
- [ ] Update `design-tokens.ts` (if constants changed)
- [ ] Update `primitives.tsx` (web components)
- [ ] Update `print-styles.ts` (PDF styles)
- [ ] Update all files atomically in one commit (pre-commit hook will verify)

### After Changes
- [ ] Clear cache: `rm -rf apps/web/.next`
- [ ] Start dev server: `pnpm dev`
- [ ] Test web UI: Check component rendering
- [ ] Test PDF export: Download and verify styling
- [ ] Verify read time: Check both web and PDF show same value
- [ ] Run style parity tests: `pnpm test:pdf-style-parity`

### Submitting PR
- [ ] All files updated atomically (no partial changes)
- [ ] Tests pass: `pnpm typecheck && pnpm lint && pnpm test`
- [ ] PDF export test passes: `pnpm test:pdf-export`
- [ ] Style parity test passes: `pnpm test:pdf-style-parity`
- [ ] Document any new WPM constants or typography sizes

---

## Reference Files

**Files created/modified by these strategies**:
- `/apps/web/app/home/(user)/reports/_lib/constants/design-tokens.ts` (NEW)
- `/apps/web/app/home/(user)/reports/_lib/utils/calculate-read-time.ts` (SHARED)
- `/apps/web/app/home/(user)/reports/_components/brand-system/primitives.tsx` (UPDATED)
- `/apps/web/app/api/reports/[id]/print/_lib/print-styles.ts` (UPDATED)
- `/apps/web/app/api/reports/[id]/pdf/_components/report-pdf-document.tsx` (UPDATED)
- `/apps/e2e/tests/pdf-style-parity.spec.ts` (NEW)
- `/.husky/pre-commit` (UPDATED)
- `/.husky/post-checkout` (NEW)
- `/docs/TROUBLESHOOTING.md` (UPDATED)
- `/apps/web/scripts/verify-api-routes.ts` (NEW)

---

## Related Documentation

- **Design System**: `/docs/SPARLO-DESIGN-SYSTEM.md`
- **PDF Export**: `/docs/solutions/logic-errors/pdf-export-field-name-normalization.md`
- **Read Time Calculation**: `/plans/accurate-read-time-calculation.md`
- **Print Styles**: `/todos/057-ready-p2-report-print-styles-missing.md`
