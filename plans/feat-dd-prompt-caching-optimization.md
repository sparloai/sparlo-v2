# feat: DD Flow Prompt Caching Optimization

## 🔬 Research Enhancement Summary

This plan was enhanced with parallel research agent analysis. Key findings:

### Critical Discovery: Cache Metrics Not Being Captured

The current `TokenUsage` interface in `client.ts` (lines 18-22) does NOT capture Anthropic's cache metrics:
- Missing: `cache_creation_input_tokens` (tokens written to cache)
- Missing: `cache_read_input_tokens` (tokens read from cache)

**This means we have NO visibility into whether caching is working.** This is the highest priority fix.

### Current HYBRID_CACHED_PREFIX Analysis

The existing prefix is **~350-400 tokens** (55 lines at `prompts/hybrid/cached-prefix.ts`). This is:
- **Below the 1,024 token threshold on its own**
- Combined with system prompts, may or may not exceed 1,024

### Revised Strategy: Measure Before Optimizing

The architecture review recommends:
1. **Add cache metrics logging FIRST** (before any prefix changes)
2. Run a DD report and observe actual cache behavior
3. THEN decide if separate DD prefix is needed

This data-driven approach prevents over-engineering.

---

## Overview

Optimize the Due Diligence (DD) flow to properly utilize Anthropic's prompt caching, reducing token costs by up to 90% on cached content.

**Current State:**
- DD flow uses 216,955 input tokens and 101,461 output tokens (318K total per report)
- All 10 DD steps already pass `cacheablePrefix` parameter
- DD flow reuses `HYBRID_CACHED_PREFIX` instead of DD-specific content
- **No monitoring of cache hit rates** ← Critical blind spot
- **Cache metrics not captured in TokenUsage interface**

**Target State:**
- Add cache performance metrics to TokenUsage interface
- Log cache hit/miss rates for every Claude call
- Verify cache hits are occurring (via usage stats)
- Create DD-specific cached prefix IF data shows caching isn't working
- Estimated savings: 60-90% on cached prefix tokens

---

## Problem Statement

The DD flow is expensive (~$2+ per report) and the current caching implementation may not be optimal:

1. **Wrong Cached Prefix**: DD uses `HYBRID_CACHED_PREFIX` which contains hybrid-specific language about "solution tracks" that doesn't apply to DD (which focuses on claim validation and moat assessment)

2. **No Visibility**: No logging or metrics to verify cache is actually working - we can't confirm if we're getting cache hits or paying full price

3. **Potential Waste**: If the cached prefix is too short (<1,024 tokens) or changes between steps, caching doesn't activate

---

## Technical Approach

### Phase 1: Add Cache Metrics to TokenUsage (PRIORITY)

**File to modify:** `apps/web/lib/llm/client.ts`

This is the critical first step. Without cache metrics, we're flying blind.

```typescript
// apps/web/lib/llm/client.ts - Update TokenUsage interface (lines 18-22)

/**
 * Token usage from Claude API response
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  // NEW: Anthropic cache metrics
  cacheCreationTokens: number;  // Tokens written to cache (first request)
  cacheReadTokens: number;      // Tokens read from cache (cache hit)
}
```

Update both streaming and non-streaming response handlers to capture cache metrics:

```typescript
// In streaming handler (around line 241)
const usage: TokenUsage = {
  inputTokens: finalMessage.usage.input_tokens,
  outputTokens: finalMessage.usage.output_tokens,
  totalTokens: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
  cacheCreationTokens: finalMessage.usage.cache_creation_input_tokens ?? 0,
  cacheReadTokens: finalMessage.usage.cache_read_input_tokens ?? 0,
};

// In non-streaming handler (around line 282)
const usage: TokenUsage = {
  inputTokens: response.usage.input_tokens,
  outputTokens: response.usage.output_tokens,
  totalTokens: response.usage.input_tokens + response.usage.output_tokens,
  cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
  cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
};
```

### Phase 2: Add Cache Performance Logging

**Update:** `apps/web/lib/llm/client.ts`

Add a helper function and call it after constructing TokenUsage in both handlers:

```typescript
// Add helper function near top of file (after TokenUsage interface)
function logCachePerformance(usage: TokenUsage, context?: string): void {
  const totalInput = usage.inputTokens + usage.cacheReadTokens;
  const cacheHitRate = usage.cacheReadTokens > 0
    ? ((usage.cacheReadTokens / totalInput) * 100).toFixed(1)
    : '0.0';

  const prefix = context ? `[Claude Cache: ${context}]` : '[Claude Cache]';

  console.log(
    `${prefix} Hit: ${cacheHitRate}% | ` +
    `Read: ${usage.cacheReadTokens.toLocaleString()} | ` +
    `Write: ${usage.cacheCreationTokens.toLocaleString()} | ` +
    `Input: ${usage.inputTokens.toLocaleString()} | ` +
    `Output: ${usage.outputTokens.toLocaleString()}`
  );
}

// Call after constructing usage in streaming handler (around line 248)
logCachePerformance(usage);
return { content: result, usage };

// Call after constructing usage in non-streaming handler (around line 288)
logCachePerformance(usage);
return { content: textBlock.text, usage };
```

### Phase 3: Analyze and Decide (Data-Driven)

**After deploying Phase 1 & 2**, run a DD report and check Railway logs:

**If you see cache hits (cacheReadTokens > 0 on steps 2-10):**
- Current HYBRID_CACHED_PREFIX is working
- No DD-specific prefix needed
- Skip Phase 4

**If you see NO cache hits (cacheReadTokens = 0 on all steps):**
- Proceed to Phase 4: Create DD-specific prefix
- Likely cause: cached content < 1,024 tokens or content mismatch between steps

### Phase 4: Create DD-Specific Cached Prefix (CONDITIONAL)

**Only proceed if Phase 3 shows caching isn't working.**

**File to create:** `apps/web/lib/llm/prompts/dd/cached-prefix.ts`

```typescript
// apps/web/lib/llm/prompts/dd/cached-prefix.ts
/**
 * DD Mode Cached Prefix
 *
 * This prefix is cached by Anthropic's API to reduce token costs.
 * Must be >1,024 tokens to trigger caching.
 *
 * Content focuses on DD-specific role, verdicts, and philosophy.
 */
export const DD_CACHED_PREFIX = `You are Sparlo's Due Diligence Engine - an expert technical analyst
evaluating startup claims with first-principles rigor.

## Your Role
You conduct technical due diligence on deep tech startups by:
1. Extracting and categorizing claims from startup materials
2. Validating claims against physics, engineering fundamentals, and prior art
3. Mapping the startup's approach onto the full solution landscape
4. Assessing competitive moat durability and defensibility
5. Providing calibrated investment recommendations

## DD Verdict Scale
- COMPELLING: Technical thesis sound, approach optimal, defensible moat, limited risk
- PROMISING: Technical thesis plausible, approach reasonable, some moat, manageable risks
- MIXED: Strong elements exist alongside legitimate concerns requiring careful weighing
- CONCERNING: Significant issues with thesis, physics, moat, or risks
- PASS: Technical thesis fails, approach suboptimal, no moat, or critical risks

## Confidence Levels
- HIGH: Multiple independent validations, strong precedent
- MEDIUM: Some validation, reasonable extrapolation
- LOW: Limited evidence, significant uncertainty

## Solution Tracks (for mapping startup approach)
- SIMPLER_PATH: Lower-risk alternatives that may be "good enough"
- BEST_FIT: Optimal approaches for the stated problem
- PARADIGM_SHIFT: Approaches that challenge industry assumptions
- FRONTIER_TRANSFER: Cross-domain innovations with higher risk/reward

## Analysis Philosophy
- First-principles over pattern matching
- Physics constrains all claims
- Solution space before startup evaluation
- Moats decay; assess durability
- Calibrated uncertainty over false precision

## Output Requirements
- All responses must be valid JSON matching the specified schema
- Include specific evidence for every claim validation
- Quantify uncertainty with confidence levels
- Reference prior art and precedent where applicable
- Flag assumptions that require founder verification
`;
```

**Update:** `apps/web/lib/llm/prompts/dd/index.ts`

```typescript
// Add export
export { DD_CACHED_PREFIX } from './cached-prefix';
```

**Update:** `apps/web/lib/inngest/functions/generate-dd-report.ts`

```typescript
// Change import
import { DD_CACHED_PREFIX } from '~/lib/llm/prompts/dd';

// Replace all occurrences of HYBRID_CACHED_PREFIX with DD_CACHED_PREFIX
// (approximately 10 locations based on repo research)
```

### Phase 5: Verify Token Threshold (if Phase 4 executed)

Ensure `DD_CACHED_PREFIX` exceeds 1,024 tokens (Anthropic's minimum for caching):

```typescript
// Add to tests or as a build-time check
import { DD_CACHED_PREFIX } from '~/lib/llm/prompts/dd';
import { encode } from 'gpt-tokenizer'; // Or use Anthropic's tokenizer

const tokenCount = encode(DD_CACHED_PREFIX).length;
if (tokenCount < 1024) {
  throw new Error(
    `DD_CACHED_PREFIX has ${tokenCount} tokens, needs ≥1024 for caching`
  );
}
```

---

## Acceptance Criteria

### Phase 1-2: Observability (REQUIRED)
- [ ] `TokenUsage` interface includes `cacheCreationTokens` and `cacheReadTokens`
- [ ] Both streaming and non-streaming handlers capture cache metrics
- [ ] Cache performance logged for each Claude call with format: `[Claude Cache] Hit: X% | Read: N | Write: N | Input: N | Output: N`
- [ ] All DD prompts pass type-checking after interface change

### Phase 3: Data Collection
- [ ] Run at least one DD report after deploying Phase 1-2
- [ ] Document actual cache hit rates observed in Railway logs
- [ ] Decision made on whether Phase 4 is needed

### Phase 4-5: DD Prefix (CONDITIONAL - only if Phase 3 shows no cache hits)
- [ ] DD flow uses `DD_CACHED_PREFIX` instead of `HYBRID_CACHED_PREFIX`
- [ ] `DD_CACHED_PREFIX` contains DD-specific language (verdicts, moats, claim validation)
- [ ] `DD_CACHED_PREFIX` is ≥1,024 tokens to trigger caching
- [ ] Cache hit rate >80% on steps 2-10 of DD chain after deploying

### Quality Gates
- [ ] All DD prompts pass type-checking
- [ ] DD flow runs successfully end-to-end
- [ ] Cache hits confirmed in Railway logs
- [ ] No regression in DD report quality

---

## Files to Modify

### Phase 1-2: Observability (REQUIRED)

| File | Action | Description |
|------|--------|-------------|
| `apps/web/lib/llm/client.ts` | EDIT | Add cache metrics to TokenUsage interface, add logging helper |

### Phase 4-5: DD Prefix (CONDITIONAL)

| File | Action | Description |
|------|--------|-------------|
| `apps/web/lib/llm/prompts/dd/cached-prefix.ts` | CREATE | DD-specific cached prefix (only if Phase 3 shows no cache hits) |
| `apps/web/lib/llm/prompts/dd/index.ts` | EDIT | Export DD_CACHED_PREFIX |
| `apps/web/lib/inngest/functions/generate-dd-report.ts` | EDIT | Replace HYBRID_CACHED_PREFIX → DD_CACHED_PREFIX |

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Cache hit rate (steps 2-10) | Unknown (0%?) | >85% | Logs: `[Claude Cache] Hit: X%` |
| Input tokens per DD report | 217K | <205K | Sum of all step usage (6-7% reduction) |
| Cost per DD report | ~$3.62 | <$3.55 | Calculated via `calculateCost()` |

**Note**: Cache savings are modest (~2-7%) because the cached prefix is small relative to total input.
If Phase 3 shows the current prefix is below 1,024 tokens, consider expanding it for larger savings.

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| DD_CACHED_PREFIX too short | Low | High (no caching) | Validate ≥1024 tokens before deploy |
| Cache invalidation mid-chain | Low | Medium (performance) | 5-min TTL is sufficient for ~3-5 min DD chains |
| Wrong prefix breaks DD quality | Medium | High | Review prefix content carefully; run E2E test |

---

## Implementation Notes

### Why Anthropic's Native Caching Works for DD

1. **Content-based keys**: Anthropic hashes the prompt content to generate cache keys. Identical prefixes = cache hit.

2. **Per-request isolation**: Each DD chain execution has unique user context in the messages, so there's no cross-user data leakage.

3. **5-minute TTL**: DD chains complete in 3-5 minutes, well within the cache window.

4. **Sequential execution**: Each step runs after the previous completes, so no race conditions.

### What We're NOT Doing (Scope Boundaries)

- **NOT** caching AN0-M output cross-request (would require external cache + privacy review)
- **NOT** adding 1-hour TTL (not needed for single-chain execution)
- **NOT** adding cache warming (not enough repeat requests to justify)
- **NOT** modifying Hybrid flow (already working correctly)

---

## References

### Internal References
- `apps/web/lib/llm/client.ts:166-187` - Current caching implementation
- `apps/web/lib/llm/prompts/hybrid/cached-prefix.ts` - Existing hybrid prefix (pattern to follow)
- `apps/web/lib/inngest/functions/generate-dd-report.ts` - DD chain runner
- `todos/152-pending-p2-dd-prompt-caching-optimization.md` - Related TODO

### External References
- [Anthropic Prompt Caching Docs](https://docs.claude.com/en/docs/build-with-claude/prompt-caching)
- [Anthropic Pricing](https://www.anthropic.com/pricing) - Cache reads are 0.1x base price

---

## Effort Estimate

### MVP: Observability (Phase 1-2)

| Phase | Effort | Description |
|-------|--------|-------------|
| Phase 1: Add cache metrics to TokenUsage | 15 min | Update interface, capture metrics |
| Phase 2: Add logging helper | 10 min | Add logCachePerformance function |
| Deploy & verify | 5 min | Push, deploy, check logs |
| **MVP Total** | **~30 min** | |

### Conditional: DD Prefix (Phase 4-5)

| Phase | Effort | Description |
|-------|--------|-------------|
| Phase 4: Create DD prefix | 20 min | Write prefix, update imports |
| Phase 5: Verify token threshold | 10 min | Check ≥1024 tokens |
| Deploy & test | 15 min | Push, deploy, run DD report |
| **Conditional Total** | **~45 min** | |

### Full Implementation

| Scenario | Total Effort |
|----------|--------------|
| If current caching works (MVP only) | ~30 min |
| If DD prefix needed (MVP + conditional) | ~1.25 hours |

---

## Post-Implementation Validation

After deploying, verify in Railway logs:

```
# Expected log pattern for successful caching:
[Claude Cache] Hit: 0.0% | Read: 0 | Write: 1,247 | Uncached: 45,000  # Step 1 (cold)
[Claude Cache] Hit: 85.2% | Read: 1,247 | Write: 0 | Uncached: 215    # Step 2 (warm)
[Claude Cache] Hit: 87.1% | Read: 1,247 | Write: 0 | Uncached: 186    # Step 3 (warm)
...
```

If you see `Hit: 0.0%` for all steps, the cache prefix is either:
- Too short (<1024 tokens)
- Different between steps (content mismatch)
- Not being passed correctly
