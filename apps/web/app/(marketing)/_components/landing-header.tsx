'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { PersonalAccountDropdown } from '@kit/accounts/personal-account-dropdown';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { JWTUserData } from '@kit/supabase/types';
import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';

import featuresFlagConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

import { LandingNavHeader } from './landing-nav-header';

const ModeToggle = dynamic(
  () =>
    import('@kit/ui/mode-toggle').then((mod) => ({
      default: mod.ModeToggle,
    })),
  { ssr: false },
);

const MobileModeToggle = dynamic(
  () =>
    import('@kit/ui/mobile-mode-toggle').then((mod) => ({
      default: mod.MobileModeToggle,
    })),
  { ssr: false },
);

const paths = {
  home: pathsConfig.app.home,
};

const features = {
  enableThemeToggle: featuresFlagConfig.enableThemeToggle,
};

export function LandingHeader({ user }: { user?: JWTUserData | null }) {
  const signOut = useSignOut();

  if (user) {
    return (
      <LandingNavHeader
        actions={
          <PersonalAccountDropdown
            showProfileName={false}
            paths={paths}
            features={features}
            user={user}
            signOutRequested={() => signOut.mutateAsync()}
          />
        }
      />
    );
  }

  return <LandingNavHeader actions={<AuthButtons />} />;
}

function AuthButtons() {
  return (
    <div
      className={'animate-in fade-in flex items-center gap-x-2 duration-500'}
    >
      <div className={'hidden md:flex'}>
        <If condition={features.enableThemeToggle}>
          <ModeToggle />
        </If>
      </div>

      <div className={'md:hidden'}>
        <If condition={features.enableThemeToggle}>
          <MobileModeToggle />
        </If>
      </div>

      <div className={'flex items-center gap-x-2'}>
        <Button
          className="text-xs md:text-sm"
          asChild
          variant={'outline'}
          size={'sm'}
        >
          <Link href={pathsConfig.auth.signIn}>Sign In</Link>
        </Button>

        <Button
          asChild
          className="bg-[#7c3aed] text-xs text-white hover:bg-[#6d28d9] md:text-sm"
          size={'sm'}
        >
          <Link href={pathsConfig.auth.signUp}>Try It</Link>
        </Button>
      </div>
    </div>
  );
}
