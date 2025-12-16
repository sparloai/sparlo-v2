'use client';

import { type RefObject } from 'react';

import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { cn } from '@kit/ui/utils';

import { analyzeInputQuality } from '../_lib/types';

interface InputPhaseProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function InputPhase({
  input,
  setInput,
  isLoading,
  textareaRef,
  onSubmit,
  onKeyDown,
}: InputPhaseProps) {
  const wordCount = input.trim().split(/\s+/).filter(Boolean).length;
  const inputQuality = analyzeInputQuality(input);

  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-[#FAFAFA] p-6 dark:bg-neutral-950">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header with Sparlo branding */}
        <div className="space-y-4 text-center">
          <motion.div
            className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7C3AED]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              className="text-white"
            >
              <path
                d="M16.2 8C13.1 8 10.8 9.4 10.8 12.2C10.8 14.6 12.4 15.8 15.2 16.6L17.8 17.3C19.6 17.8 20.2 18.4 20.2 19.4C20.2 20.6 19.2 21.4 17.2 21.4C15 21.4 13.6 20.4 13.4 18.6H10C10.2 21.8 12.6 24 17.2 24C20.6 24 23 22.4 23 19.4C23 17 21.4 15.6 18.4 14.8L15.8 14.1C14.2 13.6 13.6 13 13.6 12C13.6 10.8 14.6 10 16.4 10C18.2 10 19.4 10.8 19.6 12.4H23C22.8 9.4 20.4 8 16.2 8Z"
                fill="currentColor"
              />
            </svg>
          </motion.div>
          <motion.h1
            className="text-[32px] font-semibold tracking-tight text-[#1A1A1A] dark:text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Describe your engineering challenge
          </motion.h1>
          <motion.p
            className="text-lg text-[#6B6B6B] dark:text-neutral-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Get AI-powered solution concepts backed by research and patents.
          </motion.p>
        </div>

        {/* Input Form */}
        <motion.form
          onSubmit={onSubmit}
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="What are you trying to solve? Include constraints, goals, and context for better results."
            className="min-h-[180px] resize-none rounded-xl border-[#E5E5E5] bg-white text-base leading-relaxed focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 dark:border-neutral-800 dark:bg-neutral-900"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#8A8A8A] tabular-nums">
                {wordCount} words
              </span>
              {input.trim().length >= 30 && (
                <div className="flex gap-1.5">
                  {[
                    inputQuality.checks.hasChallenge,
                    inputQuality.checks.hasConstraints,
                    inputQuality.checks.hasGoals,
                    inputQuality.checks.hasContext,
                  ].map((check, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 w-1.5 rounded-full transition-colors',
                        check ? 'bg-[#7C3AED]' : 'bg-[#E5E5E5]',
                      )}
                      title={
                        ['Challenge', 'Constraints', 'Goals', 'Context'][i]
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={!input.trim() || isLoading || input.trim().length < 30}
              className="rounded-lg bg-[#7C3AED] px-6 hover:bg-[#6D28D9]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Input quality feedback */}
          {input.trim().length >= 30 && (
            <p className="text-center text-sm text-[#8A8A8A]">
              {inputQuality.quality === 'minimal' &&
                'Add constraints or goals to improve your report'}
              {inputQuality.quality === 'good' &&
                'Good start! More detail will improve results'}
              {inputQuality.quality === 'great' &&
                'Great input! Ready for a detailed report'}
              {inputQuality.quality === 'excellent' &&
                'Excellent! This will generate a comprehensive report'}
            </p>
          )}

          {input.trim().length > 0 && input.trim().length < 30 && (
            <p className="text-center text-sm text-amber-600">
              Please provide more detail (at least 30 characters)
            </p>
          )}

          {/* Time notice */}
          <p className="text-center text-sm text-[#8A8A8A]">
            Analysis takes 5-10 minutes. Safe to leave this page.
          </p>
        </motion.form>
      </div>
    </div>
  );
}
