'use client';

import { useCallback, useState } from 'react';

import { createPortal } from 'react-dom';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AnimatePresence, motion } from 'framer-motion';

import { PersonalAccountDropdown } from '@kit/accounts/personal-account-dropdown';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { JWTUserData } from '@kit/supabase/types';
import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';

import featuresFlagConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

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

const features = {
  enableThemeToggle: featuresFlagConfig.enableThemeToggle,
};

const EASING = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

function SignOutTransitionOverlay({ isActive }: { isActive: boolean }) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASING }}
        >
          <motion.p
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15, ease: EASING }}
            className="text-lg font-medium tracking-tight text-white"
          >
            Signing out...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function SiteHeaderAccountSection({
  user,
  hasTeams = false,
}: {
  user: JWTUserData | null;
  hasTeams?: boolean;
}) {
  const signOut = useSignOut();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);

    // Wait for fade animation to play
    await new Promise((resolve) => setTimeout(resolve, 400));

    await signOut.mutateAsync();
    router.push('/');
  }, [signOut, router]);

  if (user) {
    const paths = {
      home: pathsConfig.app.home,
      dashboard: pathsConfig.app.home,
      settings: pathsConfig.app.personalAccountSettings,
      billing: pathsConfig.app.personalAccountBilling,
      teams: hasTeams ? pathsConfig.app.personalAccountTeams : undefined,
      help: '/app/help',
    };

    const userFeatures = {
      enableThemeToggle: featuresFlagConfig.enableThemeToggle,
      enableBilling: featuresFlagConfig.enablePersonalAccountBilling,
      enableTeams: hasTeams,
    };

    return (
      <>
        <SignOutTransitionOverlay isActive={isSigningOut} />
        <PersonalAccountDropdown
          showProfileName={false}
          paths={paths}
          features={userFeatures}
          user={user}
          signOutRequested={handleSignOut}
        />
      </>
    );
  }

  return <AuthButtons />;
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
          className="text-xs md:text-sm"
          variant={'default'}
          size={'sm'}
        >
          <Link href={pathsConfig.auth.signUp}>Try It</Link>
        </Button>
      </div>
    </div>
  );
}
