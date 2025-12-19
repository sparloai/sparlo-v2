---
status: pending
priority: p2
issue_id: "063"
tags: [code-review, architecture, prompts, discovery-mode]
dependencies: []
---

# Hardcoded GPU Thermal Data in Discovery Prompts

## Problem Statement

The discovery prompt chain has GPU thermal management examples hardcoded directly in the prompt file (`an0-d-problem-framing.ts`). This makes Discovery Mode GPU-specific despite being presented as a general-purpose feature. Adding new domains requires code changes.

## Findings

**From architecture-strategist and pattern-recognition-specialist:**

**Hardcoded Data:**
```typescript
// an0-d-problem-framing.ts lines 14-78
export const GPU_THERMAL_EXCLUSIONS = {
  conventional_approaches: [
    'Air cooling with heatsinks and fans',
    'Direct-to-chip liquid cooling with cold plates',
    // ... 8 hardcoded items
  ],
  industry_domains_to_exclude: [
    'Aerospace thermal (widely explored)',
    // ... 7 hardcoded items
  ],
};

export const GPU_THERMAL_DISCOVERY_TERRITORIES = {
  biology: ['Countercurrent heat exchange...'],
  geology: ['Geothermal gradients...'],
  // ... domain-specific hardcoded examples
};
```

**Impact:**
- Discovery Mode only works well for GPU thermal problems
- Cannot handle different problem domains without code changes
- ~2,000 extra tokens in every AN0-D prompt
- Technical debt marker: comment says "to be generalized later"

## Proposed Solutions

### Option A: Move to Configuration File (Recommended)
Create a configuration system for domain knowledge:

```typescript
// apps/web/config/discovery-domains.config.ts
export const DISCOVERY_DOMAINS = {
  gpu_thermal: {
    exclusions: { conventional_approaches: [...], industry_domains: [...] },
    territories: { biology: [...], geology: [...] },
  },
  // Add more domains as needed
};
```

Then inject dynamically based on problem classification.

**Pros:** Easy to add domains, no code changes needed
**Cons:** Still requires domain classification logic
**Effort:** Medium (4-6 hours)
**Risk:** Low

### Option B: Database-Driven Domain Knowledge
Store domain knowledge in database tables:

```sql
CREATE TABLE discovery_domain_knowledge (
  domain_type text,
  category text,
  items jsonb
);
```

**Pros:** Most flexible, admin-editable
**Cons:** More complex, requires UI for management
**Effort:** High (8-10 hours)
**Risk:** Medium

### Option C: Remove Domain-Specific Examples
Make prompts truly generic, letting LLM determine relevant domains.

**Pros:** Simpler, more general
**Cons:** May reduce discovery quality for specific domains
**Effort:** Low (2-3 hours)
**Risk:** Medium (quality impact)

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected Files:**
- `apps/web/lib/llm/prompts/discovery/an0-d-problem-framing.ts`
- New: `apps/web/config/discovery-domains.config.ts`

**Components:** None

**Database Changes:** Option B only

## Acceptance Criteria

- [ ] Domain knowledge moved out of prompt file
- [ ] Easy to add new domains without code changes
- [ ] Prompts can dynamically select relevant domain
- [ ] No increase in prompt token count for generic problems
- [ ] Discovery quality maintained for thermal problems

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | Identified during code review |

## Resources

- PR: Discovery Mode commit f8b0587
- File: `an0-d-problem-framing.ts:14-78`
