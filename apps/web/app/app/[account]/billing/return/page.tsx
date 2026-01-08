import { notFound, redirect } from 'next/navigation';

import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { getBillingGatewayProvider } from '@kit/billing-gateway';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

interface SessionPageProps {
  params: Promise<{
    account: string;
  }>;
  searchParams: Promise<{
    session_id: string;
  }>;
}

async function ReturnCheckoutSessionPage({
  params,
  searchParams,
}: SessionPageProps) {
  const { account } = await params;
  const sessionId = (await searchParams).session_id;

  if (!sessionId) {
    redirect(`/app/${account}/billing`);
  }

  const { status, customerEmail } = await loadCheckoutSession(sessionId);

  // If session is still open/incomplete, redirect back to billing
  if (status === 'open') {
    redirect(`/app/${account}/billing`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md text-center">
        {/* Success icon */}
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900">
          <Check className="h-8 w-8 text-white" strokeWidth={2.5} />
        </div>

        {/* Heading */}
        <h1 className="mb-3 text-[32px] font-normal tracking-[-0.02em] text-zinc-900">
          You're all set
        </h1>

        {/* Description */}
        <p className="mb-8 text-[16px] leading-relaxed text-zinc-500">
          Your subscription is now active.
          {customerEmail && (
            <>
              <br />A receipt has been sent to{' '}
              <span className="text-zinc-700">{customerEmail}</span>
            </>
          )}
        </p>

        {/* CTA */}
        <Link
          href={`/app/${account}`}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Run Analysis
          <ArrowRight className="h-4 w-4" />
        </Link>

        {/* Secondary link */}
        <p className="mt-6 text-[14px] text-zinc-400">
          <Link
            href={`/app/${account}/billing`}
            className="underline transition-colors hover:text-zinc-600"
          >
            View billing details
          </Link>
        </p>
      </div>
    </main>
  );
}

export default withI18n(ReturnCheckoutSessionPage);

async function loadCheckoutSession(sessionId: string) {
  await requireUserInServerComponent();

  const client = getSupabaseServerClient();
  const gateway = await getBillingGatewayProvider(client);

  const session = await gateway.retrieveCheckoutSession({
    sessionId,
  });

  if (!session) {
    notFound();
  }

  return {
    status: session.status,
    customerEmail: session.customer.email,
  };
}
