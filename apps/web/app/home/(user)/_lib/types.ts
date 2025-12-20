// Types matching the FastAPI backend models
// Includes Zod schemas for runtime validation of API responses
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// ZOD SCHEMAS - Runtime validation for API responses
// ═══════════════════════════════════════════════════════════════════════════

export const ConversationStatusSchema = z.enum([
  'clarifying',
  'processing',
  'complete',
  'error',
  'failed',
  'confirm_rerun',
]);

export const ViabilityLightSchema = z.enum(['Green', 'Yellow', 'Red']);

export const ChatResponseSchema = z.object({
  conversation_id: z.string(),
  message: z.string(),
  status: ConversationStatusSchema,
  current_step: z.string().optional(),
  /**
   * Estimated processing time in minutes.
   * Using .nullish() to accept: number | null | undefined
   * (Backend Pydantic may omit field OR explicitly set to null)
   */
  estimated_time_minutes: z.number().nullish(),
  /**
   * Full report markdown. Present only when status is `complete`.
   * Using .nullish() to accept: string | null | undefined
   */
  report: z.string().nullish(),
  /**
   * Chain state for stateless mode. Present when status is `clarifying`.
   * Frontend stores this and sends it back with the clarification response.
   * This enables the backend to work without in-memory state persistence.
   */
  chain_state: z.record(z.unknown()).nullish(),
});

export const StatusResponseSchema = z.object({
  conversation_id: z.string(),
  status: ConversationStatusSchema,
  current_step: z.string().optional(),
  completed_steps: z.array(z.string()),
  message: z.string().optional(),
  /** Using .nullish() for consistency with ChatResponseSchema */
  report: z.string().nullish(),
});

export const ShortlistItemSchema = z.object({
  concept_id: z.string(),
  title: z.string(),
  rank: z.number(),
  total_score: z.number(),
  rationale: z.string(),
});

export const PatternSchema = z.object({
  pattern_id: z.string(),
  title: z.string(),
  mechanism_refs: z.array(z.string()),
  seed_refs: z.array(z.string()),
  description: z.string(),
});

// Specific types for report response fields (replacing Record<string, unknown>)
export const TopRecommendationSchema = z.object({
  title: z.string().optional(),
  one_liner: z.string().optional(),
});

export const TestFirstSchema = z.object({
  test_name: z.string().optional(),
  method: z.string().optional(),
  go_threshold: z.string().optional(),
  no_go_threshold: z.string().optional(),
  fallback: z.string().optional(),
});

export const CorpusCitationSchema = z.object({
  source_type: z.string().optional(),
  title: z.string().optional(),
  reference: z.string().optional(),
});

export const ReportResponseSchema = z.object({
  conversation_id: z.string(),
  viability: ViabilityLightSchema,
  executive_summary: z.string(),
  report_markdown: z.string(),
  top_recommendation: TopRecommendationSchema,
  test_first: TestFirstSchema,
  shortlist: z.array(ShortlistItemSchema),
  patterns: z.array(PatternSchema),
  corpus_citations: z.record(z.string(), CorpusCitationSchema),
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTED TYPES - Inferred from Zod schemas (single source of truth)
// This eliminates type drift between runtime validation and TypeScript types
// ═══════════════════════════════════════════════════════════════════════════

export type ConversationStatus = z.infer<typeof ConversationStatusSchema>;
export type ViabilityLight = z.infer<typeof ViabilityLightSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type StatusResponse = z.infer<typeof StatusResponseSchema>;

// Specific types for report fields (replacing Record<string, unknown>)
export interface TopRecommendation {
  title?: string;
  one_liner?: string;
}

export interface TestFirst {
  test_name?: string;
  method?: string;
  go_threshold?: string;
  no_go_threshold?: string;
  fallback?: string;
}

export interface CorpusCitation {
  source_type?: string;
  title?: string;
  reference?: string;
}

export interface ReportResponse {
  conversation_id: string;
  viability: ViabilityLight;
  executive_summary: string;
  report_markdown: string;
  top_recommendation: TopRecommendation;
  test_first: TestFirst;
  shortlist: ShortlistItem[];
  patterns: Pattern[];
  corpus_citations: Record<string, CorpusCitation>;
}

export interface ShortlistItem {
  concept_id: string;
  title: string;
  rank: number;
  total_score: number;
  rationale: string;
}

export interface Pattern {
  pattern_id: string;
  title: string;
  mechanism_refs: string[];
  seed_refs: string[];
  description: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORT LIST TYPES - Shared across dashboard components
// ═══════════════════════════════════════════════════════════════════════════

export type ReportMode = 'discovery' | 'standard';

export const REPORT_MODE_LABELS: Record<ReportMode, string> = {
  discovery: 'Discovery',
  standard: 'Analysis',
} as const;

export interface DashboardReportData {
  solution_concepts?: {
    lead_concepts?: unknown[];
    other_concepts?: unknown[];
    spark_concept?: unknown;
  };
  headline?: string;
  mode?: string;
}

export interface RawReportRow {
  id: string;
  title: string;
  headline: string | null;
  status: string;
  current_step: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
  report_data: DashboardReportData | null;
  error_message: string | null;
}

export interface DashboardReport {
  id: string;
  title: string;
  headline: string | null;
  status: ConversationStatus;
  current_step?: string | null;
  created_at: string;
  updated_at: string;
  archived?: boolean;
  concept_count: number;
  error_message?: string | null;
  mode: ReportMode;
}

// Frontend-specific types
export type AppState = 'input' | 'processing' | 'complete';

// Explicit UI phases - all possible states the UI can be in
// This replaces the implicit phase derivation from multiple state variables
export type UIPhase =
  | 'input' // User can type initial message
  | 'analyzing' // Analyzing user's message before clarification/processing
  | 'clarifying' // Waiting for clarification response from user
  | 'processing' // Report is being generated
  | 'complete' // Report is ready
  | 'error'; // An error occurred

// Report data as stored/used by the frontend
export interface ReportData {
  viability: string | null;
  executive_summary: string;
  report_markdown: string;
  top_recommendation: TopRecommendation;
  shortlist: ShortlistItem[];
  patterns: Pattern[];
}

export interface Conversation {
  id: string;
  title: string;
  status: ConversationStatus;
  created_at: Date;
  updated_at: Date;
  archived?: boolean;
  pinned?: boolean;
  lastMessage?: string;
  messageCount?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChainStep {
  id: string;
  name: string;
  description: string;
  estimatedMinutes: number;
}

export const CHAIN_STEPS: ChainStep[] = [
  {
    id: 'AN0',
    name: 'Problem Framing',
    description: 'Understanding your challenge',
    estimatedMinutes: 0.5,
  },
  {
    id: 'AN1',
    name: 'Knowledge Search',
    description: 'Searching knowledge base',
    estimatedMinutes: 0.5,
  },
  {
    id: 'AN2',
    name: 'Pattern Synthesis',
    description: 'Finding patterns across domains',
    estimatedMinutes: 1.5,
  },
  {
    id: 'AN3',
    name: 'Concept Generation',
    description: 'Creating solution concepts',
    estimatedMinutes: 2,
  },
  {
    id: 'AN4',
    name: 'Evaluation',
    description: 'Scoring and ranking concepts',
    estimatedMinutes: 1,
  },
  {
    id: 'AN5',
    name: 'Report Writing',
    description: 'Generating design report',
    estimatedMinutes: 1.5,
  },
];

export function getStepIndex(stepId: string): number {
  if (stepId === 'AN1.5' || stepId === 'AN1.7') return 1;
  return CHAIN_STEPS.findIndex((s) => s.id === stepId);
}

export function getEstimatedTimeRemaining(currentStep: string): number {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex === -1) return 0;

  let remaining = 0;
  for (let i = currentIndex; i < CHAIN_STEPS.length; i++) {
    const step = CHAIN_STEPS[i];
    if (step) {
      remaining += step.estimatedMinutes;
    }
  }
  return Math.ceil(remaining);
}

// Progress phases for UI display
export interface ProgressPhase {
  id: string;
  label: string;
  duration: [number, number];
}

export const PROGRESS_PHASES: ProgressPhase[] = [
  { id: 'analyzing', label: 'Analyzing your challenge', duration: [0, 15] },
  { id: 'researching', label: 'Researching solutions', duration: [15, 45] },
  { id: 'evaluating', label: 'Evaluating approaches', duration: [45, 75] },
  { id: 'preparing', label: 'Preparing recommendations', duration: [75, 100] },
];

// ═══════════════════════════════════════════════════════════════════════════
// INPUT QUALITY ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

export type InputQuality = 'minimal' | 'good' | 'great' | 'excellent';

export interface InputQualityChecks {
  hasChallenge: boolean;
  hasConstraints: boolean;
  hasGoals: boolean;
  hasContext: boolean;
}

export interface InputQualityResult {
  checks: InputQualityChecks;
  quality: InputQuality;
  passedChecks: number;
}

const MIN_CHARS = 30;

export function analyzeInputQuality(text: string): InputQualityResult {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const checks: InputQualityChecks = {
    hasChallenge: text.length >= MIN_CHARS,
    hasConstraints:
      /constraint|must|require|limit|cannot|can't|need to|within|maximum|minimum|at least|at most/i.test(
        text,
      ),
    hasGoals:
      /goal|target|achieve|want|looking for|trying to|objective|outcome|result/i.test(
        text,
      ),
    hasContext: wordCount >= 30,
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const quality: InputQuality =
    passedChecks <= 1
      ? 'minimal'
      : passedChecks <= 2
        ? 'good'
        : passedChecks <= 3
          ? 'great'
          : 'excellent';

  return { checks, quality, passedChecks };
}

// ═══════════════════════════════════════════════════════════════════════════
// FULL REPORT TYPES (Structured Format)
// ═══════════════════════════════════════════════════════════════════════════

export type ViabilityLevel = 'GREEN' | 'YELLOW' | 'RED';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface ReportConstraint {
  quote: string;
  note?: string;
}

export interface ReportAssumption {
  item: string;
  interpretation: string;
}

export interface RootCause {
  title: string;
  description: string;
  confidence: ConfidenceLevel;
}

export interface ReportAnalysis {
  constraints: ReportConstraint[];
  assumptions: ReportAssumption[];
  whatIsWrong: string;
  whyHard: string;
  rootCauses: RootCause[];
  successMetrics: string[];
}

export interface ConceptMetric {
  label: string;
  value: string;
  score?: number;
}

export interface ReportConcept {
  id: string;
  name: string;
  summary: string;
  description: string;
  confidence: ConfidenceLevel;
  metrics: ConceptMetric[];
  rationale: string;
  risks: string[];
  testProtocol: string;
}

export interface ReportConcepts {
  lead: ReportConcept[];
  other: ReportConcept[];
  innovative?: ReportConcept;
}

export interface DecisionRule {
  condition: string;
  recommendation: string;
}

export interface FrameChallenge {
  question: string;
  exploration: string;
}

export interface ReportRisk {
  title: string;
  description: string;
}

export interface NextStep {
  action: string;
  detail?: string;
}

export interface TestProtocol {
  conceptName: string;
  steps: string[];
  goNoGo: string;
}

export interface ReportSource {
  type: string;
  title: string;
  reference?: string;
}

export interface FullReport {
  id: string;
  title: string;
  generatedAt: Date;
  challenge: string;
  executiveSummary: {
    paragraphs: string[];
  };
  viability: {
    level: ViabilityLevel;
    summary: string;
  };
  analysis: ReportAnalysis;
  concepts: ReportConcepts;
  decisionArchitecture: DecisionRule[];
  personalRecommendation: string;
  challengeTheFrame: FrameChallenge[];
  risks: ReportRisk[];
  nextSteps: NextStep[];
  testProtocols?: TestProtocol[];
  sources?: ReportSource[];
}
