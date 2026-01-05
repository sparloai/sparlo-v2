---
status: pending
priority: p2
issue_id: "185"
tags: [pdf, docraptor, reliability, circuit-breaker]
dependencies: ["184"]
---

# P2: No Circuit Breaker for DocRaptor Outages

## Problem Statement

If DocRaptor API goes down, every request waits 60 seconds before timing out. With 5 concurrent slots, all slots become occupied for the duration of the outage, effectively locking up the PDF service.

## Findings

**File:** `apps/web/app/api/reports/[id]/pdf/route.tsx`

Current flow during DocRaptor outage:
1. User 1 requests PDF → waits 60s → timeout
2. User 2 requests PDF → waits 60s → timeout
3. All 5 slots occupied for 60s
4. New requests get "Server busy" immediately
5. Poor user experience for everyone

No circuit breaker pattern exists to fail fast during outages.

## Proposed Solutions

### Option 1: Circuit Breaker Pattern (Recommended)

Implement state machine: CLOSED → OPEN → HALF_OPEN → CLOSED

```typescript
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 3;
  private readonly resetTimeout = 30000;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker OPEN - service unavailable');
      }
    }

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
      }
      throw error;
    }
  }
}
```

**Pros:**
- Fail fast during outages (instant error vs 60s wait)
- Auto-recovery after 30 seconds
- Protects system from cascading failures

**Cons:**
- More complex code
- Module-level state (works for serverless)

**Effort:** Medium (45 min)
**Risk:** Low

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected files:**
- `apps/web/app/api/reports/[id]/pdf/route.tsx`

**Dependencies:**
- Should be implemented after retry logic (#184)

## Acceptance Criteria

- [ ] Circuit breaker class implemented
- [ ] Opens after 3 consecutive failures
- [ ] Auto-recovers after 30 seconds (HALF_OPEN state)
- [ ] Returns 503 with Retry-After header when OPEN
- [ ] Logging for state transitions

## Work Log

### 2026-01-04 - Initial Finding

**By:** Code Review Agents (architecture-strategist)

**Actions:**
- Identified cascading failure risk during outages
- Proposed circuit breaker pattern
- Noted dependency on retry logic implementation

**Learnings:**
- Circuit breakers prevent cascading failures
- HALF_OPEN state enables graceful recovery
