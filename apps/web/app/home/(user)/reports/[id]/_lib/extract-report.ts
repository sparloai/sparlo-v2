import { AN5OutputSchema, type Report } from '~/lib/llm/prompts/an5-report';

/**
 * Safely extract and validate structured report data.
 * Falls back to null if data is missing or invalid.
 */
export function extractStructuredReport(
  reportData: Record<string, unknown> | null,
): Report | null {
  if (!reportData) return null;

  try {
    // Report is stored directly at reportData.report (not nested in chainState)
    const report = reportData.report;

    if (!report) return null;

    // Validate against the actual AN5 schema
    const validated = AN5OutputSchema.shape.report.safeParse(report);

    if (!validated.success) {
      console.warn('Report validation failed:', validated.error.flatten());
      return null;
    }

    return validated.data;
  } catch (error) {
    console.error('Failed to extract structured report:', error);
    return null;
  }
}

export function extractUserInput(
  reportData: Record<string, unknown> | null,
  fallbackTitle: string,
): string {
  if (!reportData) return fallbackTitle;

  const chainState = reportData.chainState as
    | Record<string, unknown>
    | undefined;
  const userInput = chainState?.userInput as string | undefined;

  if (userInput?.trim()) return userInput;

  const messages = reportData.messages as
    | Array<{ content?: string }>
    | undefined;
  const firstMessage = messages?.[0]?.content;

  if (firstMessage?.trim()) return firstMessage;

  return fallbackTitle;
}
