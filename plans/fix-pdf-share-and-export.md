# Fix PDF Share Link and Export Feature

**Type:** Bug Fix + Enhancement
**Priority:** High
**Created:** 2025-12-23

## Overview

The PDF share link feature fails with "Failed to generate share link" error, and PDF export renders minimal/empty content instead of the beautiful Aura-styled reports. This plan addresses both issues with a comprehensive solution using Puppeteer for high-fidelity HTML-to-PDF conversion.

## Problem Statement

### Issue 1: Share Link Generation Fails
- **Error:** "Failed to generate share link" toast appears when clicking Generate Share Link
- **Location:** `share-modal.tsx:41` catches error from `generateShareLink()`
- **Root Cause:** Need to investigate - likely database constraint, RLS policy issue, or missing `expires_at` field (required per migration `20251223114425_add_report_shares_expiry.sql`)

### Issue 2: PDF Export Renders Minimal Content
- **Current State:** PDF only renders: title, headline, core insight, problem analysis prose, solution titles, next steps, risks
- **Missing:** Full executive summary, decision architecture, solution concept details, key insights, confidence badges, impact indicators, Aura design styling
- **Location:** `report-pdf-document.tsx` uses basic `@react-pdf/renderer` components with minimal styling

## Technical Analysis

### Current Architecture
```
apps/web/
├── app/api/reports/[id]/pdf/
│   ├── route.tsx                    # API endpoint, 30s timeout
│   ├── _components/
│   │   └── report-pdf-document.tsx  # Minimal @react-pdf component
│   └── _lib/types.ts                # ReportForPDF type
├── app/home/(user)/reports/[id]/
│   ├── _lib/server/share-actions.ts # generateShareLink, revokeShareLink
│   └── _components/
│       ├── share-modal.tsx          # Share UI
│       └── hybrid-report-display.tsx # Full HTML report rendering
└── app/share/[token]/
    ├── page.tsx                     # Public share page
    └── _components/
        └── public-report-display.tsx # Public view (similar to hybrid-report)
```

### Why Current PDF Approach Fails
1. `@react-pdf/renderer` requires rebuilding all components from scratch - doesn't use existing HTML/CSS
2. App Router compatibility issues with `renderToBuffer` (known React PDF bug)
3. No Aura design tokens - just basic Helvetica text on white background
4. Missing ~80% of report content (decision architecture, insights, badges, etc.)

### Recommended Solution: Puppeteer + @sparticuz/chromium

**Why Puppeteer:**
- Renders existing HTML/CSS perfectly (including Tailwind, Aura design)
- Full report fidelity - what you see on screen is what you get in PDF
- Works with Railway deployment (no strict serverless limits)
- `@sparticuz/chromium` provides serverless-compatible Chromium binary

## Implementation Plan

### Phase 1: Fix Share Link Generation (Bug Fix)

#### 1.1 Diagnose Share Link Error

```typescript
// share-actions.ts:44-54 - The upsert may fail due to:
// 1. expires_at NOT NULL constraint (migration 20251223114425)
// 2. RLS policy blocking insert
// 3. Database connection issue
```

**Files to modify:**
- `apps/web/app/home/(user)/reports/[id]/_lib/server/share-actions.ts`

**Changes:**
1. Add `expires_at` field to upsert (default 30 days)
2. Add better error logging to identify root cause
3. Handle specific error cases with user-friendly messages

```typescript
// Updated generateShareLink in share-actions.ts
const { data: share, error: shareError } = await client
  .from('report_shares')
  .upsert(
    {
      report_id: data.reportId,
      created_by: user?.id,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    },
    {
      onConflict: 'report_id',
      ignoreDuplicates: false,
    },
  )
  .select('share_token')
  .single();
```

#### 1.2 Test Share Link Flow
- Generate share link
- Verify token is stored in `report_shares` table
- Access public share URL
- Verify report renders correctly

### Phase 2: Implement Puppeteer PDF Generation

#### 2.1 Install Dependencies

```bash
pnpm --filter web add puppeteer-core @sparticuz/chromium
pnpm --filter web add -D puppeteer  # Local dev only
```

#### 2.2 Create PDF Generation Service

**New file:** `apps/web/lib/pdf/pdf-generator.ts`

```typescript
import 'server-only';

import puppeteer from 'puppeteer-core';

export async function generatePDFFromHTML(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Inject print styles
    await page.addStyleTag({
      content: `
        @media print {
          * { -webkit-print-color-adjust: exact !important; }
          body { margin: 0; padding: 20px; }
        }
      `
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      displayHeaderFooter: true,
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated by Sparlo
        </div>
      `,
    });

    return Buffer.from(pdf);
  } finally {
    await page.close();
    await browser.close();
  }
}

async function getBrowser() {
  if (process.env.NODE_ENV === 'development') {
    const puppeteer = (await import('puppeteer')).default;
    return puppeteer.launch({ headless: true });
  }

  const chromium = (await import('@sparticuz/chromium')).default;
  return puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
}
```

#### 2.3 Create PDF-Optimized Report Template

**New file:** `apps/web/app/api/reports/[id]/pdf/_components/pdf-report-template.tsx`

Create a server component that renders the full report HTML optimized for PDF:
- Include all sections from `hybrid-report-display.tsx`
- Use Aura design tokens
- Add print-specific styles
- Include all badges, cards, and visual elements

```typescript
// This will be a server component that generates static HTML
export function PDFReportTemplate({ report }: { report: ReportForPDF }) {
  return (
    <html>
      <head>
        <style>{/* Tailwind CSS + Aura tokens */}</style>
      </head>
      <body className="bg-white p-8">
        {/* Full report structure matching hybrid-report-display */}
        <PDFExecutiveSummary data={report.report_data?.executive_summary} />
        <PDFDecisionArchitecture data={report.report_data?.decision_architecture} />
        <PDFSolutionConcepts data={report.report_data?.solution_concepts} />
        <PDFKeyInsights data={report.report_data?.key_insights} />
        <PDFNextSteps data={report.report_data?.next_steps} />
        <PDFRisks data={report.report_data?.risks_and_watchouts} />
      </body>
    </html>
  );
}
```

#### 2.4 Update PDF API Route

**File:** `apps/web/app/api/reports/[id]/pdf/route.tsx`

```typescript
import { renderToStaticMarkup } from 'react-dom/server';
import { generatePDFFromHTML } from '~/lib/pdf/pdf-generator';
import { PDFReportTemplate } from './_components/pdf-report-template';

export const GET = enhanceRouteHandler(
  async function ({ params }) {
    const { id } = params as { id: string };

    // Fetch report...

    // Generate HTML from React component
    const html = renderToStaticMarkup(<PDFReportTemplate report={report} />);

    // Convert HTML to PDF with Puppeteer
    const pdfBuffer = await Promise.race([
      generatePDFFromHTML(html),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PDF generation timeout')), 60000)
      ),
    ]);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}-report.pdf"`,
      },
    });
  },
  { auth: true },
);
```

### Phase 3: Create PDF Report Sections

Create PDF-optimized versions of each report section:

**New files in `apps/web/app/api/reports/[id]/pdf/_components/sections/`:**

| File | Purpose |
|------|---------|
| `pdf-executive-summary.tsx` | Full exec summary with narrative lead, recommendations |
| `pdf-problem-analysis.tsx` | Problem description, difficulty factors, root causes |
| `pdf-decision-architecture.tsx` | Primary concept + fallback with all details |
| `pdf-solution-concepts.tsx` | All solutions with attributes, viability, confidence |
| `pdf-key-insights.tsx` | Key insights with icons and styling |
| `pdf-next-steps.tsx` | Numbered steps with timeframes |
| `pdf-risks.tsx` | Risks with severity indicators |

Each component should:
1. Match the visual design of the web version
2. Use inline styles or embedded CSS (no external stylesheets)
3. Include print-specific optimizations
4. Handle missing data gracefully

### Phase 4: Styling and Polish

#### 4.1 Embed Aura Design Tokens

Create `apps/web/app/api/reports/[id]/pdf/_lib/pdf-styles.ts`:

```typescript
export const PDF_STYLES = `
  /* Aura Design Tokens */
  :root {
    --zinc-950: #09090b;
    --zinc-600: #52525b;
    --zinc-200: #e4e4e7;
  }

  /* Typography */
  body { font-family: system-ui, -apple-system, sans-serif; }
  h1, h2, h3 { color: var(--zinc-950); }

  /* Cards */
  .card {
    border: 1px solid var(--zinc-200);
    border-radius: 12px;
    padding: 24px;
    background: white;
  }

  /* Badges */
  .badge {
    display: inline-flex;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  /* Print optimizations */
  @media print {
    .page-break { page-break-before: always; }
    .no-break { page-break-inside: avoid; }
  }
`;
```

#### 4.2 Add Page Breaks

Insert page breaks between major sections:
- After executive summary
- After decision architecture
- After solution concepts (if long)

### Phase 5: Public Share PDF Export

#### 5.1 Add PDF Export to Public Share Page

**File:** `apps/web/app/share/[token]/page.tsx`

Add export button to public share view with rate limiting.

**New file:** `apps/web/app/api/share/[token]/pdf/route.ts`

```typescript
// Similar to /api/reports/[id]/pdf but:
// 1. Uses share token instead of auth
// 2. Validates token not expired/revoked
// 3. Rate limited (e.g., 5 downloads per hour per IP)
```

## Acceptance Criteria

### Share Link Generation
- [ ] Clicking "Generate Share Link" creates a link successfully
- [ ] Link is copyable to clipboard
- [ ] Public users can access shared reports via link
- [ ] Links expire after 30 days
- [ ] Revoked links show appropriate error message

### PDF Export
- [ ] PDF contains ALL report sections (matching web view)
- [ ] PDF uses Aura design styling (colors, typography, spacing)
- [ ] Executive summary includes core insight, narrative lead, recommendations
- [ ] Decision architecture shows primary + fallback concepts
- [ ] Solution concepts include all attributes and badges
- [ ] Key insights render with proper formatting
- [ ] Next steps show numbered list with timeframes
- [ ] Risks display with severity indicators
- [ ] Page headers/footers show report title and page numbers
- [ ] PDF is properly paginated (no cut-off content)
- [ ] Generation completes within 60 seconds
- [ ] Appropriate error messages for failures

### Technical Requirements
- [ ] Works on Railway deployment
- [ ] Handles large reports (50+ pages) gracefully
- [ ] Memory usage stays under 1GB during generation
- [ ] Proper error handling and logging

## Files to Create/Modify

### New Files
```
apps/web/
├── lib/pdf/
│   └── pdf-generator.ts                    # Puppeteer PDF generation
├── app/api/reports/[id]/pdf/
│   ├── _components/
│   │   ├── pdf-report-template.tsx         # Main PDF template
│   │   └── sections/
│   │       ├── pdf-executive-summary.tsx
│   │       ├── pdf-problem-analysis.tsx
│   │       ├── pdf-decision-architecture.tsx
│   │       ├── pdf-solution-concepts.tsx
│   │       ├── pdf-key-insights.tsx
│   │       ├── pdf-next-steps.tsx
│   │       └── pdf-risks.tsx
│   └── _lib/
│       └── pdf-styles.ts                   # Embedded CSS
└── app/api/share/[token]/pdf/
    └── route.ts                            # Public PDF endpoint
```

### Modified Files
```
apps/web/
├── app/api/reports/[id]/pdf/route.tsx      # Update to use Puppeteer
├── app/home/(user)/reports/[id]/
│   └── _lib/server/share-actions.ts        # Fix expires_at
├── app/share/[token]/page.tsx              # Add PDF export button
└── package.json                            # Add dependencies
```

## Dependencies

```json
{
  "dependencies": {
    "puppeteer-core": "^23.0.0",
    "@sparticuz/chromium": "^131.0.0"
  },
  "devDependencies": {
    "puppeteer": "^23.0.0"
  }
}
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cold start latency on serverless | Medium | Medium | Railway has no cold starts; add warming if needed |
| Memory exhaustion on large reports | Low | High | Set 1GB memory limit, add pagination for very large reports |
| Chromium binary size issues | Low | High | @sparticuz/chromium optimized for serverless |
| CSS rendering differences | Medium | Low | Test extensively, use inline styles |

## Testing Plan

1. **Unit Tests:** PDF generator function with mock HTML
2. **Integration Tests:** Full flow from report to PDF download
3. **Visual Regression:** Compare PDF output to expected baseline
4. **Load Tests:** Concurrent PDF generation (5-10 simultaneous)
5. **Edge Cases:** Very large reports, reports with missing data, special characters

## References

- **Existing Code:**
  - `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx` - Source for PDF content structure
  - `apps/web/app/share/[token]/_components/public-report-display.tsx` - Public view reference
  - `apps/web/supabase/migrations/20251223114425_add_report_shares_expiry.sql` - Share table schema

- **Research:**
  - [Puppeteer PDF Generation](https://pptr.dev/guides/pdf-generation)
  - [@sparticuz/chromium](https://github.com/Sparticuz/chromium) - Serverless Chromium
  - [HTML to PDF Best Practices](https://dev.to/harshvats2000/creating-a-nextjs-api-to-convert-html-to-pdf-with-puppeteer-vercel-compatible-16fc)
