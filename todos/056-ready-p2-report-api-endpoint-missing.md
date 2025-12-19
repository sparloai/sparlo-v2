---
status: ready
priority: p2
issue_id: "056"
tags: [api, agent-native, architecture, report]
dependencies: []
---

# No Public Report API Endpoint (Agent-Native Gap)

## Problem Statement

Users can view reports through the UI at `/home/reports/[id]`, but there's no corresponding API endpoint for programmatic access. Agents must directly query the database using Supabase client, creating an asymmetry where agents can discuss reports (via chat API) but cannot autonomously retrieve them.

## Findings

**Agent-Native Review findings:**
- Score: 5/11 capabilities agent-accessible (45%)
- Chat functionality: Excellent API coverage
- Report data access: UI-locked (no API)

**Missing capabilities:**
- GET /api/reports/[id] - Individual report access
- GET /api/reports - List user's reports
- Section-level access via query params

**Current workaround requirements:**
- Database credentials needed
- Knowledge of internal schema structure
- RLS policy understanding
- Manual parsing of nested JSON

## Proposed Solutions

### Option 1: Create Report API Endpoints

**Approach:** Add standard REST endpoints for report access.

```typescript
// /api/reports/[id]/route.ts
export const GET = enhanceRouteHandler(
  async function GET({ params }) {
    const { id } = await params;
    const client = getSupabaseServerClient();

    const { data, error } = await client
      .from('sparlo_reports')
      .select('id, title, status, report_data, created_at, chat_history')
      .eq('id', id)
      .single();

    if (error || !data) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    const structuredReport = extractStructuredReport(data.report_data);

    return Response.json({
      id: data.id,
      title: data.title,
      status: data.status,
      report: structuredReport,
      chat_history: data.chat_history,
    });
  },
  { auth: true }
);
```

**Pros:**
- Achieves agent-native parity
- Standard REST pattern
- Reuses existing validation/extraction

**Cons:**
- Additional API surface to maintain
- May need rate limiting

**Effort:** 3-4 hours

**Risk:** Low

---

### Option 2: GraphQL Endpoint

**Approach:** Add GraphQL layer for flexible queries.

**Pros:**
- Flexible field selection
- Single endpoint for all report needs

**Cons:**
- Overkill for current needs
- Learning curve

**Effort:** 8-12 hours

**Risk:** Medium

## Recommended Action

Implement Option 1 - create REST endpoints for reports. Add section-level filtering via query params for efficiency.

## Technical Details

**Files to create:**
- `apps/web/app/api/reports/[id]/route.ts` - Individual report
- `apps/web/app/api/reports/route.ts` - List reports

**Query parameters to support:**
- `sections` - Comma-separated list of sections to return
- `status` - Filter by report status
- `limit` - Pagination for list endpoint

**RLS:** Existing policies handle authorization automatically

## Acceptance Criteria

- [ ] GET /api/reports/[id] returns report data
- [ ] GET /api/reports returns list of user's reports
- [ ] Section filtering works via query params
- [ ] Authentication required (401 for unauthenticated)
- [ ] RLS enforces user can only access own reports
- [ ] Response matches AN5 schema structure
- [ ] OpenAPI documentation added

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Agent-Native Review Agent)

**Actions:**
- Audited report capabilities for agent accessibility
- Identified UI-locked data access as critical gap
- Designed REST API endpoints
- Documented agent-native parity requirements

**Learnings:**
- Agent-native principle: "What user sees, agent sees"
- Chat API is model implementation for agent access
- Report data access breaks parity
