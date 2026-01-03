/**
 * Shared phase definitions for report generation workflow.
 * P2: Consolidated from multiple files to ensure consistency.
 */

export const PHASES = [
  {
    id: 'an0',
    name: 'Problem Framing',
    label: 'Problem Framing',
    description: 'Understanding your challenge',
    progress: 0,
  },
  {
    id: 'an2',
    name: 'Pattern Synthesis',
    label: 'Pattern Synthesis',
    description: 'Finding innovation patterns',
    progress: 20,
  },
  {
    id: 'an3',
    name: 'Concept Generation',
    label: 'Concept Generation',
    description: 'Creating solution concepts',
    progress: 40,
  },
  {
    id: 'an4',
    name: 'Evaluation',
    label: 'Evaluation',
    description: 'Scoring and ranking',
    progress: 60,
  },
  {
    id: 'an5',
    name: 'Report Writing',
    label: 'Report Writing',
    description: 'Compiling your report',
    progress: 80,
  },
  {
    id: 'complete',
    name: 'Complete',
    label: 'Complete',
    description: 'Report complete',
    progress: 100,
  },
] as const;

/**
 * DD Mode phase definitions for Due Diligence reports.
 * DD wraps around AN chain: DD0 → AN0-AN3 → DD3 → DD4 → DD5
 */
export const DD_PHASES = [
  {
    id: 'dd0-m',
    name: 'Claim Extraction',
    label: 'Claim Extraction',
    description: 'Extracting claims from startup materials',
    progress: 0,
  },
  {
    id: 'an0-m',
    name: 'Problem Framing',
    label: 'Problem Framing',
    description: 'First-principles problem framing',
    progress: 10,
  },
  {
    id: 'an1.5-m',
    name: 'Teaching Selection',
    label: 'Teaching Selection',
    description: 'Selecting analysis exemplars',
    progress: 20,
  },
  {
    id: 'an1.7-m',
    name: 'Literature Search',
    label: 'Literature Search',
    description: 'Finding prior art and precedent',
    progress: 30,
  },
  {
    id: 'an2-m',
    name: 'Methodology Briefing',
    label: 'Methodology Briefing',
    description: 'TRIZ analysis guidance',
    progress: 40,
  },
  {
    id: 'an3-m',
    name: 'Solution Space',
    label: 'Solution Space',
    description: 'Generating full solution landscape',
    progress: 50,
  },
  {
    id: 'dd3-m',
    name: 'Claim Validation',
    label: 'Claim Validation',
    description: 'Validating claims against physics and TRIZ',
    progress: 65,
  },
  {
    id: 'dd4-m',
    name: 'Moat Assessment',
    label: 'Moat Assessment',
    description: 'Mapping approach and assessing defensibility',
    progress: 80,
  },
  {
    id: 'dd5-m',
    name: 'DD Report',
    label: 'DD Report',
    description: 'Generating investor-facing DD report',
    progress: 95,
  },
] as const;

export type DDPhaseId = (typeof DD_PHASES)[number]['id'];

export type PhaseId = (typeof PHASES)[number]['id'];

/**
 * Phase labels for display (maps phase ID to human-readable description)
 * Includes both standard and DD phases
 */
export const PHASE_LABELS: Record<string, string> = {
  ...Object.fromEntries(PHASES.map((phase) => [phase.id, phase.description])),
  ...Object.fromEntries(
    DD_PHASES.map((phase) => [phase.id, phase.description]),
  ),
};

/**
 * Get human-readable label for a phase
 */
export function getPhaseLabel(step: string | null): string {
  if (!step) return 'Starting analysis...';
  return PHASE_LABELS[step] ?? `Processing: ${step}`;
}

/**
 * Calculate overall progress percentage based on current step
 * Handles both standard and DD phases
 */
export function calculateOverallProgress(step: string | null): number {
  if (!step) return 0;

  // Check standard phases first
  const standardPhase = PHASES.find((p) => p.id === step);
  if (standardPhase) return standardPhase.progress;

  // Check DD phases
  const ddPhase = DD_PHASES.find((p) => p.id === step);
  if (ddPhase) return ddPhase.progress;

  return 0;
}

/**
 * Get phase by ID (checks both standard and DD phases)
 */
export function getPhaseById(id: string) {
  return PHASES.find((p) => p.id === id) || DD_PHASES.find((p) => p.id === id);
}

/**
 * Check if a step is a DD mode step
 */
export function isDDPhase(step: string | null): boolean {
  if (!step) return false;
  return step.endsWith('-m') || step.startsWith('dd');
}
