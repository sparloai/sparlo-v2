'use client';

import { memo, useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { PersonalAccountDropdown } from '@kit/accounts/personal-account-dropdown';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import type { JWTUserData } from '@kit/supabase/types';
import { cn } from '@kit/ui/utils';

import pathsConfig from '~/config/paths.config';

/**
 * Navigation Component
 *
 * Air Company Aesthetic - Transparent, minimal, confident
 *
 * Features:
 * - Transparent over hero, adds backdrop on scroll
 * - Typography as logo (wordmark only)
 * - No hamburger on desktop
 * - Full-screen mobile menu overlay
 * - Handles logged-in/logged-out states
 */

interface NavigationProps {
  user?: JWTUserData | null;
  variant?: 'dark' | 'light';
  leftSlot?: React.ReactNode;
  hideUserDropdown?: boolean;
}

const paths = {
  home: pathsConfig.app.home,
};

const features = {};

export const Navigation = memo(function Navigation({
  user,
  variant = 'dark',
  leftSlot,
  hideUserDropdown = false,
}: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const signOut = useSignOut();

  // Track scroll position for background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // Use light colors when at top of dark hero, dark colors when scrolled
  const useLightUI = variant === 'dark' && !scrolled;

  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 left-0 z-50 transition-all duration-500',
          scrolled
            ? 'bg-white/80 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md'
            : 'bg-transparent',
        )}
      >
        <nav className="flex items-center justify-between px-6 py-5 md:px-12 lg:px-16">
          {/* Left side - Logo and optional slot */}
          <div className="flex items-center gap-4">
            {leftSlot && user && leftSlot}
            <Link href="/" className="transition-opacity hover:opacity-80">
              <Image
                src={
                  useLightUI
                    ? '/images/sparlo-logo-white.png'
                    : '/images/sparlo-logo.png'
                }
                alt="Sparlo"
                width={90}
                height={24}
                className="h-6 w-auto transition-opacity duration-500"
                priority
              />
            </Link>
          </div>

          {/* Right side - Auth */}
          <div className="hidden items-center gap-6 md:flex">
            {user && !hideUserDropdown ? (
              <PersonalAccountDropdown
                showProfileName={false}
                paths={paths}
                features={features}
                user={user}
                signOutRequested={() => signOut.mutateAsync()}
              />
            ) : !user ? (
              <>
                <Link
                  href={pathsConfig.auth.signIn}
                  className={cn(
                    'inline-flex min-h-[44px] items-center text-base leading-[1.2] tracking-[-0.02em] transition-all duration-500',
                    useLightUI
                      ? 'text-white/70 hover:text-white hover:underline'
                      : 'text-zinc-500 hover:text-zinc-900 hover:underline',
                  )}
                >
                  Sign In
                </Link>
                <Link
                  href={pathsConfig.auth.signUp}
                  className={cn(
                    'inline-flex min-h-[44px] items-center rounded px-6 py-2 text-base leading-[1.2] font-medium tracking-[-0.02em] transition-all duration-500',
                    useLightUI
                      ? 'bg-white text-zinc-900 hover:bg-zinc-100 hover:shadow-md'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-md',
                  )}
                >
                  Get Started
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn(
              'inline-flex min-h-[44px] min-w-[44px] items-center justify-center transition-colors duration-500 md:hidden',
              useLightUI ? 'text-white' : 'text-zinc-900',
            )}
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <MobileMenu user={user} onClose={closeMobileMenu} signOut={signOut} />
      )}
    </>
  );
});

interface MobileMenuProps {
  user?: JWTUserData | null;
  onClose: () => void;
  signOut: ReturnType<typeof useSignOut>;
}

const MobileMenu = memo(function MobileMenu({
  user,
  onClose,
  signOut,
}: MobileMenuProps) {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 md:hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <Link href="/" onClick={onClose}>
          <Image
            src="/images/sparlo-logo-white.png"
            alt="Sparlo"
            width={90}
            height={24}
            className="h-6 w-auto"
          />
        </Link>
        <button
          onClick={onClose}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-white"
          aria-label="Close menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-6 py-12">
        {/* Auth Section */}
        <div className="space-y-4 border-t border-zinc-800 pt-8">
          {user ? (
            <>
              <Link
                href={pathsConfig.app.home}
                onClick={onClose}
                className="block min-h-[44px] py-2 text-lg leading-[1.2] tracking-[-0.02em] text-white transition-colors hover:text-zinc-300"
              >
                Dashboard
              </Link>
              <Link
                href={pathsConfig.app.personalAccountSettings}
                onClick={onClose}
                className="block min-h-[44px] py-2 text-lg leading-[1.2] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-white"
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  signOut.mutateAsync();
                  onClose();
                }}
                className="block min-h-[44px] py-2 text-lg leading-[1.2] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-white"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href={pathsConfig.auth.signIn}
                onClick={onClose}
                className="block min-h-[44px] py-2 text-lg leading-[1.2] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href={pathsConfig.auth.signUp}
                onClick={onClose}
                className="inline-flex min-h-[44px] items-center rounded bg-white px-6 py-3 text-base leading-[1.2] font-medium tracking-[-0.02em] text-zinc-900 transition-colors hover:bg-zinc-100"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
});

export default Navigation;
