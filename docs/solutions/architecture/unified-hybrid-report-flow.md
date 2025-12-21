---
title: "Unified Hybrid Report Flow - Single Report Type Architecture"
category: architecture
tags:
  - hybrid-flow
  - inngest
  - report-generation
  - architecture-simplification
severity: medium
component: Report Generation
framework: Next.js 16, Inngest
date: 2025-12-20
status: completed
---

# Unified Hybrid Report Flow

## Problem

The application had multiple report types (Standard, Discovery, Hybrid) with separate flows, causing:
1. User confusion about which mode to use
2. Duplicate code paths for similar functionality
3. Title tags like `[Hybrid]` and `[Discovery]` that cluttered the UI
4. The main `/home/reports/new` page triggered the old standard flow

## Solution

Unified all report generation to use the Hybrid flow as the single report type.

### 1. Changed Report Trigger Event

Updated `sparlo-reports-server-actions.ts` to trigger hybrid flow:

```typescript
// apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts

// Before
await inngest.send({
  name: 'report/generate',  // Old standard flow
  data: { ... }
});

// After
await inngest.send({
  name: 'report/generate-hybrid',  // Hybrid flow for all reports
  data: {
    reportId: report.id,
    accountId: user.id,
    userId: user.id,
    designChallenge: data.designChallenge,
    conversationId,
    attachments: data.attachments,
  },
});
```

### 2. Removed Title Tags

Removed `[Hybrid]` and `[Discovery]` prefixes from report titles across 4 files:

```typescript
// Before
title: `[Hybrid] ${sanitizedChallenge.slice(0, 90)}`
title: `[Discovery] ${data.designChallenge.slice(0, 90)}`

// After
title: `${sanitizedChallenge.slice(0, 90)}`
title: `${data.designChallenge.slice(0, 90)}`
```

### 3. Claude-Generated Headlines

Instead of truncated challenge text, reports now use AI-generated titles:

```typescript
// apps/web/lib/inngest/functions/generate-hybrid-report.ts

// At AN5-M completion, update with generated title
const generatedTitle =
  an5mResult.result.report_title ?? 'Hybrid Analysis Complete';

await updateProgress({
  status: 'complete',
  current_step: 'complete',
  phase_progress: 100,
  title: generatedTitle,  // Updates database title
  headline: generatedTitle,
  report_data: { ... }
});
```

## Files Changed

| File | Change |
|------|--------|
| `sparlo-reports-server-actions.ts` | Changed Inngest event to `report/generate-hybrid` |
| `hybrid-reports-server-actions.ts` | Removed `[Hybrid]` tag from title |
| `discovery-reports-server-actions.ts` | Removed `[Discovery]` tag from title |
| `api/hybrid/reports/route.ts` | Removed `[Hybrid]` tag from title |
| `api/discovery/reports/route.ts` | Removed `[Discovery]` tag from title |
| `generate-hybrid-report.ts` | Added title update with `report_title` from AN5-M |

## Architecture Decision

### Why Hybrid as Default?

The Hybrid flow provides:
- **Full-spectrum analysis**: Simple to paradigm-shifting solutions
- **Merit-based evaluation**: Best solution wins regardless of origin
- **Cross-domain search**: Biology, geology, abandoned tech, frontier materials
- **Prior art documentation**: Evidence-based claims with sources
- **Honest self-critique**: Acknowledges uncertainties

### Flow Simplification

```
Before:                          After:
┌──────────────────────┐        ┌──────────────────────┐
│ /home/reports/new    │        │ /home/reports/new    │
│ → report/generate    │        │ → report/generate-   │
│ (Standard Flow)      │        │   hybrid             │
├──────────────────────┤        │ (All reports use     │
│ Discovery Mode       │        │  Hybrid Flow)        │
│ → report/generate-   │        └──────────────────────┘
│   discovery          │
├──────────────────────┤
│ Hybrid Mode          │
│ → report/generate-   │
│   hybrid             │
└──────────────────────┘
```

## Prevention

### When Adding New Report Modes

1. Consider if the mode is truly distinct or can be a parameter
2. Avoid proliferating Inngest event types unnecessarily
3. Keep UI simple - users shouldn't need to understand mode differences
4. Use AI-generated titles instead of mode prefixes

## Commits

- `02ad09b` - feat: make /home/reports/new trigger hybrid flow, remove title tags
- `1fd229a` - feat: update report title with Claude-generated headline

## Related

- `docs/solutions/ai/prompt-engineering-patterns.md` - Hybrid prompt design
- `apps/web/lib/inngest/functions/generate-hybrid-report.ts` - Main flow implementation
