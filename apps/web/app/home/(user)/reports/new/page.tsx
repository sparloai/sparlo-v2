'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

import { Alert, AlertDescription } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { cn } from '@kit/ui/utils';

import { ProcessingScreen } from '../../_components/processing-screen';
import { startReportGeneration } from '../../_lib/server/sparlo-reports-server-actions';
import { analyzeInputQuality } from '../../_lib/types';
import { useReportProgress } from '../../_lib/use-report-progress';

type PagePhase = 'input' | 'processing';

export default function NewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<PagePhase>('input');
  const [challengeText, setChallengeText] = useState('');
  const [reportId, setReportId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRefusalWarning, setShowRefusalWarning] = useState(false);

  // Handle URL params for prefill and error state
  useEffect(() => {
    const prefill = searchParams.get('prefill');
    const errorType = searchParams.get('error');

    if (prefill) {
      setChallengeText(prefill);
    }
    if (errorType === 'refusal') {
      setShowRefusalWarning(true);
    }

    // Clear params from URL without navigation
    if (prefill || errorType) {
      window.history.replaceState({}, '', '/home/reports/new');
    }
  }, [searchParams]);

  // Track progress once we have a report ID
  const { progress } = useReportProgress(reportId);

  const inputQuality = analyzeInputQuality(challengeText);
  const wordCount = challengeText.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = challengeText.trim().length >= 50;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await startReportGeneration({
        designChallenge: challengeText.trim(),
      });

      if (result.reportId) {
        setReportId(result.reportId);
        setPhase('processing');
      }
    } catch (err) {
      console.error('Failed to start report:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to start report generation',
      );
    } finally {
      setIsSubmitting(false);
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
      <div className="min-h-[calc(100vh-120px)]">
        <ProcessingScreen
          progress={progress}
          onComplete={handleViewReport}
          designChallenge={challengeText}
        />
      </div>
    );
  }

  // Input phase
  return (
    <motion.div
      className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-2xl space-y-8">
        {/* Brand mark */}
        <div className="flex justify-center">
          <motion.div
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Sparkles className="h-6 w-6 text-[#7C3AED]" />
          </motion.div>
        </div>

        {/* Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A] dark:text-white">
            Describe your engineering challenge
          </h1>
          <p className="mt-2 text-[#6A6A6A]">
            Sparlo will analyze your problem and generate innovative solution
            concepts
          </p>
        </motion.div>

        {/* Refusal warning */}
        {showRefusalWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Your previous query was flagged by our AI safety filters.</strong>
                {' '}This is often a false positive for legitimate engineering problems.
                Please rephrase your challenge, focusing on the engineering aspects
                and avoiding terminology that could be misinterpreted.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Input area */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Textarea
            value={challengeText}
            onChange={(e) => {
              setChallengeText(e.target.value);
              // Clear refusal warning when user starts editing
              if (showRefusalWarning) {
                setShowRefusalWarning(false);
              }
            }}
            placeholder="What engineering problem are you trying to solve? Include constraints, goals, and any relevant context for better results..."
            className="min-h-[200px] resize-none text-base leading-relaxed"
            disabled={isSubmitting}
          />

          {/* Error message */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Quality feedback and submit */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#8A8A8A] tabular-nums">
                {wordCount} words
              </span>
              {challengeText.length >= 30 && (
                <div className="flex items-center gap-3">
                  {[
                    {
                      check: inputQuality.checks.hasChallenge,
                      label: 'Problem',
                    },
                    {
                      check: inputQuality.checks.hasConstraints,
                      label: 'Constraints',
                    },
                    { check: inputQuality.checks.hasGoals, label: 'Goals' },
                    { check: inputQuality.checks.hasContext, label: 'Context' },
                  ].map(({ check, label }) => (
                    <div
                      key={label}
                      className={cn(
                        'flex items-center gap-1 text-xs transition-colors',
                        check ? 'text-[#7C3AED]' : 'text-[#8A8A8A]/50',
                      )}
                    >
                      <div
                        className={cn(
                          'h-1.5 w-1.5 rounded-full transition-colors',
                          check ? 'bg-[#7C3AED]' : 'bg-[#E5E5E5]',
                        )}
                      />
                      <span className="hidden sm:inline">{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="bg-[#7C3AED] hover:bg-[#6D28D9]"
            >
              {isSubmitting ? (
                'Starting...'
              ) : (
                <>
                  Generate Report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Character requirement hint */}
          {challengeText.length > 0 && challengeText.length < 50 && (
            <p className="text-center text-sm text-[#8A8A8A]">
              Please provide at least 50 characters ({50 - challengeText.length}{' '}
              more needed)
            </p>
          )}

          {/* Time notice */}
          <p className="text-center text-sm text-[#8A8A8A]">
            Analysis takes 5-10 minutes. Safe to leave this page.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
