# ✨ Redesign: Premium Billing Page

**Type:** Enhancement
**Priority:** High (Revenue-critical)
**Created:** 2026-01-08

---

## Overview

Redesign the billing page to feel premium and legitimate—not like a "SaaS template beta test." This is the moment users decide to pay, so the design must inspire confidence and trust.

**New Plan Copy:**
- **Lite:** ~3 Problems/Mo, 1 Seat
- **Core:** ~10 Problems/Mo, 1 Seat
- **Pro:** ~25 Problems/Mo, 5 Seats (Highlighted)
- **Max:** ~50 Problems/Mo, 10 Seats

---

## Problem Statement

The current billing page uses "Aura" components with violet accents that feel generic and template-like. Users making payment decisions need a design that conveys professionalism, trustworthiness, and product maturity.

**Current Issues:**
- Violet accent colors feel like a generic SaaS template
- Layout doesn't follow Sparlo's signature design patterns
- Missing trust signals at the decision moment
- Feature descriptions are vague ("Standard usage", "3× usage")

---

## Proposed Solution

Apply the Sparlo Design System (zinc-900 near-monochrome, left border accents, clean typography) to create a premium, confident billing experience.

### Design Direction

**From:** Violet accents, generic card grid, template feel
**To:** Zinc-900 monochrome, signature left border, typography-driven hierarchy

### Key Design Principles

1. **Near-Monochrome First** - Color is earned, not decorative
2. **Typography-Driven Hierarchy** - Size and weight create structure
3. **Left Border Accent** - Sparlo's signature element on highlighted plan
4. **Purposeful Restraint** - Every element justifies its existence

---

## Technical Approach

### Files to Modify

| File | Change |
|------|--------|
| `apps/web/app/app/billing/_components/sparlo-billing-pricing.tsx` | Complete redesign with Sparlo design system |
| `apps/web/config/billing.config.ts` | Update feature descriptions with new copy |

### Design Tokens (from SPARLO-DESIGN-SYSTEM.md)

```css
/* Colors */
--ink: #09090b (zinc-950)           /* Primary text */
--secondary: #3f3f46 (zinc-700)     /* Secondary text */
--muted: #71717a (zinc-500)         /* Tertiary text */
--surface: #ffffff                   /* Card backgrounds */
--line: #e4e4e7 (zinc-200)          /* Borders */
--accent: #18181b (zinc-900)        /* Primary buttons, left border */

/* Typography */
Page Title: 42px / 400 / -0.02em
Card Title: 28px / 600 / tracking-tight
Body: 18px / 400 / 1.3 / -0.02em
Label: 13px / 600 / 0.06em / uppercase
```

---

## MVP Implementation

### billing-pricing-redesign.tsx

```tsx
'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@kit/ui/utils';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlighted?: boolean;
  seats: number;
  problemsPerMonth: string;
}

const plans: Plan[] = [
  {
    id: 'lite',
    name: 'Lite',
    description: 'For individuals getting started',
    monthlyPrice: 99,
    yearlyPrice: 990,
    problemsPerMonth: '~3',
    seats: 1,
    features: [
      '~3 problems analyzed per month',
      '1 seat',
      'Email support',
      'Basic analytics',
    ],
  },
  {
    id: 'core',
    name: 'Core',
    description: 'For growing research needs',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    problemsPerMonth: '~10',
    seats: 1,
    features: [
      '~10 problems analyzed per month',
      '1 seat',
      'Priority email support',
      'Advanced analytics',
      'Export reports',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For teams and power users',
    monthlyPrice: 499,
    yearlyPrice: 4990,
    problemsPerMonth: '~25',
    seats: 5,
    highlighted: true,
    features: [
      '~25 problems analyzed per month',
      '5 team seats',
      'Priority support',
      'Advanced analytics',
      'Custom exports',
      'Team collaboration',
    ],
  },
  {
    id: 'max',
    name: 'Max',
    description: 'For organizations at scale',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    problemsPerMonth: '~50',
    seats: 10,
    features: [
      '~50 problems analyzed per month',
      '10 team seats',
      'Dedicated support',
      'Full analytics suite',
      'API access',
      'Custom integrations',
      'SSO & admin controls',
    ],
  },
];

export function BillingPricing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const isYearly = billingPeriod === 'yearly';

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-8 pt-16 pb-24">
        {/* Page Header */}
        <div className="mb-16 text-center">
          <h1 className="text-[42px] font-normal tracking-[-0.02em] text-zinc-900 mb-4">
            Choose your plan
          </h1>
          <p className="text-[18px] text-zinc-500 max-w-xl mx-auto">
            Start analyzing problems today. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={cn(
              'px-4 py-2 text-[15px] font-medium rounded-md transition-colors',
              !isYearly
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:text-zinc-900'
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={cn(
              'px-4 py-2 text-[15px] font-medium rounded-md transition-colors flex items-center gap-2',
              isYearly
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:text-zinc-900'
            )}
          >
            Yearly
            <span className={cn(
              'text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded',
              isYearly ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'
            )}>
              Save 17%
            </span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const price = isYearly
              ? Math.round(plan.yearlyPrice / 12)
              : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-xl border bg-white p-8 transition-all',
                  plan.highlighted
                    ? 'border-l-4 border-zinc-900 border-t border-r border-b border-t-zinc-200 border-r-zinc-200 border-b-zinc-200 shadow-lg ring-1 ring-zinc-900/5'
                    : 'border-zinc-200 hover:border-zinc-300 hover:shadow-sm'
                )}
              >
                {/* Recommended Badge */}
                {plan.highlighted && (
                  <div className="absolute -top-3 left-6">
                    <span className="bg-zinc-900 text-white text-[11px] font-semibold tracking-[0.06em] uppercase px-3 py-1 rounded">
                      Recommended
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-[13px] font-semibold tracking-[0.06em] uppercase text-zinc-500 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-[15px] text-zinc-600 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[40px] font-semibold tracking-tight text-zinc-900">
                      ${price}
                    </span>
                    <span className="text-[15px] text-zinc-500">/mo</span>
                  </div>
                  {isYearly && (
                    <p className="text-[13px] text-zinc-400 mt-1">
                      Billed ${plan.yearlyPrice.toLocaleString()}/year
                    </p>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="flex gap-4 mb-6 pb-6 border-b border-zinc-100">
                  <div>
                    <span className="text-[24px] font-semibold text-zinc-900">
                      {plan.problemsPerMonth}
                    </span>
                    <p className="text-[13px] text-zinc-500">problems/mo</p>
                  </div>
                  <div>
                    <span className="text-[24px] font-semibold text-zinc-900">
                      {plan.seats}
                    </span>
                    <p className="text-[13px] text-zinc-500">
                      {plan.seats === 1 ? 'seat' : 'seats'}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                      <span className="text-[15px] text-zinc-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  className={cn(
                    'w-full py-3 px-4 text-[15px] font-medium rounded-lg transition-colors',
                    plan.highlighted
                      ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                      : 'border border-zinc-300 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900'
                  )}
                >
                  Get started
                </button>
              </div>
            );
          })}
        </div>

        {/* Enterprise CTA */}
        <div className="mt-16 text-center">
          <p className="text-[15px] text-zinc-500">
            Need more?{' '}
            <a href="/contact" className="text-zinc-900 font-medium hover:underline">
              Contact us for enterprise pricing
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

### billing.config.ts Updates

```typescript
// Update feature descriptions for clarity
features: [
  '~3 problems analyzed per month',
  '1 seat included',
  'Email support',
  'Basic analytics dashboard',
],
```

---

## Acceptance Criteria

- [ ] Page uses Sparlo design system (zinc-900 primary, no violet)
- [ ] Pro plan has signature left border accent (4px zinc-900)
- [ ] "Recommended" badge on Pro plan
- [ ] Monthly/yearly toggle with 17% savings indicator
- [ ] Clear problem/seat metrics prominently displayed
- [ ] Typography follows design system (42px title, 13px labels)
- [ ] Mobile responsive (stacked cards on mobile)
- [ ] Stripe checkout integration maintained
- [ ] Page feels premium, not template-like

---

## Design Specifications

### Card Layout

```
┌────────────────────────────────────────────────────────────────┐
│  [Lite]        [Core]        [Pro ▌]       [Max]               │
│                              ▲                                  │
│                              │ 4px left border (zinc-900)       │
│                              │ "Recommended" badge              │
└────────────────────────────────────────────────────────────────┘
```

### Visual Hierarchy

1. **Page Title** - 42px, normal weight, centered
2. **Toggle** - Prominent, shows savings
3. **Plan Name** - 13px uppercase label (zinc-500)
4. **Price** - 40px, semibold (zinc-900)
5. **Metrics** - 24px numbers with 13px labels
6. **Features** - 15px with check icons
7. **CTA** - Full width, primary for highlighted plan

### Mobile Layout (< 768px)

- Single column, cards stacked vertically
- Pro card maintains left border accent
- Toggle remains horizontal but more compact
- Font sizes maintained (no reduction)

---

## Success Metrics

- Increased conversion rate on billing page
- Reduced bounce rate at payment decision point
- Positive user feedback on design professionalism
- No increase in support tickets about pricing confusion

---

## References

### Internal
- Design System: `docs/SPARLO-DESIGN-SYSTEM.md`
- Current Billing: `apps/web/app/app/billing/_components/sparlo-billing-pricing.tsx`
- Billing Config: `apps/web/config/billing.config.ts`

### External
- [Linear Pricing](https://linear.app/pricing) - Clean, minimal approach
- [Stripe Pricing](https://stripe.com/pricing) - Trust-inspiring design
- [Notion Pricing](https://notion.so/pricing) - Clear tier differentiation
