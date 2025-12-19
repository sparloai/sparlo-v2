import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { LandingHeader } from '~/(marketing)/_components/landing-header';
import { withI18n } from '~/lib/i18n/with-i18n';

async function SiteLayout(props: React.PropsWithChildren) {
  const client = getSupabaseServerClient();
  const user = await requireUser(client, { verifyMfa: false });

  return (
    <div
      className={'flex min-h-[100vh] flex-col'}
      style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
    >
      <LandingHeader user={user.data} />

      {/* Add padding-top to account for fixed nav */}
      <div className="pt-14">{props.children}</div>
    </div>
  );
}

export default withI18n(SiteLayout);
