<!--
UPDATE WHEN:
- Adding new entry points or key files
- Introducing new patterns
- Discovering non-obvious behavior

Helps quickly navigate the codebase when resuming work.
-->

# Code Landmarks

Quick reference to important parts of the codebase.

## Entry Points
| Location | Purpose |
|----------|---------|
| apps/web/app | Main Next.js application |
| apps/e2e | Playwright E2E tests |

## Core Business Logic
| Location | Purpose |
|----------|---------|
| packages/features/* | Feature packages |
| apps/web/lib/llm | LLM prompts and schemas |

## Configuration
| Location | Purpose |
|----------|---------|
| apps/web/supabase | Supabase migrations/config |
| turbo.json | Turborepo config |

## Key Patterns
| Pattern | Example Location | Notes |
|---------|------------------|-------|
| Server Actions | _lib/server/*-server-actions.ts | Use enhanceAction |
| Loaders | _lib/server/*-page.loader.ts | RSC data fetching |
| Schemas | _lib/schemas/*.schema.ts | Zod validation |

## Testing
| Location | Purpose |
|----------|---------|
| apps/e2e | Playwright tests |

## Gotchas & Non-Obvious Behavior
| Location | Issue | Notes |
|----------|-------|-------|
| - | - | - |
