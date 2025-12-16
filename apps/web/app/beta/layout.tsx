import type { Metadata } from 'next';

import { AppLogo } from '~/components/app-logo';

export const metadata: Metadata = {
  title: 'Sparlo Beta - Innovation AI',
  description:
    'Beta access to Sparlo - AI-powered technical analysis for R&D teams.',
};

export default function BetaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-neutral-950">
      {/* Simple header */}
      <header className="sticky top-0 z-50 border-b border-[#E5E5E5] bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 32 32"
                fill="none"
                className="text-white"
              >
                <path
                  d="M16.2 8C13.1 8 10.8 9.4 10.8 12.2C10.8 14.6 12.4 15.8 15.2 16.6L17.8 17.3C19.6 17.8 20.2 18.4 20.2 19.4C20.2 20.6 19.2 21.4 17.2 21.4C15 21.4 13.6 20.4 13.4 18.6H10C10.2 21.8 12.6 24 17.2 24C20.6 24 23 22.4 23 19.4C23 17 21.4 15.6 18.4 14.8L15.8 14.1C14.2 13.6 13.6 13 13.6 12C13.6 10.8 14.6 10 16.4 10C18.2 10 19.4 10.8 19.6 12.4H23C22.8 9.4 20.4 8 16.2 8Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold text-[#1A1A1A] dark:text-white">
              Sparlo
            </span>
            <span className="rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-xs font-medium text-[#7C3AED]">
              Beta
            </span>
          </div>
          <a
            href="/"
            className="text-sm text-[#6B6B6B] transition-colors hover:text-[#1A1A1A] dark:text-neutral-400 dark:hover:text-white"
          >
            Learn more →
          </a>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}
