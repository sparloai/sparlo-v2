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

export type PhaseId = (typeof PHASES)[number]['id'];

/**
 * Phase labels for display (maps phase ID to human-readable description)
 */
export const PHASE_LABELS: Record<string, string> = Object.fromEntries(
  PHASES.map((phase) => [phase.id, phase.description]),
);

/**
 * Get human-readable label for a phase
 */
export function getPhaseLabel(step: string | null): string {
  if (!step) return 'Starting analysis...';
  return PHASE_LABELS[step] ?? `Processing: ${step}`;
}

/**
 * Calculate overall progress percentage based on current step
 */
export function calculateOverallProgress(step: string | null): number {
  if (!step) return 0;
  const phase = PHASES.find((p) => p.id === step);
  return phase?.progress ?? 0;
}

/**
 * Get phase by ID
 */
export function getPhaseById(id: string) {
  return PHASES.find((p) => p.id === id);
}
