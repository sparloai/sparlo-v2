'use client';

import Script from 'next/script';

interface StripePricingTableProps {
  userId: string;
  userEmail: string;
}

export function StripePricingTable({
  userId,
  userEmail,
}: StripePricingTableProps) {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  // TODO: Create a Pricing Table in Stripe Dashboard and add the ID here
  // Go to: https://dashboard.stripe.com/pricing-tables
  // Create a new pricing table with your products, then copy the ID
  const pricingTableId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID;

  if (!pricingTableId) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <h3 className="mb-2 font-semibold">
          Stripe Pricing Table Not Configured
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          To use Stripe's embedded pricing table:
        </p>
        <ol className="text-muted-foreground mx-auto max-w-md space-y-2 text-left text-sm">
          <li>
            1. Go to{' '}
            <a
              href="https://dashboard.stripe.com/pricing-tables"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Stripe Dashboard → Pricing Tables
            </a>
          </li>
          <li>
            2. Create a new pricing table with your Standard, Pro, and Max
            products
          </li>
          <li>
            3. Copy the pricing table ID (starts with{' '}
            <code className="bg-muted rounded px-1">prctbl_</code>)
          </li>
          <li>
            4. Add to your <code className="bg-muted rounded px-1">.env</code>:
            <pre className="bg-muted mt-2 rounded p-2 text-xs">
              NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID=prctbl_xxxxx
            </pre>
          </li>
        </ol>
      </div>
    );
  }

  return (
    <>
      <Script
        async
        src="https://js.stripe.com/v3/pricing-table.js"
        strategy="lazyOnload"
      />
      {/* @ts-expect-error - Stripe web component */}
      <stripe-pricing-table
        pricing-table-id={pricingTableId}
        publishable-key={publishableKey}
        client-reference-id={userId}
        customer-email={userEmail}
      />
    </>
  );
}
