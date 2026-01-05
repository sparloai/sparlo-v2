'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@kit/ui/utils';

import { AppLink } from '~/components/app-link';
import { isUsageError } from '~/lib/errors/usage-error';
import { getAppPath } from '~/lib/hooks/use-app-path';

import { ProcessingScreen } from '../../../_components/processing-screen';
import { startDDReportGeneration } from '../../../_lib/server/dd-reports-server-actions';
import { useReportProgress } from '../../../_lib/use-report-progress';
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE_BYTES,
} from '../../_lib/constants';

/**
 * DD New Report Page - Client Component
 *
 * Due Diligence mode for technical startup evaluation.
 * Styled to match the regular new analysis page with monochrome zinc theme.
 */

// Attachment types
interface Attachment {
  id: string;
  file: File;
  preview: string;
  base64?: string;
}

type PageStep = 'input' | 'processing';

interface FormState {
  step: PageStep;
  companyName: string;
  startupMaterials: string;
  vcNotes: string;
  reportId: string | null;
  isSubmitting: boolean;
  error: string | null;
  showRefusalWarning: boolean;
}

// Detection logic - Pattern matching for DD context
function hasCompanyInfo(text: string): boolean {
  const patterns = [
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
  ];
  return patterns.some((p) => p.test(text));
}

function hasTechClaims(text: string): boolean {
  const patterns = [
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
  ];
  return patterns.some((p) => p.test(text));
}

function hasProductDetails(text: string): boolean {
  const patterns = [
    /product/i,
    /solution/i,
    /platform/i,
    /technology/i,
    /algorithm/i,
    /model/i,
    /system/i,
    /process/i,
    /method/i,
    /approach/i,
    /architecture/i,
    /infrastructure/i,
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

// Minimum characters for startup materials
const MIN_MATERIALS_LENGTH = 100;

export default function DDNewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for error param at initialization
  const initialErrorType = searchParams.get('error');
  const initialShowRefusalWarning = initialErrorType === 'refusal';

  const [formState, setFormState] = useState<FormState>(() => ({
    step: 'input',
    companyName: '',
    startupMaterials: '',
    vcNotes: '',
    reportId: null,
    isSubmitting: false,
    error: null,
    showRefusalWarning: initialShowRefusalWarning,
  }));

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const {
    step,
    companyName,
    startupMaterials,
    vcNotes,
    reportId,
    isSubmitting,
    error,
    showRefusalWarning,
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

        if (
          !ALLOWED_ATTACHMENT_TYPES.includes(
            file.type as (typeof ALLOWED_ATTACHMENT_TYPES)[number],
          )
        ) {
          setFormState((prev) => ({
            ...prev,
            error: `File type ${file.type} not supported. Use images or PDF.`,
          }));
          continue;
        }

        if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
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

  // Clear error params from URL after initial load
  useEffect(() => {
    if (initialErrorType) {
      window.history.replaceState({}, '', getAppPath('/home/reports/dd/new'));
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track progress once we have a report ID
  const { progress } = useReportProgress(reportId);

  const canSubmit =
    companyName.trim().length > 0 &&
    startupMaterials.trim().length >= MIN_MATERIALS_LENGTH;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;

    setFormState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // Prepare attachments for API
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

      const result = await startDDReportGeneration({
        companyName: companyName.trim(),
        startupMaterials: startupMaterials.trim(),
        vcNotes: vcNotes.trim() || undefined,
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
      console.error('Failed to start DD report:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to start DD report generation';

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
    companyName,
    startupMaterials,
    vcNotes,
    isSubmitting,
    attachments,
    router,
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
          designChallenge={`DD: ${companyName}`}
        />
      </div>
    );
  }

  // Input step - Matches regular new analysis page styling
  return (
    <main className="flex flex-col bg-white">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
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
            This is often a false positive for legitimate due diligence. Please
            rephrase your materials, focusing on the technical aspects.
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="px-8 pt-24 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          {/* Back link */}
          <AppLink
            href="/home/reports"
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
            All Reports
          </AppLink>

          {/* Page title - anchor element */}
          <h1 className="font-heading mb-4 text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
            Due Diligence
          </h1>

          {/* Subtitle */}
          <p className="mb-12 text-[15px] tracking-[-0.02em] text-zinc-500">
            Technical due diligence for deep tech startups. First-principles
            validation of claims, moat assessment, and competitive landscape
            analysis.
          </p>

          {/* Input card with inner signature border */}
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="flex">
              {/* Signature left border */}
              <div className="w-0.5 bg-zinc-900" />
              {/* Content */}
              <div className="flex-1 p-8">
                {/* Company Name Input */}
                <div className="mb-8">
                  <label
                    htmlFor="company-name"
                    className="mb-2 block text-[13px] font-medium tracking-[-0.02em] text-zinc-500"
                  >
                    Company Name
                  </label>
                  <input
                    id="company-name"
                    type="text"
                    value={companyName}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        companyName: e.target.value,
                        showRefusalWarning: false,
                      }))
                    }
                    disabled={isSubmitting}
                    autoFocus
                    data-test="dd-company-name-input"
                    placeholder="e.g., Acme Deep Tech"
                    className="w-full border-none bg-transparent p-0 text-[20px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-none focus:ring-0 focus:outline-none disabled:opacity-40"
                    style={{ outline: 'none' }}
                  />
                </div>

                {/* Startup Materials Textarea */}
                <div className="mb-8">
                  <label
                    htmlFor="startup-materials"
                    className="mb-2 block text-[13px] font-medium tracking-[-0.02em] text-zinc-500"
                  >
                    Startup Materials
                    <span className="ml-2 font-normal text-zinc-400">
                      (Pitch deck text, technical claims, product description)
                    </span>
                  </label>
                  <textarea
                    id="startup-materials"
                    value={startupMaterials}
                    onChange={(e) => {
                      setFormState((prev) => ({
                        ...prev,
                        startupMaterials: e.target.value,
                        showRefusalWarning: false,
                      }));
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitting}
                    data-test="dd-materials-input"
                    placeholder="Paste the startup's pitch materials, technical claims, product description, and any relevant technical documentation..."
                    className="h-48 w-full resize-none border-none bg-transparent p-0 text-[18px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-none focus:ring-0 focus:outline-none disabled:opacity-40"
                    style={{ outline: 'none' }}
                  />
                </div>

                {/* VC Notes (Optional) */}
                <div className="mb-8">
                  <label
                    htmlFor="vc-notes"
                    className="mb-2 block text-[13px] font-medium tracking-[-0.02em] text-zinc-500"
                  >
                    VC Notes
                    <span className="ml-2 font-normal text-zinc-400">
                      (Optional - specific concerns or focus areas)
                    </span>
                  </label>
                  <textarea
                    id="vc-notes"
                    value={vcNotes}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        vcNotes: e.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                    data-test="dd-vc-notes-input"
                    placeholder="Add any specific areas you want the DD to focus on, concerns you've heard, or questions from partners..."
                    className="h-24 w-full resize-none border-none bg-transparent p-0 text-[16px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-none focus:ring-0 focus:outline-none disabled:opacity-40"
                    style={{ outline: 'none' }}
                  />
                </div>

                {/* Detection indicators */}
                <div className="flex items-center gap-6">
                  <DetectionIndicator
                    label="Company Info"
                    detected={hasCompanyInfo(startupMaterials)}
                  />
                  <DetectionIndicator
                    label="Tech Claims"
                    detected={hasTechClaims(startupMaterials)}
                  />
                  <DetectionIndicator
                    label="Product Details"
                    detected={hasProductDetails(startupMaterials)}
                  />
                </div>

                {/* Attached files */}
                {attachments.length > 0 && (
                  <div className="mt-6">
                    <div className="flex flex-wrap items-center gap-3">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="group flex items-center gap-2 rounded border border-zinc-200 bg-zinc-50 py-1.5 pr-2 pl-1.5 transition-colors hover:border-zinc-300"
                        >
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
                          <span className="max-w-[120px] truncate text-[12px] tracking-[-0.02em] text-zinc-600">
                            {attachment.file.name}
                          </span>
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
                <div className="mt-10 flex items-center justify-between">
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
                    <span className="text-zinc-300">·</span>
                    <span className="text-[13px] tracking-[-0.02em] text-zinc-400">
                      {startupMaterials.length < MIN_MATERIALS_LENGTH
                        ? `Min ${MIN_MATERIALS_LENGTH} chars`
                        : `${startupMaterials.length.toLocaleString()} chars`}
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

                {error && (
                  <p className="mt-4 text-[14px] tracking-[-0.02em] text-red-600">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
