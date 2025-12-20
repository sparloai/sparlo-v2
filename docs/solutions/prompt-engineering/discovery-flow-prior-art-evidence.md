---
title: "Discovery Flow Prior Art Search - Evidence Requirements"
category: prompt-engineering
tags:
  - discovery
  - prior-art
  - serpapi
  - evidence-based
  - llm-prompts
  - antifragile-schemas
component: discovery-flow
severity: enhancement
symptoms: "LLM making unsubstantiated claims about prior art without source citations"
status: documented
created_at: 2025-12-19
---

## Problem

LLMs in the discovery flow were making claims about industry state, prior art, and gaps without citing sources. This led to unverifiable assertions in discovery reports that clients couldn't trust or validate.

**Example of problematic output:**
```
"The industry uses vapor chambers for thermal management"
```
No source. No way to verify. No way to challenge.

## Solution

Implemented mandatory source citation patterns across all 4 discovery prompt files with the enforcing rule:

> **"RULE: No source URL = no claim. Every factual assertion about industry state, prior art, or gaps must cite where you found it."**

## Files Modified

| File | Enhancement |
|------|-------------|
| `an0-d-problem-framing.ts` | Added `industry_landscape` with search tracking |
| `an1.7-d-literature-gaps.ts` | Added `search_evidence` for gap validation |
| `an4-d-evaluation.ts` | Added `prior_art_search_documentation` per concept |
| `an5-d-report.ts` | Added `prior_art_search_evidence` required section |

## Key Additions

### AN0-D: Industry Landscape

```typescript
"industry_landscape": {
  "searches_executed": [
    {"query": "exact query", "top_results": ["title + URL"], "key_finding": "insight"}
  ],
  "active_players": [
    {"entity": "Company", "approach": "what they do", "source": "URL", "why_excluded": "reason"}
  ],
  "market_state": "summary based on search results",
  "search_gaps": ["areas with few/no results"]
}
```

### AN1.7-D: Search Evidence

```typescript
"search_evidence": {
  "searches_executed": [
    {"query": "query", "results_count": 5, "key_findings": "...", "source_urls": ["URL1"]}
  ],
  "gap_evidence": [
    {"claimed_gap": "...", "search_query": "...", "results_summary": "...", "conclusion": "..."}
  ],
  "abandonment_citations": [
    {"approach": "...", "original_source": "URL", "abandonment_evidence": "URL or 'unknown'"}
  ]
}
```

### AN4-D: Per-Concept Prior Art

```typescript
"prior_art_search_documentation": {
  "searches_executed": [{"query": "...", "results_found": "...", "source_urls": ["URL"]}],
  "prior_art_findings": "Found X doing Y. Source: [URL]",
  "closest_existing_work": {"description": "...", "source": "URL", "how_this_differs": "..."},
  "novelty_verdict": "GENUINELY_NOVEL | PARTIALLY_EXPLORED | ALREADY_PURSUED",
  "verdict_evidence": "0 of 5 searches returned relevant prior art"
}
```

### AN5-D: Complete Evidence Section

```typescript
"prior_art_search_evidence": {
  "industry_landscape_searches": [{"search_query": "...", "top_finding": "...", "implication": "..."}],
  "gap_validation_searches": [{"claimed_gap": "...", "search_query": "...", "results": "...", "conclusion": "..."}],
  "concept_prior_art_checks": [{"concept": "D-01", "key_search": "...", "finding": "...", "novelty_status": "..."}],
  "searches_not_run": {
    "acknowledged_gaps": ["Did not search USPTO directly"],
    "recommended_client_verification": ["specific searches to run"]
  }
}
```

## Antifragile Schema Patterns

All schemas use defensive patterns for resilient rendering:

```typescript
// Pattern 1: Fallback to empty array
z.array(z.string()).catch([])

// Pattern 2: Optional fields
z.string().optional()

// Pattern 3: Enum with safe default
z.enum(['GENUINELY_NOVEL', 'PARTIALLY_EXPLORED', 'ALREADY_PURSUED'])
  .catch('PARTIALLY_EXPLORED')

// Pattern 4: Allow extra LLM fields
.passthrough()
```

## Novelty Verdict Rules

| Verdict | Evidence Required |
|---------|-------------------|
| `GENUINELY_NOVEL` | 0 of 5+ searches returned relevant prior art |
| `PARTIALLY_EXPLORED` | Found citation but differs in specific way |
| `ALREADY_PURSUED` | Found entity actively working on this with URL |

## Prevention Strategies

1. **New prompt chains**: Always include source citation requirements
2. **Schema design**: Use `.optional()`, `.catch([])`, `.passthrough()` patterns
3. **Honesty sections**: Include "what we didn't search" acknowledgments
4. **Validation**: Check that claimed gaps have search evidence

## Checklist for Future Prompts

- [ ] Add "No source URL = no claim" rule
- [ ] Include `searches_executed` tracking
- [ ] Require source URLs for entity/company claims
- [ ] Add honesty section for acknowledged limitations
- [ ] Make schemas antifragile with fallback patterns

## Related Files

- `/apps/web/lib/llm/prompts/discovery/an0-d-problem-framing.ts`
- `/apps/web/lib/llm/prompts/discovery/an1.7-d-literature-gaps.ts`
- `/apps/web/lib/llm/prompts/discovery/an4-d-evaluation.ts`
- `/apps/web/lib/llm/prompts/discovery/an5-d-report.ts`

## Commit

`8d61cb7` - feat(discovery): add prior art search documentation requirements
