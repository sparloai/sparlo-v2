# PDF Export Prevention Strategies - Quick Reference

## Issue 1: Styles Diverge Between Web & PDF

**Problem**: MonoLabel uppercase in PDF, not in web

**Prevention**:
- Extract shared constants to `/apps/web/app/home/(user)/reports/_lib/constants/design-tokens.ts`
- Import `TYPOGRAPHY.label` with `textTransform: 'uppercase'` in both `primitives.tsx` (web) and `print-styles.ts` (PDF)
- Never duplicate style definitions - always import from single source
- Use pre-commit hook to require updating ALL dependent files atomically

---

## Issue 2: Read Time Differs Between Web & PDF

**Problem**: 42 min in PDF, 5 min on web (same content)

**Prevention**:
- Create single `calculateReadTime()` function in `/apps/web/app/home/(user)/reports/_lib/utils/calculate-read-time.ts`
- Export WPM constants: `WPM_PROSE = 150`, `WPM_HEADLINE = 300`, `WPM_LIST_ITEM = 220`, `SECONDS_PER_TABLE_ROW = 3`
- Both web and PDF MUST import and use this same function
- Never calculate read time differently in two places

---

## Issue 3: API Routes Stale After Changes

**Problem**: `.next` cache has old compiled routes, changes don't show

**Prevention**:
- `package.json`: Change `"dev": "next dev"` to `"dev": "rm -rf .next && next dev"`
- Create `.husky/post-checkout` to auto-clear cache when switching branches
- Document: "After modifying API routes, changes require cache clear"
- CI/CD: Always `rm -rf .next` before building

---

## One-Line Summary

**DRY Principle**: Define design tokens once, define read time logic once, define cache strategy once. Import/use everywhere, never duplicate.

---

## Quick Checklist: Making Design/Read-Time Changes

- [ ] Update design tokens OR read time utility
- [ ] Update web component imports
- [ ] Update PDF component imports
- [ ] Clear cache: `rm -rf apps/web/.next`
- [ ] Test web UI rendering
- [ ] Test PDF export
- [ ] Verify read time matches
- [ ] Commit atomically (all files in one commit)
