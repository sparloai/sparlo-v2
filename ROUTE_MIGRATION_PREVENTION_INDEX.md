# Route Migration Prevention - Complete Index

Complete prevention guidance for route migration issues in Sparlo V2. This index links to all prevention resources.

---

## Quick Start

**If you have 2 minutes:** Read [ROUTE_MIGRATION_QUICK_GUIDE.md](ROUTE_MIGRATION_QUICK_GUIDE.md)

**If you have 10 minutes:** Read this file

**If you have 30 minutes:** Read [PREVENTION_ROUTE_MIGRATION_ISSUES.md](PREVENTION_ROUTE_MIGRATION_ISSUES.md)

**If you need test scripts:** See [ROUTE_MIGRATION_TEST_SCRIPTS.md](ROUTE_MIGRATION_TEST_SCRIPTS.md)

---

## Problem Statement

Route migrations in Sparlo V2 can fail due to:

1. **Import path mismatches** - Using wrong path aliases (`~/*` vs `~/lib/*`)
2. **Build failures** - Unresolved imports discovered only after push
3. **Duplicate handlers** - Cherry-picks creating duplicate route patterns in `proxy.ts`
4. **Duplicate definitions** - Duplicate function names from cherry-picks
5. **Inconsistent patterns** - Mix of relative and alias imports

**Cost:** Hours of debugging after a failed deploy

**Prevention:** 12 minutes of pre-migration checks

---

## Solution Overview

### Three-Layer Prevention

```
Layer 1: PRE-MIGRATION
├─ Understand path aliases (~/* vs ~/lib/*)
├─ Verify current build passes
├─ Check for existing duplicates
└─ Document planned changes

Layer 2: DURING MIGRATION
├─ Move files systematically
├─ Update imports in moved files
├─ Update proxy.ts if needed
├─ Verify no duplicates
└─ Run local verification tests

Layer 3: POST-MIGRATION
├─ TypeScript compilation check
├─ Build test
├─ Duplicate detection
├─ Git pre-push hook runs automatically
└─ Safe to push
```

---

## Key Resources

### 1. Quick Reference Guide

**File:** [ROUTE_MIGRATION_QUICK_GUIDE.md](ROUTE_MIGRATION_QUICK_GUIDE.md)

**Contains:**
- Path alias mapping reference
- Critical file locations
- Quick fix guide for common issues
- Command cheat sheet

**Time:** 2 minutes to review

**When to use:** Before starting any migration

### 2. Comprehensive Prevention Guide

**File:** [PREVENTION_ROUTE_MIGRATION_ISSUES.md](PREVENTION_ROUTE_MIGRATION_ISSUES.md)

**Contains:**
- Detailed pre-migration checklist
- Step-by-step best practices
- Understanding path aliases in depth
- Route structure change guidelines
- Complete test case descriptions
- Recovery procedures
- Verification checklists

**Time:** 20-30 minutes to study

**When to use:** Planning major route changes

### 3. Test Scripts & Automation

**File:** [ROUTE_MIGRATION_TEST_SCRIPTS.md](ROUTE_MIGRATION_TEST_SCRIPTS.md)

**Contains:**
- Ready-to-use bash scripts
- Pre-migration verification script
- Post-migration verification script
- Duplicate detection script
- Git pre-push hook
- Safe cherry-pick script
- Installation instructions

**Time:** 5 minutes to install

**When to use:** Set up once, use always

---

## Critical Files to Monitor

### Path Aliases Configuration

**File:** `/Users/alijangbar/Desktop/sparlo-v2/apps/web/tsconfig.json`

```json
{
  "baseUrl": ".",
  "paths": {
    "~/*": ["./app/*"],
    "~/config/*": ["./config/*"],
    "~/lib/*": ["./lib/*"],
    "~/components/*": ["./components/*"],
    "~/styles/*": ["./styles/*"]
  }
}
```

**Key Rule:** `~/*` maps to `./app/*`, NOT project root!

### Route Handlers & Patterns

**File:** `/Users/alijangbar/Desktop/sparlo-v2/apps/web/proxy.ts` (lines 253-298)

**What to check:**
- No duplicate `pathname:` patterns
- Each pattern has exactly one handler
- Pattern count = Handler count

---

## Standard Workflow

### Before Migration

```bash
# 1. Verify current state
./scripts/pre-migration-check.sh

# All checks must pass ✅
# If any fail, fix before proceeding
```

### During Migration

```
1. Move files to new location
2. Update imports in those files
   - Use correct path aliases
   - Be consistent
3. Update proxy.ts if route path changed
   - Check for duplicate patterns
4. Update navigation config if applicable
```

### After Migration

```bash
# 1. Verify changes
./scripts/verify-migration.sh

# All tests must pass ✅

# 2. Push (pre-push hook runs auto checks)
git push origin feature-branch

# Pre-push hook automatically runs:
# - pnpm typecheck
# - pnpm lint
# - proxy.ts duplicate check
```

---

## Critical Checks

### Check 1: Path Alias Verification

```bash
# Understanding - Read this first
# File: ROUTE_MIGRATION_QUICK_GUIDE.md (Path Alias section)

# Automated check
grep -A 1 '"~\/\*"' apps/web/tsconfig.json
# Should output: "~/*": ["./app/*"]
```

### Check 2: Build Verification

```bash
# Before push (CRITICAL - run locally!)
pnpm typecheck && pnpm lint && pnpm --filter web build

# If any fails, fix before pushing
```

### Check 3: Duplicate Detection

```bash
# After cherry-pick or merge
./scripts/check-duplicates.sh

# Checks:
# 1. Duplicate patterns in proxy.ts
# 2. Duplicate function definitions
# 3. Duplicate identifiers (TypeScript)
```

### Check 4: Proxy.ts Pattern Validation

```bash
# Count patterns and handlers
PATTERNS=$(grep -c "pattern:" apps/web/proxy.ts)
HANDLERS=$(grep -c "handler:" apps/web/proxy.ts)
echo "Patterns: $PATTERNS, Handlers: $HANDLERS"

# They must match!
[ "$PATTERNS" -eq "$HANDLERS" ] && echo "✅ Match" || echo "❌ Mismatch"
```

---

## Decision Trees

### Should I use `~/` or relative path?

```
┌─ Importing from within same directory?
│  └─ YES → Use relative: ./file or ../sibling
│  └─ NO  → Use alias: ~/lib/... or ~/config/...
│
└─ Importing from different directory?
   ├─ From app router (page.tsx, layout.tsx)
   │  └─ Use: ~/config or ~/lib (alias preferred)
   │
   ├─ From lib utilities
   │  └─ Use: ~/lib/... (consistent with lib location)
   │
   └─ From config
      └─ Use: ~/config/... (explicit path)
```

### What alias should I use?

```
For files in apps/web/lib/*:        ~/lib/yourfile
For files in apps/web/config/*:     ~/config/yourfile
For files in apps/web/app/*:        ~/yourfile or ~/*
For files in apps/web/components/*: ~/components/yourfile
For files in apps/web/styles/*:     ~/styles/yourfile
```

### How to handle route changes?

```
┌─ Just moving file within same route?
│  └─ Update imports, no proxy.ts changes needed
│
└─ Changing the route path itself (e.g., /app → /app/[account])?
   ├─ Move files
   ├─ Update imports
   ├─ Check proxy.ts patterns match new paths
   ├─ Verify no new duplicate patterns created
   └─ Build and test
```

---

## Common Scenarios

### Scenario 1: Simple File Move

```
BEFORE:  app/app/reports/page.tsx
AFTER:   app/app/reports/[id]/page.tsx

Steps:
1. Create new directory structure
2. Move file
3. Update imports in the file
4. NO proxy.ts changes (still under /app/*)
5. pnpm typecheck && pnpm build
```

### Scenario 2: Route Path Change

```
BEFORE:  /app/reports → app/app/reports/page.tsx
AFTER:   /app/[account]/reports → app/app/[account]/reports/page.tsx

Steps:
1. Create new directory structure
2. Move file
3. Update imports in the file
4. Check proxy.ts patterns (still /app/*)
5. Update navigation config if it references old path
6. pnpm typecheck && pnpm build
```

### Scenario 3: Cherry-Pick with Duplicates

```
DURING:  git cherry-pick <commit>
AFTER:   Duplicates appear in proxy.ts

Recovery:
1. Run: ./scripts/check-duplicates.sh
2. Identify duplicates
3. Edit proxy.ts, delete duplicate pattern
4. Keep only the most recent definition
5. pnpm typecheck
6. git push
```

---

## Testing Summary

| Test | Command | Catches |
|------|---------|---------|
| **TypeScript** | `pnpm typecheck` | Path errors, duplicates, type issues |
| **Linting** | `pnpm lint` | Unused imports, consistency |
| **Build** | `pnpm --filter web build` | Runtime issues, resolution problems |
| **Pre-migration** | `./scripts/pre-migration-check.sh` | Existing issues before changes |
| **Post-migration** | `./scripts/verify-migration.sh` | Issues after changes |
| **Duplicates** | `./scripts/check-duplicates.sh` | Duplicate patterns/functions |

---

## Prevention Metrics

### Time Investment vs Time Saved

```
Pre-migration check:          5 min
Making changes:               5 min
Verification testing:         2 min
TOTAL:                       12 min

Debugging failed build:      Hours
Debugging duplicate error:   Hours
Production incident:         Days

SAVINGS:                     Massive!
```

### Success Criteria

- ✅ All pre-migration checks pass
- ✅ TypeScript compilation passes
- ✅ ESLint/formatting passes
- ✅ Build succeeds locally
- ✅ No duplicate patterns/functions
- ✅ Git pre-push hook passes
- ✅ PR review completed
- ✅ CI/CD pipeline passes

---

## Troubleshooting

### "Cannot find module" Error

**See:** [ROUTE_MIGRATION_QUICK_GUIDE.md](ROUTE_MIGRATION_QUICK_GUIDE.md) (Quick Fix Guide section)

**Process:**
1. Identify the import line from error
2. Check the path alias matches tsconfig.json
3. Verify the file exists at that location
4. Fix the path

### Duplicate Identifier Error

**See:** [PREVENTION_ROUTE_MIGRATION_ISSUES.md](PREVENTION_ROUTE_MIGRATION_ISSUES.md) (Section 1.3)

**Process:**
1. Find all definitions: `grep -rn "identifier_name" apps/web`
2. Delete the duplicate
3. Keep the most recent/complete version
4. Rerun: `pnpm typecheck`

### Proxy.ts Pattern Mismatch

**See:** [ROUTE_MIGRATION_QUICK_GUIDE.md](ROUTE_MIGRATION_QUICK_GUIDE.md) (Avoiding Proxy.ts Duplicates)

**Process:**
1. Check for duplicates: `grep "pathname:" apps/web/proxy.ts`
2. Delete duplicate patterns
3. Verify: Pattern count = Handler count
4. Rerun: `pnpm typecheck`

---

## FAQ

### Q: When should I run these verification scripts?

A: Always! Before every route change.

```
1. Before starting: ./scripts/pre-migration-check.sh
2. After completing: ./scripts/verify-migration.sh
3. Before pushing: Git pre-push hook (automatic)
```

### Q: Can I skip the local build test?

A: **No!** This is when most issues are caught.

```bash
# This is critical:
pnpm --filter web build
```

### Q: What if the pre-push hook blocks my push?

A: Fix the issues! The hook is protecting your push.

```bash
# The hook checks:
pnpm typecheck  # Fix type errors
pnpm lint:fix   # Fix linting
# Then try push again
```

### Q: What's the difference between `~/` and `~/lib/`?

A: `~/` maps to `./app/*`, but you usually want `~/lib/` for utilities.

```typescript
// ❌ WRONG
import util from '~/util';  // Looks in ./app/util (not found!)

// ✅ CORRECT
import util from '~/lib/util';  // Looks in ./lib/util (found!)
```

### Q: How do I know if I need to update proxy.ts?

A: Only if you're changing the route path itself.

```
Moving from /app/a → /app/b:
  - Update imports
  - NO proxy.ts change (still under /app/*)

Changing route path /app → /app/new:
  - Update imports
  - Check proxy.ts patterns
  - Usually NO change (pattern is still /app/*)
  - Only if completely removing/renaming route
```

---

## Document Links

| Document | Purpose | Time |
|----------|---------|------|
| [ROUTE_MIGRATION_QUICK_GUIDE.md](ROUTE_MIGRATION_QUICK_GUIDE.md) | Quick reference | 2 min |
| [PREVENTION_ROUTE_MIGRATION_ISSUES.md](PREVENTION_ROUTE_MIGRATION_ISSUES.md) | Detailed guide | 20 min |
| [ROUTE_MIGRATION_TEST_SCRIPTS.md](ROUTE_MIGRATION_TEST_SCRIPTS.md) | Test automation | 5 min setup |
| [CODE_REVIEW_CHECKLISTS.md](CODE_REVIEW_CHECKLISTS.md) | General best practices | 10 min |
| [CLAUDE.md](CLAUDE.md) | Project guidelines | Reference |

---

## Getting Started

### For Your First Route Migration

```bash
# 1. Read quick guide (2 min)
cat ROUTE_MIGRATION_QUICK_GUIDE.md

# 2. Install test scripts (5 min)
chmod +x scripts/*.sh
chmod +x .git/hooks/pre-push

# 3. Run pre-migration check
./scripts/pre-migration-check.sh

# 4. Make your changes
# (follow the process outlined in quick guide)

# 5. Run verification
./scripts/verify-migration.sh

# 6. Push
git push origin feature-branch
# (pre-push hook runs automatically)
```

### For Complex Migrations

```bash
# 1. Read full prevention guide (20 min)
cat PREVENTION_ROUTE_MIGRATION_ISSUES.md

# 2. Reference the detailed checklists
# (use during your migration)

# 3. Follow the step-by-step workflow
# (in PREVENTION_ROUTE_MIGRATION_ISSUES.md Section 4)
```

---

## Support & Questions

**If you get stuck:**

1. Check the Quick Guide first (2 min)
2. Search the Comprehensive Guide (20 min)
3. Review specific test script (5 min)
4. Check troubleshooting section above

**Most common issues have clear recovery steps in the documentation.**

---

## Summary

Route migration prevention is **automated and straightforward:**

1. **Before:** `./scripts/pre-migration-check.sh`
2. **During:** Make changes systematically
3. **After:** `./scripts/verify-migration.sh`
4. **Push:** Git pre-push hook validates automatically

**Total time: 12 minutes**
**Issues prevented: Dozens**
**Debugging time saved: Hours to Days**

---

## Quick Navigation

- [Read the quick guide](ROUTE_MIGRATION_QUICK_GUIDE.md) ← Start here for 2-min overview
- [Install test scripts](ROUTE_MIGRATION_TEST_SCRIPTS.md) ← Automate your checks
- [Study prevention strategies](PREVENTION_ROUTE_MIGRATION_ISSUES.md) ← Deep dive (20 min)
- [Check code review guidelines](CODE_REVIEW_CHECKLISTS.md) ← General best practices

**You've got this!** 🚀
