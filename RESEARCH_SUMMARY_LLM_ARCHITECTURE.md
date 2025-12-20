# Sparlo LLM Architecture Research Summary

**Research Date:** 2025-12-20
**Repository:** /Users/alijangbar/sparlo-v2

---

## Executive Summary

Sparlo uses a sophisticated multi-step LLM chain orchestrated by Inngest for durable function execution. The architecture features two modes: **Standard Mode** (AN0-AN5) and **Hybrid Mode** (AN0-M through AN5-M), both using Anthropic's Claude Opus 4.5 for TRIZ-based engineering design analysis.

**Key Findings:**
- All LLM calls go through a centralized client wrapper (`callClaude`) in `/apps/web/lib/llm/client.ts`
- Context is passed between steps via a comprehensive `ChainState` object
- Streaming is used for large token requests (>10K tokens) to avoid timeouts
- Token usage tracking and cost calculation is built-in
- NO prompt caching is currently implemented
- NO explicit optimization patterns beyond streaming

---

## 1. LLM API Call Orchestration

### 1.1 Core Client: `/apps/web/lib/llm/client.ts`

**Lines 95-238: The `callClaude` function**

This is the single point of entry for all Anthropic API calls:

```typescript
export async function callClaude(params: {
  model: (typeof MODELS)[keyof typeof MODELS];
  system: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
  images?: ImageAttachment[];
}): Promise<ClaudeResult>
```

**Key Features:**
- **Line 60-71:** Singleton client pattern for Anthropic SDK
- **Line 76-79:** Uses Claude Opus 4.5 (`claude-opus-4-5-20251101`)
- **Line 104:** Default max tokens: 8192
- **Line 105:** Default temperature: 1
- **Lines 107-134:** Vision support via image attachments
- **Lines 138-187:** **Streaming for large requests** (>10K tokens)
- **Lines 190-226:** Non-streaming for smaller requests
- **Lines 162-168, 199-205:** Refusal detection and custom error handling
- **Lines 179-184, 220-224:** Token usage extraction

**Streaming Strategy (Lines 138-187):**
```typescript
if (maxTokens > 10000) {
  const stream = anthropic.messages.stream({
    model: params.model,
    max_tokens: maxTokens,
    temperature,
    system: params.system,
    messages: [{ role: 'user', content: messageContent }],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta') {
      chunks.push(event.delta.text);
    }
  }
}
```

**Cost Tracking (Lines 36-55):**
```typescript
export const CLAUDE_PRICING = {
  'claude-opus-4-5-20251101': {
    inputPerMillion: 15,
    outputPerMillion: 75,
  },
} as const;

export function calculateCost(usage: TokenUsage, model: keyof typeof CLAUDE_PRICING): number {
  const pricing = CLAUDE_PRICING[model];
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputPerMillion;
  return inputCost + outputCost;
}
```

---

## 2. Prompt Chain Structure

### 2.1 Standard Mode Chain (AN0-AN5)

**Orchestrator:** `/apps/web/lib/inngest/functions/generate-report.ts`

**Chain Flow:**

1. **AN0 - Problem Framing** (Lines 201-227)
   - System Prompt: `AN0_PROMPT` from `/apps/web/lib/llm/prompts/an0-problem-framing.ts`
   - Max Tokens: 8000
   - Handles clarification questions (Lines 230-314)
   - Output: Problem interpretation, TRIZ contradiction, physics analysis

2. **AN1 - Corpus Retrieval** (Lines 323-367)
   - NOT an LLM call - uses vector search via Voyage AI + Pinecone
   - File: `/apps/web/lib/corpus/vector-retrieval.ts`
   - Searches 4 namespaces: failures, bounds, transfers, triz
   - Returns semantic matches for teaching examples

3. **AN1.5 - Teaching Selection** (Lines 383-439)
   - System Prompt: `AN1_5_PROMPT` from `/apps/web/lib/llm/prompts/an1.5-reranker.ts`
   - Max Tokens: 8000
   - Selects exemplars from corpus results
   - Conditional: Only runs if corpus results exist (Line 385-393)

4. **AN1.7 - Literature Augmentation** (Lines 444-465)
   - System Prompt: `AN1_7_PROMPT` from `/apps/web/lib/llm/prompts/an1.7-literature.ts`
   - Max Tokens: 8000
   - Searches for commercial precedent and parameters

5. **AN2 - Innovation Briefing** (Lines 481-506)
   - System Prompt: `AN2_PROMPT` from `/apps/web/lib/llm/prompts/an2-innovation-briefing.ts`
   - Max Tokens: 8000
   - Synthesizes methodology guidance for concept generation

6. **AN3 - Concept Generation** (Lines 525-546)
   - System Prompt: `AN3_PROMPT` from `/apps/web/lib/llm/prompts/an3-concept-generation.ts`
   - Max Tokens: **24000** (largest in chain)
   - Generates 5-8 novel solution concepts

7. **AN4 - Evaluation** (Lines 562-587)
   - System Prompt: `AN4_PROMPT` from `/apps/web/lib/llm/prompts/an4-evaluation.ts`
   - Max Tokens: 16000
   - Validates concepts against constraints

8. **AN5 - Report Generation** (Lines 603-629)
   - System Prompt: `AN5_PROMPT` from `/apps/web/lib/llm/prompts/an5-report.ts`
   - Max Tokens: **24000**
   - Final executive report synthesis

**Total Steps:** 7 LLM calls (AN1 is vector search only)

### 2.2 Hybrid Mode Chain (AN0-M through AN5-M)

**Orchestrator:** `/apps/web/lib/inngest/functions/generate-hybrid-report.ts`

**Key Differences:**
- 4 solution tracks: simpler_path, best_fit, paradigm_shift, frontier_transfer
- Different prompts with "full-spectrum" analysis approach
- All prompts in: `/apps/web/lib/llm/prompts/hybrid/prompts.ts`
- Max Tokens: **20000** for all steps (Line 65 in `/apps/web/lib/llm/prompts/hybrid/index.ts`)
- Temperature variations (Lines 68-73):
  - Default: 0.7
  - Creative (AN3-M): 0.9
  - Analytical (AN4-M): 0.5
  - Report (AN5-M): 0.6

**Token Budget Enforcement (Lines 143-154):**
```typescript
const TOKEN_BUDGET_LIMIT = 200000; // 200K tokens max per report

function checkTokenBudget(usage: TokenUsage, stepName: string) {
  cumulativeTokens += usage.totalTokens;
  if (cumulativeTokens > TOKEN_BUDGET_LIMIT) {
    throw new Error(
      `Token budget exceeded at ${stepName}: ${cumulativeTokens}/${TOKEN_BUDGET_LIMIT}`
    );
  }
}
```

---

## 3. Context Passing Between Steps

### 3.1 Chain State Schema

**File:** `/apps/web/lib/llm/schemas/chain-state.ts`

**Lines 389-626:** The `ChainStateSchema` is a comprehensive Zod schema that holds:

```typescript
export const ChainStateSchema = z.object({
  // Identifiers (Lines 391-392)
  conversationId: z.string(),
  reportId: z.string().uuid(),

  // User input (Lines 395-397)
  userInput: z.string(),
  accountId: z.string().uuid(),
  userId: z.string().uuid(),

  // Clarification handling (Lines 400-403)
  needsClarification: z.boolean().default(false),
  clarificationQuestion: z.string().nullish(),
  clarificationAnswer: z.string().optional(),
  clarificationCount: z.number().int().default(0),

  // AN0 outputs (Lines 408-439)
  an0_original_ask: z.string().optional(),
  an0_problem_interpretation: z.string().optional(),
  an0_contradiction: AN0ContradictionSchema.optional(),
  an0_triz_principles: z.array(AN0TrizPrincipleSchema).default([]),
  // ... 20+ more AN0 fields

  // AN1 outputs (Lines 444-448)
  an1_failures: z.array(CorpusItemSchema).default([]),
  an1_bounds: z.array(CorpusItemSchema).default([]),
  an1_transfers: z.array(CorpusItemSchema).default([]),
  an1_triz: z.array(CorpusItemSchema).default([]),

  // AN1.5 outputs (Lines 452-458)
  an1_5_triz_exemplars: z.array(TrizExemplarSchema).default([]),
  an1_5_transfer_exemplars: z.array(TransferExemplarSchema).default([]),
  // ...

  // AN1.7, AN2, AN3, AN4, AN5 outputs...
  // Each step adds its structured output to state

  // Tracking (Lines 621-625)
  currentStep: z.string().optional(),
  completedSteps: z.array(z.string()).default([]),
  error: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});
```

**State Update Pattern (Example from Lines 762-794):**
```typescript
function updateStateWithAN0Analysis(
  state: ChainState,
  result: AN0Output,
): ChainState {
  return {
    ...state,
    an0_original_ask: result.original_ask,
    an0_problem_interpretation: result.problem_interpretation,
    an0_ambiguities_detected: result.ambiguities_detected,
    // ... spread all AN0 outputs into state
    completedSteps: ['an0'],
  };
}
```

### 3.2 Context Building Functions

**File:** `/apps/web/lib/inngest/functions/generate-report.ts`

Each step receives context from previous steps via builder functions:

1. **AN1.5 Context Builder** (Lines 800-863)
   - Receives: AN0 outputs + AN1 retrieval results
   - Builds markdown summary of corpus items with truncation

2. **AN1.7 Context Builder** (Lines 865-892)
   - Receives: AN0 outputs + AN1.5 corpus gaps
   - Formats materials/mechanisms to research

3. **AN2 Context Builder** (Lines 894-970)
   - Receives: AN0 + AN1.5 teaching examples + AN1.7 literature
   - Largest context - full problem framing + all teaching data

4. **AN3 Context Builder** (Lines 972-1054)
   - Receives: AN2 innovation briefing
   - Formatted innovation patterns + TRIZ guidance

5. **AN4 Context Builder** (Lines 1056-1121)
   - Receives: AN3 concepts + AN2 design constraints
   - Full concept details for validation

6. **AN5 Context Builder** (Lines 1123-1266)
   - Receives: ALL previous outputs
   - Complete analysis data for final synthesis

**Context Format Pattern:**
```typescript
function buildAN2ContextV10(
  state: ChainState,
  an1_5Result: AN1_5_Output | null,
  an1_7Result: AN1_7_Output,
): string {
  return `## Problem Framing (from AN0)

**Original Challenge:** ${state.an0_original_ask ?? state.userInput}
**Reframed Problem:** ${state.an0_reframed_problem ?? 'Not specified'}

### First Principles Decomposition
- **Fundamental Truths:** ${state.an0_first_principles?.fundamental_truths?.join('; ')}
...

## Teaching Examples (from AN1.5)

### TRIZ Exemplars
${JSON.stringify(an1_5Result?.teaching_examples?.triz_exemplars ?? [], null, 2)}
...`;
}
```

---

## 4. Existing Optimization Patterns

### 4.1 Streaming (The Only Current Optimization)

**Location:** `/apps/web/lib/llm/client.ts` Lines 138-187

**Trigger:** `maxTokens > 10000`

**Implementation:**
- Uses Anthropic SDK's streaming API
- Accumulates text chunks in array
- Extracts token usage from final message
- Prevents timeouts on large responses

**Usage in Chain:**
- AN3 (24K tokens) - STREAMING
- AN5 (24K tokens) - STREAMING
- AN4 (16K tokens) - STREAMING
- All others (8K tokens) - Non-streaming

### 4.2 Token Budget Monitoring (Hybrid Mode Only)

**Location:** `/apps/web/lib/inngest/functions/generate-hybrid-report.ts` Lines 137-154

**Budget:** 200K tokens per report

**Enforcement:**
```typescript
let cumulativeTokens = 0;

function checkTokenBudget(usage: TokenUsage, stepName: string) {
  cumulativeTokens += usage.totalTokens;
  if (cumulativeTokens > TOKEN_BUDGET_LIMIT) {
    throw new Error(`Token budget exceeded at ${stepName}`);
  }
}
```

Called after every LLM step in hybrid mode.

### 4.3 Conditional Step Execution

**Location:** `/apps/web/lib/inngest/functions/generate-report.ts` Lines 385-393

AN1.5 only runs if corpus retrieval returned results:

```typescript
const hasCorpusResults =
  an1Result.failures.length > 0 ||
  an1Result.bounds.length > 0 ||
  an1Result.transfers.length > 0 ||
  an1Result.triz.length > 0;

if (hasCorpusResults) {
  // Run AN1.5
}
```

### 4.4 Database Usage Tracking

**Location:** `/apps/web/lib/inngest/functions/generate-report.ts` Lines 658-672

**Implementation:**
```typescript
const { error: usageError } = await supabase.rpc('increment_usage', {
  p_account_id: accountId,
  p_tokens: totalUsage.totalTokens,
  p_is_report: true,
  p_is_chat: false,
});
```

Persists token consumption to database after report completion.

---

## 5. Notable Absence: Prompt Caching

**Search Results:**
- ❌ No `prompt_caching` found in codebase
- ❌ No `cache_control` found in codebase
- ❌ No Anthropic prompt caching implementation

**Implication:**
Every LLM call in the chain sends the full context from scratch. For chains with 7 steps, this means:
- AN2 receives full AN0 + AN1 + AN1.5 + AN1.7 output
- AN3 receives full AN2 output + prior context
- AN4 receives full AN3 concepts + AN2 constraints
- AN5 receives **ALL** previous outputs

**Potential Optimization:**
Anthropic's Prompt Caching could cache:
1. System prompts (static across all reports)
2. Teaching examples (same corpus items used across similar problems)
3. Previous step outputs (passed to subsequent steps)

---

## 6. Prompt Architecture

### 6.1 Standard Mode Prompts

**Location:** `/apps/web/lib/llm/prompts/`

All prompts follow this pattern:

```typescript
export const AN0_PROMPT = `You are a TRIZ-trained design strategist...

## Domain Context
[Safety/ethics context]

## PROBLEM DISAMBIGUATION
[Ambiguity handling instructions]

## TRIZ Contradiction Framing
[39 TRIZ parameters listed]

## OUTPUT FORMAT
CRITICAL: Respond with ONLY valid JSON. No markdown.

{
  "need_question": false,
  "original_ask": "...",
  // ... structured JSON schema
}
`;

export const AN0_METADATA = {
  id: 'an0',
  name: 'Problem Framing',
  description: 'Understanding your challenge...',
  temperature: 1,
};

export const AN0OutputSchema = z.object({
  need_question: z.boolean(),
  // ... Zod schema matching JSON format
});
```

**Key Characteristics:**
- All prompts are simple string constants (no templates)
- All require JSON-only responses
- All include domain safety context
- All have corresponding Zod schemas for validation
- No dynamic prompt assembly beyond context building

### 6.2 Hybrid Mode Prompts

**Location:** `/apps/web/lib/llm/prompts/hybrid/prompts.ts`

**Philosophy:** "The best solution wins regardless of origin"

**Differences:**
- 4 solution tracks vs 3
- Explicit "full-spectrum analysis" framing
- More emphasis on cross-domain examples
- Includes "industry blind spots" analysis
- Temperature variations per step

---

## 7. Error Handling & Resilience

### 7.1 Claude Refusal Detection

**Location:** `/apps/web/lib/llm/client.ts` Lines 162-168, 199-205

```typescript
if (response.stop_reason === 'refusal') {
  throw new ClaudeRefusalError(
    'Your design challenge could not be processed. Please rephrase...'
  );
}
```

Custom error type for safety filter triggers.

### 7.2 Inngest Retry Configuration

**Location:** `/apps/web/lib/inngest/functions/generate-report.ts` Line 65

```typescript
export const generateReport = inngest.createFunction(
  {
    id: 'generate-report',
    retries: 2,
    onFailure: async ({ error, event, step }) => {
      // Update report status to failed
      // Log error details
    },
  },
  { event: 'report/generate' },
  async ({ event, step }) => { ... }
);
```

**Failure Handling (Lines 66-91):**
- Updates Supabase report status to 'failed'
- Stores user-friendly error message
- Logs error details (including stack in dev mode)

### 7.3 ClaudeRefusalError Top-Level Catch

**Location:** `/apps/web/lib/inngest/functions/generate-report.ts` Lines 119-136

```typescript
try {
  return await runReportGeneration();
} catch (error) {
  if (error instanceof ClaudeRefusalError) {
    // Update report with user-friendly error
    await supabase.from('sparlo_reports').update({
      status: 'failed',
      error_message: error.message,
    });
    return { success: false, reportId, error: error.message };
  }
  throw error; // Re-throw other errors for Inngest retry
}
```

Separates user-facing safety errors from technical errors.

---

## 8. Key File Locations

### 8.1 LLM Core
- **Client:** `/apps/web/lib/llm/client.ts` (238 lines)
- **Chain State Schema:** `/apps/web/lib/llm/schemas/chain-state.ts` (651 lines)

### 8.2 Standard Mode Prompts
- **Index:** `/apps/web/lib/llm/prompts/index.ts`
- **AN0:** `/apps/web/lib/llm/prompts/an0-problem-framing.ts`
- **AN1.5:** `/apps/web/lib/llm/prompts/an1.5-reranker.ts`
- **AN1.7:** `/apps/web/lib/llm/prompts/an1.7-literature.ts`
- **AN2:** `/apps/web/lib/llm/prompts/an2-innovation-briefing.ts`
- **AN3:** `/apps/web/lib/llm/prompts/an3-concept-generation.ts`
- **AN4:** `/apps/web/lib/llm/prompts/an4-evaluation.ts`
- **AN5:** `/apps/web/lib/llm/prompts/an5-report.ts`

### 8.3 Hybrid Mode Prompts
- **Index:** `/apps/web/lib/llm/prompts/hybrid/index.ts`
- **Prompts:** `/apps/web/lib/llm/prompts/hybrid/prompts.ts` (27,809 bytes)
- **Schemas:** `/apps/web/lib/llm/prompts/hybrid/schemas.ts` (16,598 bytes)

### 8.4 Orchestrators
- **Standard:** `/apps/web/lib/inngest/functions/generate-report.ts` (1,594 lines)
- **Hybrid:** `/apps/web/lib/inngest/functions/generate-hybrid-report.ts` (693 lines)
- **Discovery:** `/apps/web/lib/inngest/functions/generate-discovery-report.ts` (exists but not analyzed)

### 8.5 Corpus & Retrieval
- **Vector Search:** `/apps/web/lib/corpus/vector-retrieval.ts` (12,317 bytes)
- **Patent Search:** `/apps/web/lib/corpus/patent-search.ts` (4,178 bytes)
- **Index:** `/apps/web/lib/corpus/index.ts`

### 8.6 Inngest Setup
- **Client:** `/apps/web/lib/inngest/client.ts`
- **Functions Index:** `/apps/web/lib/inngest/functions/index.ts`

---

## 9. Token Economics

### 9.1 Pricing (as of Dec 2024)

**Source:** `/apps/web/lib/llm/client.ts` Lines 36-41

```typescript
export const CLAUDE_PRICING = {
  'claude-opus-4-5-20251101': {
    inputPerMillion: 15,    // $15 per 1M input tokens
    outputPerMillion: 75,   // $75 per 1M output tokens
  },
} as const;
```

### 9.2 Estimated Token Usage Per Chain

**Standard Mode (AN0-AN5):**
- **AN0:** ~2K input, ~2K output (8K max) = ~$0.13
- **AN1.5:** ~5K input, ~3K output (8K max) = ~$0.30
- **AN1.7:** ~3K input, ~2K output (8K max) = ~$0.23
- **AN2:** ~10K input, ~5K output (8K max) = ~$0.53
- **AN3:** ~15K input, ~20K output (24K max) = ~$1.73
- **AN4:** ~25K input, ~12K output (16K max) = ~$1.28
- **AN5:** ~30K input, ~20K output (24K max) = ~$1.95

**Estimated Total:** ~$6-8 per standard report

**Hybrid Mode:**
- Uses 20K max tokens per step
- 200K token budget limit
- Estimated ~$10-15 per hybrid report

### 9.3 Cost Tracking in Database

**Implementation:** Lines 658-672 in `generate-report.ts`

```typescript
const { error: usageError } = await supabase.rpc('increment_usage', {
  p_account_id: accountId,
  p_tokens: totalUsage.totalTokens,
  p_is_report: true,
  p_is_chat: false,
});
```

**Database Function:** `increment_usage` (stored procedure in Supabase)

---

## 10. Clarification Flow

### 10.1 AN0 Clarification Detection

**Location:** `/apps/web/lib/inngest/functions/generate-report.ts` Lines 230-314

**Trigger:**
```typescript
if (an0Result.result.need_question === true) {
  const clarificationQuestion = an0Result.result.question;
  // Store and wait for answer
}
```

**Workflow:**
1. AN0 returns `need_question: true`
2. Update report status to 'clarifying'
3. Store question in database
4. Wait for event: `report/clarification-answered` (24h timeout)
5. Re-run AN0 with clarification answer
6. Continue chain with updated AN0 result

**Timeout Handling:**
```typescript
const clarificationEvent = await step.waitForEvent(
  'wait-for-clarification',
  {
    event: 'report/clarification-answered',
    match: 'data.reportId',
    timeout: '24h',
  },
);

if (!clarificationEvent) {
  // Update to error status
}
```

### 10.2 Clarification State Tracking

**Schema Fields:** Lines 400-403 in `chain-state.ts`

```typescript
needsClarification: z.boolean().default(false),
clarificationQuestion: z.string().nullish(),
clarificationAnswer: z.string().optional(),
clarificationCount: z.number().int().default(0),
```

---

## 11. Vision Support (Image Attachments)

### 11.1 Implementation

**Location:** `/apps/web/lib/llm/client.ts` Lines 84-134

**Type Definition:**
```typescript
export interface ImageAttachment {
  media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  data: string; // base64 encoded
}
```

**Message Construction (Lines 117-134):**
```typescript
const messageContent: ContentBlock[] = [];

// Add images first if present (Claude processes them before text)
if (params.images && params.images.length > 0) {
  for (const image of params.images) {
    messageContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: image.media_type,
        data: image.data,
      },
    });
  }
}

// Add text message
messageContent.push({ type: 'text', text: params.userMessage });
```

### 11.2 Usage in Chain

**AN0 Only:** Lines 207-218 in `generate-report.ts`

```typescript
const userMessageWithContext =
  imageAttachments.length > 0
    ? `${designChallenge}\n\n[Note: ${imageAttachments.length} image(s) attached]`
    : designChallenge;

const { content, usage } = await callClaude({
  model: MODELS.OPUS,
  system: AN0_PROMPT,
  userMessage: userMessageWithContext,
  maxTokens: 8000,
  images: imageAttachments.length > 0 ? imageAttachments : undefined,
});
```

**Note:** Images are only used in AN0 problem framing, not passed to later steps.

---

## 12. Progress Tracking

### 12.1 Database Updates

**Helper Function:** Lines 184-196 in `generate-report.ts`

```typescript
async function updateProgress(updates: Record<string, unknown>) {
  const { error } = await supabase
    .from('sparlo_reports')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    console.error('Failed to update progress:', error);
  }
}
```

### 12.2 Progress Updates Per Step

**Before Each LLM Call:**
```typescript
await updateProgress({
  current_step: 'an0',
  phase_progress: 0,
});

// ... LLM call ...

await updateProgress({
  phase_progress: 100
});
```

**Phase Metadata:** Lines 72-123 in `/apps/web/lib/llm/prompts/index.ts`

```typescript
export const PHASES = [
  {
    id: 'an0',
    name: 'Problem Framing',
    description: 'Understanding your challenge...',
    estimatedMinutes: 1.5,
  },
  // ... 7 more phases
] as const;
```

Used for UI progress indicators and time estimates.

---

## 13. Discovered Optimization Opportunities

### 13.1 Prompt Caching (High Impact)

**Current State:** ❌ Not implemented

**Opportunity:**
- System prompts are identical across all reports of the same mode
- Teaching examples could be cached when similar
- Previous step outputs could be cached for subsequent steps

**Potential Savings:**
- 50-70% reduction in input tokens for steps AN2-AN5
- Could save $2-4 per standard report
- ~$5-8 per hybrid report

**Implementation Location:**
Modify `callClaude` function in `/apps/web/lib/llm/client.ts`

### 13.2 Context Truncation (Medium Impact)

**Current State:** ⚠️ Partial (only for corpus items)

**Opportunity:**
- AN5 receives ALL previous outputs (Lines 1123-1266)
- Could truncate less critical fields
- Could summarize intermediate results

**Example from Line 813:**
```typescript
const simplifyCorpusItems = (
  items: Array<{...}>,
  maxItems: number,
  maxPreviewLength: number = 500,
) => {
  return items.slice(0, maxItems).map((item) => ({
    id: item.id,
    title: item.title,
    text_preview: item.text_preview?.slice(0, maxPreviewLength) + '...',
  }));
};
```

This pattern could be extended to other data types.

### 13.3 Parallel Step Execution (Low Impact)

**Current State:** ❌ Sequential only

**Opportunity:**
- AN1.5 and AN1.7 could theoretically run in parallel (both depend only on AN0+AN1)
- However, Inngest step.run already handles parallelization where safe
- Limited benefit given chain dependencies

---

## 14. Architecture Strengths

### 14.1 Type Safety
- Comprehensive Zod schemas for all outputs
- TypeScript type inference from schemas
- Runtime validation of LLM responses

### 14.2 Error Handling
- Custom error types (ClaudeRefusalError)
- Retry logic via Inngest
- User-friendly error messages
- Detailed error logging

### 14.3 Observability
- Token usage tracking per step
- Cost calculation
- Progress tracking in database
- Completion status tracking

### 14.4 Maintainability
- Clear separation of concerns (prompts, schemas, orchestration)
- Single source of truth for LLM calls
- Consistent patterns across modes

### 14.5 Resilience
- Durable execution via Inngest
- Streaming for large responses
- Timeout handling
- Token budget limits

---

## 15. Architecture Weaknesses

### 15.1 No Prompt Caching
- Significant cost opportunity missed
- Repeated transmission of identical system prompts
- Redundant context in later steps

### 15.2 Context Size Growth
- Each step accumulates more context
- AN5 receives full outputs from all previous steps
- No intelligent summarization or pruning

### 15.3 Limited Parallelization
- Strictly sequential chain
- Could potentially parallelize AN1.5 + AN1.7

### 15.4 Hardcoded Configuration
- Token limits hardcoded in prompts
- Temperature settings in constants
- No runtime configuration flexibility

### 15.5 No Incremental Caching
- Vector search results not cached across similar problems
- Teaching examples re-selected for each report
- No corpus result reuse

---

## 16. Recommendations for Optimization

### Priority 1: Implement Prompt Caching
**Impact:** High (50-70% input token reduction)
**Effort:** Medium
**Location:** `/apps/web/lib/llm/client.ts`

**Implementation:**
```typescript
// Add cache_control to system prompts
const systemBlocks = [
  {
    type: "text",
    text: params.system,
    cache_control: { type: "ephemeral" }
  }
];

// Add cache_control to teaching examples
if (params.cachedContext) {
  systemBlocks.push({
    type: "text",
    text: params.cachedContext,
    cache_control: { type: "ephemeral" }
  });
}
```

### Priority 2: Intelligent Context Truncation
**Impact:** Medium (20-30% input token reduction)
**Effort:** Low
**Location:** Context builder functions in orchestrators

**Implementation:**
- Extend `simplifyCorpusItems` pattern to all data types
- Implement field-level importance scoring
- Keep only essential fields for downstream steps

### Priority 3: Result Caching for Similar Problems
**Impact:** High (could skip steps entirely)
**Effort:** High
**Location:** New caching layer before vector retrieval

**Implementation:**
- Hash problem description + constraints
- Check cache for similar problems (semantic similarity)
- Reuse corpus results + teaching examples if match found

### Priority 4: Streaming for All Steps
**Impact:** Low (better UX, no cost impact)
**Effort:** Low
**Location:** `/apps/web/lib/llm/client.ts`

**Implementation:**
- Lower streaming threshold from 10K to 5K tokens
- Add real-time progress updates during streaming

---

## Appendix A: Complete Token Flow Example

**Standard Mode Report:**

```
AN0 (Problem Framing)
├─ Input: ~1K tokens (user challenge + system prompt)
├─ Output: ~2K tokens (JSON with problem analysis)
└─ State Update: 2K tokens stored

AN1 (Corpus Retrieval)
└─ No LLM call (vector search only)

AN1.5 (Teaching Selection)
├─ Input: ~5K tokens (AN0 state + corpus results + system prompt)
├─ Output: ~3K tokens (selected exemplars)
└─ State Update: 5K tokens total

AN1.7 (Literature Augmentation)
├─ Input: ~3K tokens (AN0 + AN1.5 gaps + system prompt)
├─ Output: ~2K tokens (commercial precedent)
└─ State Update: 7K tokens total

AN2 (Innovation Briefing)
├─ Input: ~10K tokens (AN0 + AN1.5 + AN1.7 + system prompt)
├─ Output: ~5K tokens (methodology guidance)
└─ State Update: 12K tokens total

AN3 (Concept Generation)
├─ Input: ~15K tokens (AN2 briefing + context + system prompt)
├─ Output: ~20K tokens (8 detailed concepts)
└─ State Update: 32K tokens total

AN4 (Evaluation)
├─ Input: ~25K tokens (AN3 concepts + AN2 constraints + system prompt)
├─ Output: ~12K tokens (validation results)
└─ State Update: 44K tokens total

AN5 (Report Generation)
├─ Input: ~30K tokens (ALL previous outputs + system prompt)
├─ Output: ~20K tokens (executive report)
└─ Final State: 64K tokens total

Total Input Tokens: ~89K
Total Output Tokens: ~64K
Total Cost: ~$6.15
```

**With Prompt Caching (Estimated):**

```
AN0: Same (1K input)
AN1.5: 2K new + 3K cached = 5K total → ~60% savings on input
AN1.7: 1K new + 2K cached = 3K total → ~67% savings on input
AN2: 3K new + 7K cached = 10K total → ~70% savings on input
AN3: 5K new + 10K cached = 15K total → ~67% savings on input
AN4: 8K new + 17K cached = 25K total → ~68% savings on input
AN5: 10K new + 20K cached = 30K total → ~67% savings on input

Total Input Tokens: ~30K new + ~59K cached = 89K total
Cache Savings: ~$0.85 (cached tokens cost 10% of regular)
New Cost: ~$3.42 (44% reduction)
```

---

**End of Research Summary**
