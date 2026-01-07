'use client';

import type { KeyboardEvent } from 'react';
import { useRef, useState } from 'react';

import { ArrowUp, Square } from 'lucide-react';

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
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isStreaming) {
        onSubmit();
      }
    }
  };

  const canSubmit = value.trim() && !isStreaming && !disabled;

  return (
    <div className="border-t border-zinc-200 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) {
            onSubmit();
          }
        }}
        className="flex items-end gap-2"
      >
        <div
          className={`flex-1 rounded-lg border bg-white transition-colors ${
            isFocused ? 'border-zinc-400' : 'border-zinc-200'
          }`}
        >
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask a question..."
            className="max-h-[120px] min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-[14px] leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400"
            style={{ fontFamily: 'var(--font-heading), system-ui, sans-serif' }}
            disabled={disabled || isStreaming}
            rows={1}
          />
        </div>

        {isStreaming ? (
          <button
            type="button"
            onClick={onCancel}
            className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-zinc-50"
            aria-label="Stop"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
              canSubmit
                ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                : 'bg-zinc-100 text-zinc-300'
            }`}
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </form>
    </div>
  );
}
