'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { type ProgressPhase } from '../_lib/types';

interface ProcessingPhaseProps {
  progressPercent: number;
  currentProgressPhase: ProgressPhase;
  elapsedSeconds: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ProcessingPhase({
  progressPercent,
  currentProgressPhase,
  elapsedSeconds,
}: ProcessingPhaseProps) {
  return (
    <motion.div
      key="processing"
      className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-md space-y-8">
        {/* Single animated brand mark */}
        <div className="flex justify-center">
          <motion.div
            className="text-primary"
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

        {/* Current phase - single line, animated */}
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentProgressPhase.id}
              className="text-lg font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {currentProgressPhase.label}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Clean progress bar */}
        <div className="space-y-3">
          <div className="bg-muted h-1 overflow-hidden rounded-full">
            <motion.div
              className="bg-primary h-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
            />
          </div>
          <div className="text-muted-foreground flex justify-between text-sm">
            <span>{formatTime(elapsedSeconds)} elapsed</span>
            <span>~5-10 min</span>
          </div>
        </div>

        {/* Safe to leave - inline, not a card */}
        <motion.p
          className="text-muted-foreground text-center text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Safe to leave — check back anytime.
        </motion.p>
      </div>
    </motion.div>
  );
}
