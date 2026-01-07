import type { HybridReportData } from '~/app/app/reports/_lib/types/hybrid-report-display.types';

import { CARBON_REMOVAL_HYBRID_REPORT } from '../carbon-removal-hybrid-data';
import { ENERGY_HYBRID_REPORT } from '../energy-hybrid-data';
import { GREEN_H2_HYBRID_REPORT } from '../green-h2-hybrid-data';
import { MATERIALS_SCIENCE_HYBRID_REPORT } from '../materials-science-hybrid-data';

export interface ExampleReportConfig {
  id: string;
  category: string;
  shortTitle: string;
  hybridData: HybridReportData;
}

/**
 * Map of example reports with their full hybrid data.
 * Order determines tab display order.
 */
export const exampleReportsConfig: ExampleReportConfig[] = [
  {
    id: 'carbon-removal',
    category: 'Carbon Removal',
    shortTitle: 'Marine Electrolyzer',
    hybridData: CARBON_REMOVAL_HYBRID_REPORT,
  },
  {
    id: 'green-h2',
    category: 'Green H2',
    shortTitle: 'Compression',
    hybridData: GREEN_H2_HYBRID_REPORT,
  },
  {
    id: 'advanced-materials',
    category: 'Advanced Materials',
    shortTitle: 'Transparent Wood',
    hybridData: MATERIALS_SCIENCE_HYBRID_REPORT,
  },
  {
    id: 'energy',
    category: 'Energy',
    shortTitle: 'EV Refrigeration',
    hybridData: ENERGY_HYBRID_REPORT,
  },
];

/**
 * Get a report config by ID
 */
export function getReportById(id: string): ExampleReportConfig | undefined {
  return exampleReportsConfig.find((r) => r.id === id);
}
