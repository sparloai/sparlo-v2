# Fix Clarification Flow: Conversation State Persistence

## Implementation Status: 🔴 NOT STARTED

**Date:** 2025-12-15

---

## Executive Summary

The AN0 clarification flow fails because the backend stores conversation state **in-memory**. When the user submits a clarification response, the backend cannot find the conversation and creates a new one, restarting AN0.

## Root Cause

### Backend In-Memory Storage
```python
# main.py:128-129
conversations: dict[str, ChainState] = {}
conversation_timestamps: dict[str, float] = {}
```

This in-memory storage fails when:
1. **Railway restarts the server** (deploys, crashes, auto-scaling)
2. **Multiple instances exist** (horizontal scaling)
3. **Memory pressure** causes Python garbage collection

### Evidence from Logs
```
INFO:chain:AN0 V1 needs clarification: What is your regeneration temperature constraint?
INFO:     100.64.0.9:17424 - "POST /api/chat HTTP/1.1" 200 OK
INFO:chain:=== STARTING AN0 V1 ===  <-- Should NOT happen for clarification response
```

The second "STARTING AN0 V1" proves the backend didn't find the existing conversation.

### Frontend Code is Correct
The frontend properly sends `conversation_id` (verified in `use-sparlo.ts:1047-1052`):
```typescript
const backendConversationId =
  currentReport?.conversation_id ||
  stateRef.current.conversationId ||
  undefined;
const response = await sparloApi.chat(trimmed, backendConversationId);
```

---

## Solution Options

### Option A: Persist State to Redis (Recommended)
**Effort:** Medium | **Reliability:** High | **Cost:** ~$5-15/month

Add Redis for conversation state persistence:
- Railway offers managed Redis
- Survives restarts and scaling
- Fast enough for real-time chat

```python
# Backend change
import redis
import json

redis_client = redis.from_url(os.getenv("REDIS_URL"))

def save_conversation(conv_id: str, state: ChainState):
    redis_client.setex(
        f"conv:{conv_id}",
        CONVERSATION_TTL_HOURS * 3600,
        state.model_dump_json()
    )

def get_conversation(conv_id: str) -> Optional[ChainState]:
    data = redis_client.get(f"conv:{conv_id}")
    if data:
        return ChainState.model_validate_json(data)
    return None
```

### Option B: Move Backend to Vercel (Same Server)
**Effort:** High | **Reliability:** Medium | **Cost:** Included in Vercel plan

Convert Python FastAPI to Next.js API routes or use Vercel Python runtime:
- Eliminates cross-origin API calls
- Still needs external state (Vercel is serverless = no memory persistence)
- Significant refactoring required

**Verdict:** Does NOT solve the problem. Vercel serverless functions also lose state between invocations.

### Option C: Persist State to Supabase (PostgreSQL)
**Effort:** Low-Medium | **Reliability:** High | **Cost:** Included in existing plan

Store conversation state in existing Supabase database:
- Already have PostgreSQL via Supabase
- No new infrastructure
- Slightly slower than Redis but sufficient

```python
# Backend uses Supabase
from supabase import create_client

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

def save_conversation(conv_id: str, state: ChainState):
    supabase.table("sparlo_conversation_states").upsert({
        "id": conv_id,
        "state": state.model_dump(),
        "updated_at": datetime.utcnow().isoformat()
    }).execute()

def get_conversation(conv_id: str) -> Optional[ChainState]:
    result = supabase.table("sparlo_conversation_states").select("state").eq("id", conv_id).single().execute()
    if result.data:
        return ChainState.model_validate(result.data["state"])
    return None
```

### Option D: Client-Side State (Workaround)
**Effort:** Low | **Reliability:** Low | **Cost:** None

Send full conversation state with each request (stateless backend):
- Increases payload size significantly
- Exposes internal state to client
- Security concerns with chain state

**Verdict:** Not recommended due to security and payload concerns.

---

## Recommended Solution: Option C (Supabase)

### Rationale
1. **No new infrastructure** - Already using Supabase
2. **Cost-effective** - Included in existing plan
3. **Reliable** - PostgreSQL is battle-tested for persistence
4. **Simple migration** - Minimal backend changes

### Implementation Plan

#### Phase 1: Database Schema (5 min)

Create migration in `apps/web/supabase/migrations/`:

```sql
-- 20241215_add_conversation_states.sql

CREATE TABLE IF NOT EXISTS sparlo_conversation_states (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id text UNIQUE NOT NULL,
    state jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_conversation_states_conversation_id ON sparlo_conversation_states(conversation_id);

-- Auto-cleanup: delete states older than 24 hours
CREATE OR REPLACE FUNCTION cleanup_old_conversation_states()
RETURNS void AS $$
BEGIN
    DELETE FROM sparlo_conversation_states
    WHERE updated_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;

-- RLS: Only backend service key can access (no user access needed)
ALTER TABLE sparlo_conversation_states ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON sparlo_conversation_states
    FOR ALL
    USING (true)
    WITH CHECK (true);
```

#### Phase 2: Backend Changes (30 min)

**File:** `sparlo-backend/main.py`

1. Add Supabase client initialization:
```python
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    logger.info("Supabase client initialized for conversation state persistence")
else:
    logger.warning("Supabase not configured - using in-memory storage (not recommended for production)")
```

2. Replace in-memory storage functions:
```python
def save_conversation_state(conversation_id: str, state: ChainState) -> None:
    """Persist conversation state to Supabase or in-memory fallback."""
    # Update timestamp
    conversation_timestamps[conversation_id] = time.time()

    if supabase:
        try:
            supabase.table("sparlo_conversation_states").upsert({
                "conversation_id": conversation_id,
                "state": state.model_dump(mode="json"),
                "updated_at": "now()"
            }).execute()
        except Exception as e:
            logger.error(f"Failed to persist state to Supabase: {e}")
            # Fallback to in-memory
            conversations[conversation_id] = state
    else:
        conversations[conversation_id] = state


def get_conversation_state(conversation_id: str) -> Optional[ChainState]:
    """Retrieve conversation state from Supabase or in-memory fallback."""
    if supabase:
        try:
            result = supabase.table("sparlo_conversation_states") \
                .select("state") \
                .eq("conversation_id", conversation_id) \
                .single() \
                .execute()

            if result.data:
                return ChainState.model_validate(result.data["state"])
        except Exception as e:
            logger.error(f"Failed to retrieve state from Supabase: {e}")
            # Fallback to in-memory
            return conversations.get(conversation_id)

    return conversations.get(conversation_id)


def delete_conversation_state(conversation_id: str) -> None:
    """Remove conversation state from storage."""
    conversation_timestamps.pop(conversation_id, None)
    conversations.pop(conversation_id, None)

    if supabase:
        try:
            supabase.table("sparlo_conversation_states") \
                .delete() \
                .eq("conversation_id", conversation_id) \
                .execute()
        except Exception as e:
            logger.error(f"Failed to delete state from Supabase: {e}")
```

3. Update all usages of `conversations[...]` and `conversations.get(...)`:
- Line 458: `old_state = get_conversation_state(conversation_id)`
- Line 469: `save_conversation_state(conversation_id, state)`
- Line 483: `save_conversation_state(conversation_id, state)`
- Line 551: `state = get_conversation_state(conversation_id)`
- Line 593: `state = get_conversation_state(conversation_id)`
- Line 650: `state = get_conversation_state(conversation_id)`
- Line 684: `save_conversation_state(conversation_id, state)`
- Line 690: `state = get_conversation_state(conversation_id)`
- Line 694: `save_conversation_state(conversation_id, state)`
- Line 743-744: `state = get_conversation_state(request.conversation_id)`
- Line 768: `save_conversation_state(conversation_id, state)`
- Line 781: `save_conversation_state(conversation_id, state)`
- Line 796: `save_conversation_state(conversation_id, state)`
- Line 852: `state = get_conversation_state(conversation_id)`
- Line 880: `save_conversation_state(conversation_id, state)`
- Line 894: `save_conversation_state(conversation_id, state)`

4. Add to `requirements.txt`:
```
supabase>=2.0.0
```

#### Phase 3: Environment Variables (5 min)

Add to Railway backend environment:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (from Supabase dashboard)

#### Phase 4: Testing (15 min)

1. Apply migration locally: `pnpm --filter web supabase migrations up`
2. Test clarification flow end-to-end
3. Verify conversation state persists after simulated restart
4. Deploy to Railway

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `apps/web/supabase/migrations/20241215_conversation_states.sql` | New migration | P0 |
| `sparlo-backend/main.py` | Add Supabase persistence | P0 |
| `sparlo-backend/requirements.txt` | Add supabase package | P0 |
| Railway Environment | Add Supabase credentials | P0 |

---

## Acceptance Criteria

### Functional
- [ ] User submits message → clarification question appears
- [ ] User responds to clarification → chain continues to AN1 (NOT restart AN0)
- [ ] Clarification works after backend restart
- [ ] Skip clarification button works

### Technical
- [ ] Conversation state persists in `sparlo_conversation_states` table
- [ ] Graceful fallback to in-memory if Supabase unavailable
- [ ] States auto-cleanup after 24 hours
- [ ] No Zod validation errors (already fixed)

### Verification Steps
1. Submit "optimize CO2 capture" → Should trigger clarification
2. Wait 30 seconds (to ensure any restart wouldn't affect us)
3. Submit clarification answer → Should see "AN1" in logs, NOT "AN0"
4. Report generates successfully

---

## Why Not "Move Backend to Same Server"?

The user asked:
> "does it make more sense to move the backend to the same Vercel server / repo?"

**Answer: No, this doesn't solve the problem.**

1. **Vercel is serverless** - Each function invocation is stateless
2. **No memory persistence** - Same issue would occur
3. **Still need external storage** - Redis, PostgreSQL, or similar
4. **Significant refactoring** - Python → TypeScript conversion

The actual fix is **persistent storage**, not co-location. Option C (Supabase) is the best choice because:
- Uses existing infrastructure
- No additional cost
- Minimal code changes
- Reliable PostgreSQL backing

---

## References

- Backend conversation storage: `sparlo-backend/main.py:128-129`
- Backend chat endpoint: `sparlo-backend/main.py:743-894`
- Frontend API call: `apps/web/app/home/(user)/_lib/use-sparlo.ts:1047-1052`
- Next.js API route: `apps/web/app/api/sparlo/chat/route.ts`
