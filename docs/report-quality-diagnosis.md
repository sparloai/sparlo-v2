# Sparlo Report Quality Gap Diagnosis

Generated: 2025-12-22

---

## Gap 1: Frontier Section Lacks Depth

### Current State
- **Prompt location:** `apps/web/lib/llm/prompts/hybrid/prompts.ts`, lines 981-993 (AN5-M "FRONTIER INTELLIGENCE")
- **Current instruction:**
  ```
  For frontier_watch items, use web search to enhance with current information:
  - Search for recent developments, announcements, and research activity
  - Identify specific researchers and labs to monitor
  - Assess competitive landscape and market timing
  - Estimate Technology Readiness Level where possible
  ```
- **Schema definition:** `FrontierWatchSchema` in schemas.ts lines 1186-1208 has:
  - `who_to_monitor: z.string()` - just a string, not structured
  - `recent_developments: z.string().optional()`
  - `trl_estimate: z.number().int().min(1).max(9).optional()`
  - No fields for named researchers, publications, or patent search

### Root Cause
1. **Instruction is vague** - "Identify specific researchers" doesn't require minimum count, affiliations, or recency
2. **No publication requirement** - No instruction to cite specific papers with titles, journals, years
3. **No patent search mandate** - Patent landscape not mentioned for frontier concepts
4. **Trigger signals lack specificity** - `trigger_to_revisit` is just a string with no structure

### Recommended Fix
Add to AN5-M prompt after line 993:

```typescript
## FRONTIER WATCH DEPTH REQUIREMENTS (Required)

For EACH frontier technology, you MUST include:

### 1. Key Researchers (minimum 2)
For each researcher:
- Full name with current institutional affiliation
- Why they matter (recent publication, lab focus, funding)
- Web search query used: "[technology] research [current year]"

Example: "Dr. Sarah Chen, MIT Media Lab - Published 2024 Nature paper on biogenic silica synthesis; lab focus on sustainable materials"

### 2. Recent Publications (minimum 1 per frontier concept)
- Specific paper title, journal, and year
- Key finding relevant to this application
- DOI or URL if available
- Web search query used: "[technology] [application] publication 2024 2025"

### 3. Patent Landscape Summary
- Execute search: "[technology] patent [application domain]"
- Report: granted patents count, pending applications, or explicit "No relevant patents found in search"
- Key players filing in this space with examples

### 4. Trigger Signals (minimum 2, must be specific and measurable)
❌ BAD: "Publication showing commercial viability"
✅ GOOD: "Paper demonstrating >6 month stability in humidity cycling (target journals: Nature Materials, Advanced Materials, ACS Applied Materials)"
✅ GOOD: "Series A funding for RHA-focused packaging startup exceeding $5M"
✅ GOOD: "FDA approval of similar material for food contact (monitor FDA GRAS notices)"
```

### Verification
- [ ] Each frontier_watch entry has ≥2 named researchers with affiliations
- [ ] Each frontier_watch entry has ≥1 specific publication (title, journal, year)
- [ ] Patent search results included (findings or explicit "none found")
- [ ] Trigger signals are specific and measurable (not generic)

---

## Gap 2: IP Analysis Is Placeholder, Not Executed

### Current State
- **Prompt location:** `apps/web/lib/llm/prompts/hybrid/prompts.ts`, lines 1475-1490 (AN5-M "IP CONSIDERATIONS")
- **Current instruction:**
  ```
  For primary solution and recommended innovation, assess IP landscape:
  ...
  If information unavailable, state "Not researched" rather than guessing.
  ```
- **Schema definition:** `ip_considerations` object in AN5-M schema at lines 1137-1143

### Root Cause
1. **"Assess" vs "Execute"** - Prompt says to "assess" IP landscape, not to actively search
2. **Easy out provided** - "If information unavailable, state 'Not researched'" gives LLM permission to skip
3. **No search mandate** - No instruction to execute patent searches via web search
4. **No enforcement** - No language prohibiting placeholder recommendations like "search for X"

### Recommended Fix
Replace lines 1475-1490 with:

```typescript
## IP ANALYSIS EXECUTION (PRIMARY + RECOMMENDED only)

You MUST execute patent search, not recommend it. "Search for X" is NOT acceptable output.

### Required Searches (execute all three)
1. "[core mechanism] patent"
2. "[technology] [application] intellectual property"
3. "[named competitor if any] patent [technology]"

### Required Output Structure
For ip_considerations, you MUST provide:

**freedom_to_operate:** GREEN | YELLOW | RED
- GREEN: Search conducted, no blocking patents identified
- YELLOW: Patents exist but workarounds available or licenses likely obtainable
- RED: Blocking patents identified; licensing negotiations required

**rationale:** Actual search results, not recommendations
- ✅ "Search for 'shellac barrier coating patent' returned 3 relevant results: US10,xxx,xxx (expired 2023), US11,xxx,xxx (Cargill, active but narrow claims on specific formulation)"
- ❌ "Recommend searching for shellac barrier patents"

**key_patents_to_review:** Specific patent numbers or assignees found
- ✅ ["US 10,234,567 (Cargill)", "WO 2023/123456 (BASF)"]
- ❌ ["Search patent databases for relevant filings"]

**patentability_potential:** Based on what you found
- HIGH: Novel combination, no direct prior art found
- MEDIUM: Some prior art exists but inventive step possible
- LOW: Crowded space with extensive prior art
- NOT_NOVEL: Exact approach found in existing patents/publications

### If Search Returns No Results
State explicitly: "Patent search conducted via web for '[query]'; no directly relevant patents identified. Recommend professional FTO clearance before investment exceeds $50K."

### Never Output
- "Search for X"
- "Recommend patent search"
- "IP analysis not conducted"
```

### Verification
- [ ] Primary concept has executed patent search (results stated, not "search for X")
- [ ] Recommended innovation has executed patent search
- [ ] Patent numbers or "none found" explicitly stated
- [ ] FTO assessment includes rationale based on search results

---

## Gap 3: Empty Schema Arrays

### Current State
- **Prompt location:** AN5-M prompt focuses on new framework (solution_concepts, innovation_concepts)
- **Schema definition:** Legacy arrays in AN5_M_OutputSchema (lines 2064-2088):
  - `key_insights: z.array(z.string()).max(20).default([])`
  - `key_patterns: z.array(KeyPatternSchema).max(20).default([])`
  - `solution_concepts.lead_concepts: z.array(LeadConceptSchema).max(10).default([])`
  - `problem_analysis.root_cause_hypotheses: z.array(RootCauseHypothesisSchema).catch([])`

### Root Cause
1. **Schema/Prompt Disconnect** - AN5-M prompt uses v4.0 narrative flow (solution_concepts/innovation_concepts) but legacy arrays remain in schema
2. **No population instructions** - Prompt never mentions populating `key_insights`, `key_patterns`
3. **Data flow broken** - AN3/AN4 produce data that AN5 doesn't explicitly incorporate into these arrays
4. **Default to empty** - `.default([])` means empty arrays silently pass validation

### Recommended Fix
Add to AN5-M prompt before the OUTPUT SCHEMA section (around line 1004):

```typescript
## SCHEMA COMPLETENESS CHECK (Required before output)

Before finalizing the report, ensure these arrays are populated:

### From Problem Analysis (root_cause_hypotheses)
Extract from problem_analysis section. Minimum 2 hypotheses with confidence percentages.
If you stated "why it's hard", you identified root causes. Populate the array.

### Key Insights (minimum 3)
Extract the most important discoveries from your analysis:
- What did you learn that changes the recommendation?
- What would surprise a domain expert?
- What connects disparate pieces of your analysis?

### Key Patterns (minimum 3)
Extract mechanism patterns that recur or transfer:
- What physical/chemical principles appear multiple times?
- What cross-domain patterns did you apply?
- What TRIZ principles manifested in solutions?

### Lead Concepts
If using legacy format, ensure lead_concepts array populated with top-ranked concepts.
If using v4.0 format, solution_concepts.primary and supporting should be populated.

### Validation Check
Before output, verify:
- root_cause_hypotheses.length >= 2
- key_insights.length >= 3 (or innovation_analysis.domains_searched populated)
- At least one of: lead_concepts populated OR solution_concepts.primary defined

Empty arrays for these fields indicate incomplete synthesis. Revisit source material if any are empty.
```

### Verification
- [ ] key_insights array populated (≥3 items) OR innovation_analysis populated
- [ ] key_patterns array populated (≥3 items) OR cross_domain_search.domains_searched populated
- [ ] root_cause_hypotheses populated (≥2 items)
- [ ] Either lead_concepts or solution_concepts.primary is defined

---

## Gap 4: Validation Steps Lack Operational Specificity

### Current State
- **Prompt location:** `apps/web/lib/llm/prompts/hybrid/prompts.ts`, lines 1158-1164
- **Current instruction:**
  ```
  "first_validation_step": {
    "test": "What to do",
    "cost": "$X",
    "timeline": "X weeks",
    "go_criteria": "What success looks like",
    "no_go_criteria": "What failure looks like - and what to do instead"
  }
  ```
- **Schema definition:** Matches prompt - just test/cost/timeline/criteria

### Root Cause
1. **"What" without "How/Who/Where"** - Prompt only asks what to test, not operational execution details
2. **No sample sourcing** - No instruction to specify where materials come from
3. **No executor specified** - Doesn't ask who performs the test (contract lab, in-house, academic)
4. **No statistical design** - No mention of replicates, confidence levels, sample sizes

### Recommended Fix
Add after line 1164:

```typescript
## VALIDATION STEP OPERATIONAL SPECIFICITY (Required)

Each first_validation_step MUST answer these operational questions:

### 1. Who Performs the Test?
Specify one of:
- Contract lab: Name type and examples (e.g., "Certified barrier testing lab such as SGS, Intertek, or MOCON")
- In-house: Required capabilities ("Requires gravure coating capability and WVTR measurement")
- Academic partner: When specialized equipment needed ("University lab with AFM and contact angle goniometer")

### 2. Equipment and Method
- Standard test method reference (e.g., "ASTM D3985 for OTR", "ISO 15106-2 for WVTR")
- Specialized equipment if non-standard

### 3. Sample Sourcing
- How to obtain materials: Supplier name or type, contact method
- Lead time estimate: "2-week lead from supplier sample request"
- Quantity needed: "Minimum 10 samples of 10cm × 10cm"

### 4. Statistical Design
- Number of replicates: Minimum 3, recommend 5 for statistical significance
- Confidence level for decision: "95% confidence interval"
- Sample size rationale if non-standard

### Example of Complete Validation Step:
```json
{
  "test": "Measure oxygen transmission rate of shellac-coated NatureFlex",
  "who_performs": "Contract lab (MOCON, Intertek, or SGS - barrier testing certified)",
  "equipment_method": "ASTM D3985 at 23°C, 50% RH",
  "sample_sourcing": {
    "material": "NatureFlex NVS from Futamura (applications@futamura.com)",
    "lead_time": "2 weeks for sample request",
    "quantity": "20 samples, 10cm × 10cm coated at contract coating facility"
  },
  "replicates": 5,
  "cost": "$15-20K including coating, testing, analysis",
  "timeline": "4-6 weeks total (2 weeks material, 2 weeks coating, 2 weeks testing)",
  "go_criteria": "OTR < 10 cc/m²·day at 23°C, 50% RH across all replicates",
  "no_go_criteria": "OTR > 50 cc/m²·day → pivot to modified atmosphere approach"
}
```
```

### Verification
- [ ] Each validation step specifies who performs (contract lab type, in-house requirement, or academic)
- [ ] Equipment/method includes standard reference where applicable
- [ ] Sample sourcing includes supplier/contact and lead time
- [ ] Statistical design mentions replicates (minimum 3)

---

## Gap 5: Self-Critique Flags Issues Not Addressed in Protocol

### Current State
- **Prompt location:** Self-critique at lines 1378-1388, validation at lines 1158-1164
- **Current instruction:** Self-critique and validation are defined independently with no cross-reference
- **Schema definition:** Both sections exist separately with no linking structure

### Root Cause
1. **No cross-reference instruction** - Prompt never tells LLM to check that self-critique concerns appear in validation
2. **Sequential generation** - Self-critique likely generated after validation, with no loop back
3. **No enforcement** - Nothing prevents flagging a risk in self-critique that validation ignores

### Recommended Fix
Add after the self_critique section (after line 1388):

```typescript
## SELF-CRITIQUE TO VALIDATION INTEGRATION (Required)

After generating self-critique, you MUST cross-check with validation design.

### Integration Process:

1. For EACH item in "what_we_might_be_wrong_about":
   - Check: Is this addressed in a first_validation_step?
   - If YES: Note the connection in the validation step
   - If NO: Either add extended validation OR flag explicitly

2. Classification of self-critique items:
   - **ADDRESSED**: Covered by existing validation step
   - **EXTENDED_VALIDATION_NEEDED**: Add to validation protocol
   - **ACCEPTED_RISK**: Explicitly state "Not tested in initial validation; recommend extended testing before scale-up"

### Example:
Self-critique: "Real-world humidity cycling may cause barrier degradation"
Options:
a) Extend validation: Add humidity cycling test (ASTM E96 wet cup + 2 weeks cycling)
b) Accept and flag: "Initial validation tests steady-state only. If pass, recommend 8-week accelerated humidity cycling before production commitment."

### Never:
- Flag a concern in self-critique that is silently ignored in validation
- Claim high confidence while having unaddressed uncertainties

### Output Requirement:
If self_critique.what_we_might_be_wrong_about has items not in validation, add a validation_gaps field:
```json
"validation_gaps": [
  {
    "concern": "Humidity cycling degradation",
    "status": "ACCEPTED_RISK",
    "rationale": "Steady-state test sufficient for go/no-go decision; cycling test recommended before $100K+ investment"
  }
]
```
```

### Verification
- [ ] Each HIGH-IMPACT self-critique concern is either addressed in validation OR explicitly flagged as accepted risk
- [ ] No silent gaps between stated uncertainties and test protocols
- [ ] Confidence rating consistent with addressed vs unaddressed concerns

---

## Gap 6: Risk Severity Lacks Discrimination

### Current State
- **Prompt location:** `apps/web/lib/llm/prompts/hybrid/prompts.ts`, lines 1367-1374
- **Current instruction:**
  ```
  "risks_and_watchouts": [
    {
      "category": "Technical | Market | Regulatory | Resource",
      "risk": "Cross-cutting risk",
      "severity": "low | medium | high",
      "mitigation": "How to address"
    }
  ]
  ```
- **Schema definition:** `RiskWatchoutSchema` with `severity: z.enum(['low', 'medium', 'high'])`

### Root Cause
1. **No severity calibration guidance** - Prompt doesn't explain when to use HIGH vs MEDIUM vs LOW
2. **No minimum HIGH requirement** - Nothing prevents all risks being MEDIUM
3. **Default to safe middle** - LLM tendency to hedge with MEDIUM when uncertain
4. **No reality check** - Most real projects have critical path risks that should be HIGH

### Recommended Fix
Add before the risks_and_watchouts schema definition (around line 1365):

```typescript
## RISK SEVERITY CALIBRATION (Required)

Assign severity based on these criteria:

### HIGH Severity
Conditions (ANY of these):
- Would kill the project if realized; requires mitigation BEFORE proceeding
- Probability >30% AND impact is fatal to the approach
- No known mitigation path exists
- Examples:
  - Core mechanism doesn't work at required performance
  - Regulatory blocker with no clear pathway
  - 10x cost overrun vs alternatives
  - Critical material unavailable at scale

### MEDIUM Severity
Conditions:
- Significant but manageable with contingency planning
- Probability 10-30% OR impact is major but recoverable
- Mitigation path exists but requires effort
- Examples:
  - Supplier issues requiring qualification of backup
  - Timeline delays of 50-100%
  - Performance below target but above minimum viable
  - Cost overrun of 2-3x

### LOW Severity
Conditions:
- Minor impact or very unlikely (<10% probability)
- Standard operating procedure handles it
- Examples:
  - Minor cost increases within contingency budget
  - Edge case performance issues
  - Routine supplier negotiations

### Calibration Check (Required)
After assigning severities, verify:
- At least ONE risk rated HIGH (most real projects have a critical path risk)
- Severities are differentiated (not all MEDIUM)
- HIGH risks have mitigation plans or explicit "requires resolution before proceeding"

If ALL risks are MEDIUM or LOW, reconsider:
- Is there truly no showstopper?
- What would cause you to abandon this approach?
- State explicitly: "Unusually low-risk project because [specific reasons]"

### Severity Distribution Check
Typical healthy risk portfolio:
- 1-2 HIGH risks (the real concerns)
- 2-4 MEDIUM risks (significant but manageable)
- 2-3 LOW risks (monitoring items)

If distribution is unusual (e.g., 0 HIGH, 7 MEDIUM), explain why.
```

### Verification
- [ ] At least one HIGH severity risk (or explicit justification why none)
- [ ] Severity assignments are differentiated (not all MEDIUM)
- [ ] HIGH risks have mitigation plans or "requires resolution" flag
- [ ] Unusual distributions are explained

---

## Summary of Root Causes

| Gap | Root Cause | Fix Type |
|-----|-----------|----------|
| 1. Frontier Depth | Instructions vague, no minimums | Add specific requirements |
| 2. IP Placeholder | "Assess" vs "Execute", easy out provided | Mandate search execution |
| 3. Empty Arrays | Schema/prompt disconnect | Add completeness check |
| 4. Validation Specificity | "What" without operational details | Add who/how/where requirements |
| 5. Self-Critique Disconnect | No cross-reference instruction | Add integration requirement |
| 6. Risk Severity | No calibration guidance | Add severity criteria |

## Implementation Priority

1. **Gap 2 (IP Analysis)** - Highest impact, users expect actual search results
2. **Gap 4 (Validation Specificity)** - Users need actionable next steps
3. **Gap 1 (Frontier Depth)** - Differentiator for Sparlo vs generic AI
4. **Gap 6 (Risk Calibration)** - Affects decision quality
5. **Gap 5 (Self-Critique Integration)** - Consistency issue
6. **Gap 3 (Empty Arrays)** - Schema cleanup, lower user impact
