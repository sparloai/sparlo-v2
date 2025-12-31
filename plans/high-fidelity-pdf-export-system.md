# High-Fidelity PDF Export System

## Overview

Replace the current `@react-pdf/renderer` implementation with a more robust PDF generation approach that eliminates text overlap issues and maintains design fidelity for the Air Company brand system.

**Status:** Planning
**Priority:** High
**Type:** Enhancement / Architecture Change

## Problem Statement

The current PDF export system uses `@react-pdf/renderer` which has persistent layout issues:
- Text overlapping in complex sections (Solution Concepts, Self-Critique)
- The `wrap={false}` prop causes content overflow when elements exceed page height
- Yoga layout engine doesn't calculate text heights correctly for long content
- Greek characters (τ, η, σ) require specific font configuration

**Why This Matters:**
The PDF report is a critical product deliverable - it's passed around internally and represents the product itself. Design fidelity is paramount.

## Current Architecture

```
apps/web/app/api/reports/[id]/pdf/
├── route.tsx                    # API route using @react-pdf/renderer
├── _components/
│   └── report-pdf-document.tsx  # 2,153-line PDF template
└── _lib/
    └── types.ts                 # Type exports

Current Flow:
1. GET /api/reports/[id]/pdf
2. Fetch report from sparlo_reports table (JSONB)
3. Pass to <ReportPDFDocument /> component
4. renderToBuffer() generates PDF
5. Return as binary response
```

## Proposed Solution

### Recommended Approach: HTML-to-PDF with Dedicated Microservice

After evaluating all options, the recommended approach is:

**Primary:** Puppeteer-based PDF generation on a dedicated microservice (Railway/Render)
**Fallback:** Cached/simplified PDF for edge cases

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel (Next.js)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GET /api/reports/[id]/pdf                               │   │
│  │  1. Check cache (Vercel Blob or S3)                      │   │
│  │  2. If miss → call PDF microservice                      │   │
│  │  3. Store result in cache                                │   │
│  │  4. Return PDF                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PDF Microservice (Railway)                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  POST /generate                                          │   │
│  │  1. Receive report data (JSON)                           │   │
│  │  2. Render HTML template with data                       │   │
│  │  3. Launch Puppeteer (no size limits)                    │   │
│  │  4. Generate PDF with page.pdf()                         │   │
│  │  5. Return PDF buffer                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Benefits:                                                       │
│  - No 250MB Vercel limit constraint                             │
│  - 60+ second timeout available                                  │
│  - Full Chromium, no @sparticuz hacks                           │
│  - Reuses web CSS/HTML (same rendering as browser)              │
│  - Dedicated resources, predictable performance                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Not Other Approaches?

| Approach | Verdict | Reason |
|----------|---------|--------|
| @react-pdf/renderer | ❌ Current | Yoga layout bugs, text overlap issues |
| Puppeteer on Vercel | ❌ Risky | 250MB limit, cold starts, timeouts |
| @sparticuz/chromium | ❌ Fragile | Complex setup, still hits limits |
| External Service (Browserless) | ⚠️ Possible | Good but ongoing cost per PDF |
| Client-side (html2pdf) | ❌ Poor | Slow, browser-dependent, quality issues |
| **Dedicated Microservice** | ✅ Best | Full control, no limits, predictable |

## Technical Approach

### Phase 1: Create Print-View Route

Create a server-rendered HTML page optimized for PDF generation:

```
apps/web/app/api/reports/[id]/print/
└── route.tsx  # Returns HTML optimized for print/PDF
```

**Key Features:**
- Reuses existing brand-system components
- Adds CSS `@page` rules for proper pagination
- Includes print-specific styles (`@media print`)
- Embeds Noto Sans fonts for Greek character support
- Returns complete HTML document

```tsx
// apps/web/app/api/reports/[id]/print/route.tsx
import { renderToString } from 'react-dom/server';
import { BrandSystemReportPrint } from './_components/brand-system-report-print';

export async function GET({ params }) {
  const report = await fetchReport(params.id);

  const html = renderToString(
    <BrandSystemReportPrint report={report} />
  );

  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>${printStyles}</style>
      </head>
      <body>${html}</body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}
```

### Phase 2: PDF Microservice

Deploy a simple Express/Fastify service on Railway:

```typescript
// pdf-service/src/index.ts
import puppeteer from 'puppeteer';
import express from 'express';

const app = express();
app.use(express.json({ limit: '10mb' }));

let browser: Browser;

app.post('/generate', async (req, res) => {
  const { html, options } = req.body;

  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '48px', bottom: '64px', left: '48px', right: '48px' },
    displayHeaderFooter: true,
    footerTemplate: `
      <div style="font-size: 9px; width: 100%; text-align: center; color: #71717a;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>
    `,
  });

  await page.close();

  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
});

app.listen(3001);
```

### Phase 3: Update Vercel API Route

```typescript
// apps/web/app/api/reports/[id]/pdf/route.tsx
export async function GET({ params, user }) {
  const reportId = params.id;

  // 1. Check cache
  const cached = await checkPDFCache(reportId);
  if (cached) return new Response(cached, pdfHeaders);

  // 2. Generate print HTML
  const printUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/reports/${reportId}/print`;
  const htmlResponse = await fetch(printUrl, {
    headers: { Authorization: `Bearer ${getServiceToken()}` }
  });
  const html = await htmlResponse.text();

  // 3. Call PDF microservice
  const pdfResponse = await fetch(process.env.PDF_SERVICE_URL + '/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html }),
  });

  const pdfBuffer = await pdfResponse.arrayBuffer();

  // 4. Cache result
  await cachePDF(reportId, pdfBuffer);

  // 5. Return
  return new Response(pdfBuffer, pdfHeaders);
}
```

## Print Stylesheet Design

```css
/* apps/web/app/api/reports/[id]/print/_styles/print.css */

@page {
  size: A4;
  margin: 48px;
}

@page :first {
  margin-top: 0;
}

/* Force backgrounds to print */
* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* Typography - match brand system */
body {
  font-family: 'Noto Sans', -apple-system, sans-serif;
  font-size: 10pt;
  line-height: 1.5;
  color: #3f3f46; /* zinc-700 */
}

/* Section breaks */
.section {
  break-inside: avoid-page;
  page-break-inside: avoid;
  margin-bottom: 28px;
}

/* Keep headers with content */
h1, h2, h3 {
  break-after: avoid;
  page-break-after: avoid;
}

/* Cards can break across pages */
.card {
  /* No break-inside: avoid - allow natural flow */
}

/* Keep small elements together */
.card-header,
.tag-row,
.insight-box {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* Orphan/widow control */
p {
  orphans: 3;
  widows: 3;
}

/* Hide web-only elements */
.no-print,
.toc-sidebar,
.chat-drawer,
.action-buttons {
  display: none !important;
}

/* Left border accent pattern */
.article-block {
  border-left: 2px solid #09090b;
  padding-left: 16px;
}

.card-highlight {
  border-left: 3px solid #09090b;
  padding-left: 16px;
}
```

## Acceptance Criteria

### Functional Requirements
- [ ] PDF generates successfully for all report types (hybrid, discovery)
- [ ] No text overlapping in any section
- [ ] Greek characters (τ, η, σ, γ, μ, ρ) render correctly
- [ ] Special symbols (≈, ±, →) render correctly
- [ ] Page breaks occur at natural points (between sections, not mid-paragraph)
- [ ] Headers stay with following content
- [ ] Tables don't split awkwardly across pages
- [ ] Page numbers appear in footer
- [ ] Generation completes within 30 seconds for typical reports

### Design Fidelity
- [ ] Typography matches web (Noto Sans, same sizes)
- [ ] Color palette matches brand (zinc scale)
- [ ] Left border accents render correctly
- [ ] Card styles match web design
- [ ] MonoLabel styling preserved
- [ ] Tag/badge styling preserved

### Non-Functional Requirements
- [ ] Cache hit returns PDF in <500ms
- [ ] Fresh generation completes in <30s for 20-page report
- [ ] System handles 10 concurrent generations
- [ ] Error states show user-friendly messages
- [ ] Rate limiting prevents abuse (20/hour, 100/day per user)

## Implementation Plan

### Phase 1: Print View (2-3 days)
1. Create `/api/reports/[id]/print` route
2. Create `BrandSystemReportPrint` component (adapt from web version)
3. Add print stylesheet with @page rules
4. Test HTML output renders correctly in browser print preview
5. Verify Greek characters with Noto Sans

### Phase 2: PDF Microservice (1-2 days)
1. Create new Railway project
2. Set up Express + Puppeteer service
3. Implement `/generate` endpoint
4. Add health check endpoint
5. Configure auto-scaling and memory limits
6. Set up environment variables in Vercel

### Phase 3: Integration (1-2 days)
1. Update `/api/reports/[id]/pdf` route to use microservice
2. Add caching layer (Vercel Blob or S3)
3. Implement cache invalidation on report update
4. Add error handling and fallbacks
5. Update rate limiting

### Phase 4: Testing & Polish (2-3 days)
1. Visual regression testing (compare to current PDFs)
2. Test all report sections with various content lengths
3. Cross-platform testing (Mac Preview, Adobe Reader, Chrome)
4. Load testing (10 concurrent requests)
5. Error scenario testing (timeout, service down)
6. Documentation

## Files to Create/Modify

### New Files
```
apps/web/app/api/reports/[id]/print/
├── route.tsx                              # Print HTML route
└── _components/
    └── brand-system-report-print.tsx      # Print-optimized report component

apps/web/app/api/reports/[id]/print/_styles/
└── print.css                              # Print stylesheet

pdf-service/                               # New microservice
├── package.json
├── Dockerfile
├── src/
│   └── index.ts                           # Express + Puppeteer
└── railway.json                           # Railway config
```

### Modified Files
```
apps/web/app/api/reports/[id]/pdf/route.tsx  # Call microservice instead of react-pdf
apps/web/package.json                         # Remove @react-pdf/renderer (optional)
```

### Deprecated Files (can remove after migration)
```
apps/web/app/api/reports/[id]/pdf/_components/report-pdf-document.tsx  # 2153 lines
```

## Cost Analysis

### Current (react-pdf/renderer)
- $0/month (runs on Vercel functions)
- But: broken output, text overlap issues

### Proposed (Railway microservice)
- Railway Hobby: $5/month base + usage
- Estimated: $10-20/month for typical usage
- Includes: 512MB RAM, auto-sleep on idle

### Alternative (Browserless.io)
- $0.01-0.05 per PDF page
- 1000 PDFs/month × 10 pages avg = $100-500/month
- Higher cost but zero maintenance

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Microservice down | Health checks, fallback to cached PDF |
| Slow generation | Progress indicator, async for large reports |
| Memory issues | Configure Railway limits, browser pooling |
| Cost overrun | Rate limiting, caching, monitoring |
| Font issues | Embed fonts in HTML, verify rendering |

## Success Metrics

- **Generation success rate:** >99%
- **P95 generation time:** <15s for typical reports
- **Visual defects:** 0 text overlap issues
- **User satisfaction:** No PDF-related support tickets

## References

### Internal
- Current PDF route: `apps/web/app/api/reports/[id]/pdf/route.tsx`
- Current PDF component: `apps/web/app/api/reports/[id]/pdf/_components/report-pdf-document.tsx`
- Brand system components: `apps/web/app/home/(user)/reports/[id]/_components/brand-system/`
- Report types: `apps/web/app/api/reports/[id]/pdf/_lib/types.ts`

### External
- [Puppeteer page.pdf() API](https://pptr.dev/api/puppeteer.page.pdf)
- [CSS Paged Media](https://developer.mozilla.org/en-US/docs/Web/CSS/@page)
- [Railway Deployment](https://railway.app/docs)
- [@sparticuz/chromium](https://github.com/Sparticuz/chromium) (backup option)

---

**Decision Required:** Before implementation, confirm:
1. Is Railway microservice acceptable? (~$10-20/month)
2. Maximum acceptable generation time? (proposed: 30s)
3. Caching strategy approval (cache for 1 hour, invalidate on update)
