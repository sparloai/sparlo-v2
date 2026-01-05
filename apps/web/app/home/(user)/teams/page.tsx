import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { PageBody } from '@kit/ui/page';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { TeamsList } from './_components/teams-list';
import { loadTeamsPageData } from './_lib/server/teams-page.loader';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();

  return {
    title: i18n.t('common:routes.teams'),
  };
};

async function TeamsPage() {
  const client = getSupabaseServerClient();
  const teams = await loadTeamsPageData(client);

  return (
    <PageBody>
      <div className="flex w-full flex-1 flex-col lg:max-w-2xl">
        <TeamsList teams={teams} />
      </div>
    </PageBody>
  );
}

export default withI18n(TeamsPage);
