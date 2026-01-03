import 'server-only';

/**
 * DD Mode Input Validation & Sanitization
 *
 * Security utilities to protect against:
 * - Prompt injection attacks
 * - Token budget bypass via oversized inputs
 * - Malicious attachment processing
 */

// =============================================================================
// Constants
// =============================================================================

export const INPUT_LIMITS = {
  MAX_STARTUP_MATERIALS_LENGTH: 100000, // ~25K tokens
  MAX_VC_NOTES_LENGTH: 20000, // ~5K tokens
  MAX_COMPANY_NAME_LENGTH: 200,
  MAX_IMAGES: 10,
  MAX_PDFS: 5,
  MAX_IMAGE_SIZE_MB: 5,
  MAX_PDF_SIZE_MB: 20,
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ] as const,
  // Estimated tokens for budget validation
  CHARS_PER_TOKEN: 4,
  TOKENS_PER_IMAGE: 1500,
  TOKENS_PER_PDF: 5000,
  MAX_FIRST_STEP_BUDGET_PERCENT: 0.4, // 40% of total budget for DD0-M
} as const;

// Patterns that indicate prompt injection attempts
const PROMPT_INJECTION_PATTERNS = [
  // Instruction override patterns
  /---\s*IGNORE\s*(ALL\s*)?(PREVIOUS|ABOVE|PRIOR)\s*INSTRUCTIONS?\s*---/gi,
  /IGNORE\s+(ALL\s+)?(PREVIOUS|ABOVE|PRIOR)\s+INSTRUCTIONS?/gi,
  /DISREGARD\s+(ALL\s+)?(PREVIOUS|ABOVE|PRIOR)\s+(INSTRUCTIONS?|CONTEXT)/gi,
  /OVERRIDE\s+(ALL\s+)?(PREVIOUS|ABOVE|PRIOR)\s+INSTRUCTIONS?/gi,
  /FORGET\s+(ALL\s+)?(PREVIOUS|ABOVE|PRIOR)\s+(INSTRUCTIONS?|CONTEXT)/gi,

  // Role/context manipulation
  /SYSTEM\s*:/gi,
  /ASSISTANT\s*:/gi,
  /HUMAN\s*:/gi,
  /USER\s*:/gi,

  // Special token patterns (various LLM formats)
  /<\|.*?\|>/g,
  /\[\[SYSTEM\]\]/gi,
  /\[\[INST\]\]/gi,
  /<<SYS>>/gi,
  /<\/SYS>/gi,

  // Output format manipulation
  /OUTPUT\s+THE\s+FOLLOWING\s+JSON/gi,
  /RESPOND\s+WITH\s+ONLY/gi,
  /YOUR\s+RESPONSE\s+MUST\s+BE/gi,
  /INSTEAD\s+OF\s+PERFORMING/gi,

  // Delimiter injection
  /---\s*END\s*(OVERRIDE|INJECTION|INSTRUCTIONS?)\s*---/gi,
  /```\s*system/gi,
];

// =============================================================================
// Sanitization Functions
// =============================================================================

/**
 * Sanitize user input by neutralizing prompt injection patterns
 * Returns sanitized text and a flag indicating if suspicious content was found
 */
export function sanitizeUserInput(input: string): {
  sanitized: string;
  suspiciousPatterns: string[];
} {
  const suspiciousPatterns: string[] = [];
  let sanitized = input;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    const matches = input.match(pattern);
    if (matches) {
      suspiciousPatterns.push(...matches);
      // Replace with harmless placeholder
      sanitized = sanitized.replace(pattern, '[CONTENT_FILTERED]');
    }
  }

  return { sanitized, suspiciousPatterns };
}

/**
 * Sanitize company name - remove any potentially dangerous characters
 */
export function sanitizeCompanyName(name: string): string {
  return name
    .replace(/[<>]/g, '') // Remove HTML chars
    .replace(/["'`]/g, '') // Remove quotes that could break string interpolation
    .replace(/[\r\n]/g, ' ') // Remove newlines
    .slice(0, INPUT_LIMITS.MAX_COMPANY_NAME_LENGTH)
    .trim();
}

// =============================================================================
// Validation Functions
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  estimatedTokens?: number;
}

/**
 * Validate startup materials
 */
export function validateStartupMaterials(materials: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!materials || materials.trim().length === 0) {
    errors.push('Startup materials cannot be empty');
    return { valid: false, errors, warnings };
  }

  if (materials.length > INPUT_LIMITS.MAX_STARTUP_MATERIALS_LENGTH) {
    errors.push(
      `Startup materials exceed maximum length of ${INPUT_LIMITS.MAX_STARTUP_MATERIALS_LENGTH.toLocaleString()} characters. ` +
        `Please reduce the content size.`,
    );
  }

  const { suspiciousPatterns } = sanitizeUserInput(materials);
  if (suspiciousPatterns.length > 0) {
    warnings.push(
      `Found ${suspiciousPatterns.length} potentially suspicious pattern(s) that will be filtered`,
    );
  }

  const estimatedTokens = Math.ceil(
    materials.length / INPUT_LIMITS.CHARS_PER_TOKEN,
  );

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    estimatedTokens,
  };
}

/**
 * Validate VC notes (optional field)
 */
export function validateVCNotes(notes: string | undefined): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!notes) {
    return { valid: true, errors, warnings, estimatedTokens: 0 };
  }

  if (notes.length > INPUT_LIMITS.MAX_VC_NOTES_LENGTH) {
    errors.push(
      `VC notes exceed maximum length of ${INPUT_LIMITS.MAX_VC_NOTES_LENGTH.toLocaleString()} characters`,
    );
  }

  const { suspiciousPatterns } = sanitizeUserInput(notes);
  if (suspiciousPatterns.length > 0) {
    warnings.push(
      `Found ${suspiciousPatterns.length} potentially suspicious pattern(s) in VC notes`,
    );
  }

  const estimatedTokens = Math.ceil(
    notes.length / INPUT_LIMITS.CHARS_PER_TOKEN,
  );

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    estimatedTokens,
  };
}

/**
 * Validate attachments (images and PDFs)
 */
export function validateAttachments(
  attachments: Array<{ media_type: string; data: string }> | undefined,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let estimatedTokens = 0;

  if (!attachments || attachments.length === 0) {
    return { valid: true, errors, warnings, estimatedTokens: 0 };
  }

  const images = attachments.filter((a) => a.media_type.startsWith('image/'));
  const pdfs = attachments.filter((a) => a.media_type === 'application/pdf');
  const other = attachments.filter(
    (a) =>
      !a.media_type.startsWith('image/') && a.media_type !== 'application/pdf',
  );

  // Count validation
  if (images.length > INPUT_LIMITS.MAX_IMAGES) {
    errors.push(
      `Too many images: ${images.length}. Maximum ${INPUT_LIMITS.MAX_IMAGES} allowed.`,
    );
  }

  if (pdfs.length > INPUT_LIMITS.MAX_PDFS) {
    errors.push(
      `Too many PDFs: ${pdfs.length}. Maximum ${INPUT_LIMITS.MAX_PDFS} allowed.`,
    );
  }

  if (other.length > 0) {
    errors.push(
      `Unsupported attachment types: ${other.map((a) => a.media_type).join(', ')}. ` +
        `Only images and PDFs are supported.`,
    );
  }

  // Image validation
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (!img) continue;

    // Validate type
    if (
      !INPUT_LIMITS.ALLOWED_IMAGE_TYPES.includes(
        img.media_type as (typeof INPUT_LIMITS.ALLOWED_IMAGE_TYPES)[number],
      )
    ) {
      errors.push(
        `Image ${i + 1} has invalid type: ${img.media_type}. ` +
          `Allowed types: ${INPUT_LIMITS.ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    // Validate size (base64 to bytes: multiply by 3/4)
    const sizeBytes = (img.data.length * 3) / 4;
    const sizeMB = sizeBytes / (1024 * 1024);
    if (sizeMB > INPUT_LIMITS.MAX_IMAGE_SIZE_MB) {
      errors.push(
        `Image ${i + 1} exceeds ${INPUT_LIMITS.MAX_IMAGE_SIZE_MB}MB limit (${sizeMB.toFixed(1)}MB)`,
      );
    }
  }

  // PDF validation
  for (let i = 0; i < pdfs.length; i++) {
    const pdf = pdfs[i];
    if (!pdf) continue;

    const sizeBytes = (pdf.data.length * 3) / 4;
    const sizeMB = sizeBytes / (1024 * 1024);
    if (sizeMB > INPUT_LIMITS.MAX_PDF_SIZE_MB) {
      errors.push(
        `PDF ${i + 1} exceeds ${INPUT_LIMITS.MAX_PDF_SIZE_MB}MB limit (${sizeMB.toFixed(1)}MB)`,
      );
    }
  }

  // Estimate tokens
  estimatedTokens =
    images.length * INPUT_LIMITS.TOKENS_PER_IMAGE +
    pdfs.length * INPUT_LIMITS.TOKENS_PER_PDF;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    estimatedTokens,
  };
}

/**
 * Validate total estimated token usage against budget
 */
export function validateTokenBudget(
  estimatedTokens: number,
  tokenBudgetLimit: number,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const maxFirstStepBudget =
    tokenBudgetLimit * INPUT_LIMITS.MAX_FIRST_STEP_BUDGET_PERCENT;

  if (estimatedTokens > maxFirstStepBudget) {
    errors.push(
      `Input is too large (estimated ${estimatedTokens.toLocaleString()} tokens). ` +
        `Maximum input size is approximately ${maxFirstStepBudget.toLocaleString()} tokens. ` +
        `Please reduce the size of your materials or attachments.`,
    );
  } else if (estimatedTokens > maxFirstStepBudget * 0.8) {
    warnings.push(
      `Input is near the size limit (${Math.round((estimatedTokens / maxFirstStepBudget) * 100)}% of maximum). ` +
        `Consider reducing size if the report fails due to token limits.`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    estimatedTokens,
  };
}

/**
 * Comprehensive input validation for DD report generation
 */
export function validateDDInput(params: {
  startupMaterials: string;
  vcNotes?: string;
  companyName: string;
  attachments?: Array<{ media_type: string; data: string }>;
  tokenBudgetLimit: number;
}): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  let totalEstimatedTokens = 0;

  // Validate company name
  if (!params.companyName || params.companyName.trim().length === 0) {
    allErrors.push('Company name is required');
  } else if (params.companyName.length > INPUT_LIMITS.MAX_COMPANY_NAME_LENGTH) {
    allErrors.push(
      `Company name exceeds maximum length of ${INPUT_LIMITS.MAX_COMPANY_NAME_LENGTH} characters`,
    );
  }

  // Validate startup materials
  const materialsResult = validateStartupMaterials(params.startupMaterials);
  allErrors.push(...materialsResult.errors);
  allWarnings.push(...materialsResult.warnings);
  totalEstimatedTokens += materialsResult.estimatedTokens || 0;

  // Validate VC notes
  const notesResult = validateVCNotes(params.vcNotes);
  allErrors.push(...notesResult.errors);
  allWarnings.push(...notesResult.warnings);
  totalEstimatedTokens += notesResult.estimatedTokens || 0;

  // Validate attachments
  const attachmentsResult = validateAttachments(params.attachments);
  allErrors.push(...attachmentsResult.errors);
  allWarnings.push(...attachmentsResult.warnings);
  totalEstimatedTokens += attachmentsResult.estimatedTokens || 0;

  // Validate token budget
  const budgetResult = validateTokenBudget(
    totalEstimatedTokens,
    params.tokenBudgetLimit,
  );
  allErrors.push(...budgetResult.errors);
  allWarnings.push(...budgetResult.warnings);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    estimatedTokens: totalEstimatedTokens,
  };
}

// =============================================================================
// Redaction Utilities (for error logging)
// =============================================================================

/**
 * Redact sensitive information from text before logging
 */
export function redactSensitiveData(text: string, maxLength = 200): string {
  let redacted = text
    // Email addresses
    .replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      '[EMAIL_REDACTED]',
    )
    // Phone numbers (various formats)
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]')
    // Long numeric sequences (could be IDs, SSNs, etc.)
    .replace(/\b\d{9,16}\b/g, '[ID_REDACTED]')
    // API keys / tokens (common patterns)
    .replace(
      /\b(sk|pk|api|key|token)[_-]?[a-zA-Z0-9]{20,}\b/gi,
      '[KEY_REDACTED]',
    )
    // URLs with potential sensitive query params
    .replace(/https?:\/\/[^\s]+/g, (url) => {
      try {
        const parsed = new URL(url);
        // Keep domain, redact path and query params if they look sensitive
        if (parsed.search || parsed.pathname.length > 20) {
          return `${parsed.origin}/[PATH_REDACTED]`;
        }
        return url;
      } catch {
        return '[URL_REDACTED]';
      }
    });

  // Truncate to max length
  if (redacted.length > maxLength) {
    redacted = redacted.slice(0, maxLength) + '...[TRUNCATED]';
  }

  return redacted;
}
