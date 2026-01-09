/**
 * Test script to verify usage period sync works correctly.
 * Run with: npx tsx scripts/test-usage-period-sync.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TEST_ACCOUNT_ID = '047c013c-334d-45aa-9883-f49ffc84d55c';
const CORE_TOKEN_LIMIT = 3_000_000;

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.log('Run with: npx dotenv -e apps/web/.env.local -- tsx scripts/test-usage-period-sync.ts');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('=== Testing Usage Period Sync ===\n');

  // Step 1: Check current subscription
  console.log('1. Checking subscription...');
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('id, status, period_starts_at, period_ends_at, active')
    .eq('account_id', TEST_ACCOUNT_ID)
    .maybeSingle();

  if (subError) {
    console.error('Error fetching subscription:', subError);
    process.exit(1);
  }

  if (!subscription) {
    console.log('No subscription found for account');
    process.exit(1);
  }

  console.log('Subscription found:', {
    id: subscription.id,
    status: subscription.status,
    active: subscription.active,
    periodStart: subscription.period_starts_at,
    periodEnd: subscription.period_ends_at,
  });

  // Step 2: Check current usage period
  console.log('\n2. Checking current usage periods...');
  const { data: usagePeriods, error: usageError } = await supabase
    .from('usage_periods')
    .select('id, tokens_used, tokens_limit, status, period_start, period_end')
    .eq('account_id', TEST_ACCOUNT_ID)
    .order('created_at', { ascending: false });

  if (usageError) {
    console.error('Error fetching usage periods:', usageError);
  } else {
    console.log('Current usage periods:', usagePeriods);
  }

  // Step 3: Call reset_usage_period
  console.log('\n3. Calling reset_usage_period...');
  const { error: resetError } = await supabase.rpc('reset_usage_period', {
    p_account_id: TEST_ACCOUNT_ID,
    p_tokens_limit: CORE_TOKEN_LIMIT,
    p_period_start: subscription.period_starts_at,
    p_period_end: subscription.period_ends_at,
  });

  if (resetError) {
    console.error('Error calling reset_usage_period:', resetError);
    process.exit(1);
  }

  console.log('reset_usage_period called successfully!');

  // Step 4: Verify the result
  console.log('\n4. Verifying result...');
  const { data: newPeriod, error: verifyError } = await supabase
    .from('usage_periods')
    .select('id, tokens_used, tokens_limit, status, period_start, period_end')
    .eq('account_id', TEST_ACCOUNT_ID)
    .eq('status', 'active')
    .maybeSingle();

  if (verifyError) {
    console.error('Error verifying:', verifyError);
    process.exit(1);
  }

  if (!newPeriod) {
    console.error('❌ No active usage period found after reset!');
    process.exit(1);
  }

  console.log('New usage period:', newPeriod);

  // Step 5: Validate
  if (newPeriod.tokens_limit === CORE_TOKEN_LIMIT) {
    console.log(`\n✅ SUCCESS! Token limit is correctly set to ${CORE_TOKEN_LIMIT.toLocaleString()}`);
  } else {
    console.error(`\n❌ FAIL! Token limit is ${newPeriod.tokens_limit}, expected ${CORE_TOKEN_LIMIT}`);
    process.exit(1);
  }
}

main().catch(console.error);
