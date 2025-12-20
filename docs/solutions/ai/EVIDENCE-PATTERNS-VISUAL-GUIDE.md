# Evidence-Based Prompts: Visual Quick Reference

**At-a-glance pattern guide for prevention strategies**

---

## The Problem → Solution Flow

```
┌─────────────────────────────┐
│   UNVERIFIABLE CLAIMS       │
│ in LLM Analytical Chains    │
└────────┬────────────────────┘
         │
         ▼
    ❌ False novelty assessments
    ❌ Unsourced industry claims
    ❌ Confused gaps with searches
    ❌ Overconfident recommendations
    ❌ No accountability trail
         │
         ▼
┌─────────────────────────────┐
│ 5 CORE PREVENTION           │
│ STRATEGIES                  │
└─────────────────────────────┘
         │
         ├─→ Mandatory Sources
         ├─→ Gap Validation
         ├─→ Antifragile Schemas
         ├─→ Honesty Sections
         └─→ Source Attribution
         │
         ▼
┌─────────────────────────────┐
│   VERIFIABLE OUTPUTS        │
│ with Full Audit Trail       │
└─────────────────────────────┘
         │
         ▼
    ✓ Clear novelty evidence
    ✓ Traceable to sources
    ✓ Honest gaps acknowledged
    ✓ Calibrated confidence
    ✓ Full transparency
```

---

## The 5 Core Strategies at a Glance

### Strategy 1: Mandatory Source Documentation

```
BEFORE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Claim: "No one has tried this approach"
Evidence: (none)
Result: ❌ Unverifiable

AFTER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Claim: "No one has tried this approach"
Evidence:
  ✓ Patents: USPTO 'gravity thermosiphon' → 19 results
  ✓ Literature: IEEE 'counter-current passive' → 43 papers
  ✓ Products: 10 manufacturers reviewed → all active
  ✓ Finding: Zero passive counter-current mechanisms
Result: ✓ Verifiable
```

**Rule**: `No source URL = No claim`

**Implementation**:
```typescript
prior_art_searched: z.array(z.string()),  // Required
what_we_found: z.string(),                // Required
coverage_limitations: z.array(z.string()) // Required
```

---

### Strategy 2: Gap Validation Pattern

```
PROBLEM: Confusing "I didn't search" with "it doesn't exist"

SOLUTION: Explicit gap types

┌──────────────────────────────────────────────────────┐
│                   GAP TYPES                          │
├──────────────────────────────────────────────────────┤
│                                                      │
│  verified_absence                                    │
│  ─────────────────────────────────────              │
│  Searched thoroughly → found nothing                 │
│  Confidence: HIGH ✓✓✓                                │
│  Can claim HIGH novelty ✓                            │
│                                                      │
│  unexplored_area                                     │
│  ─────────────────────────────────────              │
│  Didn't search (admit it)                            │
│  Confidence: LOW ✓                                   │
│  Can NOT claim HIGH novelty ✗                        │
│                                                      │
│  unknown                                             │
│  ─────────────────────────────────────              │
│  Conflicting findings                                │
│  Confidence: MEDIUM ✓✓                               │
│  Can NOT claim HIGH novelty ✗                        │
│                                                      │
└──────────────────────────────────────────────────────┘

Example:
───────

WRONG: "This is novel" (didn't search Chinese patents)
RIGHT: "This is novel based on searches of [databases],
        but we didn't search [Chinese patents] because [reason]"
```

**Implementation**:
```typescript
gap_type: z.enum([
  'verified_absence',   // Can support HIGH novelty
  'unexplored_area',    // Must reduce confidence
  'unknown'             // Increase uncertainty
])
```

---

### Strategy 3: Antifragile Schema Design

```
PRINCIPLE: Graceful degradation, not hard failure

┌──────────────────────────────────────────────┐
│         CONSERVATIVE DEFAULTS                │
├──────────────────────────────────────────────┤
│                                              │
│  Field              Default     Why          │
│  ────────────────────────────────────────   │
│  is_novel:          false       Skeptical   │
│  novelty_level:     moderate    Middle      │
│  confidence:        low         Caution     │
│  gap_type:          unknown     Hmm?        │
│                                              │
│  If data is missing, we assume WORST CASE   │
│  rather than BEST CASE                      │
│                                              │
└──────────────────────────────────────────────┘

EXAMPLE:
────────

BAD:
────
const MySchema = z.object({
  is_novel: z.boolean(),  // CRASHES if no data
  confidence: z.enum(['high', 'medium', 'low'])  // CRASHES
})

GOOD:
─────
const MySchema = z.object({
  is_novel: z.boolean().catch(false),              // Defaults FALSE
  confidence: z.enum([...]).catch('low'),          // Defaults LOW
  evidence_quality: z.enum([...]).catch('minimal'), // Defaults BAD
  has_sources: z.boolean().catch(false)             // Defaults NO
})
```

**Implementation**:
```typescript
// Always use .catch() for novelty claims
genuinely_novel: z.boolean().catch(false),

// Always use .catch() for confidence
confidence: z.enum(['high', 'medium', 'low']).catch('low'),

// Always use .passthrough() to allow extra fields
const MySchema = z.object({...}).passthrough()
```

---

### Strategy 4: Honesty Section Pattern

```
REQUIRED ELEMENTS:

┌─────────────────────────────────────────────────┐
│ SELF-CRITIQUE (MANDATORY)                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ ✓ Strongest argument AGAINST (not strawman)     │
│   └─ Must be 100+ chars, technically specific  │
│                                                 │
│ ✓ Searches we MIGHT have missed (honest gaps)  │
│   └─ Must be specific, explain why skipped     │
│                                                 │
│ ✓ Physics assumptions to VERIFY                │
│   └─ What must be true? How risky?             │
│                                                 │
│ ✓ Domain expert PUSHBACK                       │
│   └─ What would they actually argue?           │
│                                                 │
│ ✓ What WOULD CHANGE our recommendation         │
│   └─ Boundary conditions, invalidation events  │
│                                                 │
└─────────────────────────────────────────────────┘

QUALITY CHECK:
──────────────

BAD:   "Someone might disagree with this"
GOOD:  "A thermal engineer would argue gravity-driven
        systems can't overcome surface tension at
        industrial scales. This is strong because [why].
        Our response: [how we address it]"

BAD:   []  (empty)
GOOD:  [
          {
            search: "Aerospace heat management",
            why_important: "They solved similar problems",
            why_skipped: "Assumed constraints too different",
            impact: "Could provide design precedent"
          }
        ]
```

**Implementation**:
```typescript
// Make self-critique REQUIRED (not optional)
self_critique: SelfCritiqueSchema,  // NOT .optional()

// Enforce substantiveness
strongest_argument_against: z.string()
  .min(100)  // Must be substantial
  .describe('Genuinely strong, not strawman')

// Require gap acknowledgment
prior_art_we_might_have_missed: z.array(
  z.object({
    search_type: z.string(),
    why_important: z.string(),
    why_not_conducted: z.string(),
    impact_if_exists: z.string()
  })
)
```

---

### Strategy 5: Source Attribution Standards

```
CREDIBILITY HIERARCHY:

┌───────────────────────────────────────────────────┐
│  PRIMARY SOURCES (Highest Credibility)            │
├───────────────────────────────────────────────────┤
│  • Peer-reviewed papers (with DOI)                │
│  • Patents (USPTO, WIPO, etc.)                    │
│  • Published standards (ISO, IEEE, etc.)          │
│  • Direct expert communication (with date/name)   │
│  Confidence: HIGH ✓✓✓                             │
└───────────────────────────────────────────────────┘
                        │
┌───────────────────────────────────────────────────┐
│  SECONDARY SOURCES (Medium Credibility)           │
├───────────────────────────────────────────────────┤
│  • Industry reports & market research             │
│  • Product specifications & whitepapers           │
│  • News articles from reputable sources           │
│  • Conference presentations                       │
│  Confidence: MEDIUM ✓✓                            │
└───────────────────────────────────────────────────┘
                        │
┌───────────────────────────────────────────────────┐
│  TERTIARY SOURCES (Lower Credibility)             │
├───────────────────────────────────────────────────┤
│  • General web search results                     │
│  • Blog posts / informal documentation            │
│  • Inferences from other sources                  │
│  Confidence: LOW ✓                                │
│                                                   │
│  ⚠️  Use sparingly, explain reasoning             │
└───────────────────────────────────────────────────┘

EXAMPLE:

Claim:     "Industry standard is X"
Bad:       (no source)
Better:    "Product spec says X" (manufacturer)
Best:      "ISO 12345:2020 specifies X" (standard)
```

**Implementation**:
```typescript
source_type: z.enum([
  'peer_reviewed_paper',
  'patent',
  'industry_data',
  'product_spec',
  'standard',
  'expert_communication',
  'analysis',
  'inference'
])

credibility: z.enum([
  'primary',
  'secondary',
  'tertiary'
])
```

---

## Implementation Decision Tree

```
                    Making Claims?
                         │
                    YES / NO
                    │       │
                   YES      NO
                    │       └──→ Done ✓
                    │
                    ▼
            Analytical claims?
            (novelty, gaps, industry state)
                    │
              YES / NO
              │       │
             YES      NO
              │       └──→ Maybe (use judgment)
              │
              ▼
      Add source documentation requirement
      • prior_art_searched
      • coverage_limitations
      • evidence_quality
                    │
                    ▼
            Is this novelty/gap claim?
                    │
              YES / NO
              │       │
             YES      NO
              │       └──→ Go to validation tests
              │
              ▼
      Add gap_type enum
      • verified_absence
      • unexplored_area
      • unknown
                    │
                    ▼
      Add self-critique section (REQUIRED)
      • strongest_argument_against
      • prior_art_we_might_have_missed
      • assumptions_to_verify
      • domain_expert_pushback
      • what_would_change_recommendation
                    │
                    ▼
      Set conservative defaults
      • is_novel: .catch(false)
      • confidence: .catch('low')
      • novelty_level: .catch('moderate')
                    │
                    ▼
      Run 5 validation tests
      1. Source traceability
      2. Honesty validation
      3. Gap documentation
      4. Confidence calibration
      5. Search specificity
                    │
                    ▼
              All tests pass?
              │        │
             YES       NO
              │        └──→ Fix issues, retry
              │
              ▼
          Ready to Deploy ✓
```

---

## The Testing Framework

```
┌──────────────────────────────────────────────────────┐
│              5 VALIDATION TESTS                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  TEST 1: Source Traceability                         │
│  ──────────────────────────────────────             │
│  ✓ Every novelty claim has sources documented       │
│  ✓ Every gap claim has search results documented    │
│  ✓ No vague sources ("I looked for stuff")         │
│  Result: 100% claims have documented sources        │
│                                                      │
│  TEST 2: Honesty Validation                          │
│  ──────────────────────────────────────             │
│  ✓ Self-critique is substantive (not pro forma)     │
│  ✓ Strongest argument is genuinely strong           │
│  ✓ Search gaps are specific                         │
│  Result: Self-critique passes quality review        │
│                                                      │
│  TEST 3: Gap Documentation                           │
│  ──────────────────────────────────────             │
│  ✓ Each gap is explicitly typed                     │
│  ✓ Verified gaps have search evidence               │
│  ✓ Unexplored areas acknowledged                    │
│  Result: No confused novelty claims from gaps       │
│                                                      │
│  TEST 4: Confidence Calibration                      │
│  ──────────────────────────────────────             │
│  ✓ HIGH confidence = exhaustive searches            │
│  ✓ MEDIUM confidence = thorough searches            │
│  ✓ LOW confidence = limited searches                │
│  Result: No overconfident recommendations           │
│                                                      │
│  TEST 5: Search Specificity                          │
│  ──────────────────────────────────────             │
│  ✓ Searches include database name                   │
│  ✓ Searches include actual queries used             │
│  ✓ Searches document results found                  │
│  Result: All searches are reproducible              │
│                                                      │
└──────────────────────────────────────────────────────┘

AUTOMATED CHECKING:
───────────────────

✓ Can automate: Source presence, gap type, confidence match
✗ Need manual review: Honesty substantiveness, search specificity
```

---

## Metrics to Track

```
┌─────────────────────────────────────────────────────┐
│        WEEKLY METRICS DASHBOARD                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Metric                    Target   Current   △    │
│  ────────────────────────────────────────────────  │
│  % Claims with Sources     100%     ___%    ─     │
│  Avg Searches/Concept      3+       __      ─     │
│  Honesty QA Pass Rate      100%     ___%    ─     │
│  Unsourced Claims (feedback) 0      __      ─     │
│  Validation Time (<5 min)   --      __ min  ─     │
│                                                     │
└─────────────────────────────────────────────────────┘

INTERPRETATION:
───────────────

Green (✓):  All metrics in target range
Yellow (△): One metric below target → address
Red (✗):    Multiple metrics below target → redesign
```

---

## Quick Troubleshooting

```
PROBLEM 1: LLM doesn't provide sources
──────────────────────────────────────
Symptom:  prior_art_searched field empty
Root:     Prompt doesn't demand sources
Fix:      Add "RULE: No source URL = no claim"


PROBLEM 2: Self-critique is weak
────────────────────────────────
Symptom:  "I think this is good"
Root:     Prompt lacks guidance
Fix:      Require 100+ chars + 2+ sentences


PROBLEM 3: Novelty claims from unexplored areas
──────────────────────────────────────────────
Symptom:  HIGH novelty despite limited searches
Root:     No gap_type distinction
Fix:      Add gap_type enum, enforce mapping


PROBLEM 4: False confidence
───────────────────────────
Symptom:  "Must pursue" without evidence
Root:     No confidence calibration
Fix:      Link confidence to search_depth


PROBLEM 5: Unsourced estimates
──────────────────────────────
Symptom:  "~$50K" (no justification)
Root:     Numbers treated as claims
Fix:      Require source for all numbers
```

---

## Three Quick Implementation Paths

```
FAST TRACK (2 hours):
────────────────────
1. Read: Quick checklist
2. Add: One source field to schema
3. Test: Run 3 outputs
4. Deploy: Monitor for 1 week


STANDARD TRACK (4-6 hours):
──────────────────────────
1. Read: Full prevention guide
2. Design: Full schema with all patterns
3. Test: Run all 5 tests
4. Deploy: Use deployment checklist


DEEP TRACK (1 day):
──────────────────
1. Study: All three documentation files
2. Implement: Custom patterns for your domain
3. Create: Template prompts for org
4. Coach: Team training sessions
```

---

## Key Takeaway

```
┌──────────────────────────────────────────┐
│  NO SOURCE URL = NO CLAIM                │
│                                          │
│  This is the foundation of everything.   │
│  Everything else is implementation       │
│  details and refinement.                 │
│                                          │
│  If you do one thing:                    │
│  Make this rule absolute in prompts.     │
└──────────────────────────────────────────┘
```

---

**Version**: 1.0
**Type**: Visual Reference Guide
**For**: Quick understanding of concepts
**Read Time**: 10-15 minutes
