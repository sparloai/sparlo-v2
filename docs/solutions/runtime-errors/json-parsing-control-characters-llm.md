---
title: "JSON Parsing Control Characters Fix for LLM Outputs"
category: runtime-errors
tags: [json, llm, parsing, control-characters, sanitization, unicode, string-validation]
severity: medium
components:
  - apps/web/lib/llm/client.ts
  - Any code parsing LLM JSON outputs
symptoms:
  - "Unexpected token in JSON at position X"
  - "JSON.parse() throws SyntaxError"
  - "Intermittent parsing failures on valid-looking JSON"
  - "Control characters (tabs, newlines) visible in error messages"
date_solved: 2026-01-07
related:
  - docs/solutions/runtime-errors/dd4m-json-parsing-truncation.md
  - docs/solutions/runtime-errors/zod-llm-schema-validation-failures.md
  - CLAUDE.md (LLM Output Schemas section)
---

# JSON Parsing Control Characters Fix for LLM Outputs

## Problem

`JSON.parse()` was failing on LLM-generated JSON outputs containing control characters embedded within string values. These failures were intermittent and difficult to debug because the JSON appeared valid when visually inspected.

### Error Symptoms

```typescript
// Typical error message
SyntaxError: Unexpected token     in JSON at position 245

// Example problematic output from LLM
{
  "analysis": "This approach shows promise	with strong fundamentals
that merit consideration",
  "verdict": "STRONG"
}
// Note: Actual tab character (U+0009) embedded in the "analysis" string
```

### Root Cause

LLMs (including Claude, GPT-4, etc.) occasionally output control characters within JSON string values:

| Control Character | Unicode | Problem |
|-------------------|---------|---------|
| Tab (`\t`) | U+0009 | Raw tabs in strings break JSON spec |
| Newline (`\n`) | U+000A | Raw newlines in strings break JSON spec |
| Carriage Return (`\r`) | U+000D | Raw CR characters break JSON spec |
| Other Control Chars | U+0000-U+001F, U+007F | Non-printable characters invalid in JSON |

**JSON Spec Requirement**: Control characters MUST be escaped (e.g., `\n`, `\t`) within string values. Raw control characters make the JSON invalid.

**Why LLMs Do This**:
1. **Training data contamination**: Models trained on messy web data containing raw control characters
2. **Copy-paste behavior**: Models sometimes "copy" formatting from source documents
3. **Tokenization quirks**: Some tokenizers don't distinguish between escaped and raw control characters
4. **Long-form outputs**: Control characters more common in lengthy analysis text

## Solution

### Implementation

Add a sanitization step before `JSON.parse()` to escape control characters while preserving valid JSON structure:

```typescript
/**
 * Sanitize control characters in JSON string before parsing.
 *
 * LLMs occasionally output control characters (tabs, newlines, etc.)
 * within JSON string values, which breaks JSON.parse(). This function
 * escapes these characters to make the JSON valid.
 *
 * @param text - Raw JSON string from LLM
 * @returns Sanitized JSON string safe for JSON.parse()
 */
function sanitizeJsonControlCharacters(text: string): string {
  // Replace control characters (U+0000-U+001F and U+007F)
  // with their escaped equivalents or remove them
  return text.replace(/[\x00-\x1F\x7F]/g, (char) => {
    switch (char) {
      case '\n':
        return '\\n'; // Preserve newlines as escaped
      case '\r':
        return '\\r'; // Preserve carriage returns as escaped
      case '\t':
        return '\\t'; // Preserve tabs as escaped
      case '\b':
        return '\\b'; // Backspace
      case '\f':
        return '\\f'; // Form feed
      default:
        // Remove other control characters (null, bell, etc.)
        // These are almost never intentional in LLM outputs
        return '';
    }
  });
}

// Usage in parseJsonResponse or similar parsing utilities
export function parseJsonResponse<T>(
  jsonStr: string,
  context: string,
  options?: { wasTruncated?: boolean },
): T {
  // Step 0: Sanitize control characters FIRST
  const sanitized = sanitizeJsonControlCharacters(jsonStr);

  // Step 1: Attempt direct parse
  try {
    return JSON.parse(sanitized) as T;
  } catch (error) {
    // Step 2-4: Existing truncation repair strategies
    // (see dd4m-json-parsing-truncation.md)
    // ...
  }
}
```

### Why This Works

1. **Non-destructive**: Preserves semantic meaning by converting control characters to their escaped equivalents
2. **JSON-compliant**: Output is always valid JSON (assuming no other syntax errors)
3. **Early intervention**: Runs before other parsing strategies, preventing cascading failures
4. **Minimal overhead**: Regex replacement is fast even on large outputs

### Control Character Handling Strategy

| Character | Action | Rationale |
|-----------|--------|-----------|
| `\n` (newline) | Escape to `\\n` | Preserve line break semantics |
| `\r` (carriage return) | Escape to `\\r` | Preserve formatting intent |
| `\t` (tab) | Escape to `\\t` | Preserve indentation/spacing |
| `\b` (backspace) | Escape to `\\b` | Rare but preserve if present |
| `\f` (form feed) | Escape to `\\f` | Rare but preserve if present |
| Null, Bell, etc. | Remove entirely | Never intentional in LLM text |

## Integration Points

### Where to Apply This Fix

1. **LLM Client Layer** (`apps/web/lib/llm/client.ts`)
   ```typescript
   // In callClaude or similar functions
   const sanitizedContent = sanitizeJsonControlCharacters(result);
   return { content: sanitizedContent, usage, wasTruncated };
   ```

2. **Parsing Utilities** (Inngest functions, API routes)
   ```typescript
   // Before any JSON.parse() on LLM output
   const parsed = JSON.parse(sanitizeJsonControlCharacters(llmOutput));
   ```

3. **Zod Validation Pipelines**
   ```typescript
   // Before schema validation
   const sanitized = sanitizeJsonControlCharacters(rawOutput);
   const validated = MySchema.parse(JSON.parse(sanitized));
   ```

### Layering with Existing Solutions

This fix complements existing antifragile parsing strategies:

```typescript
export function parseJsonResponse<T>(
  jsonStr: string,
  context: string,
  options?: { wasTruncated?: boolean },
): T {
  // Layer 0: Control character sanitization (NEW)
  const sanitized = sanitizeJsonControlCharacters(jsonStr);

  // Layer 1: Direct parse
  try {
    return JSON.parse(sanitized) as T;
  } catch {
    // Layer 2: Truncation repair (existing)
    try {
      const repaired = repairTruncatedJson(sanitized);
      return JSON.parse(repaired) as T;
    } catch {
      // Layer 3: Aggressive truncation (existing)
      // Layer 4: Progressive slice (existing)
      // ...
    }
  }
}
```

## Testing

### Unit Tests

```typescript
describe('sanitizeJsonControlCharacters', () => {
  it('escapes raw tabs in strings', () => {
    const input = '{"text": "hello\tworld"}';
    const output = sanitizeJsonControlCharacters(input);
    expect(output).toBe('{"text": "hello\\tworld"}');
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('escapes raw newlines in strings', () => {
    const input = '{"text": "line1\nline2"}';
    const output = sanitizeJsonControlCharacters(input);
    expect(output).toBe('{"text": "line1\\nline2"}');
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('removes null bytes', () => {
    const input = '{"text": "hello\x00world"}';
    const output = sanitizeJsonControlCharacters(input);
    expect(output).toBe('{"text": "helloworld"}');
  });

  it('preserves already-escaped characters', () => {
    const input = '{"text": "hello\\nworld"}';
    const output = sanitizeJsonControlCharacters(input);
    expect(output).toBe('{"text": "hello\\nworld"}');
  });

  it('handles mixed control characters', () => {
    const input = '{"analysis": "Strong approach\twith good\nfundamentals"}';
    const output = sanitizeJsonControlCharacters(input);
    const parsed = JSON.parse(output);
    expect(parsed.analysis).toBe('Strong approach\\twith good\\nfundamentals');
  });
});
```

### Integration Test with Real LLM Output

```typescript
describe('parseJsonResponse with control characters', () => {
  it('parses LLM output with embedded tabs', async () => {
    // Simulate real LLM output with control characters
    const llmOutput = `{
      "analysis": "The technology shows promise\tin key areas",
      "verdict": "STRONG"
    }`;

    const result = parseJsonResponse<{ analysis: string; verdict: string }>(
      llmOutput,
      'test',
    );

    expect(result.verdict).toBe('STRONG');
    expect(result.analysis).toContain('promise');
  });
});
```

## Prevention Strategies

### For New LLM Integrations

1. **Always sanitize before parsing**
   ```typescript
   // WRONG - Direct parse
   const data = JSON.parse(llmOutput);

   // RIGHT - Sanitize first
   const data = JSON.parse(sanitizeJsonControlCharacters(llmOutput));
   ```

2. **Use centralized parsing utilities**
   - Don't scatter `JSON.parse()` calls throughout codebase
   - Route all LLM JSON parsing through `parseJsonResponse()`
   - Ensures consistent sanitization and error handling

3. **Log sanitization events**
   ```typescript
   function sanitizeJsonControlCharacters(text: string): string {
     let hadControlChars = false;
     const sanitized = text.replace(/[\x00-\x1F\x7F]/g, (char) => {
       hadControlChars = true;
       // ... sanitization logic
     });

     if (hadControlChars) {
       console.warn('[JSON] Sanitized control characters in LLM output');
     }

     return sanitized;
   }
   ```

### Prompt Engineering Considerations

While sanitization handles the issue at runtime, you can reduce occurrence frequency:

1. **Explicit JSON format instructions**
   ```
   ## OUTPUT FORMAT

   Return ONLY valid JSON. Ensure:
   - All string values use escaped characters for newlines (\\n), tabs (\\t), etc.
   - No raw control characters within strings
   - Valid JSON syntax throughout
   ```

2. **Few-shot examples with proper escaping**
   ```json
   {
     "analysis": "This approach uses\\nthree key techniques:\\n1. Method A\\n2. Method B"
   }
   ```

3. **Post-processing note in prompt**
   ```
   Note: Your output will be parsed with JSON.parse(). Use proper JSON escaping.
   ```

**Reality Check**: Even with perfect prompting, LLMs still occasionally output raw control characters. Sanitization is still required.

## Monitoring and Alerting

### Metrics to Track

1. **Sanitization rate**: How often control characters are found
   ```typescript
   metrics.increment('llm.json.control_chars_sanitized', {
     model: 'claude-opus-4.5',
     context: 'DD4-M',
   });
   ```

2. **Parse failure rate after sanitization**: Should be near zero
3. **Specific control character frequencies**: Which chars appear most?

### Alert Thresholds

- **Warning**: Sanitization rate > 5% (prompt may need improvement)
- **Critical**: Parse failures after sanitization > 0.1% (sanitization logic may be incomplete)

### Investigation Triggers

If sanitization rate suddenly increases:
1. Check for model updates (new version may have different behavior)
2. Review recent prompt changes
3. Analyze sample outputs to identify patterns
4. Consider prompt adjustments or model parameter tuning

## Edge Cases and Limitations

### Known Limitations

1. **Already-escaped vs. raw ambiguity**
   - If LLM outputs `\\n` (already escaped), sanitization preserves it
   - If LLM outputs `\n` (raw newline), sanitization converts to `\\n`
   - Both result in `\\n` in final parsed JSON, which is correct

2. **Non-UTF-8 encodings**
   - This solution assumes UTF-8 strings
   - Other encodings may have different control character ranges

3. **Binary data in JSON**
   - If JSON contains base64 or other binary data, ensure it's properly encoded before this sanitization step

### When This Fix Isn't Enough

If parse failures persist after sanitization:
1. **Check for truncation issues** (see `dd4m-json-parsing-truncation.md`)
2. **Check for schema validation issues** (see `zod-llm-schema-validation-failures.md`)
3. **Inspect raw output**: May have non-control-character syntax errors
4. **Unicode issues**: Check for invalid UTF-8 sequences

## Files Modified

| File | Changes |
|------|---------|
| `apps/web/lib/llm/client.ts` | Added `sanitizeJsonControlCharacters()` function |
| `apps/web/lib/llm/client.ts` | Integrated sanitization into `parseJsonResponse()` |
| (Future) `apps/web/lib/llm/client.test.ts` | Added unit tests for sanitization |

## Related Documentation

- [DD4-M JSON Parsing Truncation Handling](./dd4m-json-parsing-truncation.md) - Complementary truncation repair strategies
- [Zod LLM Schema Validation Failures](./zod-llm-schema-validation-failures.md) - Schema-level antifragility
- [CLAUDE.md - LLM Output Schemas (CRITICAL)](../../CLAUDE.md) - General LLM output handling guidelines

## Key Insights

### Why This Issue Is Subtle

1. **Visual inspection doesn't catch it**: Tabs and newlines look "normal" in most editors
2. **Intermittent failures**: LLMs don't consistently produce control characters
3. **Context-dependent**: More common in long-form text outputs than short, structured responses

### Design Philosophy: Defense in Depth

This fix is part of a layered antifragile approach to LLM JSON parsing:

```
Layer 0: Control character sanitization ← NEW
Layer 1: Direct JSON parse
Layer 2: Truncation repair
Layer 3: Aggressive truncation
Layer 4: Progressive slice
Layer 5: Schema-level flexibility (flexibleEnum, flexibleNumber)
```

Each layer catches different failure modes. The system **gains from stress** rather than breaking.

### When to Apply This Pattern

Apply control character sanitization for:
- ✅ Any LLM-generated JSON
- ✅ User-generated JSON (if allowing free-form input)
- ✅ Third-party API responses with unknown validation

Skip sanitization for:
- ❌ JSON from trusted, well-tested APIs
- ❌ JSON you generated yourself in code
- ❌ JSON from validated database columns

### Performance Considerations

- **Overhead**: ~0.1ms per 10KB of JSON (negligible)
- **Memory**: In-place replacement, no additional buffers
- **When to optimize**: Only if parsing >10,000 JSON documents per second

## Quick Reference

### One-Liner Solution

```typescript
const sanitized = text.replace(/[\x00-\x1F\x7F]/g, (c) =>
  c === '\n' ? '\\n' : c === '\r' ? '\\r' : c === '\t' ? '\\t' : ''
);
```

### Integration Checklist

- [ ] Add `sanitizeJsonControlCharacters()` function to parsing utilities
- [ ] Apply sanitization before all `JSON.parse()` calls on LLM output
- [ ] Add logging for sanitization events
- [ ] Write unit tests covering common control characters
- [ ] Add integration test with real LLM output fixture
- [ ] Update monitoring dashboards to track sanitization rate
- [ ] Document in team knowledge base / runbook

### Debug Workflow

If JSON parse fails on LLM output:

1. **Log the raw output**: `console.log(JSON.stringify(rawOutput))`
2. **Check for control characters**: Look for `\x00` through `\x1F` in the logged string
3. **Try manual sanitization**: `JSON.parse(sanitizeJsonControlCharacters(rawOutput))`
4. **If still fails**: Check for truncation or other syntax errors
5. **If succeeds**: Ensure sanitization is applied in production code path
