---
title: "DD4-M JSON Parsing Failures - Antifragile Truncation Handling"
category: runtime-errors
tags: [json-parsing, llm-output, dd4-m, inngest, zod-validation, truncation, antifragile, claude-api, retry-logic]
severity: critical
component: apps/web/lib/inngest/functions/generate-dd-report.ts
symptoms:
  - "Failed to parse JSON from DD4-M: ..."
  - "Response truncated due to max_tokens limit"
  - "$10 and 40 minutes wasted per failure"
date_solved: 2026-01-04
related:
  - docs/solutions/architecture/schema-antifragility-llm-output-20251223.md
  - CLAUDE.md (LLM Output Schemas section)
---

# DD4-M JSON Parsing Failures - Antifragile Truncation Handling

## Problem

DD4-M and DD5-M steps in the Due Diligence report generation were failing with JSON parsing errors. Each failure cost **$10** (tokens consumed in previous steps) and **40 minutes** (full chain execution time).

### Error Message

```
Error: Failed to parse JSON from DD4-M: {"solution_space_position":{"primary_track":"best_fit","track_rationale":"Sublime's wollastonite electrochemical dissolution-precipitation approach (concept-4 in AN3-M) represents a well-reasoned appl...
```

### Root Cause

The LLM (Claude Opus 4.5) was producing responses that exceeded the `max_tokens` limit, causing:

1. **Mid-response truncation** - JSON cut off mid-string or mid-object
2. **Invalid JSON structure** - Incomplete objects, unclosed strings, missing braces
3. **Parse failures** - `JSON.parse()` failed on malformed JSON
4. **Cascading failure** - Entire DD report failed after 7 successful steps

## Solution

Implemented a **multi-layered antifragile approach** with 4 complementary strategies:

### 1. Truncation Detection

Added `wasTruncated` flag to `ClaudeResult` interface in `lib/llm/client.ts`:

```typescript
export interface ClaudeResult {
  content: string;
  usage: TokenUsage;
  /** True if response was truncated due to max_tokens limit */
  wasTruncated?: boolean;
}

// Detection in callClaude:
const wasTruncated = finalMessage.stop_reason === 'max_tokens';
if (wasTruncated) {
  console.warn(
    `[Claude] Response truncated due to max_tokens limit. ` +
      `Used ${finalMessage.usage.output_tokens}/${maxTokens} tokens.`
  );
}
return { content: result, usage, wasTruncated };
```

### 2. Four-Tier JSON Repair

Enhanced `parseJsonResponse()` with progressive fallback strategies:

```typescript
// Strategy 1: Direct parse
try {
  return JSON.parse(jsonStr) as T;
} catch {
  // Strategy 2: Find last complete value and close structures
  try {
    const repaired = repairTruncatedJson(jsonStr);
    return JSON.parse(repaired) as T;
  } catch {
    // Strategy 3: Aggressive truncation to last balanced structure
    try {
      const truncated = aggressiveTruncateJson(jsonStr);
      return JSON.parse(truncated) as T;
    } catch {
      // Strategy 4: Progressive slice - scan backwards for valid parse point
      for (let endPos = jsonStr.length; endPos > 100; endPos -= 50) {
        const slice = jsonStr.substring(0, endPos);
        const repaired = repairTruncatedJson(slice);
        try {
          return JSON.parse(repaired) as T;
        } catch { continue; }
      }
      throw new Error(`Failed to parse JSON from ${context}`);
    }
  }
}
```

### 3. Retry with Escalating Token Limits

For DD4-M and DD5-M, added retry logic with increasing `max_tokens`:

```typescript
// ANTIFRAGILE: Retry with escalating token limits
const MAX_RETRIES = 2;
const TOKEN_LIMITS = [64000, 96000, 128000]; // Escalate on retry

for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
  const currentMaxTokens = TOKEN_LIMITS[Math.min(attempt, TOKEN_LIMITS.length - 1)];

  try {
    const result = await callClaude({
      model: MODELS.OPUS,
      system: DD4_M_PROMPT,
      userMessage: contextMessage,
      maxTokens: currentMaxTokens,
    });

    const parsed = parseJsonResponse<DD4_M_Output>(
      result.content,
      'DD4-M',
      { wasTruncated: result.wasTruncated },
    );

    return { result: validated, usage: totalUsage };
  } catch (error) {
    const isParseError =
      error.message.includes('Failed to parse JSON') ||
      error.message.includes('truncated');

    if (!isParseError || attempt >= MAX_RETRIES) {
      throw error;
    }
    console.warn(`[DD4-M] Attempt ${attempt + 1} failed, retrying with more tokens...`);
  }
}
```

### 4. Updated All DD Steps

All DD steps now pass `wasTruncated` to `parseJsonResponse()`:

```typescript
// DD0-M, DD3-M, DD3.5-M, DD4-M, DD5-M
const parsed = parseJsonResponse<DD_X_Output>(content, 'DD-X', {
  wasTruncated: result.wasTruncated,
});
```

## Files Modified

| File | Changes |
|------|---------|
| `apps/web/lib/llm/client.ts` | Added `wasTruncated` flag, 4-tier JSON repair, `ParseJsonOptions` interface |
| `apps/web/lib/inngest/functions/generate-dd-report.ts` | Retry logic for DD4-M/DD5-M, pass `wasTruncated` to all DD steps |

## Prevention Strategies

### For New LLM Integrations

1. **Design for token headroom** - Start with 150% of p95 usage
2. **Always pass `wasTruncated`** - Enables smarter repair strategies
3. **Use `flexibleEnum()` and `flexibleNumber()`** - Handle LLM output variations
4. **Add `.default([])` to arrays** - Prevent validation failures on missing data

### Monitoring

Set up alerts for:
- JSON parse failure rate > 1%
- Truncation rate > 5%
- Retry success rate < 80%
- Token utilization > 90%

### Early Warning Signs

- "Unexpected end of JSON input" errors
- Inconsistent failures (same input works sometimes)
- `[Claude] Response truncated` warnings in logs
- Repair strategy logs appearing frequently

## Testing

```typescript
// Test truncated JSON repair
const truncated = '{"key": "value", "nested": {"incomplete": "stri';
const repaired = repairTruncatedJson(truncated);
expect(JSON.parse(repaired)).toEqual({ key: "value" });

// Test with real truncated fixture
const fixture = fs.readFileSync('fixtures/dd4m-truncated.json', 'utf-8');
const result = parseJsonResponse(fixture, 'DD4-M', { wasTruncated: true });
expect(result.solution_space_position).toBeDefined();
```

## Related Documentation

- [Schema Antifragility Best Practices](../architecture/schema-antifragility-llm-output-20251223.md)
- [CLAUDE.md - LLM Output Schemas (CRITICAL)](../../CLAUDE.md)
- [DD Schemas](../../apps/web/lib/llm/prompts/dd/schemas.ts) - `flexibleEnum()`, `flexibleNumber()` helpers

## Key Insight

This fix embodies **antifragile design** - the system now **gains from truncation events** rather than failing:

1. Multiple fallback strategies mean truncation rarely causes complete failure
2. Retry with escalation automatically finds the right token budget
3. Rich logging enables proactive monitoring and optimization
4. Each failure provides feedback to improve future requests
