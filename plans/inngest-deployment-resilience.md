# Inngest Deployment Resilience

**Type:** fix
**Priority:** Critical
**Status:** Planning
**Date:** 2024-12-22

## Overview

Reports in progress are being interrupted when new deployments are pushed to Railway. The current fix (`streaming: 'allow'` + health checks) only detects interruptions faster but doesn't prevent them. Each interrupted LLM call wastes $5-15 in API costs and requires manual retry.

## Problem Statement

### Current Behavior
1. User starts a report (7-10 LLM steps, 5-10+ minutes total)
2. Developer pushes code to Railway
3. Railway deploys new version, terminates old container
4. In-flight Inngest function is killed mid-LLM call
5. Report fails, user sees error, LLM tokens wasted

### Root Cause
Railway's default deployment configuration:
- `RAILWAY_DEPLOYMENT_OVERLAP_SECONDS`: 20 seconds (default)
- `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`: 3 seconds (default)

**Total grace period: ~23 seconds** - far too short for 30-60+ second LLM calls.

### Impact
- User frustration from failed reports
- Wasted LLM API costs ($5-15 per interrupted report)
- Manual retry required
- Unpredictable report completion during business hours

## Research Findings

### Railway Deployment Lifecycle
1. New deployment builds and starts
2. Health checks verify new deployment is ready
3. Traffic switches to new deployment
4. **Overlap period**: Old and new run simultaneously for `RAILWAY_DEPLOYMENT_OVERLAP_SECONDS`
5. Old deployment receives SIGTERM
6. **Draining period**: Old has `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` to finish
7. SIGKILL terminates old deployment

### Inngest Durable Execution
- Each `step.run()` is an atomic unit - state persists after completion
- If interrupted mid-step, only that step needs retry (not the whole function)
- Inngest cannot checkpoint mid-LLM call - entire call must complete or restart
- `streaming: 'allow'` helps Inngest detect disconnects faster for retry

### Key Documentation
- [Railway Deployment Teardown](https://docs.railway.com/guides/deployment-teardown)
- [Inngest Connect](https://www.inngest.com/docs/setup/connect)
- [Inngest Function Execution](https://www.inngest.com/docs/learn/how-functions-are-executed)

## Proposed Solutions

### Option A: Railway Configuration (Quick Fix)

**Approach**: Increase Railway's overlap and draining periods to allow in-flight functions to complete.

**Configuration**:
```bash
# Environment variables
RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=300   # 5 minutes overlap
RAILWAY_DEPLOYMENT_DRAINING_SECONDS=180  # 3 minutes draining
# Total: 8 minutes grace period
```

**Pros**:
- Zero code changes
- Immediate implementation
- No architectural changes

**Cons**:
- Reports > 8 minutes will still fail
- Doubles resource cost during overlap period
- Not a complete solution for long reports

**Best for**: Quick mitigation while implementing a better solution

---

### Option B: Separate Inngest Worker Service (Recommended)

**Approach**: Run Inngest functions on a dedicated Railway service that deploys independently from the web application.

**Architecture**:
```
┌─────────────────────────────────────────────────────┐
│ Railway Project                                      │
│                                                      │
│  ┌─────────────────────┐    ┌────────────────────┐  │
│  │ Web Service         │    │ Worker Service     │  │
│  │ (Next.js)           │    │ (Inngest Functions)│  │
│  │                     │    │                    │  │
│  │ - Frontend          │    │ - generateReport   │  │
│  │ - API routes        │    │ - generateDiscovery│  │
│  │ - Trigger events    │    │ - generateHybrid   │  │
│  │                     │    │                    │  │
│  │ Overlap: 20s        │    │ Overlap: 600s      │  │
│  │ Draining: 30s       │    │ Draining: 300s     │  │
│  └─────────────────────┘    └────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Pros**:
- Web deployments don't affect reports
- Worker deploys with 15+ minute grace period
- Independent scaling
- Clear separation of concerns

**Cons**:
- Additional service to manage
- Slight increase in infrastructure complexity
- Need to coordinate worker deploys

**Best for**: Production-grade solution with full control

---

### Option C: Inngest Connect (Best Long-Term)

**Approach**: Use Inngest Connect's WebSocket-based worker mode with built-in graceful shutdown.

**How it works**:
- Worker maintains persistent WebSocket connection to Inngest
- During deployment, Inngest distributes work across all connected workers
- Graceful shutdown completes in-flight steps before terminating
- No HTTP timeouts - steps can run as long as needed

**Requirements**:
- Inngest TypeScript SDK 3.34.1+
- Node.js 22.4.0+ (for WebSocket support)
- Long-running container (Railway works)

**Pros**:
- Built-in rolling deployment support
- Automatic graceful shutdown handling
- No HTTP timeout limits
- Multiple versions coexist during deploys

**Cons**:
- Developer preview (may have edge cases)
- Requires SDK upgrade and code changes
- Node.js 22+ requirement

**Best for**: Future-proof solution once Inngest Connect is GA

## Recommended Approach

**Phase 1 (Immediate)**: Implement Option A as quick mitigation
- Set `RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=300`
- Set `RAILWAY_DEPLOYMENT_DRAINING_SECONDS=180`
- Covers ~80% of reports that complete within 8 minutes

**Phase 2 (This Sprint)**: Implement Option B for complete solution
- Create separate worker service
- Migrate Inngest functions to worker
- Configure 15-minute grace period for worker

**Phase 3 (Future)**: Evaluate Option C when Inngest Connect is GA
- Monitor Inngest Connect stability
- Plan migration when ready for production

## Technical Approach

### Phase 1: Railway Configuration

**IMPORTANT**: Overlap and draining settings are **environment variables**, NOT `railway.json` fields.

**Step 1: Add Environment Variables in Railway Dashboard**

Navigate to your Railway service → Variables → Add:
```bash
RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=300   # 5 minutes overlap
RAILWAY_DEPLOYMENT_DRAINING_SECONDS=180  # 3 minutes draining
```

**Step 2: Add SIGTERM Handler for Graceful Inngest Shutdown**

The default Next.js standalone server doesn't wait for in-flight Inngest steps to complete. We need to add signal handling.

**File**: `apps/web/instrumentation.ts` (create if doesn't exist)
```typescript
export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Track active Inngest executions
    let activeExecutions = 0;
    const MAX_SHUTDOWN_WAIT_MS = 180000; // 3 minutes (matches draining period)

    // Expose for Inngest middleware to increment/decrement
    (globalThis as any).__inngestActiveExecutions = {
      increment: () => activeExecutions++,
      decrement: () => activeExecutions--,
      get: () => activeExecutions,
    };

    process.on('SIGTERM', async () => {
      console.log('[Graceful Shutdown] SIGTERM received, waiting for Inngest executions...');

      const startTime = Date.now();

      // Wait for active executions to complete (with timeout)
      while (activeExecutions > 0 && Date.now() - startTime < MAX_SHUTDOWN_WAIT_MS) {
        console.log(`[Graceful Shutdown] Waiting for ${activeExecutions} active execution(s)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (activeExecutions > 0) {
        console.log(`[Graceful Shutdown] Timeout reached with ${activeExecutions} execution(s) still running`);
      } else {
        console.log('[Graceful Shutdown] All Inngest executions completed');
      }

      process.exit(0);
    });
  }
}
```

**Step 3: Track Inngest Execution in Functions**

Add execution tracking to each Inngest function:

**File**: `apps/web/lib/inngest/functions/generate-hybrid-report.ts` (and others)
```typescript
// At the start of the function handler:
const tracker = (globalThis as any).__inngestActiveExecutions;
tracker?.increment();

try {
  // ... existing function logic ...
} finally {
  tracker?.decrement();
}
```

**Step 4: Enable Manual Signal Handling**

**File**: Add to Railway environment variables:
```bash
NEXT_MANUAL_SIG_HANDLE=true
```

**Validation**:
1. Deploy changes to staging
2. Start a test report (hybrid or discovery)
3. Trigger deployment mid-report
4. Check logs for "[Graceful Shutdown]" messages
5. Verify report completes successfully

---

### Phase 2: Separate Worker Service

#### Step 1: Create Worker Package

**File**: `apps/worker/package.json`
```json
{
  "name": "@kit/worker",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsup src/index.ts --format cjs --dts"
  },
  "dependencies": {
    "inngest": "^3.48.0",
    "express": "^5.0.0"
  }
}
```

#### Step 2: Create Worker Entry Point

**File**: `apps/worker/src/index.ts`
```typescript
import 'dotenv/config';
import express from 'express';
import { serve } from 'inngest/express';
import { inngest } from './client';
import { functions } from './functions';

const app = express();
const PORT = process.env.PORT || 3001;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// Inngest endpoint
app.use('/api/inngest', serve({
  client: inngest,
  functions,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  streaming: 'allow',
}));

const server = app.listen(PORT, () => {
  console.log(`Worker listening on port ${PORT}`);
});

// Graceful shutdown
let isShuttingDown = false;

process.on('SIGTERM', () => {
  console.log('SIGTERM received, starting graceful shutdown');
  isShuttingDown = true;

  // Stop accepting new connections
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

#### Step 3: Move Functions to Worker

**File**: `apps/worker/src/functions/index.ts`
```typescript
import { generateReport } from './generate-report';
import { generateDiscoveryReport } from './generate-discovery-report';
import { generateHybridReport } from './generate-hybrid-report';

export const functions = [
  generateReport,
  generateDiscoveryReport,
  generateHybridReport,
];
```

#### Step 4: Update Web App Inngest Route

**File**: `apps/web/app/api/inngest/route.ts`
```typescript
import { serve } from 'inngest/next';
import { inngest } from '~/lib/inngest/client';

// Web service no longer runs functions - they're on the worker
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [], // Empty - worker handles functions
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
```

#### Step 5: Configure Worker Railway Environment Variables

**In Railway Dashboard for Worker Service**, add:
```bash
# Deployment resilience - 15 minute grace period
RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=600   # 10 minutes overlap
RAILWAY_DEPLOYMENT_DRAINING_SECONDS=300  # 5 minutes draining
NEXT_MANUAL_SIG_HANDLE=true

# Inngest configuration (copy from web service)
INNGEST_EVENT_KEY=<your-event-key>
INNGEST_SIGNING_KEY=<your-signing-key>

# Database (copy from web service)
DATABASE_URL=<your-database-url>
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# LLM API keys (copy from web service)
ANTHROPIC_API_KEY=<your-anthropic-key>
```

**Note**: Overlap and draining are environment variables, NOT `railway.json` fields.

#### Step 6: Add Worker to Turborepo

**File**: `turbo.json` (add to pipeline)
```json
{
  "tasks": {
    "worker#build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

## Acceptance Criteria

### Functional Requirements
- [ ] Reports in progress complete during web deployments
- [ ] Reports in progress complete during worker deployments (with 15-min grace)
- [ ] No duplicate LLM calls for interrupted steps
- [ ] Users see clear error messages if report fails

### Non-Functional Requirements
- [ ] Deployment overlap cost < 2x during transition period
- [ ] Worker service restarts automatically on failure
- [ ] Health checks prevent traffic to unhealthy workers
- [ ] Logging captures deployment-related interruptions

### Quality Gates
- [ ] Staging validation with simulated deployments
- [ ] Monitor interruption rate for 1 week post-deploy
- [ ] Document deployment procedures for worker service

## Success Metrics

1. **Interruption Rate**: 0% of reports interrupted during deployments
2. **Token Waste**: $0 in duplicate LLM calls from interruptions
3. **User Retries**: 0 manual retries needed due to deployment interruptions

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Reports exceed 15-min grace period | Low | Medium | Monitor duration distribution, extend if needed |
| Worker/web schema incompatibility | Medium | High | Require backward-compatible migrations |
| Inngest Connect has bugs in preview | Medium | Medium | Stay on HTTP mode until GA |
| Double resource cost during overlap | Certain | Low | Limit overlap to necessary duration |

## References

### Internal References
- Current Inngest route: `apps/web/app/api/inngest/route.ts`
- Inngest client: `apps/web/lib/inngest/client.ts`
- Function implementations: `apps/web/lib/inngest/functions/`
- Railway config: `railway.json`
- Previous fix attempt: `plans/fix-inngest-graceful-shutdown-during-deployments.md`

### External References
- [Railway Deployment Teardown](https://docs.railway.com/guides/deployment-teardown)
- [Railway Config as Code](https://docs.railway.com/reference/config-as-code)
- [Inngest Connect](https://www.inngest.com/docs/setup/connect)
- [Inngest Multi-Step Functions](https://www.inngest.com/docs/guides/multi-step-functions)
- [Next.js Standalone Mode](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
