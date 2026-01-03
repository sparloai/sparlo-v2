import Image from 'next/image';
import Link from 'next/link';

/**
 * Footer Component
 *
 * Deep tech aesthetic - confident through restraint
 * The emptiness is intentional.
 */
export function Footer() {
  return (
    <footer className="bg-zinc-950 py-20">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-6">
        {/* Logo */}
        <Link href="/" className="transition-opacity hover:opacity-70">
          <Image
            src="/images/sparlo-logo-white.png"
            alt="Sparlo"
            width={100}
            height={26}
            className="h-6 w-auto"
          />
        </Link>

        {/* Contact */}
        <a
          href="mailto:help@sparlo.ai"
          className="text-base tracking-[-0.02em] text-zinc-400 transition-colors hover:text-white hover:underline"
        >
          help@sparlo.ai
        </a>

        {/* Legal Links */}
        <div className="flex items-center gap-4 text-base tracking-[-0.02em] text-zinc-500">
          <Link
            href="/privacy-policy"
            className="transition-colors hover:text-white hover:underline"
          >
            Privacy
          </Link>
          <span className="text-zinc-700">·</span>
          <Link
            href="/terms-of-service"
            className="transition-colors hover:text-white hover:underline"
          >
            Terms
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-base tracking-[-0.01em] text-zinc-500">
          © 2025 Sparlo, Inc.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
