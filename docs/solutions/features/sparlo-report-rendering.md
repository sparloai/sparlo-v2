# SparloReport Structured Rendering

**Solution Documentation**

Structured report rendering with Zod validation, graceful fallback to legacy display, and proper error handling across the server/client boundary.

## Architecture

SparloReport uses comprehensive Zod validation to ensure LLM-generated report data matches expected schema before rendering:

```
loadReport() → safeParse(SparloReportSchema) → ReportRenderer
                     ↓ (validation fails)
              Legacy ReportDisplay fallback
```

## Key Files

| File | Purpose |
|------|---------|
| `/apps/web/app/home/(user)/reports/[id]/_lib/schema/sparlo-report.schema.ts` | Comprehensive Zod schema with `.max()` constraints |
| `/apps/web/app/home/(user)/reports/[id]/page.tsx` | Server component with validation + fallback logic |
| `/apps/web/app/home/(user)/reports/[id]/_components/report/report-renderer.tsx` | Main composition component (11 sections) |
| `/apps/web/app/home/(user)/reports/[id]/_components/report/report-error.tsx` | Client component for validation errors |
| `/apps/web/app/home/(user)/reports/[id]/_components/report/sections/*` | 11 section components (Brief, ExecutiveSummary, etc.) |
| `/apps/web/app/home/(user)/reports/[id]/_components/report/shared/badges.tsx` | Shared UI components with consistent className API |

## Fallback Pattern

### Graceful Degradation

When schema validation fails (e.g., legacy reports using AN5OutputSchema):

1. Server logs detailed validation errors with field-level diagnostics
2. Falls back to legacy `ReportDisplay` component (markdown rendering)
3. No error shown to user - seamless experience

```typescript
const result = SparloReportSchema.safeParse(report.report_data);

if (!result.success) {
  console.warn('[Report Rendering] Schema validation failed:', {
    reportId, errorCount, fieldErrors, presentFields, expectedFields
  });
  return <ReportDisplay report={report} initialChatHistory={initialChatHistory} />;
}

return <ReportRenderer report={result.data} />;
```

## Error Handling - ZodError Serialization

### The Problem

ZodError methods like `.format()` don't survive serialization across server/client boundary.

### The Solution

Format errors **server-side** before passing to client component:

```typescript
// ❌ WRONG - Pass ZodError directly to client
<ReportError error={result.error} />

// ✅ CORRECT - Format server-side
const flatErrors = result.error.flatten();
<ReportError
  errorCount={result.error.errors.length}
  formattedErrors={flatErrors}
  reportId={id}
/>
```

**Version**: 1.0 | **Updated**: 2025-12-19
