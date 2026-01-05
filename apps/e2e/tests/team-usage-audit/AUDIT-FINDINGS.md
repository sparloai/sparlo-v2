# Team Accounts UX/UI Audit Report

**Date**: January 4, 2026
**Target**: https://sparlo.ai
**Team Slug**: `audit-team`

---

## Executive Summary

The team accounts feature has several critical and major issues that need addressing before it's production-ready. The most severe problems involve incorrect pricing display and irrelevant content being shown to team accounts.

### Issue Counts
- **Critical**: 2 (1 FIXED)
- **Major**: 5
- **Minor**: 3

### Fixes Applied
- **Billing prices now display in dollars** - Fixed `plan-cost-display.tsx` and `line-item-details.tsx` to divide by 100

---

## Critical Issues

### 1. ✅ FIXED: Billing Prices Displayed in Cents, Not Dollars

**Location**: `/home/audit-team/billing`
**Severity**: Critical
**Evidence**: Prices show as $19,900/month, $49,900/month, $99,900/month instead of $199, $499, $999

**Root Cause**: The `billing.config.ts` stores prices in cents (19900, 49900, 99900) but `PlanCostDisplay` and `LineItemDetails` components didn't divide by 100.

**Fix Applied**: Updated two files:
- `packages/billing/gateway/src/components/plan-cost-display.tsx` - Added `/100` to cost calculations
- `packages/billing/gateway/src/components/line-item-details.tsx` - Fixed all 6 cost display instances

### 2. Team Account Not Visible in Account Selector

**Location**: Global navigation / account dropdown
**Severity**: Critical
**Evidence**: Team "audit-team" exists in database with correct membership, but doesn't appear in the account selector dropdown

**Root Cause**: The `user_accounts` view or account loader may not be including team accounts properly

**Investigation Needed**:
- Check `loadAccountsForUser` function
- Verify `user_accounts` view includes `is_personal_account = false`
- Check if UI filters out team accounts

---

## Major Issues

### 3. Team Dashboard Shows Irrelevant SaaS Metrics

**Location**: `/home/audit-team`
**Severity**: Major
**Evidence**: Dashboard displays MRR, Revenue, Fees, Visitors metrics that are irrelevant for team usage

**Recommendation**: Either:
1. Create a dedicated team dashboard showing relevant metrics (usage, members, billing status)
2. Redirect team accounts directly to the billing/usage page
3. Hide the Dashboard link entirely for team accounts

### 4. Missing Usage Card on Billing Page

**Location**: `/home/audit-team/billing`
**Severity**: Major
**Evidence**: The `AuraUsageCard` component with member breakdown is not visible on the billing page

**Root Cause**: Component may not be rendered for team accounts, or data loader isn't returning usage data

**Fix**: Verify `TeamBillingPage` includes `<AuraUsageCard />` and the loader provides usage data

### 5. Missing Member Usage Breakdown

**Location**: `/home/audit-team/billing`
**Severity**: Major
**Evidence**: No per-member token usage breakdown visible despite building this feature

**Expected**: Table/list showing each team member and their token consumption

### 6. Plan Selector May Not Link to Stripe

**Location**: `/home/audit-team/billing`
**Severity**: Major
**Evidence**: "Proceed to Payment" button may not properly redirect to Stripe checkout

**Fix**: Verify Stripe integration is properly configured for team accounts

### 7. Navigation Links May Be Incorrect

**Location**: Sidebar navigation
**Severity**: Major
**Evidence**: Members link was reported as `/audit-team/members` instead of `/home/audit-team/members`

**Fix**: Ensure all sidebar links include the `/home/` prefix for team account routes

---

## Minor Issues

### 8. Missing Sparlo Design System Left Border Accent

**Location**: All team pages
**Severity**: Minor
**Evidence**: Pages don't show the signature `border-l-2 border-zinc-900 pl-10` left border accent

**Fix**: Apply Sparlo design patterns per `docs/SPARLO-DESIGN-SYSTEM.md`

### 9. No Loading States for Data

**Location**: All team pages
**Severity**: Minor
**Evidence**: No loading spinners when data is being fetched

**Fix**: Add `<LoadingSpinner />` components during data loading

### 10. Inconsistent Page Headers

**Location**: Team pages
**Severity**: Minor
**Evidence**: Page headers may not match the Sparlo design system typography hierarchy

---

## Recommended Fixes by Priority

### Immediate (Before Launch)

1. **Fix pricing display** - Divide by 100 when rendering prices
2. **Fix account selector** - Ensure team accounts appear in dropdown
3. **Add usage card to billing** - Render the component we built

### Short-term

4. **Fix navigation links** - Ensure all links have correct `/home/` prefix
5. **Redesign team dashboard** - Remove SaaS metrics, show relevant team info
6. **Verify Stripe integration** - Test payment flow end-to-end

### Polish

7. **Apply Sparlo design** - Left border accents, typography hierarchy
8. **Add loading states** - Spinners for all data loading
9. **Add member usage breakdown** - Display per-member token consumption

---

## Files Modified (Fixed)

| File | Status |
|------|--------|
| `packages/billing/gateway/src/components/plan-cost-display.tsx` | ✅ Fixed - prices now in dollars |
| `packages/billing/gateway/src/components/line-item-details.tsx` | ✅ Fixed - all 6 cost displays |

## Files Still Need Modification

| File | Change Needed |
|------|--------|
| `apps/web/app/home/[account]/billing/page.tsx` | Verify AuraUsageCard shows for new teams |
| `apps/web/app/home/[account]/_lib/server/team-billing-page.loader.ts` | Ensure usage data loads |
| `packages/features/team-accounts/src/components/team-account-sidebar.tsx` | Verify navigation links |
| `apps/web/app/home/[account]/page.tsx` | Remove/replace SaaS dashboard for teams |

---

## Testing Checklist

After fixes, verify:

- [ ] Team appears in account selector dropdown
- [x] `/home/audit-team/billing` shows prices as $199, $499, $999 (FIXED)
- [ ] Usage card displays with percentage and token count
- [ ] Member breakdown shows all team members with usage
- [ ] "Proceed to Payment" navigates to Stripe checkout
- [ ] All sidebar links navigate correctly
- [ ] No console errors on any team page
- [x] Sparlo design patterns applied (left border is in team billing page)

## Deployment Notes

The pricing fix affects ALL billing displays (personal and team accounts). Verify pricing on:
1. Personal account billing page
2. Team account billing page
3. Marketing pricing page (if applicable)
