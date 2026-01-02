'use client';

import { memo } from 'react';

import { ArrowRight } from 'lucide-react';

interface ChatSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

/**
 * Conversation starter buttons for the chat interface.
 * Displays follow-up prompts from the report as clickable suggestions.
 *
 * Styled per Air Company aesthetic:
 * - Near-monochrome palette
 * - Typography-driven hierarchy
 * - Subtle borders and hover states
 */
export const ChatSuggestions = memo(function ChatSuggestions({
  suggestions,
  onSelect,
  disabled,
}: ChatSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <span className="mb-3 block text-[11px] font-semibold tracking-[0.08em] uppercase text-zinc-400">
        Suggested Questions
      </span>
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
            className="group flex w-full items-start gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left transition-all hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex-1 text-[14px] leading-[1.4] tracking-[-0.01em] text-zinc-700 group-hover:text-zinc-900">
              {suggestion}
            </span>
            <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
          </button>
        ))}
      </div>
    </div>
  );
});

export default ChatSuggestions;
