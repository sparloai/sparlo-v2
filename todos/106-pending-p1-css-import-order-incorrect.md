---
status: pending
priority: p1
issue_id: "106"
tags: [code-review, css, architecture]
dependencies: []
---

# CSS Import Order Incorrect - Tokens After Usage

## Problem Statement

Design tokens are imported LAST in the layout file, but they should be imported FIRST since other CSS files depend on them.

**File**: `apps/web/app/home/(user)/reports/layout.tsx`

```typescript
// ❌ Current order - tokens after usage
import '~/styles/report-animations.css';  // Uses tokens
import '~/styles/report-base.css';        // Uses tokens
import '~/styles/report-components.css';  // Uses tokens
import '~/styles/report-modules.css';     // Uses tokens
import '~/styles/report-sections.css';    // Uses tokens
import '~/styles/report-tables.css';      // Uses tokens
import '~/styles/report-tokens.css';      // Defines tokens - SHOULD BE FIRST
```

## Findings

- **Architecture Agent**: Identified as import order violation
- **Pattern Recognition Agent**: Noted logical dependency order issue
- While CSS custom properties resolve dynamically, this violates logical dependency order
- Could cause issues during build optimization or SSR

## Proposed Solutions

### Solution A: Fix Import Order (Recommended)
```typescript
// ✅ Correct order - dependencies first
import '~/styles/report-tokens.css';      // 1. Define tokens
import '~/styles/report-base.css';        // 2. Base styles (uses tokens)
import '~/styles/report-animations.css';  // 3. Utilities
import '~/styles/report-components.css';  // 4. Components
import '~/styles/report-modules.css';     // 5. Modules
import '~/styles/report-sections.css';    // 6. Sections
import '~/styles/report-tables.css';      // 7. Tables
```
- **Pros**: Follows logical dependency order, prevents potential build issues
- **Cons**: None
- **Effort**: 5 minutes
- **Risk**: None

## Recommended Action

Reorder imports to place tokens first, followed by base, animations, then components.

## Technical Details

**Affected Files:**
- `apps/web/app/home/(user)/reports/layout.tsx`

## Acceptance Criteria

- [ ] `report-tokens.css` imported first
- [ ] `report-base.css` imported second
- [ ] Component/section files imported after base
- [ ] Build and render correctly

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-25 | Created from architecture review | Import order should follow dependency chain |

## Resources

- CSS cascade and specificity
