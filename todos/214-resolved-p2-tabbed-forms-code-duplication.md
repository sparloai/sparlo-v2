---
status: pending
priority: p2
issue_id: "214"
tags: [code-review, code-quality, refactoring, react]
dependencies: []
---

# Extract Shared Logic from Tabbed Form Components

## Problem Statement

The two form components (TechnicalAnalysisForm and DueDiligenceAnalysisForm) contain approximately 400 lines of duplicated code (~85% similarity). This creates maintenance burden, potential for bugs to diverge, and makes future changes error-prone.

## Findings

**Duplicated sections identified:**

1. **Attachment Interface & Constants** (Lines 25-46 in both)
   - `Attachment` interface - 100% identical
   - `MAX_ATTACHMENTS`, `MAX_FILE_SIZE` constants - identical
   - `ALLOWED_TYPES` array - nearly identical (DD missing DOCX)

2. **File Handling Logic** (Lines 194-260 in both)
   - `handleFileSelect` callback - 100% identical logic
   - `removeAttachment` callback - 100% identical
   - Base64 conversion logic - 100% identical

3. **DetectionIndicator Component** (Lines 112-138 / 113-138)
   - 100% identical implementation
   - Only difference is the detection patterns used

4. **Attachment Display UI** (Lines 408-454 / 530-576)
   - 100% identical JSX for rendering attachment pills

5. **Processing Screen Rendering** (Lines 340-350 / 377-387)
   - Nearly identical structure

**Location:**
- `/Users/alijangbar/Desktop/sparlo-v2/apps/web/app/home/(user)/reports/new/_components/technical-analysis-form.tsx` (629 lines)
- `/Users/alijangbar/Desktop/sparlo-v2/apps/web/app/home/(user)/reports/new/_components/due-diligence-analysis-form.tsx` (507 lines)

## Proposed Solutions

### Option 1: Extract Shared Hook + Components

**Approach:** Create `useFileAttachments` hook and `AttachmentList` component.

```typescript
// _lib/use-file-attachments.ts
export function useFileAttachments(config: {
  maxAttachments: number;
  maxFileSize: number;
  allowedTypes: string[];
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileSelect = useCallback(...);
  const removeAttachment = useCallback(...);
  return { attachments, handleFileSelect, removeAttachment, fileInputRef };
}

// _components/shared/attachment-list.tsx
export function AttachmentList({ attachments, onRemove }) { ... }

// _components/shared/detection-indicator.tsx
export function DetectionIndicator({ label, detected }) { ... }
```

**Pros:**
- Maximum code reuse
- Single source of truth
- Easier testing

**Cons:**
- Requires careful extraction
- May need to handle edge case differences

**Effort:** 2-3 hours

**Risk:** Low

---

### Option 2: Shared Base Component

**Approach:** Create a BaseAnalysisForm component that both forms extend.

**Pros:**
- Clear inheritance pattern

**Cons:**
- React composition > inheritance
- Less flexible

**Effort:** 3-4 hours

**Risk:** Medium

---

### Option 3: Leave As-Is

**Approach:** Accept duplication, ensure both stay in sync manually.

**Pros:**
- No refactoring risk

**Cons:**
- Ongoing maintenance burden
- Bug divergence risk

**Effort:** 0 hours (but ongoing cost)

**Risk:** Low (now) / High (long-term)

## Recommended Action

*To be filled during triage.*

## Technical Details

**Files to create:**
- `apps/web/app/home/(user)/reports/new/_lib/use-file-attachments.ts`
- `apps/web/app/home/(user)/reports/new/_components/shared/attachment-list.tsx`
- `apps/web/app/home/(user)/reports/new/_components/shared/detection-indicator.tsx`

**Files to modify:**
- `apps/web/app/home/(user)/reports/new/_components/technical-analysis-form.tsx`
- `apps/web/app/home/(user)/reports/new/_components/due-diligence-analysis-form.tsx`

**Estimated LOC reduction:** ~200 lines

## Acceptance Criteria

- [ ] Shared hook handles file attachments
- [ ] Shared components for AttachmentList and DetectionIndicator
- [ ] Both forms use shared code
- [ ] No behavioral changes
- [ ] Tests pass
- [ ] TypeScript compiles without errors

## Work Log

### 2026-01-04 - Code Review Finding

**By:** Claude Code (pattern-recognition-specialist agent)

**Actions:**
- Analyzed both form files
- Identified 400+ lines of duplicate code
- Documented specific duplicate sections with line numbers

**Learnings:**
- Forms were likely developed independently or copy-pasted
- File handling is completely domain-agnostic
- DetectionIndicator only differs by which patterns are used

## Notes

- Consider combining with debounce fix (Issue #213) since they touch same areas
- This refactor will make future form enhancements easier
- Low risk if done carefully with good test coverage
