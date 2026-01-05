# Sparlo UX/UI Audit System

Comprehensive E2E testing and UX audit framework for Sparlo, designed to run via Claude Code slash command.

## Quick Start

### 1. Install Dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Set Up Authentication

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Run initial auth setup to save login state:
```bash
npm run auth:setup
```

This saves your authenticated session to `.auth/user.json` so you don't need to log in for every test.

### 3. Run Audits

**Full audit:**
```bash
npm run audit:full
```

**Quick audit (user journeys + visual):**
```bash
npm run audit
```

**With browser visible:**
```bash
npm run test:headed
```

## Claude Code Integration

### Using the Slash Command

After making changes to Sparlo, type in Claude Code:

```
/audit
```

This triggers the full UX/UI audit protocol defined in `.claude/commands/audit.md`.

### What the Audit Checks

1. **Functional Testing** - All features work correctly
2. **User Journey Validation** - Critical flows complete successfully
3. **Visual Regression** - Screenshots match baselines
4. **Brand Compliance** - Colors, typography, spacing follow guidelines
5. **UX Quality** - Hover states, focus rings, loading states present
6. **Accessibility** - Alt text, labels, contrast checks

### Audit Output

The audit produces:
- Console output with pass/fail status
- HTML report at `test-results/html-report/index.html`
- Screenshots of failures
- Senior UX recommendations (P0/P1/P2 prioritized)

## File Structure

```
sparlo-audit-system/
├── .claude/
│   └── commands/
│       └── audit.md          # Slash command definition
├── tests/
│   └── e2e/
│       ├── auth.setup.ts     # Authentication setup
│       └── audit/
│           ├── user-journeys.spec.ts   # User flow tests
│           └── visual-regression.spec.ts # Visual/brand tests
├── docs/
│   └── brand-guidelines.md   # Brand reference
├── playwright.config.ts      # Playwright configuration
├── package.json
├── .env.example
└── README.md
```

## Resetting Auth

If your session expires:

```bash
npm run auth:reset
```

## Updating Visual Baselines

After intentional visual changes:

```bash
npx playwright test --update-snapshots
```

## Troubleshooting

**Tests fail to authenticate:**
- Check credentials in `.env.local`
- Run `npm run auth:reset`
- Verify the login page selectors match your actual UI

**Visual tests fail unexpectedly:**
- Run `--update-snapshots` if changes are intentional
- Check for animation/timing issues

**Selectors not finding elements:**
- Update selectors in test files to match your actual UI
- Add `data-testid` attributes to your components for reliable selection
