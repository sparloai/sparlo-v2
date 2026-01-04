'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  AlertCircle,
  Send,
  ThumbsDown,
  ThumbsUp,
  UserRound,
} from 'lucide-react';

import { Alert, AlertDescription } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { cn } from '@kit/ui/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const TIMEOUT_MS = 30000;

export function HelpChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      // Clear sensitive data
      setMessages([]);
      setInput('');
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      const response = await fetch('/api/help/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        fullResponse += text;

        // Update only the last message content (optimized)
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx]?.role === 'assistant') {
            updated[lastIdx] = { ...updated[lastIdx], content: fullResponse };
          }
          return updated;
        });
      }
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(err.message);
        }
      }

      // Remove empty assistant message on error
      setMessages((prev) => prev.filter((m) => m.content.length > 0));
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages]);

  const handleEscalate = async () => {
    try {
      setIsStreaming(true);

      const response = await fetch('/api/help/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Chat Escalation: Needs human assistance',
          description: messages
            .map((m) => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content}`)
            .join('\n\n'),
          category: 'general',
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

  const handleFeedback = async (
    messageContent: string,
    responseContent: string,
    rating: 'positive' | 'negative',
  ) => {
    try {
      await fetch('/api/help/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageContent,
          responseContent,
          rating,
        }),
      });
    } catch {
      // Silently fail - feedback is not critical
    }
  };

  const canSubmit = !isStreaming && input.trim().length > 0 && !escalated;

  return (
    <div className="flex h-[500px] flex-col rounded-lg border">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-muted-foreground py-8 text-center">
            Ask me anything about Sparlo...
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
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <p className="font-medium text-green-800">
              Your conversation has been sent to our support team.
            </p>
            <p className="mt-1 text-sm text-green-600">
              We&apos;ll respond via email shortly.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Escalate button */}
      {messages.length > 2 && !escalated && (
        <div className="px-4 pb-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleEscalate}
            disabled={isStreaming}
          >
            <UserRound className="mr-2 h-4 w-4" />
            Talk to a human
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={isStreaming || escalated}
            maxLength={2000}
          />
          <Button type="submit" disabled={!canSubmit}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

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

function ChatBubble({
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
    <div className={cn('flex gap-3', !isAssistant && 'flex-row-reverse')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg p-3',
          isAssistant ? 'bg-muted' : 'bg-primary text-primary-foreground',
        )}
      >
        {message.content}
        {isStreaming && (
          <span className="bg-primary ml-1 inline-block h-4 w-2 animate-pulse" />
        )}
      </div>

      {isAssistant &&
        !feedbackGiven &&
        message.content.length > 0 &&
        !isStreaming && (
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleFeedback('positive')}
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleFeedback('negative')}
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
          </div>
        )}
    </div>
  );
}
