import Image from 'next/image';
import Link from 'next/link';

/**
 * Share Page Header
 *
 * Header with Sparlo logo and Get Started CTA to encourage signups
 * from users viewing shared reports.
 */
export function ShareHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 lg:px-16">
        <Link
          href="https://sparlo.ai"
          className="transition-opacity hover:opacity-80"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src="/images/sparlo-logo.png"
            alt="Sparlo"
            width={90}
            height={24}
            className="h-6 w-auto"
            priority
          />
        </Link>

        <Link
          href="/auth/sign-up"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Get Started
        </Link>
      </nav>
    </header>
  );
}
