'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import type { Variants } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Check, Loader2 } from 'lucide-react';

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
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [clarificationAnswer, setClarificationAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const hasNavigatedRef = useRef(false);

  // Use database timestamp for elapsed time (persists across refresh)
  const elapsedSeconds = useElapsedTime(progress.createdAt);

  // Helper to check if still in initial review phase (AN0 for technical, DD0 for due diligence)
  const isInitialPhase = (step: string | null) =>
    !step || step.startsWith('an0') || step.startsWith('dd0');

  // Cycle through status messages
  useEffect(() => {
    // Don't cycle messages during initial review phase (AN0 or DD0)
    if (
      progress.status !== 'processing' ||
      isInitialPhase(progress.currentStep) ||
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
    const isStillInInitial = isInitialPhase(progress.currentStep);
    console.log('[ProcessingScreen] Progress state:', {
      status: progress.status,
      currentStep: progress.currentStep,
      isInitialPhase: isStillInInitial,
      clarifications: progress.clarifications?.length ?? 0,
      hasPendingClarification,
      id: progress.id,
      pathname,
    });

    // Priority 1: Report complete - navigate to report
    if (progress.status === 'complete' && onComplete) {
      hasNavigatedRef.current = true;
      onComplete();
      return;
    }

    // Priority 2: Initial phase bypass - redirect to dashboard when no clarification needed
    // Check for initial review phase (AN0 for technical, DD0 for due diligence)
    const isStillInInitialPhase = isInitialPhase(progress.currentStep);
    const movedPastInitialPhase =
      progress.status === 'processing' && !isStillInInitialPhase;
    const noClarificationNeeded =
      movedPastInitialPhase && !hasPendingClarification;

    // DEBUG: Log redirect decision
    if (movedPastInitialPhase) {
      console.log(
        '[ProcessingScreen] Moved past initial phase, checking clarifications:',
        {
          movedPastInitialPhase,
          hasPendingClarification,
          noClarificationNeeded,
          willRedirect: noClarificationNeeded,
        },
      );
    }

    if (noClarificationNeeded) {
      // Don't redirect if we're on a "new report" page - user should stay to see progress
      const isNewReportPage =
        pathname?.includes('/reports/new') ||
        pathname?.includes('/reports/discovery/new') ||
        pathname?.includes('/reports/hybrid/new') ||
        pathname?.includes('/reports/dd/new');

      if (isNewReportPage) {
        console.log(
          '[ProcessingScreen] Skipping redirect - on new report page:',
          pathname,
        );
        return;
      }

      console.log(
        '[ProcessingScreen] REDIRECTING TO /home because noClarificationNeeded=true',
      );
      hasNavigatedRef.current = true;
      router.push('/app');
    }
  }, [
    progress.status,
    progress.currentStep,
    progress.clarifications,
    progress.id,
    hasPendingClarification,
    onComplete,
    router,
    pathname,
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

  // Handle option selection (must be before early returns per React hooks rules)
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
      router.push(`/app/reports/new?${params.toString()}`);
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

  // Handle clarification status - Sparlo Design System
  if (progress.status === 'clarifying' && pendingClarification) {
    const hasOptions =
      pendingClarification.options && pendingClarification.options.length > 0;

    return (
      <motion.div
        className="min-h-screen bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mx-auto max-w-3xl px-8 pt-24 pb-16">
          {/* Section Label */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <span className="text-[13px] font-semibold tracking-[0.06em] uppercase text-zinc-500">
              Clarification Required
            </span>
          </motion.div>

          {/* Page Title - matches New Analysis style */}
          <motion.h1
            className="font-heading text-[42px] font-normal tracking-[-0.02em] text-zinc-900 mb-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            {pendingClarification.question}
          </motion.h1>

          {/* Content with signature left border */}
          <div className="border-l-2 border-zinc-900 pl-10">
            {/* Context - body text style, not all caps */}
            {pendingClarification.context && (
              <motion.p
                className="text-[18px] leading-[1.5] tracking-[-0.02em] text-zinc-600 mb-10"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {pendingClarification.context}
              </motion.p>
            )}

            {/* Options - Card pattern */}
            {hasOptions && (
              <motion.div
                className="flex flex-col gap-4"
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
                    transition={{ delay: 0.3 + index * 0.06, duration: 0.3 }}
                    className={cn(
                      'group relative w-full text-left',
                      'rounded-xl border border-zinc-200 bg-white p-6',
                      'transition-all duration-200',
                      'hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm',
                      'focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 focus:outline-none',
                      'disabled:cursor-not-allowed disabled:opacity-40',
                    )}
                  >
                    <div className="flex items-start gap-5">
                      {/* Letter indicator */}
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          'bg-zinc-100 font-mono text-[14px] font-medium text-zinc-500',
                          'transition-all duration-200',
                          'group-hover:bg-zinc-900 group-hover:text-white',
                        )}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>

                      {/* Option content */}
                      <div className="flex-1 pt-0.5">
                        <span className="text-[16px] leading-relaxed text-zinc-800">
                          {option.label}
                        </span>
                      </div>

                      {/* Arrow indicator */}
                      <ArrowRight
                        className={cn(
                          'h-5 w-5 mt-1.5 text-zinc-300 shrink-0',
                          'transition-all duration-200',
                          'group-hover:translate-x-1 group-hover:text-zinc-500',
                        )}
                      />
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Freetext section */}
            {pendingClarification.allows_freetext && (
              <motion.div
                className="mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                {/* Label */}
                <span className="text-[13px] font-semibold tracking-[0.06em] uppercase text-zinc-500 mb-4 block">
                  {pendingClarification.freetext_prompt ||
                    'Or describe your situation'}
                </span>

                {/* Textarea - card style */}
                <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                  <Textarea
                    value={clarificationAnswer}
                    onChange={(e) => setClarificationAnswer(e.target.value)}
                    placeholder="Type your response here..."
                    data-test="clarification-input"
                    className={cn(
                      'min-h-[120px] w-full resize-none border-0 px-6 py-5',
                      'bg-transparent text-[16px] text-zinc-800 placeholder-zinc-400',
                      'focus:ring-0 focus:outline-none',
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

                  {/* Submit button - inside card footer */}
                  <AnimatePresence>
                    {clarificationAnswer.trim() && (
                      <motion.div
                        className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 flex justify-between items-center"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="text-[13px] text-zinc-400">
                          ⌘ + Enter to submit
                        </span>
                        <button
                          onClick={handleSubmitClarification}
                          disabled={isSubmitting}
                          data-test="clarification-submit"
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-6 py-3',
                            'bg-zinc-900 text-[15px] font-medium text-white',
                            'transition-all duration-150',
                            'hover:bg-zinc-800',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                          )}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              Submit
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>

          {/* Elapsed time - subtle metadata */}
          <motion.p
            className="mt-16 text-[13px] tracking-[-0.02em] text-zinc-400 tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            Analysis paused · {formatElapsed(elapsedSeconds)}
          </motion.p>
        </div>
      </motion.div>
    );
  }

  // Determine if we're in the initial review phase (AN0/DD0) or main analysis
  const isInitialReview = isInitialPhase(progress.currentStep);

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
