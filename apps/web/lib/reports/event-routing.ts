'use server';

import 'server-only';

import type { ReportMode } from '~/lib/types';

/**
 * Type-safe mapping of report modes to clarification events.
 *
 * This is the SINGLE SOURCE OF TRUTH for event routing.
 * When adding a new report mode, you MUST update this mapping.
 *
 * CRITICAL: If you add a new mode to ReportMode type, it MUST appear here.
 * The TypeScript compiler will help catch this if ReportMode is a union type.
 */
const CLARIFICATION_EVENT_MAP: Record<ReportMode, string> = {
  discovery: 'report/discovery-clarification-answered',
  hybrid: 'report/hybrid-clarification-answered',
  dd: 'report/dd-clarification-answered',
};

/**
 * Get the correct clarification event name for a report mode.
 *
 * Use this function instead of hardcoding event names in server actions.
 * This ensures all code uses the same event routing logic.
 *
 * @param mode - The report mode (discovery, hybrid, dd, etc.)
 * @returns The Inngest event name to send when answering clarification
 * @throws Error if mode is not recognized
 *
 * @example
 * ```typescript
 * const eventName = getClarificationEventName(reportData.mode);
 * await inngest.send({
 *   name: eventName,
 *   data: { reportId, answer },
 * });
 * ```
 */
export function getClarificationEventName(mode: string | undefined): string {
  if (!mode || !(mode in CLARIFICATION_EVENT_MAP)) {
    const supportedModes = Object.keys(CLARIFICATION_EVENT_MAP);
    throw new Error(
      `Unknown report mode: "${mode}". ` +
        `Supported modes: ${supportedModes.join(', ')}. ` +
        `If adding a new mode, update CLARIFICATION_EVENT_MAP in event-routing.ts ` +
        `(file: /apps/web/lib/reports/event-routing.ts)`,
    );
  }

  return CLARIFICATION_EVENT_MAP[mode as ReportMode];
}

/**
 * Get all supported report modes.
 * Useful for validation, error messages, and UI enumeration.
 *
 * @returns Array of all supported report modes
 *
 * @example
 * ```typescript
 * const modes = getSupportedReportModes();
 * console.log(modes); // ['discovery', 'hybrid', 'dd']
 * ```
 */
export function getSupportedReportModes(): ReportMode[] {
  return Object.keys(CLARIFICATION_EVENT_MAP) as ReportMode[];
}

/**
 * Validate that a report mode is supported.
 * This is a type guard - narrows unknown to ReportMode if true.
 *
 * @param mode - The mode to validate
 * @returns true if mode is supported, false otherwise
 *
 * @example
 * ```typescript
 * if (isSupportedReportMode(mode)) {
 *   // mode is now typed as ReportMode
 *   const event = getClarificationEventName(mode);
 * }
 * ```
 */
export function isSupportedReportMode(mode: unknown): mode is ReportMode {
  return typeof mode === 'string' && mode in CLARIFICATION_EVENT_MAP;
}

/**
 * Get metadata about a report mode's events.
 * Useful for understanding the event chain for a mode.
 *
 * @param mode - The report mode
 * @returns Object with clarification and generation event names
 *
 * @example
 * ```typescript
 * const { clarificationEvent, generateEvent } = getModeEventNames('hybrid');
 * // { clarificationEvent: 'report/hybrid-clarification-answered', ... }
 * ```
 */
export function getModeEventNames(mode: ReportMode): {
  clarificationEvent: string;
  generateEvent: string;
} {
  const clarificationEvent = getClarificationEventName(mode);
  const generateEvent = `report/generate-${mode}`;

  return {
    clarificationEvent,
    generateEvent,
  };
}
