---
status: pending
priority: p1
issue_id: "146"
tags: [performance, dd-mode, token-usage, cost-reduction, critical]
dependencies: []
---

# DD Mode v2: Exponential Context Growth via JSON Serialization

## Problem Statement

The chain uses `JSON.stringify()` 32 times to pass outputs between steps. Each step receives ALL previous outputs serialized as JSON in the context message. This creates O(n²) growth in token consumption, pushing DD3.5-M to 100% of the 250K token budget with no headroom for variance.

## Findings

**Location:** `/apps/web/lib/inngest/functions/generate-dd-report.ts` (multiple locations)

**Token consumption analysis:**
```
DD0-M:   ~5K tokens (initial extraction)
AN0-M:   ~8K tokens (includes DD0 output)
AN1.5-M: ~12K tokens
AN1.7-M: ~18K tokens
AN2-M:   ~25K tokens
AN3-M:   ~32K tokens
DD3-M:   ~45K tokens (includes 6 previous outputs)
DD3.5-M: ~52K tokens ← At edge of budget
DD4-M:   ~68K tokens
DD5-M:   ~85K tokens input alone
─────────────────
Total:   192-262K tokens (77-105% of 250K budget!)
```

**Compounding issues:**
- Pretty-printing (`null, 2`) adds 25-30% overhead
- DD5-M receives 230KB of JSON context (~58K tokens just for context)
- DD3.5-M addition pushed chain to edge of budget
- No headroom for complex startups or variance

**Cost impact:**
- Current: ~$12-15 per report
- With 200% larger outputs: $18-24 per report
- Potential savings with fix: 40-60% reduction

## Proposed Solutions

### Option A: Selective Context Extraction (Recommended)
- Pass only required fields, not entire outputs
- Extract summaries for downstream steps
- Pros: 60-75% token reduction, maintains quality
- Cons: Requires careful field selection
- Effort: Medium (4-6 hours)
- Risk: Low

### Option B: Remove Pretty-Printing
- Use `JSON.stringify(obj)` instead of `JSON.stringify(obj, null, 2)`
- Pros: Quick win, 20-25% reduction
- Cons: Smaller impact
- Effort: Low (30 minutes)
- Risk: Low

### Option C: Progressive Summarization
- Automatically compress context when approaching budget
- Use summaries when budget tight
- Pros: Adaptive, handles variance
- Cons: May lose detail
- Effort: High (8+ hours)
- Risk: Medium

## Recommended Action

[To be filled during triage]

## Acceptance Criteria

- [ ] Context messages reduced by 60% or more
- [ ] Token consumption under 200K baseline
- [ ] Report quality unchanged (spot check)
- [ ] DD5-M receives structured summaries, not full JSONs
- [ ] Budget headroom of 20% for variance
- [ ] Cost per report reduced to $7-9

## Technical Details

**Affected files:**
- `apps/web/lib/inngest/functions/generate-dd-report.ts`

**Example selective extraction:**
```typescript
// BAD (Current): Full serialization
const contextMessage = `## DD0 Output
${JSON.stringify(dd0Result.result, null, 2)}`;

// GOOD: Selective extraction
const contextMessage = `## DD0 Commercial Assumptions
${dd0Result.result.commercial_assumptions.map(a =>
  `- ${a.assumption} (${a.category}, Priority: ${a.validation_priority})`
).join('\n')}

## DD3 Technical Validation Summary
Overall: ${dd3Result.result.validation_summary.overall_technical_assessment}
Key Concern: ${dd3Result.result.validation_summary.key_concern}`;
```

## Work Log

### 2026-01-03 - Issue Created

**By:** Claude Code

**Actions:**
- Identified during DD Mode v2 performance review
- Analyzed token consumption by step
- Calculated 40-60% potential savings

**Learnings:**
- JSON serialization compounds quadratically across chain steps
- LLM prompts should use minimal, targeted context
- Pretty-printing is expensive with no benefit for LLM
