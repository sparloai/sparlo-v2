# Team Usage & Design Updates

## Goal

Display usage on team billing page (percentage + per-member report counts), apply Sparlo design system to all team pages.

## Problem

1. Team billing page has no usage display (personal has `AuraUsageCard`)
2. Team pages use basic MakerKit styling instead of Sparlo design system
3. No visibility into which team members are using quota

## Solution Overview

- **Extend** existing `AuraUsageCard` with optional `memberUsage` prop (not duplicate)
- **Create** database RPC for efficient per-member aggregation (not client-side)
- **Apply** Sparlo design classes directly to team pages (no new layout component)
- **Single phase** implementation (not 3 phases)

---

## Implementation

### 1. Database: Create `get_team_member_usage` RPC

**File**: `apps/web/supabase/migrations/YYYYMMDD_add_team_member_usage_rpc.sql`

```sql
create or replace function public.get_team_member_usage(
  p_account_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz
)
returns table (
  user_id uuid,
  user_name text,
  user_email text,
  reports_count bigint,
  is_current_member boolean
)
language sql
security definer
set search_path = ''
as $$
  select
    u.id as user_id,
    coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as user_name,
    u.email as user_email,
    count(r.id) as reports_count,
    exists(
      select 1 from public.accounts_memberships am
      where am.account_id = p_account_id
      and am.user_id = u.id
    ) as is_current_member
  from auth.users u
  inner join public.sparlo_reports r on r.created_by = u.id
    and r.account_id = p_account_id
    and r.status = 'complete'
    and r.created_at >= p_period_start
    and r.created_at <= p_period_end
  group by u.id, u.email, u.raw_user_meta_data
  order by count(r.id) desc;
$$;

-- Grant access
grant execute on function public.get_team_member_usage to authenticated;
```

### 2. Backend: Create Team Usage Loader

**File**: `apps/web/app/home/[account]/_lib/server/team-usage.loader.ts`

```typescript
import 'server-only';

import { cache } from 'react';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { UsageCheckResponseSchema } from '~/lib/usage/schemas';

export interface TeamMemberUsage {
  userId: string;
  userName: string;
  userEmail: string;
  reportsCount: number;
  isCurrentMember: boolean;
}

export interface TeamUsageData {
  percentage: number;
  tokensUsed: number;
  tokensLimit: number;
  periodEnd: string | null;
  memberUsage: TeamMemberUsage[];
}

export interface TeamUsageResult {
  data: TeamUsageData | null;
  error: string | null;
}

export const loadTeamUsage = cache(async (accountId: string): Promise<TeamUsageResult> => {
  const client = getSupabaseServerClient();

  try {
    // 1. Get usage period data
    const { data: usageData, error: usageError } = await client.rpc('check_usage_allowed', {
      p_account_id: accountId,
      p_estimated_tokens: 0,
    });

    if (usageError) {
      console.error('Usage check failed:', usageError);
      return { data: null, error: 'Failed to load usage data' };
    }

    const validated = UsageCheckResponseSchema.safeParse(usageData);
    if (!validated.success) {
      return { data: null, error: 'Invalid usage data format' };
    }

    const usage = validated.data;

    // 2. Calculate period start (usage periods are monthly)
    const periodEnd = usage.period_end ? new Date(usage.period_end) : new Date();
    const periodStart = new Date(periodEnd);
    periodStart.setMonth(periodStart.getMonth() - 1);

    // 3. Get per-member report counts
    const { data: memberData, error: memberError } = await client.rpc('get_team_member_usage', {
      p_account_id: accountId,
      p_period_start: periodStart.toISOString(),
      p_period_end: periodEnd.toISOString(),
    });

    if (memberError) {
      console.error('Member usage failed:', memberError);
      // Non-fatal - continue without member breakdown
    }

    const memberUsage: TeamMemberUsage[] = (memberData ?? []).map((m: any) => ({
      userId: m.user_id,
      userName: m.user_name || 'Unknown',
      userEmail: m.user_email || '',
      reportsCount: Number(m.reports_count),
      isCurrentMember: m.is_current_member,
    }));

    return {
      data: {
        percentage: usage.percentage,
        tokensUsed: usage.tokens_used,
        tokensLimit: usage.tokens_limit,
        periodEnd: usage.period_end,
        memberUsage,
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error loading team usage:', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
});
```

### 3. Frontend: Extend AuraUsageCard

**File**: `apps/web/app/home/(user)/billing/_components/aura-usage-card.tsx`

Add optional `memberUsage` prop to existing component:

```typescript
// Add to existing interface
interface AuraUsageCardProps {
  // ... existing props
  memberUsage?: Array<{
    userId: string;
    userName: string;
    reportsCount: number;
    isCurrentMember: boolean;
  }>;
}

// Add section at end of component (before closing card div)
{memberUsage && memberUsage.length > 0 && (
  <div className="border-t border-zinc-200 pt-6 mt-6">
    <h4 className="text-[13px] font-semibold tracking-[0.06em] uppercase text-zinc-500 mb-4">
      Reports by Member
    </h4>
    <div className="space-y-3">
      {memberUsage.map((member) => (
        <div key={member.userId} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[15px] text-zinc-700">{member.userName}</span>
            {!member.isCurrentMember && (
              <span className="text-[11px] text-zinc-400">(removed)</span>
            )}
          </div>
          <span className="text-[15px] font-medium text-zinc-900">
            {member.reportsCount} {member.reportsCount === 1 ? 'report' : 'reports'}
          </span>
        </div>
      ))}
    </div>
  </div>
)}

{memberUsage && memberUsage.length === 0 && (
  <div className="border-t border-zinc-200 pt-6 mt-6">
    <p className="text-[14px] text-zinc-400 italic">
      No reports generated this period
    </p>
  </div>
)}
```

### 4. Update Team Billing Page

**File**: `apps/web/app/home/[account]/billing/page.tsx`

```typescript
// Add import
import { loadTeamUsage } from '../_lib/server/team-usage.loader';
import { AuraUsageCard } from '~/app/home/(user)/billing/_components/aura-usage-card';
import { Alert, AlertDescription } from '@kit/ui/alert';

// Update data loading (add usage to Promise.all)
const [billingData, usageResult] = await Promise.all([
  loadTeamAccountBillingPage(accountId),
  loadTeamUsage(accountId),
]);
const [subscription, order, customerId] = billingData;

// Add to JSX (after subscription card, before billing portal)
{canManageBilling && usageResult.error && (
  <Alert variant="warning">
    <AlertDescription>{usageResult.error}</AlertDescription>
  </Alert>
)}

{canManageBilling && usageResult.data && subscription && (
  <AuraUsageCard
    tokensUsed={usageResult.data.tokensUsed}
    tokensLimit={usageResult.data.tokensLimit}
    reportsCount={usageResult.data.memberUsage.reduce((sum, m) => sum + m.reportsCount, 0)}
    chatTokensUsed={0}
    periodEnd={subscription.period_ends_at}
    planName={subscriptionProductPlan?.product.name ?? 'Team'}
    memberUsage={usageResult.data.memberUsage}
  />
)}
```

### 5. Apply Sparlo Design to Team Pages

Apply these classes directly to existing page structures (no new layout component):

**Left border pattern**: `border-l-2 border-zinc-900 pl-10`

**Card pattern**: `rounded-xl border border-zinc-200 bg-white shadow-sm`

**Label**: `text-[13px] font-semibold tracking-[0.06em] uppercase text-zinc-500`

#### Files to update:
- `apps/web/app/home/[account]/page.tsx` - Add left border to content wrapper
- `apps/web/app/home/[account]/members/page.tsx` - Update card styling
- `apps/web/app/home/[account]/settings/page.tsx` - Update card styling
- `apps/web/app/home/[account]/billing/page.tsx` - Update card styling

---

## Acceptance Criteria

- [ ] Team billing page shows usage percentage with progress bar
- [ ] Progress bar colors: normal (zinc), warning at 80% (amber), critical at 95% (red)
- [ ] Per-member report counts displayed, sorted by highest first
- [ ] Removed members shown with "(removed)" indicator
- [ ] Only users with `billing.manage` permission see usage
- [ ] Error states show user-friendly message
- [ ] All team pages have Sparlo left border accent
- [ ] Mobile responsive (stack on small screens)

---

## Files Summary

### Create
| File | Purpose |
|------|---------|
| `apps/web/supabase/migrations/YYYYMMDD_add_team_member_usage_rpc.sql` | RPC for per-member aggregation |
| `apps/web/app/home/[account]/_lib/server/team-usage.loader.ts` | Load team usage data |

### Modify
| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/billing/_components/aura-usage-card.tsx` | Add `memberUsage` prop |
| `apps/web/app/home/[account]/billing/page.tsx` | Load & display usage |
| `apps/web/app/home/[account]/page.tsx` | Sparlo styling |
| `apps/web/app/home/[account]/members/page.tsx` | Sparlo styling |
| `apps/web/app/home/[account]/settings/page.tsx` | Sparlo styling |

---

## References

- Design system: `docs/SPARLO-DESIGN-SYSTEM.md`
- Personal usage card: `apps/web/app/home/(user)/billing/_components/aura-usage-card.tsx`
- Usage constants: `apps/web/lib/usage/constants.ts`
- Usage schemas: `apps/web/lib/usage/schemas.ts`
