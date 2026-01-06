import 'server-only';

// Re-export shared types for PDF generation
export type {
  ReportForPDF,
  ReportData as ReportPDFData,
} from '~/app/reports/_lib/types/report-data.types';

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
  ProblemAnalysisBenchmark,
  RiskAndWatchout,
  SelfCritique,
  ValidationGap,
  InsightBlock,
  ValidationGate,
  ConstraintsAndMetrics,
  ChallengeTheFrame,
  InnovationAnalysis,
  WhereWeFoundIt,
  CoupledEffect,
  SustainabilityFlag,
  IPConsiderations,
  HonestAssessment,
  CrossDomainSearch,
  StrategicIntegration,
} from '~/app/reports/_lib/types/hybrid-report-display.types';
