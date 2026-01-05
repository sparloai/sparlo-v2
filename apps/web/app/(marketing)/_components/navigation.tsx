'use client';

import { memo, useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import type { JWTUserData } from '@kit/supabase/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
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
              <UserAvatarDropdown
                user={user}
                signOut={signOut}
                useLightUI={useLightUI}
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

/**
 * User Avatar Dropdown for Landing Page
 *
 * Clean dropdown with: Dashboard, Billing, Settings, Support
 */
interface UserAvatarDropdownProps {
  user: JWTUserData;
  signOut: ReturnType<typeof useSignOut>;
  useLightUI: boolean;
}

const UserAvatarDropdown = memo(function UserAvatarDropdown({
  user,
  signOut,
  useLightUI,
}: UserAvatarDropdownProps) {
  const initial = user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          useLightUI
            ? 'bg-white text-zinc-900 shadow-sm hover:shadow-md focus-visible:ring-white'
            : 'bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:ring-zinc-900',
        )}
        aria-label="Open user menu"
      >
        {initial}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg"
      >
        <DropdownMenuItem asChild>
          <Link
            href={pathsConfig.app.personalAccountSettings}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <SettingsIcon className="h-5 w-5 text-zinc-400" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href={pathsConfig.app.personalAccountBilling}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <BillingIcon className="h-5 w-5 text-zinc-400" />
            <span>Billing</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/docs"
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <HelpIcon className="h-5 w-5 text-zinc-400" />
            <span>Help</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2 bg-zinc-100" />

        <DropdownMenuItem
          onClick={() => signOut.mutateAsync()}
          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          <LogOutIcon className="h-5 w-5 text-zinc-400" />
          <span>Log out</span>
        </DropdownMenuItem>

        {user.email && (
          <>
            <DropdownMenuSeparator className="my-2 bg-zinc-100" />
            <div className="px-3 py-2 text-[14px] text-zinc-400">
              {user.email}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

// Icons
function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BillingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

export default Navigation;
