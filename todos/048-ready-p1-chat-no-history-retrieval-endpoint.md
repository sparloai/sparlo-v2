---
status: ready
priority: p1
issue_id: "048"
tags: [agent-native, api-design, chat, completeness]
dependencies: []
---

# No GET Endpoint for Chat History Retrieval

## Problem Statement

There's no API endpoint to retrieve chat history without sending a new message. Agents and frontends cannot:
1. Check existing conversation state before responding
2. Sync history across devices/sessions
3. Display history on page load without full report fetch

**Agent Impact:** MEDIUM - Agents can't read before writing, violates agent-native principles.

## Findings

- **File:** `apps/web/app/api/sparlo/chat/route.ts`
- Only POST method exists
- History embedded in report query, not separately accessible
- Frontend loads history via report fetch (works but inefficient)

**Missing capability:**
```typescript
// Agent wants to check history before responding
const history = await fetch(`/api/sparlo/chat/${reportId}`, {
  method: 'GET'
});
// Currently: Not possible!
```

**Current workaround:**
```typescript
// Must fetch entire report to get history
const report = await supabase
  .from('sparlo_reports')
  .select('chat_history')
  .eq('id', reportId)
  .single();
```

## Proposed Solutions

### Option 1: Add GET Handler to Existing Route

**Approach:** Export GET function in same route file.

```typescript
export const GET = enhanceRouteHandler(
  async function GET({ request }) {
    const url = new URL(request.url);
    const reportId = url.searchParams.get('reportId');

    // Fetch and return history
    const { data, error } = await client
      .from('sparlo_reports')
      .select('chat_history')
      .eq('id', reportId)
      .single();

    return Response.json({ history: data?.chat_history ?? [] });
  },
  { auth: true }
);
```

**Pros:**
- Simple addition to existing route
- Same authorization logic
- No new files

**Cons:**
- Query param for reportId feels awkward
- GET with body would be more RESTful but unusual

**Effort:** 1 hour

**Risk:** Low

---

### Option 2: New Route `/api/sparlo/chat/[reportId]`

**Approach:** Create separate dynamic route for history retrieval.

```
/api/sparlo/chat/[reportId]/route.ts
  GET  -> Return history
  POST -> Send message (could move here)
```

**Pros:**
- RESTful URL structure
- Clean separation
- reportId in path, not query

**Cons:**
- Needs restructuring of existing route
- More files to maintain

**Effort:** 2-3 hours

**Risk:** Low

---

### Option 3: GraphQL-style Query Endpoint

**Approach:** Create `/api/sparlo/query` that accepts various queries.

**Pros:**
- Flexible for future needs
- Single endpoint for reads

**Cons:**
- Over-engineered for current needs
- Inconsistent with REST patterns in codebase

**Effort:** 4-6 hours

**Risk:** Medium

## Recommended Action

Implement Option 1 (add GET to existing route):

1. Add GET handler to `/api/sparlo/chat/route.ts`
2. Accept `reportId` as query parameter
3. Return `{ history: ChatMessage[], reportStatus: string }`
4. Same RLS authorization applies

## Technical Details

**Affected files:**
- `apps/web/app/api/sparlo/chat/route.ts` - Add GET export

**GET response schema:**
```typescript
interface ChatHistoryResponse {
  history: ChatMessage[];
  reportStatus: 'pending' | 'processing' | 'complete' | 'error';
}
```

**Usage:**
```bash
# Get history
GET /api/sparlo/chat?reportId=uuid-here

# Response
{
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "reportStatus": "complete"
}
```

## Resources

- **Commit:** `fefb735` (fix: chat API)
- **Agent-native principle:** "Anything a user can see, an agent can see"

## Acceptance Criteria

- [ ] GET endpoint returns chat history
- [ ] Returns empty array if no history
- [ ] Returns report status for context
- [ ] RLS prevents access to others' reports
- [ ] Test: Fetch history without sending message
- [ ] Documentation updated with new endpoint

## Work Log

### 2025-12-17 - Initial Discovery

**By:** Claude Code (Code Review)

**Actions:**
- Identified missing read endpoint during agent-native review
- Analyzed agent consumption patterns
- Documented 3 solution approaches

**Learnings:**
- Agent-native = agents can read before writing
- Current design forces write to read (POST to get history)
- Simple GET addition solves the gap
