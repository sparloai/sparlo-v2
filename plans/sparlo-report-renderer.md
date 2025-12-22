# SPARLO Report Renderer - Frontier Intelligence Section

## Overview

Elevate the `frontier_watch` section to a top-level section with its own prominent header in the hybrid report display. Add web search enhanced fields (recent_developments, trl_estimate, competitive_activity) to the UI.

## Current State

**File**: `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`

The `frontier_watch` is currently rendered as a subsection inside `InnovationPortfolioSection` (lines 1528-1571):
- Nested under "Innovation Portfolio" header
- Uses "Frontier Watch" subheader with "Monitor Only" badge
- Displays in a 2-column grid

**Schema**: `apps/web/lib/llm/prompts/hybrid/schemas.ts`

`FrontierWatchSchema` now includes web search enhanced fields:
```typescript
// Web search enhanced fields (optional)
recent_developments: z.string().optional(),
trl_estimate: z.number().int().min(1).max(9).optional(),
competitive_activity: z.string().optional(),
```

---

## Design Goals

1. **Prominent Section**: Frontier Intelligence as top-level section (same level as Executive Summary, Execution Track)
2. **Web Search Fields**: Display new fields when present (recent_developments, trl_estimate, competitive_activity)
3. **TRL Badge**: Visual indicator for Technology Readiness Level with color-coded tiers
4. **Antifragile**: Gracefully handle missing/partial data with optional chaining

---

## Implementation Plan

### Phase 1: Extract FrontierIntelligenceSection Component

Extract frontier_watch rendering from `InnovationPortfolioSection` into its own top-level section component.

**File**: `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`

Add new section component (after `InnovationPortfolioSection`):

```typescript
function FrontierIntelligenceSection({
  items,
}: {
  items: FrontierWatch[] | null | undefined;
}) {
  if (!items?.length) return null;

  return (
    <section id="frontier-intelligence">
      <SectionHeader
        icon={Eye}
        title="Frontier Intelligence"
        subtitle="Emerging technologies and innovations to monitor"
      />
      <div className="space-y-4">
        {items.map((item) => (
          <FrontierWatchCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function FrontierWatchCard({ item }: { item: FrontierWatch }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {item.title}
          </h3>
          {item.one_liner && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {item.one_liner}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <InnovationTypeBadge innovationType={item.innovation_type} />
          {item.trl_estimate && <TRLBadge level={item.trl_estimate} />}
        </div>
      </div>

      {/* Core fields */}
      <div className="grid gap-3 text-sm">
        {item.why_interesting && (
          <LabeledField label="Why Interesting" value={item.why_interesting} />
        )}
        {item.why_not_now && (
          <LabeledField label="Why Not Now" value={item.why_not_now} icon={Clock} />
        )}
        {item.trigger_to_revisit && (
          <LabeledField label="Trigger to Revisit" value={item.trigger_to_revisit} icon={AlertTriangle} />
        )}
        {item.who_to_monitor && (
          <LabeledField label="Who to Monitor" value={item.who_to_monitor} icon={Users} />
        )}
        {item.earliest_viability && (
          <LabeledField label="Earliest Viability" value={item.earliest_viability} />
        )}
      </div>

      {/* Web search enhanced fields */}
      {(item.recent_developments || item.competitive_activity) && (
        <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-800 dark:bg-violet-900/20">
          <div className="mb-2 flex items-center gap-2">
            <Search className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span className="text-xs font-medium tracking-wider text-violet-600 uppercase dark:text-violet-400">
              Web Search Intelligence
            </span>
          </div>
          <div className="space-y-2 text-sm">
            {item.recent_developments && (
              <div>
                <span className="font-medium text-zinc-700 dark:text-zinc-200">
                  Recent Developments:
                </span>{' '}
                <span className="text-zinc-600 dark:text-zinc-300">
                  {item.recent_developments}
                </span>
              </div>
            )}
            {item.competitive_activity && (
              <div>
                <span className="font-medium text-zinc-700 dark:text-zinc-200">
                  Competitive Activity:
                </span>{' '}
                <span className="text-zinc-600 dark:text-zinc-300">
                  {item.competitive_activity}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LabeledField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-400" />}
      <div>
        <span className="font-medium text-zinc-500 dark:text-zinc-400">{label}:</span>{' '}
        <span className="text-zinc-700 dark:text-zinc-200">{value}</span>
      </div>
    </div>
  );
}
```

---

### Phase 2: Add TRLBadge Component

Add Technology Readiness Level badge with color-coded tiers:

```typescript
type TRLLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

function TRLBadge({ level }: { level: number }) {
  // Validate TRL is in valid range
  if (level < 1 || level > 9 || !Number.isInteger(level)) {
    return null;
  }

  const getTierConfig = (trl: number) => {
    if (trl <= 3) {
      return {
        label: 'Early Research',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      };
    }
    if (trl <= 6) {
      return {
        label: 'Development',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      };
    }
    return {
      label: 'Mature',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
  };

  const config = getTierConfig(level);

  return (
    <Badge variant="secondary" className={cn('text-xs', config.className)}>
      TRL {level}
    </Badge>
  );
}
```

---

### Phase 3: Update Main Component

Modify `HybridReportDisplay` to render `FrontierIntelligenceSection` as a top-level section:

```typescript
export function HybridReportDisplay({ reportData }: HybridReportDisplayProps) {
  const report = reportData.report;
  // ... existing code ...

  return (
    <div className="space-y-12">
      {/* Executive Summary */}
      {/* ... */}

      {/* Honest Assessment */}
      <HonestAssessmentSection assessment={report.honest_assessment} />

      {/* Cross-Domain Search */}
      <CrossDomainSearchSection search={report.cross_domain_search} />

      {/* Execution Track */}
      <ExecutionTrackSection track={report.execution_track} />

      {/* Innovation Portfolio (without frontier_watch) */}
      <InnovationPortfolioSection
        portfolio={report.innovation_portfolio}
        excludeFrontierWatch={true}  // NEW: Flag to exclude frontier_watch
      />

      {/* NEW: Frontier Intelligence as top-level section */}
      <FrontierIntelligenceSection
        items={report.innovation_portfolio?.frontier_watch}
      />

      {/* Strategic Integration */}
      <StrategicIntegrationSection integration={report.strategic_integration} />

      {/* ... rest of sections ... */}
    </div>
  );
}
```

---

### Phase 4: Update InnovationPortfolioSection

Add `excludeFrontierWatch` prop to prevent duplicate rendering:

```typescript
function InnovationPortfolioSection({
  portfolio,
  excludeFrontierWatch = false,
}: {
  portfolio?: InnovationPortfolio;
  excludeFrontierWatch?: boolean;
}) {
  if (!portfolio) return null;

  return (
    <section id="innovation-portfolio">
      {/* ... existing content ... */}

      {/* Only render frontier_watch if not excluded */}
      {!excludeFrontierWatch && portfolio.frontier_watch && portfolio.frontier_watch.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-700 dark:bg-zinc-800/50">
          {/* ... existing frontier_watch rendering ... */}
        </div>
      )}
    </section>
  );
}
```

---

### Phase 5: Update FrontierWatch Interface

Update the interface to include the new web search fields:

```typescript
interface FrontierWatch {
  id?: string;
  title?: string;
  one_liner?: string;
  innovation_type?: string;
  source_domain?: string;
  why_interesting?: string;
  why_not_now?: string;
  trigger_to_revisit?: string;
  who_to_monitor?: string;
  earliest_viability?: string;
  // NEW: Web search enhanced fields
  recent_developments?: string;
  trl_estimate?: number;
  competitive_activity?: string;
}
```

---

## Files to Modify

1. **`hybrid-report-display.tsx`** (single file, ~100 lines of changes):
   - Add `FrontierIntelligenceSection` component
   - Add `FrontierWatchCard` component
   - Add `TRLBadge` component
   - Add `LabeledField` helper component
   - Update `FrontierWatch` interface with new fields
   - Update `InnovationPortfolioSection` with `excludeFrontierWatch` prop
   - Update `HybridReportDisplay` to render new section

---

## Design Decisions

### Why Modify Existing File vs New Architecture?

The existing `hybrid-report-display.tsx` is a 2200+ line monolithic component. The reviewers raised valid concerns about a transform layer and new abstraction files. Given:

1. **Existing Pattern**: All sections are already inline in this file
2. **No Schema Transformation Needed**: The LLM output schema already has `.passthrough()` making it antifragile
3. **Consistency**: Match existing code style and patterns
4. **Simplicity**: One file to modify, not 9 new files

### Why Keep All Optional Fields?

The component already uses optional chaining extensively (`item.why_interesting &&`). This matches the existing codebase pattern and provides antifragile rendering without new abstractions.

### Error Handling

The existing component already handles missing data by checking `if (!portfolio) return null;` at the section level. We maintain this pattern for `FrontierIntelligenceSection`.

---

## Testing Checklist

- [ ] Frontier Intelligence renders as top-level section with `SectionHeader`
- [ ] TRL badge displays with correct color tiers (1-3: red, 4-6: yellow, 7-9: green)
- [ ] TRL badge handles invalid values gracefully (returns null)
- [ ] Web search fields display when present
- [ ] Web search section has visual distinction (violet background)
- [ ] Missing fields don't break rendering
- [ ] Innovation Portfolio no longer shows frontier_watch (no duplication)
- [ ] TypeScript compiles without errors
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint:fix` passes

---

## Success Criteria

1. Frontier Intelligence has its own prominent top-level section header
2. Web search enhanced fields (recent_developments, trl_estimate, competitive_activity) display when available
3. TRL badge shows color-coded technology readiness
4. No duplication - frontier_watch removed from Innovation Portfolio section
5. Consistent with existing codebase patterns
6. All optional fields handled gracefully
