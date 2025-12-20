---
priority: P1
category: bug
status: pending
source: code-review-2e709f0
created: 2025-12-20
---

# Fix Incomplete Cache Revalidation for Archive

## Problem
The `archiveReport` server action only revalidates `/home` but not `/home/archived`.

```typescript
// sparlo-reports-server-actions.ts line 259
revalidatePath('/home');  // Missing: revalidatePath('/home/archived')
```

## Impact
- After restoring a report from archived page, the archived page shows stale data
- User sees action succeed but UI doesn't update until manual refresh
- Confusing user experience

## Solution
Update server action to revalidate both paths:

```typescript
revalidatePath('/home');
revalidatePath('/home/archived');
```

Or use layout revalidation:
```typescript
revalidatePath('/home', 'layout');  // Revalidates all /home/* routes
```

## File
`/apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`

## Effort
30 minutes
