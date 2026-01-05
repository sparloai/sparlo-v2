---
status: pending
priority: p3
issue_id: "154"
tags: [quality, dd-mode, schemas, robustness]
dependencies: []
---

# DD Mode v2: Add Antifragile Enum Patterns

## Problem Statement

DD Mode uses direct `z.enum()` without transformation layer, while Hybrid Mode uses `createAntifragileEnum()` for handling LLM output variations. DD schemas may be more fragile to LLM output variations like "HIGH" vs "Hi" vs "high".

## Findings

**DD Mode (fragile):**
```typescript
export const Confidence = z.enum(['HIGH', 'MEDIUM', 'LOW']);
```

**Hybrid Mode (antifragile):**
```typescript
export const ConfidenceLevel = createAntifragileEnum(
  ['HIGH', 'MEDIUM', 'LOW'] as const,
  { HIGH: 'HIGH', HI: 'HIGH', MEDIUM: 'MEDIUM', MED: 'MEDIUM', LOW: 'LOW', LO: 'LOW' },
  'MEDIUM'
);
```

## Proposed Solutions

### Option A: Add Antifragile Transformations
- Create transformation layer for common enums
- Handle case variations and abbreviations
- Pros: More robust to LLM variations
- Cons: Minor code additions
- Effort: Low (2-3 hours)
- Risk: Low

## Acceptance Criteria

- [ ] Confidence, Severity, ValidationPriority use antifragile patterns
- [ ] Case variations handled (HIGH, High, high)
- [ ] Common abbreviations mapped (HI → HIGH)
- [ ] Default fallback values defined

## Work Log

### 2026-01-03 - Issue Created

**By:** Claude Code

**Actions:**
- Identified during DD Mode v2 pattern review
- Compared with Hybrid Mode patterns
- Proposed antifragile enum adoption
