---
id: "007"
title: "Apply Puppeteer performance optimizations"
priority: P3
status: completed
category: performance
created: 2024-12-30
files:
  - app/api/reports/[id]/pdf/route.tsx
---

# Medium: Performance Optimizations

## Recommended Changes

### 1. Remove `--single-process` Flag

The `--single-process` flag forces Chrome to run in a single process, which:
- Reduces stability
- Can cause memory issues
- Is incompatible with proper sandboxing

```typescript
// Remove this:
'--single-process',
```

### 2. Use `domcontentloaded` Instead of `networkidle0`

`networkidle0` waits for no network activity for 500ms, which is unnecessary for self-contained HTML:

```typescript
// Change this:
await page.setContent(html, {
  waitUntil: 'networkidle0',  // Slow - waits for network
  timeout: 30000,
});

// To this:
await page.setContent(html, {
  waitUntil: 'domcontentloaded',  // Fast - just waits for DOM
  timeout: 30000,
});
```

### 3. Increase Idle Timeout

Current 60-second idle timeout causes frequent cold starts. Consider 5 minutes:

```typescript
// Change:
const BROWSER_IDLE_TIMEOUT = 60000;

// To:
const BROWSER_IDLE_TIMEOUT = 300000; // 5 minutes
```

### 4. Add Memory Optimization Args

```typescript
args: [
  // ... existing args
  '--disable-background-networking',
  '--disable-default-apps',
  '--disable-sync',
  '--metrics-recording-only',
  '--mute-audio',
]
```

## Expected Impact

- Faster PDF generation (2-3s instead of 5-10s for warm requests)
- Fewer cold starts with longer idle timeout
- Better memory management

## Acceptance Criteria

- [ ] Remove `--single-process` flag
- [ ] Change `networkidle0` to `domcontentloaded`
- [ ] Increase idle timeout to 5 minutes
- [ ] Add memory optimization Chrome args
- [ ] Test PDF generation still works correctly
