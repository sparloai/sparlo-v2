import { redirect } from 'next/navigation';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { Trans } from '@kit/ui/trans';

import { withI18n } from '~/lib/i18n/with-i18n';

import { HomeLayoutPageHeader } from '../_components/home-page-header';
import { loadUserWorkspace } from '../_lib/server/load-user-workspace';

async function TeamsLayout(props: React.PropsWithChildren) {
  const workspace = await loadUserWorkspace();

  // Redirect to billing if not on a paid plan
  if (!workspace.isPaidPlan) {
    redirect('/app/billing');
  }

  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey="common:teams.title" />}
        description={<AppBreadcrumbs />}
      />

      {props.children}
    </>
  );
}

export default withI18n(TeamsLayout);
