---
status: pending
priority: p2
issue_id: "212"
tags: [code-review, performance, memory-leak, react]
dependencies: []
---

# Fix Object URL Memory Leak in Tabbed Forms

## Problem Statement

The tabbed analysis forms use the `forceMount` pattern to keep both forms mounted in the DOM. When users upload file attachments and switch tabs, the Object URLs created for image previews are NOT revoked, causing memory leaks.

**Impact:**
- User uploads 5 files (10MB each) on Technical tab = 50MB in memory
- Switches to DD tab, uploads 5 more files = another 50MB
- After 10 tab switches with uploads = 500MB+ leaked memory
- Potential browser crashes on mobile/low-memory devices

## Findings

- **Location:** `apps/web/app/home/(user)/reports/new/_components/technical-analysis-form.tsx` (lines 243, 257, 302)
- **Location:** `apps/web/app/home/(user)/reports/new/_components/due-diligence-analysis-form.tsx` (lines 239, 253, 294)
- Object URLs created via `URL.createObjectURL(file)` at line 243 in both forms
- Cleanup only happens on form submission or explicit removal, NOT on tab switch
- With `forceMount`, forms never unmount, so no useEffect cleanup runs

## Proposed Solutions

### Option 1: Add useEffect Cleanup

**Approach:** Add cleanup effect that revokes URLs when component state changes or on unmount.

```typescript
useEffect(() => {
  return () => {
    attachments.forEach(a => URL.revokeObjectURL(a.preview));
  };
}, [attachments]);
```

**Pros:**
- Simple, minimal code change
- Standard React pattern

**Cons:**
- With forceMount, useEffect cleanup may not run on tab switch

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Track Tab Visibility and Cleanup

**Approach:** Use visibility tracking to cleanup URLs when tab becomes inactive.

```typescript
// In report-mode-selector.tsx
const { mode } = useAnalysisMode();

useEffect(() => {
  // Notify forms when they become inactive
}, [mode]);
```

**Pros:**
- Explicitly handles the forceMount scenario

**Cons:**
- More complex, requires parent-child coordination

**Effort:** 1-2 hours

**Risk:** Medium

---

### Option 3: Replace forceMount with State Lifting

**Approach:** Remove forceMount, lift attachment state to parent, pass down to forms.

**Pros:**
- Eliminates root cause (both forms mounted)
- Standard React pattern

**Cons:**
- Larger refactor
- Prop drilling for many form fields

**Effort:** 2-3 hours

**Risk:** Medium

## Recommended Action

*To be filled during triage.*

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/reports/new/_components/technical-analysis-form.tsx:243-260`
- `apps/web/app/home/(user)/reports/new/_components/due-diligence-analysis-form.tsx:239-256`
- `apps/web/app/home/(user)/reports/new/_components/report-mode-selector.tsx:76-93` (forceMount pattern)

**Related components:**
- File upload handlers in both forms
- useReportProgress hook (uses similar cleanup pattern)

## Acceptance Criteria

- [ ] Object URLs revoked when tab becomes inactive
- [ ] No memory growth after multiple tab switches with uploads
- [ ] File previews still work correctly
- [ ] Tests pass
- [ ] Verified with Chrome DevTools Memory profiler

## Work Log

### 2026-01-04 - Code Review Finding

**By:** Claude Code

**Actions:**
- Identified memory leak during performance review
- Traced to forceMount pattern keeping both forms mounted
- URL.createObjectURL calls without proper cleanup

**Learnings:**
- forceMount pattern requires special consideration for cleanup
- Object URLs must be manually revoked - not garbage collected

## Notes

- This is a performance issue, not a security issue
- Priority P2 because impact is gradual (requires multiple uploads/switches)
- Related to code duplication issue (both forms have identical file handling)
