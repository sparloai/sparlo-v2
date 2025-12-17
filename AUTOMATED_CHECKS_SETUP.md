# Automated Checks Setup Guide

This guide provides ready-to-implement ESLint rules, TypeScript configurations, and test templates to automatically catch the 9 issue categories.

---

## 1. ESLint Rules (Catch at Linting Time)

### Rule 1: Require Server Action Authorization

**Purpose:** Prevent missing `auth: true` in server actions

**File:** `tooling/eslint/rules/require-server-action-auth.js`

```javascript
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require auth: true in server action definitions',
      category: 'Security',
    },
    fixable: 'code',
  },
  create(context) {
    return {
      CallExpression(node) {
        // Match enhanceAction() calls
        if (
          (node.callee.name === 'enhanceAction' ||
            node.callee.name === 'enhanceRouteHandler') &&
          node.arguments.length >= 2
        ) {
          const options = node.arguments[1];

          if (!options || options.type !== 'ObjectExpression') {
            context.report({
              node,
              message: `${node.callee.name} must have options object as second argument`,
            });
            return;
          }

          const authProp = options.properties.find(
            (p) => p.key.name === 'auth'
          );

          if (!authProp) {
            context.report({
              node,
              message: `${node.callee.name} must include { auth: true } or { auth: false } with justification`,
              fix(fixer) {
                const lastProp = options.properties[options.properties.length - 1];
                return fixer.insertTextAfter(lastProp, ',\n  auth: true');
              },
            });
            return;
          }

          // Verify auth is boolean
          if (
            authProp.value.type === 'Literal' &&
            typeof authProp.value.value !== 'boolean'
          ) {
            context.report({
              node: authProp,
              message: 'auth must be true or false',
            });
          }

          // If auth: false, require comment explaining why
          if (
            authProp.value.value === false &&
            !context.getSourceCode().getCommentsBefore(authProp).length
          ) {
            context.report({
              node: authProp,
              message: 'auth: false requires a comment explaining why public access is needed',
            });
          }
        }
      },
    };
  },
};
```

Add to ESLint config:

```javascript
// tooling/eslint/base.js
import { requireServerActionAuth } from './rules/require-server-action-auth.js';

export default defineConfig({
  // ... other config
  plugins: {
    'custom-security': {
      rules: {
        'require-server-action-auth': requireServerActionAuth,
      },
    },
  },
  rules: {
    'custom-security/require-server-action-auth': 'error',
  },
});
```

---

### Rule 2: Require Zod .max() on String Fields

**Purpose:** Prevent missing input length validation

**File:** `tooling/eslint/rules/require-zod-string-max.js`

```javascript
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require .max() on z.string() in Zod schemas',
      category: 'Security',
    },
  },
  create(context) {
    return {
      MemberExpression(node) {
        // Match z.string()
        if (
          node.object.callee?.object?.name === 'z' &&
          node.object.callee?.property?.name === 'string' &&
          node.property.name !== 'max'
        ) {
          // Check if max() is called anywhere in the chain
          let current = node;
          let foundMax = false;

          while (current) {
            if (
              current.type === 'CallExpression' &&
              current.callee?.property?.name === 'max'
            ) {
              foundMax = true;
              break;
            }
            current = current.parent;
          }

          if (!foundMax && node.property.name !== 'optional') {
            context.report({
              node,
              message: 'z.string() should have .max() to prevent DoS attacks',
            });
          }
        }
      },
    };
  },
};
```

---

### Rule 3: Prevent Magic Numbers

**Purpose:** Force constants for "magic" numbers

**File:** `tooling/eslint/rules/no-magic-numbers.js`

```javascript
const ALLOWED_NUMBERS = new Set([
  0, 1, -1, 2, -2, 100, 1000, 10, 24, 60,
  // Time-related
  1000, 60000, 3600000,
  // Common percentages
  50,
  // Index defaults
  -1,
]);

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow magic numbers without named constants',
      category: 'Maintainability',
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== 'number') return;

        // Allow whitelisted numbers
        if (ALLOWED_NUMBERS.has(node.value)) return;

        // Allow in const definitions (CONSTANT_NAME = value)
        if (
          node.parent.type === 'VariableDeclarator' &&
          node.parent.id.name === node.parent.id.name.toUpperCase()
        ) {
          return;
        }

        // Allow in import/export
        if (
          node.parent.type === 'ImportDefaultSpecifier' ||
          node.parent.type === 'ExportDefaultDeclaration'
        ) {
          return;
        }

        context.report({
          node,
          message: `Magic number ${node.value}. Extract to named constant (e.g., const TIMEOUT_MS = ${node.value})`,
        });
      },
    };
  },
};
```

---

### Rule 4: Enforce Dependency Arrays in useMemo/useCallback

**Purpose:** Catch missing or incorrect dependencies

**File:** `tooling/eslint/rules/strict-hook-dependencies.js`

```javascript
module.exports = {
  meta: {
    type: 'error',
    docs: {
      description: 'Enforce strict dependency arrays in React hooks',
      category: 'Performance',
    },
  },
  create(context) {
    const hookNames = new Set(['useMemo', 'useCallback', 'useEffect', 'useLayoutEffect']);

    return {
      CallExpression(node) {
        if (!hookNames.has(node.callee.name)) return;

        const args = node.arguments;

        // Must have dependencies as second argument
        if (args.length < 2) {
          context.report({
            node,
            message: `${node.callee.name} must have dependency array`,
          });
          return;
        }

        const deps = args[1];

        if (deps.type !== 'ArrayExpression') {
          context.report({
            node: deps,
            message: 'Dependencies must be an array',
          });
          return;
        }

        // Check for dynamic values in dependencies (object/array literals)
        deps.elements.forEach((element, index) => {
          if (element?.type === 'ObjectExpression' ||
              element?.type === 'ArrayExpression' ||
              element?.type === 'FunctionExpression' ||
              element?.type === 'ArrowFunctionExpression') {
            context.report({
              node: element,
              message: `Dependency ${index} is a dynamic value. Extract it outside the hook or move it inside.`,
            });
          }
        });
      },
    };
  },
};
```

---

### Rule 5: Require Comments on Public/Protected Functions

**Purpose:** Encourage documentation of what functions do

**File:** `tooling/eslint/rules/require-function-docs.js`

```javascript
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require JSDoc comments on exported functions',
      category: 'Documentation',
    },
  },
  create(context) {
    return {
      ExportNamedDeclaration(node) {
        if (
          node.declaration?.type === 'FunctionDeclaration' ||
          node.declaration?.type === 'VariableDeclaration'
        ) {
          const comments = context.getSourceCode().getCommentsBefore(node);
          const hasJsDoc = comments.some((c) => c.value.includes('@'));

          // Skip if it's an obvious one-liner or private
          const isTrivial = node.declaration.id?.name?.startsWith('_');

          if (!hasJsDoc && !isTrivial) {
            context.report({
              node,
              message: 'Exported functions should have JSDoc comments',
            });
          }
        }
      },
    };
  },
};
```

---

## 2. TypeScript Compiler Configuration

### Strict Mode Configuration

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    // Core strict checking
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    // Type safety
    "alwaysStrict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,

    // Module resolution
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,

    // Other
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*", "app/**/*"],
  "exclude": ["node_modules", ".next", "dist"]
}
```

---

## 3. Pre-Commit Hooks

### Git Hook: Validate Changes Before Commit

**File:** `.git/hooks/pre-commit` (or use husky)

```bash
#!/bin/bash
# .git/hooks/pre-commit

set -e

echo "Running pre-commit checks..."

# 1. Check for console.log in production code
if git diff --cached --name-only | grep -E '\.(ts|tsx|js|jsx)$' | \
   xargs grep -l 'console\.log' 2>/dev/null; then
  echo "❌ Error: console.log found in staged files"
  echo "Run: git diff --cached | grep console.log"
  exit 1
fi

# 2. Check for TODO/FIXME comments
if git diff --cached --name-only | grep -E '\.(ts|tsx)$' | \
   xargs grep -E '// (TODO|FIXME|HACK|BUG):' 2>/dev/null; then
  echo "⚠️  Warning: TODO/FIXME comments in staged files"
fi

# 3. Check TypeScript
echo "Checking TypeScript..."
pnpm typecheck --noEmit || exit 1

# 4. Run ESLint
echo "Running ESLint..."
pnpm eslint --fix $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')

# 5. Check for hardcoded passwords/secrets
if git diff --cached | grep -E 'password|secret|api_key|token' -i; then
  echo "⚠️  Warning: Possible hardcoded secrets in staged files"
  echo "Make sure these are not real credentials!"
fi

# 6. Check SQL migrations for foreign keys
if git diff --cached --name-only | grep -E '\.sql$'; then
  bash scripts/validate-migrations.sh || exit 1
fi

echo "✅ Pre-commit checks passed!"
```

Setup with Husky (easier):

```bash
npm install husky --save-dev
npx husky install
npx husky add .husky/pre-commit "bash scripts/pre-commit-checks.sh"
```

---

## 4. Test Templates

### Test Template 1: Authorization Checks

**File:** `apps/web/app/home/(user)/_lib/__tests__/authorization.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { updateReport } from '../server/sparlo-reports-server-actions';

describe('Authorization - updateReport', () => {
  const ownerUser = { id: 'owner-user-id' };
  const otherUser = { id: 'other-user-id' };
  let reportId: string;

  beforeEach(async () => {
    // Create test report owned by ownerUser
    const client = getSupabaseServerClient();
    const { data } = await client
      .from('sparlo_reports')
      .insert({
        account_id: ownerUser.id,
        conversation_id: 'test-conv-id',
        title: 'Test Report',
        status: 'complete',
      })
      .select()
      .single();
    reportId = data.id;
  });

  it('allows owner to update their report', async () => {
    const result = await updateReport(
      { id: reportId, title: 'Updated Title' },
      ownerUser
    );
    expect(result.success).toBe(true);
  });

  it('prevents other user from updating report', async () => {
    expect(
      updateReport(
        { id: reportId, title: 'Hacked Title' },
        otherUser
      )
    ).rejects.toThrow('Report not found or you do not have permission');
  });

  it('prevents unauthenticated access', async () => {
    // @ts-expect-error Testing missing auth
    expect(
      updateReport({ id: reportId, title: 'Test' }, null)
    ).rejects.toThrow();
  });
});
```

---

### Test Template 2: Rate Limiting

**File:** `apps/web/app/home/(user)/_lib/__tests__/rate-limiting.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { startReportGeneration } from '../server/sparlo-reports-server-actions';

describe('Rate Limiting', () => {
  const user = { id: 'test-user-id' };
  const validInput = { designChallenge: 'A'.repeat(100) };

  beforeEach(async () => {
    vi.useFakeTimers();
    // Cleanup test data
    // await cleanupReports(user.id);
  });

  it('allows first report within window', async () => {
    const result = await startReportGeneration(validInput, user);
    expect(result.success).toBe(true);
  });

  it('blocks second report within 5 minute window', async () => {
    await startReportGeneration(validInput, user);

    // Try again immediately
    expect(
      startReportGeneration(validInput, user)
    ).rejects.toThrow(/rate.*limit/i);
  });

  it('allows report after window expires', async () => {
    await startReportGeneration(validInput, user);

    // Advance time past window
    vi.advanceTimersByTime(6 * 60 * 1000);

    const result = await startReportGeneration(validInput, user);
    expect(result.success).toBe(true);
  });

  it('enforces daily limit', async () => {
    // Create 10 reports
    for (let i = 0; i < 10; i++) {
      await startReportGeneration(validInput, user);
      vi.advanceTimersByTime(6 * 60 * 1000);
    }

    // 11th should fail
    expect(
      startReportGeneration(validInput, user)
    ).rejects.toThrow(/daily.*limit/i);
  });

  it('error message specifies limit', async () => {
    await startReportGeneration(validInput, user);

    try {
      await startReportGeneration(validInput, user);
    } catch (error) {
      expect(error.message).toContain('5 minutes');
    }
  });
});
```

---

### Test Template 3: Input Validation

**File:** `apps/web/app/home/(user)/_lib/__tests__/validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  StartReportSchema,
  UpdateReportSchema,
} from '../server/sparlo-reports-server-actions';

describe('Input Validation', () => {
  describe('StartReportSchema', () => {
    it('accepts valid design challenge', () => {
      const result = StartReportSchema.safeParse({
        designChallenge: 'A'.repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it('rejects too-short design challenge', () => {
      const result = StartReportSchema.safeParse({
        designChallenge: 'Too short',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.designChallenge).toContain(
        'at least 50 characters'
      );
    });

    it('rejects too-long design challenge', () => {
      const result = StartReportSchema.safeParse({
        designChallenge: 'A'.repeat(10001),
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.designChallenge).toContain(
        'under 10,000 characters'
      );
    });

    it('rejects empty design challenge', () => {
      const result = StartReportSchema.safeParse({
        designChallenge: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateReportSchema', () => {
    it('rejects invalid UUID', () => {
      const result = UpdateReportSchema.safeParse({
        id: 'not-a-uuid',
        title: 'New Title',
      });
      expect(result.success).toBe(false);
    });

    it('limits chat history size', () => {
      const tooManyMessages = Array(101).fill({
        id: 'msg-1',
        role: 'user',
        content: 'test',
        timestamp: new Date().toISOString(),
      });

      const result = UpdateReportSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        chatHistory: tooManyMessages,
      });
      expect(result.success).toBe(false);
    });

    it('limits chat message content length', () => {
      const result = UpdateReportSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        chatHistory: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'A'.repeat(10001),
            timestamp: new Date().toISOString(),
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });
});
```

---

### Test Template 4: Database Constraints

**File:** `apps/web/supabase/__tests__/constraints.test.sql`

```sql
BEGIN;

-- Test CASCADE delete: User deletion cascades to reports
DO $$
DECLARE
  test_user_id uuid;
  test_report_id uuid;
  count_after_delete int;
BEGIN
  -- Create test user
  INSERT INTO auth.users (id, email)
  VALUES (gen_random_uuid(), 'test@example.com')
  RETURNING id INTO test_user_id;

  -- Create test report
  INSERT INTO sparlo_reports (id, created_by, account_id)
  VALUES (gen_random_uuid(), test_user_id, test_user_id)
  RETURNING id INTO test_report_id;

  -- Verify report exists
  ASSERT EXISTS (
    SELECT 1 FROM sparlo_reports WHERE id = test_report_id
  ), 'Report should exist';

  -- Delete user (should cascade)
  DELETE FROM auth.users WHERE id = test_user_id;

  -- Verify report was deleted
  ASSERT NOT EXISTS (
    SELECT 1 FROM sparlo_reports WHERE id = test_report_id
  ), 'Report should be deleted when user is deleted';

  RAISE NOTICE 'CASCADE delete test passed';
END $$;

-- Test composite index: Query plan uses index
EXPLAIN (FORMAT JSON)
SELECT * FROM sparlo_reports
WHERE account_id = gen_random_uuid()
  AND status = 'complete'
  AND archived = false
ORDER BY created_at DESC;
-- Should show Index Scan, not Seq Scan

-- Test rate limiting query: Efficient count
EXPLAIN (FORMAT JSON)
SELECT COUNT(*) FROM sparlo_reports
WHERE account_id = gen_random_uuid()
  AND created_at >= NOW() - INTERVAL '5 minutes';
-- Should use index, fast execution

COMMIT;
```

---

## 5. CI/CD Integration

### GitHub Actions Workflow

**File:** `.github/workflows/code-quality.yml`

```yaml
name: Code Quality Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches: [main, develop]

jobs:
  security-and-quality:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Run security rules
        run: |
          pnpm eslint \
            --rule 'custom-security/require-server-action-auth: error' \
            'src/**/*.ts' 'app/**/*.ts'

      - name: Run tests
        run: pnpm test

      - name: Validate SQL migrations
        run: bash scripts/validate-migrations.sh

      - name: Check for secrets
        uses: gitleaks/gitleaks-action@v2
        with:
          fail: true

      - name: Database integration tests
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test_db
        run: pnpm --filter web supabase:test

      - name: Build
        run: pnpm build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## 6. Monitoring & Observability

### Add Performance Monitoring

**File:** `packages/monitoring/src/hooks.ts`

```typescript
import { useCallback, useRef } from 'react';

/**
 * Hook to track expensive computations
 * Logs if component takes too long to render
 */
export function useRenderMetrics(componentName: string) {
  const startTimeRef = useRef(performance.now());

  return useCallback(() => {
    const duration = performance.now() - startTimeRef.current;

    // Log slow renders
    if (duration > 100) {
      console.warn(
        `Slow render: ${componentName} took ${duration.toFixed(2)}ms`
      );
    }
  }, [componentName]);
}

/**
 * Hook to track rate limit hits
 */
export function useRateLimitTracking() {
  return useCallback(
    (operation: string, remaining: number, limit: number) => {
      if (remaining === 0) {
        // Trigger monitoring alert
        fetch('/api/monitoring/rate-limit-hit', {
          method: 'POST',
          body: JSON.stringify({
            operation,
            remaining,
            limit,
            timestamp: new Date().toISOString(),
          }),
        }).catch(console.error);
      }
    },
    []
  );
}
```

---

## Implementation Checklist

- [ ] Copy ESLint rules to `tooling/eslint/rules/`
- [ ] Update `tooling/eslint/base.js` to import new rules
- [ ] Configure TypeScript strict mode in `tsconfig.json`
- [ ] Create `.git/hooks/pre-commit` or setup Husky
- [ ] Add test templates to test files
- [ ] Update GitHub Actions workflows
- [ ] Run `pnpm lint:fix` to fix existing violations
- [ ] Run tests to verify setup
- [ ] Document new rules for team
- [ ] Update code review checklists in PR template

