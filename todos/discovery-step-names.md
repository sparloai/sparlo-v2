---
id: discovery-step-names
title: Add step names to discovery mode for debugging
priority: P3
status: pending
category: improvement
source: code-review
created: 2025-12-20
files:
  - apps/web/lib/inngest/functions/generate-discovery-report.ts
---

## Problem

Discovery mode uses array indices (`step-0`, `step-1`, etc.) for `byStep` keys while regular reports use meaningful names (`an0`, `an1.5`, etc.). This makes debugging harder.

## Solution

Add stepNames parameter to discovery mode:

```typescript
const stepNames = ['an0-d', 'an1.5-d', 'an2-d', 'an3-d', 'an4-d', 'an5-d'];
const totalUsage = calculateTotalUsage(allUsages, stepNames);
```

## Acceptance Criteria

- [ ] Discovery mode uses descriptive step names
- [ ] Consistent with regular report naming pattern
- [ ] byStep output shows meaningful keys in logs
