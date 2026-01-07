/**
 * Centralized subdomain and routing configuration.
 * Single source of truth for subdomain detection, path validation, and URL generation.
 */

/**
 * App subdomain for authenticated users (e.g., app.sparlo.ai).
 */
export const APP_SUBDOMAIN = process.env.NEXT_PUBLIC_APP_SUBDOMAIN || 'app';

/**
 * Production domain (e.g., sparlo.ai).
 */
export const PRODUCTION_DOMAIN =
  process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN || 'sparlo.ai';

/**
 * Paths that should stay on the main domain (not the app subdomain).
 * These include auth, public sharing, API routes, etc.
 */
export const MAIN_DOMAIN_PATHS = [
  '/auth',
  '/share',
  '/api',
  '/healthcheck',
] as const;

/**
 * Paths that are public on the app subdomain (don't require authentication).
 */
export const PUBLIC_PATHS = [
  '/auth',
  '/healthcheck',
  '/api',
  '/share',
  '/_next',
  '/locales',
  '/images',
  '/assets',
] as const;

/**
 * Allowed hostnames for the app subdomain.
 * Used for exact hostname matching to prevent host header injection attacks.
 */
const ALLOWED_APP_HOSTS = new Set([
  `${APP_SUBDOMAIN}.${PRODUCTION_DOMAIN}`,
  // Add localhost variants for development
  'localhost',
  '127.0.0.1',
]);

/**
 * Check if the host is the app subdomain using exact match.
 * Prevents host header injection attacks (e.g., app.sparlo.ai.attacker.com).
 *
 * @param host - The host header value (may include port)
 * @returns true if the host matches the app subdomain exactly
 */
export function isAppSubdomainHost(host: string): boolean {
  // Remove port if present (split always returns at least one element)
  const hostname = host.split(':')[0] ?? '';

  // Exact match against allowed hosts
  return ALLOWED_APP_HOSTS.has(hostname);
}

/**
 * Check if a path is a main domain path (should not live on app subdomain).
 */
export function isMainDomainPath(path: string): boolean {
  return MAIN_DOMAIN_PATHS.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/**
 * Check if a path is an app path (should live on app subdomain).
 */
export function isAppPath(path: string): boolean {
  return !isMainDomainPath(path);
}

/**
 * Check if a path is public on the app subdomain (doesn't require auth).
 */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Validate redirect path to prevent open redirect vulnerabilities.
 * Only allows relative paths that are safe app paths.
 */
export function isValidRedirectPath(path: string): boolean {
  // Must be a string
  if (typeof path !== 'string') return false;

  // Must start with / (relative path)
  if (!path.startsWith('/')) return false;

  // Reject protocol-relative URLs (//example.com)
  if (path.startsWith('//')) return false;

  // Reject any URL with protocol (javascript:, data:, http:, etc.)
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return false;

  // Disallow main domain paths that shouldn't be redirect targets
  return !isMainDomainPath(path);
}

/**
 * Get the app subdomain URL for a given path.
 * Handles both /home/* paths (from middleware redirects) and clean paths.
 */
export function getAppSubdomainUrl(path: string): string {
  // If path starts with /home, strip the prefix
  // Otherwise, use the path as-is (it's already a clean app path)
  const appPath = path.startsWith('/home')
    ? path.replace(/^\/home/, '') || '/'
    : path;

  return `https://${APP_SUBDOMAIN}.${PRODUCTION_DOMAIN}${appPath}`;
}

/**
 * Get the main domain URL.
 */
export function getMainDomainUrl(path: string = '/'): string {
  return `https://${PRODUCTION_DOMAIN}${path}`;
}
