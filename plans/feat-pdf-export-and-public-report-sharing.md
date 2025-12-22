# feat: PDF Export and Public Report Sharing

## Overview

Add two features to Sparlo reports:
1. **PDF Export** - Download reports as PDF documents
2. **Public Report Sharing** - Share reports via link with non-authenticated users

## Problem Statement

- Users need to share reports outside the platform (email, presentations)
- Stakeholders need access without creating accounts
- Export/Share buttons exist in UI but are not implemented (`report-display.tsx:714-722`)

## Proposed Solution

### Architecture

```
Report Owner                          Public Recipient
     │                                      │
     ├── Export PDF ──► /api/reports/[id]/pdf ──► Download
     │
     └── Share ──► generateShareLink() ──► /share/[token] ──► View Report
```

### Data Model

```sql
-- Minimal schema: just token → report mapping
CREATE TABLE report_shares (
  share_token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES sparlo_reports(id) ON DELETE CASCADE
);
```

## Technical Approach

### Phase 1: Database Migration

**File: `apps/web/supabase/migrations/YYYYMMDDHHMMSS_add_report_shares.sql`**

```sql
-- Minimal share token table
CREATE TABLE public.report_shares (
  share_token UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.sparlo_reports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for looking up shares by report
CREATE INDEX idx_report_shares_report_id ON report_shares(report_id);

-- RLS: Owners can manage shares for their reports
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_shares_owner_manage" ON report_shares
  FOR ALL TO authenticated
  USING (
    report_id IN (
      SELECT id FROM sparlo_reports
      WHERE account_id = auth.uid()
      OR account_id IN (
        SELECT account_id FROM accounts_memberships WHERE user_id = auth.uid()
      )
    )
  );
```

### Phase 2: PDF Generation

**Install dependency:**
```bash
pnpm add @react-pdf/renderer
```

**Update Next.js config (`apps/web/next.config.js`):**
```typescript
experimental: {
  serverComponentsExternalPackages: ['@react-pdf/renderer'],
}
```

**Types (`apps/web/app/api/reports/[id]/pdf/_lib/types.ts`):**

```typescript
export interface ReportPDFData {
  executive_summary?: {
    core_insight: string;
    the_problem?: string;
    recommended_path?: string;
  };
  problem_analysis?: {
    whats_wrong: string;
    why_its_hard?: string;
  };
  solution_concepts?: {
    lead_concepts: Array<{
      title?: string;
      name?: string;
      description?: string;
    }>;
  };
  next_steps?: {
    steps: Array<{ action: string } | string>;
  };
}

export interface ReportForPDF {
  id: string;
  title: string;
  headline?: string;
  report_data: ReportPDFData;
  created_at: string;
}
```

**PDF Component (`apps/web/app/api/reports/[id]/pdf/_components/report-pdf-document.tsx`):**

```typescript
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ReportForPDF } from '../_lib/types';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11 },
  title: { fontSize: 20, marginBottom: 15 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  content: { lineHeight: 1.5 },
  listItem: { marginBottom: 4 },
});

interface Props {
  report: ReportForPDF;
}

export function ReportPDFDocument({ report }: Props) {
  const data = report.report_data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{report.title}</Text>

        {report.headline && (
          <Text style={styles.content}>{report.headline}</Text>
        )}

        {data.executive_summary?.core_insight && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <Text style={styles.content}>{data.executive_summary.core_insight}</Text>
          </View>
        )}

        {data.problem_analysis?.whats_wrong && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Problem Analysis</Text>
            <Text style={styles.content}>{data.problem_analysis.whats_wrong}</Text>
          </View>
        )}

        {data.solution_concepts?.lead_concepts && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Solutions</Text>
            {data.solution_concepts.lead_concepts.map((concept, i) => (
              <Text key={i} style={styles.listItem}>
                {i + 1}. {concept.title ?? concept.name}
              </Text>
            ))}
          </View>
        )}

        {data.next_steps?.steps && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Steps</Text>
            {data.next_steps.steps.map((step, i) => (
              <Text key={i} style={styles.listItem}>
                {i + 1}. {typeof step === 'string' ? step : step.action}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
```

**API Route (`apps/web/app/api/reports/[id]/pdf/route.ts`):**

```typescript
import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { ReportPDFDocument } from './_components/report-pdf-document';
import type { ReportForPDF } from './_lib/types';

export const GET = enhanceRouteHandler(
  async function ({ params }) {
    const { id } = await params;
    const client = getSupabaseServerClient();

    const { data: report, error } = await client
      .from('sparlo_reports')
      .select('id, title, headline, report_data, created_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[PDF Export] Database error:', error);

      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    try {
      const pdfBuffer = await renderToBuffer(
        <ReportPDFDocument report={report as ReportForPDF} />
      );

      const filename = report.title
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase()
        .substring(0, 50);

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}-report.pdf"`,
        },
      });
    } catch (err) {
      console.error('[PDF Export] Generation failed:', err);
      return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
  },
  { auth: true }
);
```

### Phase 3: Share Link Generation

**Server Action (`apps/web/app/home/(user)/reports/[id]/_lib/server/share-actions.ts`):**

```typescript
'use server';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { z } from 'zod';

const GenerateShareLinkSchema = z.object({
  reportId: z.string().uuid(),
});

export const generateShareLink = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();

    // Verify ownership via RLS (will fail if not owner)
    const { data: report, error: reportError } = await client
      .from('sparlo_reports')
      .select('id')
      .eq('id', data.reportId)
      .single();

    if (reportError || !report) {
      throw new Error('Report not found or access denied');
    }

    // Check if share already exists
    const { data: existingShare } = await client
      .from('report_shares')
      .select('share_token')
      .eq('report_id', data.reportId)
      .single();

    if (existingShare) {
      return {
        success: true,
        shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/share/${existingShare.share_token}`,
      };
    }

    // Create new share
    const { data: share, error: shareError } = await client
      .from('report_shares')
      .insert({ report_id: data.reportId })
      .select('share_token')
      .single();

    if (shareError || !share) {
      throw new Error('Failed to create share link');
    }

    return {
      success: true,
      shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/share/${share.share_token}`,
    };
  },
  { schema: GenerateShareLinkSchema }
);
```

### Phase 4: Public Share Page

**Page (`apps/web/app/share/[token]/page.tsx`):**

```typescript
import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { PublicReportDisplay } from './_components/public-report-display';

// Service role client for public access (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;

  const { data } = await supabase
    .from('report_shares')
    .select('report:sparlo_reports(title, headline)')
    .eq('share_token', token)
    .single();

  const report = data?.report as { title: string; headline?: string } | null;

  return {
    title: report?.title ? `${report.title} | Sparlo` : 'Shared Report | Sparlo',
    description: report?.headline ?? 'View this shared Sparlo report',
  };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;

  const { data, error } = await supabase
    .from('report_shares')
    .select(`
      share_token,
      report:sparlo_reports(
        id, title, headline, report_data, created_at
      )
    `)
    .eq('share_token', token)
    .single();

  if (error || !data?.report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Report Not Found
          </h1>
          <p className="text-gray-600">
            This link may be invalid or the report may have been deleted.
          </p>
        </div>
      </div>
    );
  }

  return <PublicReportDisplay report={data.report} />;
}
```

**Error Boundary (`apps/web/app/share/[token]/error.tsx`):**

```typescript
'use client';

export default function SharePageError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We encountered an error loading this report.
        </p>
        <button onClick={reset} className="btn btn-primary">
          Try again
        </button>
      </div>
    </div>
  );
}
```

**Public Report Display (`apps/web/app/share/[token]/_components/public-report-display.tsx`):**

```typescript
import { ReportRenderer } from '@/app/home/(user)/reports/[id]/_components/report/report-renderer';

interface Props {
  report: {
    id: string;
    title: string;
    headline?: string;
    report_data: unknown;
    created_at: string;
  };
}

export function PublicReportDisplay({ report }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-gray-500">Shared Report</p>
          <h1 className="text-xl font-semibold">{report.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <ReportRenderer report={report} />
      </main>

      <footer className="text-center py-6 text-sm text-gray-500">
        Powered by Sparlo
      </footer>
    </div>
  );
}
```

### Phase 5: UI Integration

**Share Modal (`apps/web/app/home/(user)/reports/[id]/_components/share-modal.tsx`):**

```typescript
'use client';

import { useState, useTransition } from 'react';
import { Copy, Check, X } from 'lucide-react';
import { generateShareLink } from '../_lib/server/share-actions';

interface Props {
  reportId: string;
  onClose: () => void;
}

export function ShareModal({ reportId, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState({
    shareUrl: null as string | null,
    copied: false,
  });

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateShareLink({ reportId });
      if (result.success) {
        setState(prev => ({ ...prev, shareUrl: result.shareUrl }));
      }
    });
  };

  const handleCopy = async () => {
    if (state.shareUrl) {
      await navigator.clipboard.writeText(state.shareUrl);
      setState(prev => ({ ...prev, copied: true }));
      setTimeout(() => setState(prev => ({ ...prev, copied: false })), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Share Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!state.shareUrl ? (
          <>
            <p className="text-gray-600 text-sm mb-4">
              Generate a link to share this report with anyone.
            </p>
            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Generating...' : 'Generate Link'}
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
            <input
              type="text"
              value={state.shareUrl}
              readOnly
              className="flex-1 bg-transparent text-sm truncate"
            />
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-2 hover:bg-gray-200 rounded"
            >
              {state.copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Update Report Display (`apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`):**

Add to the existing toolbar (around line 714-722):

```typescript
const [showShareModal, setShowShareModal] = useState(false);
const [isExporting, setIsExporting] = useState(false);

const handleExportPDF = async () => {
  setIsExporting(true);
  try {
    const response = await fetch(`/api/reports/${reportId}/pdf`);

    if (response.status === 403) {
      toast.error('You do not have permission to export this report');
      return;
    }

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title}-report.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    toast.error('Failed to export PDF. Please try again.');
  } finally {
    setIsExporting(false);
  }
};

// In render:
<div className="flex gap-2">
  <button onClick={handleExportPDF} disabled={isExporting} className="btn">
    <Download className="btn-icon" />
    {isExporting ? 'Exporting...' : 'Export PDF'}
  </button>
  <button onClick={() => setShowShareModal(true)} className="btn">
    <Share2 className="btn-icon" />
    Share
  </button>
</div>

{showShareModal && (
  <ShareModal reportId={reportId} onClose={() => setShowShareModal(false)} />
)}
```

## Acceptance Criteria

### Functional Requirements

- [ ] Users can export their reports as PDF
- [ ] PDF includes report sections (summary, analysis, solutions, next steps)
- [ ] Users can generate a shareable link for their reports
- [ ] Unauthenticated users can view reports via share link
- [ ] Invalid share links show error message

### Non-Functional Requirements

- [ ] Share tokens are UUIDs (not guessable)
- [ ] RLS policies prevent unauthorized access
- [ ] PDF generation completes within 10 seconds
- [ ] No `any` types in implementation

## Files Summary

### New Files
```
apps/web/supabase/migrations/YYYYMMDDHHMMSS_add_report_shares.sql
apps/web/app/api/reports/[id]/pdf/route.ts
apps/web/app/api/reports/[id]/pdf/_lib/types.ts
apps/web/app/api/reports/[id]/pdf/_components/report-pdf-document.tsx
apps/web/app/home/(user)/reports/[id]/_lib/server/share-actions.ts
apps/web/app/home/(user)/reports/[id]/_components/share-modal.tsx
apps/web/app/share/[token]/page.tsx
apps/web/app/share/[token]/error.tsx
apps/web/app/share/[token]/_components/public-report-display.tsx
```

### Modified Files
```
apps/web/next.config.js (add serverComponentsExternalPackages)
apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx (add buttons)
packages/supabase/src/database.types.ts (regenerated)
```

## Implementation Order

1. Database migration
2. PDF generation (API route + component)
3. Share link server action
4. Public share page
5. UI integration (modal + buttons)
6. Testing

## What's NOT in This MVP

These features can be added later if needed:
- Link expiration
- Link revocation
- View count analytics
- Multiple links per report
- Custom PDF styling/fonts

---

Generated with [Claude Code](https://claude.com/claude-code)
