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
        {/* Wordmark */}
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
          className="text-[13px] tracking-[-0.02em] text-zinc-500 transition-colors hover:text-zinc-300"
        >
          help@sparlo.ai
        </a>

        {/* Legal Links */}
        <div className="flex items-center gap-3 text-[12px] tracking-[-0.02em] text-zinc-600">
          <Link
            href="/privacy-policy"
            className="transition-colors hover:text-zinc-400"
          >
            Privacy
          </Link>
          <span className="text-zinc-700">·</span>
          <Link
            href="/terms-of-service"
            className="transition-colors hover:text-zinc-400"
          >
            Terms
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-[11px] tracking-[-0.01em] text-zinc-700">
          © 2025 Sparlo, Inc.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
