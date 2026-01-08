import { notFound, redirect } from 'next/navigation';

import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { getBillingGatewayProvider } from '@kit/billing-gateway';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { createPersonalAccountBillingPortalSession } from '../_lib/server/server-actions';

interface SessionPageProps {
  searchParams: Promise<{
    session_id: string;
  }>;
}

async function ReturnCheckoutSessionPage({ searchParams }: SessionPageProps) {
  const sessionId = (await searchParams).session_id;

  if (!sessionId) {
    redirect('/app/billing');
  }

  const { status, customerEmail, subscriptionSynced } = await loadCheckoutSession(sessionId);

  // If session is still open/incomplete, redirect back to billing
  if (status === 'open') {
    redirect('/app/billing');
  }

  // Log if subscription wasn't synced (webhook may have already handled it)
  if (!subscriptionSynced) {
    console.log('[Billing] Subscription already existed or webhook handled it');
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
          You&apos;re all set
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
          href="/app"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Run Analysis
          <ArrowRight className="h-4 w-4" />
        </Link>

        {/* Secondary link - goes to Stripe billing portal */}
        <form action={createPersonalAccountBillingPortalSession} className="mt-6">
          <button
            type="submit"
            className="text-[14px] text-zinc-400 underline transition-colors hover:text-zinc-600"
          >
            Manage subscription
          </button>
        </form>
      </div>
    </main>
  );
}

export default withI18n(ReturnCheckoutSessionPage);

async function loadCheckoutSession(sessionId: string) {
  const user = await requireUserInServerComponent();

  const client = getSupabaseServerClient();
  const gateway = await getBillingGatewayProvider(client);

  const session = await gateway.retrieveCheckoutSession({
    sessionId,
  });

  if (!session) {
    notFound();
  }

  // SECURITY: Validate session ownership to prevent subscription hijacking
  // clientReferenceId contains the account ID that initiated checkout
  if (session.clientReferenceId && session.clientReferenceId !== user.id) {
    console.error('[Billing Security] Session ownership mismatch - potential hijacking attempt', {
      sessionId,
      currentUserId: user.id,
      sessionOwnerId: session.clientReferenceId,
    });
    // Redirect to billing with error - don't expose details to potential attacker
    redirect('/app/billing?error=session_invalid');
  }

  // If session is complete and has a subscription, ensure it's synced to database
  // This handles race condition where webhook hasn't fired yet
  let subscriptionSynced = false;
  if (session.status === 'complete' && session.subscriptionId) {
    try {
      // Check if subscription already exists
      const { data: existingSub } = await client
        .from('subscriptions')
        .select('id')
        .eq('id', session.subscriptionId)
        .maybeSingle();

      if (!existingSub) {
        // Subscription doesn't exist yet - retrieve from Stripe and sync
        const subscriptionData = await gateway.getSubscription(session.subscriptionId);

        if (subscriptionData) {
          // SECURITY: Validate subscription ownership from Stripe metadata
          // If Stripe has an account_id in metadata, it MUST match current user
          if (subscriptionData.target_account_id &&
              subscriptionData.target_account_id !== user.id) {
            console.error('[Billing Security] Subscription account mismatch', {
              sessionId,
              currentUserId: user.id,
              subscriptionAccountId: subscriptionData.target_account_id,
            });
            redirect('/app/billing?error=subscription_mismatch');
          }

          const { error } = await client.rpc('upsert_subscription', {
            ...subscriptionData,
            // Use current user's ID - we've validated ownership above
            target_account_id: user.id,
            target_customer_id: session.customer.id ?? subscriptionData.target_customer_id,
          });

          if (error) {
            console.error('[Billing] Failed to sync subscription on return:', error);
          } else {
            subscriptionSynced = true;
            console.log('[Billing] Subscription synced on return page:', subscriptionData.target_subscription_id);
          }
        }
      }
    } catch (error) {
      // Don't fail the page if sync fails - webhook will handle it
      console.error('[Billing] Error syncing subscription on return:', error);
    }
  }

  return {
    status: session.status,
    customerEmail: session.customer.email,
    subscriptionSynced,
  };
}
