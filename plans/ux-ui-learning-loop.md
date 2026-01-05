# feat: Automated UX/UI Learning Loop for Claude Code

## Enhancement Summary (from /deepen-plan)

> **14 parallel research agents analyzed this plan.** Key findings below.

### 🚨 CRITICAL: Security Vulnerabilities Found
- **Hardcoded credentials** in 31+ test files (`swimakaswim@gmail.com` / `Linguine2025`) - MUST move to env vars
- **Command injection risk** via unvalidated `$CLAUDE_FILE_PATHS` - add path sanitization
- **Insecure temp files** using `/tmp/` without cleanup - use `mktemp` with trap

### ⚡ BLOCKING: jq Not Installed
The hook script uses `jq` which is NOT installed on this system. Replace with Node.js JSON parsing.

### 🎯 Simplification Opportunity
- **55% LOC reduction possible** - start with single `accessibility.spec.ts` file for MVP
- Design system and visual regression tests are lower priority initially
- Complexity review recommends deferring file-to-test mapping to Phase 2

### 🏗️ Architecture Recommendations
- Replace bash script with **TypeScript** for cross-platform compatibility
- Add **convergence protection** (max 5 iterations before warning)
- Make error output **agent-native** with structured JSON for self-improvement

### 📊 Agent-Native Score: 40%
Current plan is 40% agent-native. To reach 80%+:
- Add structured error output (JSON with file paths, line numbers, fix suggestions)
- Create self-modifying learnings file (`.claude/learnings/ux-audit.md`)
- Make config Claude-editable (JSON, not bash)

---

## Overview

Create a "hardcoded" learning loop that automatically runs UX/UI audits after every Claude Code change. When Claude edits UI files (.tsx, .jsx, .css), a PostToolUse hook triggers Playwright tests that validate visual consistency, accessibility compliance, and design system adherence. Failures are fed back to Claude via exit code 2, enabling Claude to learn from mistakes and fix issues iteratively until all audits pass.

**Key Insight:** The project already has 80% of the infrastructure in place:
- Playwright configured at `apps/e2e/` with 10+ UX audit tests
- Design system documented at `docs/SPARLO-DESIGN-SYSTEM.md`
- Design review agents at `.claude/agents/design/`

This plan focuses on wiring these existing components into an automated feedback loop.

## Problem Statement

Currently, Claude Code can make UI changes that:
1. **Break visual consistency** - Colors, spacing, typography diverge from design system
2. **Introduce accessibility issues** - Missing WCAG compliance, broken keyboard navigation
3. **Create visual regressions** - Unintended layout changes, broken responsive behavior
4. **Violate design patterns** - Not using established component primitives

These issues are only caught during manual review or after deployment. We need **immediate, automated feedback** during the coding session.

## Proposed Solution

```
┌─────────────────────────────────────────────────────────────────┐
│                     LEARNING LOOP FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Claude edits .tsx/.jsx/.css file                           │
│              ↓                                                  │
│  2. PostToolUse hook triggers automatically                    │
│              ↓                                                  │
│  3. Hook detects UI file change                                │
│              ↓                                                  │
│  4. Playwright runs targeted visual/a11y tests                 │
│              ↓                                                  │
│  ┌─────────────────────┬───────────────────────┐               │
│  │     PASS (exit 0)   │     FAIL (exit 2)     │               │
│  │                     │                        │               │
│  │  Claude continues   │  stderr → Claude       │               │
│  │  normally           │  Claude reads errors   │               │
│  │                     │  Claude fixes issues   │               │
│  │                     │  Loop repeats          │               │
│  └─────────────────────┴───────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Why Playwright over Chrome Extension:**
- CI/CD native with headless support
- Cross-browser testing (Chromium, Firefox, WebKit)
- Mature `toHaveScreenshot()` API with pixel tolerance
- Built-in accessibility testing with @axe-core/playwright
- Already configured in this project

## Technical Approach

### Architecture

```
/Users/alijangbar/Desktop/sparlo-v2/
├── .claude/
│   ├── settings.json                    # Hook configuration (NEW)
│   └── hooks/
│       ├── ui-audit.sh                  # Main audit script (NEW)
│       └── test-mapping.json            # File → test mapping (NEW)
├── apps/
│   └── e2e/
│       ├── playwright.config.ts         # Add visual testing config (MODIFY)
│       └── tests/
│           ├── ux-audit/                # Existing tests (LEVERAGE)
│           └── learning-loop/           # Fast audit tests (NEW)
│               ├── visual-regression.spec.ts
│               ├── accessibility.spec.ts
│               └── design-system.spec.ts
└── docs/
    └── SPARLO-DESIGN-SYSTEM.md          # Existing (REFERENCE)
```

### Implementation Phases

#### Phase 1: Hook Infrastructure

**Goal:** Create the PostToolUse hook that triggers on UI file changes.

**Tasks:**

- [ ] Create `.claude/hooks/` directory
- [ ] Create `ui-audit.sh` hook script
  - Detect if changed files are UI-related (.tsx, .jsx, .css)
  - Skip non-UI changes (server code, tests, types)
  - Check if dev server is running
  - Run Playwright tests with appropriate filter
  - Format output for Claude consumption
  - Exit 0 on pass, exit 2 on fail
- [ ] Create `.claude/settings.json` with PostToolUse hook configuration
- [ ] Test hook manually with environment variables

**Files to create:**

`.claude/hooks/ui-audit.ts` (TypeScript - recommended for cross-platform):
```typescript
#!/usr/bin/env npx tsx
/**
 * UX/UI Audit Hook for Claude Code PostToolUse
 *
 * Triggers Playwright accessibility tests after UI file changes.
 * Exit 0 = pass, Exit 2 = fail with errors sent to Claude via stderr.
 *
 * SECURITY: Validates all input paths, uses secure temp files.
 */
import { execSync, spawnSync } from 'child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve, normalize } from 'path';

// Environment variables from Claude Code
const FILE_PATHS = process.env.CLAUDE_FILE_PATHS || '';
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const AUDIT_MODE = process.env.SPARLO_AUDIT_HOOK || 'enabled';

// Convergence protection
const MAX_ITERATIONS = 5;
const ITERATION_FILE = join(PROJECT_DIR, '.claude', 'hooks', '.iteration-count');

// Security: Validate and sanitize paths
function validatePath(path: string): boolean {
  const normalized = normalize(resolve(path));
  const projectNormalized = normalize(resolve(PROJECT_DIR));
  return normalized.startsWith(projectNormalized);
}

function isUIFile(filePath: string): boolean {
  if (!validatePath(filePath)) return false;
  const uiPattern = /\.(tsx|jsx|css)$/;
  const excludePattern = /(\.test\.|\.spec\.|_lib\/server|\/api\/)/;
  return uiPattern.test(filePath) && !excludePattern.test(filePath);
}

function checkDevServer(): boolean {
  try {
    execSync('curl -sf http://localhost:3000 >/dev/null 2>&1', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

function incrementIteration(): number {
  let count = 1;
  if (existsSync(ITERATION_FILE)) {
    count = parseInt(readFileSync(ITERATION_FILE, 'utf-8'), 10) + 1;
  }
  writeFileSync(ITERATION_FILE, count.toString());
  return count;
}

function resetIteration(): void {
  if (existsSync(ITERATION_FILE)) rmSync(ITERATION_FILE);
}

interface TestResult {
  title: string;
  file: string;
  line?: number;
  error: string;
  severity: 'critical' | 'serious' | 'moderate';
  suggestion?: string;
}

function parsePlaywrightOutput(outputPath: string): TestResult[] {
  try {
    const output = JSON.parse(readFileSync(outputPath, 'utf-8'));
    const results: TestResult[] = [];

    for (const suite of output.suites || []) {
      for (const innerSuite of suite.suites || []) {
        for (const spec of innerSuite.specs || []) {
          if (!spec.ok) {
            for (const test of spec.tests || []) {
              for (const result of test.results || []) {
                if (result.error) {
                  results.push({
                    title: spec.title,
                    file: spec.file || 'unknown',
                    line: spec.line,
                    error: result.error.message || 'Unknown error',
                    severity: spec.title.includes('WCAG') ? 'critical' : 'serious',
                    suggestion: getSuggestion(spec.title, result.error.message),
                  });
                }
              }
            }
          }
        }
      }
    }
    return results;
  } catch {
    return [];
  }
}

function getSuggestion(title: string, error: string): string {
  if (error.includes('color-contrast')) {
    return 'Use zinc-700 or darker for text on white backgrounds. Ref: docs/SPARLO-DESIGN-SYSTEM.md#color-palette';
  }
  if (error.includes('touch target') || error.includes('44x44')) {
    return 'Add min-h-[44px] min-w-[44px] to interactive elements.';
  }
  if (error.includes('label')) {
    return 'Add aria-label or associate with <label for="id">.';
  }
  return 'See docs/SPARLO-DESIGN-SYSTEM.md for patterns.';
}

function formatErrors(results: TestResult[]): string {
  if (results.length === 0) return '';

  const critical = results.filter(r => r.severity === 'critical');
  const serious = results.filter(r => r.severity === 'serious');

  let output = `UX/UI AUDIT FAILED (${critical.length} critical, ${serious.length} serious)\n\n`;

  if (critical.length > 0) {
    output += 'CRITICAL:\n';
    for (const r of critical.slice(0, 3)) {
      output += `❌ [${r.file}${r.line ? `:${r.line}` : ''}] ${r.title}\n`;
      output += `   Error: ${r.error.slice(0, 200)}\n`;
      if (r.suggestion) output += `   Fix: ${r.suggestion}\n`;
      output += '\n';
    }
  }

  if (serious.length > 0) {
    output += 'SERIOUS:\n';
    for (const r of serious.slice(0, 2)) {
      output += `⚠ [${r.file}${r.line ? `:${r.line}` : ''}] ${r.title}\n`;
      output += `   Error: ${r.error.slice(0, 200)}\n`;
      if (r.suggestion) output += `   Fix: ${r.suggestion}\n`;
      output += '\n';
    }
  }

  return output;
}

// Main execution
function main(): void {
  // Check if disabled
  if (AUDIT_MODE === 'disabled') {
    process.exit(0);
  }

  // Check if any file paths provided
  if (!FILE_PATHS.trim()) {
    process.exit(0);
  }

  // Filter to UI files only
  const files = FILE_PATHS.split(' ').filter(f => f.trim());
  const uiFiles = files.filter(isUIFile);

  if (uiFiles.length === 0) {
    console.log('No UI files changed, skipping audit');
    process.exit(0);
  }

  // Check dev server
  if (!checkDevServer()) {
    console.error('ERROR: Dev server not running at http://localhost:3000');
    console.error('Start with: pnpm dev');
    process.exit(2);
  }

  // Convergence protection
  const iteration = incrementIteration();
  if (iteration > MAX_ITERATIONS) {
    console.error(`WARNING: ${iteration} consecutive audit failures.`);
    console.error('Consider: SPARLO_AUDIT_HOOK=disabled to skip temporarily.');
    // Don't block, but warn
  }

  // Create secure temp directory
  const tempDir = mkdtempSync(join(tmpdir(), 'ux-audit-'));
  const outputPath = join(tempDir, 'results.json');

  try {
    // Run Playwright tests
    const result = spawnSync('npx', [
      'playwright', 'test',
      'tests/learning-loop/accessibility.spec.ts',
      '--reporter=json',
      `--output=${outputPath}`,
    ], {
      cwd: join(PROJECT_DIR, 'apps', 'e2e'),
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 60000,
    });

    // Write output to temp file for parsing
    writeFileSync(outputPath, result.stdout?.toString() || '{}');

    if (result.status !== 0) {
      const errors = parsePlaywrightOutput(outputPath);
      const formatted = formatErrors(errors);

      if (formatted) {
        console.error(formatted);
      } else {
        console.error('UX/UI AUDIT FAILED');
        console.error(result.stderr?.toString() || 'Unknown error');
      }

      if (AUDIT_MODE === 'warnings-only') {
        process.exit(0);
      }
      process.exit(2);
    }

    // Success - reset iteration counter
    resetIteration();
    console.log('✓ UX/UI audit passed');
    process.exit(0);

  } finally {
    // Cleanup temp files
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main();
```

**Alternative: Minimal Bash version** (if tsx not available):

`.claude/hooks/ui-audit.sh`:
```bash
#!/bin/bash
set -e

# Security: Sanitize inputs
sanitize_path() {
  local path="$1"
  # Remove dangerous characters
  echo "$path" | sed 's/[;&|`$]//g'
}

# Check if disabled
if [ "$SPARLO_AUDIT_HOOK" = "disabled" ]; then
  exit 0
fi

# Skip if no file paths provided
if [ -z "$CLAUDE_FILE_PATHS" ]; then
  exit 0
fi

# Sanitize project dir
PROJECT_DIR=$(sanitize_path "$CLAUDE_PROJECT_DIR")
if [ -z "$PROJECT_DIR" ]; then
  PROJECT_DIR="$(pwd)"
fi

# Check if any UI files changed
UI_FILES=$(echo "$CLAUDE_FILE_PATHS" | tr ' ' '\n' | grep -E '\.(tsx|jsx|css)$' | grep -vE '(\.test\.|\.spec\.|_lib/server|/api/)' || true)

if [ -z "$UI_FILES" ]; then
  echo "No UI files changed, skipping audit"
  exit 0
fi

# Check if dev server is running (fast health check)
if ! curl -sf --max-time 2 http://localhost:3000 >/dev/null 2>&1; then
  echo "ERROR: Dev server not running at http://localhost:3000" >&2
  echo "Start with: pnpm dev" >&2
  exit 2
fi

# Create secure temp file
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

# Run fast audit tests (accessibility only for MVP)
cd "$PROJECT_DIR/apps/e2e"
if npx playwright test tests/learning-loop/accessibility.spec.ts --reporter=line 2>"$TEMP_FILE"; then
  echo "✓ UX/UI audit passed"
  exit 0
else
  echo "UX/UI AUDIT FAILED" >&2
  echo "" >&2
  cat "$TEMP_FILE" >&2
  echo "" >&2
  echo "Fix accessibility issues and try again." >&2
  echo "Ref: docs/SPARLO-DESIGN-SYSTEM.md" >&2
  exit 2
fi
```

`.claude/settings.json` (for TypeScript version):
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsx \"$CLAUDE_PROJECT_DIR/.claude/hooks/ui-audit.ts\""
          }
        ]
      }
    ]
  }
}
```

`.claude/settings.json` (for Bash version - alternative):
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/ui-audit.sh\""
          }
        ]
      }
    ]
  }
}
```

**Success criteria:**
- [ ] Hook triggers when Claude edits .tsx/.jsx/.css files
- [ ] Hook skips for non-UI file changes
- [ ] Hook reports clear error if dev server not running
- [ ] Failures surface to Claude via stderr

#### Phase 2: Fast Audit Test Suite

**Goal:** Create a fast (<30s) test suite optimized for the learning loop.

**Tasks:**

- [ ] Create `apps/e2e/tests/learning-loop/` directory
- [ ] Create `design-system.spec.ts` - validates design token usage
  - Typography scale compliance (18px body, proper hierarchy)
  - Color palette compliance (zinc-950, 700, 500, 400)
  - Left border accent pattern usage
  - Component primitive usage
- [ ] Create `accessibility.spec.ts` - WCAG 2.1 AA compliance
  - Color contrast (4.5:1 minimum)
  - Touch targets (44x44px minimum)
  - Focus indicators
  - ARIA labels
- [ ] Create `visual-regression.spec.ts` - key component snapshots
  - Critical UI components only (not full pages)
  - Masked dynamic content
  - 100px tolerance for minor variations
- [ ] Update `playwright.config.ts` with visual testing defaults

**Files to create:**

`apps/e2e/tests/learning-loop/design-system.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Design System Compliance @fast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
  });

  test('body text uses correct typography', async ({ page }) => {
    const bodyText = page.locator('p, .body-text').first();
    const fontSize = await bodyText.evaluate(el =>
      getComputedStyle(el).fontSize
    );
    expect(fontSize).toBe('18px');
  });

  test('uses design system colors only', async ({ page }) => {
    // Check for non-design-system colors
    const violations = await page.evaluate(() => {
      const allowedColors = [
        'rgb(9, 9, 11)',      // zinc-950
        'rgb(63, 63, 70)',    // zinc-700
        'rgb(113, 113, 122)', // zinc-500
        'rgb(161, 161, 170)', // zinc-400
        'rgb(255, 255, 255)', // white
        'rgb(250, 250, 250)', // zinc-50
        'rgb(244, 244, 245)', // zinc-100
      ];

      const elements = document.querySelectorAll('*');
      const violations: string[] = [];

      elements.forEach(el => {
        const style = getComputedStyle(el);
        const color = style.color;
        const bg = style.backgroundColor;

        // Check if color is outside design system
        if (color && !allowedColors.some(c => color.includes(c.replace('rgb', '')))) {
          violations.push(`Color violation: ${el.tagName} uses ${color}`);
        }
      });

      return violations.slice(0, 5); // Limit to 5
    });

    expect(violations).toEqual([]);
  });

  test('left border accent pattern used correctly', async ({ page }) => {
    const accentElements = page.locator('[class*="border-l-"]');
    const count = await accentElements.count();

    // Verify at least some accent patterns exist on dashboard
    expect(count).toBeGreaterThan(0);
  });
});
```

`apps/e2e/tests/learning-loop/accessibility.spec.ts`:
```typescript
/**
 * Accessibility Compliance Tests for UX/UI Learning Loop
 *
 * Uses @axe-core/playwright for WCAG 2.1 AA validation.
 * Optimized for fast execution (<10s) in the PostToolUse hook.
 *
 * Based on Context7 research for axe-core best practices:
 * - Use withTags() to filter to relevant WCAG rules
 * - Filter by impact level for actionable failures
 * - Exclude known false positives with exclude()
 * - Structure output for Claude consumption
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Test timeout: 30s max for learning loop
test.setTimeout(30000);

test.describe('Accessibility Compliance @fast', () => {
  test('homepage meets WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/');
    // Use domcontentloaded for speed (not networkidle)
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      // Exclude known third-party iframes that may have issues
      .exclude('iframe[src*="youtube"]')
      .exclude('iframe[src*="vimeo"]')
      .analyze();

    // Filter to critical/serious violations only (not minor/moderate)
    const actionableViolations = results.violations.filter(v =>
      v.impact === 'critical' || v.impact === 'serious'
    );

    // Format violations for Claude consumption
    if (actionableViolations.length > 0) {
      const formatted = actionableViolations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.slice(0, 3).map(n => ({
          html: n.html.slice(0, 100),
          target: n.target[0],
          failureSummary: n.failureSummary,
        })),
      }));

      console.error('ACCESSIBILITY VIOLATIONS:', JSON.stringify(formatted, null, 2));
    }

    expect(actionableViolations, 'Critical/serious accessibility violations found').toEqual([]);
  });

  test('dashboard meets WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .include('main') // Focus on main content area
      .analyze();

    const critical = results.violations.filter(v =>
      v.impact === 'critical' || v.impact === 'serious'
    );

    expect(critical).toEqual([]);
  });

  test('interactive elements have accessible names', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');

    // Use axe-core's button-name and link-name rules
    const results = await new AxeBuilder({ page })
      .withRules(['button-name', 'link-name', 'label', 'input-button-name'])
      .analyze();

    const violations = results.violations;

    if (violations.length > 0) {
      console.error('MISSING ACCESSIBLE NAMES:', violations.map(v => ({
        rule: v.id,
        elements: v.nodes.slice(0, 3).map(n => n.html.slice(0, 80)),
      })));
    }

    expect(violations).toEqual([]);
  });

  test('color contrast meets WCAG AA (4.5:1)', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    const contrastViolations = results.violations;

    if (contrastViolations.length > 0) {
      console.error('COLOR CONTRAST VIOLATIONS:');
      contrastViolations.forEach(v => {
        v.nodes.slice(0, 3).forEach(n => {
          console.error(`  - ${n.target[0]}: ${n.failureSummary}`);
        });
      });
      console.error('Fix: Use zinc-700 or darker for text. Ref: docs/SPARLO-DESIGN-SYSTEM.md');
    }

    expect(contrastViolations).toEqual([]);
  });
});
```

> **Research Insight (Context7 - axe-core):** Use `withTags()` for WCAG compliance levels, `include()`/`exclude()` for scope control, and always filter by `impact` to prioritize actionable violations. The `withRules()` method targets specific checks for faster execution.

**Success criteria:**
- [ ] Tests complete in <30 seconds
- [ ] Design system violations reported with specific details
- [ ] Accessibility issues include severity and fix suggestions
- [ ] Tests run in headless mode for CI

#### Phase 3: File-to-Test Mapping

**Goal:** Run only relevant tests based on which files changed.

**Tasks:**

- [ ] Create `.claude/hooks/test-mapping.json` configuration
- [ ] Update `ui-audit.sh` to use mapping
- [ ] Map component directories to test files
- [ ] Add catch-all for unknown files

**File to create:**

`.claude/hooks/test-mapping.json`:
```json
{
  "mappings": [
    {
      "pattern": "apps/web/app/(marketing)/**",
      "tests": ["landing-page.spec.ts"]
    },
    {
      "pattern": "apps/web/app/home/(user)/reports/**",
      "tests": ["report-presentation-audit.spec.ts", "brand-audit/reports-page-audit.spec.ts"]
    },
    {
      "pattern": "apps/web/app/home/(user)/new/**",
      "tests": ["new-analysis-page-audit.spec.ts"]
    },
    {
      "pattern": "packages/ui/**",
      "tests": ["learning-loop/design-system.spec.ts"]
    },
    {
      "pattern": "**/*.css",
      "tests": ["learning-loop/design-system.spec.ts", "learning-loop/accessibility.spec.ts"]
    }
  ],
  "fallback": ["learning-loop/"]
}
```

**Success criteria:**
- [ ] Button.tsx change only runs component tests
- [ ] Landing page change only runs landing page tests
- [ ] Global CSS change runs all design system tests

#### Phase 4: Error Formatting & Feedback

**Goal:** Format test failures so Claude can understand and fix them.

**Tasks:**

- [ ] Create structured error output format
- [ ] Include file paths and line numbers where possible
- [ ] Group errors by severity (critical/high/medium)
- [ ] Limit output to top 5 most actionable errors
- [ ] Include fix suggestions from design system docs

**Error format example:**
```
UX/UI AUDIT FAILED (2 critical, 3 warnings)

CRITICAL:
❌ [apps/web/app/home/page.tsx] Color contrast insufficient
   Expected: 4.5:1 minimum
   Actual: 3.2:1 (zinc-400 on white)
   Fix: Use zinc-700 or darker for body text
   Ref: docs/SPARLO-DESIGN-SYSTEM.md#color-palette

❌ [packages/ui/src/Button.tsx] Touch target too small
   Expected: 44x44px minimum
   Actual: 32x24px
   Fix: Add padding or min-height to button

WARNINGS:
⚠ [apps/web/app/home/page.tsx] Non-standard font size
   Expected: 18px (body) or 13px (caption)
   Actual: 16px
   Fix: Use text-lg (18px) or text-sm (13px)
```

**Success criteria:**
- [ ] Claude can read and understand errors
- [ ] Each error includes actionable fix
- [ ] Reference to design system documentation included

#### Phase 5: Enable/Disable Mechanism

**Goal:** Allow users and design agents to disable the hook when needed.

**Tasks:**

- [ ] Add `SPARLO_AUDIT_HOOK` environment variable check
- [ ] Values: `enabled` (default), `disabled`, `warnings-only`
- [ ] Design agents can set `disabled` during iteration
- [ ] Add timeout (60s max) to prevent hanging

**Update to `ui-audit.sh`:**
```bash
# Check if disabled
if [ "$SPARLO_AUDIT_HOOK" = "disabled" ]; then
  exit 0
fi

# Warnings-only mode
if [ "$SPARLO_AUDIT_HOOK" = "warnings-only" ]; then
  # Run tests but always exit 0
  npx playwright test tests/learning-loop/ --reporter=list || true
  exit 0
fi
```

**Success criteria:**
- [ ] `SPARLO_AUDIT_HOOK=disabled` skips all audits
- [ ] design-iterator agent can disable during iterations
- [ ] Users can disable for rapid prototyping

## Alternative Approaches Considered

### 1. Chrome Extension for Visual Auditing

**Rejected because:**
- Cannot run headless (requires Xvfb in CI)
- Multiple execution contexts (popup, content scripts) complicate E2E
- No baseline management for visual regression
- Not designed for automated, repeatable testing

### 2. Pre-commit Git Hook Instead of PostToolUse

**Rejected because:**
- Only triggers on commit, not during coding session
- Doesn't provide immediate feedback loop
- Claude can't fix issues before commit

### 3. MCP Server for Browser Control

**Considered for Phase 2:**
- Microsoft Playwright MCP enables Claude to interact with browser
- Useful for debugging failed audits
- More complex to set up
- Will add in future iteration

### 4. AI-Powered Visual Testing (Percy/Applitools)

**Considered for Phase 3:**
- Reduces false positives through AI diffing
- Expensive ($199+/month)
- Overkill for MVP
- Can add later if needed

## Acceptance Criteria

### Functional Requirements

- [ ] PostToolUse hook triggers on every Edit/Write/MultiEdit to UI files
- [ ] Hook detects .tsx, .jsx, .css files (excluding tests, server code)
- [ ] Hook runs targeted Playwright tests based on changed files
- [ ] Test failures are formatted and returned to Claude via stderr
- [ ] Claude receives clear, actionable error messages
- [ ] Hook exits 0 on pass, allowing Claude to continue
- [ ] Hook exits 2 on fail, blocking further edits until fixed
- [ ] Design system compliance is validated (colors, typography, spacing)
- [ ] WCAG 2.1 AA accessibility is validated

### Non-Functional Requirements

- [ ] Fast audit tests complete in <30 seconds
- [ ] Full audit suite completes in <2 minutes
- [ ] Hook gracefully handles missing dev server
- [ ] Hook can be disabled via environment variable
- [ ] Hook doesn't trigger on non-UI files
- [ ] Works in both local and Claude Code web environments

### Quality Gates

- [ ] All new test files have proper TypeScript types
- [ ] Tests use Page Object pattern (per existing convention)
- [ ] Tests use `data-test` attributes for selectors
- [ ] Hook script is executable (chmod +x)
- [ ] Error messages reference design system documentation

## Success Metrics

1. **Immediate feedback:** Average time from edit to audit result <30s
2. **Catch rate:** >90% of design system violations caught before review
3. **False positive rate:** <10% of failures are not real issues
4. **Learning loop effectiveness:** 80% of issues fixed within 3 iterations

## Dependencies & Prerequisites

### Required Before Implementation

- [ ] Dev server running at http://localhost:3000
- [ ] Playwright browsers installed (`npx playwright install`)
- [ ] @axe-core/playwright installed (`pnpm add -D @axe-core/playwright --filter e2e`)
- [ ] tsx installed for TypeScript hook (`pnpm add -D tsx --filter web`)
- [ ] Existing UX audit tests passing
- [ ] **Security: Hardcoded credentials removed from test files**

### External Dependencies

- Playwright 1.57+ (already installed)
- @axe-core/playwright (needs install)
- tsx (for TypeScript hook execution - replaces jq requirement)
- Node.js 18+ (already available)

> **Research Insight (performance-oracle):** jq is NOT installed on this system. The TypeScript hook uses native Node.js JSON parsing instead, which is cross-platform and doesn't require additional dependencies.

## Risk Analysis & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Tests too slow | Medium | High | Use `domcontentloaded` not `networkidle`, run single a11y test file |
| False positives | Medium | Medium | Filter to critical/serious impact only, exclude third-party iframes |
| Dev server not running | High | High | Clear error message with `pnpm dev` hint, 2s timeout health check |
| Infinite fix loops | Medium | High | **Convergence protection: max 5 iterations, then warn** |
| Breaking existing workflow | Low | High | `SPARLO_AUDIT_HOOK=disabled` environment variable |
| **Command injection** | Low | Critical | Path sanitization in TypeScript hook, validate against PROJECT_DIR |
| **Hardcoded credentials exposed** | High | Critical | **MUST fix before deployment** - move to .env.test |

> **Research Insight (architecture-strategist):** Added convergence protection with `.iteration-count` file. After 5 consecutive failures, the hook warns but doesn't block, preventing infinite fix loops that could stall Claude.

## Documentation Plan

- [ ] Update `CLAUDE.md` with hook usage instructions
- [ ] Add `docs/UX-UI-AUDIT-LOOP.md` explaining the system
- [ ] Document environment variables in `apps/e2e/CLAUDE.md`
- [ ] Add troubleshooting section for common failures

## References & Research

### Internal References

- Design system: `docs/SPARLO-DESIGN-SYSTEM.md`
- Existing UX tests: `apps/e2e/tests/ux-audit/`
- Playwright config: `apps/e2e/playwright.config.ts`
- E2E patterns: `apps/e2e/CLAUDE.md`
- Design agents: `.claude/agents/design/`
- Existing audit plan: `plans/sparlo-ux-ui-autonomous-testing-agent.md`

### External References

- [Claude Code Hooks Documentation](https://code.claude.com/docs/en/hooks)
- [Playwright Visual Testing](https://playwright.dev/docs/test-snapshots)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)

## MVP Checklist (Simplified per Research)

> **Per code-simplicity-reviewer:** Start with single accessibility test file. Defer design-system.spec.ts and visual-regression.spec.ts to Phase 2.

### Pre-requisites (Security Fixes)

1. [ ] **Fix hardcoded credentials** - Move test credentials to environment variables
   - Files affected: 31+ files in `apps/e2e/tests/`
   - Create `.env.test` with `TEST_EMAIL` and `TEST_PASSWORD`
   - Update test files to use `process.env.TEST_EMAIL`

2. [ ] Install tsx for TypeScript hook execution
   ```bash
   pnpm add -D tsx --filter web
   ```

### MVP Implementation

1. [ ] Create `.claude/hooks/` directory
2. [ ] Create `.claude/hooks/ui-audit.ts` (TypeScript version from Phase 1)
3. [ ] Create `.claude/settings.json` with PostToolUse hook config
4. [ ] Create `apps/e2e/tests/learning-loop/accessibility.spec.ts` (axe-core version)
5. [ ] Install @axe-core/playwright
   ```bash
   pnpm add -D @axe-core/playwright --filter e2e
   ```
6. [ ] Start dev server: `pnpm dev`
7. [ ] Test manually: edit a .tsx file, verify hook runs and tests execute

### Verification

```bash
# Test the hook manually
export CLAUDE_FILE_PATHS="apps/web/app/home/page.tsx"
export CLAUDE_PROJECT_DIR="/Users/alijangbar/Desktop/sparlo-v2"
npx tsx .claude/hooks/ui-audit.ts
```

### Success Criteria

- [ ] Hook triggers on .tsx/.jsx/.css file edits
- [ ] Hook skips server-only files
- [ ] Accessibility violations surface to Claude with actionable errors
- [ ] Total audit time <30 seconds
