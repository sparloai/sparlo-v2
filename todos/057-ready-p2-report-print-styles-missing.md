---
status: ready
priority: p2
issue_id: "057"
tags: [css, accessibility, print, report]
dependencies: ["050"]
---

# Report Missing Print Styles

## Problem Statement

The report's dark theme has no print styles defined. When users print reports, they get dark backgrounds which waste ink and are often unreadable. Professional reports should have optimized print output.

## Findings

**Architecture Review findings:**
- No `@media print` rules in any report CSS file
- Dark backgrounds would print as-is
- Grid/noise texture overlays would print
- Potential ink waste and readability issues

**Files checked:**
- report-base.css - No print media
- report-tokens.css - No print tokens
- report-sections.css - No print overrides

## Proposed Solutions

### Option 1: Add Comprehensive Print Styles

**Approach:** Add print media query with light theme and optimized layout.

```css
@media print {
  .report-page {
    background: white !important;
    color: black !important;
    font-size: 11pt;
  }

  .report-page::before,
  .report-page::after {
    display: none; /* Remove textures */
  }

  .module {
    background: white !important;
    border: 1px solid #ccc !important;
    break-inside: avoid;
  }

  /* Hide interactive elements */
  .toc-sidebar,
  .chat-drawer,
  .toggle-buttons {
    display: none !important;
  }
}
```

**Pros:**
- Professional print output
- Ink-efficient
- Proper page breaks

**Cons:**
- Additional CSS to maintain

**Effort:** 2-3 hours

**Risk:** Low

---

### Option 2: PDF Export Feature

**Approach:** Create dedicated PDF export with custom styling.

**Pros:**
- Full control over output
- Can include additional formatting

**Cons:**
- More complex implementation
- Requires PDF library

**Effort:** 6-8 hours

**Risk:** Medium

## Recommended Action

Implement Option 1 first (print styles), then consider Option 2 (PDF export) as enhancement. Print styles are essential for basic functionality.

## Technical Details

**Affected files:**
- `apps/web/styles/report-base.css` - Add print media query
- Consider separate `report-print.css` if extensive

**Print optimizations:**
- Light background, dark text
- Remove decorative elements
- Hide navigation/interactive UI
- Proper page break handling
- Optimized font sizes for print

## Acceptance Criteria

- [ ] Print preview shows light background
- [ ] Text is readable in print
- [ ] No decorative overlays in print
- [ ] Page breaks avoid splitting content
- [ ] Interactive elements hidden in print
- [ ] Headers/footers print appropriately

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Architecture Review Agent)

**Actions:**
- Identified missing print media queries
- Assessed impact of dark theme on printing
- Proposed print-specific styling approach

**Learnings:**
- Print styles often overlooked in dark-theme designs
- `break-inside: avoid` prevents awkward page breaks
- !important often needed to override screen styles in print

## Notes

- Depends on Issue #050 (light mode tokens) - can reuse light theme tokens for print
