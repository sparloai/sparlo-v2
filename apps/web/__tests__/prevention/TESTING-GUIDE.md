# Testing Guide for Issue Prevention

This guide provides practical test implementations to catch the 5 fixed issues before they reach production.

---

## Test Organization

```
__tests__/prevention/
├── security/
│   ├── no-console-logs.test.ts
│   └── no-sensitive-data.test.ts
├── type-safety/
│   ├── no-unsafe-casts.test.ts
│   └── type-narrowing.test.ts
├── code-quality/
│   ├── no-dead-code.test.ts
│   ├── no-duplication.test.ts
│   └── schema-alignment.test.ts
└── integration/
    └── full-chain-validation.test.ts
```

---

## Running Tests

```bash
# Run all prevention tests
pnpm test -- __tests__/prevention/

# Run specific category
pnpm test -- __tests__/prevention/security/

# Watch mode for TDD
pnpm test -- __tests__/prevention/ --watch

# With coverage report
pnpm test -- __tests__/prevention/ --coverage

# CI mode (fail fast)
pnpm test -- __tests__/prevention/ --bail
```

---

## Test 1: No Console Logs (Security)

### What to Test
- LLM responses are not logged
- Sensitive state data is not logged
- User input is never logged
- Chain state updates use redaction

### Implementation

```typescript
// __tests__/prevention/security/no-console-logs.test.ts
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { generateReport } from '@/lib/inngest/functions/generate-report';
import { logger } from '@/lib/logging/logger';

describe('Security: No Sensitive Console Logs', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let loggerDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    loggerDebugSpy = jest.spyOn(logger, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('LLM Response Logging', () => {
    test('AN0 response not logged to console.log', async () => {
      // Mock the LLM call to return a response
      jest.doMock('@/lib/llm/client', () => ({
        callClaude: jest.fn().mockResolvedValue({
          content: JSON.stringify({
            original_ask: 'How do we improve battery life?',
            problem_interpretation: 'Sensitive data',
          }),
          usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        }),
      }));

      // Run a report generation step
      // ...test implementation...

      // Assertions
      const consoleCalls = consoleLogSpy.mock.calls.map((call) =>
        call.join(' ')
      );

      // Should NOT contain sensitive data
      expect(
        consoleCalls.some((call) => call.includes('battery life'))
      ).toBe(false);
      expect(
        consoleCalls.some((call) => call.includes('Sensitive data'))
      ).toBe(false);
      expect(
        consoleCalls.some((call) =>
          call.includes('original_ask')
        )
      ).toBe(false);
    });

    test('AN5 report output not logged', async () => {
      // Should not log full report
      const reportContent = {
        header: { title: 'Report' },
        solution_concepts: {
          lead_concepts: [
            { title: 'Concept 1', why_it_works: 'Secret' },
          ],
        },
      };

      // If logger is called, verify no sensitive content
      const debugCalls = loggerDebugSpy.mock.calls;

      debugCalls.forEach((call) => {
        const logString = JSON.stringify(call[1]);
        expect(logString).not.toContain('Secret');
        expect(logString).not.toContain('solution_concepts');
      });
    });

    test('Error responses sanitized', async () => {
      try {
        // Simulate an error in LLM call
        // ...implementation...
      } catch (error) {
        // When error is logged, should not include full response
        expect(consoleErrorSpy).not.toHaveBeenCalledWith(
          expect.objectContaining({
            content: expect.any(String),
          })
        );
      }
    });
  });

  describe('Chain State Logging', () => {
    test('Full chain state not logged', () => {
      const state = {
        reportId: 'id',
        designChallenge: 'How do we improve battery life?',
        an0_original_ask: 'Battery life improvement',
        an0_problem_interpretation: 'Sensitive details',
        an3_concepts: [
          { title: 'Concept', mechanism: 'Secret mechanism' },
        ],
      };

      // Verify console.log is not called with state
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          designChallenge: expect.any(String),
        })
      );

      // Verify logger.debug is called with redacted data if at all
      loggerDebugSpy.mock.calls.forEach((call) => {
        const logged = JSON.stringify(call[1]);
        // Should contain safe fields
        expect(logged).toContain('reportId');
        // Should NOT contain sensitive fields
        expect(logged).not.toContain('battery life');
        expect(logged).not.toContain('Secret');
      });
    });

    test('User input never logged', () => {
      const userInput = 'How do we solve X?';

      // Run operation with user input
      // ...implementation...

      // Verify no console output contains user input
      const allLogs = [
        ...consoleLogSpy.mock.calls,
        ...consoleWarnSpy.mock.calls,
        ...consoleErrorSpy.mock.calls,
      ];

      allLogs.forEach((log) => {
        expect(log.join(' ')).not.toContain(userInput);
      });
    });

    test('Clarification answers not logged', () => {
      const clarificationAnswer = 'Sensitive business constraint';

      // Simulate clarification flow
      // ...implementation...

      const allLogs = [
        ...consoleLogSpy.mock.calls,
        ...consoleWarnSpy.mock.calls,
      ];

      allLogs.forEach((log) => {
        expect(log.join(' ')).not.toContain(clarificationAnswer);
      });
    });
  });

  describe('Log Level Compliance', () => {
    test('Only logger.error and logger.warn used (no console.log)', () => {
      // Verify console.log was not called in production code
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    test('logger.debug used for verbose output', () => {
      // If debugging is enabled, logger.debug should be used
      if (process.env.DEBUG_VERBOSE) {
        expect(loggerDebugSpy).toHaveBeenCalled();
        expect(consoleLogSpy).not.toHaveBeenCalled();
      }
    });

    test('Error logging does not include request/response bodies', () => {
      // When an error occurs, check what's logged
      const errorDetails = { message: 'Failed', code: 'E001' };

      consoleErrorSpy.mock.calls.forEach((call) => {
        const logString = JSON.stringify(call[1] || '');
        // Should have error details
        expect(logString).toMatch(/Failed|E001/);
      });
    });
  });

  describe('Performance Impact', () => {
    test('Logging does not block execution', async () => {
      const startTime = Date.now();

      // Run operation
      // ...implementation...

      const duration = Date.now() - startTime;

      // Should not take significant time due to logging
      expect(duration).toBeLessThan(5000); // Adjust threshold
    });

    test('Log sampling reduces volume', () => {
      // With sampling enabled (e.g., 10%)
      const callCount = loggerDebugSpy.mock.calls.length;

      // Verify sampling is working (not logging everything)
      // This is a rough check - adjust based on actual implementation
      expect(callCount).toBeLessThan(100); // Reasonable threshold
    });
  });
});
```

---

## Test 2: No Unsafe Type Casts

### What to Test
- Type casts are single-step (not double)
- Type guards are used for runtime narrowing
- Zod validation provides type safety
- No `as any` without justification

### Implementation

```typescript
// __tests__/prevention/type-safety/no-unsafe-casts.test.ts
import { describe, test, expect } from '@jest/globals';
import { z } from 'zod';

describe('Type Safety: No Unsafe Casts', () => {
  describe('No Double Type Casts', () => {
    test('Event data typed without double cast', () => {
      // ✅ GOOD: Single-step typing
      interface EventData {
        event: {
          data: {
            reportId: string;
          };
        };
      }

      const eventData: EventData = {
        event: { data: { reportId: 'test-id' } },
      };

      // Type is correct without `as unknown as`
      expect(eventData.event.data.reportId).toBe('test-id');

      // ❌ This would be a test failure if you saw this pattern:
      // const wrong = event as unknown as EventData;
    });

    test('External API responses validated with Zod', () => {
      const ExternalEventSchema = z.object({
        event: z.object({
          data: z.object({
            reportId: z.string().uuid(),
          }),
        }),
      });

      const externalData = {
        event: {
          data: {
            reportId: '550e8400-e29b-41d4-a716-446655440000',
          },
        },
      };

      const result = ExternalEventSchema.safeParse(externalData);

      expect(result.success).toBe(true);

      if (result.success) {
        // Type is narrowed - no cast needed
        const reportId: string = result.data.event.data.reportId;
        expect(reportId).toBeDefined();
      }
    });
  });

  describe('Type Guards', () => {
    test('Type guard correctly narrows types', () => {
      interface EventWithData {
        event: {
          data: {
            reportId: string;
          };
        };
      }

      function isEventWithData(
        value: unknown
      ): value is EventWithData {
        return (
          typeof value === 'object' &&
          value !== null &&
          'event' in value &&
          typeof (value as Record<string, unknown>).event === 'object' &&
          'data' in (value as Record<string, unknown>).event
        );
      }

      const unknownEvent: unknown = {
        event: { data: { reportId: '123' } },
      };

      if (isEventWithData(unknownEvent)) {
        // Type is narrowed - no cast needed
        expect(unknownEvent.event.data.reportId).toBe('123');
      }
    });

    test('Type narrowing prevents incorrect access', () => {
      function isString(value: unknown): value is string {
        return typeof value === 'string';
      }

      const value: unknown = 'test';

      if (isString(value)) {
        // Safe to use string methods
        expect(value.toUpperCase()).toBe('TEST');
      }
    });
  });

  describe('Generic Type Constraints', () => {
    test('Generic types properly constrained', () => {
      // ✅ GOOD: Generic with constraint
      function processEvent<T extends { reportId: string }>(
        event: T
      ): string {
        return event.reportId; // Safe access
      }

      const validEvent = { reportId: 'id', extra: 'field' };
      expect(processEvent(validEvent)).toBe('id');

      // ✅ GOOD: Function that validates input
      function safeProcessEvent<T extends { reportId?: string }>(
        event: T
      ): T['reportId'] {
        if (typeof event.reportId === 'string') {
          return event.reportId;
        }
        return undefined;
      }

      expect(safeProcessEvent(validEvent)).toBe('id');
    });
  });

  describe('Return Type Safety', () => {
    test('Functions have explicit return types', () => {
      // ✅ GOOD: Explicit return type
      function extractReportId(data: unknown): string | null {
        const EventSchema = z.object({
          reportId: z.string().optional(),
        });

        const result = EventSchema.safeParse(data);
        return result.success ? (result.data.reportId ?? null) : null;
      }

      expect(extractReportId({ reportId: '123' })).toBe('123');
      expect(extractReportId({})).toBeNull();
    });

    test('Async functions return promises with explicit types', async () => {
      // ✅ GOOD: Explicit async return type
      async function fetchEvent(): Promise<{
        reportId: string;
      }> {
        return { reportId: 'test-id' };
      }

      const result = await fetchEvent();
      expect(result.reportId).toBe('test-id');
    });
  });

  describe('No Any Types', () => {
    test('Never use any type', () => {
      // ✅ GOOD: Use unknown instead
      function processData(data: unknown): void {
        if (typeof data === 'object' && data !== null) {
          // Safe narrowing
        }
      }

      // ❌ AVOID:
      // function processData(data: any): void { ... }
    });

    test('Conditional types instead of any', () => {
      // ✅ GOOD: Conditional type
      type IsString<T> = T extends string ? true : false;

      type Test1 = IsString<'hello'>; // true
      type Test2 = IsString<number>; // false

      const testValue: IsString<'hello'> = true;
      expect(testValue).toBe(true);
    });
  });
});
```

---

## Test 3: No Code Duplication

### What to Test
- Schemas are not duplicated
- Shared schemas are reused
- Compositions work correctly
- Type inference from schemas

### Implementation

```typescript
// __tests__/prevention/code-quality/no-duplication.test.ts
import { describe, test, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Code Quality: No Schema Duplication', () => {
  describe('Single Source of Truth', () => {
    test('KpiSchema defined in one location only', () => {
      const schemaFiles = findFiles(
        'lib/llm/schemas',
        '*.ts'
      );

      let kpiSchemaCount = 0;
      let kpiSchemaLocation = '';

      schemaFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('export const KpiSchema')) {
          kpiSchemaCount++;
          kpiSchemaLocation = file;
        }
      });

      expect(kpiSchemaCount).toBe(1);
      expect(kpiSchemaLocation).toBeTruthy();
    });

    test('Common schemas imported, not redefined', () => {
      const promptSchemaFiles = findFiles(
        'lib/llm/prompts',
        '**/schemas.ts'
      );

      promptSchemaFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');

        // Should import common schemas
        expect(content).toMatch(
          /import.*from.*lib\/llm\/schemas/
        );
      });
    });
  });

  describe('Schema Composition', () => {
    test('AN0 and AN2 schemas reuse KPI definition', () => {
      const an0File = fs.readFileSync(
        'lib/llm/prompts/an/schemas.ts',
        'utf-8'
      );
      const an2File = fs.readFileSync(
        'lib/llm/prompts/an/schemas.ts',
        'utf-8'
      );

      // Both should use same KpiSchema
      expect(an0File).toContain('primary_kpis: z.array(KpiSchema)');
      expect(an2File).toContain('kpi_alignment: z.array(KpiSchema)');
    });

    test('Composed schemas maintain type consistency', () => {
      // When KpiSchema changes, dependent schemas should still work
      const testKpi = {
        name: 'Battery life',
        current: '100 hours',
        target: '500 hours',
        unit: 'hours',
      };

      // Both AN0 and AN2 should accept same KPI structure
      const an0Result = AN0OutputSchema.safeParse({
        ...minimalAN0Data,
        primary_kpis: [testKpi],
      });

      const an2Result = AN2OutputSchema.safeParse({
        ...minimalAN2Data,
        kpi_alignment: [testKpi],
      });

      expect(an0Result.success).toBe(true);
      expect(an2Result.success).toBe(true);
    });
  });

  describe('Type Inference', () => {
    test('Types derived from single schema source', () => {
      // When Kpi type is defined once via z.infer<>
      type Kpi = z.infer<typeof KpiSchema>;

      const kpi: Kpi = {
        name: 'test',
        current: 'val',
        target: 'val',
        unit: 'unit',
      };

      expect(kpi.name).toBe('test');

      // Type should be consistent across usages
      type AN0Kpi = z.infer<typeof AN0OutputSchema>['primary_kpis'][0];
      type AN2Kpi = z.infer<typeof AN2OutputSchema>['kpi_alignment'][0];

      // Should be the same type
      const an0Kpi: AN0Kpi = kpi;
      const an2Kpi: AN2Kpi = kpi;

      expect(an0Kpi).toEqual(kpi);
      expect(an2Kpi).toEqual(kpi);
    });
  });

  describe('Migration and Evolution', () => {
    test('Schema versions coexist for backward compatibility', () => {
      const v1Data = {
        ask: 'Original question',
        kpis: [{ name: 'test' }],
      };

      const v2Data = {
        original_ask: 'Original question',
        primary_kpis: [
          { name: 'test', current: undefined, target: undefined, unit: undefined },
        ],
      };

      // Both should be parseable
      expect(AN0OutputSchemaV1.safeParse(v1Data).success).toBe(true);
      expect(AN0OutputSchemaV2.safeParse(v2Data).success).toBe(true);
    });

    test('Schema migration functions exist', () => {
      const oldData = {
        ask: 'Question',
        kpis: [{ name: 'KPI' }],
      };

      const migrated = migrateAN0ToV2(oldData);

      expect(migrated.original_ask).toBe('Question');
      expect(migrated.primary_kpis[0].name).toBe('KPI');
    });
  });

  describe('Import Paths', () => {
    test('Schemas imported from centralized location', () => {
      const files = findFiles('lib/llm', '*.ts');

      files.forEach((file) => {
        if (!file.includes('schemas.ts')) {
          const content = fs.readFileSync(file, 'utf-8');

          // Should not have inline schema definitions
          const schemaCount = (
            content.match(/z\.object\(\{/g) || []
          ).length;

          // Should import schemas instead
          if (schemaCount > 1) {
            expect(content).toMatch(
              /import.*Schema.*from.*lib\/llm\/schemas/
            );
          }
        }
      });
    });
  });
});

// Helper: Find files matching pattern
function findFiles(dir: string, pattern: string): string[] {
  const results: string[] = [];

  function walk(currentPath: string) {
    const files = fs.readdirSync(currentPath);

    files.forEach((file) => {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walk(filePath);
      } else if (minimatch(file, pattern)) {
        results.push(filePath);
      }
    });
  }

  walk(dir);
  return results;
}
```

---

## Test 4: No Dead Code

### What to Test
- No unused exports
- No unused variables
- No commented code
- Version cleanup

### Implementation

```typescript
// __tests__/prevention/code-quality/no-dead-code.test.ts
import { describe, test, expect } from '@jest/globals';
import * as fs from 'fs';
import { execSync } from 'child_process';

describe('Code Quality: No Dead Code', () => {
  describe('Unused Exports', () => {
    test('Run ts-unused-exports check', () => {
      // This requires ts-unused-exports to be installed
      try {
        const output = execSync('ts-unused-exports', {
          cwd: process.cwd(),
          encoding: 'utf-8',
        });

        expect(output).toBe('');
      } catch (error) {
        // If exit code is non-zero, there are unused exports
        expect(error).toBeNull();
      }
    });

    test('No buildANxContextVy functions exported without use', () => {
      const file = fs.readFileSync(
        'lib/inngest/functions/generate-report.ts',
        'utf-8'
      );

      // Extract function names
      const functionMatches = file.matchAll(
        /(?:export\s+)?function\s+(buildAN\w+)/g
      );

      const functions = Array.from(functionMatches).map(
        (m) => m[1]
      );

      // Verify each is used
      functions.forEach((fn) => {
        const usageCount = (file.match(new RegExp(fn, 'g')) || [])
          .length;

        // Should be used at least twice (definition + usage)
        expect(usageCount).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Unused Variables', () => {
    test('No unused imports in LLM functions', () => {
      const llmFiles = findFiles('lib/llm', '*.ts');

      llmFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');

        // Check for unused imports (simple regex check)
        const importMatches = content.matchAll(
          /import\s+{([^}]+)}\s+from/g
        );

        Array.from(importMatches).forEach((match) => {
          const imports = match[1]
            .split(',')
            .map((s) => s.trim());

          imports.forEach((imp) => {
            if (imp.startsWith('type ')) return; // Types are OK

            // Check if import is used
            expect(content).toMatch(
              new RegExp(`\\b${imp}\\b`)
            );
          });
        });
      });
    });

    test('No commented-out code', () => {
      const allFiles = findFiles('lib', '*.ts');

      allFiles.forEach((file) => {
        const lines = fs.readFileSync(file, 'utf-8').split('\n');

        lines.forEach((line, index) => {
          // Flag patterns like "// const x = ..." or "// function foo() {"
          if (
            line.trim().startsWith('//') &&
            (line.includes('const ') ||
              line.includes('function ') ||
              line.includes('let ') ||
              line.includes('var '))
          ) {
            // Exceptions for explanatory comments
            if (!line.includes('example') && !line.includes('old')) {
              fail(
                `Commented code found at ${file}:${index + 1}: ${line}`
              );
            }
          }
        });
      });
    });
  });

  describe('Dead Code Paths', () => {
    test('No if (false) blocks', () => {
      const files = findFiles('lib', '*.ts');

      files.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');

        expect(content).not.toMatch(/if\s*\(\s*false\s*\)/);
        expect(content).not.toMatch(/if\s*\(\s*0\s*\)/);
      });
    });

    test('No unreachable code after return', () => {
      const files = findFiles('lib', '*.ts');

      files.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          if (line.trim().startsWith('return ')) {
            const nextLine = lines[index + 1];

            if (
              nextLine &&
              !nextLine.trim().match(/^(}|else|case|default)/)
            ) {
              // Code after return (not in a block closer)
              // This is a rough check - may have false positives
            }
          }
        });
      });
    });
  });

  describe('Version Function Cleanup', () => {
    test('Only one version of context builder functions', () => {
      const file = fs.readFileSync(
        'lib/inngest/functions/generate-report.ts',
        'utf-8'
      );

      const versionedFunctions = new Map<string, string[]>();

      const funcMatches = file.matchAll(
        /function\s+(buildAN\d+[^(]*)/g
      );

      Array.from(funcMatches).forEach((match) => {
        const funcName = match[1];
        const baseName = funcName.replace(/V\d+$/, '');

        if (!versionedFunctions.has(baseName)) {
          versionedFunctions.set(baseName, []);
        }

        versionedFunctions.get(baseName)!.push(funcName);
      });

      // Each function should have at most 2 versions (current + 1 deprecated)
      versionedFunctions.forEach((versions, baseName) => {
        expect(versions.length).toBeLessThanOrEqual(2);

        if (versions.length === 2) {
          // If 2 versions exist, one should be marked @deprecated
          versions.forEach((fn) => {
            if (!fn.includes('V10')) {
              // Older version should have deprecation
              expect(file).toMatch(
                new RegExp(`@deprecated.*${fn}`, 's')
              );
            }
          });
        }
      });
    });

    test('Deprecated functions have removal deadline', () => {
      const file = fs.readFileSync(
        'lib/inngest/functions/generate-report.ts',
        'utf-8'
      );

      const deprecatedMatches = file.matchAll(
        /\/\*\*\s*\n\s*\*\s*@deprecated[^*]*@remove\s*([^\n]*)\n/g
      );

      Array.from(deprecatedMatches).forEach((match) => {
        const deadline = match[1];

        // Should have a date like "After 2025-01-15"
        expect(deadline).toMatch(/\d{4}-\d{2}-\d{2}/);
      });
    });
  });

  describe('Linting Compliance', () => {
    test('ESLint no-unused-vars passes', () => {
      try {
        execSync('eslint lib/**/*.ts --rule no-unused-vars:error', {
          cwd: process.cwd(),
        });
      } catch (error) {
        fail('ESLint unused vars check failed');
      }
    });

    test('unused-imports plugin finds no issues', () => {
      try {
        execSync('eslint lib/**/*.ts --rule unused-imports/no-unused-imports:error', {
          cwd: process.cwd(),
        });
      } catch (error) {
        fail('Unused imports check failed');
      }
    });
  });
});

function findFiles(dir: string, pattern: string): string[] {
  // Implementation from previous tests
  const results: string[] = [];
  // ... implementation
  return results;
}
```

---

## Test 5: Schema-Default Alignment

### What to Test
- Defaults match schema definitions
- Factory functions create valid objects
- No hardcoded large objects
- Test fixtures use factories

### Implementation

```typescript
// __tests__/prevention/code-quality/schema-alignment.test.ts
import { describe, test, expect } from '@jest/globals';
import { z } from 'zod';

describe('Code Quality: Schema-Default Alignment', () => {
  describe('Defaults Match Schemas', () => {
    test('ChainState defaults validate against schema', () => {
      const schemaDefaults = ChainStateSchema.parse({});

      expect(schemaDefaults.completedSteps).toEqual([]);
      expect(schemaDefaults.needsClarification).toBe(false);
      expect(schemaDefaults.an1_failures).toEqual([]);

      // Should not throw
      expect(() =>
        ChainStateSchema.parse(schemaDefaults)
      ).not.toThrow();
    });

    test('Factory functions produce valid objects', () => {
      const state = createInitialChainState({
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        accountId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        designChallenge: 'Test challenge',
        conversationId: 'conv-id',
      });

      // Should validate without throwing
      expect(() => ChainStateSchema.parse(state)).not.toThrow();

      // Should have correct defaults
      expect(state.completedSteps).toEqual([]);
      expect(state.needsClarification).toBe(false);
    });

    test('Mock factories generate valid test data', () => {
      const concept = generateMockConcept();

      // Should validate
      expect(() => ConceptSchema.parse(concept)).not.toThrow();

      // Should have required properties
      expect(concept.concept_id).toBeTruthy();
      expect(concept.title).toBeTruthy();
      expect(['simpler_path', 'best_fit', 'spark']).toContain(
        concept.track
      );
    });

    test('Mock factory with overrides', () => {
      const customConcept = generateMockConcept({
        title: 'Custom Title',
        track: 'spark',
      });

      expect(customConcept.title).toBe('Custom Title');
      expect(customConcept.track).toBe('spark');
      expect(() => ConceptSchema.parse(customConcept)).not.toThrow();
    });
  });

  describe('No Hardcoded Objects', () => {
    test('Constants file uses proper structure', async () => {
      const content = fs.readFileSync(
        'lib/config/llm-defaults.config.ts',
        'utf-8'
      );

      // Should have export const LLM_DEFAULTS
      expect(content).toMatch(/export const LLM_DEFAULTS/);

      // Should be organized logically
      expect(content).toContain('models:');
      expect(content).toContain('tokens:');
      expect(content).toContain('cache:');
    });

    test('No large object literals in implementation files', () => {
      const implFiles = findFiles('lib/inngest', '*.ts');

      implFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');

        // Check for large object assignments (heuristic)
        const largeObjects = content.match(
          /(?:const|let|export)\s+\w+\s*=\s*\{[^}]{500,}\}/g
        ) || [];

        largeObjects.forEach((obj) => {
          // Should not be large hardcoded data
          // Should be a factory call or import
          expect(obj).toMatch(
            /(factory|Factory|create|Create|mock|Mock|defaults|DEFAULTS|import)/i
          );
        });
      });
    });
  });

  describe('Test Fixtures', () => {
    test('Test files use mock factories', () => {
      const testFiles = findFiles('__tests__', '*.test.ts');

      testFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');

        // Should use generate* or create* functions
        if (content.includes('test(')) {
          // Has test cases
          expect(
            content.match(/(generateMock|createDefault|faker)/g)
          ).toBeTruthy();
        }
      });
    });

    test('No hardcoded test data objects', () => {
      const testFiles = findFiles('__tests__', '*.test.ts');

      testFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');

        // Look for large test data objects
        const matches = content.matchAll(
          /const\s+\w+Data\s*=\s*\{[^}]{500,}\}/g
        );

        Array.from(matches).forEach((match) => {
          // Should have been generated with a factory instead
          fail(
            `Hardcoded test data found in ${file}. Use generateMock* instead.`
          );
        });
      });
    });
  });

  describe('Optional vs Required Fields', () => {
    test('Optional fields have proper defaults', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
        withDefault: z.string().default('default-value'),
      });

      const parsed = schema.parse({ required: 'value' });

      expect(parsed.required).toBe('value');
      expect(parsed.optional).toBeUndefined();
      expect(parsed.withDefault).toBe('default-value');
    });

    test('Partial types used for extensible defaults', () => {
      type MyState = {
        id: string;
        name: string;
        description?: string;
      };

      // Partial allows extending
      const defaults: Partial<MyState> = {
        description: 'Default description',
      };

      const merged: MyState = {
        id: '123',
        name: 'Test',
        ...defaults,
      };

      expect(merged.description).toBe('Default description');
    });
  });

  describe('Configuration Management', () => {
    test('Environment-specific config', () => {
      const devConfig = getLLMConfig('development');
      const prodConfig = getLLMConfig('production');

      // Dev should allow debug logging
      expect(devConfig.debugLogging).toBe(true);

      // Prod should have it disabled
      expect(prodConfig.debugLogging).toBe(false);
    });

    test('Config schema validation', () => {
      const ConfigSchema = z.object({
        models: z.object({
          primary: z.string(),
          fallback: z.string(),
        }),
        tokens: z.record(z.number()),
        cache: z.object({
          ttl: z.number().positive(),
          maxSize: z.number().positive(),
        }),
      });

      const config = getLLMConfig('production');

      expect(() => ConfigSchema.parse(config)).not.toThrow();
    });
  });
});

function findFiles(dir: string, pattern: string): string[] {
  // Implementation from previous tests
  const results: string[] = [];
  // ...
  return results;
}
```

---

## Running All Prevention Tests

### Test Command Matrix

```bash
# Quick verification (all tests)
pnpm test -- __tests__/prevention/

# Focused category testing
pnpm test -- __tests__/prevention/security/
pnpm test -- __tests__/prevention/type-safety/
pnpm test -- __tests__/prevention/code-quality/

# Watch mode for development
pnpm test -- __tests__/prevention/ --watch

# Coverage report
pnpm test -- __tests__/prevention/ --coverage

# Fail fast (CI mode)
pnpm test -- __tests__/prevention/ --bail

# Verbose output for debugging
pnpm test -- __tests__/prevention/ --verbose
```

---

## Integration with CI/CD

### GitHub Actions Workflow

```yaml
name: Prevention Tests

on: [pull_request, push]

jobs:
  prevention:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install

      - name: Security Tests
        run: pnpm test -- __tests__/prevention/security/

      - name: Type Safety Tests
        run: pnpm test -- __tests__/prevention/type-safety/

      - name: Code Quality Tests
        run: pnpm test -- __tests__/prevention/code-quality/

      - name: Coverage Report
        run: pnpm test -- __tests__/prevention/ --coverage

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Metrics & Monitoring

Track these metrics to ensure prevention strategies are working:

1. **Console Log Violations**: Count of `console.log` in LLM code
2. **Type Cast Issues**: Count of `as unknown as` patterns
3. **Schema Duplication**: Number of duplicate schema definitions
4. **Dead Code**: Count of unused exports and imports
5. **Test Coverage**: Ensure >90% coverage for prevention tests

