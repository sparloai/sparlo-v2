import { AdminGuard } from '@kit/admin/components/admin-guard';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody, PageHeader } from '@kit/ui/page';

import { AdminUsageSearch } from './_components/admin-usage-search';

export const metadata = {
  title: 'Token Usage Management',
};

async function AdminUsagePage() {
  return (
    <>
      <PageHeader
        title="Token Usage Management"
        description={<AppBreadcrumbs />}
      />
      <PageBody>
        <AdminUsageSearch />
      </PageBody>
    </>
  );
}

export default AdminGuard(AdminUsagePage);
