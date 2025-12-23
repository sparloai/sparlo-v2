import { timingSafeEqual } from 'crypto';
import { z } from 'zod';

import { DatabaseWebhookVerifierService } from './database-webhook-verifier.service';

const webhooksSecret = z
  .string({
    description: `The secret used to verify the webhook signature`,
    required_error: `Provide the variable SUPABASE_DB_WEBHOOK_SECRET. This is used to authenticate the webhook event from Supabase.`,
  })
  .min(1)
  .parse(process.env.SUPABASE_DB_WEBHOOK_SECRET);

export function createDatabaseWebhookVerifierService() {
  return new PostgresDatabaseWebhookVerifierService();
}

class PostgresDatabaseWebhookVerifierService implements DatabaseWebhookVerifierService {
  verifySignatureOrThrow(header: string) {
    const headerBuffer = Buffer.from(header);
    const secretBuffer = Buffer.from(webhooksSecret);

    // Pad to equal length to prevent length timing leak
    const maxLength = Math.max(headerBuffer.length, secretBuffer.length);
    const paddedHeader = Buffer.concat([
      headerBuffer,
      Buffer.alloc(maxLength - headerBuffer.length),
    ]);
    const paddedSecret = Buffer.concat([
      secretBuffer,
      Buffer.alloc(maxLength - secretBuffer.length),
    ]);

    // Both length AND content must match (checked after constant-time comparison)
    const lengthMatch = headerBuffer.length === secretBuffer.length;
    const contentMatch = timingSafeEqual(paddedHeader, paddedSecret);

    if (!lengthMatch || !contentMatch) {
      throw new Error('Invalid signature');
    }

    return Promise.resolve(true);
  }
}
