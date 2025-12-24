import 'server-only';

// Re-export shared types for PDF generation
export type {
  ReportForPDF,
  ReportData as ReportPDFData,
} from '~/home/(user)/reports/_lib/types/report-data.types';

// Re-export hybrid report types for comprehensive PDF rendering
export type {
  HybridReportData,
  StructuredExecutiveSummary,
  ConceptRecommendation,
  ExecutionTrack,
  ExecutionTrackPrimary,
  SupportingConcept,
  InnovationPortfolio,
  RecommendedInnovation,
  ParallelInvestigation,
  FrontierWatch,
  ProblemAnalysis,
  RiskAndWatchout,
  SelfCritique,
  StrategicIntegration,
  InsightBlock,
} from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';
