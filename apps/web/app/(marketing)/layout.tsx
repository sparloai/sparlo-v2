import type { JWTUserData } from '@kit/supabase/types';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { Footer } from '~/(marketing)/_components/footer';
import { Navigation } from '~/(marketing)/_components/navigation';
import { withI18n } from '~/lib/i18n/with-i18n';

async function SiteLayout(props: React.PropsWithChildren) {
  // Try to get user for nav state, but don't block if auth unavailable
  let userData: JWTUserData | null = null;
  try {
    const client = getSupabaseServerClient();
    const { data } = await client.auth.getUser();
    if (data?.user) {
      // Map Supabase User to JWTUserData shape (Navigation only uses email)
      userData = {
        id: data.user.id,
        email: data.user.email ?? '',
        phone: data.user.phone ?? '',
        is_anonymous: data.user.is_anonymous ?? false,
        aal: 'aal1',
        app_metadata: data.user.app_metadata ?? {},
        user_metadata: data.user.user_metadata ?? {},
        amr: [],
      };
    }
  } catch {
    // Auth unavailable - continue with null user (logged out state)
  }

  return (
    <div className="font-heading flex min-h-[100vh] flex-col">
      <Navigation user={userData} variant="dark" />

      {/* No padding-top - hero is full viewport with nav overlay */}
      <main className="flex-1">{props.children}</main>

      <Footer />
    </div>
  );
}

export default withI18n(SiteLayout);
