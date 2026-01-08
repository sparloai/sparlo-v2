# Fix: Logout Button Not Working (CRITICAL - Launch Blocker)

## Problem Statement

Clicking the logout button does nothing. This bug appeared in the past 24 hours and is blocking tomorrow's launch.

## Root Cause Analysis

### Primary Cause (Already Fixed - Pending Deploy)
**Hydration mismatch** in `AppLink` component broke React event handlers:
- `AppLink` called `getAppPath()` during render
- `getAppPath()` accessed `window.location.hostname`
- Server returned `undefined`, client returned actual hostname
- React detected mismatch → destroyed event handlers → logout button stopped working

**Fix commits:**
- `90a7f0ee` - Made `useAppPath` hydration-safe with useState + useEffect
- `a285e4b2` - Added fallback redirect after signOut

### Secondary Cause (Needs Fix)
**Client-side signOut cannot delete HTTPOnly cookies**:
- Browser client calls `client.auth.signOut()`
- Supabase invalidates token server-side ✅
- Browser tries to delete cookies via JavaScript ❌
- HTTPOnly cookies remain → user appears still logged in

## Acceptance Criteria

- [ ] Logout button click fires the handler
- [ ] User is redirected to `/` or `/auth/sign-in` after logout
- [ ] Session cookies are properly cleared
- [ ] User cannot access protected routes after logout
- [ ] Works on production (sparlo.ai)

## Implementation Plan

### Phase 1: Verify Current Fixes Deploy (IMMEDIATE)

The hydration fix and redirect fallback are already committed. Verify deployment completes.

```bash
# Check Railway deployment status
# Should see commits: 90a7f0ee, a285e4b2
```

### Phase 2: Add Server-Side Signout Route (RECOMMENDED)

Create proper server-side logout that can delete HTTPOnly cookies:

#### File: `apps/web/app/auth/signout/route.ts`

```typescript
import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Signout] Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Clear all cached data
  revalidatePath('/', 'layout');

  // Redirect to home
  const redirectUrl = new URL('/', req.url);
  return NextResponse.redirect(redirectUrl, { status: 302 });
}
```

#### Update: `packages/supabase/src/hooks/use-sign-out.ts`

```typescript
import { useMutation } from '@tanstack/react-query';

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      // Call server-side signout route
      const response = await fetch('/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok && !response.redirected) {
        throw new Error('Logout failed');
      }

      // Browser will follow the 302 redirect automatically
      // But if it doesn't (fetch doesn't auto-follow for redirects), force it
      if (response.redirected) {
        window.location.href = response.url;
      } else {
        window.location.href = '/';
      }
    },
  });
}
```

### Phase 3: Fallback - Direct Navigation (QUICK FIX)

If Phase 2 is too risky before launch, use form-based navigation:

#### Update logout button in `nav-sidebar.tsx`:

```typescript
// Instead of onClick handler, use a form that POSTs to the signout route
<form action="/auth/signout" method="POST">
  <button
    type="submit"
    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5..."
  >
    <LogOutIcon className="h-[18px] w-[18px] flex-shrink-0" />
    Log out
  </button>
</form>
```

This bypasses React entirely and uses native browser form submission.

## Testing Checklist

1. [ ] Deploy completes on Railway
2. [ ] Open browser DevTools Console
3. [ ] Navigate to app dashboard
4. [ ] Click logout button
5. [ ] Verify: No hydration errors (#418) in console
6. [ ] Verify: Redirect to `/` or `/auth/sign-in`
7. [ ] Verify: Cannot access `/app` routes after logout
8. [ ] Verify: Refresh page - still logged out

## Risk Assessment

| Approach | Risk | Time | Reliability |
|----------|------|------|-------------|
| Wait for deploy | Low | 5 min | Medium - fixes hydration but cookie issue remains |
| Server route (Phase 2) | Medium | 15 min | High - proper solution |
| Form fallback (Phase 3) | Low | 5 min | High - bypasses React entirely |

## Recommendation

1. **First**: Wait for current deploy to complete and test
2. **If still broken**: Implement Phase 3 (form fallback) - safest for launch
3. **Post-launch**: Implement Phase 2 (server route) for proper fix

## References

- Hydration fix: `apps/web/lib/hooks/use-app-path.ts:53-60`
- Redirect fallback: `packages/supabase/src/hooks/use-sign-out.ts:12-17`
- Logout button: `apps/web/app/app/_components/navigation/nav-sidebar.tsx:164-173`
- React Error #418: https://react.dev/errors/418
- Supabase signOut docs: https://supabase.com/docs/guides/auth/signout
