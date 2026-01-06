import { JWTUserData } from '@kit/supabase/types';
import { Header } from '@kit/ui/marketing';

import { AppLogo } from '~/components/app-logo';

import { SiteHeaderAccountSection } from './site-header-account-section';

export function SiteHeader(props: {
  user?: JWTUserData | null;
  hasTeams?: boolean;
}) {
  return (
    <Header
      logo={<AppLogo />}
      navigation={null}
      actions={
        <SiteHeaderAccountSection
          user={props.user ?? null}
          hasTeams={props.hasTeams}
        />
      }
    />
  );
}
