import { use } from 'react';

import { UserWorkspaceContextProvider } from '@kit/accounts/components';

import { withI18n } from '~/lib/i18n/with-i18n';

import { NavHeader } from './_components/navigation/nav-header';
import { loadUserWorkspace } from './_lib/server/load-user-workspace';

function UserHomeLayout({ children }: React.PropsWithChildren) {
  const workspace = use(loadUserWorkspace());

  return (
    <UserWorkspaceContextProvider value={workspace}>
      <div className="flex min-h-screen flex-col bg-[--surface-base]">
        <NavHeader />
        <main className="flex-1">{children}</main>
      </div>
    </UserWorkspaceContextProvider>
  );
}

export default withI18n(UserHomeLayout);
