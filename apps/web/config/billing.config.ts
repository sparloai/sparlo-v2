import { BillingProviderSchema, createBillingSchema } from '@kit/billing';

const provider = BillingProviderSchema.parse(
  process.env.NEXT_PUBLIC_BILLING_PROVIDER,
);

export default createBillingSchema({
  provider,
  products: [
    {
      id: 'core',
      name: 'Core',
      description: 'For individuals and small teams getting started',
      currency: 'USD',
      badge: 'Starter',
      plans: [
        {
          name: 'Core Monthly',
          id: 'core-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_1ShDIuEvKpUSC4D5L44n2jvV',
              name: 'Core',
              cost: 199,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: ['Standard usage', '1 seat', 'Email support'],
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
      features: ['3× usage', '5 team seats', 'Priority support'],
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
      features: ['7× usage', '10 team seats', 'Dedicated support'],
    },
  ],
});
