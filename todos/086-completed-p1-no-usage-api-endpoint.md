---
status: pending
priority: p1
issue_id: "086"
tags: [agent-native, api, usage-tracking]
dependencies: []
---

# No API Endpoint for Usage Data Access

Usage data is only accessible through UI components; there's no programmatic API for agents or integrations.

## Problem Statement

The usage tracking feature exposes data only through React components. There's no REST API endpoint for:

1. Querying current usage/remaining tokens
2. Checking if usage is allowed
3. Retrieving usage history
4. Programmatic access for integrations or agents

This violates the agent-native principle: if a user can see something, an agent should be able to access it too.

## Findings

- Usage data rendered in UI components only
- `UsageService` exists but no API route exposes it
- Agents cannot check remaining quota before initiating requests
- No webhook or callback for usage threshold alerts
- CLI tools and integrations cannot access usage data

## Proposed Solutions

### Option 1: Create /api/usage Endpoint

**Approach:** Add a new API route that exposes usage data via REST.

**Pros:**
- Standard REST pattern
- Easy to consume by agents/integrations
- Can add caching headers

**Cons:**
- New endpoint to maintain

**Effort:** 1-2 hours

**Risk:** Low

**Implementation:**
```typescript
// app/api/usage/route.ts
export const GET = enhanceRouteHandler(
  async ({ user }) => {
    const usage = await getUsageForAccount(user.account_id);
    return NextResponse.json({
      current_period: usage.period_start,
      input_tokens_used: usage.input_tokens,
      output_tokens_used: usage.output_tokens,
      input_tokens_limit: usage.tier_limits.input,
      output_tokens_limit: usage.tier_limits.output,
      remaining_input: usage.tier_limits.input - usage.input_tokens,
      remaining_output: usage.tier_limits.output - usage.output_tokens,
    });
  },
  { auth: true }
);
```

---

### Option 2: GraphQL Extension

**Approach:** Add usage to existing GraphQL schema if one exists.

**Pros:**
- Consistent with existing API patterns
- Type-safe queries

**Cons:**
- Only useful if GraphQL already in use
- More complex setup

**Effort:** 2-3 hours

**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**New files:**
- `apps/web/app/api/usage/route.ts` - Main endpoint
- `apps/web/app/api/usage/history/route.ts` - Historical data (optional)

**Response schema:**
```typescript
interface UsageResponse {
  current_period: string; // ISO date
  input_tokens_used: number;
  output_tokens_used: number;
  input_tokens_limit: number;
  output_tokens_limit: number;
  remaining_input: number;
  remaining_output: number;
  tier: 'starter' | 'pro' | 'enterprise';
}
```

## Acceptance Criteria

- [ ] GET /api/usage returns current usage data
- [ ] Endpoint requires authentication
- [ ] Response includes used, limit, and remaining tokens
- [ ] Proper error handling for missing data
- [ ] Typecheck passes
- [ ] API documented

## Work Log

### 2025-12-19 - Initial Discovery

**By:** Claude Code (Agent-Native Reviewer)

**Actions:**
- Audited usage feature for agent accessibility
- Confirmed no API endpoint exists
- Designed REST API response schema
- Documented agent-native gap

**Learnings:**
- UI-only features create agent blind spots
- REST APIs should mirror UI capabilities
- Consider agents as first-class consumers

## Notes

- HIGH priority for agent-native architecture
- Should be implemented alongside usage tracking fix
- Consider rate limiting on this endpoint
