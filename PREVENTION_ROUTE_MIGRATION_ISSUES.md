# Prevention Strategies for Route Migration Issues

Comprehensive prevention guidance for route migration issues in Sparlo V2.

---

## 1. Pre-Migration Checklist

### Verify Path Aliases

**File:** `apps/web/tsconfig.json`

Current configuration:
- `~/*` → `./app/*` (App router files)
- `~/config/*` → `./config/*` (Configuration)
- `~/lib/*` → `./lib/*` (Utilities)
- `~/components/*` → `./components/*` (Global components)
- `~/styles/*` → `./styles/*` (Styles)

**Verification Steps:**

```bash
# 1. Verify current build works
pnpm typecheck   # No errors
pnpm lint        # No errors
pnpm build       # Success

# 2. Check for existing duplicates in proxy.ts
grep "pathname:" apps/web/proxy.ts | sort | uniq -d
# Should be empty

# 3. Count patterns and handlers match
PATTERNS=$(grep -c "pattern:" apps/web/proxy.ts)
HANDLERS=$(grep -c "handler:" apps/web/proxy.ts)
[ "$PATTERNS" -eq "$HANDLERS" ] && echo "Match" || echo "Mismatch"
```

### Build Verification Before Pushing

```bash
# ALWAYS run locally before pushing
pnpm typecheck && pnpm lint && pnpm --filter web build

# If any fail:
# 1. Read the error
# 2. Fix the issue
# 3. Rerun the tests
# 4. Only push when all pass
```

### Check for Duplicates After Cherry-Picks

```bash
# After: git cherry-pick <commit>

# Check for duplicate patterns
grep "pathname:" apps/web/proxy.ts | \
  sed "s/.*pathname: '//g" | sed "s/'.*//g" | \
  sort | uniq -d

# Check for duplicate functions
grep -rn "^export const name\|^export function name" apps/web | wc -l
# Should be 1 per function

# TypeScript will catch duplicate identifiers
pnpm typecheck
```

---

## 2. Best Practices

### Understanding the `~/*` Alias Mapping

The `~` alias in this codebase is NOT a project root reference:

```
Project Root: /Users/alijangbar/Desktop/sparlo-v2/
App BaseUrl: /Users/alijangbar/Desktop/sparlo-v2/apps/web/

tsconfig.json baseUrl: "." (relative to apps/web)

Resolution:
  ~/lib/inngest/client →
  ./lib/inngest/client (relative to apps/web) →
  /Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/inngest/client ✅
```

**Real Examples:**

```typescript
// From proxy.ts
import appConfig from '~/config/app.config';
// Resolves: ./config/app.config.ts ✅

// From app/settings/page.tsx
import pathsConfig from '~/config/paths.config';
// Resolves: ./config/paths.config.ts ✅

// From app/_lib/server
import { inngest } from '~/lib/inngest/client';
// Resolves: ./lib/inngest/client.ts ✅
```

### Proper Route Structure Changes

**Process:**
1. Move files to new location
2. Update imports in those files
3. Verify proxy.ts patterns still match new routes
4. Run: `pnpm typecheck && pnpm lint && pnpm build`

**Example Migration:**

```
Before:  apps/web/app/app/reports/page.tsx
After:   apps/web/app/app/[account]/reports/page.tsx

Steps:
1. Create directory: mkdir -p app/app/[account]/reports
2. Move file: mv app/app/reports/page.tsx app/app/[account]/reports/
3. Update imports in page.tsx
4. Check proxy.ts - /app/* pattern still covers it ✅
5. Verify: pnpm build
```

### Avoiding Duplicate Handlers in proxy.ts

**File Location:** `/Users/alijangbar/Desktop/sparlo-v2/apps/web/proxy.ts` (lines 253-298)

```typescript
// Structure of getPatterns()
async function getPatterns() {
  return [
    {
      pattern: new URLPattern({ pathname: '/admin/*?' }),
      handler: adminMiddleware,
    },
    {
      pattern: new URLPattern({ pathname: '/auth/*?' }),
      handler: authHandler,
    },
    {
      pattern: new URLPattern({ pathname: '/app/*?' }),
      handler: protectedRouteHandler,
    },
  ];
}
```

**Rules:**
- One pattern per route group
- No duplicate pathname patterns
- Each handler should be defined once
- Pattern count must equal handler count

**Duplicate Scenario (Cherry-Pick Issue):**

```typescript
// ❌ BAD - Cherry-pick creates duplicate
return [
  { pattern: new URLPattern({ pathname: '/app/*?' }), handler: h1 },
  { pattern: new URLPattern({ pathname: '/app/*?' }), handler: h2 }, // DUPLICATE!
];

// ✅ GOOD - Single definition
return [
  { pattern: new URLPattern({ pathname: '/app/*?' }), handler: protectedRouteHandler },
];
```

---

## 3. Test Cases

### TypeScript Compilation Check

```bash
# Catches:
# - Unresolved imports (path alias errors)
# - Duplicate identifiers
# - Type mismatches

pnpm typecheck

# Output if failure:
# error TS2307: Cannot find module '~/...'
# error TS2300: Duplicate identifier 'functionName'
```

### Build Verification

```bash
# Comprehensive test - runs everything
pnpm --filter web build

# Tests path resolution, TypeScript, Next.js checks, bundle generation
# This is the MOST important test before pushing
```

### Import Path Validation

```bash
# ESLint catches unused imports
pnpm lint

# Looks for unused/missing imports, inconsistent patterns
```

### Proxy Handler Validation

```bash
# Check for duplicate patterns
grep "pathname:" apps/web/proxy.ts | wc -l
# Count patterns

grep "handler:" apps/web/proxy.ts | wc -l
# Count handlers

# They must be equal!
```

### Duplicate Detection

```bash
# Find duplicate function definitions
grep -rn "^export const duplicate_name" apps/web | wc -l
# Result should be 1

# Find duplicate patterns
grep "pathname:" apps/web/proxy.ts | sort | uniq -d
# Result should be empty

# TypeScript duplicate check
pnpm typecheck 2>&1 | grep "Duplicate identifier"
# Result should be empty
```

---

## 4. Critical Files to Monitor

| File | Purpose | Check |
|------|---------|-------|
| `apps/web/tsconfig.json` | Path aliases | Mappings before migrating |
| `apps/web/proxy.ts` | Route handlers | Duplicate patterns (lines 253-298) |
| Modified files | Imports | Correct alias usage |
| `apps/web/config/paths.config.ts` | Routes | Update if paths change |

---

## 5. Common Pitfalls

### Pitfall 1: Wrong Path Alias

```typescript
// ❌ WRONG - Missing directory level
import { createI18nServerInstance } from '~/i18n/i18n.server';
// Maps to: ./app/i18n/... (doesn't exist!)

// ✅ CORRECT - Include lib directory
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
// Maps to: ./lib/i18n/i18n.server (exists!)
```

### Pitfall 2: Mixing Import Styles

```typescript
// ❌ INCONSISTENT
import config from '~/config/app.config';
import { utility } from '../../../lib/utils';
import { component } from './components/card';

// ✅ CONSISTENT - Use aliases
import config from '~/config/app.config';
import { utility } from '~/lib/utils';
import { component } from './_components/card';
```

### Pitfall 3: Cherry-Pick Duplicates

```bash
# After cherry-pick, check immediately
git cherry-pick abc123

# Check for duplicates
grep "pathname:" apps/web/proxy.ts | sort | uniq -d
# If non-empty, delete duplicate

pnpm typecheck
```

### Pitfall 4: Not Testing Locally

```bash
# ❌ WRONG
vim file.ts
git push  # Fails in CI!

# ✅ RIGHT
vim file.ts
pnpm typecheck && pnpm lint && pnpm build  # Pass locally
git push  # Succeeds!
```

---

## 6. Recovery Procedures

### Issue: Cannot Find Module

```bash
# 1. Identify the import from error message
# 2. Check file exists at that path
ls -la apps/web/lib/your-module/

# 3. Check tsconfig.json mapping
grep "your-module" apps/web/tsconfig.json

# 4. Fix import path
# Common fix: Add "lib" directory
# From: ~/util → To: ~/lib/util
```

### Issue: Duplicate Identifier

```bash
# 1. Find all occurrences
grep -rn "duplicate_name" apps/web

# 2. Delete incorrect definition
# 3. Keep the most recent/complete version

# 4. Verify
pnpm typecheck
```

### Issue: Proxy.ts Mismatch

```bash
# 1. Count patterns and handlers
PATTERNS=$(grep -c "pattern:" apps/web/proxy.ts)
HANDLERS=$(grep -c "handler:" apps/web/proxy.ts)

# 2. If mismatch, find duplicate patterns
grep "pathname:" apps/web/proxy.ts | sort | uniq -d

# 3. Delete duplicate
# 4. Rerun: pnpm typecheck
```

---

## 7. Workflow Summary

```
STEP 1: PRE-MIGRATION
├─ Run: pnpm typecheck && pnpm lint && pnpm build
├─ Check for existing duplicates
└─ Plan changes

STEP 2: MAKE CHANGES
├─ Move files
├─ Update imports (use correct aliases)
└─ Update proxy.ts if needed

STEP 3: POST-MIGRATION
├─ Run: pnpm typecheck
├─ Run: pnpm lint
├─ Run: pnpm build
├─ Check for duplicates
└─ All must pass ✅

STEP 4: PUSH
└─ git push origin feature
   (pre-push hook validates)
```

---

## 8. Prevention Checklist

```
☐ Pre-migration verification
  ☐ TypeScript check passes
  ☐ Build succeeds locally
  ☐ No existing duplicates

☐ File structure changes
  ☐ All files moved to correct location
  ☐ File internal imports updated
  ☐ No files left behind

☐ Import path updates
  ☐ Using consistent alias patterns
  ☐ No mix of relative and alias
  ☐ All paths resolve correctly

☐ Proxy.ts updates (if applicable)
  ☐ Patterns updated if routes changed
  ☐ No duplicate patterns
  ☐ Handler count = Pattern count

☐ Duplicate detection
  ☐ No duplicate function definitions
  ☐ No duplicate patterns
  ☐ TypeScript duplicate check passed

☐ Final verification
  ☐ pnpm typecheck passes
  ☐ pnpm lint passes
  ☐ pnpm build succeeds
  ☐ No console errors
  ☐ Ready to push
```

---

## Key Commands Reference

```bash
# TypeScript compilation (catches most issues)
pnpm typecheck

# Linting and consistency
pnpm lint
pnpm lint:fix

# Full build test (CRITICAL before push)
pnpm --filter web build

# Find path/import issues
pnpm typecheck 2>&1 | grep "Cannot find"

# Check proxy.ts
grep "pathname:" apps/web/proxy.ts
grep "handler:" apps/web/proxy.ts

# Find duplicates
grep -rn "export function name" apps/web

# Full pipeline
pnpm typecheck && pnpm lint && pnpm --filter web build
```

---

## Summary

**Route migrations succeed when you:**

1. ✅ Verify path aliases before changing imports
2. ✅ Test builds locally before pushing
3. ✅ Check for duplicates after cherry-picks
4. ✅ Use consistent import patterns
5. ✅ Follow the systematic workflow

**Time Investment:** 12 minutes per migration
**Problems Prevented:** Dozens
**Debugging Time Saved:** Hours to Days

---

## See Also

- [ROUTE_MIGRATION_QUICK_GUIDE.md](ROUTE_MIGRATION_QUICK_GUIDE.md) - Quick reference
- [ROUTE_MIGRATION_PREVENTION_INDEX.md](ROUTE_MIGRATION_PREVENTION_INDEX.md) - Complete index
- [ROUTE_MIGRATION_TEST_SCRIPTS.md](ROUTE_MIGRATION_TEST_SCRIPTS.md) - Automated scripts
