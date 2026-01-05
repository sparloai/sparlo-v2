# Prevention Strategies Index

> Comprehensive prevention documentation for issues fixed on 2026-01-04

## Overview

This index provides access to detailed prevention strategies for four common issues encountered during the tabbed analysis forms refactoring. Each strategy includes warning signs, prevention checklists, and test cases.

## The Four Issues

### 1. Memory Leaks from Object URLs

**File:** `PREVENTION_1_MEMORY_LEAKS_OBJECT_URLS.md`

**Problem:** Object URLs created with `URL.createObjectURL()` must be manually revoked. In components that remain mounted (forceMount pattern), these URLs accumulate and cause memory leaks.

**Impact:**
- 50MB+ leaked per 5 file uploads
- Browser crashes on mobile devices
- Battery drain from memory pressure

**Key Takeaway:** Every `URL.createObjectURL()` must have exactly one `URL.revokeObjectURL()`.

**Quick Check:**
```bash
# Find object URL creation
grep -r "URL.createObjectURL" --include="*.tsx"

# Find cleanup (should match creation count)
grep -r "URL.revokeObjectURL" --include="*.tsx"
```

---

### 2. Pattern Matching Performance

**File:** `PREVENTION_2_PATTERN_MATCHING_PERFORMANCE.md`

**Problem:** Running regex pattern matching on every keystroke without debouncing causes unnecessary CPU usage, input lag, and battery drain.

**Impact:**
- 93 regex operations per keystroke
- 465 operations/second during typing
- Input lag on slower devices

**Key Takeaway:** Always debounce or defer expensive operations triggered by user input.

**Quick Check:**
```bash
# Find pattern matching in components
grep -r "\.test\(" --include="*.tsx" | grep -v "spec.tsx"

# Check for debouncing
grep -r "useDeferredValue\|useDebounce" --include="*.tsx"
```

---

### 3. Code Duplication

**File:** `PREVENTION_3_CODE_DUPLICATION.md`

**Problem:** Duplicated code creates maintenance burden, increases bug risk, and makes future changes error-prone.

**Impact:**
- 400+ lines of duplicate code (~85% similarity)
- Bug fixes required in multiple files
- Inconsistent behavior between similar features

**Key Takeaway:** If you need to update code in 2+ files for one feature, extract shared logic.

**Quick Check:**
```bash
# Detect code duplication
npx jscpd --min-lines 10 --min-tokens 50 src/

# Compare two similar files
git diff --no-index file1.tsx file2.tsx --stat
```

---

### 4. Error Message Exposure

**File:** `PREVENTION_4_ERROR_MESSAGE_EXPOSURE.md`

**Problem:** Displaying raw error messages from backend exposes sensitive internal details like database schema, RLS policies, and implementation details.

**Impact:**
- Database schema exposed to users
- Security policy names visible
- Aids attackers in understanding system

**Key Takeaway:** Always sanitize error messages before showing to users. Log full errors server-side only.

**Quick Check:**
```bash
# Find potential error exposures
grep -r "error\.message" --include="*.tsx"

# Find missing sanitization
grep -r "catch.*{" -A 5 --include="*.ts" | grep -v "sanitizeError"
```

## Quick Reference Matrix

| Issue | Warning Sign | Prevention | Test Method |
|-------|--------------|------------|-------------|
| **Memory Leaks** | `URL.createObjectURL` without revoke | Add cleanup in `useEffect` | Chrome DevTools Memory profiler |
| **Performance** | Pattern matching in render path | Use `useDeferredValue` or debounce | Performance profiler (CPU usage) |
| **Duplication** | Same code in 2+ files | Extract hook/component/util | Code similarity detector (jscpd) |
| **Error Exposure** | Raw `error.message` displayed | Use `sanitizeError()` utility | E2E test for sensitive strings |

## Priority Guide

### P0 - Critical (Fix Immediately)

- **Error Message Exposure** in production
  - Shows database schema or credentials
  - Action: Add sanitization before next deployment

### P1 - High Priority (Fix This Sprint)

- **Memory Leaks** affecting users
  - Confirmed browser crashes or 50MB+ growth
  - Action: Add URL cleanup in components with forceMount

### P2 - Medium Priority (Fix Soon)

- **Code Duplication** > 80% similarity
  - Bugs fixed in multiple files
  - Action: Extract shared code during next feature work

### P3 - Low Priority (Nice to Have)

- **Performance Issues** on slow devices
  - Noticeable lag but not blocking
  - Action: Add debouncing when touching that code

## When to Use Each Strategy

### During Code Review

1. **Check for Memory Leaks**
   - Search PR for `URL.createObjectURL`
   - Verify cleanup exists

2. **Check for Performance Issues**
   - Search for pattern matching in onChange handlers
   - Verify debouncing/memoization

3. **Check for Duplication**
   - Run similarity check on new files
   - Compare with existing similar features

4. **Check for Error Exposure**
   - Search for `error.message` in UI code
   - Verify sanitization exists

### During Development

1. **Before Creating Component**
   - Search for similar components
   - Reuse or extract shared code

2. **Before Adding Pattern Matching**
   - Count patterns × keystrokes/sec
   - If > 20 ops/sec, add debouncing

3. **Before Displaying Errors**
   - Always use sanitization utility
   - Never show raw error.message

4. **Before Using forceMount**
   - Plan cleanup strategy
   - Consider if mounting is truly needed

### During Testing

1. **Performance Testing**
   - Profile memory after repeated operations
   - Measure CPU during typing
   - Test on low-end devices

2. **Security Testing**
   - Trigger errors and check UI
   - Verify no schema/constraint names visible
   - Check production logs for full errors

3. **Integration Testing**
   - Verify shared components work in all contexts
   - Test extracted hooks with different configs
   - Confirm no behavioral regression

## File Structure

```
PREVENTION_STRATEGIES/
├── PREVENTION_STRATEGIES_INDEX.md (this file)
├── PREVENTION_1_MEMORY_LEAKS_OBJECT_URLS.md
├── PREVENTION_2_PATTERN_MATCHING_PERFORMANCE.md
├── PREVENTION_3_CODE_DUPLICATION.md
└── PREVENTION_4_ERROR_MESSAGE_EXPOSURE.md
```

## How to Use This Documentation

### For New Team Members

1. Read this index first to understand the four issues
2. Read full prevention guides for areas you'll work in
3. Bookmark quick reference sections
4. Use checklists during code reviews

### For Code Reviews

1. Run quick checks from each prevention guide
2. Use checklist sections to verify changes
3. Reference specific sections when providing feedback
4. Link to relevant guide in review comments

### For New Features

1. Check relevant prevention guides before starting
2. Use prevention checklists during implementation
3. Run automated checks before submitting PR
4. Include test cases from guides in your tests

### For Bug Fixes

1. Identify which category the bug falls into
2. Read the relevant prevention guide
3. Apply prevention checklist to fix
4. Add test cases to prevent regression

## Common Patterns Across All Issues

### Pattern 1: Defense in Depth

All four issues benefit from multiple layers of protection:

- **Memory Leaks:** Cleanup in useEffect + cleanup on remove + cleanup on unmount
- **Performance:** Memoization + debouncing + Web Workers (if needed)
- **Duplication:** Extract hook + extract component + extract util
- **Error Exposure:** Server sanitization + client sanitization + error boundary

### Pattern 2: Measure Before Fixing

Always verify the issue exists and measure the fix:

- **Memory:** Chrome DevTools Memory profiler (before/after snapshots)
- **Performance:** Chrome DevTools Performance (CPU usage during typing)
- **Duplication:** jscpd similarity percentage
- **Error Exposure:** E2E tests checking for sensitive strings

### Pattern 3: Automate Detection

Add automated checks to prevent regression:

- **Memory:** E2E test measuring memory growth
- **Performance:** Performance budget tests
- **Duplication:** jscpd in CI pipeline
- **Error Exposure:** Security tests checking error messages

### Pattern 4: Document Decisions

All prevention guides include:

- Warning signs (how to detect)
- Prevention checklist (how to avoid)
- Test cases (how to verify)
- Code examples (how to fix)

## Automated Checks Setup

Add to CI/CD pipeline:

```yaml
# .github/workflows/quality-checks.yml
name: Quality Checks

on: [pull_request]

jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Check for code duplication
      - name: Check for duplication
        run: npx jscpd --min-lines 10 --min-tokens 50 --threshold 15 src/

      # Check for error exposure
      - name: Check for error exposure
        run: |
          if grep -r "error\.message" --include="*.tsx" src/; then
            echo "⚠️ Found error.message in UI code. Use sanitizeError()."
            exit 1
          fi

      # Check for object URL cleanup
      - name: Check for object URL cleanup
        run: |
          creates=$(grep -r "URL.createObjectURL" --include="*.tsx" src/ | wc -l)
          revokes=$(grep -r "URL.revokeObjectURL" --include="*.tsx" src/ | wc -l)
          if [ $creates -gt $revokes ]; then
            echo "⚠️ More createObjectURL ($creates) than revokeObjectURL ($revokes)"
            exit 1
          fi

      # Check for pattern matching in render path
      - name: Check for unoptimized pattern matching
        run: |
          if grep -r "\.test\(.*\)" --include="*.tsx" src/ | grep -v "useMemo\|useDeferredValue"; then
            echo "⚠️ Pattern matching without memoization/debouncing"
            exit 1
          fi
```

## Related Documentation

### Internal Docs
- `/docs/solutions/runtime-errors/` - Specific bug fixes
- `/docs/solutions/security-issues/` - Security hardening
- `/CLAUDE.md` - Repository coding guidelines

### External Resources
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Web Performance Metrics](https://web.dev/vitals/)
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
- [Chrome DevTools Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems/)

## Feedback and Updates

These prevention guides are living documents. If you:

- Find a new warning sign
- Discover a better prevention technique
- Create a better test case
- Identify a missing scenario

Please update the relevant guide and note the change in git commit message.

### Update Template

```markdown
## Update Log

### [Date] - [Your Name]
- **Added:** [What you added]
- **Why:** [Reason for addition]
- **Impact:** [Who should read this update]
```

## Contact

For questions or clarifications:

- Code Reviews: Tag @[tech-lead] in PR
- Documentation: Open issue with "docs" label
- Security: Follow security disclosure process

---

**Last Updated:** 2026-01-04
**Author:** Claude Code
**Version:** 1.0
