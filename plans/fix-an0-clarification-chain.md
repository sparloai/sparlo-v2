# Fix AN0 Clarification Chain - Complete Solution

## Implementation Status: ✅ COMPLETED

**Date:** 2025-12-15

### Changes Made:

1. **`apps/web/app/home/(user)/_lib/types.ts`**
   - Changed `estimated_time_minutes: z.number().optional()` → `z.number().nullish()`
   - Changed `report: z.string().optional()` → `z.string().nullish()` (both ChatResponseSchema and StatusResponseSchema)
   - Replaced manual type interfaces with `z.infer<>` to eliminate type drift

2. **`apps/web/app/home/(user)/_lib/api.ts`**
   - Improved `validateResponse` to use `safeParse` for better error messages
   - Added detailed logging of validation failures with field-level errors

3. **`apps/web/app/home/(user)/_lib/use-sparlo.ts`**
   - Added try/catch to `handleClarificationResponse` for error handling

### Backend Review (sparlo-backend):
- Backend is working correctly - returns `null` for optional Pydantic fields as expected
- No backend changes needed

---

## Overview

The AN0 clarification flow is broken: when the backend asks for clarification and the user provides an answer, the frontend fails with Zod validation errors and gets stuck on a loading screen.

**Root Cause:** Backend returns `null` for optional fields (`estimated_time_minutes`, `report`), but frontend Zod schema expects `undefined` (via `.optional()`).

**Goal:** Fix the clarification chain to work flawlessly and futureproof it against similar issues.

## Problem Statement

### Current Bug Chain
1. User submits initial message → Backend runs AN0
2. AN0 needs clarification → Backend returns:
   ```json
   {
     "conversation_id": "...",
     "message": "What is your primary optimization target...",
     "status": "clarifying",
     "current_step": "AN0",
     "estimated_time_minutes": null,
     "report": null
   }
   ```
3. Frontend Zod validation fails because `z.number().optional()` accepts `number | undefined` but **NOT** `null`
4. Frontend throws `ApiError: Invalid response from server for chat`
5. UI gets stuck on loading screen

### Error Logs
```
[API] Invalid response structure for chat: ZodError: [
  {
    "code": "invalid_type",
    "expected": "number",
    "received": "null",
    "path": ["estimated_time_minutes"],
    "message": "Expected number, received null"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "null",
    "path": ["report"],
    "message": "Expected string, received null"
  }
]
```

## Technical Approach

### Phase 1: Fix the Immediate Bug (Critical)

#### 1.1 Update Frontend Zod Schemas

**File:** `apps/web/app/home/(user)/_lib/types.ts`

Change `.optional()` to `.nullish()` for fields that can be `null`:

```typescript
// types.ts (Lines 20-36)

export const ChatResponseSchema = z.object({
  conversation_id: z.string(),
  message: z.string(),
  status: ConversationStatusSchema,
  current_step: z.string().optional(),
  estimated_time_minutes: z.number().nullish(),  // Changed from .optional()
  report: z.string().nullish(),                   // Changed from .optional()
});

export const StatusResponseSchema = z.object({
  conversation_id: z.string(),
  status: ConversationStatusSchema,
  current_step: z.string().optional(),
  completed_steps: z.array(z.string()),
  message: z.string().optional(),
  report: z.string().nullish(),  // Changed from .optional()
});
```

**Why `.nullish()` over `.nullable()`?**
- `.nullable()` = `T | null` (field must be present)
- `.nullish()` = `T | null | undefined` (field can be missing or null)
- Backend may omit fields OR send null, so `.nullish()` handles both

#### 1.2 Add Validation Error Handling

**File:** `apps/web/app/home/(user)/_lib/api.ts`

Improve error handling in `validateResponse`:

```typescript
// api.ts (Lines 98-112)

function validateResponse<T>(
  data: unknown,
  schema: { parse: (data: unknown) => T; safeParse: (data: unknown) => z.SafeParseReturnType<unknown, T> },
  context: string,
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    // Log detailed error for debugging
    console.error(`[API] Validation failed for ${context}:`, {
      errors: result.error.issues,
      receivedData: data,
    });

    // Provide actionable error message
    const fieldErrors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');

    throw new ApiError(
      500,
      `Invalid response format for ${context}. Fields: ${fieldErrors}`
    );
  }

  return result.data;
}
```

### Phase 2: Improve Frontend Resilience

#### 2.1 Add Discriminated Union Schema (Optional but Recommended)

For better type safety, use discriminated unions based on status:

```typescript
// types.ts - Add discriminated union for response types

const ClarifyingResponseSchema = z.object({
  conversation_id: z.string(),
  message: z.string(),
  status: z.literal('clarifying'),
  current_step: z.string().optional(),
  estimated_time_minutes: z.null().optional(),
  report: z.null().optional(),
});

const ProcessingResponseSchema = z.object({
  conversation_id: z.string(),
  message: z.string(),
  status: z.literal('processing'),
  current_step: z.string().optional(),
  estimated_time_minutes: z.number().optional(),
  report: z.null().optional(),
});

const CompleteResponseSchema = z.object({
  conversation_id: z.string(),
  message: z.string(),
  status: z.literal('complete'),
  current_step: z.string().optional(),
  estimated_time_minutes: z.number().optional(),
  report: z.string(),
});

const ErrorResponseSchema = z.object({
  conversation_id: z.string(),
  message: z.string(),
  status: z.literal('error'),
  current_step: z.string().optional(),
  estimated_time_minutes: z.null().optional(),
  report: z.null().optional(),
});

// Use discriminated union for parsing
export const ChatResponseSchema = z.discriminatedUnion('status', [
  ClarifyingResponseSchema,
  ProcessingResponseSchema,
  CompleteResponseSchema,
  ErrorResponseSchema,
]);
```

#### 2.2 Add Error Recovery in useSparlo Hook

**File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`

Add explicit error handling for validation failures:

```typescript
// use-sparlo.ts - In sendMessage function

const sendMessage = useCallback(async (message: string) => {
  if (!message.trim() || state.isLoading) return;

  dispatch({ type: 'START_LOADING' });

  try {
    const response = await sparloApi.chat(message, state.conversationId);

    // Handle based on status
    switch (response.status) {
      case 'clarifying':
        dispatch({ type: 'START_CLARIFYING', payload: response.message });
        break;
      case 'processing':
        dispatch({
          type: 'START_PROCESSING',
          payload: { step: response.current_step || 'AN1', clearClarification: true }
        });
        // Start polling
        break;
      case 'complete':
        dispatch({ type: 'SET_COMPLETE', payload: response.report });
        break;
      case 'error':
        dispatch({ type: 'SET_ERROR', payload: response.message });
        break;
    }
  } catch (error) {
    // Specific handling for validation errors
    if (error instanceof ApiError && error.message.includes('Invalid response format')) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Received unexpected data format from server. Please try again.'
      });
      console.error('[useSparlo] API validation error:', error);
    } else {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  }
}, [state.isLoading, state.conversationId]);
```

### Phase 3: Backend Improvements (Defense in Depth)

#### 3.1 Explicitly Set Fields in Clarification Response

**File:** `main.py` (Backend)

Ensure clarification responses always include all expected fields:

```python
# main.py (Lines 925-930) - Update clarification response

return ChatResponse(
    conversation_id=conversation_id,
    message=state.clarification_question or "Could you provide more details?",
    status="clarifying",
    current_step="AN0",
    estimated_time_minutes=None,  # Explicitly set (Pydantic sends as null)
    report=None                    # Explicitly set
)
```

#### 3.2 Add Response Validation Middleware (Optional)

Create a response validator to catch schema mismatches early:

```python
# main.py - Add after ChatResponse model

def validate_chat_response(response: ChatResponse) -> ChatResponse:
    """Validate response matches frontend expectations."""
    # Log when optional fields are None (for debugging)
    if response.status == "clarifying":
        if response.estimated_time_minutes is not None:
            logger.warning(f"Unexpected estimated_time_minutes during clarifying: {response.estimated_time_minutes}")
    return response
```

### Phase 4: Add Integration Tests

#### 4.1 Frontend Test Cases

```typescript
// __tests__/api.test.ts

describe('ChatResponseSchema validation', () => {
  it('accepts clarifying response with null fields', () => {
    const response = {
      conversation_id: '123',
      message: 'What is your target?',
      status: 'clarifying',
      current_step: 'AN0',
      estimated_time_minutes: null,
      report: null,
    };

    expect(() => ChatResponseSchema.parse(response)).not.toThrow();
  });

  it('accepts clarifying response with missing fields', () => {
    const response = {
      conversation_id: '123',
      message: 'What is your target?',
      status: 'clarifying',
      current_step: 'AN0',
      // estimated_time_minutes and report omitted
    };

    expect(() => ChatResponseSchema.parse(response)).not.toThrow();
  });

  it('accepts complete response with all fields', () => {
    const response = {
      conversation_id: '123',
      message: 'Report complete',
      status: 'complete',
      current_step: 'AN7',
      estimated_time_minutes: 5,
      report: 'Full analysis report...',
    };

    expect(() => ChatResponseSchema.parse(response)).not.toThrow();
  });
});
```

#### 4.2 Backend Test Cases

```python
# tests/test_clarification.py

def test_clarification_response_format():
    """Verify clarification response matches frontend schema."""
    response = ChatResponse(
        conversation_id="test-123",
        message="What is your target?",
        status="clarifying",
        current_step="AN0"
    )

    data = response.model_dump()

    # Frontend expects null or undefined, not missing
    assert "estimated_time_minutes" in data or data.get("estimated_time_minutes") is None
    assert "report" in data or data.get("report") is None

def test_clarification_flow_e2e():
    """Test full clarification flow."""
    # Step 1: Send initial message that triggers clarification
    response1 = client.post("/api/chat", json={
        "message": "optimize CO2 capture",
        "conversation_id": None
    })
    assert response1.json()["status"] == "clarifying"

    # Step 2: Send clarification answer
    conv_id = response1.json()["conversation_id"]
    response2 = client.post("/api/chat", json={
        "message": "maximize CO2 capture capacity",
        "conversation_id": conv_id
    })
    assert response2.json()["status"] == "processing"
```

### Phase 5: Futureproofing

#### 5.1 Add Schema Versioning

Add version field to responses for future compatibility:

```typescript
// types.ts
export const ChatResponseSchema = z.object({
  _version: z.literal(1).optional().default(1),  // Schema version
  conversation_id: z.string(),
  // ... rest of fields
});
```

```python
# models.py
class ChatResponse(BaseModel):
    _version: int = Field(default=1, alias="_version")
    # ... rest of fields
```

#### 5.2 Create Response Transformer

Add a transformer layer to handle backend/frontend schema differences:

```typescript
// api.ts - Add transformer

function transformResponse(raw: unknown): unknown {
  // Handle null → undefined conversion if needed
  if (typeof raw !== 'object' || raw === null) return raw;

  const obj = raw as Record<string, unknown>;

  // Transform null to undefined for optional fields
  const nullableFields = ['estimated_time_minutes', 'report', 'current_step'];
  for (const field of nullableFields) {
    if (obj[field] === null) {
      delete obj[field];  // Remove null, Zod .optional() will handle undefined
    }
  }

  return obj;
}

// Use in validateResponse
function validateResponse<T>(...) {
  const transformed = transformResponse(data);
  return schema.parse(transformed);
}
```

## Acceptance Criteria

### Functional Requirements
- [ ] User can submit a message that triggers clarification
- [ ] Clarification question displays correctly in UI
- [ ] User can provide clarification answer
- [ ] After clarification, chain continues to processing state
- [ ] Report generates successfully after clarification
- [ ] "Skip clarification" button works correctly
- [ ] Multiple clarification rounds work (up to limit)

### Non-Functional Requirements
- [ ] No Zod validation errors in console during clarification flow
- [ ] No React hydration errors (#418)
- [ ] UI never gets stuck on loading screen
- [ ] Clear error messages shown if something fails
- [ ] Response time < 1s for UI state transitions

### Quality Gates
- [ ] All new code has TypeScript types
- [ ] Frontend tests pass for schema validation
- [ ] Backend tests pass for response format
- [ ] Manual E2E test of clarification flow passes
- [ ] No regression in existing report generation

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `apps/web/app/home/(user)/_lib/types.ts` | Change `.optional()` to `.nullish()` | P0 |
| `apps/web/app/home/(user)/_lib/api.ts` | Improve error handling | P1 |
| `apps/web/app/home/(user)/_lib/use-sparlo.ts` | Add error recovery | P1 |
| `apps/web/app/home/(user)/__tests__/api.test.ts` | Add schema tests | P2 |
| Backend `main.py` | Explicit null fields (optional) | P2 |
| Backend `tests/test_clarification.py` | E2E tests | P2 |

## MVP Implementation

### types.ts

```typescript
import { z } from 'zod';

export const ConversationStatusSchema = z.enum([
  'clarifying',
  'processing',
  'complete',
  'error',
  'confirm_rerun'
]);

export const ChatResponseSchema = z.object({
  conversation_id: z.string(),
  message: z.string(),
  status: ConversationStatusSchema,
  current_step: z.string().optional(),
  estimated_time_minutes: z.number().nullish(),  // FIX: Accept null
  report: z.string().nullish(),                   // FIX: Accept null
});

export const StatusResponseSchema = z.object({
  conversation_id: z.string(),
  status: ConversationStatusSchema,
  current_step: z.string().optional(),
  completed_steps: z.array(z.string()),
  message: z.string().optional(),
  report: z.string().nullish(),  // FIX: Accept null
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type StatusResponse = z.infer<typeof StatusResponseSchema>;
export type ConversationStatus = z.infer<typeof ConversationStatusSchema>;
```

## References

### Internal References
- Frontend Zod schemas: `apps/web/app/home/(user)/_lib/types.ts:20-36`
- API client validation: `apps/web/app/home/(user)/_lib/api.ts:98-140`
- useSparlo hook: `apps/web/app/home/(user)/_lib/use-sparlo.ts:477-512`
- Backend chat endpoint: `main.py:711-949`
- Backend models: `knowledge_base/models.py:201-208`
- AN0 chain logic: `chain.py:1317-1368`

### External References
- Zod nullish documentation: https://zod.dev/api#nullish
- Zod discriminated unions: https://zod.dev/api#discriminatedunion
- React Error #418: https://react.dev/errors/418
- Pydantic Optional fields: https://docs.pydantic.dev/latest/concepts/fields/#optional-fields

### Related Work
- Previous clarification loop fix: `plans/fix-an0-clarification-loop.md`
