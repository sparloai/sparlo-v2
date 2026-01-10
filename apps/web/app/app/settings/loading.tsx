import { FormPageSkeleton } from '~/components/skeletons';

/**
 * Settings page loading skeleton.
 * Uses FormPageSkeleton with sidebar to match settings layout.
 */
export default function SettingsLoading() {
  return <FormPageSkeleton withSidebar />;
}
