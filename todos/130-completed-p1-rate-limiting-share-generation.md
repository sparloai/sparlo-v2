---
status: completed
priority: p1
issue_id: "130"
tags: [security, code-review, share-export]
dependencies: []
---

# Missing Rate Limiting on Share Link Generation

## Problem Statement

The `generateShareLink()` server action has no rate limiting protection, allowing attackers to generate unlimited share tokens for reports they own.

**Why it matters**: Resource exhaustion (database, token generation), potential abuse vector for authenticated users, no protection against automated scripting attacks.

## Findings

**Source**: Security Sentinel review of commit d08d4fa

**File**: `/apps/web/app/home/(user)/reports/[id]/_lib/server/share-actions.ts`

```typescript
export const generateShareLink = enhanceAction(
  async (data) => {
    // NO RATE LIMIT CHECK HERE
    const client = getSupabaseServerClient();
    // ... creates share token ...
  },
  { schema: GenerateShareLinkSchema },
);
```

**Impact**:
- Resource exhaustion (database, token generation)
- Potential abuse vector for authenticated users
- No protection against automated scripting attacks

## Proposed Solutions

### Option A: Add Rate Limiting via Supabase RPC (Recommended)

```typescript
export const generateShareLink = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();

    // Add rate limit check
    const rateLimit = await client.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_endpoint: 'share-link-generation',
      p_hourly_limit: 20,  // 20 shares per hour
      p_daily_limit: 100   // 100 shares per day
    }).single();

    if (!rateLimit.data?.allowed) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // ... rest of implementation
  },
  { schema: GenerateShareLinkSchema },
);
```

**Pros**: Database-level enforcement, works across multiple instances
**Cons**: Requires new RPC function
**Effort**: Medium (1-2 hours)
**Risk**: Low

### Option B: Use Upstash Redis Rate Limiting

**Pros**: Distributed, scalable, built for rate limiting
**Cons**: Additional dependency, cost
**Effort**: Medium-High (2-3 hours)
**Risk**: Low

## Recommended Action

Option A - Add rate limiting via Supabase RPC. This keeps the solution within existing infrastructure.

## Technical Details

**Affected Files**:
- `apps/web/app/home/(user)/reports/[id]/_lib/server/share-actions.ts`

**Suggested Limits**:
- 20 shares per hour per user
- 100 shares per day per user

## Acceptance Criteria

- [ ] Rate limiting is enforced on share link generation
- [ ] Users see clear error message when rate limited
- [ ] Limits are: 20/hour, 100/day per user
- [ ] Works across multiple server instances

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | Security finding from commit d08d4fa |

## Resources

- Commit: d08d4fa
- Related: #131 (PDF export rate limiting)
