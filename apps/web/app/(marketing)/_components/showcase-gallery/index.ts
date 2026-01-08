/**
 * Showcase Gallery - Card-based progressive disclosure for Example Reports
 *
 * Public exports for integration with the landing page.
 */
export { ShowcaseGallery } from './showcase-gallery';
export { ReportTabs } from './report-tabs';
export { SectionCard } from './section-card';
export { useShowcaseState } from './use-showcase-state';
export { REPORTS_CONFIG, SECTION_CONFIG, getAvailableSections } from './config';
export type {
  ReportId,
  SectionId,
  CardState,
  ShowcaseState,
  SectionMetric,
} from './types';
export type {
  ReportConfig,
  SectionConfig as SectionConfigType,
} from './config';
