# PDF Export Styling Issues - Prevention Strategies Index

This directory contains comprehensive prevention strategies to avoid the styling inconsistencies and build issues that occurred during PDF export implementation.

## Documents Overview

### 1. PREVENTION-STRATEGIES-SUMMARY.md (START HERE)
**Purpose**: Main prevention strategies document with detailed bullet-point explanations

**Contains**:
- Issue 1: PDF & Web Styles Divergence (MonoLabel uppercase problem)
- Issue 2: Read Time Calculation Divergence (42 min vs 5 min)
- Issue 3: Stale Next.js Cache (API route recompilation issues)
- DRY Principle summary
- Complete testing checklist
- File reference locations

**Best for**: Team reference, PRs, code reviews

---

### 2. PDF-EXPORT-PREVENTION-QUICK-REFERENCE.md
**Purpose**: Quick one-page reference for developers

**Contains**:
- One-sentence problem statement for each issue
- Bullet-point prevention for each issue
- One-line summary (DRY principle)
- Quick checklist for making design/read-time changes

**Best for**: Quick lookup, desk reference, onboarding

---

### 3. prevention-strategies-pdf-export-styling.md
**Purpose**: Deep-dive comprehensive guide with code examples

**Contains**:
- Detailed problem analysis for each issue
- Prevention strategies with code snippets
- File structure and implementation examples
- Hook setup instructions
- Test file examples
- CI/CD workflow examples

**Best for**: Implementation guide, detailed reference

---

## How to Use These Documents

### Scenario 1: You're updating design tokens/typography
1. Read: `PREVENTION-STRATEGIES-SUMMARY.md` - Issue 1
2. Reference: `PDF-EXPORT-PREVENTION-QUICK-REFERENCE.md`
3. Follow the "Quick Checklist" at the bottom

### Scenario 2: You're modifying read time calculation
1. Read: `PREVENTION-STRATEGIES-SUMMARY.md` - Issue 2
2. Reference: `PDF-EXPORT-PREVENTION-QUICK-REFERENCE.md`
3. Ensure you import from `/utils/calculate-read-time.ts` (not duplicating logic)

### Scenario 3: You're debugging PDF export not updating
1. Read: `PREVENTION-STRATEGIES-SUMMARY.md` - Issue 3
2. Run: `rm -rf apps/web/.next && pnpm dev`
3. See `TROUBLESHOOTING.md` for detailed cache clearing instructions

### Scenario 4: You're implementing these prevention strategies
1. Read: `prevention-strategies-pdf-export-styling.md` (full guide)
2. Follow code examples for each file
3. Create files in the specified locations
4. Add tests and hooks as outlined

---

## Key Files to Know

**Web Components**:
- `/apps/web/app/home/(user)/reports/_components/brand-system/primitives.tsx` - Web UI primitives

**PDF Rendering**:
- `/apps/web/app/api/reports/[id]/pdf/_components/report-pdf-document.tsx` - PDF document generation
- `/apps/web/app/api/reports/[id]/print/_lib/print-styles.ts` - PDF styles

**Shared Utilities** (DRY):
- `/apps/web/app/home/(user)/reports/_lib/constants/design-tokens.ts` - Typography, colors, spacing (SHARED)
- `/apps/web/app/home/(user)/reports/_lib/utils/calculate-read-time.ts` - Read time logic (SHARED)

**Git Hooks**:
- `/.husky/pre-commit` - Enforce atomic updates
- `/.husky/post-checkout` - Auto-clear cache on branch switch

**Tests**:
- `/apps/e2e/tests/pdf-style-parity.spec.ts` - Validate web/PDF consistency

---

## Prevention Principle: DRY (Don't Repeat Yourself)

All three issues stem from code duplication:

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| **Styles diverge** | Different MonoLabel definitions in web vs PDF | Single source of truth in `design-tokens.ts` |
| **Read time differs** | Two separate calculation implementations | Single function in `calculate-read-time.ts` |
| **Cache stale** | Manual cache clearing required | Automatic via `rm -rf .next` on dev start |

**Golden Rule**: Define once, import everywhere. Never duplicate logic.

---

## Quick Action Items

### For Team Leads
- [ ] Share `PREVENTION-STRATEGIES-SUMMARY.md` with team
- [ ] Post quick reference (`PDF-EXPORT-PREVENTION-QUICK-REFERENCE.md`) on desk
- [ ] Review PRs against the checklist in Issue 1, 2, 3

### For Developers
- [ ] Bookmark `PDF-EXPORT-PREVENTION-QUICK-REFERENCE.md`
- [ ] Review `PREVENTION-STRATEGIES-SUMMARY.md` before modifying design system or read time
- [ ] Follow the "Quick Checklist" when making changes

### For Implementation
- [ ] Create `/constants/design-tokens.ts` with shared typography
- [ ] Create `/utils/calculate-read-time.ts` with shared read time logic
- [ ] Add pre-commit hook to enforce atomic updates
- [ ] Add post-checkout hook to auto-clear cache
- [ ] Add tests for style parity and read time accuracy
- [ ] Document in `TROUBLESHOOTING.md`

---

## Related Documentation

- **Design System**: `/docs/SPARLO-DESIGN-SYSTEM.md` - Brand guidelines
- **Troubleshooting**: `/docs/TROUBLESHOOTING.md` - Common issues and solutions
- **PDF Export**: `/docs/solutions/logic-errors/pdf-export-field-name-normalization.md` - PDF-specific guidance
- **Read Time**: `/plans/accurate-read-time-calculation.md` - Detailed read time research
- **Print Styles**: `/todos/057-ready-p2-report-print-styles-missing.md` - Print style requirements

---

## Summary

Use these three documents to prevent PDF export styling issues:

1. **PREVENTION-STRATEGIES-SUMMARY.md** - Your main reference (this is the answer to your request)
2. **PDF-EXPORT-PREVENTION-QUICK-REFERENCE.md** - Quick lookup while coding
3. **prevention-strategies-pdf-export-styling.md** - Deep dive with code examples

All strategies follow one principle: **Define once, import everywhere. Never duplicate logic.**
