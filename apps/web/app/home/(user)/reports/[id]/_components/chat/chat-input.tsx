'use client';

import type { KeyboardEvent } from 'react';
import { useRef } from 'react';

import { Send, Square } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  isStreaming,
  disabled,
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isStreaming) {
        onSubmit();
      }
    }
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim() && !isStreaming) {
            onSubmit();
          }
        }}
        className="flex gap-2"
      >
        <Textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          className="max-h-[100px] min-h-[44px] flex-1 resize-none rounded-lg border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          style={{ fontSize: '16px' }} // Prevent iOS zoom
          disabled={disabled || isStreaming}
          rows={1}
        />
        {isStreaming ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-[44px] w-[44px] flex-shrink-0 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400"
            onClick={onCancel}
            aria-label="Stop generating"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            className="h-[44px] w-[44px] flex-shrink-0 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 dark:bg-purple-600 dark:hover:bg-purple-700 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500"
            disabled={!value.trim() || disabled}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}
