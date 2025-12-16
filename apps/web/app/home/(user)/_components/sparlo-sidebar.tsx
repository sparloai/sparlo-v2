'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@kit/ui/shadcn-sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';

import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';
import featuresFlagConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';
import { UserNotifications } from '~/home/(user)/_components/user-notifications';

import type { UserWorkspace } from '../_lib/server/load-user-workspace';
import { useSparloContext } from '../_lib/sparlo-context';
import { ConversationHistory } from './conversation-history';
import { HomeAccountSelector } from './home-account-selector';
import { UsageIndicator } from './usage-indicator';

interface SparloSidebarProps {
  workspace: UserWorkspace;
}

export function SparloSidebar({ workspace }: SparloSidebarProps) {
  const { user, accounts, reportLimit, reportsUsed } = workspace;
  const {
    conversations,
    activeConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    archiveConversation,
    startNewConversation,
  } = useSparloContext();
  const { toggleSidebar, open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center">
        <div className="flex items-center justify-between gap-x-3">
          {featuresFlagConfig.enableTeamAccounts ? (
            <HomeAccountSelector userId={user.id} accounts={accounts} />
          ) : (
            <div className="flex items-center gap-2 px-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L22 12L12 22L2 12L12 2Z"
                    fill="currentColor"
                    className="text-primary-foreground"
                  />
                </svg>
              </div>
              <span className="font-semibold group-data-[minimized=true]/sidebar:hidden">
                Sparlo
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 group-data-[minimized=true]/sidebar:hidden">
            <UserNotifications userId={user.id} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="h-8 w-8"
                  >
                    {open ? (
                      <PanelLeftClose className="h-4 w-4" />
                    ) : (
                      <PanelLeftOpen className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle sidebar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{open ? 'Hide sidebar' : 'Show sidebar'} (⌘B)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="group-data-[minimized=true]/sidebar:hidden">
        <ConversationHistory
          conversations={conversations}
          activeConversationId={activeConversation?.id ?? null}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          onRenameConversation={renameConversation}
          onArchiveConversation={archiveConversation}
          onNewConversation={startNewConversation}
        />
      </SidebarContent>

      <SidebarFooter className="gap-3">
        <UsageIndicator
          used={reportsUsed}
          limit={reportLimit}
          billingPath={pathsConfig.app.personalAccountBilling}
        />
        <ProfileAccountDropdownContainer
          user={user}
          account={workspace.workspace}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
