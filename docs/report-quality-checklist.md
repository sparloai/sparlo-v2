# Report Quality Verification Checklist

Use this checklist to QA Sparlo reports for quality gaps.

---

## 1. Frontier Section Depth

- [ ] Each frontier_watch entry has **≥2 named researchers with affiliations**
  - Format: "Dr. [Name], [Institution] - [Why they matter]"
  - Not generic: "Academic groups in India, Thailand"

- [ ] Each frontier_watch entry has **≥1 specific publication**
  - Includes: Title, journal, year
  - Not: "Search for biogenic silica papers"

- [ ] **Patent search results included** (for each frontier concept)
  - Either specific patents found OR "No relevant patents found in search"
  - Not: "Search for patents on X"

- [ ] **Trigger signals are specific and measurable** (≥2 per frontier concept)
  - Good: "Paper in Nature Materials showing >6 month stability"
  - Bad: "Publication showing commercial viability"

---

## 2. IP Analysis (Primary + Recommended)

- [ ] **Primary concept** has executed patent search
  - rationale contains actual search results, not "search for X"
  - key_patents_to_review contains patent numbers or assignees, OR explicit "none found"

- [ ] **Recommended innovation** has executed patent search
  - Same criteria as above

- [ ] **Freedom to operate** assessment has rationale based on search results
  - Not: "Recommend professional FTO clearance" without search first

- [ ] **No placeholder language present**
  - None of: "Search for X", "Recommend patent search", "Not researched"

---

## 3. Schema Completeness

- [ ] **problem_analysis.root_cause_hypotheses** populated (≥2 items)
  - Each with name, confidence_percent, explanation

- [ ] **innovation_analysis.domains_searched** populated (≥3 domains)
  - Not empty array

- [ ] **solution_concepts.primary** is defined and complete
  - Has: id, title, what_it_is, the_insight, economics, first_validation_step

- [ ] **innovation_concepts.recommended** is defined and complete
  - Has: id, title, what_it_is, the_insight, economics, first_validation_step

- [ ] **No critical empty arrays**
  - If using legacy format: lead_concepts populated
  - If using v4 format: solution_concepts.primary + innovation_concepts.recommended populated

---

## 4. Validation Step Specificity

For each first_validation_step (primary concept + recommended innovation):

- [ ] **Who performs** specified
  - Contract lab type (with examples like SGS, Intertek, MOCON)
  - OR in-house capability requirement
  - OR academic partner type

- [ ] **Equipment/method** specified
  - Standard test reference (e.g., "ASTM D3985", "ISO 15106-2")
  - Test conditions included (temperature, humidity, etc.)

- [ ] **Sample sourcing** includes:
  - [ ] Material supplier name or type
  - [ ] Lead time estimate
  - [ ] Quantity needed

- [ ] **Statistical design** mentioned
  - Number of replicates (minimum 3)
  - Confidence level if non-standard

---

## 5. Self-Critique Integration

- [ ] **validation_gaps array is populated** if what_we_might_be_wrong_about has items

- [ ] Each **HIGH-IMPACT concern** in self-critique is either:
  - [ ] ADDRESSED: Covered by a validation step (with cross-reference)
  - [ ] EXTENDED_NEEDED: Flagged for additional testing
  - [ ] ACCEPTED_RISK: Explicitly accepted with rationale

- [ ] **No silent gaps** between stated uncertainties and test protocols

- [ ] **Confidence rating is consistent** with addressed vs unaddressed concerns
  - HIGH confidence requires most concerns ADDRESSED
  - MEDIUM/LOW confidence acceptable with ACCEPTED_RISK items

---

## 6. Risk Calibration

- [ ] **At least one HIGH severity risk** present
  - OR explicit statement: "Unusually low-risk project because [specific reasons]"

- [ ] **Severity assignments are differentiated** (not all MEDIUM)
  - Typical: 1-2 HIGH, 2-4 MEDIUM, 2-3 LOW

- [ ] **HIGH risks have mitigation plans** or explicit "requires resolution before proceeding"

- [ ] **Severity criteria applied correctly**:
  - HIGH: Would kill project if realized; >30% probability AND fatal impact
  - MEDIUM: Significant but manageable; 10-30% probability OR major but recoverable
  - LOW: Minor impact or very unlikely (<10%)

---

## Quick Scan Failures

These patterns indicate likely quality gaps:

| Pattern | Likely Gap |
|---------|-----------|
| "Academic groups in [region]" without names | Gap 1 - Frontier depth |
| "Search for X patents" | Gap 2 - IP placeholder |
| Empty arrays in JSON | Gap 3 - Schema incomplete |
| Validation step with just cost/timeline | Gap 4 - Missing operational details |
| Self-critique flags risk not in validation | Gap 5 - Disconnected sections |
| All risks rated MEDIUM | Gap 6 - No severity calibration |

---

## Pass Criteria

A report passes quality check if:
- [ ] All 6 section checklists have no failures
- [ ] No "Quick Scan Failures" patterns detected
- [ ] Report reads like senior engineer advice, not placeholder deliverable

---

## Reporting Issues

If a report fails multiple checks, log:
1. Report ID
2. Which gaps failed
3. Specific examples of failure
4. Suggested prompt improvements if patterns emerge
