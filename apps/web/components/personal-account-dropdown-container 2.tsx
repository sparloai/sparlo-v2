'use client';

import { PersonalAccountDropdown } from '@kit/accounts/personal-account-dropdown';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { useUser } from '@kit/supabase/hooks/use-user';
import { JWTUserData } from '@kit/supabase/types';

import featuresFlagConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

export function ProfileAccountDropdownContainer(props: {
  user?: JWTUserData | null;
  showProfileName?: boolean;
  /** Show dashboard link (for marketing/landing pages) */
  showDashboardLink?: boolean;
  /** Show teams link (for users with team access) */
  showTeamsLink?: boolean;

  account?: {
    id: string | null;
    name: string | null;
    picture_url: string | null;
  };
}) {
  const signOut = useSignOut();
  const user = useUser(props.user);
  const userData = user.data;

  if (!userData) {
    return null;
  }

  const paths = {
    home: pathsConfig.app.home,
    dashboard: props.showDashboardLink ? pathsConfig.app.home : undefined,
    settings: pathsConfig.app.personalAccountSettings,
    billing: pathsConfig.app.personalAccountBilling,
    teams: props.showTeamsLink
      ? pathsConfig.app.personalAccountTeams
      : undefined,
    help: '/app/help',
  };

  const features = {
    enableBilling: featuresFlagConfig.enablePersonalAccountBilling,
    enableTeams: props.showTeamsLink,
  };

  return (
    <PersonalAccountDropdown
      className={'w-full'}
      paths={paths}
      features={features}
      user={userData}
      account={props.account}
      signOutRequested={() => signOut.mutateAsync()}
      showProfileName={props.showProfileName}
    />
  );
}
