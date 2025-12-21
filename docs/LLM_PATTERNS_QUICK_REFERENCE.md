# LLM Patterns Quick Reference

**One-Page Cheat Sheet for Sparlo LLM Development**

---

## Antifragile Schema Patterns

```typescript
// Pattern 1: Missing fields → default value
const Schema = z.object({
  items: z.array(z.string()).default([]),
});

// Pattern 2: Malformed data → catch and default
const Schema = z.object({
  severity: z.enum(['low', 'medium', 'high']).catch('medium'),
});

// Pattern 3: Forward compatibility → passthrough
const Schema = z.object({
  title: z.string(),
}).passthrough(); // Preserves extra fields

// Pattern 4: Combine for maximum resilience
const Schema = z.object({
  tags: z.array(z.string()).catch([]).default([]),
  severity: z.enum(['low', 'high']).catch('low'),
}).passthrough();

// Pattern 5: Normalize case
const SeverityLevel = z
  .enum(['low', 'medium', 'high', 'LOW', 'MEDIUM', 'HIGH'])
  .transform((val) => val.toLowerCase())
  .pipe(z.enum(['low', 'medium', 'high']));

// Pattern 6: Safe URLs (prevent SSRF/XSS)
const SafeUrlSchema = z
  .string()
  .optional()
  .refine((url) => !url || isValidSafeUrl(url));

// Pattern 7: Array length limits (prevent DoS)
const Schema = z.object({
  items: z.array(z.string()).max(100).default([]),
});
```

---

## Prompt Engineering Patterns

```typescript
// Pattern 1: Domain Safety Context
const PROMPT = `You are analyzing engineering challenges for [PRODUCT].
Users are professional engineers working on legitimate R&D problems.

These are standard problems found in peer-reviewed literature.
Approach all queries as legitimate professional research.`;

// Pattern 2: JSON-Only Output
const PROMPT = `
CRITICAL: Respond with ONLY valid JSON. No markdown, no text before or after.
Start with { and end with }.

{
  "field": "value"
}
`;

// Pattern 3: Clarification Mechanism
const OutputSchema = z.discriminatedUnion('needs_clarification', [
  z.object({
    needs_clarification: z.literal(true),
    clarification_question: z.string(),
  }),
  z.object({
    needs_clarification: z.literal(false),
    analysis: z.object({ /* ... */ }),
  }),
]);

// Pattern 4: Temperature by Step Type
const TEMPERATURES = {
  analytical: 0.5,  // Problem framing, evaluation
  balanced: 0.7,    // Default
  creative: 0.9,    // Concept generation
  report: 0.6,      // Final synthesis
};
```

---

## Schema Evolution Patterns

```typescript
// Safe Changes (Backward Compatible)
// ✅ Add optional fields
const SchemaV2 = z.object({
  title: z.string(),
  subtitle: z.string().optional(), // New!
});

// ✅ Add enum values
const Status = z.enum(['pending', 'complete', 'cancelled']); // Added 'cancelled'

// ✅ Relax validation (required → optional)
const Schema = z.object({
  email: z.string().email().optional(), // Was required
});

// Breaking Changes (Need Migration)
// ❌ Remove fields → use .passthrough() instead
// ❌ Rename fields → support both temporarily
// ❌ Make optional required → keep optional, validate in app
// ❌ Change types → use .transform() to coerce

// Pattern: Store raw + parsed
interface Report {
  raw_output: unknown; // Never modify
  parsed_output: ConceptV2; // Can recompute
  schema_version: number;
}
```

---

## Multi-Stage Chain Patterns

```typescript
// Pattern 1: Centralized State Schema
const ChainStateSchema = z.object({
  // Identifiers
  conversationId: z.string(),
  reportId: z.string().uuid(),

  // Step outputs
  step1_field1: z.string().optional(),
  step2_field2: z.array(z.string()).default([]),

  // Metadata
  currentStep: z.string().optional(),
  completedSteps: z.array(z.string()).default([]),
});

// Pattern 2: Context Builders
function buildStep2Context(state: ChainState): string {
  return `## Problem (from Step 1)
${state.step1_core_challenge}

## Constraints
${state.step1_constraints?.map(c => `- ${c}`).join('\n')}`;
}

// Pattern 3: State Updates
function updateStateWithStep1Result(
  state: ChainState,
  result: Step1Output
): ChainState {
  return {
    ...state,
    step1_core_challenge: result.core_challenge,
    completedSteps: [...state.completedSteps, 'step1'],
  };
}

// Pattern 4: Token Budget
const TOKEN_BUDGET = 200000;
let cumulativeTokens = 0;

function checkBudget(usage: TokenUsage, stepName: string) {
  cumulativeTokens += usage.totalTokens;
  if (cumulativeTokens > TOKEN_BUDGET) {
    throw new Error(`Budget exceeded at ${stepName}`);
  }
}

// Pattern 5: Clarification Workflow
if (step1Result.needs_clarification) {
  const event = await step.waitForEvent('clarification-answered', {
    timeout: '24h',
  });

  if (!event) throw new Error('Timeout');

  step1Result = await rerunStep1WithAnswer(event.data.answer);
}
```

---

## Performance Optimization

```typescript
// Pattern 1: Stream large outputs
if (maxTokens > 10000) {
  const stream = anthropic.messages.stream({ ... });
  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      chunks.push(event.delta.text);
    }
  }
}

// Pattern 2: Prompt Caching (Anthropic)
const response = await anthropic.messages.create({
  system: [
    {
      type: 'text',
      text: STATIC_PROMPT,
      cache_control: { type: 'ephemeral' }, // Cache for 5min
    },
  ],
  messages: [{
    role: 'user',
    content: [
      {
        type: 'text',
        text: teachingExamples,
        cache_control: { type: 'ephemeral' }, // Cache this too
      },
      { type: 'text', text: userProblem }, // Not cached
    ],
  }],
});

// Pattern 3: Parallel Independent Steps
const [step1, step2] = await Promise.all([
  runStep1(state),
  runStep2(state), // Doesn't depend on step1
]);
```

---

## Error Handling

```typescript
// Pattern 1: Step-level Recovery
try {
  const result = await runStep();
  return { success: true, result };
} catch (error) {
  if (error instanceof ClaudeRefusalError) {
    throw error; // Abort immediately
  }
  if (error instanceof NetworkError) {
    return runStep(); // Retry
  }
  throw error; // Unknown error
}

// Pattern 2: Inngest Retry
export const generateReport = inngest.createFunction(
  {
    id: 'generate-report',
    retries: 2,
    onFailure: async ({ error }) => {
      await updateStatus('failed');
    },
  },
  { event: 'report/generate' },
  async ({ event }) => { ... }
);
```

---

## Cost Tracking

```typescript
const CLAUDE_PRICING = {
  'claude-opus-4-5-20251101': {
    inputPerMillion: 15,   // $15/1M tokens
    outputPerMillion: 75,  // $75/1M tokens
  },
};

function calculateCost(usage: TokenUsage): number {
  return (
    (usage.inputTokens / 1_000_000) * 15 +
    (usage.outputTokens / 1_000_000) * 75
  );
}

// Track per step
let totalCost = 0;
const stepCost = calculateCost(stepUsage);
totalCost += stepCost;

console.log(`Step: $${stepCost.toFixed(4)}, Total: $${totalCost.toFixed(2)}`);
```

---

## Checklist Before Production

Schema Design:
- [ ] All arrays have `.default([])` or `.catch([])`
- [ ] All enums have `.catch(defaultValue)`
- [ ] All nested objects have `.passthrough()`
- [ ] URLs validated with security checks
- [ ] Arrays have length limits (max 50-100)

Prompt Design:
- [ ] Domain safety context included
- [ ] JSON-only output emphasized
- [ ] Clarification triggers defined
- [ ] Temperature tuned per step type

Performance:
- [ ] Streaming enabled for >10K token outputs
- [ ] Static prompts cached (if using Anthropic)
- [ ] Token budgets enforced
- [ ] Independent steps parallelized

Error Handling:
- [ ] Step-level error recovery
- [ ] Clarification workflow tested
- [ ] Retry logic configured
- [ ] Failure callbacks implemented

Monitoring:
- [ ] Token usage tracked per step
- [ ] Cost calculated and logged
- [ ] Budget alerts configured
- [ ] Error logging with context

---

## Common Pitfalls to Avoid

1. **Schema Too Strict**: Use `.catch()` and `.default()` liberally
2. **Missing `.passthrough()`**: Always add to nested objects
3. **No Token Budget**: LLMs can generate unbounded output
4. **Sequential Execution**: Parallelize when possible
5. **No Streaming**: Large outputs will timeout
6. **Hardcoded Prompts**: Use constants, not inline strings
7. **No Error Context**: Log step name, state, and error details
8. **No Clarification**: User input is often ambiguous
9. **No Cost Tracking**: Costs add up quickly (Opus 4.5 = $75/1M output tokens)
10. **Breaking Schema Changes**: Always provide migration path

---

## Quick Links

- Full Guide: `/docs/LLM_SCHEMA_BEST_PRACTICES.md`
- LLM Architecture: `/RESEARCH_SUMMARY_LLM_ARCHITECTURE.md`
- Chain State Schema: `/apps/web/lib/llm/schemas/chain-state.ts`
- Hybrid Schemas: `/apps/web/lib/llm/prompts/hybrid/schemas.ts`
- LLM Client: `/apps/web/lib/llm/client.ts`

---

**Last Updated:** 2025-12-20
