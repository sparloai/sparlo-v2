# Detailed Code Review Checklists

Quick reference checklists for preventing the 6 common issues identified in code review.

---

## 1. TYPE DUPLICATION CHECKLIST

### When Reviewing Any TypeScript File

```
Type Definition Questions:

❓ Is this type defined in 1 place only?
   ☐ YES → Good! Move on
   ☐ NO → Type duplication detected

❓ Does this type exist in _lib/types.ts?
   ☐ YES → Import from there instead
   ☐ NO → Should it? (Used in 2+ files?)

❓ Is the type exported from barrel export?
   ☐ YES → Use centralized import path
   ☐ NO → Add to _lib/index.ts

Type Name Consistency:

☐ No similar names in same feature
  ❌ formatDate AND formatReportDate
  ✅ formatDate (single definition)

☐ Type used same way everywhere
  ❌ type ReportMode | string in one place
  ✅ type ReportMode consistently

☐ No local redefinitions
  ❌ import ReportMode; type ReportMode = ...
  ✅ import type { ReportMode }
```

### Search Commands to Find Duplication

```bash
# Find duplicate type definitions
grep -r "type ReportMode\|interface ReportMode" apps/web --include="*.ts" --include="*.tsx"

# Find duplicate constant definitions
grep -r "REPORT_MODE_LABELS" apps/web --include="*.ts" --include="*.tsx"

# Verify single source of truth
grep -r "export type ReportMode\|export interface ReportMode" apps/web --include="*.ts"
```

---

## 2. CODE DUPLICATION CHECKLIST

### When Reviewing Utility Functions

```
Utility Function Questions:

❓ Is this function already defined elsewhere?
   ☐ YES → Delete and import instead
   ☐ NO → Good, continue

❓ Could this function be in shared/?
   ☐ Used in 2+ features → Move to lib/shared/utils
   ☐ Used in 1 feature → Keep in feature/_lib/utils
   ☐ Generic utility → Move to lib/shared/utils

❓ Does name match existing utilities?
   ❌ formatDate vs formatReportDate vs formatDateForDisplay
   ✅ formatDate (single name)

Function Name Consistency:

☐ Generic functions use generic names
  ❌ formatReportDate (too specific)
  ✅ formatDate (reusable name)

☐ Similar functions combined
  ❌ truncateText AND truncateString
  ✅ truncateString (single implementation)

☐ Utilities importable from barrel
  ✅ import { formatDate } from '@/lib/shared/utils'
  ❌ import { formatDate } from '../../../utils/formatting'

Shared Component Extraction:

☐ Component duplicated in 2+ places?
  ✅ Extract to shared/_components/

☐ Component only in 1 place?
  ✅ Keep in feature/_components/

☐ Component uses feature-specific imports?
  ✅ Keep local (avoid shared dependencies)
  ❌ Move to shared (too coupled)
```

### Search Commands

```bash
# Find duplicate functions
grep -r "export function formatDate\|export const formatDate" apps/web

# Find duplicate component patterns
grep -r "ModeLabel\|ModeBadge\|ModeIndicator" apps/web --include="*.tsx"

# Find similar implementations
grep -r "function truncate\|function shorten" apps/web --include="*.ts"
```

---

## 3. CACHE REVALIDATION CHECKLIST

### For Every Server Action That Modifies Data

```
Cache Revalidation Questions:

❓ Does this action modify database?
   ☐ YES → Revalidation required
   ☐ NO → Skip, continue

❓ What data was modified?
   Answer: ___________________

❓ What pages display this data?
   List all:
   - ___________________
   - ___________________
   - ___________________

❓ Are all pages revalidated?
   ☐ Primary page (main feature)
   ☐ Secondary pages (related features)
   ☐ Detail pages ([id] routes)
   ☐ API routes that serve data

Implementation Checklist:

☐ revalidatePath() calls present
☐ All affected paths included
☐ Each revalidation has comment explaining why
☐ No typos in path strings
☐ Dynamic routes use correct syntax

Comments Required:

For each revalidatePath:
/**
 * Revalidate [path] because:
 * - [Reason why this path is affected]
 * - [What data changed that impacts this page]
 */
revalidatePath('[path]');

❌ RED FLAGS:
- No revalidatePath() calls
- Revalidation only on primary page
- No comments explaining paths
- Typos in path strings
- Missing detail pages
```

### Common Data Mutations

```
Archive/Unarchive Report:
  ☐ revalidatePath('/home/reports')      // List changes
  ☐ revalidatePath('/home/archived')     // Archived list
  ☐ revalidatePath('/home/reports/[id]') // Detail page

Create Report:
  ☐ revalidatePath('/home/reports')      // New report appears
  ☐ revalidatePath('/api/reports')       // API updated

Delete Report:
  ☐ revalidatePath('/home/reports')      // Removed from list
  ☐ revalidatePath('/home/archived')     // If was archived
  ☐ revalidatePath('/home/reports/[id]') // Page invalid

Update Report (title, status):
  ☐ revalidatePath('/home/reports')      // List updates
  ☐ revalidatePath('/home/archived')     // If status → archived
  ☐ revalidatePath('/home/reports/[id]') // Detail page
```

---

## 4. API PARAMETER HANDLING CHECKLIST

### When Adding New API Route or Parameter

```
Parameter Definition:

☐ All parameters documented
☐ Parameter names follow convention
☐ Valid values listed (enum or constraints)
☐ Default values specified
☐ Examples provided

Parameter Documentation Template:

/**
 * GET /api/endpoint
 *
 * Query Parameters:
 *
 * - paramName: 'value1' | 'value2' (optional)
 *   Description of what it does
 *   Default: returns all
 *
 *   Examples:
 *   - ?paramName=value1 → filters to value1
 *   - ?paramName=value2 → filters to value2
 *   - (no param) → returns all
 *
 * Response: {...}
 */

Parameter Validation:

☐ Validation schema defined (Zod)
☐ All parameters extracted from request
☐ Invalid inputs return 400 error
☐ Error response helpful (lists valid values)
☐ Parameter combinations tested

Implementation Checklist:

☐ Parameter extracted from URL
   const param = url.searchParams.get('paramName');

☐ Parameter validated with Zod
   const schema = z.enum(['value1', 'value2']);
   const parsed = schema.safeParse(param);

☐ Invalid params handled
   if (!parsed.success) {
     return NextResponse.json({ error: ... }, { status: 400 });
   }

☐ Parameter applied to query
   if (parsed.data === 'value1') {
     query = query.eq('column', 'value1');
   }

❌ RED FLAGS:
- No validation schema
- Parameter used directly in query
- No error handling for invalid values
- Parameter documented but not used
- Inconsistent parameter names
```

### Query Parameter Validation Template

```typescript
// Define all parameters in one place
const QuerySchema = z.object({
  status: z.enum(['processing', 'complete']).optional(),
  archived: z.enum(['true', 'false']).optional(),
  limit: z.number().min(1).max(100).default(20),
});

// Validate all at once
const result = QuerySchema.safeParse({
  status: url.searchParams.get('status'),
  archived: url.searchParams.get('archived'),
  limit: url.searchParams.get('limit') ? parseInt(...) : undefined,
});

// Return errors
if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 400 });
}

// Use validated params
const { status, archived, limit } = result.data;
```

---

## 5. DATABASE INDEX CHECKLIST

### When Writing Queries That Filter or Sort Data

```
Query Analysis:

❓ What WHERE clauses are used?
   Example: WHERE archived = false AND account_id = $1

❓ What ORDER BY is used?
   Example: ORDER BY created_at DESC

❓ How much data will match this query?
   Estimated rows: ___

❓ How often will this query run?
   ☐ Once (startup)
   ☐ Occasionally (user action)
   ☐ Frequently (every page view)
   ☐ Very frequently (search results)

❓ Will this query slow down as data grows?
   ☐ Thousands of rows
   ☐ Tens of thousands
   ☐ Hundreds of thousands

Index Strategy:

If data is large AND query is frequent:

For: WHERE archived = false ORDER BY created_at DESC
Create: Partial index
  CREATE INDEX idx_sparlo_reports_active
    ON sparlo_reports(account_id, created_at DESC)
    WHERE archived = false;

For: WHERE status = 'complete'
Create: Single column index
  CREATE INDEX idx_sparlo_reports_status
    ON sparlo_reports(status);

Implementation:

☐ Migration created with index
☐ Index includes all WHERE/ORDER columns
☐ Partial indexes used for subsets
☐ Migration has performance notes
☐ Index documented in INDEXES.md

Documentation Required:

For each index:
- [ ] What query it supports
- [ ] Why it's needed (scale/frequency)
- [ ] Performance improvement (before/after)
- [ ] Used by which pages/APIs

❌ RED FLAGS:
- Query on unindexed column
- EXPLAIN ANALYZE shows "Seq Scan"
- Large WHERE clause with no index
- Filtering by boolean without partial index
- Index created without migration
```

### Common Index Patterns

```
Active/Archived Split:

Problem: WHERE archived = false vs WHERE archived = true

Solution: TWO partial indexes
✅ idx_active: (account_id, created_at DESC) WHERE archived = false
✅ idx_archived: (account_id, updated_at DESC) WHERE archived = true

Composite Filtering:

Problem: WHERE account_id = ? AND status = ?

Solution: Composite index
✅ idx_account_status: (account_id, status)

Sorting on Large Tables:

Problem: ORDER BY created_at DESC on 100K rows

Solution: Include in WHERE index
✅ idx_active: (account_id, created_at DESC) WHERE archived = false
```

---

## 6. ERROR HANDLING CHECKLIST

### For Every Client Component with Server Actions

```
Error Handling Questions:

❓ Are server actions wrapped in try/catch?
   ☐ YES → Good!
   ☐ NO → Add error handling

❓ Are errors displayed to user?
   ☐ YES → Good!
   ☐ NO → Add error state + display

❓ Is there loading state during request?
   ☐ YES → Good!
   ☐ NO → Add isPending indicator

Component Implementation:

☐ useState for error state
  const [error, setError] = useState<string | null>(null);

☐ useTransition for loading state
  const [isPending, startTransition] = useTransition();

☐ Try/catch wrapping server action
  startTransition(async () => {
    try {
      await serverAction(...);
    } catch (err) {
      setError(err.message);
    }
  });

☐ Error displayed in UI
  {error && <div className="text-red-600">{error}</div>}

☐ Button disabled during request
  <button disabled={isPending}>Submit</button>

Form Error Handling:

☐ useActionState for form submission
☐ Validation errors shown per field
☐ Server action errors shown globally
☐ Submit button disabled during request
☐ Success state after completion

Error Display Standards:

☐ Messages are user-friendly (not stack traces)
  ❌ "TypeError: Cannot read property 'id' of null"
  ✅ "Failed to update report. Please try again."

☐ Errors are actionable
  ✅ "Enter a valid email address"
  ❌ "Invalid input format"

☐ Errors don't reveal sensitive info
  ✅ "Failed to connect to service"
  ❌ "Connection to database.example.com refused"

Error Logging:

☐ Errors logged to console with context
  console.error('[ComponentName] Error:', error);

☐ Component name included in logs
  console.error('[ArchiveButton] Failed:', error);

☐ No PII/secrets logged
  ✅ console.error('User update failed')
  ❌ console.error('User update failed', userData)

❌ RED FLAGS:
- No try/catch around await
- Error silently caught (no console.error)
- No error UI display
- Errors not logged with context
- Stack traces shown to users
- Button not disabled during request
```

### Error Handling Template

```typescript
'use client';

import { useTransition, useState } from 'react';

export function MyComponent() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    startTransition(async () => {
      try {
        const result = await myServerAction();

        if (!result.success) {
          setError(result.error ?? 'Failed to complete action');
          return;
        }

        // Success handling
        // router.refresh(), etc
      } catch (err) {
        console.error('[MyComponent] Error:', err);
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
      }
    });
  };

  return (
    <>
      <button onClick={handleAction} disabled={isPending}>
        {isPending ? 'Loading...' : 'Submit'}
      </button>

      {error && (
        <div className="mt-2 text-red-600 text-sm">{error}</div>
      )}
    </>
  );
}
```

---

## Quick Decision Trees

### Should I create a new type or reuse existing?

```
                    Start
                      |
                      v
        Is type used in 2+ files?
                    /    \
                  YES     NO
                  /         \
                 v           v
         Move to _lib/   Keep local
         types.ts       (1 file only)
                |           |
                v           v
           Export from   Use locally
           barrel export
```

### Should I extract to shared/?

```
                  Start
                    |
                    v
        Generic utility/component?
              /        \
            YES         NO
            /             \
           v               v
        Used in 2+ ──→ Used in 1 only
        features?       └──→ Keep local
           /    \
         YES    NO
         /        \
        v         v
   Move to    Keep in
   shared/    feature/
```

### Should I add an index?

```
                  Start
                    |
                    v
        Query used frequently?
          (multiple times/day)
             /      \
           YES      NO
           /          \
          v           v
   Data grows to  Don't index
   10K+ rows?      (monitor)
     /    \
   YES    NO
   /        \
  v         v
Add index  Monitor for
(critical) growth
```

---

## Pre-Commit Checklist Template

```
Before committing code:

Type Safety:
  [ ] No duplicate type definitions
  [ ] Types imported from centralized location
  [ ] No `any` types
  [ ] TypeScript strict mode passes

Code Quality:
  [ ] No duplicate functions
  [ ] Shared utilities extracted
  [ ] No dead code
  [ ] Functions have single responsibility

Error Handling:
  [ ] All async operations have try/catch
  [ ] Errors logged with component context
  [ ] User sees friendly error messages
  [ ] No unhandled promise rejections

Data Handling:
  [ ] All server mutations revalidate cache
  [ ] API parameters validated
  [ ] Input sanitized (no SQL injection)
  [ ] Database indexes considered

Performance:
  [ ] No new N+1 queries
  [ ] Large lists paginated
  [ ] Heavy computations memoized
  [ ] Indexes added for filtered queries

Testing:
  [ ] Happy path tested
  [ ] Error path tested
  [ ] Edge cases considered
  [ ] No console.log statements left

Documentation:
  [ ] Complex logic has comments
  [ ] API endpoints documented
  [ ] Server actions document side effects
  [ ] Indexes documented
```

---

## Running Automated Checks

```bash
# Run type checker
pnpm typecheck

# Run linter with fixes
pnpm lint:fix

# Format code
pnpm format:fix

# Run tests
pnpm test

# Full suite
pnpm lint:fix && pnpm typecheck && pnpm format:fix && pnpm test
```

---

## Common Issues & Quick Fixes

### "Type ReportMode defined in multiple places"
```bash
# Find all definitions
grep -r "type ReportMode" apps/web

# Keep only in _lib/types.ts
# Remove others and import instead
import type { ReportMode } from '../types';
```

### "formatDate function duplicated"
```bash
# Find all definitions
grep -r "export.*formatDate" apps/web

# Move to lib/shared/utils/formatting.ts
# Update imports to use barrel export
import { formatDate } from '@/lib/shared/utils';
```

### "No revalidatePath after data mutation"
```bash
# Check server action
- [ ] Does it modify database? (insert, update, delete)
- [ ] Add revalidatePath() for all affected pages
- [ ] Include comment explaining which pages and why
```

### "No error handling in client component"
```typescript
// Add try/catch
startTransition(async () => {
  try {
    await serverAction();
  } catch (err) {
    console.error('[Component] Error:', err);
    setError('User friendly message');
  }
});
```

### "Missing index on filtered column"
```bash
# Check EXPLAIN output
EXPLAIN ANALYZE
SELECT * FROM table
WHERE column = $1;

# Look for "Seq Scan" - means no index
# Create index if data is large
CREATE INDEX idx_name ON table(column);
```

---

## When in Doubt

1. **Type duplication**: Ask "Is this type used in >1 file?" → If YES, consolidate
2. **Code duplication**: Ask "Will I maintain this code in 2+ places?" → If YES, extract
3. **Cache revalidation**: Ask "What pages display this data?" → Revalidate all of them
4. **API parameters**: Ask "Are all query params documented and validated?" → If NO, fix
5. **Database index**: Ask "Is this query on 10K+ rows?" → If YES, add index
6. **Error handling**: Ask "Could this fail?" → If YES, add try/catch

---

## Resources

- Type consolidation: See PREVENTION_STRATEGIES_DETAILED.md § 1
- Code duplication: See PREVENTION_STRATEGIES_DETAILED.md § 2
- Cache revalidation: See PREVENTION_STRATEGIES_DETAILED.md § 3
- API parameters: See PREVENTION_STRATEGIES_DETAILED.md § 4
- Database indexes: See PREVENTION_STRATEGIES_DETAILED.md § 5
- Error handling: See PREVENTION_STRATEGIES_DETAILED.md § 6
