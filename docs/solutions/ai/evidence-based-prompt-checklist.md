# Evidence-Based Prompt Development Checklist

**Quick Reference Guide**

Practical checklist for developing and deploying prompts that produce verifiable, evidence-supported outputs. Use this alongside the full prevention strategies guide.

---

## Quick Start: 5-Minute Assessment

Does your prompt make claims that could be hallucinated?

- [ ] Makes statements about industry practice or state
- [ ] Discusses prior art, patents, or research
- [ ] Identifies gaps or missing solutions
- [ ] Provides data, statistics, or quantified claims
- [ ] Recommends actions based on analysis

**If ANY box is checked**: You need evidence requirements.

---

## Phase 1: Planning (Before Writing Prompts)

### Identify the Risk

- [ ] What false claims would be most harmful?
  - Example: "No one has researched this" when they have
  - Example: "Industry standard is X" when it's not

- [ ] What downstream decisions depend on this claim?
  - Will users invest money based on this output?
  - Will users cite this in presentations or proposals?

- [ ] What type of evidence would validate this claim?
  - Patent databases? Literature? Industry contacts?
  - Market research? Product analysis?

### Define Evidence Standards

- [ ] What counts as a valid source?
  - [ ] Peer-reviewed papers?
  - [ ] Patents?
  - [ ] Industry reports?
  - [ ] Product specifications?
  - [ ] News articles?
  - [ ] Direct communication?

- [ ] What search scope is required?
  - [ ] English-language only? Or all languages?
  - [ ] Date range? (Last 5 years? All time?)
  - [ ] Geographic scope?

- [ ] What's your "bar for novelty"?
  - [ ] Must search 3+ databases? Which?
  - [ ] Must contact 5 experts? Who?
  - [ ] Patent search required?

### Design the Honesty Section

- [ ] What gaps will you acknowledge?
  - [ ] Searches we didn't run?
  - [ ] Assumptions we made?
  - [ ] Expertise we lack?

- [ ] How will you flag uncertainty?
  - [ ] Confidence levels? (HIGH / MEDIUM / LOW)
  - [ ] Completeness markers?
  - [ ] Unverified assumptions?

---

## Phase 2: Implementation (Writing Prompts)

### Add Evidence Rule to Prompt

- [ ] Include: "No source URL = no claim"
- [ ] Define what types of sources are valid
- [ ] Show examples of what good sources look like

```
## EVIDENCE REQUIREMENTS

RULE: Every claim about industry, prior art, or gaps must cite a source.

Valid sources:
- "Patent search: [query] (USPTO, Google Patents)" ✓
- "Literature: [papers found] (IEEE Xplore, ResearchGate)" ✓
- "Market research: [methodology] (analyst firms)" ✓
- "This makes sense, so probably true" ✗

Invalid:
- Claims without sources ✗
- Speculation presented as fact ✗
```

### Design Output Schema

- [ ] Add `prior_art_searched` field (array of search descriptions)
  ```typescript
  prior_art_searched: z.array(z.string()),  // ["Patent search: X", "Literature: Y"]
  ```

- [ ] Add `what_we_found` field (actual results, not claims)
  ```typescript
  what_we_found: z.string(),  // "Found 12 patents, 0 on our specific approach"
  ```

- [ ] Add `coverage_limitations` field (what we didn't search)
  ```typescript
  coverage_limitations: z.array(z.string()),  // ["Chinese patents not searched", "Private research not available"]
  ```

- [ ] Add `evidence_completeness` marker
  ```typescript
  evidence_quality: z.enum(['comprehensive', 'good', 'limited', 'minimal']).catch('limited'),
  ```

- [ ] Add `has_source_urls` boolean (quick quality check)
  ```typescript
  source_urls_provided: z.boolean().catch(false),
  ```

- [ ] Make novelty claims conservative
  ```typescript
  genuinely_novel: z.boolean().catch(false),  // Default to FALSE
  novelty_level: z.enum([...]).catch('moderate'),  // Default to MIDDLE
  ```

### Add Self-Critique Section

- [ ] Make self-critique REQUIRED (not optional)
  ```typescript
  self_critique: SelfCritiqueSchema,  // Not .optional()
  ```

- [ ] Require: `strongest_argument_against`
  - Must be genuinely strong, not strawman
  - Must be at least 2-3 sentences

- [ ] Require: `prior_art_we_might_have_missed`
  - List ACTUAL searches not conducted
  - Explain why each was skipped
  - Estimate impact if missed

- [ ] Require: `what_would_change_recommendation`
  - What conditions would invalidate this?
  - What would cause us to recommend differently?

### Add Context Chain

- [ ] List all prior analysis stages
  ```
  AN0-D: Problem framing (received from earlier stage)
  AN1.5-D: Teaching examples (used these insights)
  AN1.7-D: Literature gaps (based on these findings)
  ...
  YOU: Verify and synthesize
  ```

- [ ] Reference what information is available
  - "You have access to the full discovery chain results"
  - "Prior stage found X, Y, Z"

---

## Phase 3: Testing (Before Launch)

### Test 1: Source Traceability

Run this test on sample outputs:

```typescript
function checkSourceTraceability(report: any): boolean {
  const claims = extractAllClaims(report);
  const unsourced = claims.filter(c => !c.source || c.source.length === 0);

  if (unsourced.length > 0) {
    console.error('Unsourced claims found:', unsourced);
    return false;
  }

  return true;
}
```

- [ ] Run on 3-5 sample outputs
- [ ] Every novelty claim has a `prior_art_searched` entry
- [ ] Every gap claim has search documentation
- [ ] No vague sources ("I searched the internet")

**Acceptance Criteria**: 100% of novelty claims have documented searches

### Test 2: Honesty Validation

Check the self-critique section:

- [ ] `strongest_argument_against` is substantial (not "someone might disagree")
  - Length: 100+ characters
  - Has specific technical arguments
  - Not a strawman

- [ ] `prior_art_we_might_have_missed` lists ACTUAL gaps
  - Specific: "Chinese patent databases" not "other sources"
  - Honest: Admits real constraints
  - Consequential: Explains why it matters

- [ ] No pro forma self-critique
  - Not generic boilerplate
  - Actually references the specific concept
  - Shows genuine thinking about weaknesses

**Acceptance Criteria**: Self-critique passes quality review (not auto-checkable)

### Test 3: Gap Documentation

Check that gaps are properly characterized:

```typescript
function checkGapDocumentation(report: any): boolean {
  for (const concept of report.discovery_concepts) {
    const gap = concept.why_novel;

    // Verify we distinguish verified vs. unverified gaps
    if (!gap.search_conducted || gap.search_conducted.length === 0) {
      // This is an "unexplored area" - must be flagged as such
      if (concept.novelty_level === 'breakthrough') {
        return false;  // Can't claim breakthrough novelty without search
      }
    }
  }
  return true;
}
```

- [ ] Verified gaps documented: searches conducted, results found
- [ ] Unexplored areas acknowledged: "we didn't search X because Y"
- [ ] Confidence calibrated: LOW novelty claim if limited searches
- [ ] Not confused: Gap doesn't imply novelty (gap could be real or search limitation)

**Acceptance Criteria**: Each concept has explicit gap characterization

### Test 4: Confidence Calibration

Check that confidence matches evidence:

- [ ] High novelty claims have comprehensive searches (3+ databases)
- [ ] Medium novelty claims have good searches (2 databases)
- [ ] Low novelty claims can have limited searches
- [ ] All recommendations adjust for confidence
  - HIGH confidence → "Must pursue"
  - MEDIUM confidence → "Should explore"
  - LOW confidence → "Worth investigating" or "Park for now"

**Acceptance Criteria**: No "must pursue" recommendations without HIGH confidence evidence

### Test 5: Search Specificity

Check that searches are actually documented, not vague:

```typescript
const BAD_SEARCH = "I searched for similar ideas";
const GOOD_SEARCH = "Patent search: 'counter-current thermosiphon' (USPTO, Google Patents, WIPO) - 19 results, none on gravity-driven variant";

// Check for specificity
```

- [ ] Searches include database name (USPTO, IEEE, etc.)
- [ ] Searches include actual queries used
- [ ] Searches document results found (not just "I looked")
- [ ] No vague claims like "I researched this thoroughly"

**Acceptance Criteria**: Every search is reproducible from documentation

---

## Phase 4: Deployment (Launch)

### Documentation Update

- [ ] Add to team wiki: "How to write evidence-based prompts"
- [ ] Include example of good vs. bad output
- [ ] Document what counts as "evidence" in your domain
- [ ] Provide template for self-critique section

### Monitoring

- [ ] Track: % of concepts with complete source documentation
- [ ] Track: Average # of searches per concept
- [ ] Track: User complaints about unsourced claims
- [ ] Track: Time spent validating claims downstream

### Iteration

- [ ] Monthly review of outputs
  - Are sources being provided?
  - Is self-critique substantive?
  - Are gaps being acknowledged?

- [ ] Update prompt based on failures
  - If sources missing → add examples
  - If self-critique weak → give better guidance
  - If gaps unacknowledged → make honesty section clearer

---

## Common Failure Modes (and Fixes)

### Failure 1: Vague Sources

**Problem**: "I searched for counter-current heat transfer approaches"

**Fix**: Require specificity in prompt:
```
Instead of vague, provide EXACT details:
- Database: USPTO Patents
- Query: "counter-current" AND "thermosiphon"
- Date range: 1990-2025
- Results: 19 patents found
- Relevant: 0 on passive mechanisms
```

### Failure 2: Pro Forma Self-Critique

**Problem**: "I've considered counter-arguments and I think my recommendation is good"

**Fix**: Require substantive counter-arguments:
```
Instead of generic, require SPECIFIC weaknesses:
- A thermal engineer would argue that passive gravity-driven
  systems can't overcome surface tension at this scale
- This is strong because it targets our core physics
- Our response: [Explain why surface tension isn't blocking at scale > 1cm]
```

### Failure 3: Unacknowledged Search Gaps

**Problem**: Claims "breakthrough novelty" but searches 1 database

**Fix**: Make gaps explicit in schema:
```typescript
// Add to schema
coverage_limitations: z.array(z.string()),  // REQUIRED
search_depth: z.enum(['exhaustive', 'thorough', 'partial']),

// Then require consistency:
if (novelty_level === 'breakthrough') {
  must have search_depth: 'exhaustive'
}
```

### Failure 4: Confused Gap vs. Novelty

**Problem**: "No one has researched this" (actually just not searched for it)

**Fix**: Distinguish in schema:
```typescript
gap_type: z.enum([
  'verified_absence',   // We looked, found nothing
  'unexplored_area',    // We didn't look
  'unknown'             // Can't tell
]),

// Then: Can't claim novelty from 'unexplored_area'
// Only from 'verified_absence'
```

### Failure 5: Overconfidence Despite Uncertainties

**Problem**: Recommends "must pursue" despite large honest uncertainties

**Fix**: Recalibration rule:
```typescript
const confidence = calculateConfidence({
  searches_conducted: 2,  // LOW
  uncertainties: ['Physics unproven', 'Cost unknown'],  // HIGH
  domain_support: 'Limited expert feedback'  // MEDIUM
});

if (uncertainties.length >= 2) {
  recommendation = downgrade(recommendation);  // Don't say "must pursue"
}
```

---

## Prompts to Use in Your LLM

### Prompt: "Write Self-Critique for This Concept"

If your LLM struggles with self-critique, use this:

```
You just proposed this concept: [CONCEPT NAME]

Now write the STRONGEST argument against it. Not what someone MIGHT say,
but what they WOULD say if they were technically competent and skeptical.

The argument should:
1. Target the core physics or mechanism
2. Cite real limitations or prior failures
3. Be at least 2-3 sentences
4. Not be a strawman ("People might not like it")

Write it now: [Generate]
```

### Prompt: "Document Your Searches"

If searches aren't being documented:

```
For your novelty claim, document your search process:

1. What database or source did you search? (Be specific: USPTO? IEEE? Google Scholar?)
2. What exact query did you use?
3. How many results did you get?
4. What did you find that was SIMILAR to your concept?
5. What was DIFFERENT?
6. Which database didn't you search? Why?

This is not optional - your concept's credibility depends on showing your work.
```

### Prompt: "Call Out Assumptions"

If assumptions aren't being surfaced:

```
Before recommending this concept, call out your assumptions:

1. Physics assumption: What must be true for this to work?
2. Market assumption: What market conditions must exist?
3. Technology assumption: What capabilities must exist?
4. Cost assumption: What cost structure did you assume?

For each assumption, rate your confidence:
- Confident (verified)
- Moderate (likely but not proven)
- Low confidence (speculating)

Any "low confidence" assumptions must be addressed in your validation plan.
```

---

## Quick Reference: What Good Evidence Looks Like

### Good Source Documentation

```json
{
  "why_novel": {
    "prior_art_searched": [
      "Patent search: 'gravity thermosiphon' (USPTO, Google Patents)",
      "Result: 19 patents found, all straight-tube active circulation",
      "Literature search: 'counter-current heat transfer' (IEEE Xplore, ResearchGate)",
      "Result: 43 papers found, all active or straight-tube",
      "Industry: Reviewed specs from 10 major heat exchanger manufacturers",
      "Result: All use straight tubes + active circulation"
    ],
    "what_we_found": "Not found: gravity-driven counter-current passive mechanism",
    "coverage_limitations": [
      "Did not search Chinese patent databases (potential 30% gap)",
      "Non-English publications not covered",
      "Did not contact manufacturers directly (proprietary research unknown)"
    ]
  }
}
```

### Bad Source Documentation

```json
{
  "why_novel": {
    "prior_art_searched": [],  // EMPTY - NO SEARCHES DOCUMENTED
    "what_we_found": "This is completely novel",  // CLAIM, NOT EVIDENCE
    "differentiation": "Nothing like this exists"  // ASSERTION, NOT DATA
  }
}
```

### Good Self-Critique

```json
{
  "strongest_argument_against": "A thermal engineer would argue gravity-driven passive systems can't overcome surface tension forces needed for liquid circulation at industrial scales. This is strong because surface tension (σ ≈ 0.07 N/m) creates significant resistance. Our response: At pipe diameters > 1cm, gravitational pressure (ρgh ≈ 100 Pa) exceeds surface tension resistance (σ/r ≈ 0.07 Pa), so gravity wins. This is testable.",

  "prior_art_we_might_have_missed": [
    {
      "search": "Aerospace heat management (they solve counter-current challenges)",
      "why_important": "Aerospace industry has solved similar problems under different constraints",
      "why_skipped": "Assumed space/terrestrial boundary conditions too different",
      "impact_if_missed": "Could provide design precedent or warn of failure modes"
    }
  ],

  "what_would_change_recommendation": [
    {
      "condition": "If aerospace research shows passive counter-current failed for physics reasons",
      "then": "Downgrade from 'must pursue' to 'investigate carefully'",
      "likelihood": "medium"
    }
  ]
}
```

### Bad Self-Critique

```json
{
  "strongest_argument_against": "Some people might not believe this works.",  // WEAK
  "prior_art_we_might_have_missed": [],  // EMPTY
  "what_would_change_recommendation": []  // EMPTY
}
```

---

## Team Integration

### For Prompt Engineers

- [ ] Add evidence requirements to all new prompts
- [ ] Include examples of good sources
- [ ] Make self-critique mandatory in schema
- [ ] Test on 3-5 sample inputs before launch

### For LLM Operators

- [ ] Review outputs for source documentation
- [ ] Flag unsourced claims to engineers
- [ ] Track metrics on source coverage
- [ ] Report monthly trends to team

### For Product Teams

- [ ] Display source URLs in UI when available
- [ ] Show confidence levels to users
- [ ] Add "sources" section to reports
- [ ] Enable users to challenge claims with questions

### For Data Teams

- [ ] Log which searches LLM claims to have run
- [ ] Compare to known databases (did it really search?)
- [ ] Track which claims get questioned downstream
- [ ] Feed back to prompt engineers for iteration

---

## Metrics Dashboard

Track these weekly:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| % of concepts with sources | 100% | __ % | __ |
| Avg searches per concept | 3+ | __ | __ |
| Concepts with HIGH confidence | >70% | __ % | __ |
| Unsourced claims in user feedback | 0 | __ | __ |
| Self-critique passes quality check | 100% | __ % | __ |
| Time to validate claim downstream | <5 min | __ min | __ |

---

## Additional Resources

- Full guide: `docs/solutions/ai/prevention-strategies-evidence-based-prompts.md`
- Pattern examples: `docs/solutions/ai/prompt-engineering-patterns.md`
- Implementation files: `/apps/web/lib/llm/prompts/discovery/`

---

**Version**: 1.0
**Created**: 2025-12-19
**Type**: Quick Reference
**Audience**: Prompt engineers, LLM operators, product teams
