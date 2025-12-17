---
status: ready
priority: p1
issue_id: "036"
tags: [performance, react, memoization]
dependencies: []
---

# Memoize Table of Contents Generation

TOC is regenerated on every render, causing unnecessary computation.

## Problem Statement

The `report-display.tsx` component generates a table of contents by parsing markdown headings on every render. This:
- Parses entire report content on each render
- Regex operations on large strings are expensive
- Triggers on any state change (scroll, animation, etc.)
- Causes unnecessary re-renders of TOC component

## Findings

- File: `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`
- TOC generated inline in component render
- Report content can be 10,000+ characters
- Parsing regex runs ~60 times per second during animations

**Current pattern:**
```typescript
function ReportDisplay({ report }) {
  // ❌ Runs on EVERY render
  const tocItems = generateTOC(report.content);

  return (
    <div>
      <TableOfContents items={tocItems} />
      <ReportContent content={report.content} />
    </div>
  );
}

function generateTOC(content: string) {
  const headings = content.match(/^#{1,3} .+$/gm) || [];
  return headings.map(h => ({
    level: h.match(/^#+/)[0].length,
    text: h.replace(/^#+\s*/, ''),
  }));
}
```

## Proposed Solutions

### Option 1: useMemo for TOC Items (Recommended)

**Approach:** Memoize TOC generation based on report content.

```typescript
function ReportDisplay({ report }) {
  // ✅ Only recalculates when content changes
  const tocItems = useMemo(
    () => generateTOC(report.content),
    [report.content]
  );

  return (
    <div>
      <TableOfContents items={tocItems} />
      <ReportContent content={report.content} />
    </div>
  );
}
```

**Pros:**
- Simple fix
- Standard React pattern
- TOC only regenerated when content changes
- No architecture changes

**Cons:**
- Minor: memoization has small overhead

**Effort:** 15 minutes

**Risk:** Low

---

### Option 2: Move TOC to Server Component

**Approach:** Generate TOC server-side and pass as prop.

```typescript
// page.tsx (server component)
async function ReportPage({ params }) {
  const report = await loadReport(params.id);
  const tocItems = generateTOC(report.content);

  return <ReportDisplay report={report} toc={tocItems} />;
}
```

**Pros:**
- Zero client-side computation
- Works with streaming

**Cons:**
- More props to pass
- TOC won't update if content edited client-side

**Effort:** 30 minutes

**Risk:** Low

## Recommended Action

Implement Option 1 - Add useMemo:

1. Wrap `generateTOC` call in `useMemo`
2. Depend on `report.content` only
3. Verify with React DevTools that TOC doesn't re-render unnecessarily

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`

**Performance impact:**
- Before: ~60 regex parses per second during animation
- After: 1 regex parse per content change

**React DevTools verification:**
- Component should show "Memoized" in profiler
- TOC should not highlight on re-renders

## Acceptance Criteria

- [ ] `generateTOC` wrapped in `useMemo`
- [ ] Dependency array only contains `report.content`
- [ ] TOC doesn't re-render on unrelated state changes
- [ ] React DevTools shows memoization working
- [ ] No performance regression

## Work Log

### 2025-12-16 - Performance Review Discovery

**By:** Claude Code (Performance Oracle Agent)

**Actions:**
- Identified TOC regeneration on every render
- Calculated impact during animations (~60 parses/sec)
- Documented useMemo fix

**Learnings:**
- Expensive computations should always be memoized
- React DevTools profiler is essential for verification
- useMemo dependency array must be minimal
