import { BillingProviderSchema, createBillingSchema } from '@kit/billing';

const provider = BillingProviderSchema.parse(
  process.env.NEXT_PUBLIC_BILLING_PROVIDER,
);

export default createBillingSchema({
  provider,
  products: [
    {
      id: 'standard',
      name: 'Standard',
      description: 'For individuals and small teams getting started',
      currency: 'USD',
      badge: 'Starter',
      plans: [
        {
          name: 'Standard Monthly',
          id: 'standard-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_1ShDIuEvKpUSC4D5L44n2jvV',
              name: 'Standard',
              cost: 299,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: [
        '~15 reports per month',
        '2.7M tokens included',
        'Email support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For growing teams with higher demands',
      currency: 'USD',
      badge: 'Popular',
      highlighted: true,
      plans: [
        {
          name: 'Pro Monthly',
          id: 'pro-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_1ShDJwEvKpUSC4D5fKIiTcNf',
              name: 'Pro',
              cost: 499,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: [
        '~30 reports per month',
        '5.4M tokens included',
        'Priority support',
      ],
    },
    {
      id: 'max',
      name: 'Max',
      description: 'For organizations requiring maximum capacity',
      currency: 'USD',
      plans: [
        {
          name: 'Max Monthly',
          id: 'max-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_1ShDLCEvKpUSC4D5DVyqvaJS',
              name: 'Max',
              cost: 999,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: [
        '~75 reports per month',
        '13.5M tokens included',
        'Dedicated support',
      ],
    },
  ],
});
