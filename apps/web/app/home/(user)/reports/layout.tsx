/**
 * Reports Layout
 *
 * This layout is used for all report pages.
 * Report-specific CSS is imported here for code-splitting optimization.
 * These styles are only loaded when viewing report pages.
 */
// Report Intelligence Briefing Theme - only loaded on report pages
import '~/styles/report-animations.css';
import '~/styles/report-base.css';
import '~/styles/report-components.css';
import '~/styles/report-modules.css';
import '~/styles/report-sections.css';
import '~/styles/report-tables.css';
import '~/styles/report-tokens.css';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
