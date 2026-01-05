# DD4-M JSON Parsing Failure - Prevention Strategies

**Date:** 2026-01-04
**Module:** Sparlo Web - Due Diligence Report Generation
**Issue:** LLM outputs were being truncated when hitting max_tokens, causing JSON parsing failures
**Resolution:** Multi-strategy JSON repair + retry with escalating token limits + wasTruncated diagnostics

---

## Table of Contents

1. [Prevention Strategies](#1-prevention-strategies)
2. [Best Practices for LLM JSON Output](#2-best-practices-for-llm-json-output)
3. [Testing Approaches](#3-testing-approaches)
4. [Early Warning Signs](#4-early-warning-signs)

---

## 1. Prevention Strategies

### 1.1 Design for Token Headroom from Day One

**Problem:** Starting with tight token limits (e.g., 64K) leaves no margin for complex outputs.

**Prevention Strategy:**

```typescript
// ❌ BAD: Tight token limit with no headroom
const MAX_TOKENS = 64000; // Will truncate on complex outputs

// ✅ GOOD: Start with generous token limits
const MAX_TOKENS = 96000; // 50% headroom for complex outputs

// ✅ BETTER: Use step-specific token budgets based on empirical data
const TOKEN_BUDGETS = {
  DD0_M: 64000,   // Simple extraction
  DD3_M: 64000,   // Validation - structured
  DD4_M: 96000,   // Complex mapping - needs more space
  DD5_M: 128000,  // Full report - maximum space
};
```

**Rationale:**
- DD4-M generates solution mappings, moat assessments, pre-mortems, comparables, and scenarios
- Empirical data showed outputs were routinely 60K+ tokens
- Starting at 64K left no safety margin

**Implementation Checklist:**
- [ ] Profile each LLM step to measure typical output size
- [ ] Set token limit to 150% of p95 (95th percentile) output size
- [ ] Document token budget rationale in code comments
- [ ] Review token budgets quarterly as prompts evolve

---

### 1.2 Implement Truncation Detection at API Layer

**Problem:** JSON parsing failed silently when responses were truncated.

**Prevention Strategy:**

```typescript
// ✅ Track truncation status in API response wrapper
export interface ClaudeResult {
  content: string;
  usage: TokenUsage;
  wasTruncated?: boolean; // ✅ Explicit truncation flag
}

// ✅ Detect truncation in API wrapper
export async function callClaude(params: {
  model: string;
  system: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<ClaudeResult> {
  const response = await anthropic.messages.create({
    model: params.model,
    max_tokens: maxTokens,
    system: params.system,
    messages: [{ role: 'user', content: params.userMessage }],
  });

  // ✅ Check stop_reason for truncation
  const wasTruncated = response.stop_reason === 'max_tokens';

  if (wasTruncated) {
    console.warn(
      `[Claude] Response truncated due to max_tokens limit. ` +
      `Used ${response.usage.output_tokens}/${maxTokens} tokens. ` +
      `Model: ${response.model}`,
    );
  }

  return {
    content: response.content[0].text,
    usage: extractUsage(response.usage),
    wasTruncated, // ✅ Pass flag to parsing layer
  };
}
```

**Benefits:**
- Enables smarter repair strategies (know when to expect incomplete JSON)
- Provides diagnostic data for monitoring/alerting
- Allows retry logic to be triggered automatically

**Implementation Checklist:**
- [ ] Add `wasTruncated` flag to all LLM API wrapper responses
- [ ] Log truncation warnings with context (step name, token usage)
- [ ] Pass truncation flag to JSON parsing layer
- [ ] Set up monitoring alerts for truncation rate >5%

---

### 1.3 Multi-Strategy JSON Repair Pipeline

**Problem:** Single repair strategy (simple bracket closing) failed on complex truncations.

**Prevention Strategy:**

```typescript
/**
 * ANTIFRAGILE DESIGN: Multiple fallback strategies
 * 1. Find last complete value and close from there
 * 2. Find last complete object/array at any depth
 * 3. Progressive truncation until valid
 */
function repairTruncatedJson(jsonStr: string): string {
  const state = getJsonState(jsonStr);

  // Strategy 1: Find last complete value position
  const lastValuePos = findLastCompleteValue(jsonStr);
  if (lastValuePos > 0) {
    let repaired = jsonStr.substring(0, lastValuePos + 1);
    repaired = repaired.replace(/,\s*$/, ''); // Clean trailing commas

    // Close remaining structures
    const repairState = getJsonState(repaired);
    for (let i = repairState.openStack.length - 1; i >= 0; i--) {
      repaired += repairState.openStack[i] === '{' ? '}' : ']';
    }

    try {
      JSON.parse(repaired);
      return repaired;
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 2: Progressive truncation - find last valid parse point
  for (let i = jsonStr.length - 1; i > 100; i--) {
    const char = jsonStr[i];
    if (char === '}' || char === ']' || char === '"') {
      let candidate = jsonStr.substring(0, i + 1);
      // ... (truncated for brevity)
    }
  }

  // Strategy 3: Original simple repair as final fallback
  // ... (truncated for brevity)
}
```

**Key Techniques:**
1. **Complete Value Detection:** Find last complete string/number/boolean before truncation
2. **Progressive Truncation:** Walk backwards to find last valid structure
3. **State Tracking:** Track brace depth, string context, escape sequences
4. **Artifact Cleanup:** Remove trailing commas, incomplete keys, partial values

**Implementation Checklist:**
- [ ] Test repair strategies against real truncated outputs
- [ ] Log which repair strategy succeeded (for monitoring)
- [ ] Set up alerts if aggressive repair is needed frequently
- [ ] Document repair strategy precedence in code comments

---

### 1.4 Retry with Escalating Token Limits

**Problem:** Even with repair, some outputs legitimately need more space.

**Prevention Strategy:**

```typescript
// ✅ Escalating retry strategy
const MAX_RETRIES = 2;
const TOKEN_LIMITS = [
  HYBRID_MAX_TOKENS,  // 64K (first attempt)
  96000,              // 96K (first retry)
  128000,             // 128K (second retry)
];

let lastError: Error | null = null;
let totalUsage: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
};

for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
  const currentMaxTokens = TOKEN_LIMITS[Math.min(attempt, TOKEN_LIMITS.length - 1)];

  try {
    console.log(
      `[DD4-M] Attempt ${attempt + 1}/${MAX_RETRIES + 1} with maxTokens=${currentMaxTokens}`,
    );

    const result: ClaudeResult = await callClaude({
      model: MODELS.OPUS,
      system: DD4_M_PROMPT,
      userMessage: contextMessage,
      maxTokens: currentMaxTokens,
      temperature: DD_TEMPERATURES.mapping,
      cacheablePrefix: HYBRID_CACHED_PREFIX,
    });

    // ✅ Accumulate usage across retries for accurate cost tracking
    totalUsage = {
      inputTokens: totalUsage.inputTokens + result.usage.inputTokens,
      outputTokens: totalUsage.outputTokens + result.usage.outputTokens,
      totalTokens: totalUsage.totalTokens + result.usage.totalTokens,
    };

    // ✅ Pass wasTruncated flag to enable smarter repair
    const parsed = parseJsonResponse<DD4_M_Output>(
      result.content,
      'DD4-M',
      { wasTruncated: result.wasTruncated },
    );

    const validated = DD4_M_OutputSchema.parse(parsed);

    // Success!
    if (attempt > 0) {
      console.log(
        `[DD4-M] Succeeded on attempt ${attempt + 1} with ${currentMaxTokens} tokens`,
      );
    }

    return { result: validated, usage: totalUsage };
  } catch (error) {
    lastError = error instanceof Error ? error : new Error(String(error));
    const errorMessage = lastError.message;

    // ✅ Only retry on JSON parsing errors or truncation issues
    const isParseError =
      errorMessage.includes('Failed to parse JSON') ||
      errorMessage.includes('truncated');

    if (!isParseError || attempt >= MAX_RETRIES) {
      console.error(
        `[DD4-M] Failed after ${attempt + 1} attempts: ${errorMessage}`,
      );
      throw lastError;
    }

    console.warn(
      `[DD4-M] Attempt ${attempt + 1} failed with parse error, retrying with more tokens...`,
    );
  }
}
```

**Benefits:**
- Gracefully handles complex outputs that need more space
- Accumulates token usage for accurate cost tracking
- Only retries on parse errors (not other failures)
- Logs retry attempts for monitoring

**Implementation Checklist:**
- [ ] Define escalation tiers based on empirical needs
- [ ] Only retry on JSON parse errors (not schema validation)
- [ ] Accumulate token usage across retries for billing accuracy
- [ ] Set up alerts if retry rate >10%

---

### 1.5 Prompt Engineering for Structured Output

**Problem:** Verbose prompts lead to verbose outputs, consuming token budget.

**Prevention Strategy:**

```typescript
// ❌ BAD: Vague instruction leads to verbose output
const PROMPT = `
Analyze the startup's competitive position and write a comprehensive report.
Include everything you think is relevant.
`;

// ✅ GOOD: Explicit structure with token efficiency in mind
const PROMPT = `
## Output Format

CRITICAL: Respond with ONLY valid JSON. No markdown, no preamble.

{
  "solution_mapping": {
    "track_classification": "simpler_path | best_fit | paradigm_shift | frontier_transfer",
    "justification": "2-3 sentences max",
    "alternatives_missed": ["Alternative 1", "Alternative 2"]  // Max 5
  },
  "moat_assessment": {
    "novelty_score": 7,  // 1-10
    "durability_score": 6,
    "competitive_threats": ["Threat 1", "Threat 2"]  // Max 3
  },
  "the_one_bet": "Single sentence capturing core assumption",
  "pre_mortem": {
    "failure_scenarios": [  // Max 3 scenarios
      {
        "scenario": "Title (5 words max)",
        "likelihood": "low | medium | high",
        "trigger": "1 sentence"
      }
    ]
  }
}

## Constraints
- solution_mapping.alternatives_missed: Max 5 items
- moat_assessment.competitive_threats: Max 3 items
- pre_mortem.failure_scenarios: Max 3 scenarios
- the_one_bet: Single sentence, 20 words max
`;
```

**Key Techniques:**
1. **Explicit Structure:** Show exact JSON shape expected
2. **Array Limits:** Specify max items to prevent bloat
3. **Brevity Constraints:** "2-3 sentences max", "5 words max"
4. **Enum Values:** Use `"low | medium | high"` to constrain output
5. **Priority Guidance:** Ask for "top 3" instead of "all possible"

**Implementation Checklist:**
- [ ] Add explicit JSON schema to prompts
- [ ] Specify max array lengths in prompt instructions
- [ ] Add word/sentence limits for prose fields
- [ ] Use enums to constrain categorical outputs
- [ ] Test prompt with max-complexity inputs

---

### 1.6 Schema Design for Graceful Degradation

**Problem:** Strict schemas reject partial outputs from truncated responses.

**Prevention Strategy:**

```typescript
// ❌ BAD: Strict schema with all required fields
const DD4_M_OutputSchema = z.object({
  solution_mapping: z.object({
    track_classification: z.enum(['simpler_path', 'best_fit', 'paradigm_shift']),
    justification: z.string(),
    alternatives_missed: z.array(z.string()),  // Required, will fail if truncated
  }),
  moat_assessment: z.object({
    novelty_score: z.number().min(1).max(10),
    durability_score: z.number().min(1).max(10),
    competitive_threats: z.array(z.string()),  // Required
  }),
  // ... 8 more required sections
});

// ✅ GOOD: Resilient schema with defaults and optionals
const DD4_M_OutputSchema = z.object({
  solution_mapping: z.object({
    track_classification: flexibleEnum(
      ['simpler_path', 'best_fit', 'paradigm_shift', 'frontier_transfer'],
      'best_fit'  // Default if missing
    ),
    justification: z.string().optional().default(''),
    alternatives_missed: z.array(z.string()).max(10).default([]),  // ✅ Default to empty
  }).passthrough(),  // ✅ Allow extra fields

  moat_assessment: z.object({
    novelty_score: flexibleNumber(5, { min: 1, max: 10 }),  // ✅ Default to 5
    durability_score: flexibleNumber(5, { min: 1, max: 10 }),
    competitive_threats: z.array(z.string()).max(5).default([]),
  }).passthrough(),

  pre_mortem: z.object({
    failure_scenarios: z.array(FailureScenarioSchema).max(5).default([]),
  }).passthrough().optional(),  // ✅ Entire section optional

  // ... other sections with similar resilience
}).passthrough();
```

**Key Patterns:**
1. **`.default([])`:** Empty arrays instead of validation errors
2. **`.optional()`:** Non-critical sections can be missing
3. **`.passthrough()`:** Allow extra fields for forward compatibility
4. **`flexibleEnum()`:** Handle case variations and provide defaults
5. **`flexibleNumber()`:** Coerce strings to numbers with defaults
6. **`.max()` limits:** Prevent DoS from infinite arrays

**Implementation Checklist:**
- [ ] Use `.default([])` for all arrays
- [ ] Make non-critical sections `.optional()`
- [ ] Add `.passthrough()` to all objects
- [ ] Use `flexibleEnum()` instead of raw `z.enum()`
- [ ] Use `flexibleNumber()` instead of raw `z.number()`
- [ ] Set `.max()` limits on all arrays

---

## 2. Best Practices for LLM JSON Output

### 2.1 Always Use `wasTruncated` Flag

```typescript
// ✅ Pass truncation flag to parsing layer
const parsed = parseJsonResponse<DD4_M_Output>(
  result.content,
  'DD4-M',
  { wasTruncated: result.wasTruncated }
);
```

**Benefits:**
- Enables context-aware repair strategies
- Provides diagnostic data for monitoring
- Allows logging of truncation patterns

---

### 2.2 Log Repair Strategy Success

```typescript
// ✅ Track which repair strategy succeeded
let strategy = 'direct';

try {
  const result = JSON.parse(jsonStr);
  if (options?.wasTruncated) {
    console.log(`[JSON Parse] ${context}: Parsed truncated response successfully (direct)`);
  }
  return result;
} catch (firstError) {
  try {
    const repaired = repairTruncatedJson(jsonStr);
    strategy = 'repair';
    const result = JSON.parse(repaired);
    console.log(
      `[JSON Repair] ${context}: Repaired truncated JSON successfully ` +
      `(original: ${jsonStr.length} chars, repaired: ${repaired.length} chars)`
    );
    return result;
  } catch (secondError) {
    // ... (next strategy)
  }
}
```

**Benefits:**
- Identify which steps require aggressive repair (may need prompt tuning)
- Monitor repair success rate for alerting
- Understand repair patterns for optimization

---

### 2.3 Use Flexible Schema Helpers

```typescript
// ✅ flexibleEnum - handles case variations and provides defaults
export function flexibleEnum<T extends string>(
  values: readonly T[],
  fallback: T,
): z.ZodEffects<z.ZodString, T, string> {
  return z.string().transform((val) => {
    const normalized = val.toUpperCase().trim();
    if (values.includes(normalized as T)) {
      return normalized as T;
    }
    console.warn(`[Schema] Unexpected enum value: ${val}, using fallback: ${fallback}`);
    return fallback;
  });
}

// ✅ flexibleNumber - coerces strings to numbers with bounds
export function flexibleNumber(
  defaultValue: number,
  options?: { min?: number; max?: number },
): z.ZodEffects<z.ZodUnion<[z.ZodNumber, z.ZodString]>, number> {
  return z.union([
    z.number(),
    z.string().transform((s) => {
      const parsed = parseFloat(s);
      return isNaN(parsed) ? defaultValue : parsed;
    }),
  ]).transform((num) => {
    if (options?.min !== undefined && num < options.min) return options.min;
    if (options?.max !== undefined && num > options.max) return options.max;
    return num;
  });
}
```

**Usage:**
```typescript
const DD4_M_OutputSchema = z.object({
  solution_mapping: z.object({
    track_classification: flexibleEnum(
      ['simpler_path', 'best_fit', 'paradigm_shift', 'frontier_transfer'],
      'best_fit'
    ),
  }),
  moat_assessment: z.object({
    novelty_score: flexibleNumber(5, { min: 1, max: 10 }),
  }),
});
```

---

### 2.4 Set Up Monitoring for Truncation Patterns

```typescript
// ✅ Track truncation events for monitoring
interface TruncationEvent {
  step: string;
  maxTokens: number;
  outputTokens: number;
  timestamp: Date;
  retrySucceeded: boolean;
}

const truncationEvents: TruncationEvent[] = [];

function logTruncation(event: TruncationEvent) {
  truncationEvents.push(event);

  // Send to monitoring service
  analytics.track('llm_truncation', {
    step: event.step,
    maxTokens: event.maxTokens,
    outputTokens: event.outputTokens,
    retrySucceeded: event.retrySucceeded,
  });

  // Alert if truncation rate exceeds threshold
  const recentTruncations = truncationEvents.filter(
    e => e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  if (recentTruncations.length > 10) {
    console.error(`[Alert] High truncation rate: ${recentTruncations.length} events in 24h`);
  }
}
```

---

## 3. Testing Approaches

### 3.1 Save Real Truncated Outputs as Test Fixtures

```typescript
// tests/fixtures/dd4-m-truncated-output.json
{
  "content": "{\"solution_mapping\":{\"track_classification\":\"best_fit\",\"justification\":\"The startup's approach...",
  "wasTruncated": true,
  "usage": {
    "inputTokens": 15234,
    "outputTokens": 64000,
    "totalTokens": 79234
  }
}

// tests/llm/json-repair.test.ts
import truncatedDD4MOutput from '../fixtures/dd4-m-truncated-output.json';

test('repairs DD4-M truncated output', () => {
  const parsed = parseJsonResponse<DD4_M_Output>(
    truncatedDD4MOutput.content,
    'DD4-M',
    { wasTruncated: truncatedDD4MOutput.wasTruncated }
  );

  expect(parsed).toBeDefined();
  expect(parsed.solution_mapping).toBeDefined();
  expect(parsed.moat_assessment).toBeDefined();
});
```

---

### 3.2 Synthetic Truncation Tests

```typescript
// tests/llm/json-repair-synthetic.test.ts

function createSyntheticTruncation(validJson: string, truncateAt: number): string {
  return validJson.substring(0, truncateAt);
}

test('repairs JSON truncated at various points', () => {
  const validJson = JSON.stringify({
    solution_mapping: { track: 'best_fit', justification: 'Test' },
    moat_assessment: { novelty_score: 7, durability_score: 6 },
  });

  // Test truncation at different points
  const truncationPoints = [
    validJson.length - 100,  // Near end
    validJson.length - 200,  // Middle
    validJson.length - 300,  // Early
  ];

  truncationPoints.forEach((point) => {
    const truncated = createSyntheticTruncation(validJson, point);
    const repaired = repairTruncatedJson(truncated);

    expect(() => JSON.parse(repaired)).not.toThrow();
  });
});
```

---

### 3.3 End-to-End Truncation Simulation

```typescript
// tests/integration/dd4-m-truncation.test.ts

test('DD4-M handles truncation with retry', async () => {
  // Mock callClaude to return truncated response on first attempt
  let attempt = 0;
  vi.mock('../../lib/llm/client', () => ({
    callClaude: vi.fn(async (params) => {
      attempt++;

      if (attempt === 1) {
        // First attempt: truncated
        return {
          content: truncatedDD4MOutput,
          usage: { inputTokens: 10000, outputTokens: 64000, totalTokens: 74000 },
          wasTruncated: true,
        };
      } else {
        // Retry: full response
        return {
          content: validDD4MOutput,
          usage: { inputTokens: 10000, outputTokens: 96000, totalTokens: 106000 },
          wasTruncated: false,
        };
      }
    }),
  }));

  const result = await generateDDReport({ /* ... */ });

  expect(result.success).toBe(true);
  expect(attempt).toBe(2);  // Should have retried once
});
```

---

### 3.4 Schema Validation Tests with Partial Data

```typescript
// tests/schemas/dd4-m-schema.test.ts

test('DD4-M schema handles partial data gracefully', () => {
  const partialData = {
    solution_mapping: {
      track_classification: 'best_fit',
      // justification missing
      // alternatives_missed missing
    },
    // moat_assessment missing
    // pre_mortem missing
  };

  const validated = DD4_M_OutputSchema.parse(partialData);

  expect(validated.solution_mapping.track_classification).toBe('best_fit');
  expect(validated.solution_mapping.justification).toBe('');  // Default
  expect(validated.solution_mapping.alternatives_missed).toEqual([]);  // Default
  expect(validated.moat_assessment).toBeUndefined();  // Optional
});
```

---

## 4. Early Warning Signs

### 4.1 Symptoms Indicating JSON Parsing Issues

**Immediate Red Flags:**
- Parse errors mentioning "Unexpected end of JSON input"
- Parse errors mentioning "Unexpected token }" or "Unexpected token ]"
- Schema validation errors on otherwise valid-looking data
- Inconsistent failures (same inputs work sometimes, fail other times)

**Monitoring Metrics:**
- JSON parse failure rate >1%
- Truncation rate (stop_reason === 'max_tokens') >5%
- Aggressive repair strategy usage >10%
- Retry success rate on parse errors <80%

---

### 4.2 What to Check When Parse Errors Occur

**1. Check `wasTruncated` flag:**
```typescript
if (result.wasTruncated) {
  console.log('Response was truncated - check token limits');
}
```

**2. Check token usage vs limit:**
```typescript
const utilizationPercent = (result.usage.outputTokens / maxTokens) * 100;
if (utilizationPercent > 95) {
  console.warn(`Token utilization: ${utilizationPercent}% - close to limit`);
}
```

**3. Check prompt complexity:**
- Is the prompt asking for too many items?
- Are there unbounded array fields?
- Is the output schema too complex?

**4. Check for schema drift:**
- Have you added required fields without defaults?
- Are you using strict validation without `.passthrough()`?
- Did you remove `flexibleEnum()` in favor of raw `z.enum()`?

---

### 4.3 Debugging Workflow

```
Parse Error Detected
    ↓
Check wasTruncated Flag
    ↓
    ├─ TRUE → Increase token limit or simplify prompt
    ↓
    └─ FALSE → Check schema compatibility
        ↓
        ├─ Schema too strict → Add defaults, make optional
        ↓
        └─ LLM returning unexpected format → Update prompt
```

---

### 4.4 Preventive Monitoring Dashboard

**Recommended Metrics:**

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| JSON parse success rate | >99% | <97% |
| Truncation rate (max_tokens) | <5% | >10% |
| Aggressive repair usage | <10% | >20% |
| Retry success rate | >90% | <80% |
| Average token utilization | 60-80% | >90% or <30% |

**Implementation:**
```typescript
interface ParseMetrics {
  step: string;
  parseSuccess: boolean;
  wasTruncated: boolean;
  repairStrategyUsed: 'direct' | 'repair' | 'aggressive' | 'progressive';
  tokenUtilization: number;
  retryAttempt: number;
}

function trackParseMetrics(metrics: ParseMetrics) {
  // Send to monitoring service (Datadog, New Relic, etc.)
  analytics.track('llm_json_parse', metrics);

  // Calculate rolling averages
  const last100Parses = getRecentParses(100);
  const parseSuccessRate = last100Parses.filter(p => p.parseSuccess).length / 100;

  if (parseSuccessRate < 0.97) {
    alerting.send({
      severity: 'high',
      message: `JSON parse success rate dropped to ${parseSuccessRate * 100}%`,
      runbook: 'https://docs.sparlo.com/runbooks/llm-json-parsing',
    });
  }
}
```

---

## Summary: Prevention Checklist

### Design Phase
- [ ] Profile token usage for each LLM step (p50, p95, p99)
- [ ] Set token limits to 150% of p95 usage
- [ ] Design schemas with `.default()`, `.optional()`, `.passthrough()`
- [ ] Use `flexibleEnum()` and `flexibleNumber()` helpers
- [ ] Add explicit array limits (`.max()`) to schemas
- [ ] Include output structure examples in prompts

### Implementation Phase
- [ ] Add `wasTruncated` flag to LLM API wrapper
- [ ] Implement multi-strategy JSON repair pipeline
- [ ] Add retry logic with escalating token limits
- [ ] Log repair strategy success for monitoring
- [ ] Accumulate token usage across retries

### Testing Phase
- [ ] Save real truncated outputs as test fixtures
- [ ] Create synthetic truncation tests
- [ ] Test schema validation with partial data
- [ ] End-to-end test retry logic

### Monitoring Phase
- [ ] Track JSON parse success rate
- [ ] Monitor truncation rate (stop_reason === 'max_tokens')
- [ ] Alert on aggressive repair usage
- [ ] Dashboard for token utilization trends
- [ ] Runbook for parse failure investigation

---

## Related Documentation

- **Architecture:** `/Users/alijangbar/Desktop/sparlo-v2/docs/solutions/architecture/schema-antifragility-llm-output-20251223.md`
- **Best Practices:** `/Users/alijangbar/Desktop/sparlo-v2/docs/LLM_SCHEMA_BEST_PRACTICES.md`
- **Cookbook:** `/Users/alijangbar/Desktop/sparlo-v2/docs/LLM_IMPLEMENTATION_COOKBOOK.md`
- **Implementation:** `/Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/llm/client.ts` (lines 369-796)
- **Retry Logic:** `/Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/inngest/functions/generate-dd-report.ts` (lines 1038-1161)

---

**End of Prevention Strategies Guide**
