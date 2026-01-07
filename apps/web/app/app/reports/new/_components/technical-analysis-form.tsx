'use client';

import { useCallback, useDeferredValue, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { cn } from '@kit/ui/utils';

import { isUsageError } from '~/lib/errors/usage-error';
import { getAppPath } from '~/lib/hooks/use-app-path';

import { startReportGeneration } from '../../../_lib/server/sparlo-reports-server-actions';
import { sanitizeErrorMessage } from '../_lib/sanitize-error';
import { useFileAttachments } from '../_lib/use-file-attachments';
import { AttachmentList } from './shared/attachment-list';
import { DetectionIndicator } from './shared/detection-indicator';

/**
 * Technical Analysis Form
 *
 * Features:
 * - Bold headline creates visual anchor
 * - Large input text feels confident
 * - Left border provides structure
 * - Live detection adds visual activity as you type
 * - Monochrome indicators stay on-brand
 */

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

type PageStep = 'input' | 'clarification' | 'processing';

interface FormState {
  step: PageStep;
  problemText: string;
  clarificationResponse: string;
  clarifyingQuestion: string | null;
  reportId: string | null;
  isSubmitting: boolean;
  error: string | null;
  showRefusalWarning: boolean;
}

// Detection logic - Simple pattern matching
const PROBLEM_PATTERNS = [
  /need to/i,
  /trying to/i,
  /want to/i,
  /how to/i,
  /reduce/i,
  /increase/i,
  /improve/i,
  /solve/i,
  /challenge/i,
  /problem/i,
  /issue/i,
  /develop/i,
  /create/i,
  /build/i,
  /design/i,
  /optimize/i,
];

const CONSTRAINT_PATTERNS = [
  /budget/i,
  /cost/i,
  /\$/i,
  /under/i,
  /less than/i,
  /must/i,
  /cannot/i,
  /can't/i,
  /without/i,
  /maximum/i,
  /minimum/i,
  /limit/i,
  /kg/i,
  /mm/i,
  /hours/i,
  /days/i,
  /weeks/i,
  /months/i,
  /deadline/i,
  /timeline/i,
  /constraint/i,
  /requirement/i,
  /specification/i,
];

const SUCCESS_PATTERNS = [
  /target/i,
  /goal/i,
  /achieve/i,
  /\d+%/i,
  /by \d/i,
  /success/i,
  /metric/i,
  /kpi/i,
  /while maintaining/i,
  /without sacrificing/i,
  /measure/i,
  /benchmark/i,
  /outcome/i,
  /result/i,
  /performance/i,
];

function hasPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

interface TechnicalAnalysisFormProps {
  prefill?: string;
  error?: string;
}

const MIN_CHARS = 50;

export function TechnicalAnalysisForm({
  prefill,
  error: initialError,
}: TechnicalAnalysisFormProps) {
  const router = useRouter();

  const [formState, setFormState] = useState<FormState>(() => ({
    step: 'input',
    problemText: prefill || '',
    clarificationResponse: '',
    clarifyingQuestion: null,
    reportId: null,
    isSubmitting: false,
    error: null,
    showRefusalWarning: initialError === 'refusal',
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

  const {
    step,
    problemText,
    clarificationResponse,
    clarifyingQuestion,
    reportId: _reportId,
    isSubmitting,
    error,
    showRefusalWarning,
  } = formState;

  // Debounce pattern matching using deferred value
  const deferredText = useDeferredValue(problemText);
  const detectionResults = useMemo(
    () => ({
      hasProblem: hasPattern(deferredText, PROBLEM_PATTERNS),
      hasConstraints: hasPattern(deferredText, CONSTRAINT_PATTERNS),
      hasSuccess: hasPattern(deferredText, SUCCESS_PATTERNS),
    }),
    [deferredText],
  );

  const canSubmit = problemText.trim().length >= MIN_CHARS;

  // Combine errors from form and attachments
  const displayError = error || attachmentError;

  const handleSubmit = useCallback(
    async (includeClarification: boolean = false) => {
      if ((!includeClarification && !canSubmit) || isSubmitting) return;

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
            | 'application/pdf'
            | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          data: a.base64 || '',
        }));

        const designChallenge =
          includeClarification && clarificationResponse
            ? `${problemText.trim()}\n\nAdditional context: ${clarificationResponse.trim()}`
            : problemText.trim();

        const result = await startReportGeneration({
          designChallenge,
          attachments: attachmentData.length > 0 ? attachmentData : undefined,
        });

        if (result.reportId) {
          clearAttachments();
          // Redirect to report page immediately - it will show the processing screen
          router.push(getAppPath(`/app/reports/${result.reportId}`));
        }
      } catch (err) {
        console.error('Failed to start report:', err);
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
    },
    [
      canSubmit,
      problemText,
      clarificationResponse,
      isSubmitting,
      attachments,
      router,
      clearAttachments,
      clearAttachmentError,
    ],
  );

  const handleContinue = useCallback(() => handleSubmit(false), [handleSubmit]);
  const handleRunAnalysis = useCallback(
    () => handleSubmit(true),
    [handleSubmit],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (step === 'input') {
          handleContinue();
        } else if (step === 'clarification') {
          handleRunAnalysis();
        }
      }
    },
    [step, handleContinue, handleRunAnalysis],
  );

  const goBackToInput = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      step: 'input',
      clarifyingQuestion: null,
    }));
  }, []);

  // Clarification step
  if (step === 'clarification' && clarifyingQuestion) {
    return (
      <div className="flex flex-1 items-center justify-center px-8 py-16">
        <div className="w-full max-w-3xl">
          <h1 className="mb-12 text-[42px] font-semibold tracking-tight text-zinc-900">
            Clarification
          </h1>

          <div className="border-l-2 border-zinc-900 pl-10">
            <div className="mb-10">
              <p className="mb-3 text-[14px] tracking-[-0.02em] text-zinc-400">
                Your challenge
              </p>
              <p className="text-[18px] leading-relaxed tracking-[-0.02em] text-zinc-700">
                {problemText}
              </p>
            </div>

            <p className="mb-8 text-[22px] leading-relaxed text-zinc-900">
              {clarifyingQuestion}
            </p>

            <textarea
              value={clarificationResponse}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  clarificationResponse: e.target.value,
                }))
              }
              onKeyDown={handleKeyDown}
              placeholder="Your response..."
              className="h-40 w-full resize-none border-none bg-transparent p-0 text-[22px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:ring-0 focus:outline-none"
            />
          </div>

          <div className="mt-12 flex items-center justify-between pl-10">
            <button
              onClick={goBackToInput}
              className="text-[14px] tracking-[-0.02em] text-zinc-500 transition-colors hover:text-zinc-700"
            >
              &larr; Edit challenge
            </button>
            <button
              onClick={handleRunAnalysis}
              disabled={isSubmitting}
              className={cn(
                'px-8 py-4 text-[15px] font-medium transition-colors',
                isSubmitting
                  ? 'cursor-not-allowed bg-zinc-200 text-zinc-400'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800',
              )}
            >
              {isSubmitting ? 'Starting...' : 'Run Analysis'}
            </button>
          </div>

          {displayError && (
            <p className="mt-6 pl-10 text-[14px] tracking-[-0.02em] text-red-600">
              {displayError}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Input step
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.docx"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {showRefusalWarning && (
        <div className="mb-6 border-b border-red-200 bg-red-50 px-8 py-4">
          <p className="text-[14px] leading-relaxed tracking-[-0.02em] text-red-800">
            <strong>
              Your previous query was flagged by our AI safety filters.
            </strong>{' '}
            This is often a false positive for legitimate engineering problems.
            Please rephrase your challenge, focusing on the engineering aspects.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="flex">
          <div className="w-0.5 bg-zinc-900" />
          <div className="flex-1 p-8">
            <textarea
              value={problemText}
              onChange={(e) => {
                setFormState((prev) => ({
                  ...prev,
                  problemText: e.target.value,
                  showRefusalWarning: false,
                  error: null,
                }));
                clearAttachmentError();
              }}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              autoFocus
              data-test="challenge-input"
              placeholder="Describe your technical challenge."
              className="h-64 w-full resize-none border-none bg-transparent p-0 text-[20px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-none focus:ring-0 focus:outline-none disabled:opacity-40"
              style={{ outline: 'none' }}
            />

            <div className="mt-8 flex items-center gap-6">
              <DetectionIndicator
                label="Problem"
                detected={detectionResults.hasProblem}
              />
              <DetectionIndicator
                label="Constraints"
                detected={detectionResults.hasConstraints}
              />
              <DetectionIndicator
                label="Success criteria"
                detected={detectionResults.hasSuccess}
              />
            </div>

            <AttachmentList
              attachments={attachments}
              onRemove={removeAttachment}
            />

            <div className="mt-10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <p className="text-[13px] tracking-[-0.02em] text-zinc-400">
                  ~25 min analysis
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
                {!canSubmit && !isSubmitting && (
                  <>
                    <span className="text-zinc-300">·</span>
                    <span className="text-[13px] tracking-[-0.02em] text-zinc-400">
                      Min 50 characters
                    </span>
                  </>
                )}
              </div>

              <button
                onClick={handleContinue}
                disabled={!canSubmit || isSubmitting}
                data-test="challenge-submit"
                className={cn(
                  'px-6 py-3 text-[15px] font-medium transition-colors',
                  canSubmit && !isSubmitting
                    ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                    : 'cursor-not-allowed bg-zinc-100 text-zinc-400',
                )}
              >
                {isSubmitting ? 'Starting...' : 'Run Analysis'}
              </button>
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
