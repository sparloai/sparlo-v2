/**
 * Sparlo Prompt Chain Definitions
 *
 * This module exports the prompt templates for each step in the
 * Sparlo analysis chain (AN0-AN5).
 *
 * Chain Steps:
 * - AN0: Problem Framing
 * - AN1: Knowledge Search
 * - AN2: Pattern Synthesis
 * - AN3: Concept Generation
 * - AN4: Evaluation
 * - AN5: Report Writing (final output)
 */

export {
  AN5_METADATA,
  AN5_REPORT_PROMPT,
  REPORT_SECTIONS,
  type ReportSection,
} from './an5-report-prompt';
