import {
  type SparloReport,
  SparloReportSchema,
} from './schema/sparlo-report.schema';

const MAX_INPUT_LENGTH = 10_000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Type guard for Record<string, unknown>
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Safely extract and validate structured report data.
 * Falls back to null if data is missing or invalid.
 * In v12, SparloReport is stored directly in report_data (not nested under .report).
 */
export function extractStructuredReport(
  reportData: unknown,
): SparloReport | null {
  if (!reportData || !isRecord(reportData)) return null;

  try {
    // v12: Report data is stored directly at the top level (matching SparloReportSchema)
    // The report_data object IS the SparloReport structure
    const validated = SparloReportSchema.safeParse(reportData);

    if (!validated.success) {
      if (!IS_PRODUCTION) {
        console.warn('Report validation failed:', validated.error.flatten());
      }
      return null;
    }

    return validated.data;
  } catch (error) {
    if (!IS_PRODUCTION) {
      console.error('Failed to extract structured report:', error);
    }
    return null;
  }
}

/**
 * Extract user input from report data for display.
 * Accepts unknown type to avoid unsafe type assertions at call sites.
 *
 * Priority order:
 * 1. report.brief (hybrid report user input)
 * 2. chainState.userInput (legacy)
 * 3. messages[0].content (chat format)
 * 4. fallbackTitle
 */
export function extractUserInput(
  reportData: unknown,
  fallbackTitle: string,
): string {
  if (!reportData || !isRecord(reportData)) {
    return fallbackTitle.slice(0, MAX_INPUT_LENGTH);
  }

  // Check for hybrid report brief field (report.brief)
  const report = isRecord(reportData.report) ? reportData.report : undefined;
  const reportBrief =
    typeof report?.brief === 'string' ? report.brief : undefined;

  if (reportBrief?.trim()) {
    return reportBrief.trim().slice(0, MAX_INPUT_LENGTH);
  }

  // Check for chainState.userInput (legacy)
  const chainState = isRecord(reportData.chainState)
    ? reportData.chainState
    : undefined;
  const userInput =
    typeof chainState?.userInput === 'string'
      ? chainState.userInput
      : undefined;

  if (userInput?.trim()) {
    return userInput.trim().slice(0, MAX_INPUT_LENGTH);
  }

  // Check for messages[0].content (chat format)
  const messages = Array.isArray(reportData.messages)
    ? (reportData.messages as Array<{ content?: string }>)
    : undefined;
  const firstMessage = messages?.[0]?.content;

  if (typeof firstMessage === 'string' && firstMessage.trim()) {
    return firstMessage.trim().slice(0, MAX_INPUT_LENGTH);
  }

  return fallbackTitle.slice(0, MAX_INPUT_LENGTH);
}
