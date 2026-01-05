# UX/UI Audit Protocol

Run a comprehensive UX/UI audit on the current feature or page change.

## Context
You are performing a rigorous UX/UI audit for Sparlo, an AI-powered engineering intelligence platform. The brand aesthetic is inspired by Air Company and Palantir: restraint, confidence, technical precision, near-monochromatic (zinc-only palette), Suisse Intl typography, and typography-driven hierarchy.

## Instructions

### Phase 1: Setup & Auth
1. Navigate to the Playwright test directory: `tests/e2e/`
2. Run auth setup if needed: `npx playwright test auth.setup.ts`
3. Verify auth state exists at `.auth/user.json`

### Phase 2: Functional Testing
Run the E2E test suite and analyze results:
```bash
npx playwright test --project=chromium --reporter=list
```

For any failures, investigate and fix the root cause before proceeding.

### Phase 3: User Journey Validation
Execute the user journey audit script:
```bash
npx playwright test audit/user-journeys.spec.ts --headed
```

Key journeys to validate:
- [ ] Landing → Sign Up → Onboarding
- [ ] Login → Dashboard → New Report
- [ ] Problem Input → Progress States → Report View
- [ ] Report → Chat Follow-up → Export
- [ ] Settings → Subscription → Billing

### Phase 4: Visual & UX Quality Audit
Run visual regression tests:
```bash
npx playwright test audit/visual-regression.spec.ts
```

Manual checklist to evaluate:
- [ ] **Typography**: Suisse Intl applied correctly, proper hierarchy (h1 > h2 > body)
- [ ] **Colors**: Zinc-only palette, no rogue colors
- [ ] **Spacing**: Consistent 4px/8px grid, no cramped or floaty elements
- [ ] **Interactions**: Hover states, focus rings, loading states present
- [ ] **Responsiveness**: Works on 1440px, 1024px, 768px, 375px
- [ ] **Microinteractions**: Smooth transitions (200-300ms), no jank
- [ ] **Error States**: Empty states, error messages styled properly
- [ ] **Loading States**: Skeletons or spinners during async operations

### Phase 5: Brand Compliance Check
Reference: `docs/brand-guidelines.md`

- [ ] Logo usage correct
- [ ] Tone: Confident, technical, restrained (no "exciting!" or emoji)
- [ ] No generic SaaS patterns (gradient backgrounds, stock photos, rounded playful buttons)
- [ ] Industrial/deep-tech aesthetic maintained

### Phase 6: Senior UX Designer Recommendations
After completing the audit, think as a senior UX designer and provide:

1. **Critical Issues** (must fix before shipping)
2. **UX Improvements** (would elevate the experience)
3. **Delight Opportunities** (small touches that signal premium quality)
4. **Accessibility Gaps** (WCAG AA compliance issues)

Format recommendations as:
```
## UX Recommendations

### Critical (P0)
- [Issue]: [Recommendation] | Effort: [Low/Med/High]

### Improvements (P1)
- [Issue]: [Recommendation] | Effort: [Low/Med/High]

### Delight (P2)
- [Opportunity]: [Recommendation] | Effort: [Low/Med/High]

### Accessibility (P1)
- [Gap]: [Fix] | Effort: [Low/Med/High]
```

### Phase 7: Auto-Fix Where Possible
For any issues identified, attempt to fix them directly:
1. Styling issues → Update CSS/Tailwind classes
2. Missing states → Add loading/error/empty components
3. Accessibility → Add aria labels, focus management
4. Broken flows → Fix routing/state issues

### Phase 8: Summary Report
Generate a final audit report with:
- Pass/Fail status for each category
- Screenshots of any issues found
- Before/after for any fixes made
- Remaining recommendations prioritized by impact/effort

---

## Quick Reference: Brand Guidelines

**Colors (Zinc Palette Only)**:
- Background: zinc-950, zinc-900
- Surface: zinc-800, zinc-700
- Text Primary: zinc-50
- Text Secondary: zinc-400
- Borders: zinc-700/50, zinc-600

**Typography**:
- Font: Suisse Intl (fallback: system-ui)
- H1: text-4xl font-medium tracking-tight
- H2: text-2xl font-medium
- Body: text-base font-normal
- Caption: text-sm text-zinc-400

**Spacing**:
- Use 4px base unit
- Sections: py-16 or py-24
- Cards: p-6 or p-8
- Gaps: gap-4, gap-6, gap-8

**Components**:
- Buttons: Minimal, no gradients, subtle hover states
- Cards: zinc-800/50 border-zinc-700/50, no shadows
- Inputs: bg-zinc-900 border-zinc-700 focus:border-zinc-500
