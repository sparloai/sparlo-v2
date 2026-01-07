# Prevention Strategies: Executive Summary

> Quick reference guide for the four issues fixed on 2026-01-04

## At a Glance

| Issue | Impact | Quick Fix | Detection Time |
|-------|--------|-----------|----------------|
| Memory Leaks | Browser crashes | Add URL cleanup | 2 min |
| Performance | Input lag | Add debouncing | 1 min |
| Code Duplication | Bug divergence | Extract shared code | 5 min |
| Error Exposure | Security risk | Sanitize errors | 30 sec |

## 1-Minute Checklists

### Memory Leaks

**Before Merging PR:**
- [ ] Search PR for `URL.createObjectURL`
- [ ] Verify each has matching `URL.revokeObjectURL`
- [ ] Check cleanup in `useEffect` with URL as dependency

**Red Flag:**
```typescript
// ❌ BAD
const preview = URL.createObjectURL(file);

// ✅ GOOD
const preview = URL.createObjectURL(file);
useEffect(() => {
  return () => URL.revokeObjectURL(preview);
}, [preview]);
```

---

### Performance Issues

**Before Merging PR:**
- [ ] Search for pattern matching in `onChange` handlers
- [ ] Verify `useMemo` or `useDeferredValue` is used
- [ ] Count operations: patterns × keystrokes/sec < 20

**Red Flag:**
```typescript
// ❌ BAD
<textarea onChange={(e) => {
  setText(e.target.value);
  validateWithPatterns(e.target.value); // Runs every keystroke!
}} />

// ✅ GOOD
const deferredText = useDeferredValue(text);
const isValid = useMemo(() =>
  validateWithPatterns(deferredText),
  [deferredText]
);
```

---

### Code Duplication

**Before Starting Work:**
- [ ] Search for similar feature: `grep -r "function.*FeatureName"`
- [ ] Check similarity: `npx jscpd --min-lines 10 src/`
- [ ] Extract if > 80% similar

**Red Flag:**
```typescript
// ❌ BAD: Same code in two files
// file-a.tsx
const [attachments, setAttachments] = useState([]);
const handleFileSelect = async (e) => { /* 50 lines */ };

// file-b.tsx
const [attachments, setAttachments] = useState([]);
const handleFileSelect = async (e) => { /* 50 lines */ };

// ✅ GOOD: Shared hook
// Both files:
const { attachments, handleFileSelect } = useFileAttachments();
```

---

### Error Exposure

**Before Deploying:**
- [ ] Search for `error.message` in UI code
- [ ] Verify `sanitizeError()` is used
- [ ] Test: trigger error, check UI for sensitive strings

**Red Flag:**
```typescript
// ❌ BAD: Exposes DB schema
catch (error) {
  toast.error(error.message);
  // Shows: "duplicate key violates constraint users_email_key"
}

// ✅ GOOD: Sanitized message
catch (error) {
  console.error('Full error:', error); // Server logs only
  toast.error(sanitizeError(error));
  // Shows: "An account with this email already exists"
}
```

## Quick Detection Commands

```bash
# Memory leaks
grep -r "URL.createObjectURL" --include="*.tsx" src/ | wc -l
grep -r "URL.revokeObjectURL" --include="*.tsx" src/ | wc -l
# First number should ≤ second number

# Performance issues
grep -r "\.test\(" --include="*.tsx" src/ | grep -v "spec.tsx" | grep -v "useMemo\|useDeferredValue"
# Should return 0 results

# Code duplication
npx jscpd --min-lines 10 --min-tokens 50 --threshold 15 src/
# Should pass threshold

# Error exposure
grep -r "error\.message" --include="*.tsx" src/
# Should return 0 results (or all sanitized)
```

## Priority Matrix

### P0 - Block Deployment

- **Error Exposure** showing database schema in production
- **Memory Leaks** causing browser crashes

### P1 - Fix Before Next Release

- **Memory Leaks** with 50MB+ growth
- **Code Duplication** > 80% similarity
- **Error Exposure** in new API endpoints

### P2 - Fix This Sprint

- **Performance Issues** with noticeable lag
- **Code Duplication** 50-80% similarity
- **Error Exposure** in non-critical paths

### P3 - Technical Debt

- **Performance Issues** on slow devices only
- **Code Duplication** < 50% similarity
- Minor cleanup items

## Test Quick Reference

### Chrome DevTools Checks

**Memory Leak:**
1. Open DevTools > Memory
2. Take snapshot
3. Perform operation 10 times
4. Force GC (🗑️ icon)
5. Take second snapshot
6. Compare > search for "blob:"
7. Count should be similar (±10%)

**Performance:**
1. Open DevTools > Performance
2. Start recording
3. Type in textarea
4. Stop recording
5. Check for:
   - Frame drops (red bars)
   - Long tasks (> 50ms)
   - High scripting time (yellow)

### Automated Test Template

```typescript
// Memory leak test
it('should not leak memory on repeated operations', async () => {
  const baseline = await getMemoryUsage();

  for (let i = 0; i < 10; i++) {
    await performOperation();
    await cleanup();
  }

  await forceGarbageCollection();
  const final = await getMemoryUsage();

  expect(final - baseline).toBeLessThan(baseline * 0.2); // 20% tolerance
});

// Performance test
it('should handle typing without lag', async () => {
  const start = performance.now();
  await typeText('a'.repeat(100));
  const duration = performance.now() - start;

  expect(duration).toBeLessThan(500); // 500ms for 100 chars
});

// Duplication check
it('should not have duplicate code', () => {
  const similarity = calculateSimilarity('file-a.tsx', 'file-b.tsx');
  expect(similarity).toBeLessThan(0.5); // < 50% similar
});

// Error exposure test
it('should not expose database schema', async () => {
  await triggerDatabaseError();
  const errorText = await screen.findByRole('alert');

  expect(errorText).not.toContain('constraint');
  expect(errorText).not.toContain('table');
  expect(errorText).not.toContain('_key');
});
```

## Code Review Checklist

```markdown
## Memory Leaks
- [ ] No `URL.createObjectURL` without cleanup
- [ ] Components with `forceMount` have cleanup strategy
- [ ] File previews revoked on removal/unmount

## Performance
- [ ] Pattern matching is debounced/memoized
- [ ] No heavy operations in onChange handlers
- [ ] Operations < 16ms (one frame)

## Code Duplication
- [ ] No copy-paste from other files
- [ ] Similar code extracted to shared utilities
- [ ] Duplication < 15% (per jscpd)

## Error Exposure
- [ ] All errors sanitized before display
- [ ] Full errors logged server-side
- [ ] No database schema in error messages
- [ ] No stack traces in production UI

## General
- [ ] Tests added/updated
- [ ] Documentation updated if needed
- [ ] TypeScript compiles without errors
- [ ] All CI checks pass
```

## When to Extract Shared Code

| Similarity | Action | Timeline |
|------------|--------|----------|
| 100% | Extract immediately | Now |
| 80-99% | Extract with parameterization | Before merging PR |
| 50-79% | Extract common parts | Next sprint |
| < 50% | Keep separate (usually) | N/A |

## When to Add Debouncing

| Operations/Keystroke | Action | Technique |
|---------------------|--------|-----------|
| 1-5 simple checks | No debounce needed | `useMemo` only |
| 5-20 operations | Recommended | `useDeferredValue` |
| 20+ operations | Required | `useDebounce(300ms)` |
| API calls | Always | `useDebounce(500ms)` |

## Emergency Fixes

### Memory Leak Causing Crashes

```typescript
// Quick fix: Add immediate cleanup
useEffect(() => {
  return () => {
    // Revoke all URLs on unmount
    objectUrls.forEach(url => URL.revokeObjectURL(url));
  };
}, [objectUrls]);
```

### Input Lag Blocking Users

```typescript
// Quick fix: Add deferred value
const deferredText = useDeferredValue(userInput);
// Use deferredText for expensive operations
```

### Database Schema Exposed

```typescript
// Quick fix: Wrap all error displays
import { sanitizeError } from '~/lib/security/sanitize-error';

catch (error) {
  toast.error(sanitizeError(error)); // ← Add this wrapper
}
```

### Code Needs Immediate DRY

```typescript
// Quick fix: Extract to shared file
// 1. Create _lib/utils/shared-logic.ts
export function sharedLogic() { /* move code here */ }

// 2. Import in both files
import { sharedLogic } from '../_lib/utils/shared-logic';
```

## Metrics to Track

### Memory Health
```
Baseline memory: X MB
After 10 operations: X MB + Y MB
Growth per operation: Y/10 MB
Acceptable: < 5MB growth per operation
```

### Performance Health
```
Typing speed: 60 WPM = ~5 keystrokes/sec
Operations per keystroke: N
Total ops/sec: 5 × N
Acceptable: < 100 ops/sec (< 20 patterns)
```

### Code Quality
```
Duplication percentage: X%
Acceptable: < 15%
Target: < 10%
```

### Security Health
```
Sanitized errors: X/Y (100% target)
Schema exposures: 0 (always)
Full logs server-side: Yes (always)
```

## Getting Help

### Quick Questions
- Check relevant `PREVENTION_N_*.md` file
- Search file for your scenario
- Use Quick Reference section

### Code Review Help
- Link to specific prevention guide section
- Include quick check results
- Reference code examples from guides

### Incident Response
1. Identify which category (memory/performance/duplication/security)
2. Open relevant prevention guide
3. Follow Emergency Fixes section
4. Run relevant tests to verify fix
5. Document in solution docs

## Resources

### Documentation
- `PREVENTION_STRATEGIES_INDEX.md` - Full index
- `PREVENTION_1_MEMORY_LEAKS_OBJECT_URLS.md` - Memory leaks
- `PREVENTION_2_PATTERN_MATCHING_PERFORMANCE.md` - Performance
- `PREVENTION_3_CODE_DUPLICATION.md` - Code duplication
- `PREVENTION_4_ERROR_MESSAGE_EXPOSURE.md` - Error exposure

### Tools
- Chrome DevTools (Memory, Performance)
- jscpd (duplication detection)
- grep (pattern search)
- Playwright (E2E testing)

### External
- [React Performance](https://react.dev/learn/render-and-commit)
- [OWASP Security](https://owasp.org/www-project-web-security-testing-guide/)
- [Web Vitals](https://web.dev/vitals/)

---

**Last Updated:** 2026-01-04
**Version:** 1.0
**Next Review:** 2026-02-04 (monthly)
