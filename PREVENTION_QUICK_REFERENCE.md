# Prevention Strategies - Quick Reference Guide

One-page reference for the four critical prevention strategies in Sparlo V2.

---

## The Four Problems & Solutions at a Glance

### 1. ZodError in LLM Schemas ⚠️

**Problem**: Raw `z.enum()` and `z.number()` fail on LLM output variations.

**Prevention**:
```typescript
// ❌ WRONG
verdict: z.enum(['STRONG', 'MODERATE', 'WEAK'])
score: z.number()

// ✅ CORRECT
verdict: flexibleEnum(['STRONG', 'MODERATE', 'WEAK'], 'MODERATE')
score: flexibleNumber(5, { min: 1, max: 10 })
```

**Pre-Commit Check**:
```bash
grep -c "z\.enum" apps/web/lib/llm/prompts/*/schemas.ts  # Should be 0
grep -c "z\.number()" apps/web/lib/llm/prompts/*/schemas.ts  # Should be 0
```

**Best Practice**: All LLM outputs use `flexibleEnum()` and `flexibleNumber()`

---

### 2. Build Failure - Missing Modules 🔴

**Problem**: Committed files missing, causing "Module not found" errors.

**Prevention**:
```bash
# BEFORE committing - always run
git status

# If you see untracked files related to your changes, add them!
git add .  # Add all related files together
git commit -m "feat: description"
```

**Pre-Commit Check**:
```bash
pnpm typecheck  # Must pass - catches unresolved imports
pnpm lint       # Must pass - catches import errors
```

**Best Practice**: Commit related files as a group, never in multiple commits

---

### 3. middleware.ts vs proxy.ts (Next.js 16) 🔄

**Problem**: Conflicts between old `middleware.ts` and new `proxy.ts` patterns.

**Prevention**:
```bash
# For Next.js 16+:
# ✓ Use: apps/web/proxy.ts (export async function proxy)
# ✗ Remove: apps/web/middleware.ts (deprecated)

# Verify
./scripts/verify-middleware-pattern.sh
```

**File Check**:
- `proxy.ts` exists: ✓
- `middleware.ts` absent: ✓
- Next.js 16+: ✓

**Best Practice**: Always use `proxy.ts` for Next.js 16+, delete `middleware.ts`

---

### 4. @hookform/resolvers Version Mismatch 📦

**Problem**: Package versions drift, causing peer dependency warnings.

**Prevention**:
```yaml
# pnpm-workspace.yaml
catalog:
  '@hookform/resolvers': 3.10.0
  'react-hook-form': 7.68.0
  'zod': 4.1.13
```

```json
# Any package.json
{
  "dependencies": {
    "@hookform/resolvers": "catalog:",
    "react-hook-form": "catalog:",
    "zod": "catalog:"
  }
}
```

**Pre-Commit Check**:
```bash
pnpm syncpack:list  # Should show: 0 mismatches
```

**Best Practice**: All shared dependencies in `pnpm-workspace.yaml` catalog

---

## Pre-Commit Checks Summary

### What to Run Before Every Commit

```bash
# 1. Check git status (ensures all files tracked)
git status

# 2. Type check (catches import errors)
pnpm typecheck

# 3. Lint (catches patterns)
pnpm lint

# 4. Verify LLM schemas (if modified)
grep "z\.enum\|z\.number()" apps/web/lib/llm/prompts/*/schemas.ts

# 5. Verify dependencies (if modifying package.json)
pnpm syncpack:list

# If all pass → commit
git commit -m "message"
```

Or let hooks do it automatically:
```bash
# Hooks run automatically - no manual steps needed
git commit -m "message"
```

---

## The Prevention Strategies Files

| File | Purpose | When to Use |
|------|---------|-----------|
| `PREVENTION_STRATEGIES_FOUR_PROBLEMS.md` | Detailed guide with examples | Learning the strategies |
| `PREVENTION_IMPLEMENTATION_CHECKLIST.md` | Step-by-step implementation | Setting up prevention |
| `PREVENTION_QUICK_REFERENCE.md` | This file - quick lookup | During development |

---

## Common Scenarios

### Scenario 1: Adding a new LLM schema field
```typescript
// Step 1: Add to ENUM_SYNONYMS if needed
const ENUM_SYNONYMS = {
  NEW_VARIATION: 'EXPECTED_VALUE',
};

// Step 2: Use flexibleEnum
export const MySchema = flexibleEnum(
  ['EXPECTED_VALUE', 'OTHER_VALUE'],
  'EXPECTED_VALUE'  // <- sensible default
);

// Step 3: Test with malformed input
expect(MySchema.parse('unexpected - reason')).toBe('EXPECTED_VALUE');
```

### Scenario 2: Creating a new utility/component
```bash
# Step 1: Check git status
git status

# Step 2: Create the file
touch apps/web/lib/new-helper.ts

# Step 3: Create related file that imports it
touch apps/web/lib/uses-helper.ts

# Step 4: Stage both files together
git add apps/web/lib/new-helper.ts apps/web/lib/uses-helper.ts

# Step 5: Verify imports resolve
pnpm typecheck  # Must pass!

# Step 6: Commit
git commit -m "feat: Add new helper"
```

### Scenario 3: Upgrading a package
```bash
# Step 1: Update in pnpm-workspace.yaml (not individual package.json)
# Edit: pnpm-workspace.yaml
catalog:
  'react-hook-form': 7.69.0  # Changed from 7.68.0

# Step 2: Install
pnpm install

# Step 3: Test
pnpm typecheck
pnpm build
pnpm test

# Step 4: Commit
git add pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "chore: Upgrade react-hook-form to 7.69.0"
```

### Scenario 4: Upgrading Next.js (if you had middleware.ts)
```bash
# Step 1: Verify target version is 16+
npm ls next

# Step 2: Copy middleware.ts logic to proxy.ts
# (Sparlo V2 already has proxy.ts, so just delete middleware.ts)

# Step 3: Remove old file
rm apps/web/middleware.ts

# Step 4: Verify setup
./scripts/verify-middleware-pattern.sh

# Step 5: Test locally
npm run dev  # Should start without errors

# Step 6: Commit
git add -A
git commit -m "chore: Remove deprecated middleware.ts (Next.js 16+)"
```

---

## Red Flags - Stop and Fix Before Committing

### 🚨 ZodError Prevention
- [ ] `z.enum()` found in `apps/web/lib/llm/prompts/*/schemas.ts`
- [ ] `z.number()` found in `apps/web/lib/llm/prompts/*/schemas.ts`
- [ ] Default value is extreme (HIGH, CRITICAL, etc.)

**Fix**: Replace with `flexibleEnum()` / `flexibleNumber()`

### 🚨 Build Failure Prevention
- [ ] `git status` shows untracked files you created
- [ ] `pnpm typecheck` fails with "Cannot find module"
- [ ] Import statements reference files you just created (but didn't add)

**Fix**: `git add .` to include all related files

### 🚨 Middleware Pattern
- [ ] Both `middleware.ts` AND `proxy.ts` exist in `apps/web/`
- [ ] `proxy.ts` doesn't export `async function proxy`
- [ ] Dev server fails to start: auth not working

**Fix**: Remove `middleware.ts`, verify `proxy.ts` is correct

### 🚨 Dependency Mismatch
- [ ] `pnpm install` shows peer dependency warnings
- [ ] `pnpm syncpack:list` shows mismatches
- [ ] Same package exists in different workspaces with different versions

**Fix**: Add to catalog, use `"catalog:"` in all package.json

---

## Commands Quick Reference

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Building
pnpm build
pnpm build:affected

# Testing
pnpm test

# Dependency management
pnpm syncpack:list      # Check mismatches
pnpm syncpack:fix       # Auto-fix mismatches
pnpm install --dry-run  # Check for warnings

# Verification scripts
./scripts/verify-middleware-pattern.sh
./scripts/verify-dependencies.sh

# Git operations
git status              # Always check before committing
git add .              # Stage all related files
git commit -m "msg"    # Hooks run automatically
```

---

## Decision Tree: What to Check

```
Making a change to the codebase?
│
├─ Creating/modifying LLM schemas?
│  └─ Use flexibleEnum() and flexibleNumber() ✓
│
├─ Creating new files that other files import?
│  └─ Run: git status (ensure all files tracked)
│     Run: pnpm typecheck (ensure imports resolve)
│
├─ Modifying package.json or package versions?
│  └─ Use pnpm-workspace.yaml catalog for shared deps
│     Run: pnpm syncpack:list (check for mismatches)
│
├─ Upgrading Next.js?
│  └─ For 16+: Use proxy.ts, remove middleware.ts
│
└─ Regular code changes?
   └─ Run: git status, pnpm typecheck, pnpm lint
```

---

## For Code Reviewers

When reviewing PRs, check:

1. **LLM Schema Changes**
   - [ ] Uses `flexibleEnum()` not `z.enum()`
   - [ ] Uses `flexibleNumber()` not `z.number()`
   - [ ] Default value is sensible (middle, not extreme)
   - [ ] Tests with malformed inputs included

2. **File Changes**
   - [ ] Related files committed together
   - [ ] No untracked files in git status
   - [ ] All imports resolve (typecheck passes)

3. **Dependencies**
   - [ ] Uses `"catalog:"` for shared packages
   - [ ] No version mismatches (`pnpm syncpack:list`)
   - [ ] No peer dependency warnings

4. **Architecture**
   - [ ] Using `proxy.ts` not `middleware.ts` (Next.js 16+)
   - [ ] Middleware pattern test passes

---

## Support & Resources

**Need Help?**
- Detailed guide: See `PREVENTION_STRATEGIES_FOUR_PROBLEMS.md`
- Implementation steps: See `PREVENTION_IMPLEMENTATION_CHECKLIST.md`
- Architecture notes: See `CLAUDE.md`

**Files Referenced**:
- LLM schemas: `apps/web/lib/llm/prompts/*/schemas.ts`
- Middleware: `apps/web/proxy.ts`
- Dependencies: `pnpm-workspace.yaml`

---

## Key Takeaways

1. **Always use flexible schemas for LLM outputs** - They're unpredictable
2. **Always check `git status` before committing** - Ensures related files together
3. **Use `proxy.ts` for Next.js 16+** - Removes middleware.ts entirely
4. **Centralize versions in pnpm catalog** - Single source of truth

---

**Remember**: The goal is to catch problems early (in pre-commit hooks) rather than in build failures or production.

**Last Updated**: January 4, 2026
