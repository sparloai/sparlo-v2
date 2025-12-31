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

export const EXAMPLE_REPORTS: ExampleReport[] = [
  {
    id: 'food-waste',
    title: 'Waste',
    headline:
      '15 kWh/ton Food Waste Processing with Off-the-Shelf Equipment',
    subtitle: 'Commercial Kitchen Waste-to-Value System',
    locked: false,
    metadata: {
      readTime: '20 min read',
      dataPoints: '3.5M data points',
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
  {
    id: 'materials-science',
    title: 'Advanced Materials',
    headline:
      '$40/ft² Transparent Wood: Continuous Processing for 2m² Panels',
    subtitle: 'Architectural Glass Replacement at Scale',
    locked: false,
    metadata: {
      readTime: '26 min read',
      dataPoints: '6.3M data points',
    },
    sections: [],
  },
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
];
