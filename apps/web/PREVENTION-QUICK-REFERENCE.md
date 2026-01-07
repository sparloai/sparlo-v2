# Prevention Strategies - Quick Reference

## The 5 Issues at a Glance

| Issue | Problem | Prevention | Detection | Fix |
|-------|---------|-----------|-----------|-----|
| **1. Console Logging** | Sensitive LLM data in logs | Use logger API, redact data | `eslint no-console` | Replace `console.log` with `logger.info/debug` |
| **2. Unsafe Casts** | `as unknown as` bypasses types | Use Zod validation, type guards | `eslint no-double-casts` | Use `z.safeParse()` or type guards |
| **3. Code Duplication** | Schemas repeated across files | Centralize schemas, compose | Grep for duplicate names | Create `lib/llm/schemas/common.ts` |
| **4. Dead Code** | Old functions not removed | Delete immediately, no comments | `ts-unused-exports` | Run cleanup before merge |
| **5. Large Defaults** | Hardcoded objects vs schema | Factory functions from schemas | `no-magic-numbers` rule | Use `createDefault*()` factories |

---

## Developer Checklist (Before PR)

```
❌ Console.log found in lib/llm code?
   → Change to: logger.info() or logger.debug()

❌ Type casts like 'as unknown as' found?
   → Change to: z.safeParse() or type guard function

❌ Schemas defined in multiple files?
   → Move to: lib/llm/schemas/ and import

❌ Old version functions still in code?
   → Action: Delete them, use git history if needed

❌ Large hardcoded objects (>5 properties)?
   → Change to: Factory function or z.parse()

❌ TypeScript compilation errors?
   → Run: pnpm typecheck
```

---

## Quick Fixes

### Fix 1: Console Logs
```typescript
// ❌ BEFORE
console.log('Processing:', state, response);

// ✅ AFTER
import { logger } from '@/lib/logging/logger';
logger.info('Processing started', { reportId: state.reportId });
```

### Fix 2: Unsafe Casts
```typescript
// ❌ BEFORE
const event = data as unknown as EventType;

// ✅ AFTER
const EventSchema = z.object({ /* ... */ });
const result = EventSchema.safeParse(data);
if (result.success) {
  const event = result.data;
}
```

### Fix 3: Duplicate Schemas
```typescript
// ❌ BEFORE (in two files)
const KpiSchema = z.object({ name: z.string(), ... });

// ✅ AFTER (common-schemas.ts)
export const KpiSchema = z.object({ ... });

// (in both files)
import { KpiSchema } from './common-schemas';
```

### Fix 4: Dead Code
```typescript
// ❌ BEFORE
function oldFunction() { }  // Not used
function newFunction() { }

// ✅ AFTER
// DELETE oldFunction entirely
// Only keep: function newFunction() { }
```

### Fix 5: Large Defaults
```typescript
// ❌ BEFORE
const DEFAULT_CONCEPT = {
  concept_id: 'C-001',
  title: 'Unnamed',
  track: 'best_fit',
  // ... 10+ more properties
};

// ✅ AFTER
export function createDefaultConcept(
  overrides?: Partial<Concept>
): Concept {
  return ConceptSchema.parse({
    concept_id: 'C-001',
    title: 'Unnamed',
    track: 'best_fit',
    ...overrides,
  });
}
```

---

## Pre-Commit Checklist

Run before pushing:
```bash
# 1. Type check
pnpm typecheck

# 2. Lint
pnpm lint:fix

# 3. Security scan
grep -r "console\.log" lib/llm --include="*.ts" && echo "ERROR: Remove logs" || true
grep -r "as unknown as" lib --include="*.ts" && echo "ERROR: Remove double casts" || true

# 4. Tests
pnpm test -- __tests__/prevention/

# 5. Unused code
pnpm check:unused
```

---

## Code Review Comments (Use These)

### For Console Logs
```
This logs sensitive data. Please use the logger API instead:
import { logger } from '@/lib/logging/logger';
logger.info('Event', { reportId, accountId });  // Not state or response
```

### For Type Casts
```
Avoid double casts (as unknown as). This bypasses type safety.
Instead, use Zod validation:
const result = MySchema.safeParse(data);
if (result.success) { const typed = result.data; }
```

### For Duplication
```
This schema is defined elsewhere. Import from lib/llm/schemas/:
import { KpiSchema } from '@/lib/llm/schemas';
```

### For Dead Code
```
This function isn't used. Please delete it entirely.
If you need the old version later, retrieve it from git history.
```

### For Hardcoded Objects
```
This large object should be generated from the schema.
Use a factory function:
export function createDefaultX(overrides?: Partial<X>): X {
  return XSchema.parse({ ...defaults, ...overrides });
}
```

---

## ESLint Commands

```bash
# Find console logs
eslint . --rule no-console:error

# Find unsafe casts
grep -r "as unknown as" .

# Find unused vars
eslint . --rule @typescript-eslint/no-unused-vars:error

# Find duplicate exports
ts-unused-exports

# Find magic numbers
eslint . --rule no-magic-numbers:error
```

---

## Test Commands

```bash
# All prevention tests
pnpm test -- __tests__/prevention/

# Specific test file
pnpm test -- __tests__/prevention/security/no-console-logs.test.ts

# Watch mode
pnpm test -- __tests__/prevention/ --watch

# Coverage
pnpm test -- __tests__/prevention/ --coverage
```

---

## Key Files to Know

| Purpose | File |
|---------|------|
| **Logging API** | `lib/logging/logger.ts` |
| **Common Schemas** | `lib/llm/schemas/common-schemas.ts` |
| **Chain State Type** | `lib/llm/schemas/chain-state.ts` |
| **Config Defaults** | `lib/config/llm-defaults.config.ts` |
| **Prevention Rules** | `.eslintrc.prevention.js` |
| **Test Guide** | `__tests__/prevention/TESTING-GUIDE.md` |
| **Full Documentation** | `PREVENTION-STRATEGIES.md` |

---

## Common Mistakes to Avoid

```typescript
// ❌ Mistake 1: Logging sensitive data
console.log('State:', state);  // BAD!
console.log('Response:', response.content);  // BAD!

// ✅ Correct
logger.info('State checkpoint', { reportId: state.reportId });

// ❌ Mistake 2: Double casting
const event = data as unknown as EventType;  // BAD!

// ✅ Correct
const result = EventSchema.safeParse(data);
const event = result.success ? result.data : null;

// ❌ Mistake 3: Duplicating schemas
// In file A:
const KpiSchema = z.object({ name: z.string() });
// In file B:
const KpiSchema = z.object({ name: z.string() });  // DUPLICATE!

// ✅ Correct
// lib/llm/schemas/common.ts:
export const KpiSchema = z.object({ name: z.string() });
// Both files:
import { KpiSchema } from '@/lib/llm/schemas/common';

// ❌ Mistake 4: Keeping old code
// function oldVersion() { ... }  // Don't do this!
// function newVersion() { ... }

// ✅ Correct
// DELETE oldVersion entirely

// ❌ Mistake 5: Hardcoded large objects
const DEFAULT = {
  field1: 'val1',
  field2: 'val2',
  field3: 'val3',
  // ... 20 more fields hardcoded
};

// ✅ Correct
export function createDefault(overrides?: Partial<Type>): Type {
  return TypeSchema.parse({ ...schemaDefaults, ...overrides });
}
```

---

## When in Doubt

**Question**: How do I handle X?
**Answer**: Check these in order:
1. Existing code patterns in `lib/inngest/functions/`
2. Type schemas in `lib/llm/schemas/`
3. Logger usage in active files (not console)
4. Zod validation patterns in `lib/llm/prompts/*/schemas.ts`
5. Test examples in `__tests__/prevention/`

---

## Getting Help

| Problem | Solution |
|---------|----------|
| "How do I log safely?" | See `lib/logging/logger.ts` or contact lead |
| "Is this code duplicated?" | Grep for pattern, check `lib/llm/schemas/` |
| "Can I use `any` type?" | No. Use Zod validation or type guards instead |
| "Should I comment out old code?" | No. Delete it. Use git history if needed |
| "How do I create defaults?" | Create factory function using `schema.parse()` |

---

## Success Metrics

Track these to measure prevention effectiveness:

- **0** console.log violations in LLM code ✓
- **0** double type casts (`as unknown as`) ✓
- **1** definition per schema (no duplicates) ✓
- **0** commented-out code blocks ✓
- **0** large hardcoded object literals ✓
- **100%** of schemas used via factory functions ✓
- **90%+** test coverage for prevention checks ✓

---

## Resources

- Full guide: `PREVENTION-STRATEGIES.md`
- Testing guide: `__tests__/prevention/TESTING-GUIDE.md`
- ESLint rules: `.eslintrc.prevention.js`
- Logger API: `lib/logging/logger.ts`
- Schema patterns: `lib/llm/schemas/`

