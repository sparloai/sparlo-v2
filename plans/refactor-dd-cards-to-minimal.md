# Refactor: Reduce DD Card Proliferation While Maintaining Antifragile Schemas

**Type:** Refactor
**Priority:** CRITICAL (launching tomorrow)
**Risk Level:** LOW (additive-only changes, no breaking changes)

## Problem Statement

We over-engineered the DD hybrid architecture with 15 card types when the existing design (prose + HighlightBox + minimal structured displays) was already effective. The current implementation risks:

1. **Visual flattening** - When everything is a card, nothing is important
2. **Loss of narrative flow** - Cards interrupt the teaching that prose provides
3. **Dashboard mentality** - VCs need conviction through understanding, not checkboxes

## Critical Constraint

**LAUNCHING TOMORROW - NO BREAKING CHANGES ALLOWED**

- Schema changes must be purely additive/optional
- Nothing can break existing Inngest flows
- Nothing can break frontend rendering of existing reports
- All `cards` fields must remain optional with `.catch()`/`.default()` patterns

## Current State Analysis

### Two Rendering Paths Exist (Duplication)

From `dd-report-display.tsx`:

```tsx
// Path 1: Existing prose approach (line 900-907)
{quickRef.one_page_summary.the_bet && (
  <HighlightBox variant="subtle" className="mt-8">
    <MonoLabel variant="strong">The Bet</MonoLabel>
    <BodyText className="mt-3">
      {quickRef.one_page_summary.the_bet}
    </BodyText>
  </HighlightBox>
)}

// Path 2: New card approach (line 951-958)
{cards.executive_summary.the_bet && (
  <TheBetCard
    thesis={cards.executive_summary.the_bet.thesis || ''}
    ...
  />
)}
```

### Current Card Types (15 total)

| Card | Current Use | Recommendation |
|------|-------------|----------------|
| VerdictCard | Executive verdict | **REMOVE** - use existing VerdictDisplay |
| TheBetCard | Investment thesis | **REMOVE** - use existing HighlightBox |
| ExpectedValueCard | Return expectations | **REMOVE** - inline in Scenarios |
| ConceptCard | Solution concepts | **REMOVE** - belongs in prose |
| ClaimCard | Claim validation | **REMOVE** - table or prose list |
| ScenarioCard | Bull/Base/Bear | **KEEP** - genuinely triptych data |
| ActionCard | Diligence actions | **REMOVE** - numbered list |
| QuestionCard | Founder questions | **REMOVE** - existing FounderQuestionCard |
| ConstraintCard | Physical constraints | **REMOVE** - prose list with severity |
| ThreatCard | Competitive threats | **REMOVE** - risk list pattern |
| UnitEconomicsBridge | CAC/LTV/Payback | **KEEP** - genuinely tabular |
| CustomerEvidenceCard | LOI/Pilot/Revenue | **KEEP** - categorical with status |
| ScaleChallengeCard | Scale blockers | **KEEP** - structured with precedents |
| PolicyDependencyCard | Regulatory tracking | **KEEP** - structured with risk level |
| ScoreCard | Assessment scores | N/A - already exists as ScoreDisplay |

### Target State: 4-5 Card Types

**KEEP:**
- `UnitEconomicsBridge` - CAC/LTV/Payback is inherently metric-driven
- `CustomerEvidenceCard` - categorical evidence types with strength indicator
- `PolicyDependencyCard` - regulatory tracking with status
- `ScenarioCard` (simple existing) - Bull/Base/Bear is inherently triptych
- `ScaleChallengeCard` - blockers/precedents pattern useful

**EVERYTHING ELSE:** Rely on existing prose patterns (HighlightBox, ArticleBlock, border-l-2 lists)

---

## Implementation Plan

### Phase 1: Prompt Changes Only (SAFE - No Schema Changes)

**Goal:** Reduce what the LLM generates without touching schemas

**File:** `apps/web/lib/llm/prompts/dd/prompts.ts`

**Changes:**

1. Update the `cards` section in OUTPUT FORMAT to only request 4-5 card types:

```json
"cards": {
  "_philosophy": "Cards are for DECIDING (5-second scan). Prose is for TEACHING. Only include cards for genuinely TABULAR data that benefits from structured display.",

  "_guidance": "DO NOT generate cards for: the_bet (use prose), expected_value (inline in scenarios), concepts (belongs in Solution Landscape prose), claims (belongs in Technical Deep Dive prose), actions (numbered list in diligence roadmap), questions (use founder_questions in quick_reference), constraints (prose list), threats (prose list).",

  "unit_economics": {
    "cac": { "value": "$X", "source": "Per [unit]" },
    "ltv": { "value": "$X", "source": "Based on [calculation]" },
    "payback": { "value": "X months", "source": "After [milestone]" },
    "gross_margin": { "value": "X%", "source": "At [scale]" },
    "verdict": "SUSTAINABLE | PROMISING | QUESTIONABLE | UNSUSTAINABLE",
    "confidence": "HIGH | MEDIUM | LOW"
  },

  "customer_evidence": [
    {
      "type": "LOI | PILOT | REVENUE | REFERENCE",
      "customer": "Customer description",
      "evidence": "What they've committed to",
      "strength": "STRONG | MODERATE | WEAK"
    }
  ],

  "policy_dependencies": [
    {
      "policy": "Policy name",
      "jurisdiction": "Country/Region",
      "status": "Current status",
      "risk_level": "LOW | MEDIUM | HIGH",
      "impact_if_changed": "What happens if policy changes"
    }
  ],

  "scale_challenges": [
    {
      "challenge": "What breaks at scale",
      "stage": "X → Y scale transition",
      "blockers": ["Blocker 1", "Blocker 2"],
      "precedents": "Who solved this and how"
    }
  ]
}
```

2. Update IMPORTANT PRINCIPLES section:

```markdown
1b. **Cards are for TABULAR DATA only**: Only generate cards for unit_economics, customer_evidence, policy_dependencies, and scale_challenges. All other insights belong in prose sections or quick_reference. Do NOT generate concept_cards, claim_cards, action_cards, question_cards, constraint_cards, or threat_cards.
```

3. Remove the following from the OUTPUT FORMAT JSON:
   - `executive_summary.verdict` (use quick_reference.one_page_summary.verdict_box)
   - `executive_summary.the_bet` (use quick_reference.one_page_summary.the_bet)
   - `executive_summary.expected_value` (use quick_reference.scenarios.expected_value)
   - `concept_cards` array
   - `claim_cards` array
   - `action_cards` array
   - `question_cards` array
   - `constraint_cards` array
   - `threat_cards` array
   - `scenario_cards` array (use existing quick_reference.scenarios)

### Phase 2: Rendering Priority Changes (SAFE - No Schema Changes)

**Goal:** Prefer existing patterns over card patterns when both exist

**File:** `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx`

**Changes:**

1. Remove or comment out card rendering sections that duplicate prose patterns:

```tsx
// BEFORE: Both render
{quickRef.one_page_summary.the_bet && <HighlightBox>...</HighlightBox>}
{cards?.executive_summary?.the_bet && <TheBetCard ... />}

// AFTER: Only prose renders (card section removed/commented)
{quickRef.one_page_summary.the_bet && <HighlightBox>...</HighlightBox>}
{/* Cards removed - prefer prose patterns */}
```

2. Sections to remove/comment (with line numbers):
   - Lines 947-982: Executive cards section (TheBetCard, ExpectedValueCard, VerdictCard)
   - Lines 1043-1060: Threat cards section
   - Lines 1062-1078: Constraint cards section
   - Lines 1127-1144: Scenario cards (new) section - keep existing scenarios
   - Lines 1146-1166: Concept cards section
   - Lines 1168-1185: Claim cards section
   - Lines 1311-1327: Question cards section
   - Lines 1342-1359: Action cards section

3. Sections to KEEP:
   - Lines 1228-1243: Unit Economics
   - Lines 1245-1261: Customer Evidence
   - Lines 1263-1278: Scale Challenges
   - Lines 1281-1298: Policy Dependencies

### Phase 3: Schema Preservation (NO CHANGES)

**Goal:** Maintain backwards compatibility - DO NOTHING to schemas

**File:** `apps/web/lib/llm/prompts/dd/schemas.ts`

**NO CHANGES.** The schema must continue to accept all card types:
- Old reports with cards will still validate
- New reports without cards will still validate (fields are optional)
- The `cards` field is already optional with `.catch()` patterns

---

## Acceptance Criteria

### Functional Requirements

- [ ] New DD reports generate with only 4-5 card types (unit_economics, customer_evidence, policy_dependencies, scale_challenges)
- [ ] Existing DD reports continue to render without errors
- [ ] Prose sections (Problem Primer, Technical Deep Dive, etc.) remain prominent
- [ ] "The Bet" renders as HighlightBox, not TheBetCard
- [ ] Scenarios render from quick_reference.scenarios, not scenario_cards

### Non-Functional Requirements

- [ ] No Inngest flow errors
- [ ] No Zod validation errors
- [ ] No TypeScript errors
- [ ] No runtime errors on existing reports

### Quality Gates

- [ ] Run `pnpm typecheck` - must pass
- [ ] Run `pnpm lint:fix` - must pass
- [ ] Test rendering of at least 2 existing DD reports
- [ ] Generate 1 new DD report and verify reduced card output

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LLM still generates unwanted cards | MEDIUM | LOW | Schema accepts them, rendering ignores them |
| Old reports break | LOW | HIGH | NO schema changes, optional fields preserved |
| Inngest flow errors | LOW | HIGH | Schema unchanged, flow unchanged |
| TypeScript errors | LOW | MEDIUM | Only commenting out JSX, no type changes |

---

## Files Changed

| File | Change Type | Risk |
|------|-------------|------|
| `apps/web/lib/llm/prompts/dd/prompts.ts` | Modify OUTPUT FORMAT | LOW - prompt only |
| `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx` | Comment out card sections | LOW - rendering only |
| `apps/web/lib/llm/prompts/dd/schemas.ts` | **NO CHANGES** | N/A |

---

## Rollback Plan

If issues arise:
1. Revert prompt changes in `prompts.ts` (cards will generate again)
2. Uncomment card rendering sections in `dd-report-display.tsx`
3. No schema rollback needed (no changes made)

---

## References

- `apps/web/lib/llm/prompts/dd/prompts.ts:2684-2830` - Current cards OUTPUT FORMAT
- `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx:900-907` - Existing HighlightBox for The Bet
- `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx:947-982` - Card rendering to remove
- `apps/web/app/app/reports/[id]/_components/brand-system/primitives.tsx` - HighlightBox, ArticleBlock patterns
