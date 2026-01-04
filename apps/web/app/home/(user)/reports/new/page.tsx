import { Suspense } from 'react';

import { Metadata } from 'next';

import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';
import { USAGE_CONSTANTS } from '~/lib/usage/constants';

import { checkUsageAllowed } from '../../_lib/server/usage.service';
import { NewAnalysisForm } from './_components/new-analysis-form';
import { PageSkeleton } from './_components/page-skeleton';
import { TokenGateScreen } from './_components/token-gate-screen';

export const metadata: Metadata = {
  title: 'New Analysis',
};

interface PageProps {
  searchParams: Promise<{
    prefill?: string;
    error?: string;
  }>;
}

/**
 * Async content component that performs auth and usage checks.
 * Wrapped in Suspense to allow streaming the page shell immediately.
 */
async function UsageGatedContent({
  prefill,
  error,
}: {
  prefill?: string;
  error?: string;
}) {
  const user = await requireUserInServerComponent();

  // Check usage before rendering the form
  const usage = await checkUsageAllowed(
    user.id,
    USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
  );

  // Gate: Show upgrade screen if not allowed
  if (!usage.allowed) {
    return (
      <TokenGateScreen
        variant={usage.reason}
        periodEnd={usage.periodEnd}
        percentage={usage.percentage}
      />
    );
  }

  // Show the analysis form
  return <NewAnalysisForm prefill={prefill} error={error} />;
}

export default async function NewReportPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <UsageGatedContent prefill={params.prefill} error={params.error} />
    </Suspense>
  );
}
