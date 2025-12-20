# Discovery Mode

**Solution Documentation**

Alternative analysis chain (AN0-D through AN5-D) for novel solution hunting.

## Chain Architecture

```
AN0-D → AN1.5-D → AN1.7-D → AN2-D → AN3-D → AN4-D → AN5-D
Problem  Teaching  Literature  Method   Concept  Eval    Report
Framing  Examples  Gaps        Briefing Generate        + Self-Critique
```

## Key Differentiators

| Standard | Discovery |
|----------|-----------|
| Proven solutions | Novel approaches |
| Low risk | High risk |
| Uses prior art | Avoids prior art |

## Antifragile Schemas

```typescript
.optional()      // Fields can be missing
.catch(default)  // Graceful enum fallback
.passthrough()   // Allow extra LLM fields
```

## Self-Critique (Required)

- strongest_argument_against
- prior_art_we_might_have_missed
- physics_assumptions_to_verify
- domain_expert_pushback
- what_would_change_recommendation

## Key Files

- `/apps/web/lib/llm/prompts/discovery/` - All prompts
- `/apps/web/lib/inngest/functions/generate-discovery-report.ts`

**Version**: 1.0 | **Updated**: 2025-12-19
