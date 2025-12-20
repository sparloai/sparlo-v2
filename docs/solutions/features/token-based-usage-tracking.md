# Token-Based Usage Tracking

**Solution Documentation**

Token-based usage tracking for per-account API usage limits with subscription alignment.

## Architecture

```
Inngest Function → increment_usage RPC → usage_periods table
                         ↓
               TOCTOU Protection
               (reserve/finalize/release)
```

## Key Files

- `/apps/web/lib/usage/constants.ts` - Usage tier definitions
- `/apps/web/lib/usage/schemas.ts` - Zod schemas
- `/apps/web/app/home/(user)/_lib/server/usage.service.ts` - Server service
- `/apps/web/supabase/migrations/20251219*.sql` - Database migrations

## Security Features

1. Authorization checks in SECURITY DEFINER functions
2. CHECK constraints for non-negative values
3. TOCTOU protection via reserve/finalize/release pattern
4. ON DELETE RESTRICT for billing data

## Usage Pattern

```typescript
await supabase.rpc('increment_usage', {
  p_account_id: accountId,
  p_tokens: totalTokens,
  p_is_report: true,
  p_is_chat: false,
});
```

**Version**: 1.0 | **Updated**: 2025-12-19
