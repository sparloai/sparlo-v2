import { CardGridSkeleton } from '~/components/skeletons';

/**
 * Teams page loading skeleton.
 * Uses CardGridSkeleton to match teams list layout.
 */
export default function TeamsLoading() {
  return <CardGridSkeleton cardCount={6} columns={3} />;
}
