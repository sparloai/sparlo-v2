// Types matching the FastAPI backend models

export type ConversationStatus =
  | 'clarifying'
  | 'processing'
  | 'complete'
  | 'error'
  | 'confirm_rerun';
export type ViabilityLight = 'Green' | 'Yellow' | 'Red';

export interface ChatResponse {
  conversation_id: string;
  message: string;
  status: ConversationStatus;
  current_step?: string;
  estimated_time_minutes?: number;
  report?: string;
}

export interface StatusResponse {
  conversation_id: string;
  status: ConversationStatus;
  current_step?: string;
  completed_steps: string[];
  message?: string;
  report?: string;
}

export interface ReportResponse {
  conversation_id: string;
  viability: ViabilityLight;
  executive_summary: string;
  report_markdown: string;
  top_recommendation: Record<string, unknown>;
  test_first: Record<string, unknown>;
  shortlist: ShortlistItem[];
  patterns: Pattern[];
  corpus_citations: Record<string, unknown>;
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

// Frontend-specific types
export type AppState = 'input' | 'processing' | 'complete';

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
