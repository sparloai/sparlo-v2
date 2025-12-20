---
priority: P3
category: architecture
status: pending
source: code-review-2e709f0
created: 2025-12-20
---

# Create Archived Reports Loader

## Problem
The archived page embeds data fetching directly in page.tsx while the main page uses a proper loader pattern.

Main page: Uses `/home/(user)/_lib/server/recent-reports.loader.ts`
Archived page: Data fetching embedded in `archived/page.tsx` (lines 54-88)

This creates pattern inconsistency and makes the data fetching logic harder to test.

## Solution
Create `/apps/web/app/home/(user)/_lib/server/archived-reports.loader.ts`:

```typescript
import 'server-only';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import type { ConversationStatus } from '../types';
import type { ReportMode, RawReportRow } from '../types/reports';
import { computeConceptCount } from '../utils/report-utils';

export interface ArchivedReport {
  id: string;
  title: string;
  headline: string | null;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
  concept_count: number;
  mode: ReportMode;
}

export async function loadArchivedReports(): Promise<ArchivedReport[]> {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select('id, title, headline, status, created_at, updated_at, report_data')
    .eq('archived', true)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[Reports] Failed to load archived:', error);
    return [];
  }

  const rows = data as unknown as RawReportRow[] | null;

  return (
    rows?.map((row) => ({
      id: row.id,
      title: row.title,
      headline: row.headline ?? row.report_data?.headline ?? null,
      status: row.status as ConversationStatus,
      created_at: row.created_at,
      updated_at: row.updated_at,
      concept_count: computeConceptCount(row.report_data),
      mode: (row.report_data?.mode === 'discovery' ? 'discovery' : 'standard') as ReportMode,
    })) ?? []
  );
}
```

Update `archived/page.tsx`:
```typescript
import { loadArchivedReports } from '../_lib/server/archived-reports.loader';

async function ArchivedReportsList() {
  const reports = await loadArchivedReports();
  return <ArchivedReportsDashboard reports={reports} />;
}
```

## Files
- Create: `/apps/web/app/home/(user)/_lib/server/archived-reports.loader.ts`
- Update: `/apps/web/app/home/(user)/archived/page.tsx`

## Effort
2 hours
