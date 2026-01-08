# Route Migration Prevention - Quick Guide

Quick-access prevention guidance for route migration issues in Sparlo V2.

---

## Path Alias Configuration

```json
// apps/web/tsconfig.json
{
  "baseUrl": ".",
  "paths": {
    "~/*": ["./app/*"],           // App router files
    "~/config/*": ["./config/*"], // Configuration files
    "~/lib/*": ["./lib/*"],       // Utilities & helpers
    "~/components/*": ["./components/*"],
    "~/styles/*": ["./styles/*"]
  }
}
```

**Critical Rule:** `~/*` maps to `./app/*`, NOT project root!

---

## Pre-Migration Checklist

```bash
# 1. Verify TypeScript compiles
pnpm typecheck

# 2. Verify linting passes
pnpm lint

# 3. Test local build (REQUIRED before push)
pnpm --filter web build

# All must pass ✅
```

---

## Post-Migration Verification

```bash
# 1. TypeScript check (catches import path errors)
pnpm typecheck

# 2. Linting check
pnpm lint

# 3. Full build test
pnpm --filter web build

# 4. Check for duplicate patterns in proxy.ts
grep "pathname:" apps/web/proxy.ts | sort | uniq -d
# Result must be EMPTY

# 5. Verify pattern count = handler count
PATTERNS=$(grep -c "pattern:" apps/web/proxy.ts)
HANDLERS=$(grep -c "handler:" apps/web/proxy.ts)
[ "$PATTERNS" -eq "$HANDLERS" ] && echo "✅" || echo "❌"
```

---

## Best Practices

### Understanding Path Aliases

| Import | Maps To | Example |
|--------|---------|---------|
| `~/config/app.config` | `./config/app.config` | Config file |
| `~/lib/utils` | `./lib/utils` | Utility in lib |
| `~/components/card` | `./components/card` | Global component |
| `~/app/page` | `./app/page` | App router page |

### Correct vs Incorrect Usage

```typescript
// ✅ CORRECT
import appConfig from '~/config/app.config';
import { inngest } from '~/lib/inngest/client';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';

// ❌ WRONG
import appConfig from '~/app.config';      // Missing "config"
import { inngest } from '~/inngest/client'; // Missing "lib"
import x from '../../../components/card';   // Use ~ alias
```

### Proxy.ts Pattern Guidelines

**File:** `/Users/alijangbar/Desktop/sparlo-v2/apps/web/proxy.ts`

```typescript
// ✅ CORRECT - No duplicates, each pattern has one handler
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

// ❌ WRONG - Duplicate /app pattern
async function getPatterns() {
  return [
    { pattern: new URLPattern({ pathname: '/app/*?' }), handler: h1 },
    { pattern: new URLPattern({ pathname: '/app/*?' }), handler: h2 }, // DUPLICATE!
  ];
}
```

---

## Duplicate Detection

After cherry-picks, check for duplicates:

```bash
# Find duplicate patterns in proxy.ts
grep "pathname:" apps/web/proxy.ts | \
  sed "s/.*pathname: '//g" | sed "s/'.*//g" | \
  sort | uniq -d

# Find duplicate functions
grep -rn "export const name\|export function name" apps/web | wc -l
# Should return 1 per function, if > 1 there's a duplicate

# TypeScript duplicate check
pnpm typecheck 2>&1 | grep "Duplicate identifier"
# Should return nothing
```

---

## Critical Files

| File | What to Check |
|------|---------------|
| `apps/web/tsconfig.json` | Path alias mappings |
| `apps/web/proxy.ts` | Route patterns & handlers (lines 253-298) |
| Modified files | Import statements use correct paths |
| `apps/web/config/paths.config.ts` | Route path config |

---

## Quick Fix Guide

### Issue: "Cannot find module" Error

```bash
# 1. Check error message for the import
# 2. Verify file exists at that path
# 3. Check tsconfig.json mapping
# 4. Fix the path (usually missing "lib" directory)
```

### Issue: Duplicate Function Error

```bash
# 1. Find duplicates: grep -rn "function_name" apps/web
# 2. Delete the incorrect definition
# 3. Run: pnpm typecheck
```

### Issue: Proxy.ts Pattern Mismatch

```bash
# 1. Count patterns vs handlers
grep -c "pattern:" apps/web/proxy.ts
grep -c "handler:" apps/web/proxy.ts
# Must match!

# 2. Find duplicates
grep "pathname:" apps/web/proxy.ts | sort | uniq -d
# Delete if found

# 3. Rerun: pnpm typecheck
```

---

## Migration Workflow

```
1. BEFORE CHANGES
   └─ ./scripts/pre-migration-check.sh

2. MAKE CHANGES
   ├─ Move files to new location
   ├─ Update imports (use correct aliases)
   └─ Update proxy.ts if route path changed

3. AFTER CHANGES
   └─ ./scripts/verify-migration.sh

4. PUSH
   └─ git push origin feature-branch
      (pre-push hook runs auto-validation)
```

---

## Essential Commands

```bash
# Full verification (run before every push)
pnpm typecheck && pnpm lint && pnpm --filter web build

# Find specific issues
pnpm typecheck 2>&1 | grep "Cannot find module"

# Check proxy.ts
grep "pathname:" apps/web/proxy.ts

# Fix linting
pnpm lint:fix
pnpm format:fix
```

---

## Key Rules

1. **Always test locally before pushing**
   - TypeScript, Linting, and Build must pass

2. **Use path aliases consistently**
   - Use `~/lib/*` not `~/*` for utilities
   - Never mix relative and alias imports

3. **Check for duplicates after cherry-picks**
   - Search for duplicate patterns in proxy.ts
   - TypeScript will catch duplicate identifiers

4. **One pattern per route group**
   - No duplicate patterns in proxy.ts
   - Each pattern has exactly one handler

5. **Update systematically**
   - Move files first
   - Update imports second
   - Update proxy.ts last (if needed)

---

## Time Investment

- Pre-migration check: 5 min
- Making changes: 5 min
- Verification: 2 min
- **Total: 12 min**
- **Debugging if skipped: Hours to Days**

---

**See:** [ROUTE_MIGRATION_PREVENTION_INDEX.md](ROUTE_MIGRATION_PREVENTION_INDEX.md) for comprehensive guide
