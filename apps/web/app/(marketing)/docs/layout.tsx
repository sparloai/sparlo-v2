import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { SidebarProvider } from '@kit/ui/shadcn-sidebar';

import { loadRecentReports } from '~/home/(user)/_lib/server/recent-reports.loader';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';

// local imports
import { DocsAppSidebar } from './_components/docs-app-sidebar';
import { DocsNavigation } from './_components/docs-navigation';
import { getDocs } from './_lib/server/docs.loader';
import { buildDocumentationTree } from './_lib/utils';

async function DocsLayout({ children }: React.PropsWithChildren) {
  const { resolvedLanguage } = await createI18nServerInstance();
  const docs = await getDocs(resolvedLanguage);
  const tree = buildDocumentationTree(docs);

  // Get user and recent reports for sidebar
  const client = getSupabaseServerClient();
  const { data: user } = await requireUser(client, { verifyMfa: false });
  const recentReports = user ? await loadRecentReports(user.id) : [];

  return (
    <div
      className={'container h-[calc(100vh-56px)] overflow-y-hidden'}
      data-docs-page="true"
    >
      {/* Hide the PersonalAccountDropdown on docs pages for logged-in users */}
      {user && <HideAccountDropdownStyles />}

      {/* App sidebar toggle - positioned in nav header area (left side) */}
      {user && (
        <div className="fixed top-[14px] left-3 z-[60] md:left-5">
          <DocsAppSidebar
            user={user}
            workspace={{ name: null }}
            recentReports={recentReports}
          />
        </div>
      )}

      <SidebarProvider
        className="lg:gap-x-6"
        style={{ '--sidebar-width': '17em' } as React.CSSProperties}
      >
        <HideFooterStyles />

        <DocsNavigation pages={tree} />

        {children}
      </SidebarProvider>
    </div>
  );
}

function HideFooterStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          .site-footer {
            display: none;
          }
        `,
      }}
    />
  );
}

function HideAccountDropdownStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          /* Hide the PersonalAccountDropdown on docs pages when user is logged in */
          body:has([data-docs-page="true"]) header nav > div.hidden.md\\:flex {
            visibility: hidden;
          }
        `,
      }}
    />
  );
}

export default DocsLayout;
