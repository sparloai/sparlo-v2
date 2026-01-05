---
status: pending
priority: p1
issue_id: "144"
tags: [data-integrity, dd-mode, migration, breaking-change, critical]
dependencies: []
---

# DD Mode v2: Missing Version Migration Strategy

## Problem Statement

Hard-coded version `'2.0.0'` with no backward compatibility handling for existing v1 reports. When v2 code is deployed, all pre-existing DD reports become unreadable - display code expects v2 structure with DD3.5 step and new fields that don't exist in v1 reports.

## Findings

**Location:** `/apps/web/lib/inngest/functions/generate-dd-report.ts:862`

**Breaking changes in v2:**
- `DD3.5` (Commercialization Analysis) - entirely new chain step
- `commercial_assumptions` array in DD0
- `policy_dependencies` and `ecosystem_map` in DD0
- `the_one_bet`, `pre_mortem`, `comparable_analysis`, `scenario_analysis` in DD4
- New verdict enums: `CommercialViabilityVerdict`, `BetQuality`, `CompanyOutcome`

**Data corruption scenario:**
1. User generates DD report on v1 (before deployment)
2. System deployed with v2 code
3. User opens old v1 report
4. Display code expects v2 structure with `commercialization_analysis`
5. TypeScript/Zod validation fails
6. Application crashes or shows error
7. User loses access to all historical reports

**Evidence - no version handling found:**
```bash
grep -r "version.*2\.0\.0" apps/web/
# Only found in generation, not in read/display logic
```

## Proposed Solutions

### Option A: Runtime Migration Function (Recommended)
- Add `migrateReportData()` function
- Detect version and transform to v2 structure
- Fill missing fields with safe defaults
- Pros: Preserves all historical data
- Cons: Adds runtime overhead
- Effort: Medium (4-6 hours)
- Risk: Low

### Option B: Database Migration Script
- One-time script to update all v1 reports
- Transform in-place to v2 structure
- Pros: Clean data, no runtime overhead
- Cons: Irreversible, risky for production
- Effort: Medium (4-6 hours)
- Risk: High

### Option C: Dual Display Logic
- Maintain separate display components for v1 and v2
- Route based on version field
- Pros: No data modification needed
- Cons: Code duplication, maintenance burden
- Effort: High (8+ hours)
- Risk: Medium

## Recommended Action

[To be filled during triage]

## Acceptance Criteria

- [ ] Migration function handles v1 → v2 transformation
- [ ] Missing DD3.5 data gets sensible defaults
- [ ] All historical reports remain accessible
- [ ] Version detection works for reports without version field
- [ ] Tests cover v1 report migration
- [ ] Read-time validation catches corrupted data

## Technical Details

**Affected files:**
- `apps/web/lib/inngest/functions/generate-dd-report.ts`
- Report display components
- New migration utility needed

**Migration function example:**
```typescript
function migrateReportData(data: unknown): ReportDataV2 {
  const version = (data as any)?.version || '1.0.0';

  if (version === '1.0.0') {
    return {
      ...data,
      version: '2.0.0',
      commercialization_analysis: generateDefaultDD3_5(),
      // Fill other missing v2 fields with defaults
    };
  }

  return ReportDataV2Schema.parse(data);
}
```

## Work Log

### 2026-01-03 - Issue Created

**By:** Claude Code

**Actions:**
- Identified during DD Mode v2 data integrity review
- Analyzed schema differences between v1 and v2
- Proposed runtime migration approach

**Learnings:**
- Schema versions need explicit migration paths
- Breaking changes require backward compatibility handling
- GDPR implications if user data becomes inaccessible
