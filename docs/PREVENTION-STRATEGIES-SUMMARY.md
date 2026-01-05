# PDF Export Styling Issues - Prevention Strategies

## Issue 1: PDF & Web Styles Divergence

### Problem
MonoLabel had uppercase styling in PDF but not in web, causing visual inconsistencies between exported and displayed reports.

### Prevention Strategies

- **Extract shared design tokens** - Create `/apps/web/app/home/(user)/reports/_lib/constants/design-tokens.ts` with all typography, colors, and spacing constants used by both `primitives.tsx` (web) and `print-styles.ts` (PDF)
- **Keep typography constants synchronized** - MonoLabel `uppercase`, `letter-spacing`, `font-size`, and `font-weight` must be defined in one place and imported by both web and PDF components
- **Import from design tokens in both files** - Web: `primitives.tsx`, PDF: `print-styles.ts` (reference the same constants, never duplicate)
- **Validate style parity with tests** - Create `/apps/e2e/tests/pdf-style-parity.spec.ts` to verify that MonoLabel renders consistently between web and PDF rendering
- **Enforce atomic updates with pre-commit hooks** - Add git hook to require that if `design-tokens.ts` changes, both `primitives.tsx` AND `print-styles.ts` must be updated in the same commit
- **Lock design tokens to prevent divergence** - Document in pre-commit hook that updating design tokens requires updating ALL dependent files (web + PDF)

---

## Issue 2: Read Time Calculation Divergence

### Problem
Read time showed 42 minutes in PDF, 5 minutes on web for the same content due to different calculation logic.

### Prevention Strategies

- **Extract shared read time function** - Create `/apps/web/app/home/(user)/reports/_lib/utils/calculate-read-time.ts` with a single, unified `calculateReadTime()` function that both web and PDF components import and use
- **Define WPM constants in shared file** - Store `WPM_PROSE = 150`, `WPM_HEADLINE = 300`, `WPM_LIST_ITEM = 220`, `SECONDS_PER_TABLE_ROW = 3` as exported constants that both components use
- **Count ONLY rendered content fields** - Calculation extracts only fields that appear in the final report (don't count metadata, IDs, confidence scores, or hidden fields)
- **Apply content-type specific reading speeds** - Use different WPM rates for prose vs. headlines vs. lists to match actual reading behavior
- **Test read time calculation independently** - Create unit tests in `calculate-read-time.test.ts` with known test data to verify accuracy
- **Document calculation source** - Add data attributes in web UI and comments in PDF indicating the calculation comes from the shared utility for debugging transparency

---

## Issue 3: Stale Next.js Cache Preventing API Route Recompilation

### Problem
Changes to API routes weren't reflected in PDF output because the `.next` cache contained compiled versions of old code.

### Prevention Strategies

- **Clear cache on every dev start** - Update `package.json` dev script: `"dev": "rm -rf .next && next dev"` to always start with fresh compiled routes
- **Clear cache on branch switch** - Create `.husky/post-checkout` hook to automatically `rm -rf .next` after git checkout/pull to prevent stale routes from other branches
- **Create incremental dev option** - Keep `"dev:incremental": "next dev"` for quick restarts when you know cache is valid, but default `dev` should clear cache
- **Add API route verification script** - Create `/apps/web/scripts/verify-api-routes.ts` that checks if key API routes were compiled into `.next/server/app/api/` after build
- **Document cache clearing in troubleshooting** - Add `/docs/TROUBLESHOOTING.md` section explaining when to clear cache and how (`rm -rf apps/web/.next`)
- **Clear cache in CI/CD pipeline** - Ensure GitHub Actions workflow clears `.next` before building and testing to prevent stale cache issues in production
- **When to clear cache** - Document: Update API routes → Clear cache → Restart dev server, especially for `print-styles.ts`, PDF generation routes, and read time calculations

---

## Summary: DRY Principle & Single Source of Truth

To prevent all three issues, follow this principle:

- **Design tokens** → Define once in `/constants/design-tokens.ts` → Import in `primitives.tsx` and `print-styles.ts`
- **Read time logic** → Define once in `/utils/calculate-read-time.ts` → Import in both web and PDF components
- **Cache invalidation** → Automatic on dev start (`rm -rf .next`) → Documented in troubleshooting guide
- **Atomic commits** → When changing design system or read time, update ALL dependent files in one commit
- **Verification** → Run tests before PR, verify API routes compiled, validate style parity between web and PDF

---

## Testing Checklist Before PR

- [ ] `pnpm typecheck` - Passes without errors
- [ ] `pnpm lint:fix` - All lint issues resolved
- [ ] `pnpm test` - All unit tests pass
- [ ] `pnpm test:pdf-style-parity` - Web and PDF styles match
- [ ] Manual test: Download PDF and verify styling matches web
- [ ] Manual test: Compare read time on web and in PDF
- [ ] `pnpm verify:api-routes` - All API routes compiled
- [ ] Design tokens updated atomically with web and PDF components
- [ ] Read time calculation using shared utility

---

## Files Reference

**Locations of key components**:
- Design tokens: `/apps/web/app/home/(user)/reports/_lib/constants/design-tokens.ts`
- Read time: `/apps/web/app/home/(user)/reports/_lib/utils/calculate-read-time.ts`
- Web components: `/apps/web/app/home/(user)/reports/_components/brand-system/primitives.tsx`
- PDF styles: `/apps/web/app/api/reports/[id]/print/_lib/print-styles.ts`
- PDF document: `/apps/web/app/api/reports/[id]/pdf/_components/report-pdf-document.tsx`
- Style parity tests: `/apps/e2e/tests/pdf-style-parity.spec.ts`
- Pre-commit hook: `/.husky/pre-commit`
- Post-checkout hook: `/.husky/post-checkout`
- Troubleshooting: `/docs/TROUBLESHOOTING.md`
