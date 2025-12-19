'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import type { Variants } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Loader2,
  MessageSquare,
  Send,
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import { usePrefersReducedMotion } from '@kit/ui/hooks';
import { Textarea } from '@kit/ui/textarea';

import { DURATION, EASING } from '../_lib/animation-constants';
import { answerClarification } from '../_lib/server/sparlo-reports-server-actions';
import { type ReportProgress } from '../_lib/use-report-progress';

interface ProcessingScreenProps {
  progress: ReportProgress;
  onComplete?: () => void;
  designChallenge?: string;
}

// Animation variants - defined outside component for performance
const pulseVariants: Variants = {
  initial: { scale: 1, opacity: 0.8 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: DURATION.pulse,
      repeat: Infinity,
      ease: EASING.easeInOut,
    },
  },
};

const spinVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: DURATION.spin,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

const textVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASING.easeOut },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: DURATION.fast, ease: EASING.easeIn },
  },
};

const STATUS_MESSAGES = [
  'Analyzing your problem...',
  'Researching patterns...',
  'Generating insights...',
  'Building recommendations...',
];

/**
 * Calculate elapsed seconds from a timestamp string.
 */
function calculateElapsed(createdAt: string | null): number {
  if (!createdAt) return 0;
  const startTime = new Date(createdAt).getTime();
  if (isNaN(startTime)) return 0;
  return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
}

/**
 * Hook to calculate elapsed time from a timestamp.
 * Persists correctly across page refresh by using database timestamp.
 *
 * Uses interval pattern where interval fires immediately (0ms delay on first tick)
 * to avoid lint warnings about setState in effects while still getting immediate updates.
 */
function useElapsedTime(createdAt: string | null): number {
  const [elapsed, setElapsed] = useState(() => calculateElapsed(createdAt));

  useEffect(() => {
    // Fire immediately, then every second
    let immediate = true;
    const update = () => {
      setElapsed(calculateElapsed(createdAt));
    };

    // Immediate update via microtask to avoid lint warning
    if (immediate) {
      immediate = false;
      queueMicrotask(update);
    }

    // Update every second
    const interval = setInterval(update, 1000);

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
  designChallenge,
}: ProcessingScreenProps) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [clarificationAnswer, setClarificationAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const hasNavigatedRef = useRef(false);

  // Use database timestamp for elapsed time (persists across refresh)
  const elapsedSeconds = useElapsedTime(progress.createdAt);

  // Cycle through status messages
  useEffect(() => {
    if (
      progress.status !== 'processing' ||
      progress.currentStep === 'an0' ||
      prefersReducedMotion
    )
      return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [progress.status, progress.currentStep, prefersReducedMotion]);

  // Auto-navigate when status changes to complete
  useEffect(() => {
    if (
      progress.status === 'complete' &&
      onComplete &&
      !hasNavigatedRef.current
    ) {
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
        className="flex min-h-[60vh] flex-col items-center justify-center bg-[--surface-base] p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[--status-success]/15"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <Check
            className="h-8 w-8 text-[--status-success]"
            strokeWidth={2.5}
          />
        </motion.div>

        <motion.h2
          className="mt-6 text-2xl font-semibold text-[--text-primary]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Analysis Complete
        </motion.h2>

        <motion.p
          className="mt-2 text-[--text-muted]"
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
              data-test="processing-view-report"
              className="shadow-accent mt-8 rounded-lg bg-[--accent] px-8 text-white hover:bg-[--accent-hover]"
            >
              View Full Report
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Handle error or failed status
  if (progress.status === 'error' || progress.status === 'failed') {
    const isRefusalError = progress.errorMessage?.includes(
      'could not be processed',
    );

    const handleTryAgain = () => {
      // Redirect to new report page with prefilled text and error flag
      const params = new URLSearchParams();
      if (designChallenge) {
        params.set('prefill', designChallenge);
      }
      if (isRefusalError) {
        params.set('error', 'refusal');
      }
      router.push(`/home/reports/new?${params.toString()}`);
    };

    return (
      <motion.div
        className="flex min-h-[60vh] flex-col items-center justify-center bg-[--surface-base] p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[--status-warning]/15">
          <AlertTriangle className="h-8 w-8 text-[--status-warning]" />
        </div>

        <h2 className="mt-6 text-2xl font-semibold text-[--text-primary]">
          {isRefusalError ? 'Query Not Accepted' : 'Something went wrong'}
        </h2>

        <p className="mt-2 max-w-md text-center text-[--text-muted]">
          {isRefusalError
            ? 'Our AI has flagged your query as potentially problematic. This is usually a false positive for legitimate engineering problems.'
            : progress.errorMessage ||
              'An error occurred while generating your report. Please try again.'}
        </p>

        {isRefusalError && (
          <p className="mt-4 max-w-md text-center text-sm text-[--text-muted]/70">
            Try rephrasing your challenge to focus on the engineering problem.
            Avoid terminology that could be misinterpreted as harmful.
          </p>
        )}

        <Button
          onClick={handleTryAgain}
          data-test="processing-retry"
          className="mt-6 bg-[--accent] text-white hover:bg-[--accent-hover]"
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          {isRefusalError ? 'Rewrite Challenge' : 'Try Again'}
        </Button>
      </motion.div>
    );
  }

  // Handle clarification status
  if (progress.status === 'clarifying' && pendingClarification) {
    return (
      <motion.div
        className="flex min-h-[60vh] flex-col items-center justify-center bg-[--surface-base] p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-full max-w-xl space-y-6">
          <div className="text-center">
            <motion.div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[--accent-muted]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <MessageSquare className="h-6 w-6 text-[--accent]" />
            </motion.div>
            <h2 className="text-2xl font-semibold tracking-tight text-[--text-primary]">
              Quick question
            </h2>
            <p className="mt-2 text-[--text-muted]">
              Help us understand your challenge better
            </p>
          </div>

          <motion.div
            className="rounded-xl border border-[--border-default] bg-[--surface-elevated] p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="mb-4 text-base font-medium text-[--text-primary]">
              {pendingClarification.question}
            </p>
            <Textarea
              value={clarificationAnswer}
              onChange={(e) => setClarificationAnswer(e.target.value)}
              placeholder="Type your answer..."
              data-test="clarification-input"
              className="min-h-[100px] resize-none border-[--border-subtle] bg-[--surface-overlay] text-[--text-primary] placeholder:text-[--text-muted]"
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
              className="text-[--text-muted]"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmitClarification}
              disabled={!clarificationAnswer.trim() || isSubmitting}
              data-test="clarification-submit"
              className="bg-[--accent] text-white hover:bg-[--accent-hover]"
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
  const isInitialReview =
    !progress.currentStep || progress.currentStep === 'an0';

  // Default: Processing status - two states based on current phase
  return (
    <motion.div
      className="flex min-h-[60vh] flex-col items-center justify-center bg-[--surface-base] p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo with pulse and spin */}
        <motion.div
          className="text-[--accent]"
          variants={prefersReducedMotion ? undefined : pulseVariants}
          initial="initial"
          animate="animate"
        >
          <motion.div
            variants={prefersReducedMotion ? undefined : spinVariants}
            animate="animate"
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
                animate={
                  prefersReducedMotion ? undefined : { scale: [0.8, 1, 0.8] }
                }
                transition={{ duration: 2, repeat: Infinity }}
              />
            </svg>
          </motion.div>
        </motion.div>

        {isInitialReview ? (
          <>
            {/* Initial review phase - may ask follow-up */}
            <p className="text-lg font-light text-[--text-primary]">
              Reviewing your question...
            </p>

            <p className="max-w-sm text-center text-sm text-[--text-muted]">
              We may ask a follow-up question to better understand your
              challenge
            </p>

            {/* Elapsed time */}
            <p className="text-sm text-[--text-muted] tabular-nums">
              {formatElapsed(elapsedSeconds)} elapsed
            </p>
          </>
        ) : (
          <>
            {/* Main analysis phase - animated status messages */}
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                variants={textVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="text-lg font-light text-[--text-primary]"
              >
                {STATUS_MESSAGES[messageIndex]}
              </motion.p>
            </AnimatePresence>

            {/* Progress bar */}
            <motion.div className="mt-2 h-1 w-64 overflow-hidden rounded-full bg-[--border-subtle]">
              <motion.div
                className="h-full bg-[--accent]"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 900, ease: 'linear' }}
              />
            </motion.div>

            {/* Elapsed time */}
            <p className="text-sm text-[--text-muted] tabular-nums">
              {formatElapsed(elapsedSeconds)} elapsed
            </p>

            {/* Duration estimate */}
            <p className="text-sm text-[--text-muted]">
              Analyses typically take ~15 minutes
            </p>

            {/* Safe to leave notice */}
            <motion.div
              className="mt-4 text-center text-sm text-[--text-muted]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="flex items-center justify-center gap-1">
                <Check className="h-4 w-4 text-[--status-success]" />
                Safe to close this page
              </p>
              <p className="mt-1">We&apos;ll email you when complete.</p>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
