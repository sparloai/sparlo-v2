# Prevention Strategies for Four Critical Problems - Sparlo V2

This document develops comprehensive prevention strategies, best practices, and test cases for four critical issues encountered in the Sparlo V2 project.

---

## Problem 1: ZodError in LLM Schemas

### Issue Summary

**Problem**: LLM output validation fails with `ZodError` when LLM returns variations of expected values.

**Root Causes**:
1. Raw `z.enum()` schemas don't tolerate LLM variations
2. Raw `z.number()` schemas fail when LLM returns stringified numbers
3. No antifragile schema design patterns established
4. Developers unaware of LLM unpredictability

**Example - Before**:
```typescript
// ❌ WRONG - Breaks on LLM variations
export const VerdictSchema = z.enum(['STRONG', 'MODERATE', 'WEAK']);

// Fails when LLM returns: "WEAK - needs improvement", "weak", "MODERATE (partial)"
```

**Example - After**:
```typescript
// ✅ CORRECT - Handles all LLM variations
export const VerdictSchema = flexibleEnum(['STRONG', 'MODERATE', 'WEAK'], 'MODERATE');

// Succeeds for: "WEAK", "weak", "WEAK - needs improvement", "WEAK (reason)"
```

### Prevention Strategy: Antifragile Schema Pattern

#### 1.1 Core Helper Functions

**File**: `apps/web/lib/llm/prompts/schemas-helpers.ts`

```typescript
/**
 * Similar value mappings for common LLM variations
 * Handles all common LLM synonym patterns
 */
const ENUM_SYNONYMS: Record<string, string> = {
  // Severity/assessment variations
  MODERATE: 'SIGNIFICANT',
  MEDIUM: 'SIGNIFICANT',
  MINOR: 'MANAGEABLE',
  MAJOR: 'SEVERE',
  // Status variations
  PARTIAL: 'PARTIALLY_IDENTIFIED',
  PARTIALLY: 'PARTIALLY_IDENTIFIED',
  // Quality variations
  GOOD: 'ADEQUATE',
  POOR: 'WEAK',
  NONE: 'MISSING',
  // Boolean-like
  TRUE: 'YES',
  FALSE: 'NO',
};

/**
 * Creates an antifragile enum schema that gracefully handles LLM variations.
 *
 * Handles:
 * - Strips annotations: "WEAK - reason" → "WEAK"
 * - Normalizes case: "weak" → "WEAK"
 * - Maps synonyms: "MODERATE" → "SIGNIFICANT"
 * - Falls back to default on failure
 *
 * @param values Valid enum values
 * @param defaultValue Fallback value if nothing matches
 */
function flexibleEnum<T extends [string, ...string[]]>(
  values: T,
  defaultValue: T[number],
): z.ZodEffects<z.ZodString, T[number], string> {
  return z.string().transform((val): T[number] => {
    // Step 1: Extract the first word/phrase before any annotation
    const normalized = val
      .replace(/\s*[-:(].*$/, '') // Strip everything after -, :, or (
      .trim()
      .toUpperCase();

    // Step 2: Direct match
    if (values.includes(normalized as T[number])) {
      return normalized as T[number];
    }

    // Step 3: Check synonyms
    const synonym = ENUM_SYNONYMS[normalized];
    if (synonym && values.includes(synonym as T[number])) {
      return synonym as T[number];
    }

    // Step 4: Fuzzy match
    for (const v of values) {
      if (v.startsWith(normalized) || normalized.startsWith(v)) {
        return v;
      }
    }

    // Step 5: Fall back to default
    console.warn(
      `[Schema Fallback] "${val}" → "${defaultValue}" (valid: ${values.join(', ')})`
    );
    return defaultValue;
  });
}

/**
 * Creates an antifragile number schema that coerces strings to numbers.
 *
 * Handles:
 * - Strings: "3" → 3
 * - Floats: "3.5" → 3.5
 * - Fractions: "3/5" → 3 (extracts first number)
 * - Falls back to default on failure
 *
 * @param defaultValue Fallback value if parsing fails
 * @param options Min/max constraints
 */
function flexibleNumber(
  defaultValue: number,
  options?: { min?: number; max?: number },
): z.ZodEffects<z.ZodUnknown, number, unknown> {
  return z.unknown().transform((val): number => {
    // Already a number
    if (typeof val === 'number' && !isNaN(val)) {
      let num = val;
      if (options?.min !== undefined) num = Math.max(num, options.min);
      if (options?.max !== undefined) num = Math.min(num, options.max);
      return num;
    }

    // String - try to parse
    if (typeof val === 'string') {
      const match = val.match(/[\d.]+/);
      if (match) {
        const parsed = parseFloat(match[0]);
        if (!isNaN(parsed)) {
          let num = parsed;
          if (options?.min !== undefined) num = Math.max(num, options.min);
          if (options?.max !== undefined) num = Math.min(num, options.max);
          return num;
        }
      }
    }

    // Fall back to default
    console.warn(`[Schema Fallback] "${val}" → ${defaultValue}`);
    return defaultValue;
  });
}
```

#### 1.2 Schema Usage Pattern

**File**: `apps/web/lib/llm/prompts/*/schemas.ts`

```typescript
import { flexibleEnum, flexibleNumber } from './schemas-helpers';

// ✅ GOOD: All enums use flexibleEnum
export const VerdictSchema = flexibleEnum(
  ['VALIDATED', 'PLAUSIBLE', 'QUESTIONABLE', 'INVALID'],
  'QUESTIONABLE'
);

export const ConfidenceSchema = flexibleEnum(
  ['HIGH', 'MEDIUM', 'LOW'],
  'MEDIUM'
);

export const SeveritySchema = flexibleEnum(
  ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
  'MEDIUM'
);

// ✅ GOOD: All numbers use flexibleNumber
export const ScoreSchema = z.object({
  value: flexibleNumber(5, { min: 1, max: 10 }),
  out_of: flexibleNumber(10),
});

// ✅ GOOD: Use in composite schemas
export const ClaimValidationSchema = z.object({
  claim_id: z.string(),
  verdict: VerdictSchema,
  confidence: ConfidenceSchema,
  confidence_percent: flexibleNumber(50, { min: 0, max: 100 }),
  reasoning: z.string(),
});
```

#### 1.3 Enum Synonyms Strategy

When adding new enums, always consider common LLM variations:

```typescript
// BEFORE: Adding new enum without synonyms
export const TimelineSchema = flexibleEnum(['EARLY', 'ONTIME', 'LATE'], 'ONTIME');
// ❌ Problem: LLM might return "ON_TIME", "ON TIME", "ALIGNED", etc.

// AFTER: Adding to ENUM_SYNONYMS first
const ENUM_SYNONYMS = {
  // ... existing mappings ...
  ON_TIME: 'ONTIME',
  ON_TIME_DELIVERY: 'ONTIME',
  ALIGNED: 'ONTIME',
  ON_SCHEDULE: 'ONTIME',
};

export const TimelineSchema = flexibleEnum(['EARLY', 'ONTIME', 'LATE'], 'ONTIME');
// ✅ Success: Handles all variations
```

### Best Practices for LLM Schemas

#### 1. Always Use Flexible Schemas for LLM Outputs

```typescript
// ❌ NEVER DO THIS
z.object({
  status: z.enum(['active', 'inactive']),
  score: z.number(),
});

// ✅ ALWAYS DO THIS
z.object({
  status: flexibleEnum(['ACTIVE', 'INACTIVE'], 'ACTIVE'),
  score: flexibleNumber(5),
});
```

#### 2. Choose Sensible Defaults

```typescript
// ❌ WRONG: Choosing extreme value as default
confidence: flexibleEnum(['HIGH', 'MEDIUM', 'LOW'], 'HIGH'),
// Problem: If parsing fails, assumes high confidence (dangerous!)

// ✅ CORRECT: Choosing middle-ground value
confidence: flexibleEnum(['HIGH', 'MEDIUM', 'LOW'], 'MEDIUM'),
// Safer: Defaults to neutral assessment
```

#### 3. Add Enum Variations Before Deployment

```typescript
// When you notice LLM returns "STRONG - well-founded"
// Don't wait for errors in production

// Immediately add to ENUM_SYNONYMS:
const ENUM_SYNONYMS = {
  WELL_FOUNDED: 'STRONG',
  SOLID: 'STRONG',
  ROBUST: 'STRONG',
};
```

### Pre-Commit Checks for LLM Schemas

**Add to `.husky/pre-commit` or CI/CD pipeline**:

```bash
#!/bin/bash
# Prevent raw z.enum() and z.number() in LLM schemas

echo "Checking LLM schemas for antifragile patterns..."

# Count raw z.enum usage
ENUM_COUNT=$(grep -r "z\.enum" apps/web/lib/llm/prompts/*/schemas.ts 2>/dev/null | grep -v "flexibleEnum" | wc -l)

if [ "$ENUM_COUNT" -gt 0 ]; then
  echo "ERROR: Found $ENUM_COUNT raw z.enum() calls in LLM schemas"
  echo "Run: grep -n 'z\.enum' apps/web/lib/llm/prompts/*/schemas.ts"
  echo "Convert all to flexibleEnum() before committing"
  exit 1
fi

# Count raw z.number usage (outside flexibleNumber)
NUMBER_COUNT=$(grep -r "z\.number()" apps/web/lib/llm/prompts/*/schemas.ts 2>/dev/null | grep -v "flexibleNumber" | wc -l)

if [ "$NUMBER_COUNT" -gt 0 ]; then
  echo "ERROR: Found $NUMBER_COUNT raw z.number() calls in LLM schemas"
  echo "Run: grep -n 'z\.number()' apps/web/lib/llm/prompts/*/schemas.ts"
  echo "Convert all to flexibleNumber() before committing"
  exit 1
fi

echo "✓ LLM schema validation passed"
```

### Test Cases for LLM Schemas

**File**: `apps/web/lib/llm/prompts/__tests__/schemas.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { VerdictSchema, ConfidenceSchema, ScoreSchema } from '../schemas';

describe('Antifragile LLM Schemas', () => {
  describe('flexibleEnum - VerdictSchema', () => {
    it('should handle direct matches', () => {
      expect(VerdictSchema.parse('VALIDATED')).toBe('VALIDATED');
      expect(VerdictSchema.parse('INVALID')).toBe('INVALID');
    });

    it('should handle case variations', () => {
      expect(VerdictSchema.parse('validated')).toBe('VALIDATED');
      expect(VerdictSchema.parse('Validated')).toBe('VALIDATED');
      expect(VerdictSchema.parse('VALIDATED')).toBe('VALIDATED');
    });

    it('should strip annotations after hyphens', () => {
      expect(VerdictSchema.parse('WEAK - needs improvement')).toBe('WEAK');
      expect(VerdictSchema.parse('VALIDATED - with caveats')).toBe('VALIDATED');
    });

    it('should strip parenthetical annotations', () => {
      expect(VerdictSchema.parse('VALIDATED (partial)')).toBe('VALIDATED');
      expect(VerdictSchema.parse('QUESTIONABLE (high risk)')).toBe('QUESTIONABLE');
    });

    it('should strip colon annotations', () => {
      expect(VerdictSchema.parse('PLAUSIBLE: possible but unproven')).toBe('PLAUSIBLE');
    });

    it('should fall back to default for unrecognized values', () => {
      expect(VerdictSchema.parse('UNKNOWN_VALUE')).toBe('QUESTIONABLE');
      expect(VerdictSchema.parse('garbage text')).toBe('QUESTIONABLE');
    });

    it('should handle fuzzy matches', () => {
      expect(VerdictSchema.parse('VALIDATE')).toBe('VALIDATED'); // partial match
    });
  });

  describe('flexibleNumber - ScoreSchema', () => {
    it('should handle direct numbers', () => {
      expect(ScoreSchema.parse({ value: 7 })).toEqual({ value: 7 });
    });

    it('should coerce string numbers', () => {
      expect(ScoreSchema.parse({ value: '7' })).toEqual({ value: 7 });
      expect(ScoreSchema.parse({ value: '7.5' })).toEqual({ value: 7.5 });
    });

    it('should extract numbers from fractions', () => {
      expect(ScoreSchema.parse({ value: '7/10' })).toEqual({ value: 7 });
      expect(ScoreSchema.parse({ value: '3 out of 5' })).toEqual({ value: 3 });
    });

    it('should enforce min/max constraints', () => {
      expect(ScoreSchema.parse({ value: 0 })).toEqual({ value: 1 }); // min=1
      expect(ScoreSchema.parse({ value: 15 })).toEqual({ value: 10 }); // max=10
    });

    it('should fall back to default for unparseable values', () => {
      expect(ScoreSchema.parse({ value: 'no numbers here' })).toEqual({ value: 5 });
      expect(ScoreSchema.parse({ value: null })).toEqual({ value: 5 });
    });

    it('should handle LLM verbosity', () => {
      expect(ScoreSchema.parse({ value: 'The score is approximately 7' })).toEqual({ value: 7 });
      expect(ScoreSchema.parse({ value: '7, I would say' })).toEqual({ value: 7 });
    });
  });

  describe('Real-world LLM output variations', () => {
    it('should handle DD Schema verdict variations', () => {
      const testCases = [
        'COMPELLING',
        'compelling',
        'COMPELLING - very strong case',
        'COMPELLING (with caveats)',
        'Compelling',
        'MIXED - leaning compelling',
      ];

      testCases.forEach((testCase) => {
        expect(() => VerdictSchema.parse(testCase)).not.toThrow();
      });
    });

    it('should handle confidence score variations', () => {
      const testCases = [
        '8',
        '8.5',
        '8/10',
        'Confidence: 8',
        'about 8',
      ];

      testCases.forEach((testCase) => {
        expect(() => ScoreSchema.parse({ value: testCase })).not.toThrow();
      });
    });
  });
});
```

### Code Review Checklist for LLM Schemas

When reviewing code that modifies LLM schemas:

```
LLM Schema Review Checklist:

1. Enum Validation
   [ ] All enums use flexibleEnum(), not z.enum()
   [ ] Each enum has a sensible default (middle value)
   [ ] Common LLM variations in ENUM_SYNONYMS
   [ ] Case-insensitive handling verified

2. Number Validation
   [ ] All numbers use flexibleNumber(), not z.number()
   [ ] Min/max constraints specified where needed
   [ ] String coercion tested (e.g., "3" → 3)
   [ ] Default value is reasonable

3. Testing
   [ ] Test with intentionally malformed inputs
   [ ] Test case variations (uppercase, lowercase, mixed)
   [ ] Test with annotations ("WEAK - reason")
   [ ] Test with parenthetical annotations ("SUCCESS (partial)")
   [ ] Test fallback behavior

4. Documentation
   [ ] Comments explain why flexibleEnum/flexibleNumber used
   [ ] Default value justification documented
   [ ] Example valid/invalid inputs shown
   [ ] Linked to this prevention guide

5. Pre-commit Verification
   [ ] Run: grep -c "z\.enum" apps/web/lib/llm/prompts/*/schemas.ts
   [ ] Result: 0 (all use flexibleEnum)
   [ ] Run: grep -c "z\.number()" apps/web/lib/llm/prompts/*/schemas.ts
   [ ] Result: 0 (all use flexibleNumber)

❌ RED FLAGS:
- Raw z.enum() found in LLM schema files
- Raw z.number() found in LLM schema files
- No fallback/default value
- Extreme values chosen as defaults (HIGH, CRITICAL, etc)
- No test cases for LLM variations
```

---

## Problem 2: Build Failure - Missing Modules

### Issue Summary

**Problem**: Build fails with "Module not found" errors because related files weren't committed together.

**Root Causes**:
1. Developers commit only modified files, missing newly created files
2. No pre-commit verification that imports resolve
3. No git status check before pushing
4. Multiple developers working on related features in parallel

**Example - Before**:
```bash
# Developer A commits modified file:
git add apps/web/lib/llm/prompts/dd/schemas.ts
git commit -m "Update DD schemas"
# ❌ Missing: apps/web/lib/llm/prompts/schemas-helpers.ts (newly created)

# Build fails: Cannot find module './schemas-helpers'
```

**Example - After**:
```bash
# Developer checks status first
git status

# Shows untracked or modified files
# commits related files together
git add apps/web/lib/llm/prompts/
git commit -m "Refactor: Extract antifragile schema helpers"
# ✅ Success: All related files committed
```

### Prevention Strategy: Pre-Commit Module Verification

#### 2.1 Pre-Commit Hook - Module Import Verification

**File**: `.husky/pre-commit`

```bash
#!/bin/bash
# Verify all imports in staged files can be resolved

echo "Running module import verification..."

# Get all staged TypeScript files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# For each staged file, check if it imports untracked files
ERRORS=0

for FILE in $STAGED_FILES; do
  # Extract all relative imports
  IMPORTS=$(grep -o "from ['\"]\.\.\/.*['\"]" "$FILE" | sed "s/from ['\"]//g" | sed "s/['\"]//g" || true)

  for IMPORT in $IMPORTS; do
    # Convert relative import to absolute path
    IMPORT_PATH=$(cd "$(dirname "$FILE")" && realpath -m "$IMPORT" 2>/dev/null || echo "")

    # Check if import exists in tracked files
    if [ ! -z "$IMPORT_PATH" ] && [ ! -f "$IMPORT_PATH" ]; then
      echo "ERROR: $FILE imports missing file: $IMPORT"
      ERRORS=$((ERRORS + 1))
    fi
  done
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "FAILED: $ERRORS import errors found"
  echo "Fix: Ensure all imported files are tracked with git add"
  echo "Use: git status to see untracked files"
  exit 1
fi

echo "✓ Module import verification passed"
exit 0
```

#### 2.2 Git Status Check Before Push

**File**: `.husky/pre-push`

```bash
#!/bin/bash
# Ensure working directory is clean before pushing

echo "Checking git status..."

UNSTAGED=$(git diff --name-only)
UNTRACKED=$(git ls-files --others --exclude-standard)

if [ ! -z "$UNSTAGED" ]; then
  echo "ERROR: Unstaged changes detected:"
  echo "$UNSTAGED"
  echo ""
  echo "Fix: Run 'git add .' and 'git commit' before pushing"
  exit 1
fi

if [ ! -z "$UNTRACKED" ]; then
  echo "WARNING: Untracked files detected:"
  echo "$UNTRACKED"
  echo ""
  echo "If these are production files, add them with 'git add'"
  echo "If these are temporary files, add to .gitignore"
fi

echo "✓ Git status check passed"
exit 0
```

#### 2.3 Build Verification Before Commit

**File**: `package.json` scripts

```json
{
  "scripts": {
    "pre-commit": "npm run type-check && npm run lint",
    "test:affected": "turbo test --affected",
    "build:affected": "turbo build --affected"
  }
}
```

**Using in pre-commit hook**:

```bash
#!/bin/bash
# Verify build succeeds before committing

echo "Running TypeScript type check..."
pnpm typecheck || {
  echo "ERROR: TypeScript type checking failed"
  echo "Fix type errors before committing"
  exit 1
}

echo "Running linter..."
pnpm lint || {
  echo "ERROR: Linting failed"
  echo "Run 'pnpm lint:fix' to auto-fix"
  exit 1
}

echo "✓ Pre-commit verification passed"
exit 0
```

### Best Practices for Avoiding Build Failures

#### 1. Use `git status` Before Committing

```bash
# BEFORE committing
git status

# Shows:
# On branch feature/schema-helpers
#
# Changes not staged for commit:
#   modified:   apps/web/lib/llm/prompts/dd/schemas.ts
#
# Untracked files:
#   apps/web/lib/llm/prompts/schemas-helpers.ts  ← MISSING!

# FIX: Add all related files
git add apps/web/lib/llm/prompts/
git commit -m "feat: Add antifragile schema helpers"
```

#### 2. Commit Related Files Together

```bash
# ❌ WRONG: Scattered commits
git add apps/web/lib/llm/prompts/dd/schemas.ts
git commit -m "Update DD schemas"
# Later...
git add apps/web/lib/llm/prompts/schemas-helpers.ts
git commit -m "Add helpers"

# ✅ CORRECT: Related files together
git add apps/web/lib/llm/prompts/
git commit -m "refactor: Extract schema helpers"
```

#### 3. Run Build Before Pushing

```bash
# Verify build works locally
pnpm build

# OR for faster feedback on affected packages
pnpm build:affected

# Only push if successful
git push
```

#### 4. Watch for Imports in Diffs

```bash
# Review what you're committing
git diff --cached

# Look for:
# - New 'import' statements
# - New 'export' statements
# - References to new files

# If you see new imports but don't see the new files being added,
# Run 'git status' to find missing files
```

### Test Cases for Build Integrity

**File**: `scripts/verify-build.sh`

```bash
#!/bin/bash
# Verify build integrity - can be run locally or in CI

set -e

echo "Verifying build integrity..."

# 1. Check all imports can be resolved
echo "Step 1: Checking TypeScript imports..."
pnpm typecheck || {
  echo "FAIL: TypeScript errors detected"
  exit 1
}

# 2. Check for unused dependencies
echo "Step 2: Checking for unused dependencies..."
pnpm syncpack:list || {
  echo "WARN: Dependency mismatches found (non-critical)"
}

# 3. Try building affected packages
echo "Step 3: Building affected packages..."
pnpm build:affected || {
  echo "FAIL: Build failed"
  exit 1
}

# 4. Verify exports
echo "Step 4: Verifying module exports..."
for file in apps/web/lib/llm/prompts/*/schemas.ts; do
  echo "  Checking $file..."
  grep -q "export" "$file" || {
    echo "WARN: No exports found in $file"
  }
done

echo "✓ Build integrity verified"
exit 0
```

### Code Review Checklist for Build Issues

```
Build Integrity Review Checklist:

1. File Tracking
   [ ] Run 'git status' output shown in description
   [ ] All modified files are listed in commit
   [ ] No 'Untracked files' related to changes
   [ ] .gitignore properly configured

2. Import Verification
   [ ] All 'import' statements reference tracked files
   [ ] All 'export' statements from committed files
   [ ] No relative imports to non-existent files
   [ ] Path aliases (~/,@/) correctly configured

3. Related Files
   [ ] Files that depend on each other committed together
   [ ] No circular dependencies introduced
   [ ] Package.json updated if new dependencies added
   [ ] tsconfig.json updated if paths changed

4. Build Testing
   [ ] Local build verified: pnpm build
   [ ] No errors in TypeScript: pnpm typecheck
   [ ] No lint errors: pnpm lint
   [ ] Affected tests pass: pnpm test:affected

5. Documentation
   [ ] Commit message explains what files changed and why
   [ ] Files are logically grouped (feature-based)
   [ ] Related changes have cross-references

❌ RED FLAGS:
- Untracked files in git status but not mentioned in PR
- New imports without corresponding new files
- Build/typecheck errors in affected packages
- Files in different unrelated features committed together
```

---

## Problem 3: middleware.ts vs proxy.ts Conflict (Next.js 16)

### Issue Summary

**Problem**: Next.js 16 project includes both `middleware.ts` and `proxy.ts`, causing configuration conflicts.

**Root Cause**: Upgrade from Next.js 14/15 to Next.js 16 changed the middleware architecture, but old `middleware.ts` file wasn't removed.

**Next.js Timeline**:
- **Next.js 14 and earlier**: Uses `middleware.ts` file in app root
- **Next.js 15+**: Introduced `proxy.ts` alternative
- **Next.js 16**: `proxy.ts` is the recommended pattern, `middleware.ts` is deprecated

**Current Situation in Sparlo V2**:
- Location: `/Users/alijangbar/Desktop/sparlo-v2/apps/web/`
- **Existing file**: `proxy.ts` (correct for Next.js 16)
- **Status**: No middleware.ts found (good!)

### Prevention Strategy: Next.js Version-Aware Architecture

#### 3.1 Detection Script - Verify Correct Middleware Pattern

**File**: `scripts/verify-middleware-pattern.sh`

```bash
#!/bin/bash
# Verify middleware pattern matches Next.js version

echo "Verifying middleware pattern..."

# Get Next.js version
NEXT_VERSION=$(npm ls next --depth=0 2>/dev/null | grep next | sed 's/.*next@//g' | head -1)
MAJOR_VERSION=$(echo "$NEXT_VERSION" | cut -d. -f1)

echo "Detected Next.js version: $NEXT_VERSION (major: $MAJOR_VERSION)"

# Define correct patterns by version
if [ "$MAJOR_VERSION" -lt 15 ]; then
  EXPECTED_FILE="middleware.ts"
  FORBIDDEN_FILE="proxy.ts"
elif [ "$MAJOR_VERSION" -ge 16 ]; then
  EXPECTED_FILE="proxy.ts"
  FORBIDDEN_FILE="middleware.ts"
else
  # Next.js 15: either is acceptable, but proxy.ts is preferred
  echo "Next.js 15 detected: Both middleware.ts and proxy.ts are acceptable"
  echo "Recommendation: Use proxy.ts (preferred for 15+)"
  EXPECTED_FILE="proxy.ts"
  FORBIDDEN_FILE="middleware.ts"
fi

echo "Expected: $EXPECTED_FILE"
echo "Forbidden: $FORBIDDEN_FILE"

# Check for correct file
if [ ! -f "apps/web/$EXPECTED_FILE" ]; then
  echo "ERROR: $EXPECTED_FILE not found in apps/web/"
  echo "Upgrade steps incomplete. See: CLAUDE.md - middleware.ts/proxy.ts section"
  exit 1
fi

# Check for obsolete file
if [ -f "apps/web/$FORBIDDEN_FILE" ]; then
  echo "ERROR: $FORBIDDEN_FILE found in apps/web/ (should be removed for Next.js $MAJOR_VERSION)"
  echo "Fix: rm apps/web/$FORBIDDEN_FILE"
  exit 1
fi

echo "✓ Middleware pattern matches Next.js version"
exit 0
```

#### 3.2 Pre-Upgrade Checklist

When upgrading Next.js to version 16:

```bash
# Step 1: Check current version
npm ls next --depth=0

# Step 2: Verify current middleware file
ls -la apps/web/middleware.ts apps/web/proxy.ts 2>&1

# Step 3: Read current middleware.ts implementation
cat apps/web/middleware.ts

# Step 4: Create proxy.ts with same logic
# (See: /Users/alijangbar/Desktop/sparlo-v2/apps/web/proxy.ts for reference)

# Step 5: Update package.json version
npm install next@16.0.0

# Step 6: Test locally
npm run dev

# Step 7: Remove old file
rm apps/web/middleware.ts

# Step 8: Verify setup
./scripts/verify-middleware-pattern.sh
```

#### 3.3 Documentation Update - CLAUDE.md Enhancement

**File to Update**: `/Users/alijangbar/Desktop/sparlo-v2/CLAUDE.md`

**Add Section**:

```markdown
## Next.js Version-Specific Architecture

### Middleware Pattern by Version

#### Next.js 16+ (Current)
- **Use**: `proxy.ts` in app root (`apps/web/proxy.ts`)
- **Pattern**: Export async `proxy()` function
- **Remove**: Delete `middleware.ts` if upgrading from older versions

**Correct implementation** (`proxy.ts`):
```typescript
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  // Middleware logic here
  return NextResponse.next();
}
```

#### Next.js 15
- **Acceptable**: Both `middleware.ts` and `proxy.ts`
- **Recommended**: Migrate to `proxy.ts` for forward compatibility

#### Next.js 14 and Earlier
- **Use**: `middleware.ts` in app root
- **Pattern**: `export const middleware = (request: NextRequest) => { ... }`

### Upgrading to Next.js 16

**If you have `middleware.ts`**:

1. Copy all logic from `middleware.ts`
2. Create `proxy.ts` with same logic in new format:
   ```typescript
   export async function proxy(request: NextRequest) {
     // Your logic here
     return NextResponse.next();
   }
   ```
3. Test locally with `npm run dev`
4. Delete `middleware.ts`: `rm apps/web/middleware.ts`
5. Verify with: `./scripts/verify-middleware-pattern.sh`

**If you already have `proxy.ts`** (like Sparlo V2):
- No changes needed
- `middleware.ts` should not exist

### Red Flags During Upgrades
- Both `middleware.ts` and `proxy.ts` exist (remove `middleware.ts`)
- Unexpected 404 errors on protected routes (check auth logic in proxy.ts)
- CSRF errors on form submissions (verify CSRF middleware in proxy.ts)
```

### Best Practices for Version-Specific Code

#### 1. Document Version Requirements

```typescript
// apps/web/proxy.ts
/**
 * Next.js 16+ Proxy Configuration
 *
 * This file handles middleware for Next.js 16+
 * For Next.js 15 and earlier, use middleware.ts instead
 *
 * Migration from middleware.ts:
 * - Convert function signature to: export async function proxy(request: NextRequest)
 * - Return NextResponse instead of the request
 *
 * @see CLAUDE.md - Next.js Version-Specific Architecture
 */

import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // Implementation
}
```

#### 2. Use Feature Flags for Version-Specific Logic

```typescript
// lib/next-version.ts
export const NEXT_VERSION = {
  MAJOR: parseInt(process.env.npm_package_dependencies_next?.split('.')[0] || '16'),
  IS_V16_PLUS: true, // Update when upgrading
};

export function useMiddlewarePattern() {
  return NEXT_VERSION.IS_V16_PLUS ? 'proxy.ts' : 'middleware.ts';
}
```

#### 3. Pre-Commit Verification

```bash
#!/bin/bash
# In .husky/pre-commit

# Verify no middleware.ts + proxy.ts coexistence
if [ -f "apps/web/middleware.ts" ] && [ -f "apps/web/proxy.ts" ]; then
  echo "ERROR: Both middleware.ts and proxy.ts found"
  echo "Remove middleware.ts when using Next.js 16+"
  exit 1
fi
```

### Test Cases for Middleware Compatibility

**File**: `apps/web/__tests__/middleware-pattern.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Middleware Pattern - Next.js Compatibility', () => {
  it('should have proxy.ts for Next.js 16+', () => {
    const proxyPath = path.join(process.cwd(), 'apps/web/proxy.ts');
    expect(fs.existsSync(proxyPath)).toBe(true);
  });

  it('should NOT have middleware.ts (deprecated in Next.js 16)', () => {
    const middlewarePath = path.join(process.cwd(), 'apps/web/middleware.ts');
    expect(fs.existsSync(middlewarePath)).toBe(false);
  });

  it('should export async proxy function from proxy.ts', async () => {
    // This would require dynamic import of the built proxy.ts
    // Typically verified by checking file contents
    const proxyContent = fs.readFileSync(
      path.join(process.cwd(), 'apps/web/proxy.ts'),
      'utf-8'
    );

    expect(proxyContent).toContain('export async function proxy');
    expect(proxyContent).toContain('NextRequest');
    expect(proxyContent).toContain('NextResponse');
  });

  it('should have auth checks in proxy.ts', () => {
    const proxyContent = fs.readFileSync(
      path.join(process.cwd(), 'apps/web/proxy.ts'),
      'utf-8'
    );

    // Critical: Auth checks must be in middleware/proxy
    expect(proxyContent).toContain('createMiddlewareClient');
    expect(proxyContent).toContain('getUser');
  });

  it('should have CSRF protection in proxy.ts', () => {
    const proxyContent = fs.readFileSync(
      path.join(process.cwd(), 'apps/web/proxy.ts'),
      'utf-8'
    );

    expect(proxyContent).toContain('createCsrfProtect');
    expect(proxyContent).toContain('CsrfError');
  });
});
```

### Code Review Checklist for Middleware Changes

```
Middleware Pattern Review Checklist:

1. Version Verification
   [ ] Next.js version identified in package.json
   [ ] Correct pattern chosen (proxy.ts for 16+)
   [ ] No version mismatch between files

2. File Structure
   [ ] proxy.ts exists at apps/web/proxy.ts
   [ ] middleware.ts does NOT exist (for Next.js 16+)
   [ ] File exports async proxy(request: NextRequest) function
   [ ] Correct import statements for Next.js 16+

3. Functionality
   [ ] Auth checks preserved in proxy.ts
   [ ] CSRF protection implemented
   [ ] Admin route protection in place
   [ ] MFA verification logic included

4. Testing
   [ ] Local dev server starts: npm run dev
   [ ] Auth routes work (redirect to signin)
   [ ] Protected routes accessible when logged in
   [ ] Middleware pattern test passes

5. Documentation
   [ ] CLAUDE.md updated with version-specific info
   [ ] Code comments explain Next.js 16 pattern
   [ ] Migration steps documented if upgrading

❌ RED FLAGS:
- Both middleware.ts and proxy.ts exist
- proxy.ts doesn't export async function
- Missing auth/CSRF checks
- Old Next.js 14 middleware patterns in proxy.ts
- Next.js version not matching implementation
```

---

## Problem 4: @hookform/resolvers Version Mismatch

### Issue Summary

**Problem**: `@hookform/resolvers` version mismatch causes peer dependency warnings and potential runtime errors.

**Root Cause**: Package versions aren't centrally managed, allowing versions to drift from peer dependencies.

**Example - Before**:
```bash
npm install
# Warning: @hookform/resolvers@3.10.0 requires react-hook-form@7.x but found 7.68.0

# At runtime:
# TypeError: Cannot read property 'Zod' of undefined
# (caused by incompatible versions)
```

**Example - After**:
```bash
# Using pnpm catalog for centralized version management
pnpm install
# ✓ All versions aligned
```

**Current Status in Sparlo V2**:
- **Catalog entry**: `@hookform/resolvers: 3.10.0` in `pnpm-workspace.yaml`
- **Status**: Properly centralized

### Prevention Strategy: pnpm Catalog Pattern

#### 4.1 Understanding pnpm Catalog

**File**: `pnpm-workspace.yaml`

```yaml
# This centralizes version management for all workspaces
catalog:
  '@hookform/resolvers': 3.10.0
  '@next/bundle-analyzer': 16.0.10
  '@next/eslint-plugin-next': 16.0.10
  '@supabase/supabase-js': 2.87.1
  '@tailwindcss/postcss': 4.1.17
  react: 19.2.3
  react-dom: 19.2.3
  zod: 4.1.13
  # ... more entries
```

Benefits:
- **Single source of truth**: All versions in one place
- **Automatic peer dependency resolution**: Versions automatically compatible
- **Consistent upgrades**: All dependents update together
- **Prevents drift**: Can't accidentally use different versions

#### 4.2 Using Catalog in package.json

**File**: `apps/web/package.json` or any workspace package

```json
{
  "dependencies": {
    "@hookform/resolvers": "catalog:",
    "react-hook-form": "catalog:",
    "zod": "catalog:"
  }
}
```

**What this means**:
- `"catalog:"` refers to the version in `pnpm-workspace.yaml`
- All packages get the same version automatically
- No manual version management needed per package
- If `pnpm-workspace.yaml` says `3.10.0`, all packages use `3.10.0`

#### 4.3 Adding New Dependencies to Catalog

When adding new packages:

```bash
# Step 1: Add to pnpm-workspace.yaml catalog
# Edit: pnpm-workspace.yaml

catalog:
  '@hookform/resolvers': 3.10.0
  '@new/package': 1.2.3  # ← Add here

# Step 2: Use in any package
# Edit: apps/web/package.json

{
  "dependencies": {
    "@new/package": "catalog:"
  }
}

# Step 3: Install
pnpm install

# Step 4: Verify no warnings
pnpm install --report-audit
```

#### 4.4 Best Practices for Version Management

**Pattern 1: Checking for Version Mismatches**

```bash
# List any mismatched versions
pnpm syncpack:list

# Fix automatically
pnpm syncpack:fix
```

**Pattern 2: When Upgrading Shared Packages**

```bash
# ❌ WRONG: Upgrade only in one package
npm install @hookform/resolvers@3.11.0  # in apps/web only
# ❌ Problem: Other packages still on 3.10.0

# ✅ CORRECT: Update in pnpm-workspace.yaml
# Edit: pnpm-workspace.yaml
catalog:
  '@hookform/resolvers': 3.11.0  # ← Update once

pnpm install

# All packages automatically get 3.11.0
```

**Pattern 3: Peer Dependency Warnings**

```bash
# When you see:
# warning: @hookform/resolvers@3.10.0 requires react-hook-form@^7.0.0

# Solution 1: Check if react-hook-form is in catalog
grep "react-hook-form" pnpm-workspace.yaml
# ✓ Found: react-hook-form: 7.68.0

# Solution 2: If not, add it
# Edit: pnpm-workspace.yaml
catalog:
  react-hook-form: 7.68.0

pnpm install
# ✓ Warning resolved
```

### Pre-Commit Checks for Dependency Versions

**File**: `.husky/pre-commit`

```bash
#!/bin/bash
# Verify no package version mismatches before committing

echo "Checking package version consistency..."

# Check for version mismatches
MISMATCHES=$(pnpm syncpack:list 2>&1 | grep -c "mismatch" || true)

if [ "$MISMATCHES" -gt 0 ]; then
  echo "ERROR: Found version mismatches"
  echo "Run: pnpm syncpack:fix"
  exit 1
fi

# Check for peer dependency warnings
WARNINGS=$(pnpm install --dry-run 2>&1 | grep -i "peer.*warn" | wc -l)

if [ "$WARNINGS" -gt 0 ]; then
  echo "WARNING: Peer dependency issues detected"
  echo "Run: pnpm install and check output"
  echo "Consider adding to pnpm-workspace.yaml catalog"
fi

echo "✓ Dependency version check passed"
exit 0
```

### Test Cases for Dependency Versions

**File**: `scripts/verify-dependencies.sh`

```bash
#!/bin/bash
# Verify all dependencies are properly managed

set -e

echo "Verifying dependency management..."

# 1. Check no mismatches in lockfile
echo "Step 1: Checking for version mismatches..."
pnpm syncpack:list || {
  echo "FAIL: Version mismatches detected"
  exit 1
}

# 2. Verify all packages can be imported
echo "Step 2: Verifying package imports..."
pnpm build || {
  echo "FAIL: Build failed (import errors)"
  exit 1
}

# 3. Check no duplicate versions of same package
echo "Step 3: Checking for duplicate versions..."
for PACKAGE in "@hookform/resolvers" "react-hook-form" "zod"; do
  COUNT=$(grep -o "\"$PACKAGE\":" pnpm-lock.yaml | wc -l)
  echo "  $PACKAGE: $COUNT version(s)"
  if [ "$COUNT" -gt 1 ]; then
    echo "  WARNING: Multiple versions found"
  fi
done

echo "✓ Dependency verification passed"
exit 0
```

**File**: `apps/web/__tests__/dependencies.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

describe('Dependency Version Management', () => {
  const workspaceFile = join(
    process.cwd(),
    'pnpm-workspace.yaml'
  );

  const workspace = YAML.parse(
    readFileSync(workspaceFile, 'utf-8')
  );

  it('should have @hookform/resolvers in catalog', () => {
    expect(workspace.catalog).toHaveProperty('@hookform/resolvers');
    expect(workspace.catalog['@hookform/resolvers']).toBe('3.10.0');
  });

  it('should have react-hook-form in catalog', () => {
    expect(workspace.catalog).toHaveProperty('react-hook-form');
  });

  it('should have zod in catalog (peer dep of resolvers)', () => {
    expect(workspace.catalog).toHaveProperty('zod');
  });

  it('should have all critical form dependencies in catalog', () => {
    const critical = [
      '@hookform/resolvers',
      'react-hook-form',
      'zod',
      'react',
      'react-dom',
    ];

    critical.forEach((pkg) => {
      expect(workspace.catalog).toHaveProperty(pkg);
      expect(workspace.catalog[pkg]).toBeTruthy();
    });
  });

  it('versions should be compatible', () => {
    const hookformVersion = workspace.catalog['@hookform/resolvers'];
    const reactHookFormVersion = workspace.catalog['react-hook-form'];

    // @hookform/resolvers@3.10.0 requires react-hook-form@^7.0.0
    const major = parseInt(reactHookFormVersion.split('.')[0]);
    expect(major).toBeGreaterThanOrEqual(7);
  });
});
```

### Code Review Checklist for Dependency Versions

```
Dependency Version Review Checklist:

1. pnpm-workspace.yaml Catalog
   [ ] All shared dependencies listed in catalog:
       - @hookform/resolvers
       - react-hook-form
       - zod
       - react
       - react-dom
   [ ] Versions follow semantic versioning
   [ ] No hard-coded versions in individual package.json files

2. Using Catalog Correctly
   [ ] All package.json use "catalog:" for shared deps
   [ ] No duplicate entries in different catalogs
   [ ] Peer dependencies are in catalog
   [ ] Optional peer deps considered

3. Version Compatibility
   [ ] Run: pnpm syncpack:list (no mismatches)
   [ ] Run: pnpm install --dry-run (no peer warnings)
   [ ] Major version bumps don't break interfaces
   [ ] Minor updates are backward compatible

4. Testing Dependencies
   [ ] Build succeeds: pnpm build
   [ ] Imports resolve correctly
   [ ] No "Cannot find module" errors
   [ ] Runtime tests pass

5. Documentation
   [ ] README explains catalog usage
   [ ] How to upgrade documented
   [ ] Peer dependency requirements documented
   [ ] CLAUDE.md mentions version constraints

❌ RED FLAGS:
- Hard-coded versions in package.json (should use "catalog:")
- Version mismatches when running syncpack:list
- Peer dependency warnings after pnpm install
- Different versions of same package in different workspaces
- Circular dependency warnings
```

---

## Quick Reference: Prevention Strategies Summary

| Problem | Prevention | Best Practice | Pre-Commit Check |
|---------|-----------|---|---|
| **ZodError in LLM Schemas** | Use `flexibleEnum()` and `flexibleNumber()` | Always handle LLM output variations | `grep -c "z\.enum"` = 0 |
| **Build Failure - Missing Modules** | Run `git status` before committing | Commit related files together | `pnpm typecheck` passes |
| **middleware.ts/proxy.ts Conflict** | Use `proxy.ts` for Next.js 16+ | Document version requirements | Script checks file exists |
| **@hookform/resolvers Mismatch** | Use pnpm catalog for all versions | All shared deps in catalog: | `pnpm syncpack:list` = 0 |

---

## Implementation Roadmap

### Week 1: Foundation
- [ ] Update CLAUDE.md with all four prevention sections
- [ ] Add pre-commit hooks for ZodError prevention
- [ ] Create .husky/pre-commit script for build verification

### Week 2: Testing & Documentation
- [ ] Add test cases for LLM schema antifragility
- [ ] Document middleware pattern for Next.js 16
- [ ] Create dependency verification script

### Week 3: Enforcement
- [ ] Add pre-commit checks to all four areas
- [ ] Train team on prevention strategies
- [ ] Review existing code for compliance

### Week 4: Monitoring
- [ ] Monitor pre-commit hook adoption
- [ ] Track ZodError incidents
- [ ] Review build failure trends

---

## Key Takeaways

1. **ZodError Prevention**: Always use `flexibleEnum()` and `flexibleNumber()` for LLM outputs
2. **Build Integrity**: Run `git status` before committing, ensure all related files tracked
3. **Middleware Compatibility**: Use `proxy.ts` for Next.js 16+, remove `middleware.ts`
4. **Dependency Management**: Use pnpm catalog to centralize version management

---

**Last Updated**: January 4, 2026
**Status**: Ready for Implementation
