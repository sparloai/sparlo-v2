# Sparlo V2 Code Review Checklists

Quick reference checklists for preventing the 9 issue categories during code review.

## Quick Decision Guide

**When reviewing code, ask yourself:**

1. Is this a server action, API route, or database query? → Check Security & Data Integrity
2. Does this compute something expensive? → Check Performance
3. Does this accept user input? → Check Input Validation
4. Does this stream data? → Check Architecture
5. Does this define a constant? → Check Maintainability

---

## Checklist 1: Server Actions & API Routes (Authorization)

**File patterns:** `*-server-actions.ts`, `api/*/route.ts`

```
BEFORE APPROVING:

☐ Authentication
  ☐ Has `auth: true` in enhanceAction/enhanceRouteHandler
  ☐ User parameter accessed and used (not undefined)
  ☐ No fallback to guest/default user

☐ Authorization
  ☐ Ownership verified before mutation
  ☐ verifyResourceOwnership() called or similar
  ☐ Resource checked against user.id or user account
  ☐ Multi-tenant isolation enforced
  ☐ No `as unknown as` type coercions in auth checks

☐ Input Validation
  ☐ Zod schema provided
  ☐ All inputs validated through schema
  ☐ IDs are UUID validated
  ☐ String lengths limited
  ☐ Enums restricted to allowed values

☐ Error Handling
  ☐ Authorization failures return 403/401
  ☐ Clear error messages (no secret details)
  ☐ No data mutation on validation failure

☐ Logging
  ☐ Authorization failures logged
  ☐ Audit trail includes user ID + timestamp
  ☐ No sensitive data in logs

Questions to Ask:
- "Can this action modify another user's data?"
- "Is there any way to bypass the authorization check?"
- "What happens if I call this with someone else's ID?"
```

---

## Checklist 2: Rate Limiting (Performance & Security)

**File patterns:** Any action handling expensive operations

```
BEFORE APPROVING:

☐ Rate Limit Configured
  ☐ MAX_REQUESTS_PER_WINDOW defined
  ☐ Window size reasonable for operation
  ☐ Daily/total limits if needed
  ☐ Limits documented with comment

☐ Implementation
  ☐ Check happens BEFORE expensive operation
  ☐ Query uses count with head: true (efficient)
  ☐ Timestamp comparisons correct (gte, lte)
  ☐ Check happens in single query if possible

☐ User Experience
  ☐ Error message clear and actionable
  ☐ Tells user when limit resets
  ☐ No data loss from rate limit hit

☐ Monitoring
  ☐ Rate limit hits logged
  ☐ User ID included in logs
  ☐ Timestamp included
  ☐ Business metric tracked

Questions to Ask:
- "What limits this operation? (time, cost, resources)"
- "How many per user is too many?"
- "What happens if we don't rate limit this?"
```

---

## Checklist 3: Input Validation (Security)

**File patterns:** `*.schema.ts`, Zod schemas in server actions

```
BEFORE APPROVING:

☐ String Fields
  ☐ All strings have .min() if required
  ☐ All strings have .max() set
  ☐ Max length matches database column or purpose
  ☐ Error message shows the limit

☐ Number Fields
  ☐ All numbers have .min() and .max()
  ☐ Prevents negative where inappropriate
  ☐ Prevents overflow

☐ Complex Types
  ☐ Arrays have .max() length limit
  ☐ Objects validated recursively
  ☐ Enums restricted to fixed values
  ☐ Dates validated as ISO strings

☐ Error Messages
  ☐ User sees what went wrong
  ☐ Shows limits in message
  ☐ Actionable feedback
  ☐ No data structure exposed

☐ Performance
  ☐ Max lengths prevent DoS
  ☐ Regex patterns don't cause ReDoS
  ☐ Validation completes quickly

Questions to Ask:
- "What's the largest valid input for this field?"
- "Could someone intentionally send huge input to crash this?"
- "Does the error message help the user fix their input?"
```

---

## Checklist 4: Performance - Memoization (React)

**File patterns:** React components, custom hooks

```
BEFORE APPROVING:

☐ Is Memoization Needed?
  ☐ Computation is expensive (not trivial)
  ☐ Component renders frequently
  ☐ Dependencies change infrequently
  ☐ Profiler shows >5ms per render

☐ Dependencies
  ☐ Dependency array exists and explicit
  ☐ All dependencies included
  ☐ No missing dependencies
  ☐ No extra unnecessary dependencies
  ☐ No object/array literals in deps

☐ Correctness
  ☐ Memoized value is immutable
  ☐ No side effects in compute function
  ☐ Handles null/undefined correctly
  ☐ Result used by multiple children

☐ Code Quality
  ☐ Not memoizing trivial work (defeats purpose)
  ☐ Memory cost < recompute cost
  ☐ Readable and maintainable

Questions to Ask:
- "How expensive is this computation really?"
- "Do the dependencies change frequently?"
- "Would removing this memo noticeably slow the app?"
```

---

## Checklist 5: Database Schema (Data Integrity & Performance)

**File patterns:** `*.sql` migrations, schema files

```
BEFORE APPROVING:

☐ Foreign Key Constraints
  ☐ All FKs have ON DELETE clause
  ☐ CASCADE for owned resources
  ☐ SET NULL for optional references
  ☐ RESTRICT for shared resources
  ☐ Choice documented in comment

☐ Indexes
  ☐ All WHERE columns indexed
  ☐ ORDER BY columns included in index
  ☐ Composite indexes match query patterns
  ☐ EXPLAIN ANALYZE used to verify
  ☐ Not creating excessive indexes

☐ Testing
  ☐ Tested deleting parent records
  ☐ Verified cascade behavior
  ☐ Tested indexes improve query time
  ☐ Verified data integrity constraints

☐ Documentation
  ☐ Comments explain FK strategy
  ☐ Comments explain index purpose
  ☐ Migration is idempotent (IF NOT EXISTS)

Questions to Ask:
- "What happens when the parent record is deleted?"
- "Does this query have an index?"
- "Could adding a column break existing queries?"
```

---

## Checklist 6: Architecture - Streaming (Real-Time Features)

**File patterns:** Endpoints with streaming, WebSocket handlers

```
BEFORE APPROVING:

☐ Real vs Fake Streaming
  ☐ Not using fake streaming (buffer-then-show)
  ☐ Using real streaming (Server-Sent Events or WebSocket)
  ☐ Server handles expensive computation
  ☐ Client minimal processing per chunk

☐ Client Implementation
  ☐ Uses EventSource or fetch streaming
  ☐ Handles connection errors
  ☐ Has timeout for stalled streams
  ☐ Cleanup on component unmount
  ☐ No memory leaks from event listeners

☐ Server Implementation
  ☐ Validates auth before streaming
  ☐ Respects rate limits
  ☐ Handles client disconnection
  ☐ Errors reported in stream
  ☐ Proper backpressure handling

☐ Performance
  ☐ Chunk size reasonable (1-10KB)
  ☐ Memory usage constant (not growing)
  ☐ No blocking operations in stream

☐ Monitoring
  ☐ Connection timeouts logged
  ☐ Stream errors tracked
  ☐ Incomplete streams detected

Questions to Ask:
- "Why is streaming needed here?"
- "Is the user seeing value from progressive updates?"
- "What happens if the connection drops?"
```

---

## Checklist 7: Webhooks (Security)

**File patterns:** `api/*/webhook/route.ts`

```
BEFORE APPROVING:

☐ Signature Verification
  ☐ Signature header checked
  ☐ Signature validated before processing
  ☐ Using correct signing algorithm
  ☐ No logic executed if signature invalid

☐ Authentication
  ☐ Webhook endpoint requires no auth: false
  ☐ Signature provides authentication
  ☐ Request body validated

☐ Idempotency
  ☐ Handler is idempotent
  ☐ Can handle duplicate webhooks
  ☐ Idempotency key checked if applicable

☐ Error Handling
  ☐ Errors don't expose internal details
  ☐ Invalid webhooks logged for investigation
  ☐ Processing failures retried appropriately
  ☐ Timeout handling included

☐ Security
  ☐ Webhook secret stored securely
  ☐ Not logged or exposed
  ☐ Rotated periodically
  ☐ TLS/HTTPS enforced

Questions to Ask:
- "How is the webhook provider authenticated?"
- "What if the same webhook arrives twice?"
- "Could someone forge a webhook?"
```

---

## Checklist 8: Constants & Configuration (Maintainability)

**File patterns:** `*.ts` files with `const X = value`

```
BEFORE APPROVING:

☐ Centralization
  ☐ Constant not repeated elsewhere
  ☐ Imported, not redefined locally
  ☐ Exported from constants file
  ☐ Clear documentation of purpose

☐ Naming
  ☐ Uses SCREAMING_SNAKE_CASE
  ☐ Name clearly describes what it is
  ☐ Obvious where it's used
  ☐ Units included (e.g., _MS for milliseconds)

☐ Organization
  ☐ Grouped with related constants
  ☐ Logical file structure
  ☐ Comments explain trade-offs

☐ Configurability
  ☐ Environment-specific values use env vars
  ☐ Feature flags in config
  ☐ Easy to change without editing code

☐ Documentation
  ☐ Comment explains why (not just what)
  ☐ Units specified for time values
  ☐ Default value documented
  ☐ Links to decision doc if complex

Questions to Ask:
- "Is this value defined elsewhere already?"
- "Will we need to change this in different environments?"
- "Is this value clear 6 months from now?"
```

---

## Checklist 9: TypeScript Type Safety

**File patterns:** Any `.ts` or `.tsx` file

```
BEFORE APPROVING:

☐ Avoid Escape Hatches
  ☐ No `any` types
  ☐ No `as unknown as T` patterns
  ☐ No `!` non-null assertions (unless justified)
  ☐ No `ts-ignore` comments

☐ Type Correctness
  ☐ All parameters typed
  ☐ Return types specified
  ☐ Generics properly constrained
  ☐ No loose unions (prefer specific types)

☐ Null/Undefined Handling
  ☐ Null/undefined cases handled
  ☐ Not assuming required values
  ☐ Optional chaining used where appropriate
  ☐ Nullish coalescing for defaults

☐ Runtime Validation
  ☐ Zod for untrusted input
  ☐ Type guards for type narrowing
  ☐ Database queries return correct types

Questions to Ask:
- "Would TypeScript strict mode catch this?"
- "Is the type specific enough to catch bugs?"
- "Do we trust this data or should we validate?"
```

---

## Checklist 10: Testing Code & Error Cases

**File patterns:** Test files, integration tests

```
BEFORE APPROVING:

☐ Happy Path
  ☐ Main functionality tested
  ☐ Expected behavior verified
  ☐ Return values validated

☐ Error Cases
  ☐ Invalid input rejected
  ☐ Authorization failures caught
  ☐ Rate limits enforced
  ☐ Network failures handled

☐ Edge Cases
  ☐ Empty inputs
  ☐ Boundary values
  ☐ Concurrent operations
  ☐ Null/undefined

☐ Test Quality
  ☐ Descriptive test names
  ☐ Clear assertions
  ☐ Proper test isolation (setup/teardown)
  ☐ Not testing implementation details

Questions to Ask:
- "What if this operation fails?"
- "What are the boundary conditions?"
- "Could this race with other operations?"
```

---

## Review Priority Guide

When you have limited time, check these in order:

1. **MUST CHECK** (Critical Security/Data Loss):
   - Authorization (Checklist 1)
   - Input Validation (Checklist 3)
   - Database Constraints (Checklist 5)

2. **SHOULD CHECK** (Important but not critical):
   - Rate Limiting (Checklist 2)
   - Type Safety (Checklist 9)
   - Testing (Checklist 10)

3. **NICE TO CHECK** (Quality of life):
   - Performance Optimization (Checklists 4, 6)
   - Code Organization (Checklists 8)
   - Configuration (Checklist 8)

---

## Common Red Flags

🚩 **STOP AND QUESTION:**

- `// TODO: Add auth check` → Missing security
- `as unknown as` → Bypassing type safety
- `// Hardcoded for now` → Technical debt
- No error handling → Production risk
- Unused imports → Code smell
- Console.log → Debug code left in
- Magic numbers → Maintainability issue
- No tests → Confidence issue
- Database query without index → Performance risk
- Duplicated constant → Already exists elsewhere

---

## Approval Template

When approving, you can use this summary:

```markdown
## Code Review Summary

✅ **Authorization**: Verified with verifyResourceOwnership()
✅ **Input Validation**: All inputs validated with Zod schema
✅ **Rate Limiting**: Implemented with appropriate limits
✅ **Performance**: No expensive computations without memoization
✅ **Data Integrity**: Foreign keys have CASCADE delete
⚠️ **Testing**: Add tests for error case X
✅ **Type Safety**: Full TypeScript coverage

Approved with one minor request above.
```

