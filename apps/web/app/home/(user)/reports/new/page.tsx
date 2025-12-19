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
  const [isFocused, setIsFocused] = useState(false);

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
      router.push(`/home/reports/${reportId}`);
    }
  }, [reportId, router]);

  // Show processing screen when we have a report in progress
  if (phase === 'processing' && progress) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-[#111113]">
        <ProcessingScreen
          progress={progress}
          onComplete={handleViewReport}
          designChallenge={challengeText}
        />
      </div>
    );
  }

  // Input phase - beautiful technical design
  return (
    <div className="flex min-h-screen flex-col bg-[#111113] text-[#FAFAFA]">
      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-[640px]">
          {/* Page Title */}
          <h1
            className="mb-6 text-[22px] font-medium tracking-[-0.02em] text-[#FAFAFA]"
            style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
          >
            New Analysis
          </h1>

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

          {/* Input Container - Unified box */}
          <div
            className={cn(
              'border transition-colors duration-150',
              isFocused ? 'border-[#3A3A3F]' : 'border-[#2A2A2E]',
            )}
            style={{ borderRadius: '4px' }}
          >
            {/* Textarea Area */}
            <div
              className="relative bg-[#18181B]"
              style={{ borderRadius: '4px 4px 0 0' }}
            >
              {/* Ghost text */}
              {!hasInput && (
                <div className="pointer-events-none absolute inset-0 select-none p-5">
                  <p
                    className="text-[15px] leading-[1.7] text-[#3A3A3F]"
                    style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                  >
                    {EXAMPLE_PROBLEM}
                  </p>
                </div>
              )}

              {/* Textarea */}
              <textarea
                value={challengeText}
                onChange={(e) => {
                  setFormState((prev) => ({
                    ...prev,
                    challengeText: e.target.value,
                    showRefusalWarning: false,
                  }));
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isSubmitting}
                autoFocus
                data-test="challenge-input"
                className="relative min-h-[200px] w-full resize-none bg-transparent p-5 text-[15px] leading-[1.7] text-[#FAFAFA] focus:outline-none disabled:opacity-40"
                style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
              />
            </div>

            {/* Command Bar */}
            <div
              className="flex items-center justify-between border-t border-[#2A2A2E] bg-[#141416] px-5 py-3"
              style={{ borderRadius: '0 0 4px 4px' }}
            >
              {/* Left: Duration */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-[#58585C]">
                  ~15 min
                </span>
                <span className="text-[12px] text-[#2A2A2E]">·</span>
                <span className="font-mono text-[12px] text-[#3A3A3F]">
                  Deep Analysis
                </span>
              </div>

              {/* Right: Button */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                data-test="challenge-submit"
                className={cn(
                  'px-4 py-2 text-[13px] font-medium transition-all duration-150',
                  canSubmit && !isSubmitting
                    ? 'bg-[#FAFAFA] text-[#111113] hover:bg-[#E8E8EB]'
                    : 'cursor-not-allowed bg-[#2A2A2E] text-[#58585C]',
                )}
                style={{
                  borderRadius: '3px',
                  fontFamily: 'Soehne, Inter, sans-serif',
                }}
              >
                {isSubmitting ? 'Running...' : 'Run Analysis'}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p
              className="mt-3 text-[12px] text-[#ef4444]"
              style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
            >
              {error}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
