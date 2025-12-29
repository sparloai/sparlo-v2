'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import type { Variants } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Loader2,
  Send,
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import { usePrefersReducedMotion } from '@kit/ui/hooks';
import { Textarea } from '@kit/ui/textarea';
import { cn } from '@kit/ui/utils';

import { DURATION, EASING } from '../_lib/animation-constants';
import { answerClarification } from '../_lib/server/sparlo-reports-server-actions';
import { type ReportProgress } from '../_lib/use-report-progress';
import { formatElapsed, useElapsedTime } from '../_lib/utils/elapsed-time';
import { ERROR_PATTERNS } from '../_lib/utils/error-constants';

interface ProcessingScreenProps {
  progress: ReportProgress;
  onComplete?: () => void;
  designChallenge?: string;
}

// Animation variants for text transitions
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
    // Don't cycle messages during AN0 phase (any variant)
    if (
      progress.status !== 'processing' ||
      progress.currentStep?.startsWith('an0') ||
      prefersReducedMotion
    )
      return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [progress.status, progress.currentStep, prefersReducedMotion]);

  // Memoize pending clarification check to avoid recalculation on every render
  const hasPendingClarification = useMemo(
    () => progress.clarifications?.some((c) => c.answer == null) ?? false,
    [progress.clarifications],
  );

  // Consolidated navigation effect - prevents race condition between two effects
  useEffect(() => {
    if (hasNavigatedRef.current) return;

    // DEBUG: Log progress state to understand AN0 redirect timing
    console.log('[ProcessingScreen] Progress state:', {
      status: progress.status,
      currentStep: progress.currentStep,
      clarifications: progress.clarifications?.length ?? 0,
      id: progress.id,
    });

    // Priority 1: Report complete - navigate to report
    if (progress.status === 'complete' && onComplete) {
      hasNavigatedRef.current = true;
      onComplete();
      return;
    }

    // Priority 2: AN0 bypass - redirect to dashboard when no clarification needed
    // Check for any AN0 variant (an0, an0-d for discovery, etc.)
    const isStillInAN0 =
      progress.currentStep === null || progress.currentStep.startsWith('an0');
    const movedPastAN0 = progress.status === 'processing' && !isStillInAN0;
    const noClarificationNeeded = movedPastAN0 && !hasPendingClarification;

    // DEBUG: Log redirect decision
    if (movedPastAN0) {
      console.log(
        '[ProcessingScreen] Moved past AN0, checking clarifications:',
        {
          movedPastAN0,
          hasPendingClarification,
          noClarificationNeeded,
          willRedirect: noClarificationNeeded,
        },
      );
    }

    if (noClarificationNeeded) {
      hasNavigatedRef.current = true;
      router.push('/home');
    }
  }, [
    progress.status,
    progress.currentStep,
    progress.clarifications,
    progress.id,
    hasPendingClarification,
    onComplete,
    router,
  ]);

  // Get the current clarification question (if any)
  const pendingClarification = progress.clarifications?.find(
    (c) => c.answer == null,
  );

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
      ERROR_PATTERNS.REFUSAL,
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

  // Handle option selection
  const handleSelectOption = useCallback(
    async (optionLabel: string) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        await answerClarification({
          reportId: progress.id,
          answer: optionLabel,
        });
        setClarificationAnswer('');
      } catch (error) {
        console.error('Failed to submit clarification:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, progress.id],
  );

  // Handle clarification status - Premium Air Company design
  if (progress.status === 'clarifying' && pendingClarification) {
    const hasOptions =
      pendingClarification.options && pendingClarification.options.length > 0;

    return (
      <motion.div
        className="relative flex min-h-screen flex-col items-center justify-center bg-white px-6 py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-full max-w-xl">
          {/* Context label - small, uppercase, structured */}
          {pendingClarification.context && (
            <motion.p
              className="mb-6 text-center text-[11px] font-medium tracking-[0.1em] text-zinc-400 uppercase"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {pendingClarification.context}
            </motion.p>
          )}

          {/* Main Question - Bold, commanding presence */}
          <motion.h1
            className="mb-16 text-center text-[28px] leading-[1.3] font-medium tracking-[-0.02em] text-zinc-900 md:text-[36px]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            {pendingClarification.question}
          </motion.h1>

          {/* Options - Premium card design */}
          {hasOptions && (
            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              {pendingClarification.options?.map((option, index) => (
                <motion.button
                  key={option.id}
                  onClick={() => handleSelectOption(option.label)}
                  disabled={isSubmitting}
                  data-test={`clarification-option-${option.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.995 }}
                  className={cn(
                    'group relative w-full rounded-lg border px-5 py-4 text-left',
                    'border-zinc-200 bg-white',
                    'transition-all duration-200 ease-out',
                    'hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]',
                    'focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2',
                    'active:bg-zinc-100',
                    'disabled:cursor-not-allowed disabled:opacity-40',
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Letter indicator - clean, visible */}
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                        'bg-zinc-100 font-mono text-[13px] font-medium text-zinc-500',
                        'transition-all duration-200',
                        'group-hover:bg-zinc-900 group-hover:text-white',
                      )}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>

                    {/* Option text */}
                    <span className="flex-1 text-[15px] leading-snug font-normal text-zinc-800">
                      {option.label}
                    </span>

                    {/* Arrow indicator */}
                    <ArrowRight
                      className={cn(
                        'h-4 w-4 text-zinc-300',
                        'transition-all duration-200',
                        'group-hover:translate-x-0.5 group-hover:text-zinc-500',
                      )}
                    />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Freetext section - refined design */}
          {pendingClarification.allows_freetext && (
            <motion.div
              className="mt-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              {/* Divider with label */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-[12px] font-medium tracking-wide text-zinc-400 uppercase">
                    {pendingClarification.freetext_prompt || 'Or type your own'}
                  </span>
                </div>
              </div>

              {/* Textarea - minimal, elegant */}
              <div className="relative">
                <Textarea
                  value={clarificationAnswer}
                  onChange={(e) => setClarificationAnswer(e.target.value)}
                  placeholder="Describe your specific situation..."
                  data-test="clarification-input"
                  className={cn(
                    'min-h-[100px] w-full resize-none rounded-lg border px-4 py-3.5',
                    'border-zinc-200 bg-white text-[15px] text-zinc-800 placeholder-zinc-400',
                    'transition-all duration-200',
                    'focus:border-zinc-400 focus:outline-none focus:ring-0',
                    'disabled:opacity-40',
                  )}
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmitClarification();
                    }
                  }}
                />

                {/* Submit button - appears when typing */}
                <AnimatePresence>
                  {clarificationAnswer.trim() && (
                    <motion.div
                      className="mt-4 flex justify-end"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                    >
                      <button
                        onClick={handleSubmitClarification}
                        disabled={isSubmitting}
                        data-test="clarification-submit"
                        className={cn(
                          'flex items-center gap-2 rounded-md px-5 py-2.5',
                          'bg-zinc-900 text-[14px] font-medium text-white',
                          'transition-all duration-150',
                          'hover:bg-zinc-800',
                          'active:scale-[0.98]',
                          'disabled:cursor-not-allowed disabled:opacity-50',
                        )}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        <span>Submit</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Elapsed time - subtle footer */}
          <motion.p
            className="mt-12 text-center text-[12px] tracking-wide text-zinc-300 tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {formatElapsed(elapsedSeconds)}
          </motion.p>
        </div>
      </motion.div>
    );
  }

  // Determine if we're in the initial review phase (AN0) or main analysis
  // Handle any AN0 variant (an0, an0-d for discovery, etc.)
  const isInitialReview =
    !progress.currentStep || progress.currentStep.startsWith('an0');

  // Default: Processing status - two states based on current phase
  // Air Company inspired: clean, bold, minimal
  if (isInitialReview) {
    return (
      <motion.div
        className="flex min-h-screen flex-col items-center justify-center bg-white px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex flex-col items-center">
          {/* Minimal animated indicator - three dots */}
          <div className="mb-12 flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-zinc-900"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Bold headline */}
          <h1 className="mb-4 text-center text-[32px] font-medium tracking-[-0.02em] text-zinc-900 md:text-[40px]">
            Reviewing your challenge
          </h1>

          {/* Simple subtext */}
          <p className="mb-8 max-w-md text-center text-[15px] leading-relaxed text-zinc-500">
            We may ask a clarifying question, or proceed directly to analysis.
          </p>

          {/* Elapsed time - subtle */}
          <p className="text-[13px] tracking-wide text-zinc-400 tabular-nums">
            {formatElapsed(elapsedSeconds)}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex min-h-screen flex-col items-center justify-center bg-white px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col items-center">
        {/* Animated dots for main analysis */}
        <div className="mb-8 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-zinc-900"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Main analysis phase - animated status messages */}
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            variants={textVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-[18px] font-normal tracking-[-0.01em] text-zinc-600"
          >
            {STATUS_MESSAGES[messageIndex]}
          </motion.p>
        </AnimatePresence>

        {/* Elapsed time */}
        <p className="mt-6 text-[13px] tracking-wide text-zinc-400 tabular-nums">
          {formatElapsed(elapsedSeconds)}
        </p>

        {/* Duration estimate */}
        <p className="mt-2 text-[13px] text-zinc-400">
          Analyses typically take ~15 minutes
        </p>

        {/* Safe to leave notice */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="flex items-center justify-center gap-1.5 text-[13px] text-zinc-500">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            Safe to close this page
          </p>
          <p className="mt-1 text-[13px] text-zinc-400">
            We&apos;ll email you when complete.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
