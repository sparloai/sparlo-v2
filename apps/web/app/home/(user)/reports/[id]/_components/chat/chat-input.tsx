'use client';

import type { KeyboardEvent } from 'react';
import { useRef, useState } from 'react';

import { motion } from 'framer-motion';
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
    <div
      className="relative p-4"
      style={{
        background:
          'linear-gradient(180deg, rgba(13, 17, 23, 0.6) 0%, rgba(13, 17, 23, 0.95) 100%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* Top gradient accent */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 10%, rgba(100, 181, 246, 0.1) 50%, transparent 90%)',
        }}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) {
            onSubmit();
          }
        }}
        className="relative flex items-end gap-3"
      >
        {/* Input container */}
        <div
          className="relative flex-1 rounded-xl transition-all duration-200"
          style={{
            background: 'rgba(21, 27, 38, 0.8)',
            border: isFocused
              ? '1px solid rgba(100, 181, 246, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: isFocused
              ? '0 0 0 3px rgba(100, 181, 246, 0.08), 0 4px 12px -4px rgba(0, 0, 0, 0.3)'
              : '0 2px 8px -2px rgba(0, 0, 0, 0.2)',
          }}
        >
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask a question..."
            className="max-h-[120px] min-h-[48px] w-full resize-none bg-transparent px-4 py-3 text-[14px] leading-relaxed outline-none placeholder:text-[#5a6b8c]"
            style={{
              color: '#e8f0f8',
              caretColor: '#64b5f6',
              fontFamily: 'var(--font-heading), system-ui, sans-serif',
            }}
            disabled={disabled || isStreaming}
            rows={1}
          />
        </div>

        {/* Action button */}
        {isStreaming ? (
          <motion.button
            type="button"
            onClick={onCancel}
            className="flex h-[48px] w-[48px] flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200"
            style={{
              background:
                'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Stop generating"
          >
            <Square
              className="h-4 w-4"
              style={{ color: '#ef4444', fill: '#ef4444' }}
            />
          </motion.button>
        ) : (
          <motion.button
            type="submit"
            disabled={!canSubmit}
            className="flex h-[48px] w-[48px] flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200"
            style={{
              background: canSubmit
                ? 'linear-gradient(135deg, rgba(100, 181, 246, 0.2) 0%, rgba(100, 181, 246, 0.1) 100%)'
                : 'rgba(21, 27, 38, 0.5)',
              border: canSubmit
                ? '1px solid rgba(100, 181, 246, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.04)',
              boxShadow: canSubmit
                ? '0 0 20px -5px rgba(100, 181, 246, 0.2)'
                : 'none',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
            whileHover={canSubmit ? { scale: 1.02 } : {}}
            whileTap={canSubmit ? { scale: 0.98 } : {}}
            aria-label="Send message"
          >
            <ArrowUp
              className="h-5 w-5"
              style={{
                color: canSubmit ? '#64b5f6' : '#3d4a63',
              }}
            />
          </motion.button>
        )}
      </form>

      {/* Keyboard hint */}
      <div
        className="mt-2 flex items-center justify-center gap-1.5 text-[10px]"
        style={{
          color: '#3d4a63',
          fontFamily: 'var(--font-heading), system-ui, sans-serif',
        }}
      >
        <kbd
          className="rounded px-1.5 py-0.5"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          Enter
        </kbd>
        <span>to send</span>
        <span className="mx-1">·</span>
        <kbd
          className="rounded px-1.5 py-0.5"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          Shift + Enter
        </kbd>
        <span>for new line</span>
      </div>
    </div>
  );
}
