# Fix: Reset Password AuthSessionMissingError

**Type:** Bug Fix (Critical)
**Date:** 2026-01-08

## Problem Statement

Users experience `AuthSessionMissingError: Auth session missing!` when submitting a new password on the reset password page. After refreshing the page, they're magically logged in and can proceed.

### Error Details
```
Uncaught (in promise) AuthSessionMissingError: Auth session missing!
    at _useSession
    at async _updateUser
```

### User-Facing Error
`errors.resetPasswordError` - "Sorry, something went wrong"

## Root Cause Analysis

### The Authentication Flow

```
1. User clicks reset link in email
   └─> /auth/confirm?token_hash=...&type=recovery&next=https://sparlo.ai/update-password

2. /auth/confirm/route.ts handles request
   └─> verifyTokenHash() → client.auth.verifyOtp() ← SERVER-SIDE SESSION ESTABLISHED

3. redirect('/update-password')
   └─> Server sends cookies with session in response

4. /update-password/page.tsx loads
   └─> requireUser() runs SERVER-SIDE ✓ (has session via cookies)
   └─> Renders UpdatePasswordForm (client component)

5. User submits new password
   └─> useUpdateUser() calls client.auth.updateUser() ← CLIENT-SIDE
   └─> ❌ CLIENT-SIDE SUPABASE CLIENT DOESN'T HAVE SESSION YET!
```

### The Bug

The issue is a **race condition** between:
- Server-side session establishment via `verifyOtp()`
- Client-side Supabase auth state hydration

When `verifyOtp()` succeeds server-side, it sets session cookies in the response. The client-side Supabase client needs to:
1. Read these cookies
2. Initialize its auth state asynchronously
3. Be ready for API calls

The `UpdatePasswordForm` doesn't wait for this client-side session initialization before allowing the user to submit.

### Why Refresh Fixes It

On page refresh, the client-side Supabase client properly initializes from the persisted session cookies, making the session available.

## Solution

Create a **server action** for password updates instead of using the client-side `updateUser()` call. The server already has the established session, making this approach more reliable.

## Implementation Plan

### 1. Create Server Action for Password Update

**File:** `packages/features/auth/src/server/update-password.action.ts`

```typescript
'use server';

import { z } from 'zod';
import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

const UpdatePasswordSchema = z.object({
  password: z.string().min(8),
});

export const updatePasswordAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();

    const { error } = await client.auth.updateUser({
      password: data.password,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  },
  {
    schema: UpdatePasswordSchema,
  },
);
```

### 2. Update UpdatePasswordForm to Use Server Action

**File:** `packages/features/auth/src/components/update-password-form.tsx`

Replace the client-side `useUpdateUser()` hook with the server action:

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
// ... other imports

import { updatePasswordAction } from '../server/update-password.action';

export function UpdatePasswordForm(params: {
  redirectTo: string;
  heading?: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<{ code: string } | null>(null);
  const router = useRouter();
  const { t } = useTranslation();

  // ... form setup

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setError(null);

    startTransition(async () => {
      try {
        await updatePasswordAction({ password });
        router.replace(params.redirectTo);
        toast.success(t('account:updatePasswordSuccessMessage'));
      } catch (err) {
        if (isRedirectError(err)) {
          throw err;
        }
        setError({ code: (err as Error).message || 'resetPasswordError' });
      }
    });
  });

  // ... rest of component
}
```

### 3. Export Server Action from Package

**File:** `packages/features/auth/src/server/index.ts`

Add export:
```typescript
export { updatePasswordAction } from './update-password.action';
```

### 4. Update Package Exports (if needed)

**File:** `packages/features/auth/package.json`

Ensure server exports are configured:
```json
{
  "exports": {
    "./server": "./src/server/index.ts"
  }
}
```

## Files to Modify

| File | Action |
|------|--------|
| `packages/features/auth/src/server/update-password.action.ts` | **CREATE** - New server action |
| `packages/features/auth/src/components/update-password-form.tsx` | **MODIFY** - Use server action instead of client hook |
| `packages/features/auth/src/server/index.ts` | **MODIFY** - Export new action |

## Acceptance Criteria

- [ ] Password reset flow completes without `AuthSessionMissingError`
- [ ] No page refresh required after submitting new password
- [ ] Proper error handling for invalid passwords
- [ ] Success toast shown after password update
- [ ] User redirected to appropriate page after success
- [ ] Works on first attempt without refresh

## Testing Plan

1. **Manual Testing:**
   - Request password reset email
   - Click reset link in email
   - Submit new password immediately (no refresh)
   - Verify success message appears
   - Verify redirect works

2. **Edge Cases:**
   - Expired token handling
   - Invalid password format
   - Network errors during update

## References

- Auth callback route: `apps/web/app/auth/confirm/route.ts`
- Auth callback service: `packages/supabase/src/auth-callback.service.ts:34-113`
- Update password page: `apps/web/app/update-password/page.tsx`
- Current update form: `packages/features/auth/src/components/update-password-form.tsx`
- Update user hook: `packages/supabase/src/hooks/use-update-user-mutation.ts`
- Supabase docs: Password reset requires session established before `updateUser()` call
