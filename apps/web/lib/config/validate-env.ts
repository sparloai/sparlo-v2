import 'server-only';

const requiredServerEnvVars = ['PLAIN_API_KEY', 'ANTHROPIC_API_KEY'] as const;

const _optionalServerEnvVars = [
  'PLAIN_LABEL_TECHNICAL',
  'PLAIN_LABEL_BILLING',
  'PLAIN_LABEL_GENERAL',
  'PLAIN_LABEL_FEATURE',
] as const;

let validated = false;

export function validateEnvironment(): void {
  if (validated) return;

  const missing = requiredServerEnvVars.filter(
    (key) => !process.env[key] || process.env[key]?.trim() === '',
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Check your .env.local file.',
    );
  }

  // Validate API key formats
  if (!process.env.PLAIN_API_KEY?.startsWith('plainApiKey_')) {
    throw new Error('Invalid PLAIN_API_KEY format');
  }

  validated = true;
}

export function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value && fallback === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value || fallback || '';
}
