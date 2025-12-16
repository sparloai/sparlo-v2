'use client';

import { motion } from 'framer-motion';

interface AnalyzingPhaseProps {
  pendingMessage?: string;
}

export function AnalyzingPhase({ pendingMessage }: AnalyzingPhaseProps) {
  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-[#FAFAFA] p-6 dark:bg-neutral-950">
      <motion.div
        className="w-full max-w-md space-y-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated loader */}
        <motion.div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#7C3AED]/10"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [1, 0.8, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              className="text-[#7C3AED]"
            >
              <path
                d="M20 5L35 20L20 35L5 20L20 5Z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </motion.div>
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-[#1A1A1A] dark:text-white">
            Analyzing your challenge
          </h2>
          <p className="text-[#6B6B6B] dark:text-neutral-400">
            Our AI is reviewing your input to understand your needs...
          </p>
        </div>

        {/* Show user's input */}
        {pendingMessage && (
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 text-left dark:border-neutral-800 dark:bg-neutral-900">
            <p className="mb-2 text-sm text-[#8A8A8A]">Your challenge:</p>
            <p className="line-clamp-3 text-sm text-[#4A4A4A] dark:text-neutral-300">
              {pendingMessage}
            </p>
          </div>
        )}

        {/* Phase indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#7C3AED]" />
          <div className="h-2 w-2 rounded-full bg-[#E5E5E5] dark:bg-neutral-700" />
          <div className="h-2 w-2 rounded-full bg-[#E5E5E5] dark:bg-neutral-700" />
        </div>
      </motion.div>
    </div>
  );
}
