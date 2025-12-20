'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Download,
  List,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  Share2,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { cn } from '@kit/ui/utils';

import { PROGRESS_PHASES, analyzeInputQuality } from './_lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// SPARLO DESIGN SYSTEM v2: Deep Tech × Consumer Premium
// ═══════════════════════════════════════════════════════════════════════════

type ViabilityLevel = 'GREEN' | 'YELLOW' | 'RED';

function ViabilityBadge({ viability }: { viability: ViabilityLevel }) {
  const styles = {
    GREEN: 'bg-[--status-success-subtle] text-[--status-success]',
    YELLOW: 'bg-[--status-warning-subtle] text-[--status-warning]',
    RED: 'bg-[--status-error-subtle] text-[--status-error]',
  };

  return (
    <span
      className={cn(
        'flex-shrink-0 rounded px-3 py-1.5 text-xs font-semibold tracking-wide uppercase',
        styles[viability],
      )}
    >
      {viability} Light
    </span>
  );
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface ReportData {
  report_markdown: string;
  viability?: string;
  title?: string;
}

type FlowPhase =
  | 'input'
  | 'analyzing'
  | 'clarifying'
  | 'processing'
  | 'complete';

// Helper function to generate consistent section IDs
function generateSectionId(text: string): string {
  return text
    .toLowerCase()
    .replace(/\*\*/g, '')
    .replace(/['']/g, '')
    .replace(/&/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^[\d)]+\s*/, '');
}

const POLLING_INTERVAL = 3000;

export default function BetaPage() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const clarificationInputRef = useRef<HTMLTextAreaElement>(null);

  // Flow state
  const [phase, setPhase] = useState<FlowPhase>('input');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState<string>('');
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [clarificationQuestion, setClarificationQuestion] = useState<
    string | null
  >(null);
  const [clarificationResponse, setClarificationResponse] = useState('');
  const [hasAskedClarification, setHasAskedClarification] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [currentStep, setCurrentStep] = useState('AN0');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Report navigation state
  const [activeSection, setActiveSection] =
    useState<string>('executive-summary');
  const [showToc, setShowToc] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  // Chat drawer state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);

  // Polling ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Generate TOC from report markdown
  const tocItems = useMemo((): TocItem[] => {
    if (!reportData?.report_markdown) return [];

    const headingRegex = /^##\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(reportData.report_markdown)) !== null) {
      const title = match[1]!.replace(/\*\*/g, '').trim();
      const id = generateSectionId(title);
      items.push({ id, title, level: 1 });
    }

    return items;
  }, [reportData?.report_markdown]);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current && phase === 'input') {
      textareaRef.current.focus();
    }
  }, [phase]);

  // Focus clarification input when question appears
  useEffect(() => {
    if (clarificationInputRef.current && clarificationQuestion) {
      clarificationInputRef.current.focus();
    }
  }, [clarificationQuestion]);

  // Scroll chat to bottom only when user sends a message (not during streaming)
  // Uses ref to track if user manually scrolled up
  const scrollChatToBottom = useCallback(() => {
    if (!userScrolledUpRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Handle scroll events to detect if user scrolled up
  const handleChatScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    userScrolledUpRef.current = !isAtBottom;
  }, []);

  // Track active section on scroll
  useEffect(() => {
    if (phase !== 'complete' || !reportData) return;

    const handleScroll = () => {
      const sections = tocItems.map((item) => ({
        id: item.id,
        element: document.getElementById(item.id),
      }));

      const scrollPosition = window.scrollY + 150;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section?.element && section.element.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [phase, reportData, tocItems]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Track elapsed time during processing
  useEffect(() => {
    if (phase !== 'processing') {
      setElapsedSeconds(0);
      return;
    }
    const timeInterval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timeInterval);
  }, [phase]);

  // Poll for status
  const startPolling = useCallback(
    (convId: string) => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

      const poll = async () => {
        try {
          const response = await fetch(`/api/sparlo/status/${convId}`);
          if (!response.ok) throw new Error('Status check failed');

          const status = await response.json();
          setCurrentStep(status.current_step || 'AN0');

          if (status.status === 'complete' && status.report) {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }

            // Fetch full report
            const reportResponse = await fetch(`/api/sparlo/report/${convId}`);
            if (!reportResponse.ok) throw new Error('Failed to fetch report');

            const report = await reportResponse.json();
            setReportData(report);
            setPendingMessage(null);
            setPhase('complete');
          } else if (status.status === 'error') {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setError(status.message || 'An error occurred during processing');
          } else if (status.status === 'clarifying') {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            // Only show ONE clarifying question max
            if (hasAskedClarification) {
              // Already asked one, skip to processing
              const skipResponse = await fetch('/api/sparlo/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message:
                    'Please proceed with the analysis based on the information provided.',
                  conversation_id: convId,
                }),
              });
              if (skipResponse.ok) {
                const skipData = await skipResponse.json();
                if (skipData.status === 'processing') {
                  setCurrentStep(skipData.current_step || 'AN1');
                  setPhase('processing');
                  startPolling(skipData.conversation_id);
                }
              }
            } else {
              setHasAskedClarification(true);
              setClarificationQuestion(status.message || null);
              setPhase('clarifying');
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      };

      poll();
      pollingRef.current = setInterval(poll, POLLING_INTERVAL);
    },
    [hasAskedClarification],
  );

  // Send message to backend
  const sendMessage = useCallback(
    async (message: string) => {
      setIsLoading(true);
      setError(null);
      setPendingMessage(message);
      setPhase('analyzing');

      try {
        const response = await fetch('/api/sparlo/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            conversation_id: conversationId,
          }),
        });

        if (!response.ok) {
          const error = await response
            .json()
            .catch(() => ({ error: 'Request failed' }));
          throw new Error(error.error || error.detail || 'Request failed');
        }

        const data = await response.json();

        if (!conversationId) {
          setConversationId(data.conversation_id);
          setReportTitle(
            message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          );
        }

        if (data.status === 'clarifying') {
          // Only show ONE clarifying question max
          if (hasAskedClarification) {
            // Already asked one, skip to processing
            const skipResponse = await fetch('/api/sparlo/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message:
                  'Please proceed with the analysis based on the information provided.',
                conversation_id: data.conversation_id,
              }),
            });
            if (skipResponse.ok) {
              const skipData = await skipResponse.json();
              if (skipData.status === 'processing') {
                setClarificationQuestion(null);
                setCurrentStep(skipData.current_step || 'AN1');
                setPhase('processing');
                startPolling(skipData.conversation_id);
              } else {
                // Fallback: start polling even if status is unexpected
                setClarificationQuestion(null);
                setCurrentStep(skipData.current_step || 'AN0');
                setPhase('processing');
                startPolling(skipData.conversation_id);
              }
            }
          } else {
            setHasAskedClarification(true);
            setClarificationQuestion(data.message);
            setPhase('clarifying');
          }
        } else if (data.status === 'processing') {
          setClarificationQuestion(null);
          setCurrentStep(data.current_step || 'AN1');
          setPhase('processing');
          startPolling(data.conversation_id);
        } else {
          // Handle other statuses (analyzing, pending, etc.) - start polling
          // The backend may have started processing asynchronously
          setClarificationQuestion(null);
          setCurrentStep(data.current_step || 'AN0');
          setPhase('processing');
          startPolling(data.conversation_id);
        }
      } catch (err) {
        console.error('Send message error:', err);
        setError(err instanceof Error ? err.message : 'Failed to send message');
        setPhase('input');
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, startPolling, hasAskedClarification],
  );

  // Handle initial submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle clarification response
  const handleClarificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationResponse.trim() || isLoading) return;
    const response = clarificationResponse.trim();
    setClarificationResponse('');
    await sendMessage(response);
  };

  const handleClarificationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleClarificationSubmit(e);
    }
  };

  // Reset flow
  const resetFlow = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPhase('input');
    setInput('');
    setConversationId(null);
    setReportTitle('');
    setPendingMessage(null);
    setClarificationQuestion(null);
    setClarificationResponse('');
    setHasAskedClarification(false);
    setReportData(null);
    setCurrentStep('AN0');
    setError(null);
    setChatMessages([]);
    setChatInput('');
  }, []);

  // Skip clarification and proceed directly
  const skipClarification = useCallback(async () => {
    if (!clarificationQuestion || !conversationId) return;

    setIsLoading(true);
    setClarificationQuestion(null);
    setPendingMessage('Proceeding with analysis...');
    setPhase('analyzing');

    try {
      const response = await fetch('/api/sparlo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:
            'Please proceed with the analysis based on the information provided. No additional clarification needed.',
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) throw new Error('Skip failed');

      const data = await response.json();

      if (data.status === 'processing') {
        setCurrentStep(data.current_step || 'AN1');
        setPhase('processing');
        startPolling(data.conversation_id);
      } else if (data.status === 'clarifying') {
        // Backend still wants to clarify, force skip
        setHasAskedClarification(true);
        const skipAgain = await fetch('/api/sparlo/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message:
              'I want to proceed without answering. Please start the analysis now.',
            conversation_id: data.conversation_id,
          }),
        });
        if (skipAgain.ok) {
          const skipData = await skipAgain.json();
          // Always proceed to processing and poll, regardless of status
          setCurrentStep(skipData.current_step || 'AN1');
          setPhase('processing');
          startPolling(skipData.conversation_id);
        } else {
          // If skip request failed, still proceed with polling the original conversation
          setCurrentStep(data.current_step || 'AN0');
          setPhase('processing');
          startPolling(data.conversation_id);
        }
      } else {
        // Handle other statuses - start polling
        setCurrentStep(data.current_step || 'AN0');
        setPhase('processing');
        startPolling(data.conversation_id);
      }
    } catch (err) {
      console.error('Skip clarification error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to skip clarification',
      );
      setPhase('input');
    } finally {
      setIsLoading(false);
    }
  }, [clarificationQuestion, conversationId, startPolling]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Step descriptions (kept for future use - maps step codes to human-readable descriptions)
  const _stepDescriptions: Record<string, string> = {
    AN0: 'Understanding your challenge...',
    AN1: 'Searching knowledge base...',
    'AN1.5': 'Re-ranking results...',
    'AN1.7': 'Augmenting with research...',
    AN2: 'Finding patterns across domains...',
    'AN2-DIRECT': 'Analyzing your challenge...',
    AN3: 'Generating solution concepts...',
    AN4: 'Evaluating and scoring concepts...',
    'AN4.5': 'Grounding with patents...',
    AN5: 'Writing your report...',
  };

  // Word count and input quality
  const wordCount = input.trim().split(/\s+/).filter(Boolean).length;
  const inputQuality = analyzeInputQuality(input);

  // Progress percentage
  const progressPercent = useMemo(() => {
    const stepOrder = [
      'AN0',
      'AN1',
      'AN1.5',
      'AN1.7',
      'AN2',
      'AN2-DIRECT',
      'AN3',
      'AN4',
      'AN4.5',
      'AN5',
    ];
    const idx = stepOrder.indexOf(currentStep);
    if (idx === -1) return 10;
    return Math.min(95, Math.round(((idx + 1) / stepOrder.length) * 100));
  }, [currentStep]);

  // Current progress phase based on percentage
  const currentProgressPhase = useMemo(() => {
    const found = PROGRESS_PHASES.find(
      (p) =>
        progressPercent >= p.duration[0] && progressPercent < p.duration[1],
    );
    return found || PROGRESS_PHASES[PROGRESS_PHASES.length - 1]!;
  }, [progressPercent]);

  // Format elapsed time as M:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Markdown components
  const markdownComponents = {
    h2: ({ children, ...props }: React.HTMLProps<HTMLHeadingElement>) => {
      const text = String(children);
      const id = generateSectionId(text);
      return (
        <h2
          id={id}
          className="mt-12 mb-5 scroll-mt-28 border-b border-[--border-subtle] pb-3 text-[22px] font-semibold tracking-tight text-[--text-primary] first:mt-0 dark:border-neutral-800 dark:text-white"
          {...props}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }: React.HTMLProps<HTMLHeadingElement>) => {
      const text = String(children);
      const id = generateSectionId(text);
      return (
        <h3
          id={id}
          className="mt-8 mb-3 scroll-mt-28 text-lg font-semibold text-[--text-primary] dark:text-white"
          {...props}
        >
          {children}
        </h3>
      );
    },
    h4: ({ children, ...props }: React.HTMLProps<HTMLHeadingElement>) => (
      <h4
        className="mt-6 mb-2 text-base font-semibold text-[--text-primary] dark:text-white"
        {...props}
      >
        {children}
      </h4>
    ),
    p: ({ children, ...props }: React.HTMLProps<HTMLParagraphElement>) => (
      <p
        className="mb-4 leading-[1.7] text-[--text-secondary] dark:text-neutral-300"
        {...props}
      >
        {children}
      </p>
    ),
    ul: ({ children, ...props }: React.HTMLProps<HTMLUListElement>) => (
      <ul className="mb-4 ml-0 list-none space-y-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children }: React.HTMLProps<HTMLOListElement>) => (
      <ol className="mb-4 ml-0 list-none space-y-2">{children}</ol>
    ),
    li: ({ children, ...props }: React.HTMLProps<HTMLLIElement>) => (
      <li
        className="relative pl-5 leading-[1.7] text-[--text-secondary] before:absolute before:top-[0.6em] before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[--accent] dark:text-neutral-300"
        {...props}
      >
        {children}
      </li>
    ),
    strong: ({ children, ...props }: React.HTMLProps<HTMLElement>) => (
      <strong
        className="font-semibold text-[--text-primary] dark:text-white"
        {...props}
      >
        {children}
      </strong>
    ),
    em: ({ children, ...props }: React.HTMLProps<HTMLElement>) => (
      <em
        className="text-[--text-secondary] italic dark:text-neutral-300"
        {...props}
      >
        {children}
      </em>
    ),
    hr: () => (
      <hr className="my-10 border-[--border-subtle] dark:border-neutral-800" />
    ),
    table: ({ children, ...props }: React.HTMLProps<HTMLTableElement>) => (
      <div className="mb-6 overflow-x-auto rounded-lg border border-[--border-subtle] dark:border-neutral-800">
        <table className="min-w-full text-sm" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({
      children,
      ...props
    }: React.HTMLProps<HTMLTableSectionElement>) => (
      <thead className="bg-[--surface-base] dark:bg-neutral-900" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }: React.HTMLProps<HTMLTableCellElement>) => (
      <th
        className="border-b border-[--border-subtle] px-4 py-3 text-left text-xs font-semibold tracking-wider text-[--text-muted] uppercase dark:border-neutral-800 dark:text-neutral-400"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }: React.HTMLProps<HTMLTableCellElement>) => (
      <td
        className="border-b border-[--border-subtle] px-4 py-3 text-[--text-secondary] dark:border-neutral-800 dark:text-neutral-300"
        {...props}
      >
        {children}
      </td>
    ),
    code: ({ children, className, ...props }: React.HTMLProps<HTMLElement>) => {
      const isBlock = className?.includes('language-');
      if (isBlock) {
        return (
          <pre className="mb-4 overflow-x-auto rounded-lg bg-[#1A1A1A] p-4 font-mono text-sm text-neutral-200">
            <code {...props}>{children}</code>
          </pre>
        );
      }
      return (
        <code
          className="rounded bg-[--surface-overlay] px-1.5 py-0.5 font-mono text-sm text-[--accent] dark:bg-neutral-800 dark:text-purple-400"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }: React.HTMLProps<HTMLPreElement>) => (
      <pre
        className="mb-4 overflow-x-auto rounded-lg bg-[#1A1A1A] p-4 font-mono text-sm whitespace-pre text-neutral-200"
        {...props}
      >
        {children}
      </pre>
    ),
    blockquote: ({ children, ...props }: React.HTMLProps<HTMLQuoteElement>) => (
      <blockquote
        className="my-6 border-l-4 border-[#7C3AED] bg-[--surface-base] py-4 pr-4 pl-6 text-[--text-secondary] dark:bg-neutral-900/50 dark:text-neutral-300"
        {...props}
      >
        {children}
      </blockquote>
    ),
  };

  // Chat handler with full report context
  const handleChatSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || isChatLoading) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: chatInput.trim(),
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, userMessage]);
      setChatInput('');
      setIsChatLoading(true);

      // Reset scroll tracking and scroll to bottom when user sends
      userScrolledUpRef.current = false;
      setTimeout(() => scrollChatToBottom(), 50);

      const assistantId = (Date.now() + 1).toString();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setChatMessages((prev) => [...prev, assistantMessage]);

      try {
        const fullContext = `You are an expert assistant helping a user understand and act on a Sparlo technical analysis report.

REPORT TITLE: ${reportTitle || 'Technical Analysis Report'}

FULL REPORT CONTENT:
${reportData?.report_markdown || 'No report content available'}

---

Based on the above report, please answer the following question from the user. Be specific and reference relevant sections of the report when applicable.

USER QUESTION: ${chatInput.trim()}`;

        const response = await fetch('/api/sparlo/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...chatMessages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              { role: 'user', content: fullContext },
            ],
            stream: true,
          }),
        });

        if (!response.ok) throw new Error('Failed to get response');

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullContent += parsed.content;
                    setChatMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantId
                          ? { ...msg, content: fullContent, isStreaming: true }
                          : msg,
                      ),
                    );
                  }
                } catch {
                  // Skip non-JSON lines
                }
              }
            }
          }
        }

        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, isStreaming: false } : msg,
          ),
        );
      } catch {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: 'Sorry, I encountered an error. Please try again.',
                  isStreaming: false,
                }
              : msg,
          ),
        );
      }

      setIsChatLoading(false);
    },
    [chatInput, isChatLoading, chatMessages, reportData, reportTitle, scrollChatToBottom],
  );

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit(e);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: INPUT
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'input') {
    return (
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-[--surface-base] p-6 dark:bg-neutral-950">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="space-y-4 text-center">
            <motion.div
              className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[--accent]"
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
            <motion.div
              className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              Beta Access
            </motion.div>
            <motion.h1
              className="text-[32px] font-semibold tracking-tight text-[--text-primary] dark:text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Describe your engineering challenge
            </motion.h1>
            <motion.p
              className="text-lg text-[--text-muted] dark:text-neutral-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Get AI-powered solution concepts backed by research and patents.
            </motion.p>
          </div>

          {/* Input Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What are you trying to solve? Include constraints, goals, and context for better results."
              className="min-h-[180px] resize-none rounded-xl border-[--border-subtle] bg-[--surface-elevated] text-base leading-relaxed focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 dark:border-neutral-800 dark:bg-neutral-900"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[--text-muted] tabular-nums">
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
                          check ? 'bg-[--accent]' : 'bg-[#E5E5E5]',
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
                disabled={
                  !input.trim() || isLoading || input.trim().length < 30
                }
                className="rounded-lg bg-[--accent] px-6 hover:bg-[--accent-hover]"
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

            {input.trim().length >= 30 && (
              <p className="text-center text-sm text-[--text-muted]">
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

            <p className="text-center text-sm text-[--text-muted]">
              Analysis takes 5-10 minutes. Safe to leave this page.
            </p>
          </motion.form>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: ANALYZING (waiting for AN0 response)
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'analyzing') {
    return (
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-[--surface-base] p-6 dark:bg-neutral-950">
        <motion.div
          className="w-full max-w-md space-y-8 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[--accent]/10"
            animate={{ scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
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
                className="text-[--accent]"
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
            <h2 className="text-2xl font-semibold tracking-tight text-[--text-primary] dark:text-white">
              Analyzing your challenge
            </h2>
            <p className="text-[--text-muted] dark:text-neutral-400">
              Our AI is reviewing your input to understand your needs...
            </p>
          </div>

          {pendingMessage && (
            <div className="rounded-xl border border-[--border-subtle] bg-[--surface-elevated] p-4 text-left dark:border-neutral-800 dark:bg-neutral-900">
              <p className="mb-2 text-sm text-[--text-muted]">
                Your challenge:
              </p>
              <p className="line-clamp-3 text-sm text-[--text-secondary] dark:text-neutral-300">
                {pendingMessage}
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[--accent]" />
            <div className="h-2 w-2 rounded-full bg-[#E5E5E5] dark:bg-neutral-700" />
            <div className="h-2 w-2 rounded-full bg-[#E5E5E5] dark:bg-neutral-700" />
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: CLARIFYING (backend asked a question)
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'clarifying') {
    return (
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-[--surface-base] p-6 dark:bg-neutral-950">
        <motion.div
          className="w-full max-w-2xl space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center">
            <motion.div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[--accent]/10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <MessageSquare className="h-6 w-6 text-[--accent]" />
            </motion.div>
            <motion.h1
              className="text-2xl font-semibold tracking-tight text-[--text-primary] dark:text-white"
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

          <motion.div
            className="rounded-xl border border-[--border-subtle] bg-[--surface-elevated] p-6 dark:border-neutral-800 dark:bg-neutral-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="mb-4 font-medium text-[--text-primary] dark:text-white">
              {clarificationQuestion}
            </p>
            <form onSubmit={handleClarificationSubmit}>
              <Textarea
                ref={clarificationInputRef}
                value={clarificationResponse}
                onChange={(e) => setClarificationResponse(e.target.value)}
                onKeyDown={handleClarificationKeyDown}
                placeholder="Type your answer..."
                className="min-h-[100px] resize-none rounded-lg border-[--border-subtle] focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 dark:border-neutral-700"
                disabled={isLoading}
              />
              <div className="mt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={skipClarification}
                  disabled={isLoading}
                  className="text-[--text-muted] hover:text-[--text-primary] dark:text-neutral-400 dark:hover:text-white"
                >
                  Skip and proceed
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  type="submit"
                  disabled={!clarificationResponse.trim() || isLoading}
                  className="bg-[--accent] hover:bg-[--accent-hover]"
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
          <p className="text-center text-sm text-[--text-muted]">
            You can skip this question if you prefer to proceed with the
            information already provided.
          </p>

          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[--accent]" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-[--accent]" />
            <div className="h-2 w-2 rounded-full bg-[#E5E5E5] dark:bg-neutral-700" />
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: PROCESSING (generating report) - Focused progress UI
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'processing') {
    return (
      <motion.div
        key="processing"
        className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="w-full max-w-md space-y-8">
          {/* Single animated brand mark */}
          <div className="flex justify-center">
            <motion.div
              className="text-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L22 12L12 22L2 12L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <motion.path
                  d="M12 6L18 12L12 18L6 12L12 6Z"
                  fill="currentColor"
                  animate={{ scale: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </svg>
            </motion.div>
          </div>

          {/* Current phase - single line, animated */}
          <div className="text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentProgressPhase.id}
                className="text-lg font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {currentProgressPhase.label}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Clean progress bar */}
          <div className="space-y-3">
            <div className="bg-muted h-1 overflow-hidden rounded-full">
              <motion.div
                className="bg-primary h-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
              />
            </div>
            <div className="text-muted-foreground flex justify-between text-sm">
              <span>{formatTime(elapsedSeconds)} elapsed</span>
              <span>~5-10 min</span>
            </div>
          </div>

          {/* Safe to leave - inline, not a card */}
          <motion.p
            className="text-muted-foreground text-center text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Safe to leave — check back anytime.
          </motion.p>
        </div>
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: COMPLETE (show report)
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'complete' && reportData) {
    return (
      <div className="relative min-h-screen bg-[--surface-base] dark:bg-neutral-950">
        {/* Fixed TOC Sidebar */}
        <AnimatePresence>
          {showToc && tocItems.length > 0 && (
            <motion.aside
              className="fixed top-20 left-0 z-40 hidden h-[calc(100vh-80px)] w-64 overflow-y-auto border-r border-[--border-subtle] bg-[--surface-elevated] p-4 lg:block dark:border-neutral-800 dark:bg-neutral-900"
              initial={{ x: -264 }}
              animate={{ x: 0 }}
              exit={{ x: -264 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-[--text-muted] uppercase">
                  Contents
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowToc(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <nav className="space-y-1">
                {tocItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      'block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      activeSection === item.id
                        ? 'bg-[--accent]/10 font-medium text-[--accent]'
                        : 'text-[--text-muted] hover:bg-[--surface-overlay] hover:text-[--text-primary] dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white',
                    )}
                  >
                    {item.title}
                  </button>
                ))}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        {!showToc && tocItems.length > 0 && (
          <motion.button
            className="fixed top-24 left-4 z-40 hidden rounded-lg border border-[--border-subtle] bg-[--surface-elevated] p-2 shadow-sm lg:block dark:border-neutral-800 dark:bg-neutral-900"
            onClick={() => setShowToc(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.05 }}
          >
            <List className="h-4 w-4" />
          </motion.button>
        )}

        {/* Main Content Area */}
        <div
          ref={reportRef}
          className={cn(
            'mx-auto max-w-4xl p-6 pt-8 transition-all duration-300',
            showToc && tocItems.length > 0 && 'lg:ml-64',
            isChatOpen && 'lg:mr-[400px]',
          )}
        >
          {/* Report Header */}
          <header className="mb-8 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  Beta Report
                </div>
                <h1 className="text-[32px] font-bold tracking-tight text-[--text-primary] dark:text-white">
                  {reportTitle || 'Technical Analysis Report'}
                </h1>
              </div>
              {reportData.viability && (
                <ViabilityBadge
                  viability={reportData.viability as ViabilityLevel}
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-[--border-subtle] dark:border-neutral-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-[--border-subtle] dark:border-neutral-700"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFlow}
                className="rounded-lg border-[--border-subtle] dark:border-neutral-700"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            </div>
          </header>

          {/* Full Report Markdown */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown
              components={markdownComponents}
              rehypePlugins={[rehypeSanitize]}
            >
              {reportData.report_markdown}
            </ReactMarkdown>
          </div>

          <div className="h-24" />
        </div>

        {/* Chat Toggle Button */}
        {!isChatOpen && (
          <motion.button
            className="fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-full bg-[--accent] px-4 py-3 text-white shadow-lg"
            onClick={() => setIsChatOpen(true)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium">Ask about this report</span>
          </motion.button>
        )}

        {/* Chat Drawer */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              className="fixed top-16 right-0 z-50 flex h-[calc(100%-4rem)] w-[400px] flex-col border-l border-gray-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[--accent]" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Chat with Report
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div
                ref={chatContainerRef}
                onScroll={handleChatScroll}
                className="flex-1 space-y-4 overflow-y-auto p-4"
              >
                {chatMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-gray-500 dark:text-neutral-400">
                    <MessageSquare className="mb-4 h-12 w-12 opacity-20" />
                    <p className="font-medium text-gray-700 dark:text-neutral-300">
                      Ask anything about this report
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
                      Get clarification, explore alternatives, or dive deeper
                      into specific concepts.
                    </p>
                    <div className="mt-6 w-full space-y-2">
                      {[
                        'What are the main risks?',
                        'Summarize the key recommendations',
                        'What should I do first?',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white"
                          onClick={() => setChatInput(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex',
                        msg.role === 'user' ? 'justify-end' : 'justify-start',
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-4 py-2',
                          msg.role === 'user'
                            ? 'rounded-tr-sm bg-[--accent] text-white'
                            : 'rounded-tl-sm bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-neutral-100',
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm prose-gray max-w-none dark:prose-invert">
                            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                              {msg.content}
                            </ReactMarkdown>
                            {msg.isStreaming && (
                              <span className="inline-block animate-pulse">
                                ▋
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <form
                onSubmit={handleChatSubmit}
                className="border-t border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50"
              >
                <div className="flex gap-2">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Ask a question about the report..."
                    className="max-h-[100px] min-h-[44px] resize-none rounded-lg border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                    disabled={isChatLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-[44px] w-[44px] flex-shrink-0 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 dark:bg-purple-600 dark:hover:bg-purple-700 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500"
                    disabled={!chatInput.trim() || isChatLoading}
                  >
                    {isChatLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-3 text-center text-[10px] text-gray-400 dark:text-neutral-500">
                  Powered by Claude Opus 4.5
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ERROR STATE
  // ═══════════════════════════════════════════════════════════════════════════
  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-[--surface-base] p-6 dark:bg-neutral-950">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/20">
            <X className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-[--text-primary] dark:text-white">
              Something went wrong
            </h2>
            <p className="text-[--text-muted] dark:text-neutral-400">{error}</p>
          </div>
          <Button
            onClick={resetFlow}
            className="bg-[--accent] hover:bg-[--accent-hover]"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-[--surface-base] p-6 dark:bg-neutral-950">
      <Loader2 className="h-8 w-8 animate-spin text-[--accent]" />
    </div>
  );
}
