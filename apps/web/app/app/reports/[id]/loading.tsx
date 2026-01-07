import { ReportSkeleton } from './_components/report-skeleton';

/**
 * Report Loading State
 *
 * Next.js automatically shows this component while the report page is loading.
 * Uses a premium skeleton that mirrors the actual report structure for
 * a seamless transition from loading to content.
 */
export default function Loading() {
  return <ReportSkeleton />;
}
