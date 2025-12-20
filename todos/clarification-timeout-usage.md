---
id: clarification-timeout-usage
title: Track partial usage when clarification times out
priority: P2
status: pending
category: feature
source: code-review
created: 2025-12-20
files:
  - apps/web/lib/inngest/functions/generate-report.ts
---

## Problem

When clarification times out after 2 hours, the AN0 step's token usage is lost. The current implementation only tracks usage if the full pipeline completes.

## Impact

- Token billing may be underreported
- Usage analytics incomplete for abandoned reports

## Solution

Save partial usage to database when clarification times out:

```typescript
if (clarificationResult === null) {
  // Track the AN0 usage before returning
  await step.run('save-partial-usage', async () => {
    await client.from('sparlo_reports').update({
      token_usage: calculateTotalUsage([an0Result.usage]),
      status: 'clarification_timeout'
    }).eq('id', reportId);
  });

  return { success: false, reason: 'clarification_timeout' };
}
```

## Acceptance Criteria

- [ ] Partial usage saved on clarification timeout
- [ ] Database updated with timeout status
- [ ] Usage visible in admin analytics
