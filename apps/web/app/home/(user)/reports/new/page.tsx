'use client';

import { useCallback, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { cn } from '@kit/ui/utils';

import { ProcessingScreen } from '../../_components/processing-screen';
import { SubscriptionRequiredModal } from '../../_components/subscription-required-modal';
import { startReportGeneration } from '../../_lib/server/sparlo-reports-server-actions';
import { useReportProgress } from '../../_lib/use-report-progress';

/**
 * New Analysis Page - Bold Typography + Live Detection
 *
 * Features:
 * - Bold headline creates visual anchor
 * - Large input text feels confident
 * - Left border provides structure
 * - Live detection adds visual activity as you type
 * - Monochrome indicators stay on-brand
 */

// Attachment types and constants
interface Attachment {
  id: string;
  file: File;
  preview: string;
  base64?: string;
}

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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
  showUpgradeModal: boolean;
  upgradeReason: 'subscription_required' | 'limit_exceeded';
}

const initialFormState: FormState = {
  step: 'input',
  problemText: '',
  clarificationResponse: '',
  clarifyingQuestion: null,
  reportId: null,
  isSubmitting: false,
  error: null,
  showRefusalWarning: false,
  showUpgradeModal: false,
  upgradeReason: 'subscription_required',
};

// Get initial form state from URL params (runs once on mount)
function getInitialFormState(): FormState {
  if (typeof window === 'undefined') return initialFormState;

  const params = new URLSearchParams(window.location.search);
  const prefill = params.get('prefill');
  const errorType = params.get('error');

  if (prefill || errorType === 'refusal') {
    // Clear params from URL without navigation
    window.history.replaceState({}, '', '/home/reports/new');

    return {
      ...initialFormState,
      problemText: prefill || '',
      showRefusalWarning: errorType === 'refusal',
    };
  }

  return initialFormState;
}

// Detection logic - Simple pattern matching
function hasProblemStatement(text: string): boolean {
  const patterns = [
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
  return patterns.some((p) => p.test(text));
}

function hasConstraints(text: string): boolean {
  const patterns = [
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
  return patterns.some((p) => p.test(text));
}

function hasSuccessCriteria(text: string): boolean {
  const patterns = [
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
  return patterns.some((p) => p.test(text));
}

// Detection Indicator Component
function DetectionIndicator({
  label,
  detected,
}: {
  label: string;
  detected: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'h-1.5 w-1.5 rounded-full transition-colors duration-300',
          detected ? 'bg-zinc-900' : 'bg-zinc-300',
        )}
      />
      <span
        className={cn(
          'text-[13px] tracking-[-0.02em] transition-colors duration-300',
          detected ? 'text-zinc-700' : 'text-zinc-400',
        )}
      >
        {label}
      </span>
    </div>
  );
}

export default function NewReportPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(getInitialFormState);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    step,
    problemText,
    clarificationResponse,
    clarifyingQuestion,
    reportId,
    isSubmitting,
    error,
    showRefusalWarning,
    showUpgradeModal,
    upgradeReason,
  } = formState;

  // File handling functions
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newAttachments: Attachment[] = [];

      for (const file of Array.from(files)) {
        if (attachments.length + newAttachments.length >= MAX_ATTACHMENTS) {
          setFormState((prev) => ({
            ...prev,
            error: `Maximum ${MAX_ATTACHMENTS} attachments allowed`,
          }));
          break;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
          setFormState((prev) => ({
            ...prev,
            error: `File type ${file.type} not supported. Use JPEG, PNG, GIF, WebP, PDF, or DOCX.`,
          }));
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          setFormState((prev) => ({
            ...prev,
            error: `File ${file.name} exceeds 10MB limit`,
          }));
          continue;
        }

        // Convert to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || '');
          };
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          base64,
        });
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [attachments.length],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment) URL.revokeObjectURL(attachment.preview);
      return prev.filter((a) => a.id !== id);
    });
  }, []);


  // Track progress once we have a report ID
  const { progress } = useReportProgress(reportId);

  const canSubmit = problemText.trim().length >= 20;

  const handleContinue = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;

    setFormState((prev) => ({ ...prev, isSubmitting: true, error: null }));

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

      const result = await startReportGeneration({
        designChallenge: problemText.trim(),
        attachments: attachmentData.length > 0 ? attachmentData : undefined,
      });

      if (result.reportId) {
        attachments.forEach((a) => URL.revokeObjectURL(a.preview));
        setAttachments([]);

        setFormState((prev) => ({
          ...prev,
          reportId: result.reportId,
          step: 'processing',
          isSubmitting: false,
        }));
      }
    } catch (err) {
      console.error('Failed to start report:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to start report generation';

      const isUsageError =
        errorMessage.includes('Usage limit') ||
        errorMessage.includes('subscription');
      const isLimitExceeded = errorMessage.includes('Usage limit');

      if (isUsageError) {
        setFormState((prev) => ({
          ...prev,
          showUpgradeModal: true,
          upgradeReason: isLimitExceeded
            ? 'limit_exceeded'
            : 'subscription_required',
          isSubmitting: false,
        }));
      } else {
        setFormState((prev) => ({
          ...prev,
          error: errorMessage,
          isSubmitting: false,
        }));
      }
    }
  }, [canSubmit, problemText, isSubmitting, attachments]);

  const handleRunAnalysis = useCallback(async () => {
    if (isSubmitting) return;

    setFormState((prev) => ({ ...prev, isSubmitting: true, error: null }));

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

      const fullChallenge = clarificationResponse
        ? `${problemText.trim()}\n\nAdditional context: ${clarificationResponse.trim()}`
        : problemText.trim();

      const result = await startReportGeneration({
        designChallenge: fullChallenge,
        attachments: attachmentData.length > 0 ? attachmentData : undefined,
      });

      if (result.reportId) {
        attachments.forEach((a) => URL.revokeObjectURL(a.preview));
        setAttachments([]);

        setFormState((prev) => ({
          ...prev,
          reportId: result.reportId,
          step: 'processing',
          isSubmitting: false,
        }));
      }
    } catch (err) {
      console.error('Failed to start report:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to start report generation';

      const isUsageError =
        errorMessage.includes('Usage limit') ||
        errorMessage.includes('subscription');
      const isLimitExceeded = errorMessage.includes('Usage limit');

      if (isUsageError) {
        setFormState((prev) => ({
          ...prev,
          showUpgradeModal: true,
          upgradeReason: isLimitExceeded
            ? 'limit_exceeded'
            : 'subscription_required',
          isSubmitting: false,
        }));
      } else {
        setFormState((prev) => ({
          ...prev,
          error: errorMessage,
          isSubmitting: false,
        }));
      }
    }
  }, [isSubmitting, problemText, clarificationResponse, attachments]);

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

  const handleViewReport = useCallback(() => {
    if (reportId) {
      router.push(`/home/reports/${reportId}`);
    }
  }, [reportId, router]);

  const goBackToInput = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      step: 'input',
      clarifyingQuestion: null,
    }));
  }, []);

  // Show processing screen when we have a report in progress
  if (step === 'processing' && progress) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-white">
        <ProcessingScreen
          progress={progress}
          onComplete={handleViewReport}
          designChallenge={problemText}
        />
      </div>
    );
  }

  // Clarification step
  if (step === 'clarification' && clarifyingQuestion) {
    return (
      <>
        <SubscriptionRequiredModal
          open={showUpgradeModal}
          onOpenChange={(open) =>
            setFormState((prev) => ({ ...prev, showUpgradeModal: open }))
          }
          reason={upgradeReason}
        />
        <main className="flex min-h-screen flex-col bg-white">
          {/* Main content */}
          <div className="flex flex-1 items-center justify-center px-8 py-16">
            <div className="w-full max-w-3xl">
              {/* Page title - anchor element */}
              <h1 className="mb-12 text-[42px] font-semibold tracking-tight text-zinc-900">
                Clarification
              </h1>

              {/* Left border accent */}
              <div className="border-l-2 border-zinc-900 pl-10">
                {/* Original problem shown */}
                <div className="mb-10">
                  <p className="mb-3 text-[14px] tracking-[-0.02em] text-zinc-400">
                    Your challenge
                  </p>
                  <p className="text-[18px] leading-relaxed tracking-[-0.02em] text-zinc-700">
                    {problemText}
                  </p>
                </div>

                {/* System's clarifying question */}
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

              {/* Footer */}
              <div className="mt-12 flex items-center justify-between pl-10">
                <button
                  onClick={goBackToInput}
                  className="text-[14px] tracking-[-0.02em] text-zinc-500 transition-colors hover:text-zinc-700"
                >
                  ← Edit challenge
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

              {error && (
                <p className="mt-6 pl-10 text-[14px] tracking-[-0.02em] text-red-600">
                  {error}
                </p>
              )}
            </div>
          </div>
        </main>
      </>
    );
  }

  // Input step
  return (
    <>
      <SubscriptionRequiredModal
        open={showUpgradeModal}
        onOpenChange={(open) =>
          setFormState((prev) => ({ ...prev, showUpgradeModal: open }))
        }
        reason={upgradeReason}
      />
      <main className="flex min-h-screen flex-col bg-white">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.docx"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Refusal warning */}
        {showRefusalWarning && (
          <div className="border-b border-red-200 bg-red-50 px-8 py-4">
            <p className="text-[14px] leading-relaxed tracking-[-0.02em] text-red-800">
              <strong>
                Your previous query was flagged by our AI safety filters.
              </strong>{' '}
              This is often a false positive for legitimate engineering
              problems. Please rephrase your challenge, focusing on the
              engineering aspects.
            </p>
          </div>
        )}

        {/* Main content */}
        <div className="px-8 pt-24 pb-16">
          <div className="mx-auto w-full max-w-3xl">
            {/* Back link */}
            <Link
              href="/home"
              className="mb-6 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Dashboard
            </Link>

            {/* Page title - anchor element */}
            <h1 className="font-heading mb-12 text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
              New Analysis
            </h1>

            {/* Textarea with left border */}
            <div className="border-l-2 border-zinc-900 pl-10">
              <textarea
                value={problemText}
                onChange={(e) => {
                  setFormState((prev) => ({
                    ...prev,
                    problemText: e.target.value,
                    showRefusalWarning: false,
                  }));
                }}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                autoFocus
                data-test="challenge-input"
                placeholder="What engineering problem are you solving?"
                className="h-64 w-full resize-none border-none bg-transparent p-0 text-[22px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:ring-0 focus:outline-none disabled:opacity-40"
              />
            </div>

            {/* Detection indicators - always visible */}
            <div className="mt-10 flex items-center gap-8 pl-10">
              <DetectionIndicator
                label="Problem"
                detected={hasProblemStatement(problemText)}
              />
              <DetectionIndicator
                label="Constraints"
                detected={hasConstraints(problemText)}
              />
              <DetectionIndicator
                label="Success criteria"
                detected={hasSuccessCriteria(problemText)}
              />
            </div>

            {/* Attached files - minimal inline display */}
            {attachments.length > 0 && (
              <div className="mt-8 pl-10">
                <div className="flex flex-wrap items-center gap-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="group flex items-center gap-2 rounded border border-zinc-200 bg-zinc-50 py-1.5 pr-2 pl-1.5 transition-colors hover:border-zinc-300"
                    >
                      {/* Small thumbnail or document icon */}
                      <div className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm">
                        {attachment.file.type.startsWith('image/') ? (
                          <Image
                            src={attachment.preview}
                            alt={attachment.file.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-sm text-zinc-500">📄</span>
                        )}
                      </div>
                      {/* Filename */}
                      <span className="max-w-[120px] truncate text-[12px] tracking-[-0.02em] text-zinc-600">
                        {attachment.file.name}
                      </span>
                      {/* Remove button */}
                      <button
                        onClick={() => removeAttachment(attachment.id)}
                        className="ml-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600"
                        aria-label={`Remove ${attachment.file.name}`}
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 flex items-center justify-between pl-10">
              <div className="flex items-center gap-6">
                <p className="text-[13px] tracking-[-0.02em] text-zinc-400">
                  ~25 min analysis
                </p>
                <span className="text-zinc-300">·</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= MAX_ATTACHMENTS}
                  className="text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Attach file
                  {attachments.length > 0 && ` (${attachments.length})`}
                </button>
              </div>

              <button
                onClick={handleContinue}
                disabled={!canSubmit || isSubmitting}
                data-test="challenge-submit"
                className={cn(
                  'px-8 py-4 text-[15px] font-medium transition-colors',
                  canSubmit && !isSubmitting
                    ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                    : 'cursor-not-allowed bg-zinc-200 text-zinc-400',
                )}
              >
                {isSubmitting ? 'Starting...' : 'Run Analysis'}
              </button>
            </div>

            {error && (
              <p className="mt-6 pl-10 text-[14px] tracking-[-0.02em] text-red-600">
                {error}
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
