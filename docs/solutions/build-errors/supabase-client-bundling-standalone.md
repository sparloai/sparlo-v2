---
title: "Supabase Client Bundling Issue - Cannot read properties of undefined (reading 'rest')"
category: build-errors
tags: [nextjs, supabase, bundling, standalone, serverExternalPackages, tree-shaking]
severity: critical
date_documented: 2026-01-07
components:
  - apps/web/next.config.mjs
  - packages/supabase/src/clients/server-client.ts
affected_features:
  - Supabase RPC calls
  - Server-side database operations
  - Next.js standalone production builds
prevention_documented: true
---

# Supabase Client Bundling Issue - Cannot read properties of undefined (reading 'rest')

## Problem Statement

Next.js application in production (standalone build) crashes with **TypeError: Cannot read properties of undefined (reading 'rest')** when calling `client.rpc()` or other Supabase SDK methods. The application builds successfully but fails at runtime when attempting to use the Supabase client.

### Symptoms

```
TypeError: Cannot read properties of undefined (reading 'rest')
  at SupabaseClient.rpc()
  at async loadProjectsPageData()
```

- Issue only occurs in **production** with `output: standalone`
- Works perfectly in development mode (`pnpm dev`)
- Happens when calling `client.rpc()`, `client.from()`, or other Supabase methods
- No build errors or warnings during compilation

## Root Cause Analysis

Next.js standalone output uses aggressive **tree-shaking and bundling** to minimize the final bundle size. When bundling the Supabase SDK (`@supabase/supabase-js` and `@supabase/ssr`), the bundler strips out internal properties that are required at runtime.

### Why This Happens

1. **Standalone Build Process**: Next.js `output: standalone` creates a self-contained production build by:
   - Bundling all dependencies into the server output
   - Tree-shaking unused code to reduce bundle size
   - Minifying and optimizing the final output

2. **Supabase SDK Internals**: The SDK relies on internal properties like `.rest`, `.auth`, `.storage` that are:
   - Dynamically accessed at runtime
   - Not statically analyzable by the bundler
   - Incorrectly marked as "unused" by tree-shaking algorithms

3. **Runtime Failure**: When the bundled code tries to access `client.rest.rpc()`, the property doesn't exist because it was removed during tree-shaking.

### Technical Details

The Supabase client initialization creates an object with nested clients:

```typescript
// Expected structure at runtime:
{
  from: [Function],
  rpc: [Function],
  rest: {           // ← This gets stripped by bundler
    rpc: [Function],
    from: [Function]
  },
  auth: { ... },
  storage: { ... }
}

// Actual structure after bundling:
{
  from: undefined,  // ← Tree-shaken away
  rpc: undefined,   // ← Tree-shaken away
}
```

## Solution Implementation

### 1. Prevent Supabase SDK Bundling

**File**: `apps/web/next.config.mjs`

Add `@supabase/supabase-js` and `@supabase/ssr` to the `serverExternalPackages` array:

```javascript
/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',

  serverExternalPackages: [
    'pino',
    'thread-stream',
    '@react-pdf/renderer',
    // Prevent Supabase SDK from being bundled to avoid initialization issues
    '@supabase/supabase-js',
    '@supabase/ssr',
  ],

  // ... rest of config
};
```

### 2. Add Client Validation (Defense in Depth)

**File**: `packages/supabase/src/clients/server-client.ts`

Add validation checks to catch configuration and initialization issues early:

```typescript
export function getSupabaseServerClient<GenericSchema = Database>() {
  const keys = getSupabaseClientKeys();
  const isProduction = process.env.NODE_ENV === 'production';

  // Validate keys before creating client to catch configuration issues early
  if (!keys.url || !keys.publicKey) {
    console.error(
      '[Supabase] Missing configuration:',
      !keys.url ? 'NEXT_PUBLIC_SUPABASE_URL' : '',
      !keys.publicKey ? 'NEXT_PUBLIC_SUPABASE_PUBLIC_KEY' : '',
    );
    throw new Error('Supabase client configuration is incomplete');
  }

  const client = createServerClient<GenericSchema>(keys.url, keys.publicKey, {
    // ... cookie configuration
  });

  // Validate client was properly initialized
  if (!client || typeof client.from !== 'function') {
    console.error('[Supabase] Client initialization failed - invalid client object');
    throw new Error('Supabase client initialization failed');
  }

  return client;
}
```

## Why This Solution Works

### serverExternalPackages Behavior

When a package is listed in `serverExternalPackages`:

1. **Not Bundled**: Package code remains in `node_modules/` instead of being bundled
2. **Runtime Resolution**: Node.js resolves the package at runtime using standard module resolution
3. **Preserve Structure**: All internal properties and dynamic code paths remain intact
4. **No Tree-Shaking**: The bundler doesn't attempt to optimize or strip code from the package

### Trade-offs

**Pros:**
- Preserves all Supabase SDK functionality
- No runtime errors from missing properties
- Easier to debug (source code available)
- Updates to SDK don't require rebuilding

**Cons:**
- Slightly larger deployment size (includes full SDK)
- Dependencies must be available in production `node_modules/`
- Less aggressive optimization

**Verdict**: The slight size increase is worth the reliability and correctness.

## Verification Steps

After implementing the fix:

### 1. Local Standalone Build Test

```bash
# Build standalone
cd apps/web
pnpm build

# Run standalone server
cd .next/standalone/apps/web
HOSTNAME=0.0.0.0 node server.js

# Test Supabase operations
curl http://localhost:3000/api/health
```

### 2. Check Bundle Analysis

```bash
# Generate bundle analysis
ANALYZE=true pnpm build

# Verify @supabase packages are NOT in the bundle
# Look for "External modules" section
```

### 3. Production Deployment Test

```bash
# Deploy to Railway/Vercel
git push

# Monitor logs for:
# ✅ "[Supabase] Client initialized successfully"
# ❌ "Cannot read properties of undefined"
```

### 4. Runtime Validation

```typescript
// Test RPC call
const { data, error } = await client.rpc('get_team_projects', {
  account_slug: 'test-team',
});

if (error) {
  console.error('RPC failed:', error);
} else {
  console.log('RPC successful:', data);
}
```

## Related Files

| File | Purpose | Changes |
|------|---------|---------|
| `apps/web/next.config.mjs` | Next.js configuration | Added Supabase packages to `serverExternalPackages` |
| `packages/supabase/src/clients/server-client.ts` | Server client factory | Added validation for keys and client initialization |
| `packages/supabase/src/clients/client-client.ts` | Browser client factory | No changes needed (client-side not affected) |

## Prevention Strategies

### 1. Document External Package Requirements

For packages that should NEVER be bundled:

```javascript
serverExternalPackages: [
  // Logging (uses native Node.js streams)
  'pino',
  'thread-stream',

  // PDF rendering (uses Node.js Canvas/Cairo bindings)
  '@react-pdf/renderer',

  // Supabase (dynamic property access, complex internals)
  '@supabase/supabase-js',
  '@supabase/ssr',

  // Add comment explaining WHY for future maintainers
],
```

### 2. Add Early Validation Checks

For critical dependencies:

```typescript
// Fail fast with clear error messages
if (!client || typeof client.from !== 'function') {
  throw new Error('Client initialization failed');
}
```

### 3. Test Standalone Builds Locally

Before deploying:

```bash
# Always test standalone builds
pnpm build
cd .next/standalone/apps/web
node server.js

# Test critical paths
curl localhost:3000/api/health
curl localhost:3000/api/auth/session
```

### 4. Monitor Production Logs

Set up alerts for:

- `TypeError: Cannot read properties of undefined`
- `[Supabase] Client initialization failed`
- `[Supabase] Missing configuration`

## Common Pitfalls

### ❌ Wrong: Trying to Fix with Import Syntax

```typescript
// This doesn't help - problem is at bundle time
import * as Supabase from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
```

### ❌ Wrong: Disabling Tree-Shaking Globally

```javascript
// Don't disable tree-shaking for everything
module.exports = {
  optimization: {
    usedExports: false, // ← BAD: Bloats entire bundle
  }
};
```

### ✅ Correct: Use serverExternalPackages

```javascript
// Surgical fix - only externalize problematic packages
serverExternalPackages: [
  '@supabase/supabase-js',
  '@supabase/ssr',
],
```

## Related Issues

### Other Packages That May Need Externalization

Watch for similar issues with:

- **Native bindings**: `sharp`, `canvas`, `sqlite3`
- **Complex SDKs**: AWS SDK, Google Cloud SDK, Stripe SDK
- **Logging libraries**: `pino`, `winston` (with transport streams)
- **PDF/image processors**: `@react-pdf/renderer`, `puppeteer`

### Detection Pattern

Signs a package needs to be externalized:

1. Works in development, fails in production
2. Error mentions "undefined" or "not a function"
3. Package uses dynamic imports or property access
4. Package has native Node.js dependencies
5. Package warns about tree-shaking in docs

## Additional Context

### Next.js Standalone Output

The `output: standalone` mode is designed for:

- **Docker deployments**: Minimal container images
- **Serverless platforms**: AWS Lambda, Vercel, Railway
- **Self-hosted**: Running Next.js without development dependencies

**Directory structure:**

```
.next/standalone/
├── node_modules/          ← Only runtime dependencies
│   └── @supabase/        ← External packages included here
├── apps/web/
│   ├── server.js         ← Entry point
│   └── .next/
│       └── server/       ← Bundled code (minus externals)
└── package.json          ← Minimal runtime manifest
```

### Environment Variables

Ensure these are set in production:

```bash
# Required for Supabase client
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLIC_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Required for standalone server
HOSTNAME=0.0.0.0
PORT=3000
NODE_ENV=production
```

### Compatibility

- **Next.js**: 14.0.0+ (tested on 16.x)
- **Supabase JS**: 2.x
- **Supabase SSR**: 0.x
- **Node.js**: 18+

## Debugging Tips

### Enable Supabase Debug Logs

```typescript
const client = createServerClient(url, key, {
  auth: {
    debug: true, // Log auth events
  },
});
```

### Check Bundle Contents

```bash
# List bundled modules
ls -lR .next/standalone/apps/web/.next/server/

# Check if Supabase is bundled (should NOT appear)
grep -r "@supabase" .next/standalone/apps/web/.next/server/

# Check node_modules (should appear here)
ls .next/standalone/node_modules/@supabase/
```

### Reproduce Locally

```bash
# Build and run standalone
pnpm build
cd .next/standalone/apps/web

# Set env vars
export NEXT_PUBLIC_SUPABASE_URL=...
export NEXT_PUBLIC_SUPABASE_PUBLIC_KEY=...

# Run with debug output
NODE_OPTIONS='--inspect' node server.js
```

## Alternative Solutions Considered

### 1. Use Supabase Admin Client Everywhere ❌

**Rejected**: Bypasses RLS, requires manual authorization checks, major security risk.

### 2. Dynamic Imports ❌

**Rejected**: Adds complexity, doesn't solve tree-shaking, breaks type safety.

### 3. Custom Supabase Client Wrapper ❌

**Rejected**: Maintenance burden, loses SDK updates, reimplements existing functionality.

### 4. Disable Standalone Output ❌

**Rejected**: Larger deployments, slower cold starts, not suitable for serverless.

### 5. serverExternalPackages (Chosen) ✅

**Accepted**: Simple, reliable, minimal trade-offs, officially supported by Next.js.

---

**Version**: 1.0
**Updated**: 2026-01-07
**Severity**: Critical (blocks production Supabase operations)
**Status**: Resolved
