import { AN5OutputSchema, type Report } from '~/lib/llm/prompts/an5-report';

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
 * Accepts unknown type to avoid unsafe type assertions at call sites.
 */
export function extractStructuredReport(reportData: unknown): Report | null {
  if (!reportData || !isRecord(reportData)) return null;

  try {
    // Report is stored directly at reportData.report (not nested in chainState)
    const report = reportData.report;

    if (!report) return null;

    // Validate against the actual AN5 schema
    const validated = AN5OutputSchema.shape.report.safeParse(report);

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
 */
export function extractUserInput(
  reportData: unknown,
  fallbackTitle: string,
): string {
  if (!reportData || !isRecord(reportData)) {
    return fallbackTitle.slice(0, MAX_INPUT_LENGTH);
  }

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

  const messages = Array.isArray(reportData.messages)
    ? (reportData.messages as Array<{ content?: string }>)
    : undefined;
  const firstMessage = messages?.[0]?.content;

  if (typeof firstMessage === 'string' && firstMessage.trim()) {
    return firstMessage.trim().slice(0, MAX_INPUT_LENGTH);
  }

  return fallbackTitle.slice(0, MAX_INPUT_LENGTH);
}
