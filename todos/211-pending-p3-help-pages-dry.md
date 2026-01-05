---
status: pending
priority: p3
issue_id: 211
tags: [code-review, quality, help-center]
dependencies: []
---

# Help Pages Duplicate Code (DRY Violation)

## Problem Statement

The user help page (`app/home/(user)/help/page.tsx`) and team help page (`app/home/[account]/help/page.tsx`) have nearly identical content (60+ lines duplicated). This violates DRY and creates maintenance burden.

## Findings

**Location**:
- `apps/web/app/home/(user)/help/page.tsx` (67 lines)
- `apps/web/app/home/[account]/help/page.tsx` (67 lines)

Both files contain identical:
- Layout structure
- Chat widget hint banner
- Section headers
- Component imports (HelpTicketForm, HelpDocsLink)

Only difference: import paths for shared components.

## Proposed Solutions

### Solution A: Extract Shared Component (Recommended)
**Pros**: Single source of truth, easier maintenance
**Cons**: One more file to manage
**Effort**: Small (15 min)
**Risk**: None

Create `apps/web/app/home/_components/help-page-content.tsx`:
```typescript
export function HelpPageContent() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-8 pt-12 pb-16">
        {/* Shared content */}
      </div>
    </main>
  );
}
```

Both page.tsx files become:
```typescript
import { HelpPageContent } from '../_components/help-page-content';
export default withI18n(() => <HelpPageContent />);
```

## Technical Details

- **Affected Files**:
  - `apps/web/app/home/_components/help-page-content.tsx` (new)
  - `apps/web/app/home/(user)/help/page.tsx`
  - `apps/web/app/home/[account]/help/page.tsx`
- **Components**: Help page layout
- **Database Changes**: None

## Acceptance Criteria

- [ ] HelpPageContent component created
- [ ] Both help pages use shared component
- [ ] ~60 lines of duplication eliminated
- [ ] No visual regression

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Simplicity review finding |

## Resources

- Agent: code-simplicity-reviewer review
