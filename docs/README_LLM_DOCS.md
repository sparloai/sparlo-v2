# LLM Development Documentation Index

**Comprehensive guides for building robust LLM-powered features in Sparlo**

---

## Documentation Overview

This documentation suite provides everything you need to work with LLMs in Sparlo, from high-level architecture to practical implementation patterns.

### 📚 Document Structure

```
docs/
├── README_LLM_DOCS.md                    ← You are here
├── LLM_SCHEMA_BEST_PRACTICES.md          ← Complete reference guide (26 patterns)
├── LLM_PATTERNS_QUICK_REFERENCE.md       ← One-page cheat sheet
└── LLM_IMPLEMENTATION_COOKBOOK.md        ← Step-by-step recipes

Root:
└── RESEARCH_SUMMARY_LLM_ARCHITECTURE.md  ← Existing system architecture
```

---

## Quick Start Guide

### New to Sparlo LLM Development?

**Start here:**

1. **Read the architecture overview** (10 min)
   - File: `/RESEARCH_SUMMARY_LLM_ARCHITECTURE.md`
   - Understand the 7-step AN0-AN5 chain
   - Learn how context flows between steps

2. **Review the quick reference** (5 min)
   - File: `/docs/LLM_PATTERNS_QUICK_REFERENCE.md`
   - Get familiar with schema patterns
   - Understand common pitfalls

3. **Try a cookbook recipe** (30 min)
   - File: `/docs/LLM_IMPLEMENTATION_COOKBOOK.md`
   - Pick a scenario similar to your task
   - Follow the step-by-step implementation

4. **Deep dive as needed**
   - File: `/docs/LLM_SCHEMA_BEST_PRACTICES.md`
   - Reference specific patterns when needed

---

## Document Descriptions

### 1. RESEARCH_SUMMARY_LLM_ARCHITECTURE.md

**Purpose:** Existing system architecture documentation

**Contains:**
- Complete breakdown of AN0-AN5 chain flow
- Token usage analysis
- Cost tracking patterns
- Current optimization opportunities
- File location reference

**When to use:**
- Understanding how the existing system works
- Finding where specific logic lives
- Planning new features that integrate with existing chain
- Debugging chain execution issues

**Key Sections:**
- Section 2: Prompt Chain Structure (AN0-AN5)
- Section 3: Context Passing Between Steps
- Section 8: Key File Locations

---

### 2. LLM_SCHEMA_BEST_PRACTICES.md

**Purpose:** Comprehensive pattern library (26 patterns)

**Contains:**
- Antifragile schema design (`.default()`, `.catch()`, `.passthrough()`)
- Prompt engineering for technical reports
- Schema evolution & backward compatibility
- Multi-stage prompt chains
- Performance optimization
- Real-world Sparlo examples

**When to use:**
- Designing new schemas
- Evolving existing schemas
- Writing prompts for technical analysis
- Optimizing token usage
- Implementing clarification flows

**Key Sections:**
- Section 1: Structured LLM Output Schemas (Patterns 1-9)
- Section 2: Prompt Engineering (Patterns 10-14)
- Section 3: Schema Evolution (Patterns 15-17)
- Section 4: Multi-Stage Chains (Patterns 18-23)
- Section 5: Performance Optimization (Patterns 24-26)

**Most Important Patterns:**
- Pattern 1-4: The Three Pillars + `.optional()`
- Pattern 5: Case normalization with `.transform()`
- Pattern 18: Chain state management
- Pattern 25: Prompt caching (high ROI)

---

### 3. LLM_PATTERNS_QUICK_REFERENCE.md

**Purpose:** One-page cheat sheet for daily use

**Contains:**
- Schema patterns in condensed format
- Prompt templates
- Performance optimization quick wins
- Pre-flight checklists
- Common pitfalls

**When to use:**
- Quick lookup during coding
- Code review reference
- Onboarding new developers
- Daily development workflow

**Print this out or keep it open while coding!**

---

### 4. LLM_IMPLEMENTATION_COOKBOOK.md

**Purpose:** Step-by-step recipes for common scenarios

**Contains:**
- Adding a new LLM step to chain
- Creating resilient schemas
- Handling schema evolution
- Implementing clarification flow
- Building context for multi-step chains
- Optimizing token usage

**When to use:**
- Starting a new feature
- Solving a specific problem
- Learning by example
- Copy-paste starting points

**Featured Recipes:**
1. Adding AN6 Risk Assessment step (complete walkthrough)
2. Creating antifragile Material Properties schema
3. Migrating schemas without breaking data
4. Building curated context for AN3
5. Implementing prompt caching (75% cost savings)

---

## Common Use Cases

### "I need to add a new step to the LLM chain"

**Path:**
1. Read: Cookbook → Section 1 (Adding a New LLM Step)
2. Reference: Best Practices → Section 1 (Schema Design)
3. Reference: Best Practices → Section 4 (Context Passing)
4. Check: Quick Reference → Checklist

**Time:** 1-2 hours for first step, 30 min for subsequent steps

---

### "I need to modify an existing schema without breaking production"

**Path:**
1. Read: Best Practices → Section 3 (Schema Evolution)
2. Read: Cookbook → Section 3 (Handling Schema Evolution)
3. Check: Quick Reference → Safe vs Breaking Changes

**Time:** 30-60 minutes

**Key Decision:** Additive change (fast) vs explicit versioning (safe)

---

### "My LLM output isn't validating correctly"

**Path:**
1. Check: Quick Reference → Antifragile Schema Patterns
2. Add: `.catch()` for malformed data, `.default()` for missing fields
3. Add: `.passthrough()` to all nested objects
4. Reference: Best Practices → Pattern 1-4

**Time:** 10-20 minutes

**Quick Fix:** Wrap problematic field in `.catch(defaultValue)`

---

### "My token costs are too high"

**Path:**
1. Read: Architecture → Section 9 (Token Economics)
2. Read: Best Practices → Section 5 (Performance Optimization)
3. Implement: Cookbook → Section 6 (Optimizing Token Usage)
4. Priority: Prompt caching (Pattern 25) - biggest ROI

**Time:** 2-4 hours for caching implementation

**Expected Savings:** 50-75% input token cost reduction

---

### "I need to write a new prompt for technical analysis"

**Path:**
1. Read: Best Practices → Section 2 (Prompt Engineering)
2. Copy: Existing prompt from `/apps/web/lib/llm/prompts/an0-problem-framing.ts`
3. Customize: Domain context, task definition, output format
4. Test: With various user inputs

**Time:** 1-2 hours

**Key Patterns:** Pattern 10 (safety context), Pattern 11 (JSON-only), Pattern 12 (clarification)

---

## Key Concepts Reference

### Antifragile Schemas

**Definition:** Schemas that improve with stress (malformed data, version changes, unexpected fields).

**Three Pillars:**
1. `.default([])` - Handle missing fields
2. `.catch(value)` - Recover from malformed data
3. `.passthrough()` - Preserve unknown fields

**Example:**
```typescript
const Schema = z.object({
  items: z.array(z.string()).catch([]).default([]),
  severity: z.enum(['low', 'high']).catch('low'),
}).passthrough();
```

**Benefits:** ~95% reduction in validation errors from LLM output

---

### Chain State

**Definition:** Comprehensive Zod schema holding all data from AN0-AN5 steps.

**Location:** `/apps/web/lib/llm/schemas/chain-state.ts`

**Purpose:**
- Type-safe state management
- Context passing between steps
- Progress tracking
- Error recovery

**Pattern:**
```typescript
const ChainStateSchema = z.object({
  // Step outputs
  an0_field1: z.string().optional(),
  an1_field2: z.array(z.string()).default([]),

  // Metadata
  completedSteps: z.array(z.string()).default([]),
});
```

---

### Context Builders

**Definition:** Functions that extract relevant data from chain state for each step.

**Purpose:**
- Reduce token count (only include what's needed)
- Structure data for LLM (markdown formatting)
- Explicit dependencies between steps

**Pattern:**
```typescript
function buildStep2Context(state: ChainState): string {
  return `## Problem (from Step 1)
${state.step1_core_challenge}

## Constraints
${state.step1_constraints?.map(c => `- ${c}`).join('\n')}`;
}
```

**Location:** `/apps/web/lib/inngest/functions/generate-report.ts` (lines 800-1266)

---

### Prompt Caching

**Definition:** Anthropic feature to cache repeated context (system prompts, teaching examples).

**Status in Sparlo:** Not yet implemented (opportunity!)

**Savings:** 90% cost reduction on cached tokens

**Implementation:** Best Practices → Pattern 25, Cookbook → Section 6

**ROI:** ~$2-4 per report for standard mode, ~$5-8 for hybrid mode

---

### Clarification Flow

**Definition:** Workflow where LLM asks user for more info when input is ambiguous.

**Implementation:**
- Discriminated union schema (`needs_clarification: true | false`)
- Inngest `waitForEvent` for user response
- Re-run step with clarification answer

**Example:** AN0 asks "What specific metric defines 'faster'?"

**Pattern:** Best Practices → Pattern 12, Cookbook → Section 4

---

## File Locations Quick Reference

### Schemas

```
/apps/web/lib/llm/schemas/
├── chain-state.ts               # Centralized state schema (651 lines)
└── ...

/apps/web/lib/llm/prompts/
├── an0-problem-framing.ts       # AN0 schema + prompt
├── an1.5-reranker.ts            # AN1.5 schema + prompt
├── an2-innovation-briefing.ts   # AN2 schema + prompt
├── an3-concept-generation.ts    # AN3 schema + prompt
├── an4-evaluation.ts            # AN4 schema + prompt
├── an5-report.ts                # AN5 schema + prompt
└── hybrid/
    └── schemas.ts               # Hybrid mode schemas (best examples!)
```

### Prompts

```
/apps/web/lib/llm/prompts/
├── an{N}-{name}.ts              # Standard mode prompts
├── hybrid/prompts.ts            # Hybrid mode prompts
└── discovery/                   # Discovery mode prompts
```

### Orchestration

```
/apps/web/lib/inngest/functions/
├── generate-report.ts           # Standard mode chain (1594 lines)
├── generate-hybrid-report.ts    # Hybrid mode chain (693 lines)
└── generate-discovery-report.ts # Discovery mode chain
```

### LLM Client

```
/apps/web/lib/llm/
└── client.ts                    # Anthropic API wrapper (238 lines)
```

---

## Development Workflow

### 1. Research Phase (Before Coding)

- [ ] Read architecture doc (understand existing system)
- [ ] Identify which step(s) to modify
- [ ] Review similar examples in codebase
- [ ] Read relevant patterns in Best Practices

**Time:** 30-60 minutes

---

### 2. Design Phase

- [ ] Draft schema using antifragile patterns
- [ ] Write prompt with safety context + JSON format
- [ ] Plan context builder (what data from previous steps?)
- [ ] Consider token budget impact

**Time:** 1-2 hours

**Tool:** Use Cookbook recipes as templates

---

### 3. Implementation Phase

- [ ] Create schema file with `.passthrough()`
- [ ] Update chain state schema
- [ ] Implement context builder
- [ ] Add step to orchestrator
- [ ] Update phase metadata

**Time:** 2-4 hours

**Reference:** Cookbook → Section 1 (step-by-step)

---

### 4. Testing Phase

- [ ] Test with valid input (happy path)
- [ ] Test with missing fields (`.default()` works?)
- [ ] Test with malformed data (`.catch()` works?)
- [ ] Test with future fields (`.passthrough()` works?)
- [ ] Test clarification flow (if applicable)
- [ ] Monitor token usage

**Time:** 1-2 hours

**Tools:** `pnpm typecheck`, manual testing with sample reports

---

### 5. Optimization Phase

- [ ] Implement prompt caching (if step uses >10K tokens)
- [ ] Truncate context arrays (max 50-100 items)
- [ ] Remove unnecessary fields from context
- [ ] Consider parallelizing with other steps

**Time:** 2-4 hours

**ROI:** 50-75% cost reduction possible

---

## Tips for Success

### Schema Design

✅ **DO:**
- Use `.passthrough()` on ALL nested objects
- Use `.catch(defaultValue)` on enums and complex types
- Use `.default([])` on optional arrays
- Limit array lengths (`.max(100)`)
- Normalize case with `.transform()`

❌ **DON'T:**
- Use `.strict()` (breaks forward compatibility)
- Leave arrays without `.default()` or `.catch()`
- Hardcode fallback values inline (use constants)
- Skip `.passthrough()` to "enforce strict schema"

### Prompt Engineering

✅ **DO:**
- Include domain safety context upfront
- Emphasize JSON-only output multiple times
- Provide 1-2 concrete examples
- Define clarification triggers explicitly

❌ **DON'T:**
- Assume LLM understands implicit instructions
- Mix markdown and JSON in output
- Write prompts >5K tokens (use context builders instead)
- Skip temperature tuning per step type

### Performance

✅ **DO:**
- Cache static system prompts
- Cache teaching examples for similar problems
- Stream outputs >10K tokens
- Parallelize independent steps
- Monitor cumulative token usage

❌ **DON'T:**
- Include full chain state in every context
- Send unbounded arrays (truncate to 50-100)
- Repeat previous step outputs verbatim (summarize)
- Skip token budget enforcement

---

## Getting Help

### Debug Checklist

**Schema validation failing?**
1. Check: Is field optional? Add `.optional()`
2. Check: Is field an array? Add `.default([])`
3. Check: Is field an enum? Add `.catch(defaultValue)`
4. Check: Is nested object? Add `.passthrough()`

**LLM refusing requests?**
1. Check: Is domain safety context included?
2. Check: Does prompt clarify legitimate use?
3. Review: Pattern 10 (Domain Safety Context)

**Token costs too high?**
1. Implement: Prompt caching (Pattern 25)
2. Truncate: Context arrays (max 50-100 items)
3. Summarize: Less critical previous outputs

**Step execution slow?**
1. Check: Can steps run in parallel?
2. Enable: Streaming for >10K token outputs
3. Consider: Reducing context size

---

## Version History

- **2025-12-20**: Initial documentation suite created
  - LLM_SCHEMA_BEST_PRACTICES.md (26 patterns)
  - LLM_PATTERNS_QUICK_REFERENCE.md (one-page cheat sheet)
  - LLM_IMPLEMENTATION_COOKBOOK.md (6 recipes)
  - README_LLM_DOCS.md (this index)

---

## Contributing

When updating these docs:

1. **Add new patterns** to Best Practices (maintain pattern numbering)
2. **Update Quick Reference** with condensed version
3. **Add recipe** to Cookbook if pattern is common
4. **Update this README** with new content

**Maintain consistency:**
- All code examples use TypeScript
- All schemas use Zod
- All examples reference Sparlo codebase
- File paths are absolute

---

## Related Documentation

**In this repo:**
- `/RESEARCH_SUMMARY_LLM_ARCHITECTURE.md` - System architecture
- `/CLAUDE.md` - General Sparlo development guide
- `/apps/web/CLAUDE.md` - Web app specific guide
- `/packages/features/CLAUDE.md` - Feature packages guide

**External resources:**
- [Anthropic Prompt Engineering](https://docs.anthropic.com/claude/docs/prompt-engineering)
- [Zod Documentation](https://zod.dev/)
- [Inngest Documentation](https://www.inngest.com/docs)

---

**Happy Building! 🚀**

For questions or suggestions, update this documentation or create a TODO.
