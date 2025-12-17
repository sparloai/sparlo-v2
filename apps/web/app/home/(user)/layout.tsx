import { use } from 'react';

import Link from 'next/link';

import { FileText, Home, Settings, Sparkles } from 'lucide-react';

import { UserWorkspaceContextProvider } from '@kit/accounts/components';
import { cn } from '@kit/ui/utils';

import { AppLogo } from '~/components/app-logo';
import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';
import { withI18n } from '~/lib/i18n/with-i18n';

import { loadUserWorkspace } from './_lib/server/load-user-workspace';

function UserHomeLayout({ children }: React.PropsWithChildren) {
  const workspace = use(loadUserWorkspace());

  return (
    <UserWorkspaceContextProvider value={workspace}>
      <div className="flex min-h-screen flex-col bg-[#FAFAFA] dark:bg-neutral-950">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link href="/home" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                Sparlo
              </span>
            </Link>

            {/* Nav */}
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink href="/home" icon={Home}>
                Dashboard
              </NavLink>
              <NavLink href="/home/reports/new" icon={FileText}>
                New Report
              </NavLink>
              <NavLink href="/home/settings" icon={Settings}>
                Settings
              </NavLink>
            </nav>

            {/* Profile */}
            <ProfileAccountDropdownContainer
              user={workspace.user}
              account={workspace.workspace}
            />
          </div>
        </header>

        {/* Mobile Nav */}
        <nav className="sticky top-14 z-40 flex items-center gap-1 overflow-x-auto border-b border-gray-200 bg-white px-4 py-2 sm:hidden dark:border-neutral-800 dark:bg-neutral-900">
          <MobileNavLink href="/home" icon={Home}>
            Dashboard
          </MobileNavLink>
          <MobileNavLink href="/home/reports/new" icon={FileText}>
            New
          </MobileNavLink>
          <MobileNavLink href="/home/settings" icon={Settings}>
            Settings
          </MobileNavLink>
        </nav>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </UserWorkspaceContextProvider>
  );
}

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-white"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-gray-700 dark:bg-neutral-800 dark:text-gray-300"
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </Link>
  );
}

export default withI18n(UserHomeLayout);
