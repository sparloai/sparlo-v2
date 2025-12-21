---
title: "Realtime Polling Fallback for Report Progress"
category: features
tags:
  - supabase-realtime
  - polling
  - progress-updates
  - reliability
severity: medium
component: Report Progress Display
framework: Next.js 16, Supabase Realtime
date: 2025-12-20
status: completed
---

# Realtime Polling Fallback

## Problem

Report progress updates occasionally failed to reach the client due to:
- Supabase Realtime connection drops
- Network interruptions
- Channel subscription timing issues

Users would see a stuck processing screen even though the report completed.

## Solution

Added a polling fallback that runs alongside Realtime subscriptions:

```typescript
// apps/web/app/home/(user)/reports/[id]/_components/report-progress-listener.tsx

useEffect(() => {
  // Primary: Supabase Realtime subscription
  const channel = supabase
    .channel(`report-${reportId}`)
    .on('postgres_changes', { ... })
    .subscribe();

  // Fallback: Poll every 5 seconds
  const pollInterval = setInterval(async () => {
    const { data } = await supabase
      .from('sparlo_reports')
      .select('status, current_step, phase_progress, report_data')
      .eq('id', reportId)
      .single();

    if (data && data.status !== currentStatus) {
      setCurrentStatus(data.status);
      setProgress(data);

      // Redirect if complete
      if (data.status === 'complete') {
        router.push(`/home/reports/${reportId}`);
      }
    }
  }, 5000);

  return () => {
    channel.unsubscribe();
    clearInterval(pollInterval);
  };
}, [reportId]);
```

## Design Principles

### Belt and Suspenders Approach

- Realtime for instant updates (primary)
- Polling for guaranteed eventual consistency (fallback)
- Both mechanisms coexist without conflicts

### Smart Polling

- Only updates state when values actually change
- Avoids unnecessary re-renders
- Clears interval when component unmounts

## Files Changed

- `apps/web/app/home/(user)/reports/[id]/_components/report-progress-listener.tsx`

## Commit

`9f9c89c` - fix: add polling fallback for report progress updates

## Related

- Supabase Realtime documentation
- `docs/solutions/architecture/reports-dashboard-refactoring.md`
