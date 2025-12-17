# Comprehensive Code Review Fixes - Sparlo V2

---
title: "Multi-Agent Code Review Security & Performance Fixes"
date: 2024-12-16
tags:
  - security
  - performance
  - authorization
  - rate-limiting
  - inngest
  - supabase
  - react
  - database
  - code-review
severity: high
component: full-stack
symptoms:
  - Missing webhook signature verification
  - Server actions without ownership checks
  - No rate limiting on expensive operations
  - Unbounded input allowing DoS
  - Fake streaming creating complexity
  - TOC recalculating on every render
  - Orphan data risk from missing CASCADE
  - Slow queries from missing indexes
  - Duplicated constants across files
root_cause: Initial rapid development prioritized functionality over security hardening
resolution_time_saved: "4-6 hours per similar issue in future"
---

## Summary

A comprehensive 7-agent code review of Sparlo V2 identified ~93 issues. This document covers the 10 prioritized fixes that were implemented, spanning security, performance, data integrity, and architecture improvements.

## Problem Context

Sparlo V2 is a report generation SaaS built with Next.js 15, React 19, Supabase, and Inngest for durable workflows. The initial build prioritized shipping functionality quickly, leaving security hardening and performance optimization for later.

The 7-agent review covered:
- Security Sentinel
- Performance Oracle
- Architecture Strategist
- Pattern Recognition Specialist
- Data Integrity Guardian
- Agent-Native Reviewer
- Code Simplicity Reviewer

## Fixes Implemented

### P0 Critical (2 fixes)

#### 1. Inngest Signature Verification

**Problem**: Inngest webhook endpoint accepted unsigned requests, allowing attackers to trigger functions.

**File**: `apps/web/app/api/inngest/route.ts`

**Before**:
```typescript
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
```

**After**:
```typescript
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  // Explicitly reference signing key to ensure signature verification
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
```

**Impact**: All unsigned requests now return 401 Unauthorized.

---

#### 2. Server Action Authorization

**Problem**: Server actions relied solely on RLS without defense-in-depth ownership checks.

**File**: `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`

**Solution**: Added centralized ownership verification:

```typescript
async function verifyReportOwnership(
  reportId: string,
  userId: string,
): Promise<{ id: string; account_id: string }> {
  const client = getSupabaseServerClient();
  const { data: report, error } = await client
    .from('sparlo_reports')
    .select('id, account_id')
    .eq('id', reportId)
    .eq('account_id', userId)
    .single();

  if (error || !report) {
    throw new Error(
      'Report not found or you do not have permission to modify it',
    );
  }
  return report;
}
```

**Applied to**: `updateReport`, `deleteReport`, `renameReport`, `archiveReport`, `answerClarification`

---

### P1 High Priority (6 fixes)

#### 3. Rate Limiting

**Problem**: Users could spam expensive report generation without limits.

**Solution**: Dual-tier time-based rate limiting:

```typescript
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REPORTS_PER_WINDOW = 1;
const DAILY_LIMIT = 10;

// In startReportGeneration:
const [recentResult, dailyResult] = await Promise.all([
  client
    .from('sparlo_reports')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', user.id)
    .gte('created_at', windowStart),
  client
    .from('sparlo_reports')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', user.id)
    .gte('created_at', dayStart),
]);

if (recentResult.count && recentResult.count >= MAX_REPORTS_PER_WINDOW) {
  throw new Error('Rate limit exceeded. Please wait 5 minutes between reports.');
}
```

---

#### 4. Input Validation

**Problem**: No maximum length on user input, enabling DoS via huge payloads.

**Solution**: Added `.max()` constraints to all Zod schemas:

```typescript
const StartReportSchema = z.object({
  designChallenge: z
    .string()
    .min(50, 'Please provide at least 50 characters')
    .max(10000, 'Design challenge must be under 10,000 characters'),
});

const AnswerClarificationSchema = z.object({
  reportId: z.string().uuid(),
  answer: z
    .string()
    .min(1, 'Please provide an answer')
    .max(5000, 'Answer must be under 5,000 characters'),
});
```

---

#### 5. Fake Streaming Removal

**Problem**: Chat responses used artificial typewriter effect creating unnecessary complexity.

**File**: `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`

**Before**: Character-by-character animation with setTimeout loops.

**After**: Immediate content display:

```typescript
const data = await response.json();
const content = data.response ?? 'I could not generate a response.';

// Display content immediately
setChatMessages((prev) =>
  prev.map((msg) =>
    msg.id === assistantId
      ? { ...msg, content, isStreaming: false }
      : msg,
  ),
);
```

---

#### 6. TOC Memoization

**Problem**: Table of contents regenerated on every render, causing performance issues.

**Solution**: Wrapped in `useMemo`:

```typescript
const tocItems = useMemo(() => {
  const items: TocItem[] = [];
  const headerRegex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = headerRegex.exec(reportMarkdown)) !== null) {
    const level = match[1]?.length ?? 2;
    const title = match[2]?.replace(/\*\*/g, '') ?? '';
    const id = generateSectionId(title);
    items.push({ id, title, level });
  }
  return items;
}, [reportMarkdown]);
```

---

#### 7. Database Constraints

**Problem**: Missing `ON DELETE CASCADE` could leave orphan reports when users deleted.

**File**: `apps/web/supabase/migrations/20251217000000_sparlo_security_fixes.sql`

```sql
ALTER TABLE sparlo_reports
DROP CONSTRAINT IF EXISTS sparlo_reports_created_by_fkey;

ALTER TABLE sparlo_reports
ADD CONSTRAINT sparlo_reports_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

#### 8. Composite Indexes

**Problem**: Common queries performed table scans without proper indexes.

```sql
-- Optimize list queries
CREATE INDEX IF NOT EXISTS idx_sparlo_reports_account_status_archived
ON sparlo_reports(account_id, status, archived, created_at DESC);

-- Optimize rate limiting queries
CREATE INDEX IF NOT EXISTS idx_sparlo_reports_account_created
ON sparlo_reports(account_id, created_at DESC);
```

---

### P2 Medium Priority (2 fixes)

#### 9. PHASES Consolidation

**Problem**: Phase definitions duplicated across 3 files, risking inconsistency.

**Solution**: Created single source of truth at `apps/web/lib/constants/phases.ts`:

```typescript
export const PHASES = [
  { id: 'an0', name: 'Problem Framing', description: 'Understanding your challenge', progress: 0 },
  { id: 'an2', name: 'Pattern Synthesis', description: 'Finding innovation patterns', progress: 20 },
  { id: 'an3', name: 'Concept Generation', description: 'Creating solution concepts', progress: 40 },
  { id: 'an4', name: 'Evaluation', description: 'Scoring and ranking', progress: 60 },
  { id: 'an5', name: 'Report Writing', description: 'Compiling your report', progress: 80 },
  { id: 'complete', name: 'Complete', description: 'Report complete', progress: 100 },
] as const;

export type PhaseId = (typeof PHASES)[number]['id'];

export function getPhaseLabel(step: string | null): string {
  if (!step) return 'Starting analysis...';
  return PHASE_LABELS[step] ?? `Processing: ${step}`;
}
```

---

#### 10. Updated Imports

Updated `use-report-progress.ts` and `processing-screen.tsx` to import from centralized location:

```typescript
import { PHASES, getPhaseLabel, calculateOverallProgress } from '~/lib/constants/phases';
```

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/web/app/api/inngest/route.ts` | Added signingKey parameter |
| `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts` | Authorization, rate limiting, validation |
| `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx` | Removed fake streaming, memoized TOC |
| `apps/web/lib/constants/phases.ts` | **Created** - Centralized phases |
| `apps/web/supabase/migrations/20251217000000_sparlo_security_fixes.sql` | **Created** - DB constraints |
| `apps/web/app/home/(user)/_lib/use-report-progress.ts` | Updated imports |
| `apps/web/app/home/(user)/_components/processing-screen.tsx` | Updated imports |

---

## Prevention Strategies

### Security Checklist

- [ ] All webhooks verify signatures (Inngest, Stripe, etc.)
- [ ] Server actions include explicit ownership verification
- [ ] Rate limiting on all resource-intensive operations
- [ ] Input validation with `.max()` constraints on all string fields
- [ ] Environment variables for all secrets (`INNGEST_SIGNING_KEY`)

### Performance Checklist

- [ ] Expensive computations wrapped in `useMemo`
- [ ] Composite indexes for multi-column WHERE clauses
- [ ] No fake streaming - use real SSE or display immediately
- [ ] React DevTools Profiler shows no unnecessary re-renders

### Database Checklist

- [ ] All foreign keys specify `ON DELETE` behavior
- [ ] Composite indexes for common query patterns
- [ ] RLS enabled on all tables
- [ ] TypeScript types regenerated after schema changes

### Architecture Checklist

- [ ] Constants defined in single source of truth
- [ ] No code duplication across files
- [ ] Clear separation of concerns

---

## Deployment Notes

### Applying Database Changes

```bash
# Link to Supabase project
pnpm --filter web supabase link --project-ref <project-id>

# Push migration to cloud
pnpm --filter web supabase db push

# Regenerate TypeScript types
supabase gen types typescript --project-id <project-id> > lib/database.types.ts
```

### Environment Variables Required

```env
INNGEST_SIGNING_KEY=your-signing-key
```

---

## Related Documentation

- [Inngest Security Docs](https://www.inngest.com/docs/security)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [React useMemo](https://react.dev/reference/react/useMemo)
- Project: `packages/supabase/CLAUDE.md` - Database patterns
- Project: `.junie/guidelines.md` - Coding standards

---

## Impact Summary

| Category | Fixes | Security Improvement |
|----------|-------|---------------------|
| P0 Critical | 2 | Webhook spoofing + Authorization bypass prevented |
| P1 High | 6 | Rate limiting, validation, performance, data integrity |
| P2 Medium | 2 | Code maintainability |

**Total**: 10 fixes addressing critical attack vectors and operational resilience.
