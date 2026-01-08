# SOP: Railway Deployment Troubleshooting

When Railway deployments don't trigger on git push, follow this guide.

---

## Quick Fix (90% of cases)

### Option 1: Manual Deploy via Railway Dashboard

1. Open Railway dashboard
2. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
3. Type "deploy latest commit"
4. Select your service and deploy

### Option 2: Railway CLI

```bash
# Install if needed
npm install -g @railway/cli

# Login
railway login

# Trigger deploy
railway up
```

### Option 3: Empty Commit (if webhook is working but deploy didn't trigger)

```bash
git commit --allow-empty -m "chore: trigger deployment" && git push
```

---

## Diagnosing the Issue

### Step 1: Verify Push Reached GitHub

```bash
# Check if local and remote are in sync
git log origin/main..HEAD

# If output is empty, push reached GitHub
# If output shows commits, they haven't been pushed
```

### Step 2: Check GitHub Webhook

1. Go to GitHub repo → Settings → Webhooks
2. Look for a Railway webhook (railway.app URL)
3. Click on it → Recent Deliveries
4. Check if deliveries show green checkmarks or red X's

**If no Railway webhook exists:**
- Railway lost the connection
- Follow "Reconnect GitHub" steps below

**If webhook shows failures:**
- Railway may be having issues
- Check [Railway Status](https://status.railway.app/)

### Step 3: Check Railway Service Settings

1. Open Railway dashboard → Your project → Your service
2. Click Settings tab
3. Verify:
   - **Source**: Connected to correct GitHub repo
   - **Branch**: Set to `main`
   - **Root Directory**: Set correctly (or empty for monorepo root)
   - **Watch Paths**: Not filtering out your changes

---

## Common Issues & Fixes

### Issue: "Wait for CI" Blocking Deploy

Railway can wait for GitHub Actions to pass before deploying.

**Fix:**
1. Railway dashboard → Service → Settings → Deploy
2. Toggle off "Wait for CI" (temporarily)
3. Push again
4. Re-enable if desired

### Issue: Webhook Not Registered

**Fix - Reconnect GitHub:**
1. Railway dashboard → Service → Settings
2. Click "Disconnect" on the GitHub source
3. Click "Connect" and reselect the repository
4. Select the `main` branch
5. Push a new commit to test

### Issue: Pre-Push Hook Blocking (Local)

If `git push` fails locally before reaching GitHub:

```bash
# Check if hook is blocking
git push 2>&1 | head -20

# Bypass hook temporarily
git push --no-verify
```

### Issue: Wrong Runtime

**Fix:**
1. Railway dashboard → Service → Settings
2. Change "Runtime" from "Legacy" to "V2"
3. Redeploy

### Issue: Branch Mismatch

```bash
# Verify you're on the right branch
git branch --show-current

# Verify remote tracking
git remote -v
```

---

## Manual Deploy Methods

### Method 1: Railway Dashboard UI

`Cmd+K` → "deploy latest commit" → Select service

### Method 2: Railway CLI

```bash
railway up
```

### Method 3: Redeploy Previous Deployment

1. Railway dashboard → Deployments tab
2. Find a successful deployment
3. Click "..." → "Redeploy"

### Method 4: Trigger via API

```bash
# Get your Railway API token from dashboard
curl -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { serviceInstanceRedeploy(serviceId: \"YOUR_SERVICE_ID\") { id } }"}'
```

---

## Prevention

### 1. Set Up Deploy Notifications

Add a Railway deploy hook to Slack/Discord to know when deploys succeed/fail.

### 2. Monitor Webhook Health

Periodically check GitHub → Settings → Webhooks for Railway webhook status.

### 3. Use Railway CLI for Critical Deploys

For launch-critical deploys, use `railway up` directly instead of relying on git push triggers.

---

## Escalation

If none of the above works:

1. Check [Railway Status Page](https://status.railway.app/)
2. Check [Railway Discord](https://discord.gg/railway) for known issues
3. Open a support ticket via Railway dashboard
4. Post on [Railway Help Station](https://station.railway.com/)

---

## Reference

- [Railway GitHub Autodeploys Docs](https://docs.railway.com/guides/github-autodeploys)
- [Railway CLI Docs](https://docs.railway.com/develop/cli)
- [Railway Status](https://status.railway.app/)
