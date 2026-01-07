# Prevention Strategies: Fixed Issues & Best Practices

This document outlines actionable strategies to prevent the 5 critical issues that have been fixed in the codebase, organized with best practices, code review checklists, linting rules, and testing strategies.

---

## Issue 1: Console Statements Logging Sensitive LLM Output

### Problem
Console logs were exposing sensitive LLM outputs in production logs, creating security and privacy risks. This includes:
- Full AI responses containing user input
- Chain state data with sensitive problem details
- Token usage and cost information
- Raw JSON structures with sensitive content

**Severity**: HIGH - Data exposure in logs

---

### 1.1 Prevention Best Practices

#### A. Structured Logging with Levels
```typescript
// ✅ GOOD: Use structured logging with security levels
import { createLogger } from '@/lib/logging/logger';

const logger = createLogger('module-name');

// Safe for production
logger.info('Report generation started', { reportId, accountId });

// Only in development
logger.debug('Full chain state', state);

// Never include sensitive data
logger.error('Generation failed', {
  error: error.message, // NOT error object which might contain sensitive data
  step: 'an3-concept-generation',
  // ❌ NEVER: state, llmResponse, problemDescription
});
```

#### B. Redaction Patterns
```typescript
// ✅ GOOD: Redact sensitive fields before logging
function redactForLogging(state: ChainState) {
  return {
    reportId: state.reportId,
    step: state.currentStep,
    completedSteps: state.completedSteps,
    // Explicitly NOT including:
    // - an0_original_ask
    // - an3_concepts
    // - an5_report
  };
}

logger.debug('State checkpoint', redactForLogging(state));
```

#### C. Log Sampling for High-Volume Operations
```typescript
// ✅ GOOD: Sample logs to reduce volume while maintaining observability
const LOG_SAMPLE_RATE = 0.1; // Log 10% of operations

if (Math.random() < LOG_SAMPLE_RATE) {
  logger.debug('Processing chunk', {
    chunkId,
    size: chunk.length,
    // Safe metadata only
  });
}
```

#### D. Separate Debug Channels
```typescript
// ✅ GOOD: Use environment-specific logging
if (process.env.NODE_ENV === 'development') {
  // Only log sensitive data in development
  console.log('Full state:', state);
} else if (process.env.DEBUG_VERBOSE) {
  // Allow opt-in verbose logging in production
  logger.debug('State update', redactForLogging(state));
}
```

---

### 1.2 Code Review Checklist

- [ ] **No console.log/debug/error in LLM functions**
  - Search: `console\.(log|debug|error|warn)` in `lib/llm/**`
  - Check: LLM responses, chain state, validation results

- [ ] **No string interpolation of LLM outputs**
  - Flag: `` `... ${response} ...` `` containing LLM data
  - Flag: String concatenation with sensitive fields

- [ ] **API responses sanitized before logging**
  - Check: callClaude results
  - Check: Supabase RPC responses
  - Check: External API calls

- [ ] **Test/mock data not in production logs**
  - Check: Example report data not serialized
  - Check: Fixture data properly isolated

- [ ] **User problem statements hidden**
  - Check: designChallenge not logged
  - Check: clarificationAnswer not logged
  - Check: originalProblem not logged

---

### 1.3 Linting Rules

#### ESLint Configuration
```javascript
// .eslintrc.js additions
{
  rules: {
    'no-console': ['warn', {
      allow: ['error', 'warn'],
    }],
    // Disallow console.log, console.debug, console.info

    'no-restricted-syntax': ['error',
      {
        selector: 'CallExpression[callee.property.name="log"]',
        message: 'Use logger.log() instead of console.log()',
      },
      {
        selector: 'CallExpression[callee.property.name="debug"]',
        message: 'Use logger.debug() instead of console.debug()',
      },
      {
        selector: 'TemplateLiteral:has(Identifier[name="state"])',
        message: 'Never interpolate state into logs - use redactForLogging()',
      },
    ],
  }
}
```

#### Custom Rule: Sensitive Field Detection
```javascript
// eslint-plugin-security-rules/no-sensitive-logs.js
module.exports = {
  create(context) {
    const sensitiveFields = [
      'an0_original_ask',
      'designChallenge',
      'clarificationAnswer',
      'llmResponse',
      'response.content',
      'problemDescription',
    ];

    return {
      TemplateLiteral(node) {
        node.expressions.forEach(expr => {
          const name = expr.property?.name || expr.name;
          if (sensitiveFields.includes(name)) {
            context.report({
              node,
              message: `Sensitive field "${name}" detected in log. Use redactForLogging().`,
            });
          }
        });
      }
    };
  }
};
```

---

### 1.4 Testing Strategies

#### Test Suite: Console Output Detection
```typescript
// __tests__/security/no-console-logs.test.ts
describe('Security: No sensitive console logs', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  test('LLM response NOT logged to console', async () => {
    const response = {
      content: JSON.stringify({
        original_ask: 'How do we solve X?',
        concepts: [{ title: 'Secret concept' }],
      }),
      usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
    };

    await callClaude({
      model: MODELS.OPUS,
      system: 'test prompt',
      userMessage: 'test',
      maxTokens: 1000,
    });

    // Should NOT call console.log with response data
    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('original_ask')
    );
    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Secret concept')
    );
  });

  test('Chain state checkpoint uses redaction', async () => {
    const state = createInitialChainState({
      reportId: 'test-id',
      accountId: 'account-id',
      userId: 'user-id',
      designChallenge: 'How do we improve battery life?',
      conversationId: 'conv-id',
    });

    // If logging is enabled, it should be redacted
    if (process.env.DEBUG_VERBOSE) {
      const logged = captureLogger();
      // logged should NOT contain designChallenge
      expect(logged).not.toContain('battery life');
    }
  });

  test('Error responses sanitized in logging', async () => {
    try {
      await callClaude({
        model: MODELS.OPUS,
        system: 'test',
        userMessage: 'test',
        maxTokens: 1000,
      });
    } catch (error) {
      // Should NOT log full response content
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ content: expect.any(String) })
      );
    }
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });
});
```

#### Test Suite: Logger API Usage
```typescript
// __tests__/logging/logger.test.ts
describe('Logger API compliance', () => {
  test('debug() method used instead of console.debug()', () => {
    const logSpy = jest.spyOn(logger, 'debug');

    logger.debug('Processing step', { step: 'an3' });

    expect(logSpy).toHaveBeenCalledWith(
      'Processing step',
      expect.objectContaining({ step: 'an3' })
    );
  });

  test('Sensitive data redacted in debug logs', () => {
    const logSpy = jest.spyOn(logger, 'debug');
    const state = {
      reportId: 'id',
      designChallenge: 'secret',
      an0_original_ask: 'secret',
    };

    logger.debug('State', redactForLogging(state));

    const call = logSpy.mock.calls[0];
    expect(call[1]).toHaveProperty('reportId');
    expect(call[1]).not.toHaveProperty('designChallenge');
    expect(call[1]).not.toHaveProperty('an0_original_ask');
  });
});
```

#### E2E Test: Production Log Verification
```typescript
// e2e/security/no-sensitive-logs.spec.ts
test('Production logs contain no LLM response data', async () => {
  const logCapture = new LogCapture();

  // Run full report generation
  const reportId = await createReport({
    designChallenge: 'How do we improve battery life?',
    accountId: testAccount,
  });

  // Monitor logs
  await page.goto(`/app/reports/${reportId}`);
  await page.waitForLoadState('networkidle');

  const logs = logCapture.getAllLogs();

  // Assert no sensitive data in logs
  logs.forEach(log => {
    expect(log).not.toContain('How do we improve battery life');
    expect(log).not.toContain('problemDescription');
    expect(log).not.toContain('originalAsk');
  });
});
```

---

## Issue 2: Unsafe `as unknown as` Type Casts

### Problem
Double type casts (`as unknown as Type`) bypass TypeScript safety, hiding type errors and enabling runtime failures:
```typescript
// ❌ BAD: Unsafe double cast
const failureEvent = event as unknown as {
  event: { data: { reportId: string } };
};
```

**Severity**: MEDIUM - Type safety compromise

---

### 2.1 Prevention Best Practices

#### A. Proper Type Definition
```typescript
// ✅ GOOD: Define types properly, no casts needed
interface InngestFailureEvent {
  event: {
    data: {
      reportId: string;
    };
  };
}

// Use directly, no cast
const failureEvent: InngestFailureEvent = {
  event: { data: { reportId: 'id' } }
};
```

#### B. Type Guard Functions
```typescript
// ✅ GOOD: Use type guards instead of casts
function isInngestFailureEvent(
  value: unknown
): value is InngestFailureEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'event' in value &&
    typeof (value as any).event === 'object' &&
    'data' in (value as any).event &&
    typeof (value as any).event.data.reportId === 'string'
  );
}

// Usage
if (isInngestFailureEvent(event)) {
  const reportId = event.event.data.reportId; // Type safe!
}
```

#### C. Zod for Runtime Validation
```typescript
// ✅ GOOD: Use Zod schemas for validation with inferred types
import { z } from 'zod';

const InngestFailureEventSchema = z.object({
  event: z.object({
    data: z.object({
      reportId: z.string().uuid(),
    }),
  }),
});

type InngestFailureEvent = z.infer<typeof InngestFailureEventSchema>;

// Validate and get typed result
const result = InngestFailureEventSchema.safeParse(event);
if (result.success) {
  const reportId = result.data.event.data.reportId; // Type safe!
}
```

#### D. Partial Type Casts (Unavoidable Cases)
```typescript
// ✅ ACCEPTABLE: Single cast where necessary, with explanation
interface EventWithUnknownData {
  event: {
    data: Record<string, unknown>;
  };
}

// When receiving unknown structure from external system
function extractReportId(event: EventWithUnknownData): string | null {
  // Single cast is acceptable here - one step from external interface
  const reportId = (event.event.data as { reportId?: string }).reportId;
  return typeof reportId === 'string' ? reportId : null;
}
```

---

### 2.2 Code Review Checklist

- [ ] **No double casts (`as unknown as Type`)**
  - Search: `as unknown as`
  - Search: `as any as`
  - Require: Single-step casts with explanation only

- [ ] **Type definitions are complete**
  - Check: All function parameters typed
  - Check: All return types explicit
  - Check: No `any` types without justification

- [ ] **Runtime validation for external data**
  - Check: API responses validated with Zod
  - Check: Event handlers validate input
  - Check: Database results validated

- [ ] **Type guards used appropriately**
  - Check: Narrowing types before use
  - Check: instanceof checks for classes
  - Check: typeof checks for primitives

- [ ] **Generic types properly constrained**
  - Check: No `<unknown>` or `<any>`
  - Check: Extends clauses specify boundaries
  - Check: Conditional types used correctly

---

### 2.3 Linting Rules

#### ESLint Configuration
```javascript
// .eslintrc.js additions
{
  rules: {
    '@typescript-eslint/no-explicit-any': ['error', {
      fixToUnknown: false,
      ignoreRestArgs: false,
    }],

    '@typescript-eslint/no-unnecessary-type-assertion': 'error',

    // Custom rule: forbid double casts
    '@typescript-eslint/no-restricted-syntax': ['error',
      {
        selector: 'TSAsExpression > TSAsExpression',
        message: 'Double type casts (as X as Y) are not allowed. Use proper typing or Zod validation.',
      },
    ],
  }
}
```

#### Custom Rule: Detect Double Casts
```typescript
// eslint-plugin-typescript-safety/no-double-casts.ts
export const noDoubleCasts = {
  create(context) {
    return {
      'TSAsExpression > TSAsExpression'(node) {
        context.report({
          node,
          message: 'Avoid double type casts. Use type guards, Zod validation, or proper type definitions instead.',
          fix(fixer) {
            return null; // Manual fix required
          },
        });
      },
    };
  },
};
```

---

### 2.4 Testing Strategies

#### Test Suite: Type Safety
```typescript
// __tests__/type-safety/casts.test.ts
describe('Type Safety: No unsafe casts', () => {
  test('InngestFailureEvent properly typed without casts', () => {
    // This should compile without 'as unknown as'
    const event = {
      event: {
        data: {
          reportId: 'test-id',
        },
      },
    };

    // Type assertion should be needed
    const typed = event as typeof event; // This is fine - same type
    expect(typed.event.data.reportId).toBe('test-id');
  });

  test('Type guard validates event shape', () => {
    function isValidEvent(value: unknown): value is { event: { data: { reportId: string } } } {
      return (
        typeof value === 'object' &&
        value !== null &&
        'event' in value
      );
    }

    const validEvent = { event: { data: { reportId: '123' } } };
    const invalidEvent = { data: '123' };

    expect(isValidEvent(validEvent)).toBe(true);
    expect(isValidEvent(invalidEvent)).toBe(false);
  });

  test('Zod schema validates and provides type safety', () => {
    const EventSchema = z.object({
      event: z.object({
        data: z.object({
          reportId: z.string().uuid(),
        }),
      }),
    });

    const validData = {
      event: {
        data: {
          reportId: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
    };

    const result = EventSchema.safeParse(validData);
    expect(result.success).toBe(true);

    if (result.success) {
      // Type is now narrowed - no cast needed
      const reportId: string = result.data.event.data.reportId;
      expect(reportId).toBeDefined();
    }
  });
});
```

#### TypeScript Compilation Test
```typescript
// __tests__/type-safety/compilation.test.ts
describe('TypeScript compilation checks', () => {
  test('Compilation succeeds with proper typing', async () => {
    const output = await exec('tsc --noEmit --strict');
    expect(output.exitCode).toBe(0);
  });

  test('No "any" types in critical modules', async () => {
    const files = await glob('lib/llm/**/*.ts');

    files.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      const anyMatches = content.match(/:\s*any\b/g);

      expect(anyMatches).toBeNull();
    });
  });
});
```

---

## Issue 3: Duplicated Code Across Schemas

### Problem
Schema definitions were repeated across multiple files, leading to:
- Inconsistency when updating types
- Maintenance burden
- Risk of divergent schemas causing validation failures

**Severity**: MEDIUM - Maintainability and consistency

---

### 3.1 Prevention Best Practices

#### A. Centralized Schema Library
```typescript
// ✅ GOOD: lib/llm/schemas/common-schemas.ts
import { z } from 'zod';

// Single source of truth for shared schemas
export const KpiSchema = z.object({
  name: z.string(),
  current: z.string().optional(),
  target: z.string().optional(),
  unit: z.string().optional(),
});

export const ConstraintSchema = z.object({
  name: z.string(),
  reason: z.string(),
  flexibility: z.enum(['none', 'minimal', 'some']),
});

export const ValidationDataSchema = z.object({
  failure_patterns: z.array(z.string()),
  parameter_bounds: z.array(z.object({
    parameter: z.string(),
    range: z.string(),
  })),
});

// Exported types for use throughout codebase
export type Kpi = z.infer<typeof KpiSchema>;
export type Constraint = z.infer<typeof ConstraintSchema>;
export type ValidationData = z.infer<typeof ValidationDataSchema>;
```

#### B. Composition Over Duplication
```typescript
// ✅ GOOD: Reuse schemas through composition
import {
  KpiSchema,
  ConstraintSchema,
  ValidationDataSchema,
} from './common-schemas';

export const AN0OutputSchema = z.object({
  original_ask: z.string(),
  primary_kpis: z.array(KpiSchema), // Reuse!
  hard_constraints: z.array(ConstraintSchema), // Reuse!
  physics_of_problem: z.object({
    governing_principles: z.array(z.string()),
  }),
});

export const AN2OutputSchema = z.object({
  design_constraints: z.object({
    failure_modes_to_prevent: z.array(z.object({
      failure: z.string(),
      mechanism: z.string(),
      design_rule: z.string(),
    })),
    parameter_limits: z.array(z.object({
      parameter: z.string(),
      limit: z.string(),
      implication: z.string(),
    })),
  }),
  kpi_alignment: z.array(KpiSchema), // Reuse!
});
```

#### C. Schema Versioning for Evolution
```typescript
// ✅ GOOD: Version schemas and provide migration paths
export const AN0OutputSchemaV1 = z.object({
  // Old structure
  ask: z.string(),
  kpis: z.array(z.object({ name: z.string() })),
});

export const AN0OutputSchemaV2 = z.object({
  // New structure
  original_ask: z.string(),
  primary_kpis: z.array(KpiSchema), // Uses shared schema
});

// Migration function
function migrateAN0ToV2(oldData: z.infer<typeof AN0OutputSchemaV1>) {
  return {
    original_ask: oldData.ask,
    primary_kpis: oldData.kpis.map(kpi => ({
      name: kpi.name,
      current: undefined,
      target: undefined,
      unit: undefined,
    })),
  };
}

// Accept both versions
export const AN0OutputSchema = z.union([
  AN0OutputSchemaV1.transform(migrateAN0ToV2),
  AN0OutputSchemaV2,
]);
```

#### D. DRY Principle: Extract Repeated Patterns
```typescript
// ✅ GOOD: Extract repeated validation patterns
function createRangedSchema<T extends z.ZodTypeAny>(
  itemSchema: T,
  minItems = 0,
  maxItems?: number
) {
  return z.array(itemSchema).min(minItems).max(maxItems ?? 100);
}

const ConceptListSchema = createRangedSchema(ConceptSchema, 1, 8);
const CorpusResultsSchema = createRangedSchema(CorpusItemSchema, 0, 20);

// Or for object patterns
function createRankedEntrySchema(
  scoreMin = 1,
  scoreMax = 100
) {
  return z.object({
    id: z.string(),
    title: z.string(),
    score: z.number().min(scoreMin).max(scoreMax),
    rank: z.number().positive(),
  });
}

const ConceptRankSchema = createRankedEntrySchema(1, 100);
const ConceptSelectionSchema = createRankedEntrySchema(1, 10);
```

---

### 3.2 Code Review Checklist

- [ ] **No duplicated schema definitions**
  - Search: Same pattern in multiple files
  - Check: Common objects extracted to shared module
  - Check: All references use centralized schema

- [ ] **Schema composition is clear**
  - Check: Small, reusable schemas combined
  - Check: Complex schemas built from simpler ones
  - Check: Documentation explains composition

- [ ] **Types derived from single source**
  - Check: `z.infer<typeof Schema>` used consistently
  - Check: No manual type definitions duplicating schema
  - Check: All types in exports match schema structure

- [ ] **Migration paths documented**
  - Check: Comments explain schema evolution
  - Check: Old/new versions coexist if needed
  - Check: Transform functions handle compatibility

- [ ] **Tests cover schema changes**
  - Check: Existing data validates with new schema
  - Check: Migration functions tested
  - Check: Breaking changes documented

---

### 3.3 Linting Rules

#### ESLint Configuration
```javascript
// .eslintrc.js additions
{
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/schemas/**', '!**/lib/llm/schemas/**'],
            message: 'Import schemas from lib/llm/schemas only. Do not duplicate schema definitions.',
          }
        ]
      }
    ],
  }
}
```

#### Custom Rule: Detect Schema Duplication
```typescript
// eslint-plugin-schema-safety/no-duplicate-schemas.ts
export const noDuplicateSchemas = {
  create(context) {
    const schemas = new Map<string, string>();

    return {
      'ExportNamedDeclaration > VariableDeclaration'(node) {
        node.declarations.forEach(decl => {
          if (decl.id.name?.endsWith('Schema')) {
            const name = decl.id.name;
            const file = context.getFilename();

            if (schemas.has(name) && schemas.get(name) !== file) {
              context.report({
                node,
                message: `Schema "${name}" already defined in ${schemas.get(name)}. Import and reuse instead.`,
              });
            }
            schemas.set(name, file);
          }
        });
      },
    };
  },
};
```

---

### 3.4 Testing Strategies

#### Test Suite: Schema Consistency
```typescript
// __tests__/schemas/consistency.test.ts
describe('Schema Consistency', () => {
  test('All schemas compose from common definitions', () => {
    // Verify KpiSchema is used consistently
    const kpiSchemas = [
      AN0OutputSchema.pick({ primary_kpis: true }),
      AN4OutputSchema.shape.recommendations.shape.kpi_alignment,
    ];

    // All should produce same shape
    const testData = {
      name: 'Battery life',
      target: '500 hours',
      unit: 'hours',
    };

    kpiSchemas.forEach(schema => {
      expect(() => schema.parse([testData])).not.toThrow();
    });
  });

  test('Schema updates propagate across all uses', () => {
    // If KpiSchema is updated, all dependent schemas should still work
    const oldKpi = { name: 'test' };
    const newKpi = { name: 'test', current: 'value' };

    expect(() => KpiSchema.parse(newKpi)).not.toThrow();
    expect(() => AN0OutputSchema.parse({
      ...minimalAN0Data,
      primary_kpis: [newKpi],
    })).not.toThrow();
  });

  test('No duplicate schema definitions across files', async () => {
    const files = await glob('lib/llm/prompts/**/schemas.ts');
    const schemaNames = new Set<string>();

    files.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      const matches = content.matchAll(/export const (\w+Schema)/g);

      matches.forEach(match => {
        const name = match[1];
        expect(schemaNames).not.toContain(name);
        schemaNames.add(name);
      });
    });
  });
});
```

---

## Issue 4: Dead Code Accumulation

### Problem
Unused functions, variables, and imports create:
- Confusion about what code is active
- Maintenance overhead
- Risk of reverting to old patterns
- Increased bundle size

**Severity**: LOW to MEDIUM - Code clarity

---

### 4.1 Prevention Best Practices

#### A. Aggressive Unused Code Removal
```typescript
// ✅ GOOD: Remove functions that are no longer used
// If a function is replaced, remove the old one

// ❌ OLD (remove if not used):
// function buildAN1ContextV9(state: ChainState): string { ... }

// ✅ NEW (active version):
function buildAN1_5ContextV10(state: ChainState): string {
  // Active implementation
}

// When updating: DELETE old function entirely, don't comment out
```

#### B. Named Exports for Trackability
```typescript
// ✅ GOOD: Only export what's actually used
export { buildAN1_5ContextV10 };
export { buildAN1_7ContextV10 };
export { buildAN2ContextV10 };

// ❌ BAD: Exporting unused functions
export { buildAN1ContextV9 }; // If this isn't used, remove it
```

#### C. Comment Dead Code TEMPORARILY Only
```typescript
// ✅ GOOD: If keeping for reference, add clear expiration
/**
 * @deprecated Replaced by buildAN2ContextV10 on 2024-12-15
 * @remove After 2025-01-15 if no rollback needed
 * Reference: JIRA-1234
 */
function buildAN2ContextV9(state: ChainState): string {
  // Old implementation
}

// In 2-4 weeks: Delete this function entirely
```

#### D. Automated Unused Code Detection
```typescript
// ✅ GOOD: Use tools to detect unused exports
// package.json scripts:
{
  "scripts": {
    "check:unused": "unimported --ignore-patterns=node_modules",
    "check:deadcode": "ts-unused-exports --ignoreTests",
  }
}
```

---

### 4.2 Code Review Checklist

- [ ] **No commented-out code**
  - Search: `/\s*\/\//` followed by code
  - Check: If old version needed, use git history
  - Check: Large comment blocks should be deleted

- [ ] **No unused imports**
  - Check: All imports are referenced
  - Check: IDE "unused" warnings addressed
  - Search: Import statement without usage in file

- [ ] **No unused variables**
  - Check: Variable assigned but never read
  - Check: Function parameters all used
  - Check: Loop variables serve a purpose

- [ ] **No dead code paths**
  - Check: Unreachable code removed
  - Check: Dead branches eliminated
  - Check: No `if (false)` blocks

- [ ] **Version markers in function names**
  - Check: V10, V9 etc. suffixes removed when old version deleted
  - Check: Only current version functions exported
  - Check: Comments explain why old version kept (if temporary)

---

### 4.3 Linting Rules

#### ESLint Configuration
```javascript
// .eslintrc.js additions
{
  rules: {
    'no-unused-vars': ['error', {
      vars: 'all',
      args: 'after-used',
      argsIgnorePattern: '^_',
      caughtErrors: 'all',
    }],

    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],

    'no-undef': 'error',

    'no-constant-condition': ['error', {
      checkLoops: true,
    }],

    '@typescript-eslint/no-explicit-any': 'error',

    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': ['error', {
      vars: 'all',
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],
  }
}
```

#### Custom Rule: Enforce Version Cleanup
```typescript
// eslint-plugin-code-quality/enforce-version-cleanup.ts
export const enforceVersionCleanup = {
  create(context) {
    const versioned = new Map<string, string[]>();

    return {
      'ExportNamedDeclaration > FunctionDeclaration'(node) {
        const name = node.id.name;
        const versionMatch = name.match(/V(\d+)$/);

        if (versionMatch) {
          const baseName = name.replace(/V\d+$/, '');
          const versions = versioned.get(baseName) || [];
          versions.push(name);
          versioned.set(baseName, versions);
        }
      },

      'Program:exit'() {
        versioned.forEach((versions, baseName) => {
          if (versions.length > 2) {
            context.report({
              message: `Too many versions of "${baseName}": ${versions.join(', ')}. Remove old versions.`,
            });
          }
        });
      },
    };
  },
};
```

---

### 4.4 Testing Strategies

#### Test Suite: Dead Code Detection
```typescript
// __tests__/code-quality/dead-code.test.ts
describe('Dead Code Detection', () => {
  test('No unused functions in exports', async () => {
    const output = await exec('ts-unused-exports');
    expect(output.stdout).toBe(''); // No unused exports
  });

  test('No unused imports', async () => {
    const output = await exec('unimported');
    expect(output.stdout).toBe(''); // No unused imports
  });

  test('Version-suffixed functions cleaned up', async () => {
    const files = await glob('lib/**/*.ts');

    files.forEach(file => {
      const content = readFileSync(file, 'utf-8');

      // Should not have multiple versions exported
      const versions = content.match(/export.*V\d+/g) || [];
      versions.forEach(v => {
        const baseName = v.replace(/V\d+/, '');
        const allVersions = content.match(
          new RegExp(`export.*${baseName}V\\d+`, 'g')
        ) || [];

        if (allVersions.length > 2) {
          fail(`Multiple versions in ${file}: ${allVersions.join(', ')}`);
        }
      });
    });
  });

  test('No deprecated functions without expiration', async () => {
    const files = await glob('lib/**/*.ts');

    files.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      const deprecatedMatches = content.matchAll(
        /@deprecated[^*]*\*\//g
      );

      deprecatedMatches.forEach(match => {
        const block = match[0];
        expect(block).toMatch(/@remove.*\d{4}-\d{2}-\d{2}/);
      });
    });
  });
});
```

---

## Issue 5: Large Default Objects Duplicating Schema Definitions

### Problem
Large default objects were hardcoded instead of referencing schema definitions:
- Difficult to maintain when schema changes
- Risk of mismatches between defaults and schema
- Difficult to test
- Reduced clarity about what fields are required vs. optional

**Severity**: MEDIUM - Maintainability

---

### 5.1 Prevention Best Practices

#### A. Schema-Driven Defaults
```typescript
// ✅ GOOD: Generate defaults from schema
import { z } from 'zod';

const ConceptDefaultSchema = z.object({
  concept_id: z.string().default('C-001'),
  title: z.string().default('Unnamed Concept'),
  track: z.enum(['simpler_path', 'best_fit', 'spark']).default('best_fit'),
  mechanism_description: z.string().default(''),
  tradeoffs: z.array(z.string()).default([]),
});

// Extract defaults from schema
const CONCEPT_DEFAULTS = ConceptDefaultSchema.parse({});

// Type-safe and always in sync with schema
export const createDefaultConcept = (overrides?: Partial<typeof CONCEPT_DEFAULTS>) => ({
  ...CONCEPT_DEFAULTS,
  ...overrides,
});
```

#### B. Factory Functions Over Hardcoded Objects
```typescript
// ✅ GOOD: Use factories for complex defaults
export function createDefaultChainState(params: {
  reportId: string;
  accountId: string;
  userId: string;
}): ChainState {
  return {
    // Required fields
    reportId: params.reportId,
    accountId: params.accountId,
    userId: params.userId,
    conversationId: generateId(),
    userInput: '',

    // AN0 outputs (optional, defaults below)
    an0_original_ask: undefined,
    an0_problem_interpretation: undefined,
    an0_ambiguities_detected: [],

    // AN1 outputs
    an1_failures: [],
    an1_bounds: [],
    an1_transfers: [],
    an1_triz: [],

    // ... other outputs with proper defaults

    // Tracking
    needsClarification: false,
    completedSteps: [],
    startedAt: new Date().toISOString(),
  };
}
```

#### C. Partial/Optional Types for Defaults
```typescript
// ✅ GOOD: Use Partial for default object definitions
type ChainStateDefaults = Partial<ChainState>;

const DEFAULT_CHAIN_STATE: ChainStateDefaults = {
  completedSteps: [],
  needsClarification: false,
  an1_failures: [],
  an1_bounds: [],
  an1_transfers: [],
  an1_triz: [],
  an1_5_triz_exemplars: [],
  an1_5_transfer_exemplars: [],
  an1_5_failure_patterns: [],
  an1_5_parameter_bounds: [],
  an1_5_corpus_gaps: [],
};

// Apply defaults with required fields
export function initializeChainState(
  required: Pick<ChainState, 'reportId' | 'accountId' | 'userId'>,
): ChainState {
  return ChainStateSchema.parse({
    ...DEFAULT_CHAIN_STATE,
    ...required,
  });
}
```

#### D. Test Fixtures from Schemas
```typescript
// ✅ GOOD: Generate test fixtures from schemas
import { faker } from '@faker-js/faker';

export function generateMockConcept(
  overrides?: Partial<Concept>
): Concept {
  return ConceptSchema.parse({
    concept_id: `C-${faker.number.int({ min: 1, max: 999 })}`,
    title: faker.lorem.words(3),
    track: faker.helpers.arrayElement(['simpler_path', 'best_fit', 'spark']),
    mechanism_description: faker.lorem.paragraphs(1),
    mechanistic_depth: {
      working_principle: faker.lorem.paragraph(),
      rate_limiting_step: faker.lorem.sentence(),
      key_parameters: faker.helpers.multiple(faker.lorem.word, { count: 3 }),
      failure_modes: faker.helpers.multiple(faker.lorem.sentence, { count: 2 }),
    },
    innovation_source: {
      pattern_used: faker.lorem.word(),
      novelty_claim: faker.lorem.sentence(),
    },
    feasibility_check: {
      bounds_compliance: [],
      failure_mode_risks: [],
      manufacturing: 'Standard',
      materials: 'Off-shelf',
      overall_feasibility: 'HIGH',
    },
    validation_path: {
      first_test: {
        name: faker.lorem.sentence(),
        method: faker.lorem.sentence(),
        go_threshold: '80%',
        no_go_threshold: '50%',
      },
      critical_unknowns: [],
      kill_conditions: [],
    },
    expected_impact: {
      primary_kpi_improvement: faker.lorem.sentence(),
      confidence: 'HIGH',
      basis: faker.lorem.sentence(),
    },
    tradeoffs: faker.helpers.multiple(faker.lorem.sentence, { count: 2 }),
    ...overrides,
  });
}
```

#### E. Centralized Configuration
```typescript
// ✅ GOOD: Centralize constants and defaults
// lib/config/llm-defaults.config.ts
export const LLM_DEFAULTS = {
  models: {
    primary: 'claude-opus-4-5-20251101',
    fallback: 'claude-3-5-sonnet-20241022',
  },
  tokens: {
    an0: 8000,
    an1_5: 8000,
    an1_7: 8000,
    an2: 8000,
    an3: 24000,
    an4: 16000,
    an5: 24000,
  },
  cache: {
    ttl: 3600,
    maxSize: 100,
  },
} as const;

// Use in functions
export async function runAN0(state: ChainState) {
  const { content, usage } = await callClaude({
    model: LLM_DEFAULTS.models.primary,
    maxTokens: LLM_DEFAULTS.tokens.an0,
    // ...
  });
}
```

---

### 5.2 Code Review Checklist

- [ ] **No hardcoded large objects**
  - Search: Object literals with 5+ properties
  - Check: Are these derived from a schema?
  - Check: Are these in a separate constants file?

- [ ] **Defaults are schema-aware**
  - Check: Zod schema has defaults defined
  - Check: Runtime values match schema defaults
  - Check: Factory functions use schema parsing

- [ ] **Test fixtures use factories**
  - Check: `generateMock*` functions exist
  - Check: Fixtures use `faker` or schema-based generation
  - Check: No hardcoded fixture data

- [ ] **Constants separated from logic**
  - Check: Magic values in own file
  - Check: Centralized token/config limits
  - Check: Easy to update without touching implementation

- [ ] **Optional fields properly marked**
  - Check: `z.optional()` vs `.default()`
  - Check: Partial types used for extensible objects
  - Check: Documentation explains which fields are required

---

### 5.3 Linting Rules

#### ESLint Configuration
```javascript
// .eslintrc.js additions
{
  rules: {
    'no-magic-numbers': ['error', {
      ignore: [0, 1, -1],
      enforceConst: true,
      ignoreArrayIndexes: true,
    }],

    '@typescript-eslint/no-hardcoded-defaults': ['error', {
      'object': {
        minProps: 3,
        message: 'Large objects should use factory functions or be derived from schemas',
      }
    }],
  }
}
```

#### Custom Rule: Enforce Schema-Driven Defaults
```typescript
// eslint-plugin-schema-safety/enforce-defaults.ts
export const enforceSchemaDefaults = {
  create(context) {
    return {
      'ObjectExpression[parent.id.name=/^[A-Z_]+_DEFAULTS?$/]'(node) {
        // Check if there's a corresponding schema
        const fileName = context.getFilename();
        const schemaPath = fileName.replace('.ts', '.schema.ts');

        if (!fs.existsSync(schemaPath)) {
          context.report({
            node,
            message: 'Large default objects should be derived from a schema. Create a .schema.ts file.',
          });
        }
      },
    };
  },
};
```

---

### 5.4 Testing Strategies

#### Test Suite: Schema-Default Alignment
```typescript
// __tests__/schemas/defaults.test.ts
describe('Schema Defaults Alignment', () => {
  test('ChainState defaults match schema', () => {
    const schemaDefaults = ChainStateSchema.parse({});

    // Verify key defaults exist
    expect(schemaDefaults.completedSteps).toEqual([]);
    expect(schemaDefaults.needsClarification).toBe(false);
    expect(schemaDefaults.an1_failures).toEqual([]);
  });

  test('Factory function respects schema', () => {
    const state = createInitialChainState({
      reportId: 'test-id',
      accountId: 'account-id',
      userId: 'user-id',
      designChallenge: 'test',
      conversationId: 'conv-id',
    });

    // Validate against schema
    expect(() => ChainStateSchema.parse(state)).not.toThrow();
  });

  test('Concept defaults generate valid concepts', () => {
    const concept = generateMockConcept();

    expect(() => ConceptSchema.parse(concept)).not.toThrow();
    expect(concept.concept_id).toMatch(/^C-/);
    expect(['simpler_path', 'best_fit', 'spark']).toContain(concept.track);
  });

  test('No hardcoded objects diverge from schema', async () => {
    const files = await glob('lib/**/*.ts');

    files.forEach(file => {
      if (file.includes('schema.ts')) return;

      const content = readFileSync(file, 'utf-8');
      const largeObjects = content.match(
        /(?:const|let|export)\s+\w+\s*=\s*\{[^}]{500,}\}/g
      ) || [];

      largeObjects.forEach(obj => {
        expect(obj).toMatch(/factory|Factory|defaults|DEFAULTS|mock|Mock/i);
      });
    });
  });
});
```

---

## Cross-Cutting Concerns

### Code Organization Summary

| Issue | Prevention | Linting | Testing |
|-------|-----------|---------|---------|
| **Console Logs** | Structured logger API | `no-console`, `no-restricted-syntax` | Log capture tests, spy checks |
| **Unsafe Casts** | Type guards, Zod validation | `no-explicit-any`, `no-double-casts` | Type compilation, narrowing |
| **Code Duplication** | Centralized schemas, composition | `no-restricted-imports`, custom | Schema consistency tests |
| **Dead Code** | Immediate deletion, version cleanup | `no-unused-vars`, `enforce-version-cleanup` | Tool-based detection |
| **Large Defaults** | Schema-driven factories | `no-magic-numbers`, `enforce-defaults` | Schema alignment tests |

---

## Continuous Integration Checklist

### Pre-Commit Hooks
```bash
#!/bin/bash
# .husky/pre-commit

# Run type checking
pnpm typecheck || exit 1

# Run linting
pnpm lint:fix || exit 1

# Check for console logs (in LLM code)
if grep -r "console\\.log" lib/llm --include="*.ts"; then
  echo "ERROR: console.log found in LLM code"
  exit 1
fi

# Check for double casts
if grep -r "as unknown as" lib --include="*.ts"; then
  echo "ERROR: Double type casts found"
  exit 1
fi

# Run security tests
pnpm test -- security/
```

### CI Pipeline (GitHub Actions)
```yaml
name: Code Quality

on: [pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test -- security/
      - run: pnpm check:unused
      - run: pnpm check:deadcode

  schemas:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm test -- schemas/

  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm test -- --coverage
      - uses: codecov/codecov-action@v3
```

---

## Training & Documentation

### Developer Checklist
When implementing new features, ensure:

- [ ] Define Zod schemas first
- [ ] Export types from schemas using `z.infer<>`
- [ ] Use type guards or `safeParse()` for external data
- [ ] No `console.log` - use logger API instead
- [ ] No commented-out code - delete or branch
- [ ] Reuse existing schemas - check `lib/llm/schemas/`
- [ ] Create factory functions for complex defaults
- [ ] Test schema alignment before merging

---

## Conclusion

These five issues represent common patterns that can be systematically prevented through:

1. **Proper tooling**: ESLint rules, TypeScript strict mode, schema validation
2. **Code review discipline**: Checklists targeting specific issues
3. **Automated testing**: Tests that catch regressions early
4. **Developer practices**: Using factories, type guards, centralized schemas

By implementing these strategies across the team, you'll maintain code quality while avoiding regressions into these patterns.
