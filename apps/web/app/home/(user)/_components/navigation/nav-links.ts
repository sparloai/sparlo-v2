import { FileText, Home } from 'lucide-react';

/**
 * Shared navigation links used by both desktop and mobile navigation.
 * Note: Settings is handled separately in the user menu dropdown.
 */
export const NAV_LINKS = [
  { href: '/home', labelKey: 'common:routes.dashboard', icon: Home },
  {
    href: '/home/reports/new',
    labelKey: 'common:routes.newReport',
    icon: FileText,
  },
] as const;
