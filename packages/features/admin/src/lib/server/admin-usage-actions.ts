'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { isSuperAdmin } from './utils/is-super-admin';

// Explicit types (not inferred from ReturnType)
export type AdminUserSearchResult = {
  user_id: string;
  email: string;
  account_id: string;
  account_name: string;
  is_personal_account: boolean;
  created_at: string;
  tokens_used: number;
  tokens_limit: number;
  period_start: string | null;
  period_end: string | null;
  subscription_status: string;
};

// Reason types for structured audit trail
export const ADJUSTMENT_REASONS = [
  {
    value: 'error_refund',
    label: 'Error Refund',
    description: 'Report/feature failed and consumed tokens',
  },
  {
    value: 'upgrade_bonus',
    label: 'Upgrade Bonus',
    description: 'User upgraded plan, granting early access',
  },
  {
    value: 'support_request',
    label: 'Support Request',
    description: 'User requested increase via support',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason (specify in details)',
  },
] as const;

export type AdjustmentReasonType = (typeof ADJUSTMENT_REASONS)[number]['value'];

// Schemas
const SearchUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const AdjustTokenLimitSchema = z
  .object({
    accountId: z.string().uuid('Invalid account ID'),
    additionalTokens: z
      .number()
      .int('Must be a whole number')
      .min(1, 'Must add at least 1 token')
      .max(10_000_000, 'Cannot add more than 10 million tokens at once'),
    reasonType: z.enum([
      'error_refund',
      'upgrade_bonus',
      'support_request',
      'other',
    ]),
    reasonDetails: z.string().max(500).optional(),
  })
  .refine(
    (data) =>
      data.reasonType !== 'other' ||
      (data.reasonDetails && data.reasonDetails.length >= 10),
    {
      message: 'Please provide details when selecting "Other"',
      path: ['reasonDetails'],
    },
  );

export type AdjustTokenLimitInput = z.infer<typeof AdjustTokenLimitSchema>;

/**
 * Search for a user by email
 */
export const searchUserByEmailAction = enhanceAction(
  async (data: z.infer<typeof SearchUserSchema>) => {
    const logger = await getLogger();
    const client = getSupabaseServerClient();

    // Check admin status with logging
    const isAdmin = await isSuperAdmin(client);
    logger.info({ isAdmin, email: data.email }, 'Admin search attempt');

    if (!isAdmin) {
      // Get more info about why admin check failed
      const { data: userData } = await client.auth.getUser();
      logger.warn(
        {
          userId: userData?.user?.id,
          userEmail: userData?.user?.email,
          appMetadata: userData?.user?.app_metadata,
        },
        'Admin check failed - user not super admin',
      );
      throw new Error('Unauthorized: Admin access required');
    }

    const adminClient = getSupabaseServerAdminClient();

    const { data: users, error } = await adminClient.rpc(
      'admin_search_users_by_email',
      {
        p_email: data.email,
      },
    );

    if (error) {
      logger.error({ error, email: data.email }, 'Failed to search for user');
      throw new Error(`Failed to search for user: ${error.message}`);
    }

    return { users: (users ?? []) as AdminUserSearchResult[] };
  },
  { schema: SearchUserSchema },
);

// Type for the RPC response
type AdjustUsagePeriodLimitResult = {
  success: boolean;
  period_id: string;
  old_limit: number;
  new_limit: number;
  tokens_used: number;
};

/**
 * Increase token limit for a user's current usage period
 */
export const increaseTokenLimitAction = enhanceAction(
  async (data: AdjustTokenLimitInput, user) => {
    // Check admin status
    const isAdmin = await isSuperAdmin(getSupabaseServerClient());
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const logger = await getLogger();
    const adminClient = getSupabaseServerAdminClient();

    logger.info(
      {
        accountId: data.accountId,
        additionalTokens: data.additionalTokens,
        reasonType: data.reasonType,
        adminUserId: user.id,
      },
      'Admin increasing token limit',
    );

    const { data: result, error } = await adminClient.rpc(
      'adjust_usage_period_limit',
      {
        p_account_id: data.accountId,
        p_additional_tokens: data.additionalTokens,
        p_admin_user_id: user.id,
        p_reason_type: data.reasonType,
        p_reason_details: data.reasonDetails,
      },
    );

    if (error) {
      logger.error(
        { error, accountId: data.accountId },
        'Failed to adjust token limit',
      );

      // User-friendly error messages
      if (error.message.includes('Rate limit exceeded')) {
        throw new Error(
          'Too many adjustments. Please wait before making more changes.',
        );
      }
      if (error.message.includes('No active usage period')) {
        throw new Error('This user does not have an active billing period.');
      }
      if (error.message.includes('safety limit')) {
        throw new Error(
          'This would exceed the safety limit for adjustments this period.',
        );
      }
      if (error.message.includes('cannot be less than')) {
        throw new Error(
          'Token limit cannot be less than tokens already used.',
        );
      }

      throw new Error('Failed to adjust token limit. Please try again.');
    }

    const typedResult = result as AdjustUsagePeriodLimitResult;

    logger.info(
      {
        accountId: data.accountId,
        oldLimit: typedResult.old_limit,
        newLimit: typedResult.new_limit,
      },
      'Token limit increased successfully',
    );

    revalidatePath('/admin/usage');

    return {
      oldLimit: typedResult.old_limit,
      newLimit: typedResult.new_limit,
      tokensUsed: typedResult.tokens_used,
    };
  },
  { schema: AdjustTokenLimitSchema },
);
