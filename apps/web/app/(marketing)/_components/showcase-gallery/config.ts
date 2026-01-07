/**
 * Showcase Gallery Configuration
 *
 * Maps report IDs to their data and section configurations.
 * This file consolidates all report and section metadata for the showcase gallery.
 */
import type { HybridReportData } from '~/app/reports/_lib/types/hybrid-report-display.types';

import { BIOTECH_HYBRID_REPORT } from '../example-reports/biotech-hybrid-data';
import { CARBON_REMOVAL_HYBRID_REPORT } from '../example-reports/carbon-removal-hybrid-data';
import { CLIMATE_HYBRID_REPORT } from '../example-reports/climate-hybrid-data';
import { ENERGY_HYBRID_REPORT } from '../example-reports/energy-hybrid-data';
import { FOOD_HYBRID_REPORT } from '../example-reports/food-hybrid-data';
import { FOODTECH_HYBRID_REPORT } from '../example-reports/foodtech-hybrid-data';
import { GREEN_H2_HYBRID_REPORT } from '../example-reports/green-h2-hybrid-data';
import { MATERIALS_SCIENCE_HYBRID_REPORT } from '../example-reports/materials-science-hybrid-data';
import type { ReportId, SectionId } from './types';

/**
 * Report configuration with metadata for tabs
 */
export interface ReportConfig {
  id: ReportId;
  title: string;
  shortTitle: string;
  data: HybridReportData;
}

/**
 * All available reports for the showcase gallery
 */
export const REPORTS_CONFIG: ReportConfig[] = [
  {
    id: 'carbon-removal',
    title: 'Carbon Removal',
    shortTitle: 'Carbon',
    data: CARBON_REMOVAL_HYBRID_REPORT,
  },
  {
    id: 'green-h2',
    title: 'Green Hydrogen',
    shortTitle: 'H2',
    data: GREEN_H2_HYBRID_REPORT,
  },
  {
    id: 'materials-science',
    title: 'Materials Science',
    shortTitle: 'Materials',
    data: MATERIALS_SCIENCE_HYBRID_REPORT,
  },
  {
    id: 'energy',
    title: 'Energy Storage',
    shortTitle: 'Energy',
    data: ENERGY_HYBRID_REPORT,
  },
  {
    id: 'food-waste',
    title: 'Food Waste',
    shortTitle: 'Food',
    data: FOOD_HYBRID_REPORT,
  },
  {
    id: 'food-tech',
    title: 'Food Tech',
    shortTitle: 'FoodTech',
    data: FOODTECH_HYBRID_REPORT,
  },
  {
    id: 'biotech',
    title: 'Biotech',
    shortTitle: 'Biotech',
    data: BIOTECH_HYBRID_REPORT,
  },
  {
    id: 'climate',
    title: 'Climate',
    shortTitle: 'Climate',
    data: CLIMATE_HYBRID_REPORT,
  },
];

/**
 * Map of report IDs to their data for quick lookup
 */
export const REPORT_DATA_MAP: Record<ReportId, HybridReportData> = {
  'carbon-removal': CARBON_REMOVAL_HYBRID_REPORT,
  'green-h2': GREEN_H2_HYBRID_REPORT,
  'materials-science': MATERIALS_SCIENCE_HYBRID_REPORT,
  energy: ENERGY_HYBRID_REPORT,
  'food-waste': FOOD_HYBRID_REPORT,
  'food-tech': FOODTECH_HYBRID_REPORT,
  biotech: BIOTECH_HYBRID_REPORT,
  climate: CLIMATE_HYBRID_REPORT,
};

/**
 * Section configuration with display metadata
 */
export interface SectionConfig {
  id: SectionId;
  title: string;
  /** Function to extract headline text from report data */
  getHeadline: (data: HybridReportData) => string;
  /** Function to extract key metrics for preview display */
  getMetrics: (data: HybridReportData) => Array<{ value: string; label: string }>;
  /** Function to check if section has data to display */
  hasData: (data: HybridReportData) => boolean;
}

/**
 * All section configurations in display order
 */
export const SECTION_CONFIG: SectionConfig[] = [
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    getHeadline: (data) => {
      if (typeof data.executive_summary === 'string') {
        return data.executive_summary.slice(0, 150) + '...';
      }
      return (
        data.executive_summary?.narrative_lead?.slice(0, 150) + '...' ||
        data.brief?.slice(0, 150) + '...' ||
        'Assessment and recommendations'
      );
    },
    getMetrics: (data) => {
      const metrics: Array<{ value: string; label: string }> = [];
      if (typeof data.executive_summary !== 'string') {
        if (data.executive_summary?.viability) {
          metrics.push({
            value: data.executive_summary.viability_label || data.executive_summary.viability,
            label: '',
          });
        }
      }
      return metrics;
    },
    hasData: (data) => Boolean(data.executive_summary || data.brief),
  },
  {
    id: 'problem-analysis',
    title: 'Problem Analysis',
    getHeadline: (data) =>
      data.problem_analysis?.whats_wrong?.prose?.slice(0, 150) + '...' ||
      'Understanding the core challenges',
    getMetrics: (data) => {
      const metrics: Array<{ value: string; label: string }> = [];
      const benchmarks = data.problem_analysis?.current_state_of_art?.benchmarks;
      if (benchmarks?.length) {
        metrics.push({ value: String(benchmarks.length), label: 'benchmarks' });
      }
      return metrics;
    },
    hasData: (data) => Boolean(data.problem_analysis),
  },
  {
    id: 'constraints',
    title: 'Constraints',
    getHeadline: (data) => {
      const hardCount = data.constraints_and_metrics?.hard_constraints?.length || 0;
      const softCount = data.constraints_and_metrics?.soft_constraints?.length || 0;
      const total = hardCount + softCount;
      return total > 0
        ? `${total} constraints defined across hard and soft requirements`
        : 'Technical and business constraints';
    },
    getMetrics: (data) => {
      const metrics: Array<{ value: string; label: string }> = [];
      const cm = data.constraints_and_metrics;
      if (cm?.hard_constraints?.length) {
        metrics.push({ value: String(cm.hard_constraints.length), label: 'hard' });
      }
      if (cm?.soft_constraints?.length) {
        metrics.push({ value: String(cm.soft_constraints.length), label: 'soft' });
      }
      if (cm?.success_metrics?.length) {
        metrics.push({ value: String(cm.success_metrics.length), label: 'metrics' });
      }
      return metrics;
    },
    hasData: (data) => Boolean(data.constraints_and_metrics),
  },
  {
    id: 'challenge-frame',
    title: 'Challenge the Frame',
    getHeadline: (data) =>
      data.challenge_the_frame?.[0]?.assumption?.slice(0, 150) + '...' ||
      'Questioning assumptions and reframing the problem',
    getMetrics: (data) => {
      const metrics: Array<{ value: string; label: string }> = [];
      if (data.challenge_the_frame?.length) {
        metrics.push({
          value: String(data.challenge_the_frame.length),
          label: 'assumptions challenged',
        });
      }
      return metrics;
    },
    hasData: (data) =>
      Boolean(data.challenge_the_frame && data.challenge_the_frame.length > 0),
  },
  {
    id: 'solution-concepts',
    title: 'Solution Concepts',
    getHeadline: (data) =>
      data.execution_track?.primary?.title ||
      data.execution_track?.primary?.bottom_line?.slice(0, 150) + '...' ||
      'Primary recommendation and supporting concepts',
    getMetrics: (data) => {
      const metrics: Array<{ value: string; label: string }> = [];
      const primary = data.execution_track?.primary;
      if (primary?.confidence_detail?.level) {
        metrics.push({ value: primary.confidence_detail.level, label: 'confidence' });
      } else if (primary?.confidence !== undefined) {
        metrics.push({ value: `${primary.confidence}%`, label: 'confidence' });
      }
      if (data.execution_track?.supporting_concepts?.length) {
        metrics.push({
          value: String(data.execution_track.supporting_concepts.length),
          label: 'alternatives',
        });
      }
      return metrics;
    },
    hasData: (data) => Boolean(data.execution_track),
  },
  {
    id: 'innovation-concepts',
    title: 'Innovation Concepts',
    getHeadline: (data) =>
      data.innovation_portfolio?.recommended_innovation?.title ||
      data.innovation_portfolio?.recommended_innovation?.what_it_is?.slice(0, 150) + '...' ||
      'Higher-risk explorations with breakthrough potential',
    getMetrics: (data) => {
      const metrics: Array<{ value: string; label: string }> = [];
      if (data.innovation_portfolio?.parallel_investigations?.length) {
        metrics.push({
          value: String(data.innovation_portfolio.parallel_investigations.length),
          label: 'parallel investigations',
        });
      }
      return metrics;
    },
    hasData: (data) => Boolean(data.innovation_portfolio),
  },
  {
    id: 'frontier-tech',
    title: 'Frontier Watch',
    getHeadline: (data) => {
      const techs = data.innovation_portfolio?.frontier_watch;
      if (techs?.length) {
        return `${techs.length} technologies worth monitoring for future potential`;
      }
      return 'Technologies to watch';
    },
    getMetrics: (data) => {
      const metrics: Array<{ value: string; label: string }> = [];
      const techs = data.innovation_portfolio?.frontier_watch;
      if (techs?.length) {
        metrics.push({ value: String(techs.length), label: 'technologies' });
      }
      return metrics;
    },
    hasData: (data) =>
      Boolean(
        data.innovation_portfolio?.frontier_watch &&
          data.innovation_portfolio.frontier_watch.length > 0,
      ),
  },
  {
    id: 'risks',
    title: 'Risks & Watchouts',
    getHeadline: (data) =>
      data.risks_and_watchouts?.[0]?.risk?.slice(0, 150) + '...' ||
      'What could go wrong',
    getMetrics: (data) => {
      const metrics: Array<{ value: string; label: string }> = [];
      const risks = data.risks_and_watchouts;
      if (risks?.length) {
        metrics.push({ value: String(risks.length), label: 'risks' });
        const highRisk = risks.filter((r) => r.severity === 'high').length;
        if (highRisk > 0) {
          metrics.push({ value: String(highRisk), label: 'high severity' });
        }
      }
      return metrics;
    },
    hasData: (data) =>
      Boolean(data.risks_and_watchouts && data.risks_and_watchouts.length > 0),
  },
  {
    id: 'self-critique',
    title: 'Self-Critique',
    getHeadline: (data) => {
      const sc = data.self_critique;
      if (sc?.what_we_might_be_wrong_about?.[0]) {
        return sc.what_we_might_be_wrong_about[0].slice(0, 150) + '...';
      }
      return 'Where we might be wrong';
    },
    getMetrics: (data) => {
      const metrics: Array<{ value: string; label: string }> = [];
      const sc = data.self_critique;
      if (sc?.overall_confidence || sc?.confidence_level) {
        const level = sc.overall_confidence || sc.confidence_level;
        metrics.push({
          value: level!.charAt(0).toUpperCase() + level!.slice(1).toLowerCase(),
          label: 'confidence',
        });
      }
      if (sc?.validation_gaps?.length) {
        metrics.push({ value: String(sc.validation_gaps.length), label: 'validation gaps' });
      }
      return metrics;
    },
    hasData: (data) => Boolean(data.self_critique),
  },
  {
    id: 'recommendation',
    title: 'Final Recommendation',
    getHeadline: (data) =>
      data.strategic_integration?.personal_recommendation?.key_insight?.slice(0, 150) + '...' ||
      data.strategic_integration?.personal_recommendation?.intro?.slice(0, 150) + '...' ||
      'Personal recommendation from the analysis',
    getMetrics: () => [],
    hasData: (data) => Boolean(data.strategic_integration?.personal_recommendation),
  },
];

/**
 * Get sections that have data for a specific report
 */
export function getAvailableSections(data: HybridReportData): SectionConfig[] {
  return SECTION_CONFIG.filter((section) => section.hasData(data));
}
