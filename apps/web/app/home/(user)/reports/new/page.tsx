'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription } from '@kit/ui/alert';
import { cn } from '@kit/ui/utils';

import { ProcessingScreen } from '../../_components/processing-screen';
import { startReportGeneration } from '../../_lib/server/sparlo-reports-server-actions';
import { useReportProgress } from '../../_lib/use-report-progress';

const EXAMPLE_PROBLEM = `Reduce backlash in a precision positioning stage to under 5 arc-seconds. Current design uses a standard worm gear. Cannot increase cost or assembly complexity. Volume: 10K units/year.`;

type PagePhase = 'input' | 'processing';

interface FormState {
  phase: PagePhase;
  challengeText: string;
  reportId: string | null;
  isSubmitting: boolean;
  error: string | null;
  showRefusalWarning: boolean;
}

const initialFormState: FormState = {
  phase: 'input',
  challengeText: '',
  reportId: null,
  isSubmitting: false,
  error: null,
  showRefusalWarning: false,
};

export default function NewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<FormState>(initialFormState);

  const {
    phase,
    challengeText,
    reportId,
    isSubmitting,
    error,
    showRefusalWarning,
  } = formState;

  // Handle URL params for prefill and error state
  useEffect(() => {
    const prefill = searchParams.get('prefill');
    const errorType = searchParams.get('error');

    if (prefill || errorType === 'refusal') {
      setFormState((prev) => ({
        ...prev,
        challengeText: prefill || prev.challengeText,
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

  const hasInput = challengeText.trim().length > 0;
  const canSubmit = challengeText.trim().length >= 50;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;

    setFormState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const result = await startReportGeneration({
        designChallenge: challengeText.trim(),
      });

      if (result.reportId) {
        setFormState((prev) => ({
          ...prev,
          reportId: result.reportId,
          phase: 'processing',
          isSubmitting: false,
        }));
      }
    } catch (err) {
      console.error('Failed to start report:', err);
      setFormState((prev) => ({
        ...prev,
        error:
          err instanceof Error
            ? err.message
            : 'Failed to start report generation',
        isSubmitting: false,
      }));
    }
  }, [canSubmit, challengeText, isSubmitting]);

  const handleViewReport = useCallback(() => {
    if (reportId) {
      router.push(`/home/reports/${reportId}`);
    }
  }, [reportId, router]);

  // Show processing screen when we have a report in progress
  if (phase === 'processing' && progress) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-[#08080A]">
        <ProcessingScreen
          progress={progress}
          onComplete={handleViewReport}
          designChallenge={challengeText}
        />
      </div>
    );
  }

  // Input phase - minimal industrial design
  return (
    <div className="flex min-h-screen flex-col bg-[#08080A] text-[#FAFAFA]">
      {/* Main content */}
      <main className="flex flex-1 items-center justify-center px-6 pb-20">
        <div className="w-full max-w-[640px]">
          {/* Section Label */}
          <div className="mb-8">
            <span className="font-mono text-[11px] font-medium tracking-[0.15em] text-[#52525B] uppercase">
              Problem
            </span>
            <div className="mt-2 h-px bg-[#27272A]" />
          </div>

          {/* Refusal warning */}
          {showRefusalWarning && (
            <div className="mb-6">
              <Alert
                variant="destructive"
                className="border-[#7f1d1d] bg-[#7f1d1d]/10 text-[#fca5a5]"
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>
                    Your previous query was flagged by our AI safety filters.
                  </strong>{' '}
                  This is often a false positive for legitimate engineering
                  problems. Please rephrase your challenge, focusing on the
                  engineering aspects.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Textarea with Ghost Example */}
          <div className="relative">
            {/* Ghost text (visible when input is empty) */}
            {!hasInput && (
              <div className="pointer-events-none absolute inset-0 p-5">
                <p className="font-mono text-[14px] leading-[1.8] text-[#27272A]">
                  {EXAMPLE_PROBLEM}
                </p>
              </div>
            )}

            {/* Actual textarea */}
            <textarea
              value={challengeText}
              onChange={(e) => {
                setFormState((prev) => ({
                  ...prev,
                  challengeText: e.target.value,
                  showRefusalWarning: false,
                }));
              }}
              disabled={isSubmitting}
              data-test="challenge-input"
              className={cn(
                'relative w-full',
                'min-h-[220px]',
                'rounded-[3px] border border-[#1F1F23] bg-[#0A0A0C]',
                'p-5',
                'font-mono text-[14px] leading-[1.8] text-[#FAFAFA]',
                'resize-none',
                'transition-colors duration-100',
                'placeholder:text-transparent',
                'focus:border-[#3F3F46] focus:outline-none',
                'disabled:opacity-40',
              )}
              placeholder=""
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="mt-3 font-mono text-[12px] text-[#ef4444]">{error}</p>
          )}

          {/* Action Bar */}
          <div
            className={cn(
              'mt-4 flex items-center justify-between',
              'rounded-[3px] border border-[#1F1F23] bg-[#0A0A0C] p-4',
              // Mobile: stack vertically
              'max-[480px]:flex-col max-[480px]:gap-4',
            )}
          >
            {/* Duration info */}
            <div
              className={cn(
                'flex items-center gap-3',
                // Mobile: reorder to bottom and center
                'max-[480px]:order-2 max-[480px]:justify-center',
              )}
            >
              <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-[#3F3F46] uppercase">
                ~8 min
              </span>
              <span className="text-[12px] text-[#27272A]">|</span>
              <span className="font-mono text-[11px] text-[#27272A]">
                Deep analysis
              </span>
            </div>

            {/* Run Button */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              data-test="challenge-submit"
              className={cn(
                'rounded-[2px] px-5 py-2',
                'bg-[#FAFAFA] text-[#08080A]',
                'font-mono text-[12px] font-semibold tracking-[0.05em] uppercase',
                'transition-all duration-100',
                'hover:bg-[#E4E4E7]',
                'disabled:cursor-not-allowed disabled:opacity-20 disabled:hover:bg-[#FAFAFA]',
                // Mobile: full width and first
                'max-[480px]:order-1 max-[480px]:w-full',
              )}
            >
              {isSubmitting ? 'Running...' : 'Run Analysis'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
