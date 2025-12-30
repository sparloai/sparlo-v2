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
      description: 'For individuals and small teams.',
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
              cost: 19900,
              type: 'flat' as const,
            },
          ],
        },
        {
          name: 'Core Annual',
          id: 'core-annual',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'price_core_annual',
              name: 'Core',
              cost: 199000,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: ['Standard usage', '1 seat'],
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For growing teams.',
      currency: 'USD',
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
              cost: 49900,
              type: 'flat' as const,
            },
          ],
        },
        {
          name: 'Pro Annual',
          id: 'pro-annual',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'price_pro_annual',
              name: 'Pro',
              cost: 499000,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: ['3× usage', '5 team seats'],
    },
    {
      id: 'max',
      name: 'Max',
      description: 'For large orgs.',
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
              cost: 99900,
              type: 'flat' as const,
            },
          ],
        },
        {
          name: 'Max Annual',
          id: 'max-annual',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'price_max_annual',
              name: 'Max',
              cost: 999000,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: ['7× usage', '10 team seats'],
    },
  ],
});
