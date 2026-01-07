import { Suspense } from 'react';

import { Loader2 } from 'lucide-react';

import { loadArchivedReports } from '../_lib/server/archived-reports.loader';
import { ArchivedReportsDashboard } from './_components/archived-reports-dashboard';

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-[--accent]" />
      <p className="mt-4 text-sm text-[--text-muted]">
        Loading archived reports...
      </p>
    </div>
  );
}

async function ArchivedReportsList() {
  const reports = await loadArchivedReports();

  return <ArchivedReportsDashboard reports={reports} />;
}

export default function ArchivedPage() {
  return (
    <div className="min-h-[calc(100vh-120px)] bg-[--surface-base]">
      <Suspense fallback={<LoadingState />}>
        <ArchivedReportsList />
      </Suspense>
    </div>
  );
}
