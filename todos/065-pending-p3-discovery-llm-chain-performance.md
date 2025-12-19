---
status: pending
priority: p3
issue_id: "065"
tags: [code-review, performance, llm, discovery-mode]
dependencies: []
---

# Discovery LLM Chain Performance Optimizations

## Problem Statement

The discovery LLM chain has several performance bottlenecks: sequential execution of parallelizable steps, no prompt caching, context explosion across phases, and 14+ database updates per report. These add up to unnecessary time and cost.

## Findings

**From performance-oracle:**

### 1. Sequential Execution (Could Save 2-5 Minutes)
AN1.5-D and AN1.7-D both only depend on AN0-D but run sequentially:
```typescript
// Current: 2 min + 3 min = 5 minutes
const an1_5dResult = await step.run('an1.5-d-teaching-selection', ...);
const an1_7dResult = await step.run('an1.7-d-literature-gaps', ...);

// Could be: max(2 min, 3 min) = 3 minutes
const [an1_5dResult, an1_7dResult] = await Promise.all([...]);
```

### 2. No Prompt Caching
System prompts (~15,000 tokens total) are sent fresh every report. Anthropic Prompt Caching could reduce by 90%.

**Cost at 1,000 reports:** ~$225 wasted on repeated system prompts

### 3. Context Explosion
Each phase accumulates all previous JSON:
- AN0-D: ~2,000 tokens input
- AN1.5-D: ~4,000 tokens
- AN1.7-D: ~7,000 tokens
- ...
- AN5-D: ~20,000 tokens

Pretty-printed JSON (`JSON.stringify(x, null, 2)`) wastes ~30% tokens.

### 4. Database Update Overhead
14+ separate `UPDATE` queries per report = 700-1,400ms of network latency.

## Proposed Solutions

### Option A: Parallelize Independent Steps
```typescript
// In generate-discovery-report.ts
const [an1_5dResult, an1_7dResult] = await Promise.all([
  step.run('an1.5-d-teaching-selection', ...),
  step.run('an1.7-d-literature-gaps', ...),
]);
```

**Effort:** Low (1-2 hours)
**Impact:** 2-5 minutes per report

### Option B: Implement Prompt Caching
Add Anthropic cache control headers to `callClaude`:
```typescript
headers: {
  'anthropic-beta': 'prompt-caching-2024-07-31'
}
```

**Effort:** Low (2-3 hours)
**Impact:** ~$0.20 saved per report

### Option C: Compact JSON Context
Remove pretty-printing, extract only essential fields:
```typescript
// Instead of: JSON.stringify(an0dResult, null, 2)
JSON.stringify({
  problem: an0dResult.problem_statement,
  constraints: an0dResult.constraints,
  // Only what next phase needs
});
```

**Effort:** Medium (4-6 hours)
**Impact:** 20-30% token reduction

### Option D: Batch Database Updates
Reduce 14+ updates to 3-4 batched updates:
```typescript
await updateProgress({
  current_step: 'an0-d',
  phase_progress: 0,
  // Batch multiple field updates
});
```

**Effort:** Low (2-3 hours)
**Impact:** 500-1,000ms per report

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected Files:**
- `apps/web/lib/inngest/functions/generate-discovery-report.ts`
- `apps/web/lib/llm/client.ts`

**Components:** None

**Database Changes:** None

## Acceptance Criteria

- [ ] AN1.5-D and AN1.7-D run in parallel (if implementing A)
- [ ] Prompt caching enabled (if implementing B)
- [ ] JSON context size reduced (if implementing C)
- [ ] Database updates batched (if implementing D)
- [ ] No functional changes to report output

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | Identified during code review |

## Resources

- PR: Discovery Mode commit f8b0587
- Anthropic Prompt Caching docs
