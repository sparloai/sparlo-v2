'use client';

import { type RefObject } from 'react';

import { motion } from 'framer-motion';
import { ArrowRight, Loader2, MessageSquare } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';

interface ClarifyingPhaseProps {
  clarificationQuestion: string;
  clarificationResponse: string;
  setClarificationResponse: (value: string) => void;
  isLoading: boolean;
  clarificationInputRef: RefObject<HTMLTextAreaElement | null>;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSkip: () => void;
}

export function ClarifyingPhase({
  clarificationQuestion,
  clarificationResponse,
  setClarificationResponse,
  isLoading,
  clarificationInputRef,
  onSubmit,
  onKeyDown,
  onSkip,
}: ClarifyingPhaseProps) {
  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-[#FAFAFA] p-6 dark:bg-neutral-950">
      <motion.div
        className="w-full max-w-2xl space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <MessageSquare className="h-6 w-6 text-[#7C3AED]" />
          </motion.div>
          <motion.h1
            className="text-2xl font-semibold tracking-tight text-[#1A1A1A] dark:text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Quick question
          </motion.h1>
          <motion.p
            className="mt-2 text-[#6A6A6A] dark:text-neutral-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Help us understand your challenge better for more accurate results
          </motion.p>
        </div>

        {/* Question from backend */}
        <motion.div
          className="rounded-xl border border-[#E5E5E5] bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="mb-4 font-medium text-[#1A1A1A] dark:text-white">
            {clarificationQuestion}
          </p>
          <form onSubmit={onSubmit}>
            <Textarea
              ref={clarificationInputRef}
              value={clarificationResponse}
              onChange={(e) => setClarificationResponse(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type your answer..."
              className="min-h-[100px] resize-none rounded-lg border-[#E5E5E5] focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 dark:border-neutral-700"
              disabled={isLoading}
            />
            <div className="mt-4 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={onSkip}
                disabled={isLoading}
                className="text-[#6B6B6B] hover:text-[#1A1A1A] dark:text-neutral-400 dark:hover:text-white"
              >
                Skip and proceed
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                type="submit"
                disabled={!clarificationResponse.trim() || isLoading}
                className="bg-[#7C3AED] hover:bg-[#6D28D9]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Answer and continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Skip hint */}
        <p className="text-center text-sm text-[#8A8A8A]">
          You can skip this question if you prefer to proceed with the
          information already provided.
        </p>

        {/* Phase indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#7C3AED]" />
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#7C3AED]" />
          <div className="h-2 w-2 rounded-full bg-[#E5E5E5] dark:bg-neutral-700" />
        </div>
      </motion.div>
    </div>
  );
}
