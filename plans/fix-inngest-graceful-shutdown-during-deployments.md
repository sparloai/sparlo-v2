# fix: Prevent Inngest function interruption during Railway deployments

## Status: IMPLEMENTED (Simplified)

After expert review, the implementation was simplified to rely on Inngest's built-in durability and Railway's native graceful shutdown instead of a custom server wrapper.

## Overview

When code is merged to main and deployed to Railway, running Inngest functions could be interrupted mid-execution. This fix leverages Inngest's durable execution model and streaming mode to ensure functions complete even when deployments occur.

## Problem Statement

**Symptoms:**
- Reports stuck in "processing" or failed state during deployments
- LLM API calls duplicated (costing $5-15 per retry)

**Root Cause:**
- Inngest streaming mode not enabled (slower detection of interruptions)
- Next.js not configured for standalone output

## Solution (Simplified)

After expert review, we determined that Inngest's durable execution already handles this scenario:

1. **Inngest Streaming Mode** - `streaming: 'allow'` enables faster detection when a deployment interrupts a function
2. **Next.js Standalone Output** - Required for proper Railway deployment
3. **Railway Health Checks** - Native graceful shutdown with drain time
4. **Inngest's Durable Execution** - `step.run()` checkpoints ensure progress is preserved

**Key Insight:** Inngest functions using `step.run()` are already durable. When a deployment interrupts a step, Inngest Cloud detects it quickly (with streaming enabled) and retries only the interrupted step on the new instance - no duplicate work.

## Implementation

### Files Modified

1. **`apps/web/next.config.mjs`** - Added `output: 'standalone'`
2. **`apps/web/app/api/inngest/route.ts`** - Added `streaming: 'allow'`
3. **`nixpacks.toml`** - Updated build commands for standalone output
4. **`railway.json`** - Health check configuration

### `apps/web/next.config.mjs`

```javascript
const config = {
  output: 'standalone',  // Required for Railway deployment
  // ... existing config
};
```

### `apps/web/app/api/inngest/route.ts`

```typescript
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  streaming: 'allow',  // Faster interruption detection
});
```

### `nixpacks.toml`

```toml
[phases.build]
cmds = [
  "pnpm --filter web build",
  "cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static",
  "cp -r apps/web/public apps/web/.next/standalone/apps/web/public"
]

[start]
cmd = "node apps/web/.next/standalone/apps/web/server.js"
```

### `railway.json`

```json
{
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 120
  }
}
```

### `apps/web/app/api/health/route.ts`

```typescript
export async function GET() {
  return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() });
}
```

## Why No Custom Server Wrapper?

The original plan included a 85-line graceful shutdown wrapper. Expert review revealed this was unnecessary because:

1. **Inngest handles durability** - Functions using `step.run()` checkpoint after each step
2. **Railway handles SIGTERM** - Native health check drain time handles graceful shutdown
3. **Streaming mode is the key** - Quickly detects connection drops, enabling fast retry

## Acceptance Criteria

- [x] `output: 'standalone'` added to next.config.mjs
- [x] `streaming: 'allow'` added to Inngest route
- [x] Health check endpoint exists at `/api/health`
- [x] Railway configured with health checks
- [ ] Deploy and verify reports complete during deployment

## References

### Internal

- Inngest client: `apps/web/lib/inngest/client.ts`
- Inngest functions: `apps/web/lib/inngest/functions/generate-report.ts`
- Inngest route: `apps/web/app/api/inngest/route.ts`
- Next.js config: `apps/web/next.config.mjs`
- Build config: `nixpacks.toml`

### External

- [Inngest Streaming](https://www.inngest.com/docs/streaming)
- [Inngest Durable Execution](https://www.inngest.com/docs/learn/how-functions-are-executed)
- [Next.js Standalone Output](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
- [Railway Health Checks](https://docs.railway.com/reference/healthchecks)
