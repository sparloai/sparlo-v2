---
id: "006"
title: "Add UUID validation for report IDs"
priority: P2
status: completed
category: security
created: 2024-12-30
files:
  - app/api/reports/[id]/pdf/route.tsx
  - app/api/reports/[id]/print/route.tsx
---

# High: Missing UUID Validation

## Problem

The report ID from URL params is passed directly to the database query without validation:

```typescript
const { id } = params as { id: string };

// id is used directly in query
const { data: report, error } = await client
  .from('sparlo_reports')
  .select('...')
  .eq('id', id)
  .single();
```

While PostgreSQL would reject invalid UUIDs, it's better to validate early for:
1. Clearer error messages
2. Prevent unnecessary database round-trips
3. Defense in depth

## Required Fix

Add UUID validation at the start of the handler:

```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

// In handler:
if (!id || !isValidUUID(id)) {
  return NextResponse.json(
    { error: 'Invalid report ID', code: 'INVALID_ID' },
    { status: 400 }
  );
}
```

## Acceptance Criteria

- [ ] Both routes validate UUID format before database query
- [ ] Invalid UUIDs return 400 with clear error message
- [ ] Valid UUIDs continue to work as expected
