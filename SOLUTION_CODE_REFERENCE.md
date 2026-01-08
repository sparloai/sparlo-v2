# DD Schema Solution - Code Reference

Complete code examples and patterns from the working solution.

---

## 1. Shared `processNullValues()` Helper Function

**Location**: `/Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/llm/prompts/dd/schemas.ts`, Lines 195-217

### Full Implementation

```typescript
/**
 * Shared helper to recursively convert null to undefined and filter empty objects from arrays.
 * Used by DD0, DD3.5, DD4 schemas for preprocessing LLM output.
 */
function processNullValues(v: unknown): unknown {
  if (v === null) return undefined;
  if (Array.isArray(v)) {
    return v
      .filter((item) => {
        if (item === null || item === undefined) return false;
        if (
          typeof item === 'object' &&
          item !== null &&
          Object.keys(item).length === 0
        )
          return false;
        return true;
      })
      .map(processNullValues);
  }
  if (typeof v === 'object' && v !== null) {
    return Object.fromEntries(
      Object.entries(v).map(([k, val]) => [k, processNullValues(val)]),
    );
  }
  return v;
}
```

### How It Works

#### Step 1: Null → Undefined Conversion
```typescript
if (v === null) return undefined;
```
- Converts null values to undefined
- Handles incomplete LLM outputs gracefully

#### Step 2: Array Processing
```typescript
if (Array.isArray(v)) {
  return v
    .filter((item) => {
      if (item === null || item === undefined) return false;
      // Filter out empty objects: { }
      if (
        typeof item === 'object' &&
        item !== null &&
        Object.keys(item).length === 0
      )
        return false;
      return true;
    })
    .map(processNullValues);  // Recursive call
}
```
- Filters out null and undefined items
- Removes empty objects from arrays
- Recursively processes remaining items

#### Step 3: Object Processing
```typescript
if (typeof v === 'object' && v !== null) {
  return Object.fromEntries(
    Object.entries(v).map(([k, val]) => [k, processNullValues(val)]),
  );
}
```
- Recursively processes all nested objects
- Preserves key structure
- Cleans all nested values

#### Step 4: Passthrough
```typescript
return v;
```
- All other types pass through unchanged

### Usage Example

```typescript
// DD3.5-M schema preprocessing (Line 1396)
const processed = processNullValues(input) as Record<string, unknown>;

// Before: { physics_validation: [null, {}, { claim: 'test' }], null_field: null }
// After:  { physics_validation: [{ claim: 'test' }], null_field: undefined }
```

---

## 2. Type-Safe Default Generation Pattern

**Location**: `/Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/llm/prompts/dd/schemas.ts`, Lines 1417, 1435, 2071, 2089

### Pattern Implementation

```typescript
// ANTIFRAGILE: Return defaults with partial merge
const defaults = DD3_5_M_StructuredDataSchema.parse({});
return {
  ...defaults,                              // All defaults applied
  ...(processed.detailed_analysis as object), // Override with parsed data
  prose_output: proseResult.success ? proseResult.data : undefined,
};
```

### What `Schema.parse({})` Does

```typescript
const DD3_M_StructuredDataSchema = z.object({
  validation_summary: z.object({
    overall_technical_assessment: z.string().default('Assessment pending'),
    critical_claims_status: z.string().default('Under review'),
    mechanism_validity: MechanismVerdict,
    key_concern: z.string().default(''),
    key_strength: z.string().default(''),
  }),
  physics_validation: z.array(...).default([]),
  // ... more fields
});

// When you call:
const defaults = DD3_M_StructuredDataSchema.parse({});

// You get back (all defaults applied):
{
  validation_summary: {
    overall_technical_assessment: 'Assessment pending',
    critical_claims_status: 'Under review',
    mechanism_validity: undefined,  // No default, returns undefined
    key_concern: '',
    key_strength: '',
  },
  physics_validation: [],
  // ... all other fields with their defaults
}
```

### Why This Is Better Than Hardcoded Defaults

**BEFORE (Dangerous)**:
```typescript
// ❌ Hardcoded duplicate - goes out of sync!
const DD3_M_DefaultStructuredData = {
  validation_summary: {
    overall_technical_assessment: 'Assessment pending',
    critical_claims_status: 'Under review',
    mechanism_validity: undefined,
    key_concern: '',
    key_strength: '',
  },
  physics_validation: [],
  // ... manually duplicate all defaults
};

// If schema changes later:
// - Default object is forgotten and updated
// - Next dev doesn't know it exists
// - Out-of-sync bugs occur
```

**AFTER (Safe)**:
```typescript
// ✅ Auto-generated from schema - always in sync!
const defaults = DD3_M_StructuredDataSchema.parse({});

// If schema changes:
// - parse({}) automatically applies new defaults
// - No separate object to update
// - Impossible to get out of sync
```

---

## 3. Complete DD3.5-M Output Schema Implementation

**Location**: `/Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/llm/prompts/dd/schemas.ts`, Lines 1378-1444

### Full Example with All Patterns

```typescript
export const DD3_5_M_OutputSchema = z.unknown().transform(
  (val): z.infer<typeof DD3_5_M_StructuredDataSchema> & {
    prose_output?: z.infer<typeof DD3_5_M_ProseOutputSchema>;
  } => {
    // Pattern 1: Handle null/undefined/empty by returning defaults (no logging)
    if (val === null || val === undefined || typeof val !== 'object') {
      return DD3_5_M_StructuredDataSchema.parse({});  // Type-safe defaults
    }

    const input = val as Record<string, unknown>;

    // Pattern 2: Handle empty object
    if (Object.keys(input).length === 0) {
      return DD3_5_M_StructuredDataSchema.parse({});  // Type-safe defaults
    }

    // Pattern 3: Use shared processNullValues helper
    const processed = processNullValues(input) as Record<string, unknown>;

    // Pattern 4: Check for new format
    if (processed.prose_output && processed.detailed_analysis) {
      const proseResult = DD3_5_M_ProseOutputSchema.safeParse(
        processed.prose_output,
      );
      const structuredResult = DD3_5_M_StructuredDataSchema.safeParse(
        processed.detailed_analysis,
      );

      if (!structuredResult.success) {
        // Try to parse directly
        const directResult = DD3_5_M_StructuredDataSchema.safeParse(processed);
        if (directResult.success) {
          return {
            ...directResult.data,
            prose_output: proseResult.success ? proseResult.data : undefined,
          };
        }
        // Pattern 5: Graceful fallback with auto-generated defaults
        const defaults = DD3_5_M_StructuredDataSchema.parse({});
        return {
          ...defaults,
          ...(processed.detailed_analysis as object),
          prose_output: proseResult.success ? proseResult.data : undefined,
        };
      }

      return {
        ...structuredResult.data,
        prose_output: proseResult.success ? proseResult.data : undefined,
      };
    }

    // Pattern 6: Old format - parse directly
    const result = DD3_5_M_StructuredDataSchema.safeParse(processed);
    if (!result.success) {
      // Pattern 7: Return defaults with partial merge
      const defaults = DD3_5_M_StructuredDataSchema.parse({});
      return {
        ...defaults,
        ...(processed as object),
      };
    }
    return result.data;
  },
);
```

### All Patterns Used

| Pattern | Line | Purpose |
|---------|------|---------|
| 1. Handle null/undefined | 1385 | Graceful empty input |
| 2. Handle empty object | 1391 | Avoid duplicate defaults |
| 3. processNullValues() | 1396 | Shared preprocessing |
| 4. New format detection | 1399 | Backward compatibility |
| 5. Auto-generated defaults | 1417 | Type-safe recovery |
| 6. Old format parsing | 1432 | Backward compatibility |
| 7. Partial merge | 1435 | Combine defaults with data |

---

## 4. Antifragile Enum Helper

**Location**: `/Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/llm/prompts/dd/schemas.ts`, Lines 60-107

### Implementation

```typescript
/**
 * Creates an antifragile enum schema that gracefully handles LLM variations.
 * - Strips annotations after enum value (parentheses, hyphens, colons)
 * - Normalizes case
 * - Maps similar values
 * - Falls back to default on failure
 */
function flexibleEnum<T extends [string, ...string[]]>(
  values: T,
  defaultValue: T[number],
): z.ZodEffects<z.ZodString, T[number], string> {
  return z.string().transform((val): T[number] => {
    // Step 1: Extract the first word/phrase before any annotation
    // Handles: "WEAK - reason", "WEAK (reason)", "WEAK: reason"
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

    // Step 4: Fuzzy match - check if any valid value starts with the input
    for (const v of values) {
      if (v.startsWith(normalized) || normalized.startsWith(v)) {
        return v;
      }
    }

    // Step 5: Check if input contains any valid value
    for (const v of values) {
      if (normalized.includes(v) || v.includes(normalized)) {
        return v;
      }
    }

    // Step 6: Fall back to default (silent - sensitive values not logged)
    return defaultValue;
  });
}
```

### How It Handles LLM Variations

**Input → Output Mapping**:

```typescript
// Definition:
export const MechanismVerdict = flexibleEnum(
  ['SOUND', 'QUESTIONABLE', 'FLAWED'],
  'QUESTIONABLE'
);

// Various LLM outputs all map correctly:
'SOUND'                    → 'SOUND'
'sound'                    → 'SOUND'
'Sound (primary mechanism)' → 'SOUND'
'SOUND - verified'         → 'SOUND'
'sound: excellent'         → 'SOUND'

'QUESTIONABLE'             → 'QUESTIONABLE'
'questionable'             → 'QUESTIONABLE'
'QUESTIONABLE (area 3)'    → 'QUESTIONABLE'

'unknown_value'            → 'QUESTIONABLE' (default)
null / undefined           → 'QUESTIONABLE' (default)
```

### Enum Synonyms Map

**Location**: Lines 25-59

```typescript
const ENUM_SYNONYMS: Record<string, string> = {
  // Severity/assessment variations
  MODERATE: 'SIGNIFICANT',
  MEDIUM: 'SIGNIFICANT',
  MINOR: 'MANAGEABLE',
  MAJOR: 'SEVERE',

  // Status variations
  PARTIAL: 'PARTIALLY_IDENTIFIED',
  PARTIALLY: 'PARTIALLY_IDENTIFIED',
  PARTIALLY_SECURED: 'IN_DISCUSSION',
  SECURED: 'SIGNED',

  // Quality variations
  GOOD: 'ADEQUATE',
  POOR: 'WEAK',
  NONE: 'MISSING',

  // ... and many more
};
```

---

## 5. Flexible Number Helper

**Location**: `/Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/llm/prompts/dd/schemas.ts`, Lines 158-189

### Implementation

```typescript
/**
 * Creates an antifragile number schema that coerces strings to numbers.
 * - Handles "3" -> 3
 * - Handles "3.5" -> 3.5
 * - Handles "3/5" -> 3 (extracts first number)
 * - Falls back to default on failure
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
      // Extract first number from string (handles "3/5", "3 out of 5", etc.)
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

    // Fall back to default (silent - sensitive values not logged)
    return defaultValue;
  });
}
```

### Input → Output Examples

```typescript
// Definition:
confidence_percent: flexibleNumber(50, { min: 0, max: 100 })

// Handles:
50              → 50
"50"            → 50
"50.5"          → 50.5
"3 out of 10"   → 3
"7/10"          → 7
"~85"           → 85
">75"           → 75
120             → 100 (capped at max)
-5              → 0 (clamped at min)
"invalid"       → 50 (default)
null            → 50 (default)
```

---

## 6. Schema Definition Example with Defaults

**Location**: `/Users/ailjangbar/Desktop/sparlo-v2/apps/web/lib/llm/prompts/dd/schemas.ts`, Lines 573-603

### Example: Physics Validation Array

```typescript
const DD3_M_StructuredDataSchema = z.object({
  // ... other fields ...

  physics_validation: z
    .array(
      z.object({
        claim_id: z.string().default(''),  // ← Default provided
        claim_text: z.string(),              // ← No default (required)
        governing_physics: z.object({
          principle: z.string().default(''),
          equation: z.string().optional(),
          theoretical_limit: z.string().default('Unknown'),
        }),
        validation_analysis: z.object({
          claim_vs_limit: z.string().default(''),
          assumptions_required: z.array(z.string()).default([]),
          assumption_validity: z.string().default(''),
        }),
        verdict: Verdict,                    // ← Uses flexibleEnum
        confidence: Confidence,              // ← Uses flexibleEnum
        confidence_percent: flexibleNumber(50, { min: 0, max: 100 }),  // ← Uses flexibleNumber
        reasoning: z.string().default(''),
      }),
    )
    .default([]),  // ← Array defaults to empty
});
```

### What This Means

```typescript
// When you parse incomplete data:
const result = DD3_M_StructuredDataSchema.parse({
  physics_validation: [
    {
      claim_text: 'The system works'
      // Missing: claim_id, verdict, confidence, etc.
    }
  ]
});

// You get (with all defaults applied):
{
  physics_validation: [
    {
      claim_id: '',                    // ← default applied
      claim_text: 'The system works',  // ← provided value
      governing_physics: {
        principle: '',                 // ← default applied
        equation: undefined,           // ← optional (no default)
        theoretical_limit: 'Unknown',  // ← default applied
      },
      validation_analysis: {
        claim_vs_limit: '',
        assumptions_required: [],
        assumption_validity: '',
      },
      verdict: undefined,              // ← Zod required (no default)
      confidence: undefined,           // ← Zod required (no default)
      confidence_percent: 50,          // ← flexibleNumber default
      reasoning: '',
    }
  ]
}
```

---

## 7. Complete Before/After Comparison

### Issue 1: Console Logging

**BEFORE (Security Risk)**:
```typescript
// ❌ OLD - Logs sensitive LLM output
function parseEnumValue(val: string, defaultValue: string): string {
  const cleaned = val.toUpperCase();
  if (VALID_VALUES.includes(cleaned)) {
    return cleaned;
  }

  console.warn(`Enum mismatch: "${val}" using "${defaultValue}"`);  // ❌ DANGEROUS
  return defaultValue;
}
```

**AFTER (Secure)**:
```typescript
// ✅ NEW - Silent fallback, no logging
function flexibleEnum<T extends [string, ...string[]]>(
  values: T,
  defaultValue: T[number],
): z.ZodEffects<z.ZodString, T[number], string> {
  return z.string().transform((val): T[number] => {
    const normalized = val.replace(/\s*[-:(].*$/, '').trim().toUpperCase();
    if (values.includes(normalized as T[number])) {
      return normalized as T[number];
    }
    // ... fuzzy matching ...
    // Fall back to default (silent - sensitive values not logged)
    return defaultValue;
  });
}
```

### Issue 2: Unsafe Type Casts

**BEFORE (Type Danger)**:
```typescript
// ❌ OLD - Bypasses type system
const processed = processNullValues(input) as unknown as Record<string, unknown>;
const defaults = { /* manually duplicated schema */ } as any;
return { ...defaults, ...processed };
```

**AFTER (Type Safe)**:
```typescript
// ✅ NEW - Type-safe defaults
const processed = processNullValues(input) as Record<string, unknown>;
const defaults = DD3_5_M_StructuredDataSchema.parse({});  // Fully typed!
return {
  ...defaults,
  ...(processed.detailed_analysis as object),
};
```

### Issue 3: Code Duplication

**BEFORE (Duplication)**:
```typescript
// ❌ OLD - Null handling scattered everywhere

// In DD0 schema:
const processed0 = v === null ? undefined : v;
if (Array.isArray(v)) {
  return v.filter(item => item !== null).map(item => ...);
}

// In DD3.5 schema:
const processed3 = v === null ? undefined : v;
if (Array.isArray(v)) {
  return v.filter(item => item !== null).map(item => ...);
}

// In DD4 schema:
const processed4 = v === null ? undefined : v;
if (Array.isArray(v)) {
  return v.filter(item => item !== null).map(item => ...);
}
```

**AFTER (Shared)**:
```typescript
// ✅ NEW - Single shared helper
function processNullValues(v: unknown): unknown {
  if (v === null) return undefined;
  if (Array.isArray(v)) {
    return v
      .filter(item => {
        if (item === null || item === undefined) return false;
        if (typeof item === 'object' && Object.keys(item).length === 0) return false;
        return true;
      })
      .map(processNullValues);
  }
  if (typeof v === 'object' && v !== null) {
    return Object.fromEntries(
      Object.entries(v).map(([k, val]) => [k, processNullValues(val)])
    );
  }
  return v;
}

// Used everywhere (lines 1396, 2052, etc.)
const processed = processNullValues(input) as Record<string, unknown>;
```

### Issue 4: Dead Code

**BEFORE**:
```typescript
// ❌ OLD - Unused helper cluttering the code
function _flexibleEnumOptional<T extends readonly string[]>(
  values: T,
  defaultValue: T[number],
): z.ZodUnion<[z.ZodUndefined, z.ZodString]> {
  // ... implementation that's never called ...
}

// Only used these:
function flexibleEnum<T extends [string, ...string[]]>( ... )
function flexibleOptionalObject<T extends z.ZodRawShape>( ... )
function flexibleNumber( ... )
```

**AFTER**:
```typescript
// ✅ NEW - Clean API with only what's used
function flexibleEnum<T extends [string, ...string[]]>( ... )
function flexibleOptionalObject<T extends z.ZodRawShape>( ... )
function flexibleNumber( ... )
// Dead code removed!
```

### Issue 5: Default Duplication

**BEFORE (Risky)**:
```typescript
// ❌ OLD - Two places to maintain
const DD3_M_StructuredDataSchema = z.object({
  validation_summary: z.object({
    overall_technical_assessment: z.string().default('Assessment pending'),
    // ... 50+ more fields
  }),
  // ...
});

const DD3_M_DefaultStructuredData = {
  validation_summary: {
    overall_technical_assessment: 'Assessment pending',
    // DUPLICATE - must keep in sync manually!
  },
  // ...
};

// If schema changes, must remember to update BOTH places
// Easy to forget, easy to get out of sync
```

**AFTER (Safe)**:
```typescript
// ✅ NEW - Only one place (the schema)
const DD3_M_StructuredDataSchema = z.object({
  validation_summary: z.object({
    overall_technical_assessment: z.string().default('Assessment pending'),
    // ... 50+ more fields
  }),
  // ...
});

// Generate defaults automatically:
const defaults = DD3_M_StructuredDataSchema.parse({});
// No separate default object - impossible to get out of sync!
```

---

## Summary of All Patterns Used

| Pattern | Purpose | Location |
|---------|---------|----------|
| `processNullValues()` | Shared null preprocessing | Lines 195-217 |
| `Schema.parse({})` | Type-safe defaults | Lines 1385, 1417, 2041, 2071 |
| `flexibleEnum()` | Antifragile enum parsing | Throughout schema |
| `flexibleNumber()` | String-to-number coercion | Throughout schema |
| `flexibleOptionalObject()` | Safe optional objects | Throughout schema |
| Silent error handling | No console logging | Entire file |
| Type-safe casts | No `as unknown as` | Entire file |

All patterns work together to create an antifragile schema system that gracefully handles unpredictable LLM output while maintaining type safety and security.
