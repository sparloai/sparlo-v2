import 'server-only';

import billingConfig from '~/config/billing.config';
import { PLAN_TOKEN_LIMITS } from '~/lib/usage/constants';

/**
 * Maps Stripe price IDs to plan IDs using billing config as single source of truth.
 * This avoids hardcoding price IDs in multiple places.
 */
function buildPriceToLimitMap(): Map<string, number> {
  const priceToLimit = new Map<string, number>();

  for (const product of billingConfig.products) {
    for (const plan of product.plans) {
      // Use plan.id (e.g., 'starter-monthly') to look up token limit
      const limit = PLAN_TOKEN_LIMITS[plan.id];

      if (!limit) continue;

      for (const lineItem of plan.lineItems) {
        priceToLimit.set(lineItem.id, limit);
      }
    }
  }

  return priceToLimit;
}

// Build once at module load
const PRICE_TO_LIMIT_MAP = buildPriceToLimitMap();

/**
 * Get token limit for a Stripe price ID.
 * Throws if price ID is unknown (fail-fast instead of silent fallback).
 */
export function getPlanTokenLimit(priceId: string): number {
  const limit = PRICE_TO_LIMIT_MAP.get(priceId);

  if (!limit) {
    throw new Error(
      `Unknown price ID: ${priceId}. ` +
        `Ensure billing.config.ts has this price ID and PLAN_TOKEN_LIMITS has the plan.`,
    );
  }

  return limit;
}

/**
 * Get plan ID (starter-monthly, pro-yearly, etc.) from price ID.
 */
export function getPlanIdFromPriceId(priceId: string): string | null {
  for (const product of billingConfig.products) {
    for (const plan of product.plans) {
      for (const lineItem of plan.lineItems) {
        if (lineItem.id === priceId) {
          return plan.id;
        }
      }
    }
  }
  return null;
}

/**
 * Get product ID (starter, pro, enterprise) from price ID.
 */
export function getProductIdFromPriceId(priceId: string): string | null {
  for (const product of billingConfig.products) {
    for (const plan of product.plans) {
      for (const lineItem of plan.lineItems) {
        if (lineItem.id === priceId) {
          return product.id;
        }
      }
    }
  }
  return null;
}
