import 'server-only';

import billingConfig from '~/config/billing.config';
import { PLAN_TOKEN_LIMITS } from '~/lib/usage/constants';

// Report limits per product (single source of truth)
const PRODUCT_REPORT_LIMITS: Record<string, number> = {
  lite: 3,
  core: 10,
  pro: 25,
  max: 50,
};

// Products that include Teams access
const PRODUCTS_WITH_TEAMS_ACCESS = new Set(['pro', 'max']);

/**
 * Build all lookup maps once at module load from billing config.
 * This eliminates repeated triple-loop iterations on every function call.
 */
function buildLookupMaps() {
  const priceToTokenLimit = new Map<string, number>();
  const priceToReportLimit = new Map<string, number>();
  const priceToProductId = new Map<string, string>();
  const priceToPlanId = new Map<string, string>();

  for (const product of billingConfig.products) {
    const reportLimit = PRODUCT_REPORT_LIMITS[product.id] ?? 3;

    for (const plan of product.plans) {
      const tokenLimit = PLAN_TOKEN_LIMITS[plan.id];

      for (const lineItem of plan.lineItems) {
        priceToProductId.set(lineItem.id, product.id);
        priceToPlanId.set(lineItem.id, plan.id);
        priceToReportLimit.set(lineItem.id, reportLimit);

        if (tokenLimit) {
          priceToTokenLimit.set(lineItem.id, tokenLimit);
        }
      }
    }
  }

  return {
    priceToTokenLimit,
    priceToReportLimit,
    priceToProductId,
    priceToPlanId,
  };
}

// Build all maps once at module load
const {
  priceToTokenLimit: PRICE_TO_TOKEN_LIMIT_MAP,
  priceToReportLimit: PRICE_TO_REPORT_LIMIT_MAP,
  priceToProductId: PRICE_TO_PRODUCT_MAP,
  priceToPlanId: PRICE_TO_PLAN_MAP,
} = buildLookupMaps();

/**
 * Get token limit for a Stripe price ID.
 * Throws if price ID is unknown (fail-fast instead of silent fallback).
 */
export function getPlanTokenLimit(priceId: string): number {
  const limit = PRICE_TO_TOKEN_LIMIT_MAP.get(priceId);

  if (!limit) {
    throw new Error(
      `Unknown price ID: ${priceId}. ` +
        `Ensure billing.config.ts has this price ID and PLAN_TOKEN_LIMITS has the plan.`,
    );
  }

  return limit;
}

/**
 * Get report limit for a Stripe price ID.
 * Returns default limit (3) if price ID is unknown.
 */
export function getReportLimit(priceId: string): number {
  return PRICE_TO_REPORT_LIMIT_MAP.get(priceId) ?? 3;
}

/**
 * Get plan ID (lite-monthly, pro-yearly, etc.) from price ID.
 * O(1) lookup using prebuilt map.
 */
export function getPlanIdFromPriceId(priceId: string): string | null {
  return PRICE_TO_PLAN_MAP.get(priceId) ?? null;
}

/**
 * Get product ID (lite, core, pro, max) from price ID.
 * O(1) lookup using prebuilt map.
 */
export function getProductIdFromPriceId(priceId: string): string | null {
  return PRICE_TO_PRODUCT_MAP.get(priceId) ?? null;
}

/**
 * Check if a price ID grants Teams access.
 * Pro and Max plans include Teams access.
 * O(1) lookup using prebuilt map.
 */
export function checkTeamsAccess(priceId: string): boolean {
  const productId = PRICE_TO_PRODUCT_MAP.get(priceId);
  return productId ? PRODUCTS_WITH_TEAMS_ACCESS.has(productId) : false;
}
