/**
 * Type definitions for the Hybrid Report Display component.
 * Extracted from hybrid-report-display.tsx for maintainability.
 *
 * These types define the structure of hybrid mode report data,
 * including execution tracks, innovation portfolios, and analysis sections.
 */

// ============================================
// Execution Track + Innovation Portfolio Types
// ============================================

export interface WhereWeFoundIt {
  domain?: string;
  how_they_use_it?: string;
  why_it_transfers?: string;
}

export interface InsightBlock {
  what?: string;
  where_we_found_it?: WhereWeFoundIt;
  why_industry_missed_it?: string;
  physics?: string;
}

export interface ValidationGate {
  week?: string;
  test?: string;
  method?: string;
  success_criteria?: string;
  cost?: string;
  decision_point?: string;
}

export interface ExecutionTrackPrimary {
  id?: string;
  title?: string;
  score?: number;
  confidence?: number;
  source_type?: 'CATALOG' | 'TRANSFER' | 'OPTIMIZATION' | 'FIRST_PRINCIPLES';
  source?: string;
  bottom_line?: string;
  expected_improvement?: string;
  timeline?: string;
  investment?: string;
  why_safe?: {
    track_record?: string;
    precedent?: string[];
    failure_modes_understood?: boolean;
  };
  the_insight?: InsightBlock;
  what_it_is?: string;
  why_it_works?: string;
  why_it_might_fail?: string[];
  validation_gates?: ValidationGate[];
}

export interface SupportingConcept {
  id?: string;
  title?: string;
  relationship?: 'COMPLEMENTARY' | 'FALLBACK' | 'PREREQUISITE';
  one_liner?: string;
  what_it_is?: string;
  why_it_works?: string;
  when_to_use_instead?: string;
  confidence?: number;
  validation_summary?: string;
}

export interface ExecutionTrack {
  intro?: string;
  primary?: ExecutionTrackPrimary;
  supplier_arbitrage?: {
    who_to_call?: string;
    what_to_ask?: string[];
    what_to_push_back_on?: string[];
    what_they_wont_volunteer?: string[];
    how_to_verify?: string[];
    competitor_alternative?: string;
  };
  why_not_obvious?: {
    industry_gap?: string;
    knowledge_barrier?: string;
    our_contribution?: string;
  };
  supporting_concepts?: SupportingConcept[];
  fallback_trigger?: {
    conditions?: string[];
    pivot_to?: string;
    sunk_cost_limit?: string;
  };
}

export interface RecommendedInnovation {
  id?: string;
  title?: string;
  score?: number;
  confidence?: number;
  what_it_is?: string;
  why_it_works?: string;
  selection_rationale?: {
    why_this_one?: string;
    ceiling_if_works?: string;
    vs_execution_track?: string;
  };
  innovation_type?: string;
  source_domain?: string;
  the_insight?: InsightBlock;
  how_it_works?: string[];
  breakthrough_potential?: {
    if_it_works?: string;
    estimated_improvement?: string;
    industry_impact?: string;
  };
  risks?: {
    physics_risks?: string[];
    implementation_challenges?: string[];
    mitigation?: string[];
  };
  validation_path?: {
    gating_question?: string;
    first_test?: string;
    cost?: string;
    timeline?: string;
    go_no_go?: string;
  };
  relationship_to_execution_track?: {
    run_in_parallel?: boolean;
    when_to_elevate?: string;
    complementary?: boolean;
  };
}

export interface ParallelInvestigation {
  id?: string;
  title?: string;
  score?: number;
  confidence?: number;
  what_it_is?: string;
  why_it_works?: string;
  innovation_type?: string;
  source_domain?: string;
  one_liner?: string;
  the_insight?: InsightBlock;
  ceiling?: string;
  key_uncertainty?: string;
  validation_approach?: {
    test?: string;
    cost?: string;
    timeline?: string;
    go_no_go?: string;
  };
  when_to_elevate?: string;
  investment_recommendation?: string;
}

export interface FrontierWatch {
  id?: string;
  title?: string;
  one_liner?: string;
  innovation_type?: string;
  source_domain?: string;
  why_interesting?: string;
  why_not_now?: string;
  trigger_to_revisit?: string;
  who_to_monitor?: string;
  earliest_viability?: string;
  recent_developments?: string;
  trl_estimate?: number;
  competitive_activity?: string;
}

export interface InnovationPortfolio {
  intro?: string;
  recommended_innovation?: RecommendedInnovation;
  parallel_investigations?: ParallelInvestigation[];
  frontier_watch?: FrontierWatch[];
}

export interface HonestAssessment {
  problem_type?: string;
  expected_value_range?: {
    floor?: string;
    ceiling?: string;
    most_likely?: string;
  };
  candid_assessment?: string;
  if_value_is_limited?: string;
}

export interface CrossDomainSearch {
  enhanced_challenge_frame?: {
    reframing?: string;
    search_queries?: string[];
  };
  domains_searched?: Array<{
    domain?: string;
    mechanism_found?: string;
    relevance?: string;
  }>;
  from_scratch_revelations?: Array<{
    discovery?: string;
    source?: string;
    implication?: string;
  }>;
}

export interface StrategicIntegration {
  portfolio_view?: {
    execution_track_role?: string;
    innovation_portfolio_role?: string;
    combined_strategy?: string;
  };
  resource_allocation?: {
    execution_track_percent?: number;
    recommended_innovation_percent?: number;
    parallel_investigations_percent?: number;
    frontier_watch_percent?: number;
    rationale?: string;
  };
  decision_architecture?: {
    primary_tradeoff?: {
      question?: string;
      option_a?: {
        condition?: string;
        path?: string;
        what_you_get?: string;
        what_you_give_up?: string;
      };
      option_b?: {
        condition?: string;
        path?: string;
        what_you_get?: string;
        what_you_give_up?: string;
      };
      if_uncertain?: string;
    };
    flowchart?: string;
    summary?: string;
  };
  action_plan?: Array<{
    timeframe?: string;
    actions?: string[];
    rationale?: string;
    decision_gate?: string;
  }>;
  personal_recommendation?: {
    intro?: string;
    key_insight?: string;
  };
}

// ============================================
// Types for LLM Output Schema (AN5-M)
// ============================================

export interface EconomicsValue {
  value?: string;
  basis?: 'CALCULATED' | 'ESTIMATED' | 'ASSUMED';
  rationale?: string;
}

export interface SustainabilityFlag {
  type?:
    | 'NONE'
    | 'CAUTION'
    | 'BENEFIT'
    | 'LIFECYCLE_TRADEOFF'
    | 'IRONY'
    | 'SUPPLY_CHAIN';
  summary?: string | null;
  detail?: string | null;
  alternative?: string | null;
}

export interface CoupledEffect {
  domain?: string;
  effect?: string;
  direction?: 'BETTER' | 'WORSE' | 'NEUTRAL';
  magnitude?: 'MINOR' | 'MODERATE' | 'MAJOR';
  quantified?: string;
  mitigation?: string;
}

export interface IPConsiderations {
  freedom_to_operate?: 'GREEN' | 'YELLOW' | 'RED';
  rationale?: string;
  key_patents_to_review?: string[];
  patentability_potential?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_NOVEL';
}

export interface FirstValidationStep {
  gating_question?: string;
  test?: string;
  cost?: string;
  timeline?: string;
  go_no_go?: string;
  go_criteria?: string;
  no_go_criteria?: string;
}

export interface ProblemAnalysisBenchmark {
  entity?: string;
  approach?: string;
  current_performance?: string;
  target_roadmap?: string;
  source?: string;
}

export interface ProblemAnalysis {
  whats_wrong?: {
    prose?: string;
  };
  current_state_of_art?: {
    benchmarks?: ProblemAnalysisBenchmark[];
    no_competitors_note?: string | null;
  };
  what_industry_does_today?: Array<{
    approach?: string;
    limitation?: string;
  }>;
  why_its_hard?: {
    prose?: string;
    governing_equation?: {
      equation?: string;
      explanation?: string;
    };
    factors?: Array<{
      factor?: string;
      explanation?: string;
    }>;
  };
  first_principles_insight?: {
    headline?: string;
    explanation?: string;
  };
  root_cause_hypotheses?: Array<{
    id?: number;
    name?: string;
    confidence_percent?: number;
    confidence?: string;
    explanation?: string;
    hypothesis?: string;
    evidence?: string;
    implication?: string;
  }>;
  success_metrics?: Array<{
    metric?: string;
    target?: string;
    minimum_viable?: string;
    stretch?: string;
    unit?: string;
  }>;
}

export interface ConstraintsAndMetrics {
  hard_constraints?: string[];
  soft_constraints?: string[];
  assumptions?: string[];
  success_metrics?: Array<{
    metric?: string;
    target?: string;
    minimum_viable?: string;
    stretch?: string;
    unit?: string;
  }>;
}

export interface ChallengeTheFrame {
  assumption?: string;
  challenge?: string;
  implication?: string;
}

export interface RiskAndWatchout {
  category?: string;
  risk?: string;
  severity?: 'high' | 'medium' | 'low';
  mitigation?: string;
}

export interface InnovationAnalysis {
  domains_searched?: string[];
  reframe?: string;
}

// ============================================
// Component-Specific Types
// ============================================

export interface StructuredExecutiveSummary {
  narrative_lead?: string;
  viability?: string;
  viability_label?: string;
  the_problem?: string;
  core_insight?: {
    headline?: string;
    explanation?: string;
  };
  primary_recommendation?: string;
  recommended_path?: Array<{
    step?: number;
    action?: string;
    rationale?: string;
  }>;
}

export interface TestStep {
  name?: string;
  description?: string;
  success_criteria?: string;
  estimated_time?: string;
  estimated_cost?: string;
}

export interface Risk {
  risk?: string;
  likelihood?: string;
  impact?: string;
  mitigation?: string;
}

export interface PriorArt {
  source?: string;
  relevance?: string;
  what_it_proves?: string;
}

export interface ConceptRecommendation {
  id?: string;
  title?: string;
  track?: string;
  executive_summary?: string;
  why_it_wins?: string;
  confidence_level?: string;
  estimated_timeline?: string;
  estimated_investment?: string;
  how_to_test?: TestStep[];
  key_risks?: Risk[];
  prior_art_summary?: PriorArt[];
}

export interface ParallelConcept {
  id?: string;
  title?: string;
  track?: string;
  one_liner?: string;
  merit_score?: number;
  when_to_consider?: string;
}

export interface ValidationGap {
  concern: string;
  status: 'ADDRESSED' | 'EXTENDED_NEEDED' | 'ACCEPTED_RISK';
  rationale: string;
}

export interface SelfCritique {
  confidence_level?: string;
  overall_confidence?: string;
  confidence_rationale?: string;
  what_we_might_be_wrong_about?: string[];
  unexplored_directions?: string[];
  validation_gaps?: ValidationGap[];
}

export interface HybridReportData {
  title?: string;
  executive_summary?: string | StructuredExecutiveSummary;
  problem_restatement?: string;
  key_insights?: string[];
  next_steps?: string[];
  decision_architecture?: {
    primary?: ConceptRecommendation;
    fallback?: ConceptRecommendation;
    parallel_exploration?: ParallelConcept[];
  };
  other_concepts?: ParallelConcept[];
  self_critique?: SelfCritique;
  honest_assessment?: HonestAssessment;
  cross_domain_search?: CrossDomainSearch;
  execution_track?: ExecutionTrack;
  innovation_portfolio?: InnovationPortfolio;
  strategic_integration?: StrategicIntegration;
  brief?: string;
  problem_analysis?: ProblemAnalysis;
  constraints_and_metrics?: ConstraintsAndMetrics;
  challenge_the_frame?: ChallengeTheFrame[];
  risks_and_watchouts?: RiskAndWatchout[];
  what_id_actually_do?: string;
  follow_up_prompts?: string[];
  innovation_analysis?: InnovationAnalysis;
}

export interface HybridReportDisplayProps {
  reportData: {
    mode: 'hybrid';
    report?: HybridReportData;
  };
  /**
   * Use the new brand system styling (Air Company aesthetic)
   * @default true
   */
  useBrandSystem?: boolean;
  /**
   * Whether to show the fixed sidebar TOC when using brand system.
   * Set to false when embedding in a page with its own TOC.
   * @default true
   */
  showToc?: boolean;
  /**
   * The user's original input/brief for this report.
   * Displayed at the top of the report before the Executive Summary.
   */
  brief?: string;
  /**
   * The report title from the database.
   * Takes precedence over any title in the report data.
   */
  title?: string;
  /**
   * When the report was created (ISO string).
   * Used to display the report date in metadata.
   */
  createdAt?: string;
  /**
   * Whether the report is inside a layout with the app sidebar.
   * When true (default), TOC is positioned at left-16 to clear the app sidebar.
   * When false (landing page), TOC is at left-0.
   * @default true
   */
  hasAppSidebar?: boolean;
  /**
   * Whether the chat drawer is open.
   * When true, TOC is hidden and content shifts right to make room.
   * @default false
   */
  isChatOpen?: boolean;
  /**
   * Whether to show action buttons (Share, Export).
   * Set to false for landing page examples.
   * @default true
   */
  showActions?: boolean;
  /**
   * The report ID for share/export functionality.
   * Required when showActions is true.
   */
  reportId?: string;
}
