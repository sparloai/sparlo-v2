# DD Report: Hybrid Visual Hierarchy (Engineering Report Pattern)

## Priority: LAUNCH SAFETY FIRST

**Critical constraint**: Launching tomorrow. Schema changes MUST NOT break Inngest or rendering.

## Strategy: 100% Additive Schema Changes

All new fields will be:
1. `.optional()` - never required
2. `.catch({})` or `.default([])` - always have fallbacks
3. Added to EXISTING schemas (not replacing)
4. Backwards compatible - old reports render unchanged

---

## Reviewer Feedback Applied

**DHH**: Use 2 generic components (DataTable + Badge) instead of 10 specialized ones
**Kieran**: Use `z.infer<>` for types (no duplicate interfaces), zinc-scale badges
**Simplicity**: 64% LOC reduction possible

**Design Decisions (User Confirmed)**:
- Use **zinc-scale badges** (monochrome per design system)
- Keep **"If This Were My Deal"** as dedicated section

---

## Phase 1: Schema Changes (SAFE)

**File**: `apps/web/lib/llm/prompts/dd/schemas.ts`

### 1.1 Add New Row Schemas (Before DD5_M_QuickReferenceSchema ~line 2759)

```typescript
// ============================================
// NEW: Visual hierarchy table schemas for DD reports
// All have .catch() for antifragility - LLM output can vary
// ============================================

// Competitor/Prior Art table rows
const CompetitorRowSchema = z.object({
  entity: z.string().catch(''),
  approach: z.string().catch(''),
  performance: z.string().optional(),
  limitation: z.string().optional(),
});

// Claim validation as table rows (inline verdicts)
const ClaimValidationRowSchema = z.object({
  claim: z.string().catch(''),
  verdict: flexibleEnum(['VALIDATED', 'PLAUSIBLE', 'QUESTIONABLE', 'IMPLAUSIBLE'], 'PLAUSIBLE'),
  confidence: z.string().optional(),
  reasoning: z.string().catch(''),
});

// Solution concepts list (not cards)
const SolutionConceptRowSchema = z.object({
  title: z.string().catch(''),
  track: flexibleEnum(['simpler_path', 'best_fit', 'paradigm_shift', 'frontier_transfer'], 'best_fit'),
  description: z.string().catch(''),
  who_pursuing: z.array(z.string()).optional().default([]),
  feasibility: flexibleNumber(5, { min: 1, max: 10 }).optional(),
  impact: flexibleNumber(5, { min: 1, max: 10 }).optional(),
  startup_approach: z.boolean().optional().default(false),
});

// Unit economics bridge table
const EconomicsBridgeRowSchema = z.object({
  line_item: z.string().catch(''),
  current: z.string().optional(),
  target: z.string().optional(),
  gap: z.string().optional(),
  validity: flexibleEnum(['VALIDATED', 'REASONABLE', 'OPTIMISTIC', 'UNREALISTIC'], 'REASONABLE'),
});

// Risk table rows (with category + severity)
const RiskTableRowSchema = z.object({
  risk: z.string().catch(''),
  category: flexibleEnum(['TECHNICAL', 'COMMERCIAL', 'REGULATORY', 'MARKET', 'EXECUTION'], 'TECHNICAL'),
  severity: Severity,
  mitigation: z.string().optional(),
});

// Validation gaps (self-critique)
const ValidationGapRowSchema = z.object({
  concern: z.string().catch(''),
  status: flexibleEnum(['ADDRESSED', 'NEEDS_VALIDATION', 'ACCEPTED_RISK'], 'NEEDS_VALIDATION'),
  rationale: z.string().optional(),
});

// Economics bridge container
const EconomicsBridgeSchema = z.object({
  current_state: z.string().optional(),
  target_state: z.string().optional(),
  rows: z.array(EconomicsBridgeRowSchema).optional().default([]),
  realistic_estimate: z.string().optional(),
  verdict: z.string().optional(),
}).catch({});

// Diligence action with cost/timeline
const DiligenceActionSchema = z.object({
  action: z.string().catch(''),
  priority: flexibleEnum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], 'MEDIUM'),
  cost: z.string().optional(),
  timeline: z.string().optional(),
});
```

### 1.2 Extend DD5_M_QuickReferenceSchema (Add to existing object ~line 2872)

Add these fields INSIDE the existing `DD5_M_QuickReferenceSchema` before the closing `});`:

```typescript
  // NEW: Tables for visual hierarchy (all optional with defaults)
  competitor_landscape: z.array(CompetitorRowSchema).optional().default([]),
  claim_validation_table: z.array(ClaimValidationRowSchema).optional().default([]),
  solution_concepts: z.array(SolutionConceptRowSchema).optional().default([]),
  economics_bridge: EconomicsBridgeSchema.optional(),
  risks_table: z.array(RiskTableRowSchema).optional().default([]),
  validation_gaps: z.array(ValidationGapRowSchema).optional().default([]),
  diligence_actions: z.array(DiligenceActionSchema).optional().default([]),

  // NEW: Key insight highlights (for blockquotes)
  first_principles_insight: z.string().optional(),
  the_bet_statement: z.string().optional(),

  // NEW: Personal recommendation (first person)
  if_this_were_my_deal: z.string().optional(),
```

### 1.3 Extend DD5_M_ProseReportSchema (Optional new section ~line 2755)

Add this field to the existing prose schema:

```typescript
  if_this_were_my_deal: z.object({
    content: z.string().catch(''),
    source: z.string().catch(''),
  }).optional(),
```

---

## Phase 2: Prompt Changes

**File**: `apps/web/lib/llm/prompts/dd/prompts.ts`

### 2.1 Update DD5-M OUTPUT FORMAT section

Replace the OUTPUT FORMAT JSON structure in `DD5_M_PROMPT` with the new structure that includes tables. The key additions:

1. Add `competitor_landscape` array in quick_reference
2. Add `claim_validation_table` array
3. Add `solution_concepts` array with `startup_approach` boolean
4. Add `economics_bridge` object with rows
5. Add `risks_table` array with category/severity
6. Add `validation_gaps` array
7. Add `first_principles_insight` string
8. Add `the_bet_statement` string
9. Add `if_this_were_my_deal` string

**Important**: Keep ALL existing fields. Only ADD new ones.

---

## Phase 3: Rendering Changes

**File**: `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx`

### 3.1 Add New TypeScript Interfaces (after line ~130)

```typescript
// New table interfaces
interface CompetitorRow {
  entity: string;
  approach: string;
  performance?: string;
  limitation?: string;
}

interface ClaimValidationRow {
  claim: string;
  verdict: string;
  confidence?: string;
  reasoning: string;
}

interface SolutionConceptRow {
  title: string;
  track: string;
  description: string;
  who_pursuing?: string[];
  feasibility?: number;
  impact?: number;
  startup_approach?: boolean;
}

interface EconomicsBridgeRow {
  line_item: string;
  current?: string;
  target?: string;
  gap?: string;
  validity: string;
}

interface RiskTableRow {
  risk: string;
  category: string;
  severity: string;
  mitigation?: string;
}

interface ValidationGapRow {
  concern: string;
  status: string;
  rationale?: string;
}

interface DiligenceAction {
  action: string;
  priority: string;
  cost?: string;
  timeline?: string;
}

interface EconomicsBridge {
  current_state?: string;
  target_state?: string;
  rows?: EconomicsBridgeRow[];
  realistic_estimate?: string;
  verdict?: string;
}
```

### 3.2 Update QuickReference Interface

Add to existing QuickReference interface:

```typescript
interface QuickReference {
  // ... existing fields ...

  // NEW: Tables
  competitor_landscape?: CompetitorRow[];
  claim_validation_table?: ClaimValidationRow[];
  solution_concepts?: SolutionConceptRow[];
  economics_bridge?: EconomicsBridge;
  risks_table?: RiskTableRow[];
  validation_gaps?: ValidationGapRow[];
  diligence_actions?: DiligenceAction[];

  // NEW: Highlights
  first_principles_insight?: string;
  the_bet_statement?: string;
  if_this_were_my_deal?: string;
}
```

### 3.3 Add New Table Components

```typescript
// Competitor Landscape Table
const CompetitorTable = memo(function CompetitorTable({
  competitors
}: {
  competitors?: CompetitorRow[]
}) {
  if (!competitors?.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200">
          <tr className="text-left text-zinc-500">
            <th className="py-2 pr-4 font-medium">Entity</th>
            <th className="py-2 pr-4 font-medium">Approach</th>
            <th className="py-2 pr-4 font-medium">Performance</th>
            <th className="py-2 font-medium">Limitation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {competitors.map((row, i) => (
            <tr key={i}>
              <td className="py-3 pr-4 font-medium text-zinc-900">{row.entity}</td>
              <td className="py-3 pr-4 text-zinc-600">{row.approach}</td>
              <td className="py-3 pr-4 text-zinc-600">{row.performance || '—'}</td>
              <td className="py-3 text-zinc-500">{row.limitation || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// Claim Validation Table (with inline badges)
const ClaimValidationTable = memo(function ClaimValidationTable({
  claims
}: {
  claims?: ClaimValidationRow[]
}) {
  if (!claims?.length) return null;

  const verdictStyles: Record<string, string> = {
    VALIDATED: 'bg-green-100 text-green-700',
    PLAUSIBLE: 'bg-yellow-100 text-yellow-700',
    QUESTIONABLE: 'bg-orange-100 text-orange-700',
    IMPLAUSIBLE: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-4">
      {claims.map((claim, i) => (
        <div key={i} className="border-l-2 border-zinc-200 pl-4 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "px-2 py-0.5 text-xs font-medium rounded",
              verdictStyles[claim.verdict] || 'bg-zinc-100 text-zinc-700'
            )}>
              {claim.verdict}
            </span>
            {claim.confidence && (
              <span className="text-xs text-zinc-400 font-mono">{claim.confidence}</span>
            )}
          </div>
          <p className="font-medium text-zinc-900">{claim.claim}</p>
          <p className="text-sm text-zinc-600 mt-1">{claim.reasoning}</p>
        </div>
      ))}
    </div>
  );
});

// First Principles Insight (blockquote)
const InsightBlockquote = memo(function InsightBlockquote({
  insight
}: {
  insight?: string
}) {
  if (!insight) return null;
  return (
    <blockquote className="border-l-4 border-zinc-900 pl-4 py-2 my-6 bg-zinc-50 rounded-r-lg">
      <p className="text-lg font-medium text-zinc-900 italic">{insight}</p>
    </blockquote>
  );
});

// The Bet (dark highlighted box)
const TheBetHighlight = memo(function TheBetHighlight({
  bet
}: {
  bet?: string
}) {
  if (!bet) return null;
  return (
    <div className="bg-zinc-900 text-white p-6 rounded-lg my-6">
      <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">The Bet</p>
      <p className="text-lg leading-relaxed">{bet}</p>
    </div>
  );
});

// Economics Bridge Table
const EconomicsBridgeTable = memo(function EconomicsBridgeTable({
  bridge
}: {
  bridge?: EconomicsBridge
}) {
  if (!bridge?.rows?.length) return null;

  const validityStyles: Record<string, string> = {
    VALIDATED: 'text-green-600',
    REASONABLE: 'text-green-600',
    OPTIMISTIC: 'text-yellow-600',
    UNREALISTIC: 'text-red-600',
  };

  return (
    <div className="border border-zinc-200 rounded-lg overflow-hidden">
      {(bridge.current_state || bridge.target_state) && (
        <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200">
          <div className="flex justify-between text-sm">
            {bridge.current_state && <span>Current: <strong>{bridge.current_state}</strong></span>}
            <span className="text-zinc-400">→</span>
            {bridge.target_state && <span>Target: <strong>{bridge.target_state}</strong></span>}
          </div>
        </div>
      )}
      <table className="w-full text-sm">
        <tbody className="divide-y divide-zinc-100">
          {bridge.rows.map((row, i) => (
            <tr key={i}>
              <td className="px-4 py-2 text-zinc-700">{row.line_item}</td>
              <td className="px-4 py-2 text-right font-mono text-zinc-600">{row.gap || '—'}</td>
              <td className={cn("px-4 py-2 text-right text-xs font-medium", validityStyles[row.validity] || 'text-zinc-500')}>
                {row.validity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(bridge.realistic_estimate || bridge.verdict) && (
        <div className="bg-zinc-50 px-4 py-3 border-t border-zinc-200">
          <div className="flex justify-between text-sm">
            {bridge.realistic_estimate && <span>Realistic: <strong>{bridge.realistic_estimate}</strong></span>}
            {bridge.verdict && <span className="text-zinc-500">{bridge.verdict}</span>}
          </div>
        </div>
      )}
    </div>
  );
});

// Solution Concepts List (not cards)
const SolutionConceptsList = memo(function SolutionConceptsList({
  concepts
}: {
  concepts?: SolutionConceptRow[]
}) {
  if (!concepts?.length) return null;

  const trackLabels: Record<string, { label: string; color: string }> = {
    simpler_path: { label: 'Simpler Path', color: 'bg-blue-100 text-blue-700' },
    best_fit: { label: 'Best Fit', color: 'bg-green-100 text-green-700' },
    paradigm_shift: { label: 'Paradigm Shift', color: 'bg-purple-100 text-purple-700' },
    frontier_transfer: { label: 'Frontier', color: 'bg-amber-100 text-amber-700' },
  };

  return (
    <div className="space-y-4">
      {concepts.map((concept, i) => {
        const track = trackLabels[concept.track] || { label: concept.track, color: 'bg-zinc-100 text-zinc-700' };
        return (
          <div
            key={i}
            className={cn(
              "border-l-2 pl-4 py-2",
              concept.startup_approach ? "border-zinc-900 bg-zinc-50 rounded-r-lg" : "border-zinc-200"
            )}
          >
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn("px-2 py-0.5 text-xs font-medium rounded", track.color)}>
                {track.label}
              </span>
              <span className="font-medium text-zinc-900">{concept.title}</span>
              {concept.startup_approach && (
                <span className="text-xs bg-zinc-900 text-white px-2 py-0.5 rounded">Their Approach</span>
              )}
            </div>
            <p className="text-sm text-zinc-600">{concept.description}</p>
            {(concept.feasibility || concept.impact || concept.who_pursuing?.length) && (
              <div className="flex gap-4 mt-2 text-xs text-zinc-500 flex-wrap">
                {concept.feasibility && <span>Feasibility: {concept.feasibility}/10</span>}
                {concept.impact && <span>Impact: {concept.impact}/10</span>}
                {concept.who_pursuing?.length ? <span>Also: {concept.who_pursuing.join(', ')}</span> : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

// Risks Table (with category badges)
const RisksTable = memo(function RisksTable({
  risks
}: {
  risks?: RiskTableRow[]
}) {
  if (!risks?.length) return null;

  const categoryStyles: Record<string, string> = {
    TECHNICAL: 'bg-blue-100 text-blue-700',
    COMMERCIAL: 'bg-green-100 text-green-700',
    REGULATORY: 'bg-purple-100 text-purple-700',
    MARKET: 'bg-orange-100 text-orange-700',
    EXECUTION: 'bg-zinc-100 text-zinc-700',
  };

  return (
    <div className="space-y-4">
      {risks.map((risk, idx) => (
        <div key={idx} className="border-l-2 border-zinc-200 pl-4 py-2">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={cn(
              "px-2 py-0.5 text-xs font-medium rounded",
              categoryStyles[risk.category] || 'bg-zinc-100 text-zinc-700'
            )}>
              {risk.category}
            </span>
            <RiskSeverityIndicator severity={risk.severity || 'MEDIUM'} />
          </div>
          <BodyText variant="primary" className="font-medium">{risk.risk}</BodyText>
          {risk.mitigation && (
            <BodyText variant="muted" size="sm" className="mt-2">
              Mitigation: {risk.mitigation}
            </BodyText>
          )}
        </div>
      ))}
    </div>
  );
});

// Validation Gaps (Self-Critique)
const ValidationGapsTable = memo(function ValidationGapsTable({
  gaps
}: {
  gaps?: ValidationGapRow[]
}) {
  if (!gaps?.length) return null;

  const statusStyles: Record<string, string> = {
    ADDRESSED: 'bg-green-100 text-green-700',
    NEEDS_VALIDATION: 'bg-yellow-100 text-yellow-700',
    ACCEPTED_RISK: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-3">
      {gaps.map((gap, i) => (
        <div key={i} className="flex items-start gap-3 border-l-2 border-zinc-200 pl-4 py-2">
          <span className={cn(
            "px-2 py-0.5 text-xs font-medium rounded shrink-0",
            statusStyles[gap.status] || 'bg-zinc-100 text-zinc-700'
          )}>
            {gap.status.replace(/_/g, ' ')}
          </span>
          <div>
            <p className="text-zinc-900">{gap.concern}</p>
            {gap.rationale && <p className="text-sm text-zinc-500 mt-1">{gap.rationale}</p>}
          </div>
        </div>
      ))}
    </div>
  );
});

// Diligence Actions (with cost/timeline)
const DiligenceActionsTable = memo(function DiligenceActionsTable({
  actions
}: {
  actions?: DiligenceAction[]
}) {
  if (!actions?.length) return null;

  return (
    <div className="space-y-3">
      {actions.map((action, i) => (
        <div key={i} className="flex items-start gap-4 border-l-2 border-zinc-200 pl-4 py-2">
          <RiskSeverityIndicator severity={action.priority || 'MEDIUM'} label={action.priority} />
          <div className="flex-1">
            <p className="text-zinc-900 font-medium">{action.action}</p>
            {(action.cost || action.timeline) && (
              <div className="flex gap-4 mt-1 text-xs text-zinc-500">
                {action.cost && <span>Cost: {action.cost}</span>}
                {action.timeline && <span>Timeline: {action.timeline}</span>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

// If This Were My Deal (personal voice section)
const IfThisWereMyDeal = memo(function IfThisWereMyDeal({
  content
}: {
  content?: string
}) {
  if (!content) return null;
  return (
    <Section id="if-this-were-my-deal">
      <SectionTitle>If This Were My Deal</SectionTitle>
      <ArticleBlock className="mt-8">
        <div className="border-l-4 border-zinc-900 pl-6">
          <BodyText size="lg" className="italic text-zinc-700">
            {content}
          </BodyText>
        </div>
      </ArticleBlock>
    </Section>
  );
});
```

### 3.4 Update Main Render (Add sections to JSX)

Add these sections in the appropriate places in the main render:

```typescript
{/* After Executive Summary, before Scores */}
{quickRef?.first_principles_insight && (
  <InsightBlockquote insight={quickRef.first_principles_insight} />
)}

{quickRef?.the_bet_statement && (
  <TheBetHighlight bet={quickRef.the_bet_statement} />
)}

{/* After Scores, new Competitor section */}
{quickRef?.competitor_landscape && quickRef.competitor_landscape.length > 0 && (
  <Section id="competitor-landscape">
    <SectionTitle size="lg">Competitor Landscape</SectionTitle>
    <div className="mt-8">
      <CompetitorTable competitors={quickRef.competitor_landscape} />
    </div>
  </Section>
)}

{/* Claim Validation section */}
{quickRef?.claim_validation_table && quickRef.claim_validation_table.length > 0 && (
  <Section id="claim-validation">
    <SectionTitle size="lg">Claim Validation</SectionTitle>
    <div className="mt-8">
      <ClaimValidationTable claims={quickRef.claim_validation_table} />
    </div>
  </Section>
)}

{/* Solution Concepts section */}
{quickRef?.solution_concepts && quickRef.solution_concepts.length > 0 && (
  <Section id="solution-concepts">
    <SectionTitle size="lg">Solution Landscape</SectionTitle>
    <div className="mt-8">
      <SolutionConceptsList concepts={quickRef.solution_concepts} />
    </div>
  </Section>
)}

{/* Economics Bridge section */}
{quickRef?.economics_bridge && quickRef.economics_bridge.rows?.length > 0 && (
  <Section id="economics-bridge">
    <SectionTitle size="lg">Unit Economics Bridge</SectionTitle>
    <div className="mt-8">
      <EconomicsBridgeTable bridge={quickRef.economics_bridge} />
    </div>
  </Section>
)}

{/* Replace existing Key Risks with new table if available */}
{quickRef?.risks_table && quickRef.risks_table.length > 0 && (
  <Section id="risks-table">
    <SectionTitle size="lg">Key Risks</SectionTitle>
    <div className="mt-8">
      <RisksTable risks={quickRef.risks_table} />
    </div>
  </Section>
)}

{/* Validation Gaps (Self-Critique) */}
{quickRef?.validation_gaps && quickRef.validation_gaps.length > 0 && (
  <Section id="validation-gaps">
    <SectionTitle size="lg">Self-Critique</SectionTitle>
    <div className="mt-8">
      <ValidationGapsTable gaps={quickRef.validation_gaps} />
    </div>
  </Section>
)}

{/* Diligence Actions (enhanced roadmap) */}
{quickRef?.diligence_actions && quickRef.diligence_actions.length > 0 && (
  <Section id="diligence-actions">
    <SectionTitle size="lg">Diligence Actions</SectionTitle>
    <div className="mt-8">
      <DiligenceActionsTable actions={quickRef.diligence_actions} />
    </div>
  </Section>
)}

{/* If This Were My Deal (at end, before appendix) */}
{quickRef?.if_this_were_my_deal && (
  <IfThisWereMyDeal content={quickRef.if_this_were_my_deal} />
)}
```

---

## Safety Verification Checklist

Before deploying:

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint:fix` passes
- [ ] `pnpm format:fix` passes
- [ ] Generate a NEW DD report with updated prompts
- [ ] Verify OLD reports still render (backwards compatibility)
- [ ] Check Inngest functions complete without errors
- [ ] No console errors in browser

## Testing Plan

1. **Existing report test**: Load an existing DD report URL - should render unchanged
2. **Schema parse test**: Run the test-schema-robustness.ts if available
3. **New report test**: Generate a new DD report - should include new tables if LLM outputs them
4. **Graceful degradation**: New fields are optional, so reports without them still work

## Rollback Plan

If issues occur:
1. Schema changes are additive - can leave in place
2. Rendering components check for data existence - null/undefined handled
3. Prompt changes only affect NEW reports - old reports unaffected

## Files to Modify

| File | Change Type | Risk |
|------|-------------|------|
| `apps/web/lib/llm/prompts/dd/schemas.ts` | Add new schemas, extend existing | LOW (additive) |
| `apps/web/lib/llm/prompts/dd/prompts.ts` | Update DD5-M OUTPUT FORMAT | MEDIUM (prompt change) |
| `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx` | Add components, extend interfaces | LOW (optional rendering) |

## Implementation Order

1. **Schema first** - Add all new schemas with defaults
2. **Type check** - Ensure no type errors
3. **Rendering components** - Add new table components
4. **Prompt last** - Only after schema + rendering ready
5. **Test** - Generate new report, verify old reports
