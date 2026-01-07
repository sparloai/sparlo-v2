import { ReactNode } from 'react';

interface ReportSection {
  id: string;
  number: string;
  title: string;
  content: ReactNode;
}

interface ExampleReport {
  id: string;
  title: string;
  headline: string;
  subtitle: string;
  locked: boolean;
  metadata: {
    readTime: string;
    dataPoints: string;
  };
  sections: ReportSection[];
}

// Engineers mode report tabs
export const EXAMPLE_REPORTS: ExampleReport[] = [
  {
    id: 'carbon-removal',
    title: 'Carbon Removal',
    headline:
      'Electrochemical Ocean Alkalinity Enhancement: Marine Electrolyzer Architecture for 5+ Year Survival',
    subtitle: 'Ocean Alkalinity Enhancement at <$80/ton CO2',
    locked: false,
    metadata: {
      readTime: '22 min read',
      dataPoints: '4.5M data points',
    },
    sections: [],
  },
  {
    id: 'green-h2',
    title: 'Green H2',
    headline:
      '4% Energy Penalty H2 Compression—Or Why 350 Bar Electrolyzers Make Compressors Obsolete',
    subtitle: 'Hybrid Compression at <5% Energy Penalty',
    locked: false,
    metadata: {
      readTime: '19 min read',
      dataPoints: '3.8M data points',
    },
    sections: [],
  },
  {
    id: 'food-waste',
    title: 'Waste',
    headline: '15 kWh/ton Food Waste Processing with Off-the-Shelf Equipment',
    subtitle: 'Commercial Kitchen Waste-to-Value System',
    locked: false,
    metadata: {
      readTime: '20 min read',
      dataPoints: '3.5M data points',
    },
    sections: [],
  },
  {
    id: 'materials-science',
    title: 'Advanced Materials',
    headline: '$40/ft² Transparent Wood: Continuous Processing for 2m² Panels',
    subtitle: 'Architectural Glass Replacement at Scale',
    locked: false,
    metadata: {
      readTime: '26 min read',
      dataPoints: '6.3M data points',
    },
    sections: [],
  },
  {
    id: 'food-tech',
    title: 'Food Tech',
    headline:
      'Precision Fermentation Scale-Up: Achieving $2-5/kg Protein at 50,000L Through Paradigm Shift from Batch to Continuous Processing',
    subtitle: 'Continuous Processing for $2-5/kg Protein',
    locked: false,
    metadata: {
      readTime: '24 min read',
      dataPoints: '3.6M data points',
    },
    sections: [],
  },
  {
    id: 'biotech',
    title: 'Biotech',
    headline:
      'Protein A-Free mAb Purification: Achieving <$5/g Through Validated Non-Affinity Capture',
    subtitle: 'Non-Affinity Capture at <$5/g',
    locked: false,
    metadata: {
      readTime: '28 min read',
      dataPoints: '4.2M data points',
    },
    sections: [],
  },
];

// Investors mode report tabs - reuses existing reports until DD reports are ready
export const INVESTOR_REPORTS: ExampleReport[] = [
  {
    id: 'thermal-storage',
    title: 'Thermal Storage',
    headline: 'ThermalStore Energy: Series B Due Diligence',
    subtitle: 'Industrial Decarbonization — Thermal Energy Storage',
    locked: false,
    metadata: {
      readTime: '12 min read',
      dataPoints: '2.1M data points',
    },
    sections: [],
  },
  {
    id: 'geothermal',
    title: 'Geothermal',
    headline: 'Enhanced Geothermal Systems: Technical Due Diligence',
    subtitle: 'Deep Earth Heat Extraction at Scale',
    locked: false,
    metadata: {
      readTime: '15 min read',
      dataPoints: '2.8M data points',
    },
    sections: [],
  },
  {
    id: 'low-carbon-cement',
    title: 'Low-Carbon Cement',
    headline: 'Novel Binder Chemistry: Series A Due Diligence',
    subtitle: 'Decarbonizing the Built Environment',
    locked: false,
    metadata: {
      readTime: '18 min read',
      dataPoints: '3.2M data points',
    },
    sections: [],
  },
  {
    id: 'hydrogen-dd',
    title: 'Hydrogen',
    headline: 'Electrolyzer Scale-Up: Growth Equity Due Diligence',
    subtitle: 'Green Hydrogen Production Economics',
    locked: false,
    metadata: {
      readTime: '16 min read',
      dataPoints: '2.9M data points',
    },
    sections: [],
  },
  {
    id: 'dac',
    title: 'DAC',
    headline: 'Direct Air Capture: Series B Due Diligence',
    subtitle: 'Atmospheric Carbon Removal at Scale',
    locked: false,
    metadata: {
      readTime: '20 min read',
      dataPoints: '3.5M data points',
    },
    sections: [],
  },
  {
    id: 'biotech-dd',
    title: 'Biotech',
    headline: 'Synthetic Biology Platform: Series A Due Diligence',
    subtitle: 'Novel Pathway Engineering for Industrial Biotech',
    locked: false,
    metadata: {
      readTime: '22 min read',
      dataPoints: '4.0M data points',
    },
    sections: [],
  },
];

// Map investor report IDs to existing report data (temporary until DD reports ready)
export const INVESTOR_REPORT_DATA_MAP: Record<string, string> = {
  'thermal-storage': 'green-h2',
  geothermal: 'carbon-removal',
  'low-carbon-cement': 'materials-science',
  'hydrogen-dd': 'green-h2',
  dac: 'carbon-removal',
  'biotech-dd': 'biotech',
};
