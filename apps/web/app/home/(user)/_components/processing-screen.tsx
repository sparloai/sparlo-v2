'use client';

import { useCallback, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Loader2, MessageSquare, Send } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { cn } from '@kit/ui/utils';

import { PHASES } from '~/lib/constants/phases';

import { answerClarification } from '../_lib/server/sparlo-reports-server-actions';
import {
  type ClarificationQuestion,
  type ReportProgress,
  calculateOverallProgress,
  getPhaseLabel,
} from '../_lib/use-report-progress';

interface ProcessingScreenProps {
  progress: ReportProgress;
  onComplete?: () => void;
}

// P2: PHASES constant now imported from ~/lib/constants/phases

export function ProcessingScreen({
  progress,
  onComplete,
}: ProcessingScreenProps) {
  const [clarificationAnswer, setClarificationAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const overallProgress = calculateOverallProgress(progress.currentStep);
  const currentPhaseLabel = getPhaseLabel(progress.currentStep);

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

  // Default: Processing status
  return (
    <motion.div
      className="flex min-h-[60vh] flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-md space-y-8">
        {/* Animated brand mark */}
        <div className="flex justify-center">
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
        </div>

        {/* Current phase label */}
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={progress.currentStep}
              className="text-lg font-medium text-[#1A1A1A] dark:text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {currentPhaseLabel}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="space-y-3">
          <div className="h-1 overflow-hidden rounded-full bg-[#E5E5E5] dark:bg-neutral-800">
            <motion.div
              className="h-full bg-[#7C3AED]"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-center text-sm text-[#8A8A8A]">
            {overallProgress}% complete
          </p>
        </div>

        {/* Phase indicators */}
        <div className="space-y-2">
          {PHASES.map((phase, index) => {
            const currentIndex = PHASES.findIndex(
              (p) => p.id === progress.currentStep,
            );
            const isCompleted = index < currentIndex;
            const isCurrent = phase.id === progress.currentStep;

            return (
              <motion.div
                key={phase.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2 transition-colors',
                  isCurrent && 'bg-[#7C3AED]/10',
                  isCompleted && 'opacity-60',
                )}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                    isCompleted && 'bg-[#7C3AED] text-white',
                    isCurrent && 'border-2 border-[#7C3AED] text-[#7C3AED]',
                    !isCompleted &&
                      !isCurrent &&
                      'bg-[#E5E5E5] text-[#8A8A8A] dark:bg-neutral-800',
                  )}
                >
                  {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                </div>
                <div className="flex-1">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent
                        ? 'text-[#7C3AED]'
                        : 'text-[#4A4A4A] dark:text-neutral-300',
                    )}
                  >
                    {phase.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-[#8A8A8A]">
                      {phase.description}
                    </p>
                  )}
                </div>
                {isCurrent && (
                  <Loader2 className="h-4 w-4 animate-spin text-[#7C3AED]" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Safe to leave notice */}
        <motion.p
          className="text-center text-sm text-[#8A8A8A]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Safe to leave — you can check back anytime.
        </motion.p>
      </div>
    </motion.div>
  );
}
