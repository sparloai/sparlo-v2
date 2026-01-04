import withBundleAnalyzer from '@next/bundle-analyzer';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ENABLE_REACT_COMPILER = process.env.ENABLE_REACT_COMPILER === 'true';

/**
 * App subdomain for authenticated users.
 * Routes on app.sparlo.ai are rewritten to /home/* internally.
 */
const APP_SUBDOMAIN = 'app';
const PRODUCTION_DOMAIN = 'sparlo.ai';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'payment=(self "https://js.stripe.com")' },
];

const INTERNAL_PACKAGES = [
  '@kit/ui',
  '@kit/auth',
  '@kit/accounts',
  '@kit/admin',
  '@kit/team-accounts',
  '@kit/shared',
  '@kit/supabase',
  '@kit/i18n',
  '@kit/mailers',
  '@kit/billing-gateway',
  '@kit/email-templates',
  '@kit/database-webhooks',
  '@kit/cms',
  '@kit/monitoring',
  '@kit/next',
  '@kit/notifications',
];

/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  reactStrictMode: true,
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: INTERNAL_PACKAGES,
  images: getImagesConfig(),
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  serverExternalPackages: ['pino', 'thread-stream', '@react-pdf/renderer'],
  // needed for supporting dynamic imports for local content
  outputFileTracingIncludes: {
    '/*': ['./content/**/*'],
  },
  redirects: getRedirects,
  rewrites: getRewrites,
  headers: getSecurityHeaders,
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx'],
    resolveAlias: getModulesAliases(),
  },
  devIndicators:
    process.env.NEXT_PUBLIC_CI === 'true'
      ? false
      : {
          position: 'bottom-right',
        },
  reactCompiler: ENABLE_REACT_COMPILER,
  experimental: {
    mdxRs: true,
    turbopackFileSystemCacheForDev: true,
    optimizePackageImports: [
      'recharts',
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-avatar',
      '@radix-ui/react-select',
      'date-fns',
      ...INTERNAL_PACKAGES,
    ],
  },
  modularizeImports: {
    lodash: {
      transform: 'lodash/{{member}}',
    },
  },
  /** We already do linting and typechecking as separate tasks in CI */
  typescript: { ignoreBuildErrors: true },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(config);

/** @returns {import('next').NextConfig['images']} */
function getImagesConfig() {
  const remotePatterns = [];

  if (SUPABASE_URL) {
    const hostname = new URL(SUPABASE_URL).hostname;

    remotePatterns.push({
      protocol: 'https',
      hostname,
    });
  }

  if (IS_PRODUCTION) {
    return {
      remotePatterns,
    };
  }

  remotePatterns.push(
    ...[
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  );

  return {
    remotePatterns,
  };
}

async function getRedirects() {
  return [
    {
      source: '/server-sitemap.xml',
      destination: '/sitemap.xml',
      permanent: true,
    },
  ];
}

/**
 * Paths that should NOT be rewritten on the app subdomain.
 * These are public/system paths that exist at the root level.
 */
const APP_SUBDOMAIN_EXCLUDED_PATHS = [
  'home', // Already at /home, no rewrite needed
  'auth', // Auth routes stay at /auth
  'api', // API routes
  'share', // Public share pages
  'healthcheck', // Health check endpoint
  '_next', // Next.js internals
  'locales', // i18n files
  'images', // Static images
  'assets', // Static assets
];

/**
 * Rewrites for app subdomain routing.
 * On app.sparlo.ai, root-level paths are rewritten to /home/* internally.
 * This allows the file structure to remain at /home/* while URLs are clean.
 *
 * Examples:
 * - app.sparlo.ai/ → /home/ (personal dashboard)
 * - app.sparlo.ai/settings → /home/settings
 * - app.sparlo.ai/team-slug → /home/team-slug
 * - app.sparlo.ai/team-slug/reports → /home/team-slug/reports
 *
 * Excluded paths (not rewritten):
 * - app.sparlo.ai/auth/* → /auth/* (auth routes)
 * - app.sparlo.ai/api/* → /api/* (API routes)
 * - app.sparlo.ai/home/* → /home/* (already prefixed)
 */
async function getRewrites() {
  // Only apply rewrites in production on the app subdomain
  if (!IS_PRODUCTION) {
    return [];
  }

  // Build negative lookahead regex for excluded paths
  const excludePattern = APP_SUBDOMAIN_EXCLUDED_PATHS.join('|');

  return {
    beforeFiles: [
      // Rewrite app subdomain requests to /home/* routes
      // Excludes: home, auth, api, share, healthcheck, _next, locales, images, assets
      {
        source: `/((?!${excludePattern}).*)`,
        has: [
          {
            type: 'host',
            value: `${APP_SUBDOMAIN}.${PRODUCTION_DOMAIN}`,
          },
        ],
        destination: '/home/$1',
      },
    ],
  };
}

async function getSecurityHeaders() {
  return [
    {
      source: '/:path*',
      headers: securityHeaders,
    },
  ];
}

/**
 * @description Aliases modules based on the environment variables
 * This will speed up the development server by not loading the modules that are not needed
 * @returns {Record<string, string>}
 */
function getModulesAliases() {
  if (process.env.NODE_ENV !== 'development') {
    return {};
  }

  const monitoringProvider = process.env.NEXT_PUBLIC_MONITORING_PROVIDER;
  const billingProvider = process.env.NEXT_PUBLIC_BILLING_PROVIDER;
  const mailerProvider = process.env.MAILER_PROVIDER;
  const captchaProvider = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;

  // exclude the modules that are not needed
  const excludeSentry = monitoringProvider !== 'sentry';
  const excludeStripe = billingProvider !== 'stripe';
  const excludeNodemailer = mailerProvider !== 'nodemailer';
  const excludeTurnstile = !captchaProvider;

  /** @type {Record<string, string>} */
  const aliases = {};

  // the path to the noop module
  const noopPath = '~/lib/dev-mock-modules';

  if (excludeSentry) {
    aliases['@sentry/nextjs'] = noopPath;
  }

  if (excludeStripe) {
    aliases['stripe'] = noopPath;
    aliases['@stripe/stripe-js'] = noopPath;
  }

  if (excludeNodemailer) {
    aliases['nodemailer'] = noopPath;
  }

  if (excludeTurnstile) {
    aliases['@marsidev/react-turnstile'] = noopPath;
  }

  return aliases;
}
