# Sparlo UX/UI Autonomous Testing & Improvement Agent

## Overview

This plan outlines the implementation of an autonomous testing agent that acts as a **Senior UX/UI Lead** for the Sparlo application. The agent will systematically review pages, identify UX/UI issues, and implement improvements while maintaining the $199/month premium quality standard.

## Scope

### Pages to Test
1. **Landing Page** (`/`) - Marketing and conversion
2. **Home Dashboard** (`/home`) - Primary user workspace
3. **New Report Creation** (`/home/new`) - Core product flow
4. **Reports Listing** (`/home/reports`) - Content management
5. **Navigation & Sidebar** - Global UX patterns
6. **Usage Meter** - Consumption tracking widget

### Quality Standard
All UX/UI must meet the bar of a **$199/month premium SaaS product**:
- Clean, professional typography (Soehne font family)
- Consistent spacing and visual rhythm
- Clear visual hierarchy
- Responsive across breakpoints
- Smooth transitions and micro-interactions
- Accessible (WCAG 2.1 AA minimum)

## Implementation Plan

### Phase 1: Test Infrastructure Setup

#### 1.1 Create Page Object Classes
Create dedicated Page Objects for each page under test:

```
apps/e2e/tests/
├── ux-audit/
│   ├── ux-audit.po.ts           # Base UX audit utilities
│   ├── landing-page.po.ts       # Landing page interactions
│   ├── home-dashboard.po.ts     # Home dashboard interactions
│   ├── new-report.po.ts         # Report creation flow
│   ├── reports-list.po.ts       # Reports listing page
│   ├── navigation.po.ts         # Sidebar and navigation
│   └── usage-meter.po.ts        # Usage meter component
```

**Files to create:**
- `/apps/e2e/tests/ux-audit/ux-audit.po.ts` - Base class with shared utilities
- Individual page object files for each target page

#### 1.2 Create UX Audit Test Suite
```
apps/e2e/tests/ux-audit/
├── landing-page.spec.ts
├── home-dashboard.spec.ts
├── new-report.spec.ts
├── reports-list.spec.ts
├── navigation.spec.ts
└── usage-meter.spec.ts
```

#### 1.3 Configure Playwright for UX Testing
Update or create config for visual and UX testing:
- Screenshot comparison thresholds
- Viewport configurations (mobile, tablet, desktop)
- Network throttling for performance testing

### Phase 2: UX Audit Criteria Implementation

#### 2.1 Visual Consistency Checks
Each page test will verify:

| Criterion | Check Method | Threshold |
|-----------|--------------|-----------|
| Typography | Verify Soehne font loading | Font-family computed style |
| Spacing | Screenshot comparison | Visual diff < 0.1% |
| Colors | CSS variable validation | Match design tokens |
| Borders | Element border inspection | Consistent zinc palette |
| Shadows | Box-shadow validation | Match Shadcn patterns |

#### 2.2 Interactive Element Standards
- **Buttons**: Proper hover/focus states, consistent sizing
- **Forms**: Clear labels, proper error states, loading indicators
- **Links**: Visible focus rings, consistent styling
- **Dropdowns/Modals**: Smooth animations, backdrop handling

#### 2.3 Responsive Breakpoints
Test at these viewports:
- Mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1280px
- Large: 1920px

#### 2.4 Usage Meter Specific Tests
| Usage Level | Color | Behavior |
|-------------|-------|----------|
| 0-25% | Green (`#22c55e`) | Normal display |
| 25-75% | Yellow (`#eab308`) | Warning indicator |
| 75-90% | Orange (`#f97316`) | Approaching limit |
| 90-100% | Red (`#ef4444`) | Critical alert |

### Phase 3: Test Execution Flow

#### 3.1 Authentication Strategy
```typescript
// Use existing test credentials for authenticated pages
const TEST_USER = {
  email: 'swimakaswim@gmail.com',
  password: 'Linguine2025'
};

// Test categories:
// - Public pages (landing): No auth required
// - Protected pages (home, reports): Use AuthPageObject.signIn()
```

#### 3.2 Test Execution Order
1. Landing page (unauthenticated)
2. Authentication flow
3. Home dashboard
4. Navigation/sidebar
5. Usage meter
6. New report creation
7. Reports listing

### Phase 4: Issue Detection & Reporting

#### 4.1 Issue Categories
| Severity | Description | Action |
|----------|-------------|--------|
| Critical | Broken functionality, missing content | Block deploy |
| Major | Poor UX, inconsistent styling | Fix before merge |
| Minor | Polish items, micro-interactions | Queue for improvement |
| Enhancement | Nice-to-have improvements | Document for backlog |

#### 4.2 Report Format
Each issue will be documented as:
```markdown
## [SEVERITY] Issue Title

**Page**: /path/to/page
**Component**: ComponentName
**Screenshot**: path/to/screenshot.png

### Problem
Clear description of the UX/UI issue.

### Expected Behavior
What the premium experience should look like.

### Suggested Fix
Specific implementation recommendation.
```

### Phase 5: Auto-Fix Implementation

#### 5.1 Safe Auto-Fix Categories
These issues can be fixed automatically:
- Spacing inconsistencies (padding/margin adjustments)
- Missing font-family declarations
- Color token mismatches
- Missing hover states on interactive elements
- Missing `data-test` attributes

#### 5.2 Manual Review Required
These issues require human approval:
- Layout restructuring
- Component replacements
- New component creation
- Animation/transition changes
- Copy/content changes

#### 5.3 Fix Verification
After each auto-fix:
1. Re-run affected tests
2. Capture new screenshots
3. Compare with baseline
4. If pass: commit with descriptive message
5. If fail: revert and document for manual review

### Phase 6: Continuous Monitoring

#### 6.1 Baseline Screenshots
Store visual baselines in:
```
apps/e2e/tests/ux-audit/baselines/
├── landing-page/
│   ├── desktop.png
│   ├── tablet.png
│   └── mobile.png
├── home-dashboard/
│   └── ...
```

#### 6.2 Regression Detection
On each PR:
- Run UX audit suite
- Compare against baselines
- Flag visual regressions > threshold
- Generate diff images for review

## File Structure

### New Files to Create
```
apps/e2e/
├── tests/
│   └── ux-audit/
│       ├── ux-audit.po.ts
│       ├── landing-page.po.ts
│       ├── landing-page.spec.ts
│       ├── home-dashboard.po.ts
│       ├── home-dashboard.spec.ts
│       ├── new-report.po.ts
│       ├── new-report.spec.ts
│       ├── reports-list.po.ts
│       ├── reports-list.spec.ts
│       ├── navigation.po.ts
│       ├── navigation.spec.ts
│       ├── usage-meter.po.ts
│       ├── usage-meter.spec.ts
│       └── baselines/
│           └── .gitkeep
├── playwright.ux-audit.config.ts
└── ux-audit-report.md (generated)
```

### Existing Files to Update
- `/apps/e2e/playwright.live.config.ts` - Add UX audit configuration
- `/apps/e2e/CLAUDE.md` - Document UX audit patterns

## Execution Commands

```bash
# Run full UX audit suite
pnpm --filter e2e test:ux-audit

# Run specific page audit
pnpm --filter e2e test:ux-audit -- --grep "landing"

# Update visual baselines
pnpm --filter e2e test:ux-audit -- --update-snapshots

# Run against live deployment
pnpm --filter e2e test:ux-audit:live
```

## Success Criteria

1. **All target pages have comprehensive UX test coverage**
2. **Visual baselines established for regression detection**
3. **Auto-fix capability for common issues implemented**
4. **Issue reporting generates actionable documentation**
5. **Tests run reliably against both local and live environments**

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Flaky visual tests | Use `toPass()` pattern with retries |
| Auth session issues | Dedicated test user, fresh session per suite |
| Dynamic content | Mask timestamps, use stable selectors |
| Network latency | Extended timeouts for live deployment |

## Dependencies

- Playwright 1.57+ (already installed)
- `@playwright/test` expect extensions
- Existing `AuthPageObject` for authentication
- Test credentials: `swimakaswim@gmail.com` / `Linguine2025`
