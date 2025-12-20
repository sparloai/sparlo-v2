# feat: Implement Prompt Caching for Hybrid Reports

## Problem

Hybrid reports cost ~$4.11/run. Goal: reduce 15-20% (~$3.30-$3.50/run) using Anthropic's prompt caching.

## Solution

1. Add cached system prefix to all 7 LLM calls
2. Minimize context passed between steps
3. Verify cache hits with 2 test reports

## Implementation

### Step 1: Create Cached Prefix (15 min)

Create `apps/web/lib/llm/prompts/hybrid/cached-prefix.ts`:

```typescript
/**
 * Shared system prefix cached across all hybrid report steps.
 * Must be >1024 tokens for Opus cache eligibility.
 */
export const HYBRID_CACHED_PREFIX = `## Role & Mission

You are a senior engineering strategist conducting full-spectrum problem analysis.
Your mission is to find the BEST solution regardless of whether it's simple or revolutionary.

## Solution Tracks

**SIMPLER PATH** - Lower risk, faster to implement
- What's the simplest thing that could possibly work?
- What existing solutions are we overcomplicating?
- NOT consolation prizes - genuinely good solutions

**BEST FIT** - Highest probability of meeting requirements
- What proven approaches best match these specific constraints?
- What has worked in similar contexts?
- Merit-based, evidence-backed

**PARADIGM SHIFT** - Challenge fundamental assumptions
- What if the industry approach is fundamentally wrong?
- What constraints are artificial vs. real?
- What would a first-principles redesign look like?

**FRONTIER TRANSFER** - Cross-domain innovation
- What solutions exist in biology, geology, other industries?
- What abandoned technologies might now be viable?
- Higher risk, higher ceiling

## Output Requirements

CRITICAL: Respond with ONLY valid JSON.
- Start with { and end with }
- No markdown code fences
- No text before or after the JSON
- All strings must be properly escaped

## Quality Standards

For every concept or analysis:
- Include prior art and evidence sources
- Provide specific, actionable recommendations
- Quantify feasibility and impact (1-10 scales)
- Include honest self-critique of blind spots
- Document what could go wrong

## Philosophy

The best solution wins regardless of origin.
Simple solutions that work beat complex ones that might work.
Novel solutions that work beat conventional ones that don't.
MERIT is the only criterion.
`;
```

### Step 2: Update LLM Client (30 min)

Modify `apps/web/lib/llm/client.ts`:

```typescript
// Add to callClaude params interface:
cacheablePrefix?: string;

// Update the API call (around line 145):
const response = await anthropic.messages.create({
  model: params.model,
  max_tokens: params.maxTokens ?? 8000,
  temperature: params.temperature ?? 0.7,
  // Support both cached prefix + step-specific prompt
  system: params.cacheablePrefix
    ? [
        {
          type: 'text',
          text: params.cacheablePrefix,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: params.system,
        },
      ]
    : params.system,
  messages: [{ role: 'user', content: messageContent }],
});

// Log cache metrics after response (for verification):
if (process.env.NODE_ENV === 'development') {
  console.log('Cache metrics:', {
    cacheCreation: response.usage?.cache_creation_input_tokens ?? 0,
    cacheRead: response.usage?.cache_read_input_tokens ?? 0,
  });
}
```

### Step 3: Update Orchestrator (1 hour)

In `apps/web/lib/inngest/functions/generate-hybrid-report.ts`:

```typescript
import { HYBRID_CACHED_PREFIX } from '~/lib/llm/prompts/hybrid/cached-prefix';

// Add to each callClaude() call (7 total):
const an0Result = await callClaude({
  model: HYBRID_MODEL,
  system: AN0_M_PROMPT,
  userMessage: buildAN0Context(challenge, clarificationAnswer),
  maxTokens: 8000,
  temperature: 0.7,
  cacheablePrefix: HYBRID_CACHED_PREFIX, // ADD THIS
});
```

### Step 4: Minimize Context Passing (2 hours)

Update context builders inline in orchestrator. Each step only gets what it needs:

| Step | Currently Receives | Actually Needs |
|------|-------------------|----------------|
| AN1.5-M | Full AN0 | problem_analysis, discovery_seeds |
| AN1.7-M | AN0 + AN1.5 | problem_analysis, selected_examples |
| AN2-M | All previous | problem_analysis, gap_analysis |
| AN3-M | All previous | problem_analysis, generation_guidance |
| AN4-M | All previous | concepts only |
| AN5-M | All previous | problem_analysis, concepts, validation_results |

Example inline context (no builder function needed):

```typescript
// AN4-M only needs concepts to evaluate
const an4Context = JSON.stringify({
  concepts: an3.concepts,
  track_coverage: an3.track_coverage,
});
```

### Step 5: Verify (30 min)

Run 2 reports sequentially with same input:

1. First report: `cacheCreation > 0`, `cacheRead = 0`
2. Second report: `cacheCreation = 0`, `cacheRead > 0`

Check Anthropic dashboard for cost reduction.

## Files Changed

| File | Change |
|------|--------|
| `apps/web/lib/llm/prompts/hybrid/cached-prefix.ts` | NEW - cached prefix constant |
| `apps/web/lib/llm/client.ts` | Add cacheablePrefix param, cache_control support |
| `apps/web/lib/inngest/functions/generate-hybrid-report.ts` | Pass prefix to all steps, minimize context |

## Acceptance Criteria

- [ ] All 7 steps pass `cacheablePrefix`
- [ ] Second sequential report shows cache hits
- [ ] Cost per report decreases 15-20% (verify in Anthropic dashboard after ~10 reports)

## Estimated Effort

4-5 hours total

## Rollback

Remove `cacheablePrefix` parameter from callClaude calls. No other changes needed.
