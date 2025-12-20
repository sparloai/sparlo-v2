import { generateDiscoveryReport } from './generate-discovery-report';
import { generateHybridReport } from './generate-hybrid-report';
import { generateReport } from './generate-report';

/**
 * Export all Inngest functions for the API route
 */
export const functions = [
  generateReport,
  generateDiscoveryReport,
  generateHybridReport,
];
