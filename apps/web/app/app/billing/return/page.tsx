import { notFound, redirect } from 'next/navigation';

import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { getBillingGatewayProvider } from '@kit/billing-gateway';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { getPlanTokenLimit } from '~/lib/billing/plan-limits';

import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

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
          href="/app/reports/new"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Run Analysis
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}

export default withI18n(ReturnCheckoutSessionPage);

async function loadCheckoutSession(sessionId: string) {
  const user = await requireUserInServerComponent();

  const client = getSupabaseServerClient();

  let gateway;
  try {
    gateway = await getBillingGatewayProvider(client);
  } catch (error) {
    console.error('[Billing] Failed to get billing gateway provider:', error);
    throw new Error('Failed to initialize billing gateway');
  }

  let session;
  try {
    session = await gateway.retrieveCheckoutSession({
      sessionId,
    });
  } catch (error) {
    console.error('[Billing] Failed to retrieve checkout session:', {
      sessionId,
      error,
    });
    throw new Error('Failed to retrieve checkout session from Stripe');
  }

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
    // ALWAYS fetch fresh subscription data from Stripe
    let subscriptionData;
    try {
      subscriptionData = await gateway.getSubscription(session.subscriptionId);
    } catch (error) {
      console.error('[Billing] Failed to fetch subscription from Stripe:', {
        subscriptionId: session.subscriptionId,
        error,
      });
      // Don't crash the page - webhook will handle sync
    }

    if (subscriptionData) {
      // SECURITY: Validate subscription ownership from Stripe metadata
      if (subscriptionData.target_account_id &&
          subscriptionData.target_account_id !== user.id) {
        console.error('[Billing Security] Subscription account mismatch', {
          sessionId,
          currentUserId: user.id,
          subscriptionAccountId: subscriptionData.target_account_id,
        });
        redirect('/app/billing?error=subscription_mismatch');
      }

      // Check if subscription already exists in our database
      try {
        const { data: existingSub } = await client
          .from('subscriptions')
          .select('id')
          .eq('id', session.subscriptionId)
          .maybeSingle();

        if (!existingSub) {
          // Subscription doesn't exist yet - sync it
          // IMPORTANT: Use admin client because upsert_subscription is only granted to service_role
          const adminClient = getSupabaseServerAdminClient();
          const { error } = await adminClient.rpc('upsert_subscription', {
            ...subscriptionData,
            target_account_id: user.id,
            target_customer_id: session.customer?.id ?? subscriptionData.target_customer_id,
          });

          if (error) {
            console.error('[Billing] Failed to sync subscription on return:', error);
          } else {
            subscriptionSynced = true;
            console.log('[Billing] Subscription synced on return page:', subscriptionData.target_subscription_id);
          }
        } else {
          console.log('[Billing] Subscription already exists in DB, skipping subscription sync');
        }
      } catch (error) {
        console.error('[Billing] Error checking/syncing subscription:', error);
      }

      // CRITICAL: ALWAYS sync usage period regardless of subscription sync status
      // This ensures usage period is created even if:
      // 1. Subscription was already synced by webhook
      // 2. Webhook created subscription but not usage period
      // 3. Any previous sync attempts failed
      const priceId = subscriptionData.line_items?.[0]?.variant_id;
      console.log('[Billing] Preparing to sync usage period:', {
        accountId: user.id,
        priceId,
        hasPeriodStart: !!subscriptionData.period_starts_at,
        hasPeriodEnd: !!subscriptionData.period_ends_at,
      });

      if (priceId && subscriptionData.period_starts_at && subscriptionData.period_ends_at) {
        try {
          const tokenLimit = getPlanTokenLimit(priceId);
          const adminClient = getSupabaseServerAdminClient();

          console.log('[Billing] Calling reset_usage_period:', {
            accountId: user.id,
            tokenLimit,
            priceId,
            periodStart: subscriptionData.period_starts_at,
            periodEnd: subscriptionData.period_ends_at,
          });

          const { error: usageError } = await adminClient.rpc('reset_usage_period', {
            p_account_id: user.id,
            p_tokens_limit: tokenLimit,
            p_period_start: subscriptionData.period_starts_at,
            p_period_end: subscriptionData.period_ends_at,
          });

          if (usageError) {
            console.error('[Billing] FAILED to sync usage period on return:', usageError);
          } else {
            console.log('[Billing] SUCCESS: Usage period synced on return page:', { tokenLimit, priceId });
          }
        } catch (usageErr) {
          console.error('[Billing] EXCEPTION syncing usage period:', usageErr);
        }
      } else {
        console.error('[Billing] MISSING DATA for usage period sync - this is a bug:', {
          priceId,
          periodStart: subscriptionData.period_starts_at,
          periodEnd: subscriptionData.period_ends_at,
          fullSubscriptionData: JSON.stringify(subscriptionData),
        });
      }
    } else {
      console.error('[Billing] Failed to fetch subscription from Stripe:', session.subscriptionId);
    }
  }

  return {
    status: session.status,
    customerEmail: session.customer?.email ?? null,
    subscriptionSynced,
  };
}
