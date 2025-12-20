'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import type { Variants } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
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
import { formatElapsed, useElapsedTime } from '../_lib/utils/elapsed-time';
import { ERROR_PATTERNS } from '../_lib/utils/error-constants';

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
    const noClarificationNeeded =
      movedPastAN0 && progress.clarifications?.length === 0;

    // DEBUG: Log redirect decision
    if (movedPastAN0) {
      console.log(
        '[ProcessingScreen] Moved past AN0, checking clarifications:',
        {
          movedPastAN0,
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
    onComplete,
    router,
  ]);

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

  // Handle clarification status - Aura.build inspired design
  if (progress.status === 'clarifying' && pendingClarification) {
    return (
      <motion.div
        className="relative flex min-h-screen flex-col items-center justify-center bg-[--surface-base] px-4 py-12 text-[--text-secondary]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
      >
        {/* Ambient Background Glows - only visible in dark mode */}
        <div className="pointer-events-none absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-900/10 opacity-0 blur-[120px] dark:opacity-50" />
        <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-emerald-900/5 opacity-0 blur-[100px] dark:opacity-50" />

        <div className="relative z-10 w-full max-w-4xl">
          {/* Main Input Card */}
          <div className="group relative rounded-2xl bg-[--surface-overlay] p-[1px] transition-all duration-500 dark:bg-neutral-900/40">
            {/* Glowing border effect */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-black/5 via-black/[0.02] to-transparent opacity-50 transition-opacity duration-500 group-hover:opacity-100 dark:from-white/10 dark:via-white/5" />

            <div className="relative flex flex-col overflow-hidden rounded-2xl bg-[--surface-elevated] shadow-lg dark:shadow-2xl dark:shadow-black/50">
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-[--border-subtle] bg-[--surface-overlay] px-6 py-3 dark:bg-neutral-900/20">
                <div className="flex items-center gap-2 font-mono text-xs tracking-wider text-[--text-muted] uppercase">
                  <MessageSquare className="h-4 w-4 text-[--text-muted]" />
                  <span>quick question</span>
                </div>
              </div>

              {/* Question Display */}
              <div className="border-b border-[--border-subtle] px-6 py-6 md:px-8">
                <motion.p
                  className="text-lg leading-relaxed font-medium text-[--text-primary] md:text-xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                >
                  {pendingClarification.question}
                </motion.p>
                <p className="mt-2 text-sm text-[--text-muted]">
                  Help us understand your challenge better
                </p>
              </div>

              {/* Text Area - Full height */}
              <motion.div
                className="flex min-h-[200px] flex-col p-6 md:p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Textarea
                  value={clarificationAnswer}
                  onChange={(e) => setClarificationAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  data-test="clarification-input"
                  className="min-h-[140px] flex-1 resize-none border-0 bg-transparent text-lg leading-relaxed font-light text-[--text-primary] placeholder-[--text-muted] focus:ring-0 focus:outline-none disabled:opacity-40"
                  style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmitClarification();
                    }
                  }}
                />
              </motion.div>

              {/* Footer / Action Area */}
              <div className="border-t border-[--border-subtle] bg-[--surface-overlay] p-2 dark:bg-neutral-900/30">
                <div className="flex flex-col items-center justify-between gap-4 px-4 py-2 md:flex-row">
                  {/* Skip option */}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setClarificationAnswer('Skip this question');
                      handleSubmitClarification();
                    }}
                    disabled={isSubmitting}
                    className="text-[--text-muted] hover:bg-[--surface-overlay] hover:text-[--text-secondary]"
                  >
                    Skip this question
                  </Button>

                  {/* Primary Action with keyboard shortcut */}
                  <div className="flex items-center gap-3">
                    {/* Keyboard shortcut hint */}
                    <div className="hidden items-center gap-1.5 md:flex">
                      <kbd className="flex h-5 items-center justify-center rounded border border-[--border-default] bg-[--surface-overlay] px-1.5 font-mono text-[10px] text-[--text-muted]">
                        ⌘
                      </kbd>
                      <kbd className="flex h-5 items-center justify-center rounded border border-[--border-default] bg-[--surface-overlay] px-1.5 font-mono text-[10px] text-[--text-muted]">
                        ↵
                      </kbd>
                    </div>
                    <button
                      onClick={handleSubmitClarification}
                      disabled={!clarificationAnswer.trim() || isSubmitting}
                      data-test="clarification-submit"
                      className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg px-6 py-3 transition-all duration-300 md:w-auto ${
                        clarificationAnswer.trim() && !isSubmitting
                          ? 'bg-[--text-primary] text-[--surface-base] shadow-lg hover:opacity-90 dark:bg-white dark:text-black dark:shadow-[0_0_20px_rgba(255,255,255,0.05)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]'
                          : 'cursor-not-allowed bg-[--surface-overlay] text-[--text-muted] dark:bg-neutral-800 dark:text-neutral-500'
                      }`}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span
                        className="text-sm font-semibold tracking-tight"
                        style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                      >
                        {isSubmitting ? 'Sending...' : 'Continue'}
                      </span>
                      {!isSubmitting && (
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Determine if we're in the initial review phase (AN0) or main analysis
  // Handle any AN0 variant (an0, an0-d for discovery, etc.)
  const isInitialReview =
    !progress.currentStep || progress.currentStep.startsWith('an0');

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
            {/* Initial review phase - analyzing for clarification */}
            <div className="relative mx-auto mb-2 h-20 w-20">
              <div className="absolute inset-0 rounded-full border-4 border-[--border-subtle]" />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-t-[--accent] border-r-transparent border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              <Brain className="absolute inset-0 m-auto h-8 w-8 text-[--accent]" />
            </div>
            <p className="text-lg font-medium text-[--text-primary]">
              Analyzing Your Problem
            </p>

            <p className="max-w-sm text-center text-sm text-[--text-muted]">
              We&apos;re reviewing your challenge to see if we need any
              clarification before proceeding with the full analysis.
            </p>

            <div className="mt-2 space-y-1 text-center text-sm text-[--text-muted]">
              <p>This usually takes about a minute.</p>
              <p className="text-xs opacity-70">
                We&apos;ll either ask a clarifying question or start the full
                analysis.
              </p>
            </div>

            {/* Elapsed time */}
            <p className="mt-2 text-sm text-[--text-muted] tabular-nums">
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
