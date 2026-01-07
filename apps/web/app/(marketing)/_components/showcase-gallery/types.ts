import type { HybridReportData } from '~/app/reports/_lib/types/hybrid-report-display.types';

/**
 * Showcase Gallery Types
 *
 * Type-safe foundation with discriminated unions for the
 * progressive disclosure report gallery.
 */

// Report IDs - all available hybrid reports
export type ReportId =
  | 'carbon-removal'
  | 'green-h2'
  | 'materials-science'
  | 'energy'
  | 'food-waste'
  | 'food-tech'
  | 'biotech'
  | 'climate';

// Report configuration type
export interface ReportConfig {
  id: ReportId;
  title: string;
  shortTitle: string;
  hybridData: HybridReportData;
}

// Section IDs derived from HybridReportData keys
export type SectionId =
  | 'executive-summary'
  | 'problem-analysis'
  | 'constraints'
  | 'challenge-frame'
  | 'solution-concepts'
  | 'innovation-concepts'
  | 'frontier-tech'
  | 'risks'
  | 'self-critique'
  | 'recommendation';

// All section IDs as a const array for iteration
export const ALL_SECTION_IDS: SectionId[] = [
  'executive-summary',
  'problem-analysis',
  'constraints',
  'challenge-frame',
  'solution-concepts',
  'innovation-concepts',
  'frontier-tech',
  'risks',
  'self-critique',
  'recommendation',
];

// Card animation state machine
export type CardState = 'collapsed' | 'expanding' | 'expanded' | 'collapsing';

// State shape for the showcase gallery
export interface ShowcaseState {
  activeReportId: ReportId;
  expandedSectionId: SectionId | null;
  cardStates: Record<SectionId, CardState>;
  isModalOpen: boolean;
}

// Section configuration item for the registry
export interface SectionConfigItem {
  id: SectionId;
  title: string;
  dataKey: keyof HybridReportData;
  getHeadline: (data: HybridReportData) => string;
  getMetrics: (data: HybridReportData) => Array<{ label: string; value: string | number }>;
}

// Metric display type
export interface SectionMetric {
  label: string;
  value: string | number;
}
