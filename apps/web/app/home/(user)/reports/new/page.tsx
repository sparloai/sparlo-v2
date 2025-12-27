'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@kit/ui/utils';

import { ProcessingScreen } from '../../_components/processing-screen';
import { SubscriptionRequiredModal } from '../../_components/subscription-required-modal';
import { startReportGeneration } from '../../_lib/server/sparlo-reports-server-actions';
import { useReportProgress } from '../../_lib/use-report-progress';

/**
 * New Analysis Page - Air Company Aesthetic (Light)
 *
 * Features:
 * - White background with minimal chrome
 * - Two-step flow: Input → Clarification (optional) → Processing
 * - No icons, text only
 * - Square corners, zinc palette
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
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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

export default function NewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<FormState>(initialFormState);
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
            error: `File type ${file.type} not supported. Use JPEG, PNG, GIF, or WebP.`,
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

  // Handle URL params for prefill and error state
  useEffect(() => {
    const prefill = searchParams.get('prefill');
    const errorType = searchParams.get('error');

    if (prefill || errorType === 'refusal') {
      setFormState((prev) => ({
        ...prev,
        problemText: prefill || prev.problemText,
        showRefusalWarning: errorType === 'refusal',
      }));
    }

    // Clear params from URL without navigation
    if (prefill || errorType) {
      window.history.replaceState({}, '', '/home/reports/new');
    }
  }, [searchParams]);

  // Track progress once we have a report ID
  const { progress } = useReportProgress(reportId);

  const canSubmit = problemText.trim().length >= 50;

  const handleContinue = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;

    // For now, skip clarification and go directly to processing
    // In the future, this could call an API to get a clarifying question
    setFormState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // Prepare attachments for API
      const attachmentData = attachments.map((a) => ({
        filename: a.file.name,
        media_type: a.file.type as
          | 'image/jpeg'
          | 'image/png'
          | 'image/gif'
          | 'image/webp',
        data: a.base64 || '',
      }));

      const result = await startReportGeneration({
        designChallenge: problemText.trim(),
        attachments: attachmentData.length > 0 ? attachmentData : undefined,
      });

      if (result.reportId) {
        // Clean up attachment previews
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

      // Check if this is a usage/subscription error
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
          | 'image/webp',
        data: a.base64 || '',
      }));

      // Combine problem with clarification if present
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
        <main
          className="flex min-h-screen flex-col bg-white"
          style={{
            fontFamily:
              "'Suisse Intl', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-zinc-200 px-8 py-6">
            <h1 className="text-[15px] leading-[1.2] tracking-[-0.02em] text-zinc-500">
              Clarification
            </h1>
          </header>

          {/* Main content */}
          <div className="flex-1 px-8 py-12">
            <div className="mx-auto max-w-2xl">
              {/* Original problem shown */}
              <div className="border-b border-zinc-200 pb-6">
                <p className="mb-2 text-[13px] leading-[1.2] tracking-[-0.02em] text-zinc-400">
                  Your problem
                </p>
                <p className="text-[16px] leading-[1.4] tracking-[-0.02em] text-zinc-700">
                  {problemText}
                </p>
              </div>

              {/* System's clarifying question */}
              <div className="py-6">
                <p className="text-[17px] leading-[1.4] tracking-[-0.02em] text-zinc-900">
                  {clarifyingQuestion}
                </p>
              </div>

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
                className="h-32 w-full resize-none border border-zinc-200 p-4 text-[16px] leading-[1.4] tracking-[-0.02em] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
              />

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={goBackToInput}
                  className="text-[14px] leading-[1.2] tracking-[-0.02em] text-zinc-500 transition-colors hover:text-zinc-700"
                >
                  ← Edit problem
                </button>
                <button
                  onClick={handleRunAnalysis}
                  disabled={isSubmitting}
                  className={cn(
                    'px-6 py-3 text-[14px] leading-[1.2] font-medium tracking-[-0.02em] transition-colors',
                    isSubmitting
                      ? 'cursor-not-allowed bg-zinc-300 text-zinc-500'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800',
                  )}
                >
                  {isSubmitting ? 'Starting...' : 'Run Analysis'}
                </button>
              </div>

              {error && (
                <p className="mt-4 text-[14px] leading-[1.2] tracking-[-0.02em] text-red-600">
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
      <main
        className="flex min-h-screen flex-col bg-white"
        style={{
          fontFamily:
            "'Suisse Intl', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-zinc-200 px-8 py-6">
          <h1 className="text-[15px] leading-[1.2] tracking-[-0.02em] text-zinc-500">
            New Analysis
          </h1>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= MAX_ATTACHMENTS}
              className="text-[14px] leading-[1.2] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Attach file
              {attachments.length > 0 && ` (${attachments.length})`}
            </button>
          </div>
        </header>

        {/* Refusal warning */}
        {showRefusalWarning && (
          <div className="border-b border-red-200 bg-red-50 px-8 py-4">
            <p className="text-[14px] leading-[1.4] tracking-[-0.02em] text-red-800">
              <strong>Your previous query was flagged by our AI safety filters.</strong>{' '}
              This is often a false positive for legitimate engineering problems.
              Please rephrase your challenge, focusing on the engineering aspects.
            </p>
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-16">
          <div className="w-full max-w-2xl">
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
              className="h-48 w-full resize-none border border-zinc-200 p-6 text-[17px] leading-[1.4] tracking-[-0.02em] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none disabled:opacity-40"
            />

            <p className="mt-4 text-[13px] leading-[1.2] tracking-[-0.02em] text-zinc-400">
              Be specific about constraints and success criteria for better results.
            </p>

            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <div className="mt-6 border-t border-zinc-200 pt-4">
                <div className="flex flex-wrap gap-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="group relative h-16 w-16 overflow-hidden border border-zinc-200"
                    >
                      <Image
                        src={attachment.preview}
                        alt={attachment.file.name}
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => removeAttachment(attachment.id)}
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center bg-zinc-600 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <p className="text-[13px] leading-[1.2] tracking-[-0.02em] text-zinc-400">
                ~25 min analysis
              </p>

              <button
                onClick={handleContinue}
                disabled={!canSubmit || isSubmitting}
                data-test="challenge-submit"
                className={cn(
                  'px-6 py-3 text-[14px] leading-[1.2] font-medium tracking-[-0.02em] transition-colors',
                  canSubmit && !isSubmitting
                    ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                    : 'cursor-not-allowed bg-zinc-200 text-zinc-400',
                )}
              >
                {isSubmitting ? 'Starting...' : 'Run Analysis'}
              </button>
            </div>

            {error && (
              <p className="mt-4 text-[14px] leading-[1.2] tracking-[-0.02em] text-red-600">
                {error}
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
