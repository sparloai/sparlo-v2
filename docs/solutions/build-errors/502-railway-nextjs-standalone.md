---
title: "502 Bad Gateway - Railway Next.js Standalone Deployment"
category: build-errors
tags: [railway, nextjs, standalone, deployment, 502, monorepo]
severity: critical
date_documented: 2025-12-24
---

# 502 Bad Gateway - Railway Next.js Standalone Deployment

## Problem Statement

Next.js app deployed on Railway was returning **502 Bad Gateway** errors. The application would build successfully but fail to serve traffic, resulting in gateway timeouts when accessed.

## Root Cause Analysis

Railway runs from the `apps/web/` directory in a monorepo structure, which caused two critical issues:

1. **Script Priority**: Railway was executing `next start` from the local `apps/web/package.json`, which doesn't work with Next.js `output: standalone` configuration
2. **Network Binding**: The standalone server binds to `localhost` (127.0.0.1) by default, which isn't accessible from outside the container in Railway's infrastructure

### Why This Happened

In monorepos, Railway may run scripts from a subdirectory (like `apps/web`) rather than the root. This means:

- The `package.json` scripts in `apps/web/` take precedence over `nixpacks.toml` configuration at the repository root
- The default `next start` command doesn't understand the standalone build output structure
- Without explicit `HOSTNAME=0.0.0.0`, Node.js servers bind to localhost only

## Solution Implementation

Updated `apps/web/package.json` with two critical changes:

```json
{
  "scripts": {
    "build": "next build && cp -r .next/static .next/standalone/apps/web/.next/static && cp -r public .next/standalone/apps/web/public",
    "start": "HOSTNAME=0.0.0.0 node .next/standalone/apps/web/server.js"
  }
}
```

### Build Script Breakdown

```bash
next build && \
cp -r .next/static .next/standalone/apps/web/.next/static && \
cp -r public .next/standalone/apps/web/public
```

1. **`next build`**: Creates the standalone server bundle
2. **Copy static assets**: Next.js standalone doesn't automatically include `.next/static/` - must be copied manually
3. **Copy public folder**: Static assets from `public/` also need to be copied to the standalone directory

### Start Script Breakdown

```bash
HOSTNAME=0.0.0.0 node .next/standalone/apps/web/server.js
```

1. **`HOSTNAME=0.0.0.0`**: Binds the server to all network interfaces (required for Railway)
2. **`node .next/standalone/apps/web/server.js`**: Runs the standalone server directly instead of using `next start`

## Key Insights

### Monorepo Script Resolution

Railway's build/start process:
1. Changes directory to `apps/web/` (if specified in Railway config)
2. Runs `npm run build` and `npm run start` from that directory
3. Uses the **local** `package.json` scripts, not root-level configurations

**Implication**: Configuration in `nixpacks.toml` at the root may be ignored if package.json scripts exist in the working directory.

### Next.js Standalone Requirements

When using `output: standalone` in `next.config.js`:

- **Pros**: Minimal dependencies, optimized Docker images
- **Cons**: Requires manual copying of static assets and public files
- **Server**: Must be started via `node .next/standalone/.../server.js`, not `next start`

### Container Networking

Default Node.js behavior:
- `HOSTNAME` not set → binds to `127.0.0.1` (localhost only)
- `HOSTNAME=0.0.0.0` → binds to all interfaces (required for containers)

## Verification Steps

After deploying with the fix:

1. **Check build logs**: Verify static files are being copied
   ```
   ✓ Copying .next/static to standalone folder
   ✓ Copying public folder to standalone folder
   ```

2. **Check start logs**: Verify server binds to 0.0.0.0
   ```
   ▲ Next.js 16.x.x
   - Local:        http://0.0.0.0:3000
   ```

3. **Test endpoints**: Verify app responds with 200 OK
   ```bash
   curl -I https://your-app.railway.app
   # Should return: HTTP/2 200
   ```

## Related Files

- `/apps/web/package.json` - Build and start scripts
- `/apps/web/next.config.js` - Standalone output configuration
- `/nixpacks.toml` - Railway build configuration (may be overridden)

## Prevention

For future Railway deployments:

1. **Always set `HOSTNAME=0.0.0.0`** in start scripts for containerized Next.js apps
2. **Test standalone builds locally** before deploying:
   ```bash
   npm run build
   HOSTNAME=0.0.0.0 node .next/standalone/apps/web/server.js
   ```
3. **Verify static assets** are included in the standalone folder
4. **Document Railway's working directory** in deployment config

## Additional Context

### Environment Variables

Railway automatically provides:
- `PORT` - Port number for the server (default: 3000)
- `NODE_ENV=production` - Production mode

### Alternative Solutions Considered

1. **Use `next start` without standalone**: Works but includes unnecessary dependencies
2. **Configure Railway root directory**: Doesn't solve the localhost binding issue
3. **Custom Dockerfile**: More complex, unnecessary for this fix

**Chosen approach**: Minimal changes to package.json scripts for maximum compatibility

---

**Version**: 1.0
**Updated**: 2025-12-24
**Severity**: Critical (blocks all production deployments)
