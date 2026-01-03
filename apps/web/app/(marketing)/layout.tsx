import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { Footer } from '~/(marketing)/_components/footer';
import { Navigation } from '~/(marketing)/_components/navigation';
import { withI18n } from '~/lib/i18n/with-i18n';

async function SiteLayout(props: React.PropsWithChildren) {
  const client = getSupabaseServerClient();
  const user = await requireUser(client, { verifyMfa: false });

  return (
    <div className="font-heading flex min-h-[100vh] flex-col">
      <Navigation user={user.data} variant="dark" />

      {/* No padding-top - hero is full viewport with nav overlay */}
      <main className="flex-1">{props.children}</main>

      <Footer />
    </div>
  );
}

export default withI18n(SiteLayout);
