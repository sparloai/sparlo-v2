# DD Report Hybrid Architecture Fix

## Overview

Transform the DD report from pure prose to a hybrid cards + prose architecture that mirrors the successful engineering report pattern. The key constraint is **schema antifragility** - changes must NOT break the Inngest flow, frontend rendering, or existing reports in the database.

## Problem Statement

The current DD report is all prose with no visual hierarchy:
- Partners can't scan in 5 minutes
- Solution landscape buried in paragraphs instead of scannable cards
- Claim validation hidden in prose instead of verdict badges
- No visual distinction between "deciding" content (cards) and "teaching" content (prose)

The hybrid engineering report works because it mixes cards for decisions and prose for education.

## Architecture Principle

**Prose is for TEACHING. Cards are for DECIDING.**

| Section | Content Type | Why |
|---------|--------------|-----|
| Problem Primer | Prose + Constraints Cards | Teach the problem, show physics limits |
| Solution Landscape | Cards (primary) | Scan and compare approaches |
| Technical Validation | Cards + Prose | Quick verdicts + educational explanation |
| Commercial Reality | Cards + Prose | Quick metrics + narrative |
| Investment Thesis | Cards + Prose | Scenario comparison + narrative |
| Diligence Actions | Cards | Actionable items |

---

## Critical Constraints (from Research)

### Inngest Flow Dependencies

**File:** `apps/web/lib/inngest/functions/generate-dd-report.ts`

The Inngest job extracts metadata for title/headline from the DD5-M output:

```typescript
// Lines 126-158: Format-aware metadata extraction
function extractDD5Metadata(result: DD5_M_Output): {
  companyName: string;
  verdict: string;
  headline: string;
} {
  if (isDD5NewFormat(result)) {
    return {
      companyName: result.report_metadata.company_name,
      verdict: result.quick_reference.one_page_summary.verdict_box.overall,
      headline: result.quick_reference.one_page_summary.one_sentence,
    };
  }
  // Old format fallback...
}
```

**MUST MAINTAIN:**
- `report_metadata.company_name`
- `quick_reference.one_page_summary.verdict_box.overall`
- `quick_reference.one_page_summary.one_sentence`

### Frontend Normalization

**File:** `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx`

The frontend normalizes both old and new schema formats:

```typescript
function isNewSchemaFormat(data: unknown): boolean {
  return 'quick_reference' in obj || 'prose_report' in obj;
}
```

**MUST MAINTAIN:**
- Detection logic for schema format
- Backwards compatibility with existing reports
- Reading time calculation from prose fields

### Antifragile Schema Patterns

**File:** `apps/web/lib/llm/prompts/dd/schemas.ts`

The schema uses:
- `flexibleEnum()` - handles LLM output variations (e.g., "WEAK - needs improvement" → "WEAK")
- `flexibleNumber()` - handles string numbers (e.g., "7" → 7)
- `.default()` / `.catch('')` - provides defaults for missing fields
- `.passthrough()` - allows additional fields without breaking

---

## Implementation Strategy: Additive-Only Schema Evolution

### Key Insight: DON'T Replace, EXTEND

Instead of replacing `prose_report` with new sections, we **ADD** new card-based fields alongside existing prose. This ensures:

1. Old reports continue to work (they just won't have cards)
2. New reports have both prose AND cards
3. Frontend renders cards when available, falls back to prose-only

### Schema Evolution Pattern

```
CURRENT (keep):
├── report_metadata: { company_name, date, version }
├── prose_report: { problem_primer, technical_deep_dive, solution_landscape, ... }
├── quick_reference: { one_page_summary, scores, scenarios, ... }
└── appendix: { ... }

NEW (add):
├── report_metadata: { company_name, date, version }
├── prose_report: { ... }  // KEEP - for backwards compat
├── quick_reference: { ... }  // KEEP - Inngest depends on this
├── appendix: { ... }  // KEEP
│
└── cards: {  // NEW - optional, additive
    ├── executive_summary: { verdict_box, scores, key_insight }
    ├── problem_constraints: [ { constraint, value, implication } ]
    ├── concept_cards: [ { title, track, feasibility, impact, ... } ]
    ├── claim_cards: [ { claim, verdict, confidence, ... } ]
    ├── competitive_threats: [ { threat, threat_level, why } ]
    ├── unit_economics_bridge: { current_cost, claimed_cost, drivers, ... }
    ├── customer_evidence: { lois, pilots, revenue, verdict }
    ├── scenario_cards: [ { scenario, probability, return, ... } ]
    ├── action_cards: [ { action, priority, cost, timeline, ... } ]
    └── question_cards: [ { question, why_critical, good_answer, bad_answer } ]
}
```

---

## Phase 1: Schema & Type Definitions

### Task 1.1: Define Card TypeScript Types

**File:** `apps/web/lib/llm/prompts/dd/schemas.ts`

Add new card type definitions using the existing antifragile patterns:

```typescript
// Card Types - use flexibleEnum for verdict fields
const VerdictLevel = flexibleEnum(
  ['COMPELLING', 'PROMISING', 'MIXED', 'CAUTION', 'CONCERNING', 'PASS'] as const,
  'MIXED'
);

const TrackType = flexibleEnum(
  ['best_fit', 'simpler_path', 'paradigm_shift', 'frontier_transfer'] as const,
  'best_fit'
);

const PriorityLevel = flexibleEnum(
  ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const,
  'MEDIUM'
);

// Individual Card Schemas
export const VerdictBoxSchema = z.object({
  verdict: VerdictLevel,
  symbol: z.string().catch(''),
  one_liner: z.string().catch(''),
});

export const ScoreCardSchema = z.object({
  label: z.string().catch(''),
  score: flexibleNumber(5, { min: 0, max: 10 }),
  out_of: flexibleNumber(10),
  one_liner: z.string().catch(''),
});

export const ConceptCardSchema = z.object({
  id: z.string().optional(),
  title: z.string().catch(''),
  track: TrackType,
  feasibility: flexibleNumber(5, { min: 0, max: 10 }),
  impact: flexibleNumber(5, { min: 0, max: 10 }),
  one_liner: z.string().catch(''),
  key_risk: z.string().catch(''),
  who_pursuing: z.array(z.string()).catch([]),
  startup_uses: z.boolean().catch(false),
});

export const ClaimCardSchema = z.object({
  id: z.string().optional(),
  claim: z.string().catch(''),
  verdict: VerdictLevel,
  confidence: z.string().catch(''), // e.g., "55%"
  one_liner: z.string().catch(''),
  theoretical_limit: z.string().optional(),
  their_claim_vs_limit: z.string().optional(),
  key_assumption: z.string().optional(),
});

export const ThreatCardSchema = z.object({
  threat: z.string().catch(''),
  threat_level: PriorityLevel,
  why: z.string().catch(''),
});

export const ConstraintCardSchema = z.object({
  constraint: z.string().catch(''),
  value: z.string().catch(''),
  implication: z.string().catch(''),
});

export const UnitEconomicsBridgeSchema = z.object({
  current_cost: z.string().catch(''),
  claimed_cost: z.string().catch(''),
  gap: z.string().catch(''),
  drivers: z.array(z.object({
    driver: z.string().catch(''),
    reduction: z.string().catch(''),
    validity: VerdictLevel,
  })).catch([]),
  realistic_estimate: z.string().catch(''),
  verdict: VerdictLevel,
});

export const CustomerEvidenceCardSchema = z.object({
  lois: flexibleNumber(0),
  pilots: flexibleNumber(0),
  revenue: z.string().catch('$0'),
  verdict: VerdictLevel,
});

export const ScenarioCardSchema = z.object({
  scenario: flexibleEnum(['BULL', 'BASE', 'BEAR'] as const, 'BASE'),
  probability: z.string().catch(''), // e.g., "12%"
  return: z.string().catch(''), // e.g., "15-25x"
  narrative: z.string().catch(''),
  requires: z.array(z.string()).catch([]),
});

export const ActionCardSchema = z.object({
  action: z.string().catch(''),
  priority: PriorityLevel,
  cost: z.string().optional(),
  timeline: z.string().optional(),
  deal_breaker_if: z.string().optional(),
});

export const QuestionCardSchema = z.object({
  question: z.string().catch(''),
  why_critical: z.string().catch(''),
  good_answer: z.string().catch(''),
  bad_answer: z.string().catch(''),
});
```

### Task 1.2: Define Cards Container Schema

```typescript
// The cards container - entirely optional, additive
export const DD5_M_CardsSchema = z.object({
  executive_summary: z.object({
    verdict_box: VerdictBoxSchema.optional(),
    scores: z.array(ScoreCardSchema).catch([]),
    key_insight: z.string().catch(''),
  }).optional(),

  problem_constraints: z.array(ConstraintCardSchema).catch([]),

  concept_cards: z.array(ConceptCardSchema).catch([]),

  startup_position: z.object({
    their_approach: z.string().catch(''),
    track: TrackType,
    what_they_dismissed: z.array(z.string()).catch([]),
    positioning_assessment: flexibleEnum(
      ['OPTIMAL', 'REASONABLE', 'SUBOPTIMAL'] as const,
      'REASONABLE'
    ),
  }).optional(),

  competitive_threats: z.array(ThreatCardSchema).catch([]),

  claim_cards: z.array(ClaimCardSchema).catch([]),

  scale_challenges: z.array(z.object({
    challenge: z.string().catch(''),
    severity: PriorityLevel,
    explanation: z.string().catch(''),
  })).catch([]),

  unit_economics_bridge: UnitEconomicsBridgeSchema.optional(),
  customer_evidence: CustomerEvidenceCardSchema.optional(),
  policy_dependency: z.object({
    critical_policies: z.array(z.string()).catch([]),
    economics_without_policy: z.string().catch(''),
    policy_risk: PriorityLevel,
  }).optional(),

  the_bet_card: z.object({
    core_bet: z.string().catch(''),
    technical_condition: z.string().catch(''),
    commercial_condition: z.string().catch(''),
    timing_condition: z.string().catch(''),
  }).optional(),

  scenario_cards: z.array(ScenarioCardSchema).catch([]),

  expected_value: z.object({
    weighted_multiple: z.string().catch(''),
    calculation: z.string().catch(''),
    assessment: z.string().catch(''),
  }).optional(),

  action_cards: z.array(ActionCardSchema).catch([]),
  question_cards: z.array(QuestionCardSchema).catch([]),
}).passthrough();  // Allow additional card types without breaking
```

### Task 1.3: Extend DD5-M Output Schema (Additive)

```typescript
// EXTEND existing schema, don't replace
export const DD5_M_NewFormatSchemaV2 = DD5_M_NewFormatSchema.extend({
  cards: DD5_M_CardsSchema.optional(),  // ADDITIVE - optional cards container
  schema_version: z.string().default('2.0'),  // Version detection
});

// The main schema now detects format AND version
export const DD5_M_OutputSchema = z.unknown().transform((val) => {
  const input = val as Record<string, unknown>;

  // Check if new format with cards (v2)
  if (input.prose_report && input.quick_reference && input.cards) {
    return DD5_M_NewFormatSchemaV2.parse(val);
  }

  // Check if new format without cards (v1)
  if (input.prose_report && input.quick_reference) {
    return DD5_M_NewFormatSchema.parse(val);
  }

  // Fall back to old format
  return DD5_M_OldFormatSchema.parse(val);
});
```

---

## Phase 2: Update DD5-M Prompt

### Task 2.1: Add Cards Section to Prompt Output Format

**File:** `apps/web/lib/llm/prompts/dd/prompts.ts`

Add the cards section to the OUTPUT FORMAT instructions, keeping existing prose structure:

```typescript
const DD5_M_OUTPUT_FORMAT = `
## OUTPUT FORMAT

Return a JSON object with EXACTLY this structure:

{
  "report_metadata": {
    "company_name": "Startup Name",
    "date": "2025-01-07",
    "version": "2.0"
  },

  "prose_report": {
    // EXISTING PROSE SECTIONS - KEEP AS-IS
    "problem_primer": {
      "content": "600-800 words educational narrative...",
      "source": "Synthesized from AN0-M and AN1.7"
    },
    "technical_deep_dive": {
      "content": "400-600 words on mechanism...",
      "source": "Synthesized from DD3-M"
    },
    "solution_landscape": {
      "content": "200-300 words framing...",
      "source": "Synthesized from AN3-M and DD4-M"
    },
    "commercialization_reality": {
      "content": "400-500 words on path to revenue...",
      "source": "Synthesized from DD3.5-M"
    },
    "investment_synthesis": {
      "content": "400-500 words pre-mortem + comparables...",
      "source": "Synthesized from DD4-M"
    }
  },

  "quick_reference": {
    // EXISTING QUICK REFERENCE - KEEP AS-IS FOR INNGEST COMPATIBILITY
    "one_page_summary": {
      "company": "...",
      "sector": "...",
      "one_sentence": "...",  // CRITICAL: Inngest headline extraction
      "executive_paragraph": "150-200 words...",
      "verdict_box": {
        "overall": "PROMISING"  // CRITICAL: Inngest verdict extraction
        // ... other verdict fields
      },
      "the_bet": "...",
      "key_strength": "...",
      "key_risk": "...",
      "expected_return": "..."
    },
    "scores": { ... },
    "scenarios": [ ... ],
    "key_risks": [ ... ],
    "founder_questions": [ ... ],
    "diligence_roadmap": [ ... ]
  },

  "cards": {
    // NEW: Structured cards for visual hierarchy

    "executive_summary": {
      "verdict_box": {
        "verdict": "PROMISING",
        "symbol": "◐",
        "one_liner": "Solid technical foundation, unproven unit economics"
      },
      "scores": [
        { "label": "Technical", "score": 7, "out_of": 10, "one_liner": "..." },
        { "label": "Commercial", "score": 5, "out_of": 10, "one_liner": "..." },
        { "label": "Moat", "score": 6, "out_of": 10, "one_liner": "..." }
      ],
      "key_insight": "The ONE thing to remember about this deal"
    },

    "problem_constraints": [
      {
        "constraint": "Thermodynamic minimum",
        "value": "125 kWh/ton",
        "implication": "Sets absolute floor for energy cost"
      }
    ],

    "concept_cards": [
      {
        "title": "BPMED pH-Swing DAC",
        "track": "best_fit",
        "feasibility": 7,
        "impact": 8,
        "one_liner": "Most mature electrochemical pathway",
        "key_risk": "Low current density = high membrane capital",
        "who_pursuing": ["Mission Zero", "Heimdal"],
        "startup_uses": true
      }
    ],

    "startup_position": {
      "their_approach": "Which concept(s) they're using",
      "track": "best_fit",
      "what_they_dismissed": ["Concept X", "Concept Y"],
      "positioning_assessment": "REASONABLE"
    },

    "competitive_threats": [
      {
        "threat": "Heimdal ocean DAC",
        "threat_level": "HIGH",
        "why": "Eliminates air contactor capital entirely if MRV solved"
      }
    ],

    "claim_cards": [
      {
        "claim": "$100/ton CO₂ by 2030",
        "verdict": "PLAUSIBLE",
        "confidence": "55%",
        "one_liner": "Energy pathway exists but capital costs undemonstrated",
        "theoretical_limit": "~$50/ton at thermodynamic minimum",
        "their_claim_vs_limit": "2x theoretical minimum",
        "key_assumption": "Air contactor capital at $150/ton"
      }
    ],

    "scale_challenges": [
      {
        "challenge": "Air contactor scaling",
        "severity": "HIGH",
        "explanation": "..."
      }
    ],

    "unit_economics_bridge": {
      "current_cost": "$2.50/unit",
      "claimed_cost": "$1.00/unit",
      "gap": "60% reduction needed",
      "drivers": [
        { "driver": "Scale economies", "reduction": "$0.30", "validity": "REASONABLE" },
        { "driver": "Learning curve", "reduction": "$0.20", "validity": "OPTIMISTIC" },
        { "driver": "Assumed improvements", "reduction": "$0.50", "validity": "QUESTIONABLE" }
      ],
      "realistic_estimate": "$1.50-2.00/unit",
      "verdict": "OPTIMISTIC"
    },

    "customer_evidence": {
      "lois": 0,
      "pilots": 1,
      "revenue": "$0",
      "verdict": "UNVALIDATED"
    },

    "policy_dependency": {
      "critical_policies": ["45Q", "45V"],
      "economics_without_policy": "Negative margins",
      "policy_risk": "HIGH"
    },

    "the_bet_card": {
      "core_bet": "If you invest, you are betting that...",
      "technical_condition": "...",
      "commercial_condition": "...",
      "timing_condition": "..."
    },

    "scenario_cards": [
      {
        "scenario": "BULL",
        "probability": "12%",
        "return": "15-25x",
        "narrative": "2 sentences",
        "requires": ["Condition 1", "Condition 2"]
      },
      {
        "scenario": "BASE",
        "probability": "48%",
        "return": "3-5x",
        "narrative": "2 sentences",
        "requires": ["Condition"]
      },
      {
        "scenario": "BEAR",
        "probability": "40%",
        "return": "0.5-1x",
        "narrative": "2 sentences",
        "requires": []
      }
    ],

    "expected_value": {
      "weighted_multiple": "4.7x",
      "calculation": "(12% × 20x) + (48% × 4x) + (40% × 0.8x)",
      "assessment": "Acceptable for deep tech, not exceptional"
    },

    "action_cards": [
      {
        "action": "Commission FTO analysis on Origen patents",
        "priority": "CRITICAL",
        "cost": "$15-25K",
        "timeline": "4-6 weeks",
        "deal_breaker_if": "Clear infringement with no design-around"
      }
    ],

    "question_cards": [
      {
        "question": "...",
        "why_critical": "...",
        "good_answer": "...",
        "bad_answer": "..."
      }
    ]
  },

  "appendix": {
    // EXISTING APPENDIX - KEEP AS-IS
  }
}
`;
```

### Task 2.2: Add Visual Hierarchy Instructions to Prompt

```typescript
const VISUAL_HIERARCHY_INSTRUCTIONS = `
## VISUAL HIERARCHY PRINCIPLE

The report has THREE scanning speeds:

**5-second scan**: Executive summary + verdict box only
- Partner decides: "Is this worth 5 minutes?"

**5-minute scan**: All cards, skip prose
- Partner decides: "Is this worth a deep read?"

**30-minute read**: Full prose + cards
- Partner decides: "Should we pursue this?"

Every section must work at all three speeds:
- Cards for scanning
- Prose for understanding
- Both for completeness

## CARD GUIDELINES

Cards are for DECIDING. They should be:
- Scannable in 2-3 seconds
- Self-contained (don't require reading prose)
- Verdict-forward (lead with the assessment)
- Quantified where possible

Prose is for TEACHING. It should be:
- Educational (explain WHY, not just WHAT)
- Narrative-driven (tell a story)
- Concise (reduced from 3,500 to 2,000-2,500 words total)
`;
```

### Task 2.3: Update Word Count Guidance

```typescript
// BEFORE (current)
const WORD_COUNTS = {
  problem_primer: '800-1,200 words',
  technical_deep_dive: '800-1,200 words',
  solution_landscape: '600-800 words',
  commercialization_reality: '600-800 words',
  investment_synthesis: '500-700 words',
  // Total: 3,300-4,700 words
};

// AFTER (reduced - cards carry the burden)
const WORD_COUNTS = {
  problem_primer: '600-800 words',  // -200 (constraints moved to cards)
  technical_deep_dive: '400-600 words',  // -400 (claims moved to cards)
  solution_landscape: '200-300 words',  // -400 (concepts are cards now)
  commercialization_reality: '400-500 words',  // -200 (bridge is a card)
  investment_synthesis: '400-500 words',  // -100 (scenarios are cards)
  // Total: 2,000-2,700 words
};
```

---

## Phase 3: Frontend Card Components

### Task 3.1: Create Card Primitives

**File:** `apps/web/app/app/reports/[id]/_components/brand-system/dd-cards.tsx`

```typescript
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { MonoLabel, BodyText, AccentBorder } from './primitives';

// Verdict Card - typography-driven, no colors
export const VerdictCard = memo(function VerdictCard({
  verdict,
  symbol,
  oneLiner,
}: {
  verdict: string;
  symbol?: string;
  oneLiner: string;
}) {
  const weightClasses: Record<string, string> = {
    COMPELLING: 'border-l-4 border-zinc-900',
    PROMISING: 'border-l-2 border-zinc-700',
    MIXED: 'border-l-2 border-zinc-400',
    CAUTION: 'border-l border-zinc-300',
    CONCERNING: 'border-l border-zinc-200',
  };

  return (
    <div className={cn('pl-6 py-4', weightClasses[verdict] || weightClasses.MIXED)}>
      <div className="flex items-center gap-2">
        {symbol && <span className="text-2xl">{symbol}</span>}
        <MonoLabel>{verdict}</MonoLabel>
      </div>
      <BodyText className="mt-2" variant="secondary">{oneLiner}</BodyText>
    </div>
  );
});

// Score Card - compact display
export const ScoreCard = memo(function ScoreCard({
  label,
  score,
  outOf = 10,
  oneLiner,
}: {
  label: string;
  score: number;
  outOf?: number;
  oneLiner?: string;
}) {
  return (
    <div className="space-y-1">
      <MonoLabel>{label}</MonoLabel>
      <div className="text-[28px] font-semibold text-zinc-900">
        {score}<span className="text-[16px] text-zinc-400">/{outOf}</span>
      </div>
      {oneLiner && <BodyText size="sm" variant="muted">{oneLiner}</BodyText>}
    </div>
  );
});

// Concept Card - solution landscape
export const ConceptCard = memo(function ConceptCard({
  title,
  track,
  feasibility,
  impact,
  oneLiner,
  keyRisk,
  whoPursuing,
  startupUses,
}: {
  title: string;
  track: string;
  feasibility: number;
  impact: number;
  oneLiner: string;
  keyRisk: string;
  whoPursuing: string[];
  startupUses: boolean;
}) {
  return (
    <AccentBorder weight={startupUses ? 'heavy' : 'light'}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <BodyText size="lg" className="font-semibold">{title}</BodyText>
            <MonoLabel variant="muted">{track.replace('_', ' ')}</MonoLabel>
          </div>
          {startupUses && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 border border-zinc-300 px-2 py-0.5 rounded">
              Their Approach
            </span>
          )}
        </div>

        <BodyText variant="secondary">{oneLiner}</BodyText>

        <div className="flex gap-6 text-[13px]">
          <span>Feasibility: {feasibility}/10</span>
          <span>Impact: {impact}/10</span>
        </div>

        <div className="text-[13px] text-zinc-500">
          <span className="font-medium">Key Risk:</span> {keyRisk}
        </div>

        {whoPursuing.length > 0 && (
          <div className="text-[12px] text-zinc-400">
            Also pursuing: {whoPursuing.join(', ')}
          </div>
        )}
      </div>
    </AccentBorder>
  );
});

// Claim Card - validation
export const ClaimCard = memo(function ClaimCard({
  claim,
  verdict,
  confidence,
  oneLiner,
  theoreticalLimit,
  keyAssumption,
}: {
  claim: string;
  verdict: string;
  confidence: string;
  oneLiner: string;
  theoreticalLimit?: string;
  keyAssumption?: string;
}) {
  const verdictBadge: Record<string, string> = {
    VALIDATED: 'bg-zinc-900 text-white',
    PLAUSIBLE: 'bg-zinc-200 text-zinc-900',
    QUESTIONABLE: 'bg-zinc-100 text-zinc-600',
    UNVALIDATED: 'border border-zinc-300 text-zinc-500',
  };

  return (
    <div className="border-l-2 border-zinc-200 pl-6 py-3 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <BodyText className="font-medium">"{claim}"</BodyText>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            'text-[11px] font-semibold uppercase px-2 py-0.5 rounded',
            verdictBadge[verdict] || verdictBadge.QUESTIONABLE
          )}>
            {verdict}
          </span>
          <span className="text-[13px] text-zinc-500">{confidence}</span>
        </div>
      </div>

      <BodyText size="sm" variant="secondary">{oneLiner}</BodyText>

      {theoreticalLimit && (
        <div className="text-[12px] text-zinc-400">
          Theoretical limit: {theoreticalLimit}
        </div>
      )}

      {keyAssumption && (
        <div className="text-[12px] text-zinc-500">
          <span className="font-medium">Key assumption:</span> {keyAssumption}
        </div>
      )}
    </div>
  );
});

// Scenario Card
export const ScenarioCard = memo(function ScenarioCard({
  scenario,
  probability,
  returnRange,
  narrative,
  requires,
}: {
  scenario: 'BULL' | 'BASE' | 'BEAR';
  probability: string;
  returnRange: string;
  narrative: string;
  requires: string[];
}) {
  const scenarioBorder: Record<string, string> = {
    BULL: 'border-l-4 border-zinc-900',
    BASE: 'border-l-2 border-zinc-400',
    BEAR: 'border-l border-zinc-200',
  };

  return (
    <div className={cn('pl-6 py-4', scenarioBorder[scenario])}>
      <div className="flex items-baseline justify-between">
        <MonoLabel>{scenario}</MonoLabel>
        <div className="text-right">
          <span className="text-[20px] font-semibold">{returnRange}</span>
          <span className="text-[13px] text-zinc-400 ml-2">{probability}</span>
        </div>
      </div>

      <BodyText size="sm" className="mt-2" variant="secondary">{narrative}</BodyText>

      {requires.length > 0 && (
        <div className="mt-3 text-[12px] text-zinc-500">
          <span className="font-medium">Requires:</span> {requires.join(' + ')}
        </div>
      )}
    </div>
  );
});

// Action Card
export const ActionCard = memo(function ActionCard({
  action,
  priority,
  cost,
  timeline,
  dealBreakerIf,
}: {
  action: string;
  priority: string;
  cost?: string;
  timeline?: string;
  dealBreakerIf?: string;
}) {
  const priorityWeight: Record<string, string> = {
    CRITICAL: 'border-l-4 border-zinc-900',
    HIGH: 'border-l-2 border-zinc-700',
    MEDIUM: 'border-l-2 border-zinc-400',
    LOW: 'border-l border-zinc-200',
  };

  return (
    <div className={cn('pl-6 py-3', priorityWeight[priority] || priorityWeight.MEDIUM)}>
      <div className="flex items-start justify-between">
        <BodyText className="font-medium">{action}</BodyText>
        <MonoLabel variant="muted">{priority}</MonoLabel>
      </div>

      {(cost || timeline) && (
        <div className="flex gap-4 mt-2 text-[13px] text-zinc-500">
          {cost && <span>{cost}</span>}
          {timeline && <span>{timeline}</span>}
        </div>
      )}

      {dealBreakerIf && (
        <div className="mt-2 text-[12px] text-zinc-600">
          <span className="font-medium">Deal breaker if:</span> {dealBreakerIf}
        </div>
      )}
    </div>
  );
});

// Question Card
export const QuestionCard = memo(function QuestionCard({
  question,
  whyCritical,
  goodAnswer,
  badAnswer,
}: {
  question: string;
  whyCritical: string;
  goodAnswer: string;
  badAnswer: string;
}) {
  return (
    <div className="border-l-2 border-zinc-200 pl-6 py-3 space-y-3">
      <BodyText className="font-medium">{question}</BodyText>
      <BodyText size="sm" variant="secondary">{whyCritical}</BodyText>

      <div className="grid grid-cols-2 gap-4 text-[13px]">
        <div>
          <MonoLabel variant="muted">Good Answer</MonoLabel>
          <p className="mt-1 text-zinc-600">{goodAnswer}</p>
        </div>
        <div>
          <MonoLabel variant="muted">Bad Answer</MonoLabel>
          <p className="mt-1 text-zinc-400">{badAnswer}</p>
        </div>
      </div>
    </div>
  );
});

// Unit Economics Bridge Table
export const UnitEconomicsBridge = memo(function UnitEconomicsBridge({
  currentCost,
  claimedCost,
  gap,
  drivers,
  realisticEstimate,
  verdict,
}: {
  currentCost: string;
  claimedCost: string;
  gap: string;
  drivers: Array<{ driver: string; reduction: string; validity: string }>;
  realisticEstimate: string;
  verdict: string;
}) {
  const validityColor: Record<string, string> = {
    REASONABLE: 'text-zinc-900',
    OPTIMISTIC: 'text-zinc-600',
    QUESTIONABLE: 'text-zinc-400',
    UNVALIDATED: 'text-zinc-300',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-baseline border-b border-zinc-200 pb-3">
        <div>
          <MonoLabel variant="muted">Current</MonoLabel>
          <div className="text-[24px] font-semibold">{currentCost}</div>
        </div>
        <div className="text-center">
          <span className="text-[13px] text-zinc-400">Gap: {gap}</span>
        </div>
        <div className="text-right">
          <MonoLabel variant="muted">Claimed</MonoLabel>
          <div className="text-[24px] font-semibold">{claimedCost}</div>
        </div>
      </div>

      <table className="w-full text-[14px]">
        <thead>
          <tr className="text-left text-[12px] text-zinc-500 uppercase tracking-wider">
            <th className="pb-2">Driver</th>
            <th className="pb-2 text-right">Reduction</th>
            <th className="pb-2 text-right">Validity</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((d, i) => (
            <tr key={i} className="border-t border-zinc-100">
              <td className="py-2">{d.driver}</td>
              <td className="py-2 text-right font-medium">{d.reduction}</td>
              <td className={cn('py-2 text-right', validityColor[d.validity] || 'text-zinc-500')}>
                {d.validity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-baseline pt-3 border-t border-zinc-200">
        <div>
          <MonoLabel variant="muted">Realistic Estimate</MonoLabel>
          <div className="text-[20px] font-semibold">{realisticEstimate}</div>
        </div>
        <MonoLabel>{verdict}</MonoLabel>
      </div>
    </div>
  );
});
```

### Task 3.2: Update DD Report Display to Render Cards

**File:** `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx`

Add conditional rendering for cards when available:

```typescript
// In the render function, add card rendering alongside prose

// Executive Summary Section
{cards?.executive_summary?.verdict_box && (
  <VerdictCard
    verdict={cards.executive_summary.verdict_box.verdict}
    symbol={cards.executive_summary.verdict_box.symbol}
    oneLiner={cards.executive_summary.verdict_box.one_liner}
  />
)}

{cards?.executive_summary?.scores && cards.executive_summary.scores.length > 0 && (
  <div className="grid grid-cols-3 gap-8 mt-8">
    {cards.executive_summary.scores.map((score, i) => (
      <ScoreCard
        key={i}
        label={score.label}
        score={score.score}
        outOf={score.out_of}
        oneLiner={score.one_liner}
      />
    ))}
  </div>
)}

// Solution Landscape Section - Cards as primary, prose as secondary
{cards?.concept_cards && cards.concept_cards.length > 0 && (
  <div className="space-y-6 mt-8">
    <MonoLabel>Solution Concepts</MonoLabel>
    {cards.concept_cards.map((concept, i) => (
      <ConceptCard key={i} {...concept} />
    ))}
  </div>
)}

// Technical Validation Section - Claim cards
{cards?.claim_cards && cards.claim_cards.length > 0 && (
  <div className="space-y-4 mt-8">
    <MonoLabel>Claim Validation</MonoLabel>
    {cards.claim_cards.map((claim, i) => (
      <ClaimCard key={i} {...claim} />
    ))}
  </div>
)}

// Commercial Reality Section - Unit Economics Bridge
{cards?.unit_economics_bridge && (
  <div className="mt-8">
    <MonoLabel>Unit Economics Bridge</MonoLabel>
    <div className="mt-4">
      <UnitEconomicsBridge {...cards.unit_economics_bridge} />
    </div>
  </div>
)}

// Investment Thesis Section - Scenario Cards
{cards?.scenario_cards && cards.scenario_cards.length > 0 && (
  <div className="grid grid-cols-3 gap-6 mt-8">
    {cards.scenario_cards.map((scenario, i) => (
      <ScenarioCard
        key={i}
        scenario={scenario.scenario}
        probability={scenario.probability}
        returnRange={scenario.return}
        narrative={scenario.narrative}
        requires={scenario.requires}
      />
    ))}
  </div>
)}

// Diligence Actions Section
{cards?.action_cards && cards.action_cards.length > 0 && (
  <div className="space-y-4 mt-8">
    <MonoLabel>Critical Actions</MonoLabel>
    {cards.action_cards.map((action, i) => (
      <ActionCard key={i} {...action} />
    ))}
  </div>
)}

{cards?.question_cards && cards.question_cards.length > 0 && (
  <div className="space-y-4 mt-8">
    <MonoLabel>Founder Questions</MonoLabel>
    {cards.question_cards.map((question, i) => (
      <QuestionCard key={i} {...question} />
    ))}
  </div>
)}
```

### Task 3.3: Update TypeScript Types

**File:** `apps/web/app/app/reports/_lib/types/dd-report-display.types.ts`

```typescript
// Add card types
export interface DDCards {
  executive_summary?: {
    verdict_box?: {
      verdict: string;
      symbol?: string;
      one_liner: string;
    };
    scores?: Array<{
      label: string;
      score: number;
      out_of: number;
      one_liner?: string;
    }>;
    key_insight?: string;
  };

  problem_constraints?: Array<{
    constraint: string;
    value: string;
    implication: string;
  }>;

  concept_cards?: Array<{
    title: string;
    track: string;
    feasibility: number;
    impact: number;
    one_liner: string;
    key_risk: string;
    who_pursuing: string[];
    startup_uses: boolean;
  }>;

  // ... other card types
}

// Extend DD report type
export interface DDReportData {
  report_metadata?: { ... };
  prose_report?: { ... };
  quick_reference?: { ... };
  appendix?: { ... };
  cards?: DDCards;  // NEW - optional cards
  schema_version?: string;
}
```

---

## Phase 4: Testing & Validation

### Task 4.1: Schema Robustness Tests

**File:** `apps/web/lib/llm/prompts/dd/test-schema-v2.ts`

```typescript
import { DD5_M_OutputSchema, DD5_M_CardsSchema } from './schemas';

// Test 1: Old schema still parses
test('old schema without cards parses successfully', () => {
  const oldData = {
    prose_report: { problem_primer: { content: 'test', source: 'test' } },
    quick_reference: { one_page_summary: { one_sentence: 'test', verdict_box: { overall: 'PROMISING' } } },
  };

  expect(() => DD5_M_OutputSchema.parse(oldData)).not.toThrow();
});

// Test 2: New schema with cards parses
test('new schema with cards parses successfully', () => {
  const newData = {
    prose_report: { ... },
    quick_reference: { ... },
    cards: {
      executive_summary: { verdict_box: { verdict: 'PROMISING', one_liner: 'test' } },
      concept_cards: [{ title: 'Test', track: 'best_fit', feasibility: 7, impact: 8 }],
    },
  };

  expect(() => DD5_M_OutputSchema.parse(newData)).not.toThrow();
});

// Test 3: Missing cards defaults gracefully
test('missing cards object defaults to undefined', () => {
  const dataWithoutCards = {
    prose_report: { ... },
    quick_reference: { ... },
  };

  const parsed = DD5_M_OutputSchema.parse(dataWithoutCards);
  expect(parsed.cards).toBeUndefined();
});

// Test 4: Partial cards with flexible enums
test('cards with annotated enums parse correctly', () => {
  const data = {
    cards: {
      claim_cards: [{
        claim: 'test',
        verdict: 'PLAUSIBLE - with caveats',  // Should transform to 'PLAUSIBLE'
        confidence: '55%',
      }],
    },
  };

  const parsed = DD5_M_CardsSchema.parse(data);
  expect(parsed.claim_cards[0].verdict).toBe('PLAUSIBLE');
});
```

### Task 4.2: Inngest Flow Test

```typescript
// Verify metadata extraction still works with new schema
test('extractDD5Metadata works with cards schema', () => {
  const newFormatWithCards = {
    report_metadata: { company_name: 'TestCo' },
    quick_reference: {
      one_page_summary: {
        one_sentence: 'Test headline',
        verdict_box: { overall: 'PROMISING' },
      },
    },
    cards: { ... },
  };

  const metadata = extractDD5Metadata(newFormatWithCards);

  expect(metadata.companyName).toBe('TestCo');
  expect(metadata.headline).toBe('Test headline');
  expect(metadata.verdict).toBe('PROMISING');
});
```

### Task 4.3: Frontend Rendering Test

```typescript
// Verify cards render when present, fallback to prose when absent
test('renders cards when available', () => {
  const reportWithCards = {
    prose_report: { ... },
    cards: {
      concept_cards: [{ title: 'Test Concept', ... }],
    },
  };

  render(<DDReportDisplay reportData={reportWithCards} />);

  expect(screen.getByText('Test Concept')).toBeInTheDocument();
});

test('renders prose-only when cards absent', () => {
  const reportWithoutCards = {
    prose_report: {
      problem_primer: { content: 'Test prose content' },
    },
  };

  render(<DDReportDisplay reportData={reportWithoutCards} />);

  expect(screen.getByText('Test prose content')).toBeInTheDocument();
});
```

---

## Phase 5: Rollout Strategy

### Step 1: Deploy Schema Changes (No Breaking Changes)

1. Deploy new card type definitions
2. Deploy extended DD5_M_OutputSchema (additive)
3. Verify old reports still parse and render

### Step 2: Deploy Frontend Card Components

1. Deploy card component primitives
2. Deploy conditional card rendering in DD report display
3. Cards won't appear yet (no reports have cards)

### Step 3: Update DD5-M Prompt

1. Add cards section to prompt OUTPUT FORMAT
2. Update word count guidance
3. Add visual hierarchy instructions

### Step 4: Generate Test Reports

1. Generate 2-3 new DD reports with cards
2. Verify cards render correctly
3. Verify reading time calculation still works
4. Verify old reports still render correctly

### Step 5: Monitor & Iterate

1. Monitor for validation errors
2. Check card rendering quality
3. Gather feedback on visual hierarchy
4. Iterate on card designs as needed

---

## Success Criteria

- [ ] **Inngest flow unbroken**: Metadata extraction works for both old and new reports
- [ ] **Frontend rendering unbroken**: Old reports render correctly
- [ ] **New reports have cards**: Cards appear when generated with new prompt
- [ ] **Fallback works**: If cards missing, prose-only rendering works
- [ ] **Executive summary scannable**: Verdict box + scores fit in one viewport
- [ ] **Solution landscape visual**: 6-10 concept cards, not prose walls
- [ ] **Claim validation scannable**: Cards with verdict badges
- [ ] **Unit economics visual**: Bridge table, not prose
- [ ] **Scenarios scannable**: 3 cards side-by-side
- [ ] **Total prose reduced**: ~2,000-2,500 words (from 3,500-4,500)
- [ ] **Report scannable in 5 minutes**: All cards readable without prose
- [ ] **Report educational in 30 minutes**: Prose still tells complete story

---

## Files to Modify

| File | Changes |
|------|---------|
| `apps/web/lib/llm/prompts/dd/schemas.ts` | Add card type schemas, extend DD5_M_OutputSchema |
| `apps/web/lib/llm/prompts/dd/prompts.ts` | Add cards section to OUTPUT FORMAT, update word counts |
| `apps/web/app/app/reports/[id]/_components/brand-system/dd-cards.tsx` | NEW: Card component primitives |
| `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx` | Add conditional card rendering |
| `apps/web/app/app/reports/_lib/types/dd-report-display.types.ts` | Add DDCards type |
| `apps/web/lib/llm/prompts/dd/test-schema-v2.ts` | NEW: Schema robustness tests |

---

## References

### Internal Files
- Schema: `apps/web/lib/llm/prompts/dd/schemas.ts`
- Prompt: `apps/web/lib/llm/prompts/dd/prompts.ts`
- Inngest: `apps/web/lib/inngest/functions/generate-dd-report.ts`
- Frontend: `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx`
- Primitives: `apps/web/app/app/reports/[id]/_components/brand-system/primitives.tsx`
- Hybrid reference: `apps/web/app/app/reports/[id]/_components/brand-system/brand-system-report.tsx`

### External Best Practices
- Antifragile Schema Design: Additive-only changes, flexible enums, defaults
- Expand-Contract Pattern: Add new alongside old, migrate, then deprecate
- LLM Schema Evolution: Version detection, graceful fallbacks, validation with retry
