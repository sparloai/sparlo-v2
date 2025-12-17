'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { motion } from 'framer-motion';
import { ArrowRight, Check, Loader2, MessageSquare, Send } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';

import { answerClarification } from '../_lib/server/sparlo-reports-server-actions';
import { type ReportProgress } from '../_lib/use-report-progress';

interface ProcessingScreenProps {
  progress: ReportProgress;
  onComplete?: () => void;
}

/**
 * Hook to calculate elapsed time from a timestamp.
 * Persists correctly across page refresh by using database timestamp.
 */
function useElapsedTime(createdAt: string | null): number {
  const calculateElapsed = (timestamp: string | null) => {
    if (!timestamp) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
  };

  const [prevCreatedAt, setPrevCreatedAt] = useState(createdAt);
  const [elapsed, setElapsed] = useState(() => calculateElapsed(createdAt));

  // Handle createdAt changes during render (React-recommended pattern)
  if (createdAt !== prevCreatedAt) {
    setPrevCreatedAt(createdAt);
    setElapsed(calculateElapsed(createdAt));
  }

  useEffect(() => {
    if (!createdAt) return;

    const startTime = new Date(createdAt).getTime();

    // Update every second
    const interval = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  return elapsed;
}

/**
 * Format elapsed seconds as M:SS
 */
function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ProcessingScreen({
  progress,
  onComplete,
}: ProcessingScreenProps) {
  const [clarificationAnswer, setClarificationAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasNavigatedRef = useRef(false);

  // Use database timestamp for elapsed time (persists across refresh)
  const elapsedSeconds = useElapsedTime(progress.createdAt);

  // Auto-navigate when status changes to complete
  useEffect(() => {
    if (progress.status === 'complete' && onComplete && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      onComplete();
    }
  }, [progress.status, onComplete]);

  // Get the current clarification question (if any)
  const pendingClarification = progress.clarifications?.find((c) => !c.answer);

  const handleSubmitClarification = useCallback(async () => {
    if (!clarificationAnswer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await answerClarification({
        reportId: progress.id,
        answer: clarificationAnswer.trim(),
      });
      setClarificationAnswer('');
    } catch (error) {
      console.error('Failed to submit clarification:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [clarificationAnswer, isSubmitting, progress.id]);

  // Handle complete status
  if (progress.status === 'complete') {
    return (
      <motion.div
        className="flex min-h-[60vh] flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <Check className="h-8 w-8 text-emerald-500" strokeWidth={2.5} />
        </motion.div>

        <motion.h2
          className="mt-6 text-2xl font-semibold text-[#1A1A1A] dark:text-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Analysis Complete
        </motion.h2>

        <motion.p
          className="mt-2 text-[#6A6A6A]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Your innovation report is ready
        </motion.p>

        {onComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={onComplete}
              size="lg"
              className="mt-8 rounded-lg bg-[#7C3AED] px-8 text-white hover:bg-[#6D28D9]"
              style={{
                boxShadow: '0 4px 14px -2px rgba(124, 58, 237, 0.4)',
              }}
            >
              View Full Report
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Handle error status
  if (progress.status === 'error') {
    return (
      <motion.div
        className="flex min-h-[60vh] flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
          <span className="text-2xl">!</span>
        </div>

        <h2 className="mt-6 text-2xl font-semibold text-[#1A1A1A] dark:text-white">
          Something went wrong
        </h2>

        <p className="mt-2 max-w-md text-center text-[#6A6A6A]">
          {progress.errorMessage ||
            'An error occurred while generating your report. Please try again.'}
        </p>
      </motion.div>
    );
  }

  // Handle clarification status
  if (progress.status === 'clarifying' && pendingClarification) {
    return (
      <motion.div
        className="flex min-h-[60vh] flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-full max-w-xl space-y-6">
          <div className="text-center">
            <motion.div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <MessageSquare className="h-6 w-6 text-[#7C3AED]" />
            </motion.div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#1A1A1A] dark:text-white">
              Quick question
            </h2>
            <p className="mt-2 text-[#6A6A6A]">
              Help us understand your challenge better
            </p>
          </div>

          <motion.div
            className="rounded-xl border border-[#E5E5E5] bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="mb-4 text-base font-medium text-[#1A1A1A] dark:text-white">
              {pendingClarification.question}
            </p>
            <Textarea
              value={clarificationAnswer}
              onChange={(e) => setClarificationAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
            />
          </motion.div>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setClarificationAnswer('Skip this question');
                handleSubmitClarification();
              }}
              disabled={isSubmitting}
              className="text-[#6B6B6B]"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmitClarification}
              disabled={!clarificationAnswer.trim() || isSubmitting}
              className="bg-[#7C3AED] hover:bg-[#6D28D9]"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Continue
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Determine if we're in the initial review phase (AN0) or main analysis
  const isInitialReview = !progress.currentStep || progress.currentStep === 'an0';

  // Default: Processing status - two states based on current phase
  return (
    <motion.div
      className="flex min-h-[60vh] flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Rotating diamond animation */}
        <motion.div
          className="text-[#7C3AED]"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L22 12L12 22L2 12L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <motion.path
              d="M12 6L18 12L12 18L6 12L12 6Z"
              fill="currentColor"
              animate={{ scale: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        </motion.div>

        {isInitialReview ? (
          <>
            {/* Initial review phase - may ask follow-up */}
            <p className="text-lg font-light text-[#1A1A1A] dark:text-white">
              Reviewing your question...
            </p>

            <p className="max-w-sm text-center text-sm text-[#8A8A8A]">
              We may ask a follow-up question to better understand your challenge
            </p>

            {/* Elapsed time */}
            <p className="text-sm tabular-nums text-[#8A8A8A]">
              {formatElapsed(elapsedSeconds)} elapsed
            </p>
          </>
        ) : (
          <>
            {/* Main analysis phase - no clarification needed */}
            <p className="text-lg font-light text-[#1A1A1A] dark:text-white">
              Analyzing your question...
            </p>

            {/* Elapsed time */}
            <p className="text-sm tabular-nums text-[#8A8A8A]">
              {formatElapsed(elapsedSeconds)} elapsed
            </p>

            {/* Duration estimate */}
            <p className="text-sm text-[#8A8A8A]">
              Analyses typically take ~15 minutes
            </p>

            {/* Safe to leave notice */}
            <div className="mt-4 text-center text-sm text-[#8A8A8A]">
              <p className="flex items-center justify-center gap-1">
                <Check className="h-4 w-4 text-emerald-500" />
                Safe to close this page
              </p>
              <p className="mt-1">We&apos;ll email you when complete.</p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
