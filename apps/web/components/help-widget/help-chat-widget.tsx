'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';

import {
  MessageSquare,
  Minus,
  Send,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

import {
  MARKDOWN_COMPONENTS,
  STRICT_SANITIZE_SCHEMA,
} from '~/lib/shared/markdown-components';

// Debounce interval for streaming updates
const STREAM_DEBOUNCE_MS = 50;
const TIMEOUT_MS = 30000;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface HelpChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

export function HelpChatWidget({
  isOpen,
  onClose,
  onMinimize,
}: HelpChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // P2 Fix: Use ref for messages to avoid callback recreation on every message
  const messagesRef = useRef<ChatMessage[]>([]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // P2 Fix: Sync messagesRef with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null; // P2 Fix: Clear reference for GC
    };
  }, []);

  // P2 Fix: Auto-scroll - use instant during streaming to avoid animation conflicts
  useEffect(() => {
    if (isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    setError(null);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, assistantMessage]);

    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, TIMEOUT_MS);

    try {
      // P2 Fix: Use messagesRef to avoid recreating callback on every message
      const response = await fetch('/api/help/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messagesRef.current.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let fullResponse = '';
      let lastUpdateTime = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        fullResponse += text;

        // Debounced updates
        const now = Date.now();
        if (now - lastUpdateTime >= STREAM_DEBOUNCE_MS) {
          lastUpdateTime = now;
          const contentSnapshot = fullResponse;
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx]?.role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: contentSnapshot,
              };
            }
            return updated;
          });
        }
      }

      // Final update
      const finalContent = fullResponse;
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx]?.role === 'assistant') {
          updated[lastIdx] = { ...updated[lastIdx], content: finalContent };
        }
        return updated;
      });
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(err.message);
        }
      }

      setMessages((prev) => prev.filter((m) => m.content.length > 0));
    } finally {
      setIsStreaming(false);
    }
    // P2 Fix: Removed `messages` from deps since we use messagesRef
  }, [input, isStreaming]);

  const handleEscalate = async () => {
    try {
      setIsStreaming(true);

      // P1 Fix: Use dedicated escalation endpoint with proper chat history
      const response = await fetch('/api/help/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatHistory: messages.slice(-20).map((m) => ({
            role: m.role,
            content: m.content.slice(0, 2000), // Truncate each message
          })),
          reason: 'User requested human support',
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to escalate');
      }

      setEscalated(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  // P2 Fix: Wrap in useCallback to prevent ChatBubble re-renders
  const handleFeedback = useCallback(
    async (
      messageContent: string,
      responseContent: string,
      rating: 'positive' | 'negative',
    ) => {
      try {
        await fetch('/api/help/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageContent, responseContent, rating }),
        });
      } catch {
        // Silently fail
      }
    },
    [],
  );

  const canSubmit = !isStreaming && input.trim().length > 0 && !escalated;

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 bottom-20 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-900 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">Support</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimize}
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
            <p className="text-sm text-zinc-500">
              Hi! How can we help you today?
            </p>
          </div>
        )}
        {messages.map((message, index) => (
          <ChatBubble
            key={message.id}
            message={message}
            previousMessage={index > 0 ? messages[index - 1] : undefined}
            isStreaming={isStreaming && index === messages.length - 1}
            onFeedback={handleFeedback}
          />
        ))}
        {escalated && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
            <p className="text-sm font-medium text-green-800">
              Conversation sent to our team
            </p>
            <p className="mt-1 text-xs text-green-600">
              We&apos;ll respond via email shortly.
            </p>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Escalate button */}
      {messages.length > 2 && !escalated && (
        <div className="border-t border-zinc-100 px-4 py-2">
          <button
            onClick={handleEscalate}
            disabled={isStreaming}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <User className="h-3 w-3" />
            Talk to a human
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-zinc-100 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isStreaming || escalated}
            maxLength={2000}
            className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:outline-none disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!canSubmit}
            size="sm"
            className="bg-zinc-900 px-3 hover:bg-zinc-800"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

// Chat bubble component
interface ChatBubbleProps {
  message: ChatMessage;
  previousMessage?: ChatMessage;
  isStreaming?: boolean;
  onFeedback: (
    messageContent: string,
    responseContent: string,
    rating: 'positive' | 'negative',
  ) => void;
}

const ChatBubble = memo(function ChatBubble({
  message,
  previousMessage,
  isStreaming,
  onFeedback,
}: ChatBubbleProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleFeedback = (rating: 'positive' | 'negative') => {
    if (!previousMessage || previousMessage.role !== 'user') return;
    onFeedback(previousMessage.content, message.content, rating);
    setFeedbackGiven(true);
  };

  return (
    <div className={cn('flex gap-2', !isAssistant && 'flex-row-reverse')}>
      <div
        className={cn(
          'max-w-[85%] rounded-xl px-3 py-2',
          isAssistant ? 'bg-zinc-100' : 'bg-zinc-900 text-white',
        )}
      >
        {isAssistant ? (
          <div className="relative">
            <ReactMarkdown
              rehypePlugins={[[rehypeSanitize, STRICT_SANITIZE_SCHEMA]]}
              components={MARKDOWN_COMPONENTS}
            >
              {message.content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse rounded-full bg-zinc-400" />
            )}
          </div>
        ) : (
          <span className="text-[13px] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </span>
        )}
      </div>

      {isAssistant &&
        !feedbackGiven &&
        message.content.length > 0 &&
        !isStreaming && (
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => handleFeedback('positive')}
              className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleFeedback('negative')}
              className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
          </div>
        )}
    </div>
  );
});
