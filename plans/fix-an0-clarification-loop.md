# fix: AN0 clarification loop causing infinite question cycle

## Overview

The AN0 clarification flow has a bug where after the user answers a clarification question, the system loops back and asks for clarification again instead of proceeding to AN1. This creates an infinite loop that blocks users from completing their analysis.

## Problem Statement

**Current behavior:** User submits challenge → AN0 asks clarification → User answers → AN0 asks clarification again → Loop forever

**Expected behavior:** User submits challenge → AN0 asks clarification → User answers → System proceeds to AN1-AN5 processing

## Root Cause Analysis

**Previous diagnosis (WRONG):** Frontend polling race condition

**Actual root cause (CONFIRMED):** The bug is in the **backend**, not the frontend.

### The Bug Location: `sparlo-backend/main.py:577-590`

When a user answers a clarification question:
1. Frontend sends the answer to `/api/chat`
2. Backend receives the message
3. **BUG:** Backend ALWAYS re-runs `run_an0_v1()` regardless of whether this is a clarification response
4. AN0 sees the answer as a new "User's Design Challenge"
5. AN0 asks for clarification again → infinite loop

```python
# main.py:577-590 - THE BUG
# Run AN0 (problem framing) - use V1 version for v1/v10 modes
try:
    if chain_mode == "corpus":
        state = run_an0(state, request.message)
    elif chain_mode == "v10":
        state = run_an0_v1(state, request.message)
    else:
        state = run_an0_v1(state, request.message)
```

The backend has `state.needs_clarification` which gets set to `True` when AN0 asks a question, but **nothing checks this flag before re-running AN0**.

### Why the LLM Keeps Asking

In `chain.py:1316-1327`, when building the prompt for clarification responses:

```python
context_parts.append(f"## User's Design Challenge\n{user_message}")  # ← Answer becomes "challenge"

if state.user_messages:
    context_parts.append("\n## Previous Messages")
    for msg in state.user_messages:
        context_parts.append(f"- {msg}")  # ← Original problem buried here
```

The clarification answer appears as the main "Design Challenge" while the original problem is buried in "Previous Messages". The LLM doesn't understand this is a response to its question.

## Solution

### Option A: Skip AN0 for Clarification Responses (Recommended)

Add a check in `main.py` before running AN0:

```python
# After loading existing conversation state (~line 461)
# Check if this is a clarification response
if state.needs_clarification:
    logger.info(f"Processing clarification response for {conversation_id}")

    # Append answer to conversation history
    state.user_messages.append(request.message)

    # Clear clarification flag - user has answered
    state.needs_clarification = False
    state.clarification_question = None

    # Preserve original ask for chain processing
    if not state.original_ask:
        state.original_ask = state.user_messages[0] if state.user_messages else request.message

    # Save state and proceed directly to chain
    conversations[conversation_id] = state
    background_tasks.add_task(run_chain_background, conversation_id, chain_mode)

    return ChatResponse(
        conversation_id=conversation_id,
        message="Thanks for the clarification! Analyzing your design challenge now...",
        status="processing",
        current_step="AN1",
        estimated_time_minutes=5
    )

# Existing AN0 logic for new conversations continues below...
```

### Option B: Fix Prompt Context (Alternative)

Modify `chain.py:run_an0_v1` to properly label clarification responses:

```python
if state.needs_clarification and state.clarification_question:
    context_parts.append(f"## Original Design Challenge\n{state.original_ask}")
    context_parts.append(f"\n## Your Previous Question\n{state.clarification_question}")
    context_parts.append(f"\n## User's Response\n{user_message}")
else:
    context_parts.append(f"## User's Design Challenge\n{user_message}")
```

### Option C: Add Safety Counter (Defense in Depth)

Add `clarification_count` to `ChainState` model:

```python
class ChainState(BaseModel):
    # ... existing fields
    clarification_count: int = 0
    max_clarifications: int = 2  # Limit to 2 rounds max
```

Then check in AN0 processing:
```python
if state.clarification_count >= state.max_clarifications:
    # Force proceed to chain even if LLM wants more clarification
    state.needs_clarification = False
```

## Recommended Implementation: Option A + C

1. **Option A** fixes the root cause by skipping AN0 for clarification responses
2. **Option C** adds a safety net to prevent infinite loops even if bugs remain

## Files to Modify

| File | Changes |
|------|---------|
| `sparlo-backend/main.py` | Add clarification response handling before AN0 (~line 461) |
| `sparlo-backend/knowledge_base/models.py` | Add `clarification_count` to ChainState |

## Acceptance Criteria

- [ ] User can answer a clarification question and proceed to processing
- [ ] System does not loop back to ask clarification after user answers
- [ ] Skip clarification button still works correctly
- [ ] Maximum 2 clarification rounds enforced
- [ ] Backend logs show "Processing clarification response" for answers

## Test Plan

1. **Happy path test:**
   - Submit a vague challenge that triggers clarification
   - Answer the clarification question
   - Verify system proceeds to AN1-AN5 processing (not another clarification)

2. **Skip clarification test:**
   - Submit a challenge that triggers clarification
   - Click "Skip" button
   - Verify system proceeds to processing

3. **Multi-clarification test:**
   - Submit a challenge requiring 2 clarifications
   - Answer both
   - Verify system stops after 2 rounds max

4. **Edge case - empty answer:**
   - Submit challenge, get clarification
   - Send empty or very short answer
   - Verify graceful handling

## References

- **Backend:** `sparlo-backend/main.py:439-625` - `/api/chat` endpoint
- **Chain:** `sparlo-backend/chain.py:1306-1357` - `run_an0_v1` function
- **Models:** `sparlo-backend/knowledge_base/models.py` - ChainState
- **Frontend:** `apps/web/app/home/(user)/_lib/use-sparlo.ts` - useSparlo hook
- **Previous PRs:** #22, #23 (frontend refactoring), #24 (frontend fix - insufficient)
