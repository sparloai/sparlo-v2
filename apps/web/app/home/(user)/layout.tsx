import { use } from 'react';

import { UserWorkspaceContextProvider } from '@kit/accounts/components';

import { withI18n } from '~/lib/i18n/with-i18n';

import { MainContent } from './_components/navigation/main-content';
import { NavHeader } from './_components/navigation/nav-header';
import { AppWorkspaceProvider } from './_lib/app-workspace-context';
import { loadUserWorkspace } from './_lib/server/load-user-workspace';
import { loadRecentReports } from './_lib/server/recent-reports.loader';
import { loadUserUsage } from './_lib/server/usage.loader';
import { SidebarProvider } from './_lib/sidebar-context';

function UserHomeLayout({ children }: React.PropsWithChildren) {
  const workspace = use(loadUserWorkspace());
  // User's personal account ID is the same as their user ID
  const usage = use(loadUserUsage(workspace.user.id));
  const recentReports = use(loadRecentReports(workspace.user.id));

  return (
    <UserWorkspaceContextProvider value={workspace}>
      <AppWorkspaceProvider value={workspace}>
        <SidebarProvider>
          <div className="flex min-h-screen flex-col bg-[--surface-base]">
            <NavHeader
              usage={usage}
              recentReports={recentReports}
              user={workspace.user}
              workspace={workspace.workspace}
            />
            <MainContent>{children}</MainContent>
          </div>
        </SidebarProvider>
      </AppWorkspaceProvider>
    </UserWorkspaceContextProvider>
  );
}

export default withI18n(UserHomeLayout);
