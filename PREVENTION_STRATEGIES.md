# Sparlo V2 Code Review Fixes: Prevention Strategies & Best Practices

This document provides comprehensive prevention strategies, checklists, and automated checks to prevent the 9 categories of issues identified in the Sparlo V2 code review.

## 1. SECURITY - Webhook Signature Verification

### Issue Summary
Missing webhook signature verification allows attackers to forge webhook events, potentially triggering unauthorized actions.

**Status in Codebase**: ✅ FIXED
- File: `/apps/web/app/api/db/webhook/route.ts` (lines 14-18)
- The webhook handler validates the X-Supabase-Event-Signature header

---

## 2. SECURITY - Missing Authorization Checks on Server Actions

### Issue Summary
Server actions lack explicit authorization checks, relying solely on implicit RLS. Attack vectors include:
- Cross-account access via modified client-side parameters
- Race conditions during permission verification
- Missing defense-in-depth validation

**Status in Codebase**: ✅ FIXED
- File: `/apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts` (lines 72-92)
- All mutations include `verifyReportOwnership()` function before operations

### Prevention Checklist for Future Development

**Every Server Action Must:**
- [ ] Include explicit authorization check before data mutation
- [ ] Verify user owns the resource being modified
- [ ] Check resource belongs to correct account/workspace
- [ ] Log authorization failures for audit trail
- [ ] Use consistent authorization patterns across app

**Code Pattern to Follow:**
```typescript
export const updateResource = enhanceAction(
  async (data, user) => {
    // ✅ Step 1: Verify ownership first (defense-in-depth)
    const resource = await verifyResourceOwnership(data.id, user.id);

    // ✅ Step 2: Verify resource state is valid for operation
    if (resource.status !== 'editable') {
      throw new Error('Cannot edit resource in this state');
    }

    // ✅ Step 3: Perform mutation
    const updated = await updateResourceInDb(data);

    return { success: true, resource: updated };
  },
  {
    schema: UpdateResourceSchema,
    auth: true, // Always require authentication
  },
);
```

### Code Review Checklist Items

When reviewing server actions, verify:

1. **Authentication**
   - [ ] `auth: true` is set in enhanceAction options
   - [ ] User parameter is accessed and used
   - [ ] No fallback to default/guest user

2. **Authorization**
   - [ ] Explicit ownership verification exists
   - [ ] Resource belongs to correct account/team
   - [ ] Multi-tenant isolation is enforced
   - [ ] No `as unknown as` type coercions in ownership checks

3. **Input Validation**
   - [ ] Zod schema provided for all inputs
   - [ ] UUID validation for resource IDs
   - [ ] String length limits set
   - [ ] Enum validation for status fields

4. **Consistency**
   - [ ] Uses same verification function as other actions
   - [ ] Same error messages as other actions
   - [ ] Same logging/monitoring as other actions

### Automated Checks (ESLint Rules)

**Create custom ESLint rule: `require-server-action-auth`**

```javascript
// tooling/eslint/rules/require-server-action-auth.js
module.exports = {
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.name === 'enhanceAction') {
          const options = node.arguments[1];
          if (!options || options.type !== 'ObjectExpression') {
            context.report({
              node,
              message: 'enhanceAction must have second argument with auth options',
            });
            return;
          }

          const authProp = options.properties.find(
            p => p.key.name === 'auth'
          );

          if (!authProp || authProp.value.value !== true) {
            context.report({
              node,
              message: 'enhanceAction must have { auth: true }',
            });
          }
        }
      },
    };
  },
};
```

**Add to ESLint config:**
```javascript
// tooling/eslint/base.js - in rules object
'custom/require-server-action-auth': 'error',
```

### Automated Checks (TypeScript/Zod)

**Create shared validation utilities:**

```typescript
// packages/utils/src/validation.ts
import { z } from 'zod';

// Reusable UUID validation
export const ResourceIdSchema = z.string().uuid('Must be valid UUID');

// Reusable owner verification
export async function verifyResourceOwnership<T extends { account_id: string }>(
  table: string,
  resourceId: string,
  userId: string,
  client: SupabaseClient,
): Promise<T> {
  const { data, error } = await client
    .from(table)
    .select('*')
    .eq('id', resourceId)
    .eq('account_id', userId)
    .single();

  if (error || !data) {
    throw new UnauthorizedError(
      `Resource not found or you don't have permission to access it`
    );
  }

  return data as T;
}

// Reusable error class for auth failures
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
```

### Best Practices Guidance

#### 1. Defense-in-Depth: Never Rely on RLS Alone

**Why**: RLS is database-level protection, but bugs in client code can bypass it.

```typescript
// ❌ DON'T: Rely only on RLS
export const updateReport = enhanceAction(
  async (data, user) => {
    const { data: report } = await client
      .from('sparlo_reports')
      .update(data)
      .eq('id', data.id); // RLS checks, but no explicit app-level verification
  },
);

// ✅ DO: Verify explicitly first
export const updateReport = enhanceAction(
  async (data, user) => {
    // Explicit check before mutation
    const report = await verifyReportOwnership(data.id, user.id);

    const { data: updated } = await client
      .from('sparlo_reports')
      .update(data)
      .eq('id', data.id);
  },
);
```

#### 2. Consistent Authorization Patterns

Use the same verification function everywhere:

```typescript
// ✅ Good: Centralized verification
async function verifyReportOwnership(reportId: string, userId: string) {
  const client = getSupabaseServerClient();
  const { data: report, error } = await client
    .from('sparlo_reports')
    .select('id, account_id')
    .eq('id', reportId)
    .eq('account_id', userId)
    .single();

  if (error || !report) {
    throw new UnauthorizedError('Report not found or no permission');
  }

  return report;
}

// Use in all actions
export const updateReport = enhanceAction(async (data, user) => {
  await verifyReportOwnership(data.id, user.id); // Consistent check
  // ... rest of logic
});

export const deleteReport = enhanceAction(async (data, user) => {
  await verifyReportOwnership(data.id, user.id); // Same check
  // ... rest of logic
});
```

#### 3. Audit Trail for Authorization Failures

Log failed authorization attempts for security monitoring:

```typescript
import { getLogger } from '@kit/shared/logger';

async function verifyReportOwnership(reportId: string, userId: string) {
  const client = getSupabaseServerClient();
  const logger = await getLogger();

  const { data: report, error } = await client
    .from('sparlo_reports')
    .select('id, account_id')
    .eq('id', reportId)
    .single();

  if (error || report?.account_id !== userId) {
    // Log failed access attempt
    logger.warn({
      event: 'authorization_failed',
      resource: 'sparlo_report',
      resourceId: reportId,
      userId,
      timestamp: new Date().toISOString(),
    });

    throw new UnauthorizedError('Report not found or no permission');
  }

  return report;
}
```

---

## 3. SECURITY/PERFORMANCE - Rate Limiting on Expensive Operations

### Issue Summary
Missing rate limiting on expensive operations (report generation, API calls) allows:
- Resource exhaustion
- DoS attacks
- Excessive API costs

**Status in Codebase**: ✅ FIXED
- File: `/apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts` (lines 274-315)
- Rate limiting checks implemented in `startReportGeneration` action

### Prevention Checklist for Future Development

**For Every Expensive Operation:**
- [ ] Define rate limit window (e.g., 5 minutes)
- [ ] Set maximum requests per window
- [ ] Implement daily/hourly limits if needed
- [ ] Return clear error message with wait time
- [ ] Monitor actual usage to tune limits
- [ ] Log rate limit hits for analytics

**Where to Add Rate Limiting:**
- [ ] Report generation (expensive LLM calls)
- [ ] Chat messages (streaming compute)
- [ ] API endpoints with external calls
- [ ] Bulk operations (exports, imports)
- [ ] File uploads (storage/processing)

### Code Review Checklist Items

When reviewing operations with rate limiting:

1. **Limit Configuration**
   - [ ] Window size reasonable for operation cost
   - [ ] Counts actually prevent resource exhaustion
   - [ ] Limits scale with plan/tier if applicable
   - [ ] Hard limits prevent abuse (daily caps)

2. **Implementation**
   - [ ] Check performed before expensive operation
   - [ ] Query efficient (uses count with head: true)
   - [ ] Timestamp comparison correct (gte, lte, etc.)
   - [ ] Check runs within transaction if possible

3. **Error Handling**
   - [ ] Error message tells user when limit resets
   - [ ] No data mutation if rate limit hit
   - [ ] Clear distinction from other errors

4. **Monitoring**
   - [ ] Rate limit hits logged with user ID
   - [ ] Analytics tracked for business insights
   - [ ] Alerts if abuse detected

### Automated Checks (Tests)

**Create test suite for rate limiting:**

```typescript
// apps/web/app/home/(user)/_lib/__tests__/rate-limiting.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { startReportGeneration } from '../server/sparlo-reports-server-actions';

describe('Rate Limiting - startReportGeneration', () => {
  const mockUser = { id: 'test-user-id' };
  const validInput = { designChallenge: 'A'.repeat(50) };

  beforeEach(async () => {
    // Clean up test data
    await cleanupTestReports(mockUser.id);
  });

  it('allows first report creation', async () => {
    const result = await startReportGeneration(validInput, mockUser);
    expect(result.success).toBe(true);
  });

  it('blocks second report within 5 minute window', async () => {
    await startReportGeneration(validInput, mockUser);

    const result = await startReportGeneration(validInput, mockUser);
    expect(result).toEqual({
      success: false,
      error: 'Rate limit exceeded. Please wait 5 minutes between reports.',
    });
  });

  it('allows report after 5 minute window', async () => {
    await startReportGeneration(validInput, mockUser);

    // Mock time advancement
    vi.useFakeTimers();
    vi.advanceTimersByTime(5 * 60 * 1000 + 1000);

    const result = await startReportGeneration(validInput, mockUser);
    expect(result.success).toBe(true);

    vi.useRealTimers();
  });

  it('blocks after daily limit reached', async () => {
    // Create 10 reports with time gaps
    for (let i = 0; i < 10; i++) {
      await startReportGeneration(validInput, mockUser);
      vi.advanceTimersByTime(6 * 60 * 1000); // 6 minutes apart
    }

    const result = await startReportGeneration(validInput, mockUser);
    expect(result).toEqual({
      success: false,
      error: 'Daily limit reached. You can create up to 10 reports per day.',
    });
  });
});
```

### Best Practices Guidance

#### 1. Tiered Rate Limiting

Adjust limits based on subscription plan:

```typescript
// packages/utils/src/rate-limits.ts
type PricingPlan = 'free' | 'pro' | 'enterprise';

export const RATE_LIMITS: Record<PricingPlan, RateLimitConfig> = {
  free: {
    reportsPerDay: 3,
    reportsPerHour: 1,
    chatMessagesPerDay: 20,
  },
  pro: {
    reportsPerDay: 50,
    reportsPerHour: 10,
    chatMessagesPerDay: 500,
  },
  enterprise: {
    reportsPerDay: 1000,
    reportsPerHour: 100,
    chatMessagesPerDay: 10000,
  },
};

// In server action
export const startReportGeneration = enhanceAction(
  async (data, user) => {
    const userPlan = await getUserPlanTier(user.id);
    const limits = RATE_LIMITS[userPlan];

    // Check rate limits
    const recentCount = await getReportCountInWindow(user.id, 'hour');
    if (recentCount >= limits.reportsPerHour) {
      throw new RateLimitError(
        `Hourly limit (${limits.reportsPerHour}) reached`
      );
    }

    // ... rest of logic
  },
  { auth: true, schema: StartReportSchema }
);
```

#### 2. Exponential Backoff for Client Retries

Guide clients when to retry:

```typescript
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterSeconds: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// In server action
if (recentCount >= limits.reportsPerHour) {
  const nextAvailable = Math.ceil(limits.reportsPerHour / recentCount);
  throw new RateLimitError(
    `Rate limited. Try again in ${nextAvailable} minutes.`,
    nextAvailable * 60
  );
}

// Client-side retry logic
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof RateLimitError) {
        const delay = error.retryAfterSeconds * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

#### 3. Monitor Rate Limit Usage

Track metrics for business intelligence:

```typescript
// packages/monitoring/src/rate-limits.ts
export async function recordRateLimitCheck(
  userId: string,
  operation: string,
  allowed: boolean,
  remainingQuota?: number
) {
  const metrics = await getMetricsService();

  metrics.increment('rate_limit.check', {
    operation,
    allowed: allowed ? 'true' : 'false',
    remainingQuota: remainingQuota?.toString(),
  });

  if (!allowed) {
    logger.warn({
      event: 'rate_limit_exceeded',
      userId,
      operation,
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## 4. SECURITY - Input Length Validation

### Issue Summary
Missing input length validation allows:
- Buffer overflow attacks
- Database field overflows
- Performance degradation from large payloads

**Status in Codebase**: ✅ FIXED
- File: `/apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`
- Lines 30-35: ChatHistoryMessageSchema with max(10000)
- Line 33: Content limited to prevent DoS
- Line 270: designChallenge max 10,000 characters
- Line 385: answer max 5,000 characters

### Prevention Checklist for Future Development

**For Every String Input:**
- [ ] Set reasonable `.min()` length if required
- [ ] Set `.max()` length limit in schema
- [ ] Length limit matches database column
- [ ] Length limit prevents DoS attacks
- [ ] Consider performance impact of max length

**Recommended Max Lengths:**
- Text fields (names, titles): 200 characters
- User input (messages, answers): 5,000-10,000 characters
- Rich content (reports, documents): 50,000-100,000 characters
- Email addresses: 254 characters (RFC standard)
- URLs: 2,048 characters
- Phone numbers: 20 characters

### Code Review Checklist Items

When reviewing input validation:

1. **Schema Completeness**
   - [ ] All string fields have .max()
   - [ ] All number fields have .min() and .max()
   - [ ] Enum fields validate against fixed list
   - [ ] Array fields have .max() length

2. **Realistic Limits**
   - [ ] Limit matches field purpose
   - [ ] Not overly restrictive
   - [ ] Prevents database overflow
   - [ ] Prevents performance issues

3. **Error Messages**
   - [ ] Message tells user the limit
   - [ ] User can see remaining characters
   - [ ] Clear validation feedback

### Automated Checks (Zod Schema Enforcement)

**Create ESLint rule: `require-zod-max-length`**

```javascript
// tooling/eslint/rules/require-zod-max-length.js
module.exports = {
  create(context) {
    return {
      CallExpression(node) {
        // Check for z.string() calls
        if (
          node.callee.object?.name === 'z' &&
          node.callee.property?.name === 'string'
        ) {
          const parent = node.parent;

          // Check if it's part of a chain that includes .max()
          let hasMax = false;
          let current = parent;

          while (current?.type === 'CallExpression') {
            if (current.callee?.property?.name === 'max') {
              hasMax = true;
              break;
            }
            current = current.parent;
          }

          if (!hasMax) {
            context.report({
              node,
              message: 'String fields must have .max() limit in schema',
              fix(fixer) {
                return fixer.insertTextAfter(node, ".max(1000) // Set appropriate limit");
              },
            });
          }
        }
      },
    };
  },
};
```

### Best Practices Guidance

#### 1. Schema-First Validation

Define limits in Zod schema, not scattered in code:

```typescript
// ✅ Good: All validation in schema
const UserSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters'),
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email too long'),
  bio: z.string()
    .max(500, 'Bio must be under 500 characters')
    .optional(),
});

export const updateUser = enhanceAction(
  async (data, user) => {
    // No need to validate lengths again - schema handles it
    const validated = UserSchema.parse(data);
    // ... update user
  },
  { schema: UserSchema, auth: true }
);

// ❌ Bad: Validation scattered in multiple places
export const updateUser = enhanceAction(
  async (data, user) => {
    if (!data.name || data.name.length < 2) {
      throw new Error('Name too short');
    }
    if (data.name.length > 100) {
      throw new Error('Name too long');
    }
    if (data.email.length > 254) {
      throw new Error('Email too long');
    }
    // ... more checks
  },
  { auth: true }
);
```

#### 2. Progressive Length Limits

Use tighter limits for performance-critical fields:

```typescript
const ReportSchema = z.object({
  title: z.string()
    .min(10)
    .max(200), // Indexed field - keep short

  summary: z.string()
    .min(50)
    .max(5000), // Medium field

  fullReport: z.string()
    .min(100)
    .max(100000), // Large field

  sections: z.array(
    z.object({
      heading: z.string().max(200),
      content: z.string().max(10000),
    })
  ).max(50), // Limit number of sections
});
```

#### 3. Client-Side Feedback

Show users character counts in real-time:

```typescript
// apps/web/app/home/(user)/_components/input-with-limit.tsx
'use client';

interface InputWithLimitProps {
  maxLength: number;
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function InputWithLimit({
  maxLength,
  value,
  onChange,
  label,
}: InputWithLimitProps) {
  const remaining = maxLength - value.length;
  const isWarning = remaining < maxLength * 0.2; // < 20% remaining

  return (
    <div>
      <label>{label}</label>
      <textarea
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className={isWarning ? 'text-warning' : 'text-muted'}>
        {remaining}/{maxLength} characters remaining
      </div>
    </div>
  );
}
```

---

## 5. ARCHITECTURE - Fake Streaming Creating Unnecessary Complexity

### Issue Summary
Pseudo-streaming (buffering entire response before showing) adds complexity without UX benefit:
- Increases memory usage
- Adds unnecessary state management
- Makes debugging harder
- Same perceived latency to user

**Status in Codebase**: ✅ ARCHITECTURE IMPROVED
- Streaming is handled server-side
- Frontend receives real-time SSE events
- No fake buffering layer

### Prevention Checklist for Future Development

**Before Adding Streaming Features:**
- [ ] Determine if real streaming is needed
- [ ] Avoid fake streaming (buffer-then-show pattern)
- [ ] Use Server-Sent Events (SSE) for real-time updates
- [ ] Use WebSockets only if bidirectional needed
- [ ] Keep streaming logic server-side
- [ ] Minimize client-side streaming state

**When to Use Streaming:**
- User sees value in progressive updates (>5 seconds expected)
- Real-time collaboration needed
- Large data transfers (streaming saves memory)

**When NOT to Use Streaming:**
- Response comes in <2 seconds (just wait)
- Simple request-response pattern
- Client-side aggregation needed (defeats purpose)

### Code Review Checklist Items

When reviewing streaming implementations:

1. **Architecture**
   - [ ] Real streaming, not fake buffering
   - [ ] Server handles expensive computation
   - [ ] Client minimal processing per chunk
   - [ ] Graceful degradation if streaming fails

2. **Client Implementation**
   - [ ] Uses EventSource (SSE) or fetch streaming
   - [ ] Handles connection errors
   - [ ] Has timeout for stalled streams
   - [ ] Cleanup on component unmount

3. **Server Implementation**
   - [ ] Respects rate limits on streaming
   - [ ] Validates auth before streaming starts
   - [ ] Handles client disconnection gracefully
   - [ ] Proper error reporting in stream

4. **Performance**
   - [ ] Chunk size reasonable (1-10KB per chunk)
   - [ ] No unnecessary middleware in stream
   - [ ] Proper backpressure handling
   - [ ] Memory usage constant (not growing)

### Best Practices Guidance

#### 1. Prefer Server-Sent Events (SSE)

Simple, unidirectional streaming (most common use case):

```typescript
// Server-side: /apps/web/app/api/sparlo/chat/stream/route.ts
export const POST = enhanceRouteHandler(
  async ({ request, user }) => {
    const { conversationId, message } = await request.json();

    // Validate
    const conversation = await verifyConversationAccess(
      conversationId,
      user.id
    );

    // Stream response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const stream = await client.messages.stream({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            messages: [{ role: 'user', content: message }],
          });

          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta') {
              // Send each text chunk to client
              controller.enqueue(
                `data: ${JSON.stringify({
                  type: 'chunk',
                  content: chunk.delta.text,
                })}\n\n`
              );
            }
          }

          // Signal completion
          controller.enqueue('data: [DONE]\n\n');
          controller.close();
        } catch (error) {
          // Send error in stream
          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'error',
              message: error.message,
            })}\n\n`
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  },
  { auth: true }
);

// Client-side: apps/web/app/home/(user)/_lib/use-chat.ts
export function useStreamingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (message: string) => {
      setIsLoading(true);
      let fullResponse = '';

      try {
        const response = await fetch('/api/sparlo/chat/stream', {
          method: 'POST',
          body: JSON.stringify({
            conversationId: activeConversation.id,
            message,
          }),
        });

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream');

        // Read stream chunks
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'chunk') {
                fullResponse += data.content;
                // Update UI in real-time
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: fullResponse,
                  };
                  return updated;
                });
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversation.id]
  );

  return { messages, sendMessage, isLoading };
}
```

#### 2. Avoid Fake Streaming

Don't create complexity for no benefit:

```typescript
// ❌ DON'T: Fake streaming with artificial delays
async function fakeStream(content: string) {
  const chunks = content.split(' ');
  for (const chunk of chunks) {
    // Artificial delay to simulate streaming
    await new Promise(resolve => setTimeout(resolve, 100));
    setMessage(prev => prev + ' ' + chunk);
  }
}

// ✅ DO: Just show complete response
async function showResponse(content: string) {
  setMessage(content);
}

// ✅ DO: Use real streaming if response is large
async function realStream(prompt: string) {
  const response = await fetch('/api/stream', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });

  const reader = response.body.getReader();
  // Process chunks as they arrive
}
```

#### 3. Handle Streaming Disconnections

Always account for network failures:

```typescript
const STREAM_TIMEOUT = 30000; // 30 seconds
const CHUNK_TIMEOUT = 5000;   // 5 seconds between chunks

async function readStreamWithTimeout(reader: ReadableStreamDefaultReader) {
  const decoder = new TextDecoder();
  let lastChunkTime = Date.now();

  while (true) {
    const now = Date.now();

    // Check overall timeout
    if (now - startTime > STREAM_TIMEOUT) {
      throw new Error('Stream timed out after 30 seconds');
    }

    // Check chunk timeout (no data for 5 seconds)
    if (now - lastChunkTime > CHUNK_TIMEOUT) {
      throw new Error('No data received for 5 seconds, connection likely lost');
    }

    const { done, value } = await reader.read();
    if (done) break;

    lastChunkTime = Date.now();
    const text = decoder.decode(value);
    // Process chunk
  }
}
```

---

## 6. PERFORMANCE - Missing useMemo on Expensive Computations

### Issue Summary
Expensive computations (table of contents generation, transformations) re-run on every render, causing performance degradation.

**Status in Codebase**: ✅ MOSTLY FIXED
- useMemo used in multiple components
- Performance-critical computations memoized

### Prevention Checklist for Future Development

**Use useMemo When:**
- [ ] Computation is expensive (DOM queries, data transformation)
- [ ] Dependencies don't change frequently
- [ ] Computation result is passed to other components
- [ ] Component renders frequently (lists, animations)

**Don't Use useMemo When:**
- [ ] Computation is trivial (simple arithmetic)
- [ ] Dependencies change on every render (defeats purpose)
- [ ] Memory overhead of caching > cost of recomputation

**Common Cases for Memoization:**
- [ ] Parsing/transforming large datasets
- [ ] Regex matching on large strings
- [ ] Derived state calculations
- [ ] Array/object filtering and sorting
- [ ] Component lists with keys

### Code Review Checklist Items

When reviewing performance optimizations:

1. **Necessity**
   - [ ] Can justify with performance metrics
   - [ ] Computation actually expensive
   - [ ] Not memoizing trivial work

2. **Dependencies**
   - [ ] Dependency array complete and correct
   - [ ] No missing dependencies
   - [ ] No unnecessary dependencies
   - [ ] Dependencies are stable (not object literals)

3. **Correctness**
   - [ ] Memoized value is immutable
   - [ ] No side effects in compute function
   - [ ] Handles null/undefined correctly

### Automated Checks (ESLint)

Use existing rules and configure them:

```javascript
// .eslintrc.json
{
  "rules": {
    "react/jsx-no-constructed-context-value": "warn",
    "react/jsx-no-comment-textnodes": "warn"
  }
}
```

**Create custom rule for memoization hygiene:**

```javascript
// tooling/eslint/rules/usememo-dependencies.js
module.exports = {
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.name !== 'useMemo') return;

        const args = node.arguments;
        const deps = args[1];

        if (!deps) {
          context.report({
            node,
            message: 'useMemo must have explicit dependency array',
          });
        }

        if (deps.type === 'ArrayExpression') {
          // Check for object/array literals in dependencies
          const hasDynamicDeps = deps.elements.some(
            (el) =>
              el?.type === 'ObjectExpression' ||
              el?.type === 'ArrayExpression'
          );

          if (hasDynamicDeps) {
            context.report({
              node: deps,
              message:
                'useMemo dependencies should not contain object/array literals',
              fix(fixer) {
                return fixer.insertTextBefore(
                  deps,
                  '// Extract object/array outside or use stable reference\n// '
                );
              },
            });
          }
        }
      },
    };
  },
};
```

### Best Practices Guidance

#### 1. Memoize Expensive Transformations

Table of contents generation example:

```typescript
// ❌ DON'T: Regenerate on every render
function ReportView({ markdown }: Props) {
  // This runs on every parent render!
  const toc = useMemo(() => [], []);
  let match;
  const headingRegex = /^##\s+(.+)$/gm;
  while ((match = headingRegex.exec(markdown)) !== null) {
    toc.push({
      id: match[1].toLowerCase().replace(/\s+/g, '-'),
      title: match[1],
    });
  }

  return <div>{renderToc(toc)}</div>;
}

// ✅ DO: Memoize with correct dependencies
const HEADING_REGEX = /^##\s+(.+)$/gm;

function ReportView({ markdown }: Props) {
  const toc = useMemo(() => {
    if (!markdown) return [];

    const items = [];
    let match;
    HEADING_REGEX.lastIndex = 0;

    while ((match = HEADING_REGEX.exec(markdown)) !== null) {
      items.push({
        id: match[1].toLowerCase().replace(/\s+/g, '-'),
        title: match[1],
      });
    }

    return items;
  }, [markdown]);

  return <div>{renderToc(toc)}</div>;
}
```

#### 2. Stable Dependencies Are Critical

Object/array literals break memoization:

```typescript
// ❌ DON'T: New object on every render
function UserList({ users }: Props) {
  const sortedUsers = useMemo(
    () => users.sort((a, b) => a.name.localeCompare(b.name)),
    [users, { order: 'asc' }] // ← This object is new every render!
  );
}

// ✅ DO: Extract dependencies as props or constants
const DEFAULT_SORT_ORDER = { order: 'asc' };

function UserList({ users }: Props) {
  const sortedUsers = useMemo(
    () =>
      users.sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    [users]
  );
}

// ✅ DO: Use constants for config
const SORT_CONFIG = { order: 'asc' } as const;

function UserList({ users }: Props) {
  const sortedUsers = useMemo(
    () =>
      users.sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    [users]
  );
}
```

#### 3. Measure Before Optimizing

Use React DevTools Profiler:

```typescript
// Wrap component in Profiler to measure
import { Profiler } from 'react';

function App() {
  const onRender = (id, phase, actualDuration) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`);
  };

  return (
    <Profiler id="ReportView" onRender={onRender}>
      <ReportView />
    </Profiler>
  );
}

// Only add useMemo if you see:
// 1. Component renders frequently
// 2. Render time is significant (>5ms)
// 3. Same computation repeats
```

---

## 7. DATA INTEGRITY - Missing CASCADE Constraints

### Issue Summary
Foreign keys without ON DELETE CASCADE create orphan records when parents are deleted:
- Accumulates unused data
- Violates referential integrity
- Can break features expecting to delete parents

**Status in Codebase**: ✅ FIXED
- File: `/apps/web/supabase/migrations/20251217000000_sparlo_security_fixes.sql`
- Lines 9-13: sparlo_reports.created_by has CASCADE delete

### Prevention Checklist for Future Development

**Every Foreign Key Must:**
- [ ] Define ON DELETE behavior explicitly
- [ ] Use CASCADE for parent-child relationships
- [ ] Use SET NULL for optional relationships
- [ ] Use RESTRICT for shared references
- [ ] Document the choice in comment

**Decision Matrix:**

| Relationship | Delete Parent | Use |
|---|---|---|
| User owns Reports | Delete reports | CASCADE |
| Team has Members | Retain members | RESTRICT |
| Post has Comments | Delete comments | CASCADE |
| Article references Author | Keep articles, null author | SET NULL |
| Account references Plan | Keep account, default plan | SET DEFAULT |

### Code Review Checklist Items

When reviewing database schema changes:

1. **Foreign Key Completeness**
   - [ ] All foreign keys have ON DELETE clause
   - [ ] Choice matches business logic
   - [ ] Not using default (which is RESTRICT)

2. **Referential Integrity**
   - [ ] No circular dependencies
   - [ ] Delete order makes sense
   - [ ] No surprise data loss

3. **Testing**
   - [ ] Test deleting parent records
   - [ ] Verify children handled correctly
   - [ ] Test edge cases (concurrent deletes)

### Automated Checks (SQL Linting)

**Create migration validation script:**

```bash
#!/bin/bash
# scripts/validate-migrations.sh

MIGRATION_DIR="apps/web/supabase/migrations"

for migration in $MIGRATION_DIR/*.sql; do
  # Check for foreign keys without ON DELETE
  if grep -q "FOREIGN KEY" "$migration"; then
    if ! grep -q "ON DELETE" "$migration"; then
      echo "ERROR: Foreign key in $migration missing ON DELETE clause"
      exit 1
    fi
  fi

  # Check for RESTRICT usage (often wrong choice)
  if grep -q "ON DELETE RESTRICT" "$migration"; then
    echo "WARNING: Found ON DELETE RESTRICT in $migration - verify intentional"
  fi
done

echo "All foreign keys have ON DELETE clauses"
```

Add to pre-commit hook:

```bash
# .git/hooks/pre-commit
bash scripts/validate-migrations.sh || exit 1
```

### Best Practices Guidance

#### 1. Use CASCADE for Owned Relationships

User owns their data - delete with them:

```sql
-- ✅ Good: CASCADE for owned resources
CREATE TABLE sparlo_reports (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ↑ Both relationships are ownership - cascade delete
);

-- ✅ Good: SET NULL for optional references
CREATE TABLE articles (
  id UUID PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- ↑ Article can exist without author
);

-- ✅ Good: RESTRICT for shared resources
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  -- ↑ Can't delete team while members exist
);
```

#### 2. Document Foreign Key Decisions

Add comments explaining the choice:

```sql
-- Create reports table with ownership relationships
CREATE TABLE sparlo_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  created_by UUID NOT NULL,

  -- Users own their reports - delete reports when user deleted
  CONSTRAINT sparlo_reports_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Reports belong to account - cascade delete for account cleanup
  CONSTRAINT sparlo_reports_account_id_fkey
    FOREIGN KEY (account_id)
    REFERENCES accounts(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

COMMENT ON CONSTRAINT sparlo_reports_created_by_fkey ON sparlo_reports IS
'Cascade delete: Reports are owned by users. When user is deleted, clean up their reports.';

COMMENT ON CONSTRAINT sparlo_reports_account_id_fkey ON sparlo_reports IS
'Cascade delete: Reports belong to accounts. When account is deleted, clean up associated reports.';
```

#### 3. Test Cascade Behavior

Verify deletes work as expected:

```typescript
// apps/web/supabase/__tests__/cascade-delete.test.sql
BEGIN;

-- Create test data
INSERT INTO accounts (id, name) VALUES ('test-account-id', 'Test Account');
INSERT INTO auth.users (id, email) VALUES ('test-user-id', 'test@example.com');
INSERT INTO sparlo_reports (id, account_id, created_by)
VALUES ('report-1', 'test-account-id', 'test-user-id');

-- Verify report exists
SELECT COUNT(*) as count FROM sparlo_reports WHERE id = 'report-1';
-- Should return 1

-- Delete user (should cascade to reports)
DELETE FROM auth.users WHERE id = 'test-user-id';

-- Verify report was deleted
SELECT COUNT(*) as count FROM sparlo_reports WHERE id = 'report-1';
-- Should return 0

ROLLBACK; -- Clean up test
```

---

## 8. PERFORMANCE - Missing Composite Indexes

### Issue Summary
Missing composite indexes cause slow queries for common patterns:
- Filter + sort operations (SELECT WHERE ORDER BY)
- Multi-condition queries
- Rate limiting queries

**Status in Codebase**: ✅ FIXED
- File: `/apps/web/supabase/migrations/20251217000000_sparlo_security_fixes.sql`
- Lines 16-23: Composite indexes for common query patterns

### Prevention Checklist for Future Development

**For Every Frequently-Run Query:**
- [ ] Identify the WHERE and ORDER BY columns
- [ ] Create composite index matching query pattern
- [ ] Test query performance before/after
- [ ] Monitor slow query logs for missing indexes

**Common Query Patterns:**
- [ ] List user's resources: WHERE account_id = ? ORDER BY created_at DESC
- [ ] Filter and paginate: WHERE status = ? AND archived = ? ORDER BY created_at
- [ ] Rate limiting: COUNT(*) WHERE account_id = ? AND created_at >= ?
- [ ] Nested resources: WHERE parent_id = ? AND is_deleted = false

### Code Review Checklist Items

When reviewing database queries and indexes:

1. **Query Analysis**
   - [ ] All WHERE columns indexed
   - [ ] ORDER BY column in index
   - [ ] Filtering columns before sorting
   - [ ] No functions on indexed columns

2. **Index Quality**
   - [ ] Matches actual query patterns
   - [ ] Not too many indexes (slows writes)
   - [ ] Not unused indexes
   - [ ] Column order matches query specificity

3. **Testing**
   - [ ] EXPLAIN ANALYZE shows index usage
   - [ ] Query time reasonable
   - [ ] No index bloat monitoring

### Automated Checks (Query Analysis)

**Create helper to log slow queries:**

```typescript
// packages/database/src/slow-query-logger.ts
import { createClient } from '@supabase/supabase-js';

const SLOW_QUERY_THRESHOLD_MS = 1000;

export async function logSlowQueries(
  query: Promise<any>,
  queryName: string
) {
  const start = performance.now();
  const result = await query;
  const duration = performance.now() - start;

  if (duration > SLOW_QUERY_THRESHOLD_MS) {
    console.warn(
      `Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`
    );
    // In production, send to monitoring service
  }

  return result;
}

// Usage
export async function getUserReports(userId: string) {
  return logSlowQueries(
    client
      .from('sparlo_reports')
      .select('*')
      .eq('account_id', userId)
      .order('created_at', { ascending: false }),
    'getUserReports'
  );
}
```

### Best Practices Guidance

#### 1. Match Index to Query Pattern

Create indexes that match WHERE + ORDER BY:

```sql
-- Query pattern:
-- SELECT * FROM sparlo_reports
-- WHERE account_id = ? AND status = ? AND archived = ?
-- ORDER BY created_at DESC

-- ✅ Good: Composite index matching pattern
CREATE INDEX idx_sparlo_reports_account_status_archived
ON sparlo_reports(account_id, status, archived, created_at DESC);

-- ❌ Bad: Wrong column order
CREATE INDEX idx_sparlo_reports_wrong
ON sparlo_reports(status, account_id, archived, created_at DESC);
-- This won't help the query because it checks account_id first

-- ❌ Bad: Missing columns
CREATE INDEX idx_sparlo_reports_incomplete
ON sparlo_reports(account_id, created_at DESC);
-- This helps with filtering but still needs to scan status and archived
```

#### 2. Use EXPLAIN ANALYZE

Verify indexes are actually used:

```sql
-- Before index
EXPLAIN ANALYZE
SELECT * FROM sparlo_reports
WHERE account_id = 'user-123'
  AND status = 'complete'
  AND archived = false
ORDER BY created_at DESC;

-- Output before index:
-- Seq Scan on sparlo_reports  (cost=0.00..1234.00 rows=5000)
-- ↑ Sequential scan = slow, need index

-- After creating index:
CREATE INDEX idx_sparlo_reports_account_status_archived
ON sparlo_reports(account_id, status, archived, created_at DESC);

EXPLAIN ANALYZE
SELECT * FROM sparlo_reports
WHERE account_id = 'user-123'
  AND status = 'complete'
  AND archived = false
ORDER BY created_at DESC;

-- Output after index:
-- Index Scan using idx_sparlo_reports_account_status_archived
-- (cost=0.42..15.20 rows=10)
-- ↑ Index scan = fast!
```

#### 3. Consider Write Performance

Too many indexes slow down writes:

```typescript
// Index strategy for sparlo_reports
// Read-heavy: Need multiple indexes
// Write: ~10 inserts/deletes per second per user

// Essential indexes:
// 1. List user reports with filters
CREATE INDEX idx_sparlo_reports_account_status_archived
ON sparlo_reports(account_id, status, archived, created_at DESC);

// 2. Rate limiting (count recent)
CREATE INDEX idx_sparlo_reports_account_created
ON sparlo_reports(account_id, created_at DESC);

// Optional indexes (only if bottleneck):
// - By conversation_id (if frequently looking up by conversation)
// - By status (if filtering by status alone)

// But avoid:
// - Too many partial indexes
// - Indexes on low-cardinality columns (status, archived)
// - Redundant indexes
```

---

## 9. MAINTAINABILITY - Duplicated Constants Across Files

### Issue Summary
Constants defined in multiple files cause:
- Maintenance burden (update multiple places)
- Inconsistent values (bugs from sync failures)
- Difficult refactoring

**Status in Codebase**: ✅ MOSTLY ADDRESSED
- Centralized rate limit constants in server-actions
- Shared timeout constants in API routes

### Prevention Checklist for Future Development

**Before Adding a Constant:**
- [ ] Check if it exists elsewhere in codebase
- [ ] Define in single, shared location
- [ ] Export from central constants file
- [ ] Document what it's used for
- [ ] Consider if it should be configurable

**Constant Categories:**
- [ ] Magic numbers (timeouts, limits, buffer sizes)
- [ ] Configuration strings (API URLs, feature flags)
- [ ] Error messages (validation, business logic)
- [ ] UI strings (labels, validation messages)
- [ ] Regular expressions (validation patterns)

### Code Review Checklist Items

When reviewing constants and configuration:

1. **Centralization**
   - [ ] Constant not duplicated elsewhere
   - [ ] Imported, not redefined
   - [ ] Clear documentation of purpose
   - [ ] Exportable from config file

2. **Naming**
   - [ ] Name clearly describes purpose
   - [ ] Uses SCREAMING_SNAKE_CASE
   - [ ] Related constants grouped together
   - [ ] Obvious where it's used

3. **Maintainability**
   - [ ] Updated in one place affects all uses
   - [ ] No hardcoded values in code
   - [ ] Easy to find all usages
   - [ ] Documented with comments

### Automated Checks (ESLint Rule)

**Create rule to prevent magic numbers:**

```javascript
// tooling/eslint/rules/no-magic-numbers.js
module.exports = {
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== 'number') return;

        // Allow specific numbers
        const ALLOWED = [0, 1, -1, 100, 2, 10];
        if (ALLOWED.includes(node.value)) return;

        // Check if in const definition
        if (
          node.parent.type === 'VariableDeclarator' &&
          node.parent.id.name === node.parent.id.name.toUpperCase()
        ) {
          return; // Constant definition is OK
        }

        context.report({
          node,
          message: `Magic number ${node.value}. Extract to named constant.`,
          fix(fixer) {
            return fixer.replaceText(
              node,
              'CONSTANT_NAME' // User must define
            );
          },
        });
      },
    };
  },
};
```

### Best Practices Guidance

#### 1. Centralized Constants File

Create single source of truth:

```typescript
// packages/utils/src/constants/sparlo.ts
/**
 * SPARLO Configuration Constants
 * Central location for all magic numbers and configuration values
 */

// Report Generation Timeouts
export const REPORT_GENERATION_TIMEOUT_MS = 30_000; // 30 seconds
export const POLLING_INTERVAL_MS = 3_000;           // 3 seconds
export const MAX_POLLING_INTERVAL_MS = 30_000;      // 30 seconds max
export const POLL_TOTAL_TIMEOUT_MS = 600_000;       // 10 minutes

// Rate Limiting
export const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;  // 5 minutes
export const MAX_REPORTS_PER_WINDOW = 1;
export const MAX_REPORTS_PER_DAY = 10;

// Input Validation
export const MIN_DESIGN_CHALLENGE_LENGTH = 50;
export const MAX_DESIGN_CHALLENGE_LENGTH = 10_000;
export const MAX_CLARIFICATION_LENGTH = 5_000;
export const MAX_CHAT_MESSAGE_LENGTH = 10_000;

// UI Constants
export const CHAT_DRAWER_MIN_WIDTH = 320;
export const CHAT_DRAWER_MAX_WIDTH = 500;

// Error Messages (Localizable)
export const ERROR_MESSAGES = {
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please wait 5 minutes.',
  REPORT_NOT_FOUND: 'Report not found or you do not have permission.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
} as const;

// Export as object for easy organization
export const SPARLO_CONFIG = {
  timeouts: {
    reportGeneration: REPORT_GENERATION_TIMEOUT_MS,
    polling: POLLING_INTERVAL_MS,
    maxPolling: MAX_POLLING_INTERVAL_MS,
    pollTotal: POLL_TOTAL_TIMEOUT_MS,
  },
  rateLimits: {
    windowMs: RATE_LIMIT_WINDOW_MS,
    maxReportsPerWindow: MAX_REPORTS_PER_WINDOW,
    maxReportsPerDay: MAX_REPORTS_PER_DAY,
  },
  validation: {
    designChallenge: {
      min: MIN_DESIGN_CHALLENGE_LENGTH,
      max: MAX_DESIGN_CHALLENGE_LENGTH,
    },
    clarification: {
      max: MAX_CLARIFICATION_LENGTH,
    },
  },
} as const;
```

Usage:

```typescript
// ✅ Good: Import from central location
import { SPARLO_CONFIG, ERROR_MESSAGES } from '@kit/utils/constants/sparlo';

export const startReportGeneration = enhanceAction(
  async (data, user) => {
    // Use imported constants
    const recentCount = await getReportCountInWindow(user.id, SPARLO_CONFIG.rateLimits.windowMs);

    if (recentCount >= SPARLO_CONFIG.rateLimits.maxReportsPerWindow) {
      throw new Error(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
    }

    // ... rest
  },
  { auth: true, schema: StartReportSchema }
);

// ❌ Bad: Hardcoded values repeated
const recentCount = await getReportCountInWindow(user.id, 5 * 60 * 1000);
if (recentCount >= 1) {
  throw new Error('Rate limit exceeded. Please wait 5 minutes.');
}
```

#### 2. Environment Variables for Deployable Config

Move deployment-specific values to environment:

```bash
# .env.local (development)
NEXT_PUBLIC_CHAT_TIMEOUT_MS=30000
NEXT_PUBLIC_MAX_REPORTS_PER_DAY=10

# .env.production
NEXT_PUBLIC_CHAT_TIMEOUT_MS=60000      # Longer for production
NEXT_PUBLIC_MAX_REPORTS_PER_DAY=100    # Higher tier default
```

```typescript
// packages/utils/src/config/sparlo.ts
export const SPARLO_CONFIG = {
  chatTimeoutMs: parseInt(
    process.env.NEXT_PUBLIC_CHAT_TIMEOUT_MS ?? '30000',
    10
  ),
  maxReportsPerDay: parseInt(
    process.env.NEXT_PUBLIC_MAX_REPORTS_PER_DAY ?? '10',
    10
  ),
} as const;
```

#### 3. Constants Organization by Domain

Group related constants:

```typescript
// packages/utils/src/constants/index.ts
export * from './sparlo';          // Report generation
export * from './chat';            // Chat messaging
export * from './authentication';  // Auth timeouts
export * from './ui';              // UI dimensions

// Usage
import {
  REPORT_GENERATION_TIMEOUT_MS,
  CHAT_MESSAGE_TIMEOUT_MS,
  AUTH_SESSION_TIMEOUT_MS,
} from '@kit/utils/constants';
```

---

## Implementation Roadmap

### Phase 1: Documentation & Tooling (Week 1)
- [ ] Create centralized constants file (Section 9)
- [ ] Create shared validation utilities (Section 2)
- [ ] Configure ESLint rules (Sections 2, 6, 9)
- [ ] Create test templates for each area

### Phase 2: Prevention Rules (Week 2)
- [ ] Add ESLint rules to CI/CD
- [ ] Create migration validation script (Section 7)
- [ ] Set up slow query monitoring (Section 8)
- [ ] Document authorization patterns (Section 2)

### Phase 3: Code Review Improvement (Week 3)
- [ ] Create review checklists (GitHub issue template)
- [ ] Train team on prevention strategies
- [ ] Document common pitfalls
- [ ] Establish code review SLA

### Phase 4: Continuous Monitoring (Week 4)
- [ ] Enable rate limit monitoring (Section 3)
- [ ] Enable authorization failure logging (Section 2)
- [ ] Set up performance baselines (Section 6)
- [ ] Monthly review of metrics

---

## Summary Table

| Issue | Category | Status | Prevention Focus |
|-------|----------|--------|------------------|
| Webhook signature verification | Security | ✅ Fixed | Code review checklist, validation patterns |
| Missing authorization checks | Security | ✅ Fixed | Central verification function, testing |
| No rate limiting | Security/Performance | ✅ Fixed | Environment config, monitoring |
| Missing input validation | Security | ✅ Fixed | Zod schemas, ESLint rules |
| Fake streaming | Architecture | ✅ Fixed | Design review process, best practices |
| Missing useMemo | Performance | ✅ Mostly Fixed | React DevTools profiling, guidelines |
| Missing CASCADE constraints | Data Integrity | ✅ Fixed | Migration validation script, tests |
| Missing composite indexes | Performance | ✅ Fixed | EXPLAIN ANALYZE, slow query logging |
| Duplicated constants | Maintainability | ✅ Mostly Fixed | Centralized constants file, imports |

