# SPARLO Frontier Section Overhaul (Simplified)

## Overview

Add web search for current frontier intelligence. Keep schema changes minimal - frontier section header is a UI/rendering concern, not a schema restructuring.

## Approach

Based on review feedback, we're taking the minimal path:
- **Keep** `frontier_watch` nested in `innovation_portfolio` (semantic sense)
- **Add** 2-3 optional fields to existing `FrontierWatchSchema` for web search findings
- **Add** simple web search instruction to AN5-M prompt
- **Defer** structural changes to frontend redesign phase

## Current State

### Current Schema (schemas.ts:1185-1202)
```typescript
export const FrontierWatchSchema = z.object({
  id: z.string(),
  title: z.string(),
  one_liner: z.string(),
  innovation_type: PortfolioInnovationType,
  source_domain: z.string(),
  why_interesting: z.string(),
  why_not_now: z.string(),
  trigger_to_revisit: z.string(),
  who_to_monitor: z.string(),
  earliest_viability: z.string(),
}).passthrough();
```

This schema is already good. We just need to enhance it slightly for web search findings.

---

## Implementation Plan

### Phase 1: Schema Enhancement (Minimal)

**File**: `apps/web/lib/llm/prompts/hybrid/schemas.ts`

Add 3 optional fields to `FrontierWatchSchema`:

```typescript
export const FrontierWatchSchema = z.object({
  id: z.string(),
  title: z.string(),
  one_liner: z.string(),
  innovation_type: PortfolioInnovationType,
  source_domain: z.string(),
  why_interesting: z.string(),
  why_not_now: z.string(),
  trigger_to_revisit: z.string(),
  who_to_monitor: z.string(),
  earliest_viability: z.string(),

  // NEW: Web search enhanced fields
  recent_developments: z.string().optional()
    .describe('Recent news, papers, or announcements from web search'),
  trl_estimate: z.number().min(1).max(9).optional()
    .describe('Technology Readiness Level if determinable'),
  competitive_activity: z.string().optional()
    .describe('Who else is working on this, recent moves'),
}).passthrough();
```

**Changes**: +3 optional fields, no structural changes, no new schemas.

---

### Phase 2: AN5-M Prompt Update

**File**: `apps/web/lib/llm/prompts/hybrid/prompts.ts`

Add simple web search instruction to AN5-M prompt (after innovation_concepts section):

```typescript
## FRONTIER INTELLIGENCE (Web Search Enhanced)

For the frontier_watch items in innovation_concepts, use web search to enhance with current information:

- Search for recent developments, announcements, and research activity
- Identify specific researchers and labs to monitor
- Assess competitive landscape and market timing
- Estimate Technology Readiness Level where possible

Populate the optional fields:
- recent_developments: Key findings from web search
- trl_estimate: 1-9 scale if you can determine it
- competitive_activity: Who's working on this, recent moves

If web search returns limited results, that's fine - leave optional fields empty and rely on literature analysis.
```

**Changes**: ~15 lines of prompt addition, simple instruction.

---

### Phase 3: Export Updates (If Needed)

**File**: `apps/web/lib/llm/prompts/hybrid/index.ts`

No new exports needed - `FrontierWatchSchema` and `FrontierWatch` type already exported.

---

## What We're NOT Doing

Based on review feedback, explicitly avoiding:

1. ~~Moving frontier_watch to top-level~~ - UI concern, handle in rendering
2. ~~4 new schemas~~ - Over-engineered
3. ~~Nested researcher/lab arrays~~ - Simple strings suffice
4. ~~data_freshness object~~ - Redundant metadata
5. ~~Schema versioning~~ - YAGNI
6. ~~Migration strategy~~ - Not needed for optional field additions
7. ~~Hard-coded search query templates~~ - Trust the LLM

---

## Frontend Note

The frontier section getting its own header is a **rendering decision**:

```typescript
// Frontend can render frontier_watch with dedicated header
// without any schema changes:
<Section title="Frontier Intelligence">
  {report.innovation_concepts.frontier_watch.map(item => (
    <FrontierWatchCard key={item.id} item={item} />
  ))}
</Section>
```

This will be addressed in the frontend redesign phase.

---

## Testing Checklist

- [ ] Schema validation passes with new optional fields
- [ ] AN5-M generates frontier_watch with web search data when available
- [ ] Empty optional fields don't break validation
- [ ] TypeScript types updated via typegen
- [ ] Typecheck passes

---

## Files to Modify

1. `apps/web/lib/llm/prompts/hybrid/schemas.ts` - Add 3 optional fields to FrontierWatchSchema
2. `apps/web/lib/llm/prompts/hybrid/prompts.ts` - Add ~15 lines to AN5-M prompt

**Total changes**: ~20 lines across 2 files.

---

## Success Criteria

1. Frontier watch items include recent web search findings when available
2. TRL estimates provided where determinable
3. Competitive activity captured
4. No breaking changes to existing reports
5. Schema stays simple and extensible for future frontend work
