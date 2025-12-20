# Evidence-Based LLM Prompts: Prevention Strategy System

**Complete Solution Documentation**

This directory contains a comprehensive system for preventing unverifiable claims in LLM prompt chains through mandatory source documentation, antifragile schema design, and rigorous validation patterns.

---

## Problem Statement

**The Issue**: LLMs naturally produce plausible claims without verification, leading to:
- Unsubstantiated assertions about industry state, prior art, or novelty
- Overconfidence without acknowledging research gaps
- Mixed verified and unverified information
- No accountability trail for claims

**The Cost**: Wasted exploration, damaged credibility, failed downstream decisions

**The Solution**: Mandatory source documentation + antifragile schemas + enforced self-critique

---

## Documentation Map

### 1. Prevention Strategies Guide (Start Here)
**File**: `prevention-strategies-evidence-based-prompts.md`

The comprehensive reference manual covering:
- Core prevention strategies (5 core patterns)
- Best practices for evidence-based prompts
- Testing & validation guidance (5 concrete tests)
- Pattern implementation examples
- Metrics to track

**Use this when**: You're designing a new prompt chain and want complete guidance.

**Key Sections**:
- Strategy 1: Mandatory Source Documentation
- Strategy 2: Gap Validation Pattern
- Strategy 3: Antifragile Schema Design
- Strategy 4: Honesty Section Pattern
- Strategy 5: Source Attribution Standards

---

### 2. Quick Reference Checklist
**File**: `evidence-based-prompt-checklist.md`

Practical 5-minute checklist for:
- Pre-implementation planning
- Per-prompt checklist
- Testing before launch
- Post-deployment monitoring

**Use this when**: You're actively implementing evidence requirements.

**Key Sections**:
- 5-Minute Risk Assessment
- Phase 1-4 Implementation Checklists
- Common Failure Modes (and fixes)
- Prompts to use in your LLM
- Metrics Dashboard

---

### 3. Schema Pattern Reference
**File**: `evidence-based-schema-patterns.md`

Reusable Zod schema patterns and code templates:
- Core patterns (source documentation, graceful degradation)
- Novelty claim patterns (conservative assessment, gap validation)
- Self-critique patterns (complete critique schema)
- Complete working examples
- Validation helpers (ready-to-use functions)

**Use this when**: You're writing code and need concrete patterns.

**Key Sections**:
- Pattern 1: Source Documentation Schema
- Pattern 2: Evidence-Based Claim Schema
- Pattern 3: Graceful Degradation
- Complete working examples
- Validation helper functions

---

## Quick Start: 3 Implementation Paths

### Path A: Quick Implementation (1-2 hours)
For teams wanting to add evidence requirements to ONE existing prompt:

1. Read: `evidence-based-prompt-checklist.md` → Phase 2
2. Copy: Schema pattern from `evidence-based-schema-patterns.md`
3. Add: "No source URL = no claim" rule to prompt
4. Test: Run 3 sample outputs against source traceability test
5. Launch: Monitor for 1 week

### Path B: Comprehensive Implementation (Half day)
For teams building a NEW prompt chain with evidence requirements baked in:

1. Read: `prevention-strategies-evidence-based-prompts.md` → Core Strategies
2. Plan: `evidence-based-prompt-checklist.md` → Phase 1
3. Design: Schema patterns + full examples from pattern reference
4. Build: Implement all 5 tests from testing section
5. Deploy: Use deployment checklist + monitoring metrics

### Path C: Deep Mastery (Full day)
For architects designing the next generation of analytical LLM chains:

1. Read: All three documents in order
2. Study: Pattern implementations + examples
3. Design: Custom patterns for your domain
4. Create: Template prompts for your organization
5. Coach: Team members using the complete framework

---

## The Five Core Prevention Strategies

### 1. Mandatory Source Documentation

```
RULE: No source URL = no claim

Every factual assertion must cite:
- Where you searched
- What you found
- What you didn't search (and why)
```

**Implementation**: Add `prior_art_searched` and `coverage_limitations` fields to schema.

**Benefit**: Creates audit trail; forces LLM to document methodology.

---

### 2. Gap Validation Pattern

```
Distinguish:
- Verified Absence (we searched, found nothing) ✓
- Unexplored Area (we didn't search, admit it) ✓
- Unverified Claim (we didn't search, pretend we did) ✗
```

**Implementation**: Add `gap_type` enum to distinguish gap sources.

**Benefit**: Prevents false novelty claims from search gaps.

---

### 3. Antifragile Schema Design

```
Instead of hard failures on missing data:
- Default conservatively (novelty = false)
- Capture what's available (.passthrough())
- Flag incompleteness (.catch())
```

**Implementation**: Use `.catch()` for defaults, `.passthrough()` for flexibility.

**Benefit**: Graceful degradation; partial evidence is better than rejection.

---

### 4. Honesty Section Pattern

```
Make self-critique REQUIRED and substantive:
- Strongest counter-argument (not strawman)
- Searches we should have run (specific gaps)
- Assumptions we're making (physics to verify)
- Conditions that invalidate recommendation
```

**Implementation**: Make self-critique schema required (not optional).

**Benefit**: Forces adversarial thinking; surfaces blind spots.

---

### 5. Source Attribution Standards

```
Define what sources look like:
- Peer-reviewed papers (high credibility)
- Patents (medium credibility)
- Industry data (medium credibility)
- Inferences (low credibility)
```

**Implementation**: Add source type enum + credibility assessment.

**Benefit**: Distinguishes verified facts from educated guesses.

---

## Integration with Discovery Flow

These patterns are currently implemented in Sparlo's Discovery Mode (AN0-D through AN5-D):

### Where Evidence Requirements Are Enforced

**AN1.7-D (Literature Gaps)**
- Identifies gaps in literature
- Documents searches conducted
- Acknowledges search limitations

**AN4-D (Evaluation)**
- Verifies novelty claims from AN3-D
- Documents what was checked
- Flags uncertain assertions

**AN5-D (Report Generation)**
- Re-verifies novelty with additional searches
- Synthesizes evidence chain
- Includes mandatory self-critique

### Key Files

```
apps/web/lib/llm/prompts/discovery/
├── an1.7-d-literature-gaps.ts      # Gap analysis with source docs
├── an4-d-evaluation.ts              # Novelty verification
└── an5-d-report.ts                  # Final report with self-critique

apps/web/lib/inngest/functions/
└── generate-discovery-report.ts     # Chain orchestration

docs/solutions/ai/
├── prompt-engineering-patterns.md   # General patterns
└── discovery-mode.md                # Discovery-specific patterns
```

---

## Testing Framework

### 5 Concrete Tests Provided

1. **Source Traceability Test** - Every claim has documented sources
2. **Honesty Validation Test** - Self-critique is substantive
3. **Gap Documentation Test** - Gaps properly characterized
4. **Confidence Calibration Test** - Confidence matches evidence
5. **Search Specificity Test** - Searches are reproducible

**How to Use**:
1. Copy test code from prevention strategies guide
2. Run on sample outputs
3. Use as part of deployment gating
4. Track results over time

---

## Metrics to Track

### Quality Metrics (Weekly)

| Metric | Target | What It Means |
|--------|--------|---------------|
| % claims with sources | 100% | Complete evidence documentation |
| Avg searches per concept | 3+ | Reasonable search depth |
| Honesty sections passing QA | 100% | Substantive self-critique |
| Unsourced claims in feedback | 0 | Zero downstream complaints |
| Time to validate claim | <5 min | Evidence is clear and accessible |

### Implementation Metrics (Per Deployment)

| Metric | What It Indicates |
|--------|------------------|
| Schema version | Consistency across team |
| Test pass rate | Quality of evidence provided |
| Coverage gaps admitted | Intellectual honesty |
| Recommendation downgrades due to uncertainty | Proper calibration |

---

## Common Patterns

### Pattern: Conservative Novelty Defaults

```typescript
// Always default to FALSE (conservative)
genuinely_novel: z.boolean().catch(false),

// Rank down by default
novelty_level: z.enum([...]).catch('moderate'),

// Require HIGH searches for HIGH claims
if (novelty_level === 'breakthrough') {
  must have search_depth: 'exhaustive'
}
```

**Why**: Prevents overconfident innovation claims.

---

### Pattern: Explicit Gap Types

```typescript
gap_type: z.enum([
  'verified_absence',   // Searched → found nothing
  'unexplored_area',    // Didn't search
  'unknown'             // Can't tell
]),

// Then enforce: Can't claim HIGH novelty from unexplored area
```

**Why**: Forces honest distinction between "no prior art" and "didn't search."

---

### Pattern: Search Completeness Flag

```typescript
coverage_limitations: z.array(z.object({
  not_searched: z.string(),
  why_not: z.string(),
  impact: z.enum(['critical', 'major', 'minor'])
}))

// Always be honest about what you didn't search
```

**Why**: Acknowledges incompleteness prevents false confidence.

---

## FAQ

**Q: Does this slow down LLM outputs?**
A: No. It adds structure, not extra calls. One additional field in schema adds ~100 tokens.

**Q: Can we use this with all LLM models?**
A: Yes. Works with Claude, GPT-4, Gemini, etc. Patterns are model-agnostic.

**Q: What if we can't get perfect evidence?**
A: That's the point. Admit it. "Limited search" is better than false novelty.

**Q: How do we handle proprietary research?**
A: Add it to coverage_limitations: "Did not search: proprietary research (not publicly available)."

**Q: Can we skip self-critique on simple claims?**
A: No. Even "simple" claims need critique. This forces thorough thinking.

**Q: How do we train LLMs to follow these patterns?**
A: Include examples in prompt. Show good vs. bad self-critique. Use schema validation as enforcement.

---

## Troubleshooting

### Problem: LLM Doesn't Provide Sources

**Symptom**: `prior_art_searched` field is empty

**Root Cause**: Prompt doesn't clearly demand sources

**Fix**:
```
Add to prompt:
RULE: No source URL = no claim.
Every factual assertion must cite where you found it.
Show your work: database name, search terms, results found.
```

### Problem: Self-Critique is Pro Forma

**Symptom**: "I've considered this and think it's good"

**Root Cause**: Prompt not requiring substantive critique

**Fix**:
```
Require SPECIFIC weaknesses:
- Make strongest_argument_against 100+ characters
- Reference actual physics/domain concerns
- Provide our response to each concern
```

### Problem: Gap Analysis Conflates "Not Found" with "Doesn't Exist"

**Symptom**: Claims gap when actually just didn't search

**Root Cause**: No gap_type distinction

**Fix**:
```
Add gap_type enum:
- verified_absence (searched thoroughly)
- unexplored_area (didn't search - admit it)
- unknown (can't tell)

Then: Only claim HIGH novelty from verified_absence
```

---

## Next Steps

### For Teams Starting Out
1. Read the quick reference checklist
2. Pick ONE prompt to update
3. Add source documentation requirement
4. Test on 3 outputs
5. Deploy and monitor

### For Teams at Scale
1. Create evidence-based prompt template
2. Train all prompt engineers
3. Add automated testing to deployment pipeline
4. Track metrics dashboard
5. Iterate based on user feedback

### For Research/Advanced Use
1. Design custom patterns for your domain
2. Create reusable schema library
3. Develop automated source verification
4. Integrate with knowledge bases
5. Publish patterns for community

---

## Related Documentation

### Foundational Patterns
- `docs/solutions/ai/prompt-engineering-patterns.md` - General prompt patterns
- `docs/solutions/features/discovery-mode.md` - Discovery flow architecture

### Implementation Files
- `/apps/web/lib/llm/prompts/discovery/` - Actual implementations
- `/apps/web/lib/inngest/functions/generate-discovery-report.ts` - Chain orchestration

### Validation & Testing
- Run tests from `prevention-strategies-evidence-based-prompts.md`
- Use schemas from `evidence-based-schema-patterns.md`
- Follow deployment checklist from `evidence-based-prompt-checklist.md`

---

## Contributing

When adding new evidence-based prompts:

1. Start with the 5 core strategies
2. Use provided schema patterns
3. Include all 5 validation tests
4. Document gap limitations explicitly
5. Track metrics for 4 weeks
6. Share learnings with team

---

## Summary

The prevention strategy system consists of:

1. **5 Core Strategies**: Source docs, gap validation, antifragile schemas, honesty sections, source attribution
2. **3 Implementation Guides**: Full reference, quick checklist, code patterns
3. **5 Validation Tests**: Traceability, honesty, gaps, calibration, specificity
4. **5 Key Metrics**: Source coverage, searches, honesty rate, unsourced claims, validation time

Together, these ensure that LLM-generated analytical outputs are:
- **Verifiable**: Every claim traces back to documented evidence
- **Humble**: Gaps in knowledge are explicitly acknowledged
- **Calibrated**: Confidence matches evidence quality
- **Actionable**: Users know what was verified vs. what's uncertain
- **Trustworthy**: No hidden hallucinations behind plausible language

---

**Version**: 1.0
**Created**: 2025-12-19
**Updated**: 2025-12-19
**Status**: Complete, Ready for Implementation
**Author**: Sparlo Engineering Team

## Quick Links

- Full prevention strategies guide: `prevention-strategies-evidence-based-prompts.md`
- Implementation checklist: `evidence-based-prompt-checklist.md`
- Code patterns reference: `evidence-based-schema-patterns.md`
