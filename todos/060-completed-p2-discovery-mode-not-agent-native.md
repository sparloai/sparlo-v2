---
status: completed
priority: p2
issue_id: "060"
tags: [code-review, architecture, agent-native, discovery-mode]
dependencies: []
completed_at: 2025-12-19
---

# Discovery Mode Not Agent-Native

## Problem Statement

Discovery Mode is only accessible through the web UI. There are no API endpoints or MCP tools that allow agents to programmatically start discovery reports, answer clarifications, or monitor progress. This violates the agent-native principle: "Whatever the user can do, the agent can do."

## Resolution

Implemented Option A: Created REST API layer wrapping existing server actions.

### API Endpoints Created

1. **POST `/api/discovery/reports`** - Start a discovery report
   - Accepts `{ headline, context?, clarificationMode?, isMobile? }`
   - Returns `{ success, reportId, conversationId }`
   - Includes rate limiting (10 reports/day for free users)

2. **POST `/api/reports/[id]/clarify`** - Answer clarification question
   - Accepts `{ answer: string }`
   - Validates report ownership and status
   - Resumes Inngest workflow with correct event name per mode

3. **GET `/api/reports/[id]/clarify`** - Get pending clarification
   - Returns `{ needsClarification, question, clarificationHistory }`

4. **GET `/api/reports/[id]/progress`** - Monitor progress
   - Returns detailed progress with step mapping for both modes
   - Includes `overallProgress`, `currentStep`, `lastMessage`, `isComplete`

5. **GET `/api/reports?mode=discovery`** - List discovery reports
   - Mode filtering: `mode=discovery` or `mode=standard`
   - Pagination with `limit` and `offset`

### Files Created/Modified

- `apps/web/app/api/discovery/reports/route.ts` (NEW)
- `apps/web/app/api/reports/[id]/clarify/route.ts` (NEW)
- `apps/web/app/api/reports/[id]/progress/route.ts` (NEW)
- `apps/web/app/api/reports/route.ts` (MODIFIED - added mode filtering)
- `apps/web/app/api/reports/[id]/route.ts` (MODIFIED - added clarifications field)

## Acceptance Criteria

- [x] Agents can programmatically start a discovery report
- [x] Agents can answer clarification questions
- [x] Agents can retrieve completed report data via API
- [x] Agents can monitor report progress via API
- [x] Agents can list their discovery reports
- [ ] API endpoints are documented (deferred)

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | Identified during code review |
| 2025-12-19 | Resolved | Implemented REST API endpoints |

## Resources

- PR: Discovery Mode commit f8b0587
- Related: Standard report API endpoints
