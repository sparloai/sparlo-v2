# Prevention Strategies Implementation Checklist

Quick-start guide for implementing the four prevention strategies across Sparlo V2.

---

## Problem 1: ZodError in LLM Schemas

### Implementation Checklist

#### Immediate Actions (Day 1)
- [ ] Read `apps/web/lib/llm/prompts/dd/schemas.ts` (line 1-110 shows reference implementation)
- [ ] Review `flexibleEnum()` and `flexibleNumber()` helper functions
- [ ] Check all existing LLM schema files for raw `z.enum()` usage
  ```bash
  grep -r "z\.enum" apps/web/lib/llm/prompts/*/schemas.ts
  ```

#### Code Updates (Days 1-2)
- [ ] Extract `flexibleEnum()` and `flexibleNumber()` to shared helper file
  - Create: `apps/web/lib/llm/prompts/schemas-helpers.ts`
  - Copy from: `apps/web/lib/llm/prompts/dd/schemas.ts` (lines 67-161)
  - Add `ENUM_SYNONYMS` constant

- [ ] Update all schema files to use helpers:
  ```bash
  # Find files to update
  find apps/web/lib/llm/prompts -name "schemas.ts"
  ```
  - For each file: Replace `z.enum()` with `flexibleEnum()`
  - For each file: Replace `z.number()` with `flexibleNumber()`

#### Testing (Days 2-3)
- [ ] Create test file: `apps/web/lib/llm/prompts/__tests__/schemas.test.ts`
- [ ] Add test cases from `PREVENTION_STRATEGIES_FOUR_PROBLEMS.md` - Problem 1 section
- [ ] Run tests:
  ```bash
  pnpm test apps/web/lib/llm/prompts/__tests__/schemas.test.ts
  ```

#### Pre-Commit Hook Setup (Day 3)
- [ ] Create script to prevent raw enums/numbers
  ```bash
  # Create file: .husky/pre-commit
  # Add content from PREVENTION_STRATEGIES_FOUR_PROBLEMS.md - Problem 1 section
  ```
- [ ] Make executable:
  ```bash
  chmod +x .husky/pre-commit
  ```

#### Documentation (Day 3)
- [ ] Update `CLAUDE.md` section "LLM Output Schemas (CRITICAL)"
  - Add reference to helper functions
  - Add examples of antifragile patterns
  - Link to PREVENTION_STRATEGIES_FOUR_PROBLEMS.md

### Verification Commands
```bash
# Verify no raw z.enum()
grep -c "z\.enum" apps/web/lib/llm/prompts/*/schemas.ts 2>/dev/null || echo "0 (Good!)"

# Verify tests pass
pnpm test --run apps/web/lib/llm/prompts/__tests__/schemas.test.ts

# Verify typecheck
pnpm typecheck

# Verify build
pnpm build
```

### Success Criteria
- ✓ No raw `z.enum()` in LLM schema files
- ✓ No raw `z.number()` in LLM schema files
- ✓ All schema tests pass
- ✓ Build succeeds without errors
- ✓ Pre-commit hook prevents regression

---

## Problem 2: Build Failure - Missing Modules

### Implementation Checklist

#### Immediate Actions (Day 1)
- [ ] Review current pre-commit hooks:
  ```bash
  ls -la .husky/
  cat .husky/pre-commit
  ```

#### Pre-Commit Hooks Setup (Days 1-2)
- [ ] Create/update `.husky/pre-commit` to include module verification:
  ```bash
  # Add content from PREVENTION_STRATEGIES_FOUR_PROBLEMS.md - Problem 2 section
  # Test: pnpm typecheck
  # Test: pnpm lint
  ```

- [ ] Create/update `.husky/pre-push` for git status check:
  ```bash
  # Add content from PREVENTION_STRATEGIES_FOUR_PROBLEMS.md - Problem 2 section
  ```

- [ ] Make executable:
  ```bash
  chmod +x .husky/pre-commit .husky/pre-push
  ```

#### Build Script Setup (Day 2)
- [ ] Update `package.json` scripts:
  ```bash
  # Add or verify these scripts exist:
  # "pre-commit": "pnpm typecheck && pnpm lint"
  # "build:affected": "turbo build --affected"
  ```

#### Developer Education (Day 2-3)
- [ ] Update CLAUDE.md with pre-commit requirements:
  - Add section on using `git status`
  - Add section on committing related files together
  - Link to build verification script

- [ ] Create quick-reference guide:
  ```bash
  # Create: docs/BUILD_INTEGRITY.md
  # Content: How to verify before committing
  ```

#### Testing (Day 3)
- [ ] Test the hooks with intentional failures:
  ```bash
  # Create a test file with unresolved import
  echo "import { nonexistent } from './missing';" > test-import.ts

  # Try to commit (should fail)
  git add test-import.ts
  git commit -m "test"  # ← Should fail with pre-commit hook

  # Clean up
  git reset HEAD test-import.ts
  rm test-import.ts
  ```

### Verification Commands
```bash
# Verify pre-commit hook is executable
ls -la .husky/pre-commit | grep -q rwx && echo "✓ Executable"

# Verify hook runs on commit attempt
echo "Hooks should run when you try: git commit"

# Test with intentional error
git commit --no-verify  # ← Bypasses hooks (for testing only)
```

### Success Criteria
- ✓ Pre-commit hooks run automatically
- ✓ Hooks prevent commits with unresolved imports
- ✓ Hooks prevent commits with missing related files
- ✓ Team members know to run `git status` before committing
- ✓ Build failures due to missing modules eliminated

---

## Problem 3: middleware.ts vs proxy.ts Conflict (Next.js 16)

### Implementation Checklist

#### Verification (Day 1)
- [ ] Check current state:
  ```bash
  # Verify proxy.ts exists
  ls -la apps/web/proxy.ts

  # Verify middleware.ts does NOT exist
  ls -la apps/web/middleware.ts 2>&1 | grep "No such file"

  # Check Next.js version
  npm ls next --depth=0
  ```

#### Documentation Updates (Days 1-2)
- [ ] Update `CLAUDE.md` with Next.js 16 section:
  - Add: "Next.js Version-Specific Architecture" section
  - Document: `proxy.ts` is correct for Next.js 16+
  - Document: `middleware.ts` must be removed if upgrading
  - Add migration steps from old middleware.ts to proxy.ts

#### Verification Script (Day 2)
- [ ] Create script: `scripts/verify-middleware-pattern.sh`
  - Copy content from PREVENTION_STRATEGIES_FOUR_PROBLEMS.md - Problem 3 section
  - Make executable:
    ```bash
    chmod +x scripts/verify-middleware-pattern.sh
    ```
  - Add to package.json scripts:
    ```json
    {
      "scripts": {
        "verify:middleware": "bash scripts/verify-middleware-pattern.sh"
      }
    }
    ```

#### Pre-Commit Hook (Day 2)
- [ ] Add check to `.husky/pre-commit`:
  ```bash
  # Add this check
  if [ -f "apps/web/middleware.ts" ] && [ -f "apps/web/proxy.ts" ]; then
    echo "ERROR: Both middleware.ts and proxy.ts found"
    exit 1
  fi
  ```

#### Tests (Day 2-3)
- [ ] Create test: `apps/web/__tests__/middleware-pattern.test.ts`
  - Copy content from PREVENTION_STRATEGIES_FOUR_PROBLEMS.md - Problem 3 section
  - Run tests:
    ```bash
    pnpm test --run apps/web/__tests__/middleware-pattern.test.ts
    ```

#### Local Verification (Day 3)
- [ ] Test that dev server starts:
  ```bash
  npm run dev
  # Check: Server starts without errors
  # Check: Authentication routes work
  # Check: Protected routes redirect to signin when not logged in
  ```

### Verification Commands
```bash
# Run verification script
./scripts/verify-middleware-pattern.sh

# Run tests
pnpm test --run apps/web/__tests__/middleware-pattern.test.ts

# Check dev server
npm run dev  # Should start without errors
```

### Success Criteria
- ✓ `proxy.ts` exists and is properly configured
- ✓ `middleware.ts` does not exist
- ✓ Verification script passes
- ✓ Tests confirm correct pattern
- ✓ Dev server starts and auth works
- ✓ Documentation updated in CLAUDE.md

---

## Problem 4: @hookform/resolvers Version Mismatch

### Implementation Checklist

#### Verification (Day 1)
- [ ] Check current state:
  ```bash
  # View catalog in pnpm-workspace.yaml
  grep -A5 "catalog:" pnpm-workspace.yaml | head -20

  # Check for @hookform/resolvers
  grep "@hookform/resolvers" pnpm-workspace.yaml

  # Verify pnpm install works
  pnpm install --dry-run
  ```

#### Catalog Audit (Days 1-2)
- [ ] Review all packages using @hookform/resolvers:
  ```bash
  grep -r "@hookform/resolvers" . --include="package.json" | grep -v node_modules
  ```

- [ ] For each package using it, verify they use `"catalog:"`:
  ```bash
  # Example: apps/web/package.json should have:
  {
    "dependencies": {
      "@hookform/resolvers": "catalog:",
      "react-hook-form": "catalog:"
    }
  }
  ```

#### Fix Version Mismatches (Day 2)
- [ ] Run automatic fix:
  ```bash
  pnpm syncpack:fix
  ```

- [ ] Verify all shared dependencies are in catalog:
  ```bash
  pnpm syncpack:list
  # Should show: 0 mismatches
  ```

#### Pre-Commit Hook (Day 2)
- [ ] Add to `.husky/pre-commit`:
  ```bash
  # Add content from PREVENTION_STRATEGIES_FOUR_PROBLEMS.md - Problem 4 section
  echo "Checking package version consistency..."
  pnpm syncpack:list || {
    echo "ERROR: Version mismatches found"
    exit 1
  }
  ```

#### Testing (Days 2-3)
- [ ] Create test: `apps/web/__tests__/dependencies.test.ts`
  - Copy content from PREVENTION_STRATEGIES_FOUR_PROBLEMS.md - Problem 4 section
  - Run tests:
    ```bash
    pnpm test --run apps/web/__tests__/dependencies.test.ts
    ```

- [ ] Create script: `scripts/verify-dependencies.sh`
  - Copy content from PREVENTION_STRATEGIES_FOUR_PROBLEMS.md - Problem 4 section
  - Make executable:
    ```bash
    chmod +x scripts/verify-dependencies.sh
    ```
  - Run script:
    ```bash
    ./scripts/verify-dependencies.sh
    ```

#### Verification (Day 3)
- [ ] Verify build succeeds:
  ```bash
  pnpm build
  ```

- [ ] Check for peer dependency warnings:
  ```bash
  pnpm install --report-audit 2>&1 | grep -i "peer"
  # Should show: no peer dependency warnings
  ```

### Verification Commands
```bash
# List version mismatches
pnpm syncpack:list

# Auto-fix mismatches
pnpm syncpack:fix

# Run dependency tests
pnpm test --run apps/web/__tests__/dependencies.test.ts

# Run verification script
./scripts/verify-dependencies.sh

# Check for warnings
pnpm install --dry-run 2>&1 | grep -i "warn"
```

### Success Criteria
- ✓ All shared dependencies in pnpm-workspace.yaml catalog
- ✓ All packages use `"catalog:"` syntax
- ✓ No version mismatches (syncpack:list = 0)
- ✓ No peer dependency warnings
- ✓ All tests pass
- ✓ Build succeeds without errors

---

## Overall Implementation Timeline

### Week 1: Foundation
**Focus**: Set up prevention infrastructure

- **Days 1-2**: ZodError Prevention
  - [ ] Extract schema helpers
  - [ ] Add pre-commit check
  - Effort: 2-3 hours

- **Days 2-3**: Build Failure Prevention
  - [ ] Create pre-commit/pre-push hooks
  - [ ] Set up build verification
  - Effort: 2-3 hours

- **Day 4**: Middleware Pattern
  - [ ] Create verification script
  - [ ] Verify current state (already done in Sparlo V2)
  - Effort: 1 hour

- **Day 5**: Dependency Management
  - [ ] Audit pnpm catalog
  - [ ] Fix any mismatches
  - Effort: 1-2 hours

### Week 2: Testing & Documentation

- **Days 1-2**: Add Test Cases
  - [ ] LLM schema tests
  - [ ] Middleware pattern tests
  - [ ] Dependency verification tests
  - Effort: 3-4 hours

- **Days 3-4**: Update Documentation
  - [ ] Update CLAUDE.md
  - [ ] Create developer guides
  - [ ] Add code review checklists
  - Effort: 2-3 hours

- **Day 5**: Team Training
  - [ ] Show team the prevention strategies
  - [ ] Demo pre-commit hooks
  - [ ] Explain when and why each check matters
  - Effort: 1-2 hours

### Week 3: Enforcement & Monitoring

- **Days 1-3**: Rollout Pre-Commit Hooks
  - [ ] Deploy hooks to all developers
  - [ ] Verify hooks run on their machines
  - [ ] Handle any edge cases
  - Effort: 2-3 hours

- **Days 4-5**: Compliance Check
  - [ ] Scan codebase for violations
  - [ ] Fix any existing issues
  - [ ] Create task list for team if needed
  - Effort: 1-2 hours

---

## Quick Command Reference

### ZodError Prevention
```bash
# Check for violations
grep -r "z\.enum" apps/web/lib/llm/prompts/*/schemas.ts
grep -r "z\.number()" apps/web/lib/llm/prompts/*/schemas.ts

# Run tests
pnpm test apps/web/lib/llm/prompts/__tests__/schemas.test.ts
```

### Build Failure Prevention
```bash
# Check git status
git status

# Verify imports resolve
pnpm typecheck

# Test hooks
git commit --dry-run
```

### Middleware Pattern
```bash
# Verify pattern
./scripts/verify-middleware-pattern.sh

# Run tests
pnpm test --run apps/web/__tests__/middleware-pattern.test.ts

# Test locally
npm run dev
```

### Dependency Management
```bash
# Check mismatches
pnpm syncpack:list

# Fix automatically
pnpm syncpack:fix

# Run verification
./scripts/verify-dependencies.sh
```

---

## Common Issues & Solutions

### Issue: Pre-commit hook not running
**Solution**:
```bash
# Make sure hooks are executable
chmod +x .husky/pre-commit .husky/pre-push

# Reinstall husky
npx husky install
```

### Issue: "Cannot find module" errors on import
**Solution**:
```bash
# Run git status to find untracked files
git status

# Stage all related files
git add .

# Verify imports resolve
pnpm typecheck
```

### Issue: Peer dependency warnings with @hookform
**Solution**:
```bash
# Add missing peer deps to catalog
# Edit: pnpm-workspace.yaml
catalog:
  react-hook-form: 7.68.0

# Fix mismatches
pnpm syncpack:fix
pnpm install
```

### Issue: Both middleware.ts and proxy.ts exist
**Solution**:
```bash
# Verify Next.js 16 is installed
npm ls next

# Remove old file
rm apps/web/middleware.ts

# Verify
./scripts/verify-middleware-pattern.sh
```

---

## Success Metrics

Track these metrics to ensure prevention strategies are working:

1. **ZodError Prevention**
   - Metric: LLM schema validation errors per month
   - Target: 0 (zero tolerance)
   - Current: Track baseline, implement, measure improvement

2. **Build Failure Prevention**
   - Metric: Build failures due to missing modules per month
   - Target: 0
   - Current: Track baseline, implement, measure improvement

3. **Middleware Pattern**
   - Metric: Middleware-related issues per month
   - Target: 0
   - Current: Already using proxy.ts correctly

4. **Dependency Management**
   - Metric: Peer dependency warnings during install
   - Target: 0
   - Current: Run `pnpm install` and check

---

## Status Tracking

Use this table to track implementation progress:

| Problem | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Status |
|---------|-------|-------|-------|-------|-------|--------|
| ZodError | Analysis | Code | Tests | Hooks | Docs | ⏳ |
| Build Failures | Analysis | Hooks | Testing | Docs | Deploy | ⏳ |
| Middleware | ✓ Verify | Docs | Tests | Script | Deploy | ⏳ |
| Dependencies | ✓ Verify | Catalog | Tests | Docs | Verify | ⏳ |

---

## Next Steps After Implementation

1. **Monitor pre-commit hook adoption**
   - Track: How many developers have hooks enabled
   - Action: Follow up with those without hooks

2. **Track prevention effectiveness**
   - Monitor: Issues prevented by each strategy
   - Review: Monthly metrics

3. **Continuous improvement**
   - Gather feedback from team
   - Refine prevention strategies based on real issues
   - Document new patterns discovered

4. **Knowledge sharing**
   - Add to onboarding documentation
   - Train new team members
   - Share lessons learned with other teams

---

**Created**: January 4, 2026
**Status**: Ready for Implementation
**Estimated Effort**: 15-20 hours (spread over 3 weeks)
