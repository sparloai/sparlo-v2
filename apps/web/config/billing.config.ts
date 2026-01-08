import { BillingProviderSchema, createBillingSchema } from '@kit/billing';

const provider = BillingProviderSchema.parse(
  process.env.NEXT_PUBLIC_BILLING_PROVIDER,
);

export default createBillingSchema({
  provider,
  products: [
    {
      id: 'lite',
      name: 'Lite',
      description: 'For individuals getting started',
      currency: 'USD',
      plans: [
        {
          name: 'Lite Monthly',
          id: 'lite-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_1SnILKEe4gCtTPhv1Hv6KAhV',
              name: 'Lite',
              cost: 9900,
              type: 'flat' as const,
            },
          ],
        },
        {
          name: 'Lite Annual',
          id: 'lite-annual',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'price_1SnIM1Ee4gCtTPhvm0oISMPo',
              name: 'Lite',
              cost: 99000,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: [
        '~3 problems/month',
        '1 seat',
        'Email support',
        'Basic analytics',
      ],
    },
    {
      id: 'core',
      name: 'Core',
      description: 'For growing research needs',
      currency: 'USD',
      plans: [
        {
          name: 'Core Monthly',
          id: 'core-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_1SlTJFEe4gCtTPhv72apc9yq',
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
              id: 'price_1SlTQcEe4gCtTPhvAyhzMLGE',
              name: 'Core',
              cost: 199000,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: [
        '~10 problems/month',
        '1 seat',
        'Priority email support',
        'Advanced analytics',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For teams and power users',
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
              id: 'price_1SlTLUEe4gCtTPhvwy9m7oKd',
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
              id: 'price_1SlTQ3Ee4gCtTPhvjZz8TuaA',
              name: 'Pro',
              cost: 499000,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: [
        '~25 problems/month',
        '5 team seats',
        'Priority support',
        'Team collaboration',
      ],
    },
    {
      id: 'max',
      name: 'Max',
      description: 'For organizations at scale',
      currency: 'USD',
      plans: [
        {
          name: 'Max Monthly',
          id: 'max-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_1SlTMmEe4gCtTPhv4Uj5295n',
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
              id: 'price_1SlTPGEe4gCtTPhvv5of2HDt',
              name: 'Max',
              cost: 999000,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: [
        '~50 problems/month',
        '10 team seats',
        'Dedicated support',
        'API access',
        'SSO',
      ],
    },
  ],
});
