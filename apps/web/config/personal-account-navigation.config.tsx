import { z } from 'zod';

import { NavigationConfigSchema } from '@kit/ui/navigation-schema';

// Navigation config is minimal since Sparlo uses custom sidebar with conversation history
// Profile and Billing are now in the profile dropdown menu
const routes = [] satisfies z.infer<typeof NavigationConfigSchema>['routes'];

export const personalAccountNavigationConfig = NavigationConfigSchema.parse({
  routes,
  style: process.env.NEXT_PUBLIC_USER_NAVIGATION_STYLE,
  sidebarCollapsed: process.env.NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED,
  sidebarCollapsedStyle: process.env.NEXT_PUBLIC_SIDEBAR_COLLAPSIBLE_STYLE,
});
