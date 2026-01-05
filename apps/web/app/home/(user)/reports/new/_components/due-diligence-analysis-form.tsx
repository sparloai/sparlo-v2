'use client';

import { useCallback, useDeferredValue, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { cn } from '@kit/ui/utils';

import { isUsageError } from '~/lib/errors/usage-error';
import { getAppPath } from '~/lib/hooks/use-app-path';

import { ProcessingScreen } from '../../../_components/processing-screen';
import { startDDReportGeneration } from '../../../_lib/server/dd-reports-server-actions';
import { useReportProgress } from '../../../_lib/use-report-progress';
import { sanitizeErrorMessage } from '../_lib/sanitize-error';
import { useFileAttachments } from '../_lib/use-file-attachments';
import { AttachmentList } from './shared/attachment-list';
import { DetectionIndicator } from './shared/detection-indicator';

/**
 * Due Diligence Analysis Form - Simplified Single-Field Version
 *
 * A streamlined DD form with just one text input.
 * Company name is extracted from the pasted materials by the backend.
 * Users can include specific concerns at the end of their pasted materials.
 */

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

type PageStep = 'input' | 'processing';

interface FormState {
  step: PageStep;
  materials: string;
  reportId: string | null;
  isSubmitting: boolean;
  error: string | null;
}

// Detection logic - Pattern matching for DD context
const COMPANY_PATTERNS = [
  /founded/i,
  /team/i,
  /ceo|cto|founder/i,
  /raised/i,
  /funding/i,
  /series/i,
  /seed/i,
  /revenue/i,
  /customers/i,
  /users/i,
  /market/i,
  /company/i,
  /startup/i,
];

const TECH_CLAIM_PATTERNS = [
  /proprietary/i,
  /patent/i,
  /breakthrough/i,
  /novel/i,
  /unique/i,
  /first/i,
  /only/i,
  /better than/i,
  /faster/i,
  /cheaper/i,
  /more efficient/i,
  /\d+x/i,
  /\d+%/i,
  /improve/i,
  /reduce/i,
  /technology/i,
  /algorithm/i,
];

const PRODUCT_PATTERNS = [
  /product/i,
  /solution/i,
  /platform/i,
  /system/i,
  /process/i,
  /method/i,
  /approach/i,
  /architecture/i,
  /infrastructure/i,
  /feature/i,
];

function hasPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

// Extract company name from materials (first line or first capitalized phrase)
function extractCompanyName(materials: string): string {
  const lines = materials.trim().split('\n');
  const firstLine = lines[0]?.trim() || '';

  // If first line is short (likely a title/company name), use it
  if (firstLine.length > 0 && firstLine.length < 100) {
    const cleaned = firstLine
      .replace(/^(company|startup|about|introducing|welcome to)\s*:?\s*/i, '')
      .trim();
    if (cleaned.length > 0 && cleaned.length < 60) {
      return cleaned;
    }
  }

  // Try to find a pattern like "Company Name is..." or "At Company Name,"
  const companyPatterns = [
    /^([A-Z][A-Za-z0-9\s&]+(?:Inc|LLC|Ltd|Corp)?)\s+is\b/m,
    /^At\s+([A-Z][A-Za-z0-9\s&]+)/m,
    /^([A-Z][A-Za-z0-9\s&]{2,30})\s*[-–—]/m,
  ];

  for (const pattern of companyPatterns) {
    const match = materials.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return 'Startup Analysis';
}

const MIN_CHARS = 200;

export function DueDiligenceAnalysisForm() {
  const router = useRouter();

  const [formState, setFormState] = useState<FormState>(() => ({
    step: 'input',
    materials: '',
    reportId: null,
    isSubmitting: false,
    error: null,
  }));

  const {
    attachments,
    fileInputRef,
    handleFileSelect,
    removeAttachment,
    clearAttachments,
    error: attachmentError,
    clearError: clearAttachmentError,
  } = useFileAttachments({ allowedTypes: ALLOWED_TYPES });

  const { step, materials, reportId, isSubmitting, error } = formState;

  // Debounce pattern matching using deferred value
  const deferredMaterials = useDeferredValue(materials);
  const detectionResults = useMemo(
    () => ({
      hasCompanyInfo: hasPattern(deferredMaterials, COMPANY_PATTERNS),
      hasTechClaims: hasPattern(deferredMaterials, TECH_CLAIM_PATTERNS),
      hasProductDetails: hasPattern(deferredMaterials, PRODUCT_PATTERNS),
    }),
    [deferredMaterials],
  );

  // Track progress once we have a report ID
  const { progress } = useReportProgress(reportId);

  const charCount = materials.length;
  const canSubmit = charCount >= MIN_CHARS;

  // Combine errors from form and attachments
  const displayError = error || attachmentError;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;

    setFormState((prev) => ({ ...prev, isSubmitting: true, error: null }));
    clearAttachmentError();

    try {
      const attachmentData = attachments.map((a) => ({
        filename: a.file.name,
        media_type: a.file.type as
          | 'image/jpeg'
          | 'image/png'
          | 'image/gif'
          | 'image/webp'
          | 'application/pdf',
        data: a.base64 || '',
      }));

      const companyName = extractCompanyName(materials);

      const result = await startDDReportGeneration({
        companyName,
        startupMaterials: materials.trim(),
        attachments: attachmentData.length > 0 ? attachmentData : undefined,
      });

      if (result.reportId) {
        clearAttachments();

        setFormState((prev) => ({
          ...prev,
          reportId: result.reportId,
          step: 'processing',
          isSubmitting: false,
        }));
      }
    } catch (err) {
      console.error('Failed to start DD report:', err);
      const errorMessage = sanitizeErrorMessage(err);

      // For usage errors, redirect to same page to show TokenGateScreen
      if (isUsageError(errorMessage)) {
        router.refresh();
      } else {
        setFormState((prev) => ({
          ...prev,
          error: errorMessage,
          isSubmitting: false,
        }));
      }
    }
  }, [
    canSubmit,
    materials,
    isSubmitting,
    attachments,
    router,
    clearAttachments,
    clearAttachmentError,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleViewReport = useCallback(() => {
    if (reportId) {
      router.push(getAppPath(`/home/reports/${reportId}`));
    }
  }, [reportId, router]);

  // Show processing screen when we have a report in progress
  if (step === 'processing' && progress) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-white">
        <ProcessingScreen
          progress={progress}
          onComplete={handleViewReport}
          designChallenge={`DD: ${extractCompanyName(materials)}`}
        />
      </div>
    );
  }

  // Input step
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="flex">
          <div className="w-0.5 bg-zinc-900" />
          <div className="flex-1 p-8">
            <textarea
              value={materials}
              onChange={(e) => {
                setFormState((prev) => ({
                  ...prev,
                  materials: e.target.value,
                  error: null,
                }));
                clearAttachmentError();
              }}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              autoFocus
              data-test="dd-materials-input"
              placeholder="Paste the startup's pitch materials, technical claims, product description, and any relevant technical documentation..."
              className="h-64 w-full resize-none border-none bg-transparent p-0 text-[18px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-none focus:ring-0 focus:outline-none disabled:opacity-40"
              style={{ outline: 'none' }}
            />

            <div className="mt-8 flex items-center gap-6">
              <DetectionIndicator
                label="Company Info"
                detected={detectionResults.hasCompanyInfo}
              />
              <DetectionIndicator
                label="Tech Claims"
                detected={detectionResults.hasTechClaims}
              />
              <DetectionIndicator
                label="Product Details"
                detected={detectionResults.hasProductDetails}
              />
            </div>

            <AttachmentList
              attachments={attachments}
              onRemove={removeAttachment}
            />

            <div className="mt-10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <p className="text-[13px] tracking-[-0.02em] text-zinc-400">
                  ~40 min analysis
                </p>
                <span className="text-zinc-300">·</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= 5}
                  className="text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Attach file
                  {attachments.length > 0 && ` (${attachments.length})`}
                </button>
                <span className="text-zinc-300">·</span>
                <span className="text-[13px] tracking-[-0.02em] text-zinc-400">
                  {charCount < MIN_CHARS
                    ? `Min ${MIN_CHARS} chars`
                    : `${charCount.toLocaleString()} chars`}
                </span>
              </div>

              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  data-test="dd-submit"
                  className={cn(
                    'px-6 py-3 text-[15px] font-medium transition-colors',
                    canSubmit && !isSubmitting
                      ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                      : 'cursor-not-allowed bg-zinc-100 text-zinc-400',
                  )}
                >
                  {isSubmitting ? 'Starting...' : 'Run Due Diligence'}
                </button>
              </div>
            </div>

            {displayError && (
              <p className="mt-4 text-[14px] tracking-[-0.02em] text-red-600">
                {displayError}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
