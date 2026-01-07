# Today's Fixes - Quick Reference (2026-01-04)

> Print this page for your desk - covers memory leaks, performance, duplication, and error exposure

## 🔴 Red Flags - Stop and Fix

### Memory Leaks
```typescript
❌ const preview = URL.createObjectURL(file);
   // No matching revokeObjectURL!

✅ const preview = URL.createObjectURL(file);
   useEffect(() => () => URL.revokeObjectURL(preview), [preview]);
```

### Performance
```typescript
❌ <input onChange={(e) => heavyValidation(e.target.value)} />
   // Runs on every keystroke!

✅ const deferred = useDeferredValue(value);
   const valid = useMemo(() => heavyValidation(deferred), [deferred]);
```

### Duplication
```typescript
❌ // Same 50-line function in file-a.tsx and file-b.tsx

✅ // Shared hook: useSharedLogic() in both files
```

### Error Exposure
```typescript
❌ catch (error) { toast.error(error.message); }
   // Shows: "duplicate key violates constraint users_email_key"

✅ catch (error) {
     console.error(error); // Full error logged
     toast.error(sanitizeError(error)); // Safe for users
   }
```

## 🟡 30-Second Checks

```bash
# Memory leaks - creation count should ≤ revoke count
git diff | grep "URL.createObjectURL" -A 5 | grep "revokeObjectURL"

# Performance - all pattern matching should be optimized
git diff | grep "\.test(" | grep -v "useMemo\|useDeferredValue"

# Duplication - check similarity
npx jscpd --min-lines 10 --threshold 15 src/

# Error exposure - all errors should be sanitized
git diff | grep "error\.message" | grep -v "sanitizeError"
```

## 🟢 Golden Rules

### 1. One-to-One Rule
```
Every URL.createObjectURL must have exactly one URL.revokeObjectURL
```

### 2. Defer Expensive Operations
```
User Input → useDeferredValue → useMemo(expensive operation)
```

### 3. DRY at Third
```
First time: Write it
Second time: Note it
Third time: Extract it
```

### 4. Sanitize Always
```
Error → Log full (server) → Sanitize → Display
```

## 🔧 Emergency Fixes (Copy-Paste Ready)

### Fix Memory Leak (30 sec)
```typescript
// Add wherever URL.createObjectURL is used:
useEffect(() => {
  return () => {
    items.forEach(item => URL.revokeObjectURL(item.preview));
  };
}, [items]);
```

### Fix Performance (20 sec)
```typescript
// Wrap expensive operations:
const deferredValue = useDeferredValue(userInput);
const result = useMemo(
  () => expensiveOperation(deferredValue),
  [deferredValue]
);
```

### Fix Error Exposure (10 sec)
```typescript
// Replace error.message with:
import { sanitizeError } from '~/lib/security/sanitize-error';
toast.error(sanitizeError(error));
```

## 📊 Quick Metrics

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Memory growth | < 5MB/op | 5-20MB/op | > 20MB/op |
| Ops/keystroke | < 10 | 10-20 | > 20 |
| Code duplication | < 15% | 15-50% | > 50% |
| Sanitized errors | 100% | 90-99% | < 90% |

## 📋 Code Review Checklist

```
□ Memory: No URL.createObjectURL without cleanup
□ Memory: forceMount components have cleanup
□ Perf: Pattern matching is debounced/memoized
□ Perf: No heavy ops in onChange
□ Dup: No copy-paste from other files
□ Dup: Similarity < 15% (jscpd check)
□ Security: All errors sanitized
□ Security: No DB schema in errors
□ Tests added
□ CI passing
```

## 🎯 Priority

### P0 - Block Deploy
- Error showing DB schema
- Memory causing crashes

### P1 - Fix Now
- Memory > 50MB growth
- Duplication > 80%
- New error exposure

### P2 - Fix Soon
- Performance lag
- Duplication 50-80%

## 🔍 Search Commands

```bash
# Find all issues
grep -r "URL.createObjectURL" --include="*.tsx"
grep -r "\.test\(" --include="*.tsx" | grep -v "spec\|useMemo\|useDeferredValue"
npx jscpd --min-lines 10 src/
grep -r "error\.message" --include="*.tsx"

# Verify fixes
creates=$(grep -r "createObjectURL" src/ | wc -l)
revokes=$(grep -r "revokeObjectURL" src/ | wc -l)
echo "Creates: $creates (should be ≤ Revokes: $revokes)"
```

## 📚 Full Documentation

- **Index:** `PREVENTION_STRATEGIES_INDEX.md`
- **Memory:** `PREVENTION_1_MEMORY_LEAKS_OBJECT_URLS.md`
- **Performance:** `PREVENTION_2_PATTERN_MATCHING_PERFORMANCE.md`
- **Duplication:** `PREVENTION_3_CODE_DUPLICATION.md`
- **Security:** `PREVENTION_4_ERROR_MESSAGE_EXPOSURE.md`
- **Summary:** `PREVENTION_EXECUTIVE_SUMMARY.md`

---

**Print and keep at desk**
**Bookmark for quick access**
**Share with team**

Last Updated: 2026-01-04
