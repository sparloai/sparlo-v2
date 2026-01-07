import { z } from 'zod';

// Alphanumeric with hyphens, matching typical plan/product ID formats
const idPattern = /^[a-z0-9-]+$/i;

export const PersonalAccountCheckoutSchema = z.object({
  planId: z
    .string()
    .min(1, 'Plan ID is required')
    .max(64, 'Plan ID too long')
    .regex(idPattern, 'Invalid plan ID format'),
  productId: z
    .string()
    .min(1, 'Product ID is required')
    .max(64, 'Product ID too long')
    .regex(idPattern, 'Invalid product ID format'),
});
