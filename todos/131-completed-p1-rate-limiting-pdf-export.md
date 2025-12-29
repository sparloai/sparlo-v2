---
status: completed
priority: p1
issue_id: "131"
tags: [security, code-review, share-export]
dependencies: []
---

# Missing Rate Limiting on PDF Export Endpoint

## Problem Statement

The PDF export endpoint `/api/reports/[id]/pdf` has no rate limiting, allowing attackers to trigger unlimited PDF generation requests (CPU-intensive operation).

**Why it matters**: Server resource exhaustion, degraded performance for legitimate users, potential DoS vulnerability.

## Findings

**Source**: Security Sentinel review of commit d08d4fa

**File**: `/apps/web/app/api/reports/[id]/pdf/route.tsx`

```typescript
export const GET = enhanceRouteHandler(
  async function ({ params }) {
    // NO RATE LIMIT CHECK
    const pdfBuffer = await renderToBuffer(<ReportPDFDocument report={report as ReportForPDF} />);
    // ...
  },
  { auth: true },
);
```

**Impact**:
- Server resource exhaustion (CPU, memory)
- Degraded performance for legitimate users
- Potential DoS vulnerability

## Proposed Solutions

### Option A: Add Rate Limiting Header Check (Recommended)

```typescript
export const GET = enhanceRouteHandler(
  async function ({ params, user }) => {
    const client = getSupabaseServerClient();

    const rateLimit = await client.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_endpoint: 'pdf-export',
      p_hourly_limit: 10,
      p_daily_limit: 50
    }).single();

    if (!rateLimit.data?.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': '3600' } }
      );
    }

    // ... rest of implementation
  },
  { auth: true },
);
```

**Pros**: Consistent with share link rate limiting
**Cons**: Requires RPC function
**Effort**: Medium (1-2 hours)
**Risk**: Low

## Recommended Action

Option A - Add rate limiting with proper 429 response and Retry-After header.

## Technical Details

**Affected Files**:
- `apps/web/app/api/reports/[id]/pdf/route.tsx`

**Suggested Limits**:
- 10 PDFs per hour per user
- 50 PDFs per day per user

## Acceptance Criteria

- [ ] Rate limiting is enforced on PDF export
- [ ] Returns 429 status with Retry-After header when limited
- [ ] Limits are: 10/hour, 50/day per user
- [ ] Error response doesn't leak sensitive information

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | Security finding from commit d08d4fa |

## Resources

- Commit: d08d4fa
- Related: #130 (share link rate limiting)
