import 'server-only';

import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { PublicReportDisplay } from './_components/public-report-display';
import { loadSharedReport } from './_lib/server/shared-report.loader';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  const report = await loadSharedReport(token);

  if (!report) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <PublicReportDisplay report={report} />
    </div>
  );
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const report = await loadSharedReport(token);

  return {
    title: report?.title ?? 'Shared Report',
    description: report?.headline ?? 'Sparlo Innovation Report',
    robots: {
      index: false,
      follow: false,
    },
  };
}
