# feat: Premium Post-Report Chat Experience (MVP)

## Overview

Make the post-report chat sidebar feel premium and function well for deeper report exploration. Focus on **smooth markdown rendering**, **copy buttons on code blocks**, **proper mobile support**, and **clean component architecture**.

## Problem Statement

1. **God component**: `report-display.tsx` is 1,525 lines with chat embedded (lines 92-1328)
2. **No code copy button**: Users can't easily copy code snippets
3. **Mobile broken**: Fixed 420px width unusable on small screens
4. **Basic markdown**: Layout shifts during streaming, no streaming optimization

## Solution: Focused MVP

### Phase 1: Component Extraction

Extract chat from the God component into focused, testable pieces:

```
apps/web/app/home/(user)/reports/[id]/_components/
├── report-display.tsx          # Orchestrator only (~300 lines)
└── chat/
    ├── index.ts                # Barrel export
    ├── chat-drawer.tsx         # Sidebar container + mobile
    ├── chat-header.tsx         # Title + close button
    ├── chat-messages.tsx       # Message list with auto-scroll
    ├── chat-message.tsx        # Single message (user/assistant)
    ├── chat-input.tsx          # Textarea + send button
    ├── chat-error.tsx          # Generic error with retry
    └── code-block.tsx          # Code with copy button
```

#### chat-drawer.tsx

```tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function ChatDrawer({ isOpen, onClose, children }: ChatDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - click to close on mobile */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <motion.aside
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col bg-white dark:bg-gray-900 md:w-[420px]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2 }}
            role="complementary"
            aria-label="Chat with report"
          >
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
```

#### chat-message.tsx

```tsx
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './code-block';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  isStreaming?: boolean;
}

export function ChatMessage({ content, role, isStreaming }: ChatMessageProps) {
  if (role === 'user') {
    return (
      <div className="ml-auto max-w-[85%]">
        <div className="rounded-2xl rounded-tr-sm bg-purple-600 px-4 py-3 text-white">
          <p className="whitespace-pre-wrap text-sm">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[95%]">
      <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 dark:bg-gray-800">
        <div className="prose prose-sm prose-gray max-w-none dark:prose-invert">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: CodeBlock,
              // Tighter spacing for chat
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 ml-4 list-disc last:mb-0">{children}</ul>,
              ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal last:mb-0">{children}</ol>,
            }}
          >
            {content}
          </Markdown>
          {isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-purple-500" />
          )}
        </div>
      </div>
    </div>
  );
}
```

#### code-block.tsx

```tsx
'use client';

import { useState, useCallback, ComponentPropsWithoutRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';

type CodeBlockProps = ComponentPropsWithoutRef<'code'>;

export function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const match = /language-(\w+)/.exec(className || '');
  const language = match?.[1] || 'text';
  const codeString = String(children).replace(/\n$/, '');
  const isInline = !match && !codeString.includes('\n');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = codeString;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [codeString]);

  if (isInline) {
    return (
      <code
        className="rounded bg-gray-200 px-1.5 py-0.5 text-sm text-purple-600 dark:bg-gray-700 dark:text-purple-400"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="group relative my-3">
      {/* Language badge */}
      <div className="absolute left-3 top-2 text-xs text-gray-400">
        {language}
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md bg-gray-700 p-1.5 opacity-0 transition-opacity hover:bg-gray-600 focus:opacity-100 group-hover:opacity-100"
        aria-label={copied ? 'Copied!' : 'Copy code'}
        type="button"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4 text-gray-300" />
        )}
      </button>

      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          padding: '2rem 1rem 1rem',
          fontSize: '0.8125rem',
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}
```

#### chat-error.tsx

```tsx
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@kit/ui/button';

interface ChatErrorProps {
  message: string;
  onRetry?: () => void;
}

export function ChatError({ message, onRetry }: ChatErrorProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
        <p className="flex-1 text-sm text-red-600 dark:text-red-300">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} type="button">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
```

#### chat-messages.tsx

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from './chat-message';
import { ChatError } from './chat-error';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

interface ChatMessagesProps {
  messages: Message[];
  isStreaming: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function ChatMessages({ messages, isStreaming, error, onRetry }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  // Track if user has scrolled up
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      userScrolledRef.current = scrollHeight - scrollTop - clientHeight > 100;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll on new messages (unless user scrolled up)
  useEffect(() => {
    if (!userScrolledRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isStreaming]);

  return (
    <div
      ref={containerRef}
      className="flex-1 space-y-4 overflow-y-auto p-5"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <p className="text-sm text-gray-500">
            Ask questions about this report to get deeper insights.
          </p>
        </div>
      ) : (
        messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            content={message.content}
            role={message.role}
            isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
          />
        ))
      )}

      {error && <ChatError message={error} onRetry={onRetry} />}

      <div ref={bottomRef} />
    </div>
  );
}
```

#### chat-input.tsx

```tsx
'use client';

import { useRef, KeyboardEvent } from 'react';
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
    <div className="border-t bg-gray-50 p-4 dark:bg-gray-800">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim() && !isStreaming) {
            onSubmit();
          }
        }}
        className="flex gap-3"
      >
        <Textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this report..."
          className="min-h-[44px] max-h-[120px] flex-1 resize-none"
          style={{ fontSize: '16px' }} // Prevent iOS zoom
          disabled={disabled}
          rows={1}
        />
        {isStreaming ? (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="h-11 w-11 shrink-0"
            aria-label="Stop generating"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!value.trim() || disabled}
            className="h-11 w-11 shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}
```

#### chat-header.tsx

```tsx
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@kit/ui/button';

interface ChatHeaderProps {
  onClose: () => void;
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-5 py-4">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-5 w-5 text-purple-500" />
        <h2 className="font-semibold">Chat with Report</h2>
      </div>
      <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close chat">
        <X className="h-5 w-5" />
      </Button>
    </header>
  );
}
```

### Phase 2: Integration

Wire up the extracted components in `report-display.tsx`:

```tsx
// In report-display.tsx - replace inline chat code with:
import {
  ChatDrawer,
  ChatHeader,
  ChatMessages,
  ChatInput,
} from './chat';

// ... in component
<ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)}>
  <ChatHeader onClose={() => setIsChatOpen(false)} />
  <ChatMessages
    messages={messages}
    isStreaming={isStreaming}
    error={chatError}
    onRetry={handleRetry}
  />
  <ChatInput
    value={input}
    onChange={setInput}
    onSubmit={handleSendMessage}
    onCancel={handleCancelStream}
    isStreaming={isStreaming}
  />
</ChatDrawer>
```

## Technical Considerations

### Bundle Size Impact

| Package | Size (gzipped) | Already Installed |
|---------|---------------|-------------------|
| react-markdown | ~5kb | Yes |
| remark-gfm | ~2kb | Yes |
| react-syntax-highlighter | ~15kb | Yes |
| framer-motion | ~20kb | Yes |
| **Net new** | **0kb** | - |

No new dependencies required.

### Mobile Behavior

- **< 768px**: Full-screen overlay with backdrop tap to close
- **≥ 768px**: 420px sidebar, no backdrop
- Input uses `font-size: 16px` to prevent iOS zoom

## Acceptance Criteria

### Functional

- [ ] Chat extracted into focused components (<150 lines each)
- [ ] Code blocks have copy button with success feedback
- [ ] Chat works full-screen on mobile with backdrop dismiss
- [ ] Errors show retry button
- [ ] Auto-scroll respects user scroll position

### Quality

- [ ] Each component is independently testable
- [ ] No TypeScript errors or implicit any
- [ ] Proper ARIA labels for accessibility
- [ ] Works on iOS Safari, Android Chrome, Desktop browsers

## Files to Modify

1. **Create**: `apps/web/app/home/(user)/reports/[id]/_components/chat/` (all 8 files)
2. **Modify**: `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx` (extract ~1000 lines)

## What's NOT in Scope

- Spring physics animations (use CSS transitions)
- Swipe-to-close gestures (backdrop tap is sufficient)
- Keyboard shortcuts beyond Escape to close
- Rate limit indicators (show error when hit)
- "New message" floating pill (simple auto-scroll works)
- Streamdown migration (react-markdown works fine)

---

*Revised plan based on reviewer feedback - 2025-12-29*
