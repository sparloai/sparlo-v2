import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { SidebarProvider } from '@kit/ui/shadcn-sidebar';

import { loadRecentReports } from '~/app/_lib/server/recent-reports.loader';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';

// local imports
import { DocsNavHeader } from './_components/docs-nav-header';
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
    <div data-docs-page="true">
      {/* Hide the marketing header and footer for logged-in users */}
      {user && <HideMarketingHeaderStyles />}

      {/* App-style nav header for logged-in users */}
      {user && (
        <DocsNavHeader
          user={user}
          workspace={{ name: null }}
          recentReports={recentReports}
        />
      )}

      <div
        className={`container overflow-y-hidden ${user ? 'h-[calc(100vh-56px)] pt-14' : 'h-[calc(100vh-56px)]'}`}
      >
        <SidebarProvider
          className="lg:gap-x-6"
          style={{ '--sidebar-width': '17em' } as React.CSSProperties}
        >
          <HideFooterStyles />

          <DocsNavigation pages={tree} hasTopPadding={false} />

          {children}
        </SidebarProvider>
      </div>
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

function HideMarketingHeaderStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          /* Hide the marketing header on docs pages when user is logged in */
          body:has([data-docs-page="true"]) > div > header {
            display: none !important;
          }
        `,
      }}
    />
  );
}

export default DocsLayout;
