/**
 * Shared type definitions for report data structures.
 * Used across PDF generation, public sharing, and authenticated views.
 *
 * Note: This file contains only type definitions (no runtime code),
 * so it can be safely imported by both server and client components.
 */

// Core insight within executive summary
export interface CoreInsight {
  headline?: string;
  explanation?: string;
}

// Executive summary structure
export interface ExecutiveSummary {
  narrative_lead?: string;
  core_insight?: CoreInsight;
  the_problem?: string;
  primary_recommendation?: string;
  recommended_path?: Array<{
    step_number: number;
    content: string;
  }>;
}

// Concept recommendation for decision architecture
export interface ConceptRecommendation {
  id?: string;
  title?: string;
  executive_summary?: string;
  why_it_wins?: string;
  confidence_level?: string;
  estimated_timeline?: string;
  estimated_investment?: string;
  track_label?: string;
  bottom_line?: string;
  what_it_is?: string;
}

// Problem analysis section
export interface ProblemAnalysis {
  whats_wrong?: {
    prose: string;
  };
  why_its_hard?: {
    prose: string;
    factors?: string[];
  };
}

// Solution concepts section
export interface SolutionConcepts {
  lead_concepts?: Array<{
    id: string;
    title: string;
    track_label?: string;
    bottom_line?: string;
    what_it_is?: string;
  }>;
}

// Next steps section
export interface NextSteps {
  steps?: Array<{
    step_number: number;
    timeframe?: string;
    action: string;
    details?: string;
  }>;
}

// Risk item
export interface RiskItem {
  name: string;
  description: string;
  mitigation?: string;
}

// Full report data structure (flexible to handle different report modes)
export interface ReportData {
  mode?: 'discovery' | 'hybrid' | 'standard' | string;
  report?: {
    executive_summary?: string | ExecutiveSummary;
    problem_restatement?: string;
    key_insights?: string[];
    next_steps?: string[];
    decision_architecture?: {
      primary?: ConceptRecommendation;
      fallback?: ConceptRecommendation;
    };
  };
  // PDF-specific structure (for standard reports)
  executive_summary?: ExecutiveSummary;
  problem_analysis?: ProblemAnalysis;
  solution_concepts?: SolutionConcepts;
  next_steps?: NextSteps;
  risks_and_watchouts?: RiskItem[];
}

// Base report interface (shared fields)
export interface BaseReport {
  id: string;
  title: string;
  headline: string | null;
  created_at: string;
}

// Report for public sharing
export interface SharedReport extends BaseReport {
  report_data: ReportData | null;
}

// Report for PDF generation
export interface ReportForPDF extends BaseReport {
  report_data: ReportData | null;
}

// Report with share info (for API responses)
export interface ReportShareInfo {
  shared: boolean;
  shareToken?: string;
  shareUrl?: string;
  createdAt?: string;
  accessCount?: number;
  lastAccessedAt?: string | null;
}
