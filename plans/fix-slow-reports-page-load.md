# fix: Slow Reports Dashboard Load Performance

## Overview

The reports dashboard at `/app` loads slowly because it fetches the `report_data` JSONB column (~50-200KB per report) for all 50 reports, transferring approximately **5MB of data** per page load. This data is only used to compute `concept_count` and `mode` - information that could be derived differently or removed.

An optimized loader already exists at `apps/web/app/app/_lib/server/sparlo-reports.loader.ts` that excludes large JSONB fields but is **not being used** by the main dashboard page.

## Problem Statement

**Current State** (`apps/web/app/app/page.tsx:64-71`):
```typescript
const { data, error } = await client
  .from('sparlo_reports')
  .select(
    'id, title, headline, status, current_step, created_at, updated_at, archived, report_data, error_message',
  )
  .eq('archived', false)
  .order('created_at', { ascending: false })
  .limit(50);
```

**Issues**:
1. `report_data` JSONB column loaded unnecessarily (~100KB x 50 = ~5MB)
2. `computeConceptCount()` requires `report_data` (lines 50-59)
3. `mode` extracted from `report_data?.mode` (lines 95-97)
4. Optimized loader exists but isn't used

**Target State**:
- Dashboard loads in <500ms (currently 3-5s)
- Data transfer <100KB (currently ~5MB)
- Remove dependency on `report_data` for listing

## Proposed Solution

### Approach: Remove `report_data` dependency, simplify dashboard

1. **Remove `concept_count` from dashboard display** - This metric is only meaningful on the detail page where the full report is shown anyway
2. **Store `mode` as a database column** - Simple migration to extract from JSONB to column
3. **Update the existing optimized loader** - Add `headline`, `error_message`, and new `mode` column
4. **Use optimized loader in page.tsx** - Replace inline query with loader function

### Why this approach?
- **Minimal risk**: No changes to report generation or existing data
- **Uses existing code**: Optimized loader already proven to work
- **No UI regressions**: `concept_count` is low-value info on dashboard
- **Future-proof**: `mode` column enables efficient filtering later

## Technical Approach

### Phase 1: Database Migration (Add `mode` column)

**File**: `apps/web/supabase/migrations/[timestamp]_add_report_mode_column.sql`

```sql
-- Add mode column to sparlo_reports
ALTER TABLE public.sparlo_reports
ADD COLUMN IF NOT EXISTS mode text DEFAULT 'standard';

-- Backfill existing reports from report_data JSONB
UPDATE public.sparlo_reports
SET mode = COALESCE(report_data->>'mode', 'standard')
WHERE mode IS NULL OR mode = 'standard';

-- Create index for filtering by mode
CREATE INDEX IF NOT EXISTS idx_sparlo_reports_mode_text
ON public.sparlo_reports (mode);

-- Add comment
COMMENT ON COLUMN public.sparlo_reports.mode IS 'Report mode: discovery or standard';
```

### Phase 2: Update Optimized Loader

**File**: `apps/web/app/app/_lib/server/sparlo-reports.loader.ts`

Update `SparloReportListItem` interface and `loadUserReports` function to include:
- `headline` (already in DB)
- `error_message` (already in DB)
- `mode` (new column)

Remove `concept_count` from interface (not needed for listing).

### Phase 3: Update Dashboard Page

**File**: `apps/web/app/app/page.tsx`

1. Import and use `loadUserReports` from the loader
2. Remove inline `getReports()` function
3. Remove `computeConceptCount()` function
4. Update `Report` interface to remove `concept_count`
5. Get current user ID from auth context for loader

### Phase 4: Update Dashboard Component

**File**: `apps/web/app/app/_components/reports-dashboard.tsx`

Remove any UI displaying `concept_count` from report cards.

## Acceptance Criteria

### Functional Requirements
- [ ] Dashboard loads reports without `report_data` column
- [ ] Report mode (discovery/standard) displays correctly
- [ ] Headline displays correctly on report cards
- [ ] Error status displays correctly for failed reports
- [ ] All existing dashboard functionality works (search, archive, navigate)

### Non-Functional Requirements
- [ ] Initial page load transfers <100KB of data
- [ ] Time to First Contentful Paint <1s on 4G connection
- [ ] No N+1 queries introduced

### Quality Gates
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Existing tests pass
- [ ] Manual testing of all dashboard flows

## Implementation Checklist

### 1. Database Migration
- [ ] Create migration file `[timestamp]_add_report_mode_column.sql`
- [ ] Add `mode` column with default 'standard'
- [ ] Backfill existing reports from `report_data->>'mode'`
- [ ] Create index on `mode` column
- [ ] Run `pnpm supabase:web:typegen` to update types

### 2. Update Loader (`sparlo-reports.loader.ts`)
- [ ] Add `headline`, `error_message`, `mode` to `SparloReportListItem` interface
- [ ] Update SELECT in `loadUserReports` to include new fields
- [ ] Keep `account_id` filter for RLS optimization
- [ ] Keep `archived=false` filter for partial index usage

### 3. Update Page (`page.tsx`)
- [ ] Remove `computeConceptCount` function
- [ ] Remove inline `getReports` function
- [ ] Import `loadUserReports` from loader
- [ ] Get user ID from Supabase auth
- [ ] Update `Report` interface (remove `concept_count`)
- [ ] Map loader results to component props

### 4. Update Dashboard Component (`reports-dashboard.tsx`)
- [ ] Remove `concept_count` from props/types
- [ ] Remove any UI displaying concept count
- [ ] Verify mode badge still works with string column

### 5. Testing
- [ ] Test fresh page load (should be <1s)
- [ ] Test with 0 reports (empty state)
- [ ] Test with 50 reports
- [ ] Test search filtering
- [ ] Test archive/unarchive
- [ ] Test navigation to report detail
- [ ] Test new report creation flow

## Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Data Transfer | ~5MB | ~50KB | <100KB |
| Initial Load Time | 3-5s | <500ms | <1s |
| Time to Interactive | 5-7s | <1s | <2s |

## Files to Modify

| File | Changes |
|------|---------|
| `apps/web/supabase/migrations/[timestamp]_add_report_mode_column.sql` | NEW - Add mode column |
| `apps/web/app/app/_lib/server/sparlo-reports.loader.ts` | Update interface & query |
| `apps/web/app/app/page.tsx` | Use loader, remove inline query |
| `apps/web/app/app/_components/reports-dashboard.tsx` | Remove concept_count display |
| `apps/web/app/app/_lib/types.ts` | Update Report type if needed |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Mode backfill misses some reports | Low | Low | Default to 'standard', verify with SQL count |
| Concept count removal upsets users | Low | Low | It's rarely used info, can add back to detail page |
| RLS policy performance with mode column | Low | Medium | Simple equality check, well-indexed |

## Out of Scope

- Pagination (current 50-report limit is acceptable for MVP)
- Server-side search (client-side filtering works for 50 reports)
- Real-time updates (existing subscription pattern works)
- Caching strategy (can optimize later if needed)

## References

### Internal
- Optimized loader: `apps/web/app/app/_lib/server/sparlo-reports.loader.ts:29-45`
- Current slow query: `apps/web/app/app/page.tsx:64-71`
- Dashboard component: `apps/web/app/app/_components/reports-dashboard.tsx`
- Partial index: `apps/web/supabase/migrations/20251220000000_add_archived_indexes.sql`

### External
- [Supabase Query Optimization](https://supabase.com/docs/guides/database/query-optimization)
- [Next.js Server Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
