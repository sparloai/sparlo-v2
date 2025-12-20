---
priority: P2
category: agent-native
status: pending
source: code-review-2e709f0
created: 2025-12-20
---

# Add API Support for Archived Reports Filter

## Problem
Users can view archived reports at `/home/archived` but agents cannot access this data programmatically. The existing `/api/reports` endpoint doesn't support filtering by archived status.

This breaks the agent-native principle: "Whatever the user can see, the agent can see."

## Current State
- UI Path: `/home/archived` page queries with `.eq('archived', true)`
- API: No `archived` parameter support in `/api/reports`
- Agent Access: **NONE**

## Solution
Extend `/api/reports` endpoint to support an `archived` query parameter:

```typescript
// /apps/web/app/api/reports/route.ts
const archived = url.searchParams.get('archived'); // 'true' | 'false' | null

if (archived === 'true') {
  query = query.eq('archived', true);
} else if (archived === 'false') {
  query = query.eq('archived', false);
}
// If null/undefined, return all reports
```

## Example API Calls
- `GET /api/reports?archived=true` - List only archived reports
- `GET /api/reports?archived=false` - List only active reports
- `GET /api/reports` - List all reports (current behavior)

## File
`/apps/web/app/api/reports/route.ts`

## Effort
1 hour
