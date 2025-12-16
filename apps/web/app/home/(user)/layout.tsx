import { use } from 'react';

import { cookies } from 'next/headers';

import { z } from 'zod';

import { UserWorkspaceContextProvider } from '@kit/accounts/components';
import { Page, PageMobileNavigation, PageNavigation } from '@kit/ui/page';
import { SidebarProvider } from '@kit/ui/shadcn-sidebar';

import { AppLogo } from '~/components/app-logo';
import { personalAccountNavigationConfig } from '~/config/personal-account-navigation.config';
import { withI18n } from '~/lib/i18n/with-i18n';

// home imports
import { HomeMenuNavigation } from './_components/home-menu-navigation';
import { HomeMobileNavigation } from './_components/home-mobile-navigation';
import { SparloSidebar } from './_components/sparlo-sidebar';
import { loadUserWorkspace } from './_lib/server/load-user-workspace';
import { SparloProvider } from './_lib/sparlo-context';
import './design-system.css';

function UserHomeLayout({ children }: React.PropsWithChildren) {
  const state = use(getLayoutState());

  if (state.style === 'sidebar') {
    return <SidebarLayout>{children}</SidebarLayout>;
  }

  return <HeaderLayout>{children}</HeaderLayout>;
}

export default withI18n(UserHomeLayout);

function SidebarLayout({ children }: React.PropsWithChildren) {
  const workspace = use(loadUserWorkspace());
  const state = use(getLayoutState());

  return (
    <UserWorkspaceContextProvider value={workspace}>
      <SparloProvider initialReports={workspace.reports}>
        <SidebarProvider defaultOpen={state.open}>
          <Page style={'sidebar'}>
            <PageNavigation>
              <SparloSidebar workspace={workspace} />
            </PageNavigation>

            <PageMobileNavigation
              className={'flex items-center justify-between'}
            >
              <MobileNavigation workspace={workspace} />
            </PageMobileNavigation>

            {children}
          </Page>
        </SidebarProvider>
      </SparloProvider>
    </UserWorkspaceContextProvider>
  );
}

function HeaderLayout({ children }: React.PropsWithChildren) {
  const workspace = use(loadUserWorkspace());

  return (
    <UserWorkspaceContextProvider value={workspace}>
      <SparloProvider initialReports={workspace.reports}>
        <Page style={'header'}>
          <PageNavigation>
            <HomeMenuNavigation workspace={workspace} />
          </PageNavigation>

          <PageMobileNavigation className={'flex items-center justify-between'}>
            <MobileNavigation workspace={workspace} />
          </PageMobileNavigation>

          {children}
        </Page>
      </SparloProvider>
    </UserWorkspaceContextProvider>
  );
}

function MobileNavigation({
  workspace,
}: {
  workspace: Awaited<ReturnType<typeof loadUserWorkspace>>;
}) {
  return (
    <>
      <AppLogo />

      <HomeMobileNavigation workspace={workspace} />
    </>
  );
}

async function getLayoutState() {
  const cookieStore = await cookies();

  const LayoutStyleSchema = z.enum(['sidebar', 'header', 'custom']);

  const layoutStyleCookie = cookieStore.get('layout-style');
  const sidebarOpenCookie = cookieStore.get('sidebar:state');

  const sidebarOpen = sidebarOpenCookie
    ? sidebarOpenCookie.value !== 'false'
    : !personalAccountNavigationConfig.sidebarCollapsed;

  const parsedStyle = LayoutStyleSchema.safeParse(layoutStyleCookie?.value);

  const style = parsedStyle.success
    ? parsedStyle.data
    : (personalAccountNavigationConfig.style ?? 'sidebar');

  return {
    open: sidebarOpen,
    style,
  };
}
