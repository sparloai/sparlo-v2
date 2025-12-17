'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  Lightbulb,
  List,
  Loader2,
  MessageSquare,
  Send,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { cn } from '@kit/ui/utils';

import { ProcessingScreen } from '../../../_components/processing-screen';
import { useReportProgress } from '../../../_lib/use-report-progress';

interface ReportData {
  markdown?: string;
  chainState?: Record<string, unknown>;
  concepts?: Array<{
    id: string;
    name: string;
    track: string;
    description: string;
    confidence: string;
  }>;
  evaluations?: Array<{
    conceptId: string;
    overallScore: number;
    ranking: number;
  }>;
  recommendedConcept?: string;
}

interface Report {
  id: string;
  title: string;
  status: string;
  current_step: string | null;
  phase_progress: number | null;
  report_data: ReportData | null;
  clarifications: Array<{
    question: string;
    answer?: string;
    askedAt: string;
  }> | null;
  last_message: string | null;
  created_at: string;
}

interface ReportDisplayProps {
  report: Report;
  isProcessing?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

// Table of contents item
interface TocItem {
  id: string;
  title: string;
  level: number;
}

export function ReportDisplay({ report, isProcessing }: ReportDisplayProps) {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [activeSection, setActiveSection] = useState('executive-summary');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Track progress for processing reports
  const { progress } = useReportProgress(isProcessing ? report.id : null);

  // Handle completion - refresh to get updated server data
  const handleComplete = useCallback(() => {
    router.refresh();
  }, [router]);

  // Extract markdown from report data
  const reportMarkdown = report.report_data?.markdown ?? '';

  // P1 Performance: Memoize TOC generation to prevent recalculation on every render
  const tocItems = useMemo(() => {
    const items: TocItem[] = [];
    const headerRegex = /^(#{2,3})\s+(.+)$/gm;
    let match;
    while ((match = headerRegex.exec(reportMarkdown)) !== null) {
      const level = match[1]?.length ?? 2;
      const title = match[2]?.replace(/\*\*/g, '') ?? '';
      const id = generateSectionId(title);
      items.push({ id, title, level });
    }
    return items;
  }, [reportMarkdown]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;
      for (let i = tocItems.length - 1; i >= 0; i--) {
        const item = tocItems[i];
        if (!item) continue;
        const element = document.getElementById(item.id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(item.id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tocItems]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsChatOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isChatOpen) {
        e.preventDefault();
        setIsChatOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen]);

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  }, []);

  const handleChatSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || isChatLoading) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: chatInput.trim(),
      };

      setChatMessages((prev) => [...prev, userMessage]);
      setChatInput('');
      setIsChatLoading(true);

      const assistantId = (Date.now() + 1).toString();
      setChatMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', isStreaming: true },
      ]);

      try {
        const response = await fetch('/api/sparlo/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId: report.id,
            message: chatInput.trim(),
            reportContext: reportMarkdown,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const data = await response.json();
        const content = data.response ?? 'I could not generate a response.';

        // P1 Fix: Display content immediately instead of fake streaming
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content, isStreaming: false }
              : msg,
          ),
        );
      } catch (error) {
        console.error('Chat error:', error);
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
      } finally {
        setIsChatLoading(false);
      }
    },
    [chatInput, isChatLoading, report.id, reportMarkdown],
  );

  // Show processing screen if still in progress
  if (isProcessing && progress) {
    return <ProcessingScreen progress={progress} onComplete={handleComplete} />;
  }

  // No report content yet
  if (!reportMarkdown) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#7C3AED]" />
          <p className="mt-4 text-[#6A6A6A]">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Two-column layout */}
      <div className="flex">
        {/* Sticky TOC Sidebar */}
        <AnimatePresence>
          {showToc && (
            <motion.aside
              className="hidden w-64 flex-shrink-0 lg:block"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 256 }}
              exit={{ opacity: 0, width: 0 }}
            >
              <div className="sticky top-20 h-[calc(100vh-80px)] overflow-y-auto border-r border-[#E5E5E5] bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-[0.1em] text-[#8A8A8A] uppercase">
                      Contents
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-[#8A8A8A] hover:text-[#1A1A1A]"
                      onClick={() => setShowToc(false)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <nav className="space-y-0.5">
                    {tocItems.map((item, index) => (
                      <button
                        key={`${item.id}-${index}`}
                        onClick={() => scrollToSection(item.id)}
                        className={cn(
                          'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-all',
                          item.level === 3 && 'pl-6',
                          activeSection === item.id
                            ? 'bg-[#7C3AED]/10 font-medium text-[#7C3AED]'
                            : 'text-[#6A6A6A] hover:bg-[#F5F5F5] hover:text-[#1A1A1A]',
                        )}
                      >
                        <span className="truncate">{item.title}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* TOC Toggle */}
        {!showToc && (
          <motion.button
            className="fixed top-24 left-4 z-40 hidden items-center gap-2 rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 shadow-md lg:flex"
            onClick={() => setShowToc(true)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <List className="h-4 w-4 text-[#6A6A6A]" />
            <span className="text-xs text-[#6A6A6A]">Contents</span>
          </motion.button>
        )}

        {/* Main Content */}
        <div
          className={cn(
            'min-w-0 flex-1 px-6 py-10 transition-all',
            isChatOpen && 'lg:mr-[420px]',
          )}
        >
          <div className="mx-auto max-w-3xl">
            {/* Back link */}
            <Link
              href="/home"
              className="mb-6 inline-flex items-center gap-2 text-sm text-[#6A6A6A] hover:text-[#1A1A1A]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            {/* Report Header */}
            <header className="mb-10">
              <div className="mb-6 flex items-start justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-[#8A8A8A] uppercase">
                    <Sparkles className="h-3.5 w-3.5" />
                    Sparlo Analysis Report
                  </div>
                  <h1 className="text-[32px] leading-tight font-semibold tracking-tight text-[#1A1A1A] dark:text-white">
                    {report.title}
                  </h1>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 uppercase">
                  <Check className="h-3 w-3" />
                  Complete
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-[#8A8A8A]">
                  Generated {new Date(report.created_at).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-[#E5E5E5]"
                  >
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-[#E5E5E5]"
                  >
                    <Share2 className="mr-2 h-3.5 w-3.5" />
                    Share
                  </Button>
                </div>
              </div>
            </header>

            {/* Core Insight Card */}
            {report.report_data?.recommendedConcept && (
              <motion.section
                className="relative mb-12 overflow-hidden rounded-xl border-l-[3px] border-[#7C3AED] bg-white shadow-sm dark:bg-neutral-900"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#7C3AED]/10">
                      <Lightbulb className="h-5 w-5 text-[#7C3AED]" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-[#1A1A1A] dark:text-white">
                          Lead Recommendation
                        </h2>
                        <span className="rounded bg-[#7C3AED]/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#7C3AED] uppercase">
                          Key Finding
                        </span>
                      </div>
                      <div className="border-t border-[#E5E5E5] pt-3 dark:border-neutral-800">
                        <div className="flex items-start gap-2">
                          <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7C3AED]" />
                          <p className="text-sm font-medium text-[#1A1A1A] dark:text-white">
                            {report.report_data.recommendedConcept}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Full Report Markdown */}
            <motion.div
              className="rounded-xl bg-white p-8 shadow-sm lg:p-10 dark:bg-neutral-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ReactMarkdown components={markdownComponents}>
                {reportMarkdown}
              </ReactMarkdown>
            </motion.div>

            <div className="h-32" />
          </div>
        </div>
      </div>

      {/* Chat Toggle Button */}
      {!isChatOpen && (
        <motion.button
          className="fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-full bg-[#7C3AED] px-5 py-3.5 text-white shadow-lg hover:shadow-xl"
          style={{ boxShadow: '0 4px 14px -2px rgba(124, 58, 237, 0.4)' }}
          onClick={() => setIsChatOpen(true)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-sm font-medium">Ask about this report</span>
          <span className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium">
            ^/
          </span>
        </motion.button>
      )}

      {/* Chat Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-50 flex h-full w-[420px] flex-col border-l border-[#E5E5E5] bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-[#E5E5E5] px-5 py-4 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]/10">
                  <MessageSquare className="h-4 w-4 text-[#7C3AED]" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-[#1A1A1A] dark:text-white">
                    Chat with Report
                  </span>
                  <p className="text-[10px] text-[#8A8A8A]">
                    Ask follow-up questions
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#8A8A8A]"
                onClick={() => setIsChatOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {chatMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F5F5] dark:bg-neutral-800">
                    <MessageSquare className="h-7 w-7 text-[#8A8A8A]" />
                  </div>
                  <p className="text-base font-semibold text-[#1A1A1A] dark:text-white">
                    Ask anything about this report
                  </p>
                  <p className="mt-2 max-w-[280px] text-sm text-[#8A8A8A]">
                    Get clarification, explore alternatives, or dive deeper into
                    specific concepts.
                  </p>
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
                        'max-w-[85%] rounded-2xl px-4 py-3',
                        msg.role === 'user'
                          ? 'rounded-br-md bg-[#7C3AED] text-white'
                          : 'rounded-bl-md bg-[#F5F5F5] text-[#1A1A1A] dark:bg-neutral-800 dark:text-white',
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      {msg.isStreaming && (
                        <span className="inline-block animate-pulse text-[#7C3AED]">
                          @
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleChatSubmit}
              className="border-t border-[#E5E5E5] bg-[#FAFAFA] p-4 dark:border-neutral-800 dark:bg-neutral-900/50"
            >
              <div className="flex gap-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="max-h-[100px] min-h-[44px] resize-none text-sm"
                  disabled={isChatLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSubmit(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-[44px] w-[44px] flex-shrink-0 bg-[#7C3AED] hover:bg-[#6D28D9]"
                  disabled={!chatInput.trim() || isChatLoading}
                >
                  {isChatLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to generate section IDs
function generateSectionId(text: string): string {
  return text
    .toLowerCase()
    .replace(/\*\*/g, '')
    .replace(/['']/g, '')
    .replace(/&/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

// Markdown components for styling
const markdownComponents = {
  h2: ({ children, ...props }: React.HTMLProps<HTMLHeadingElement>) => {
    const text = String(children);
    const id = generateSectionId(text);
    return (
      <h2
        id={id}
        className="mt-12 mb-5 scroll-mt-28 border-b border-[#E5E5E5] pb-3 text-[22px] font-semibold tracking-tight text-[#1A1A1A] first:mt-0 dark:border-neutral-800 dark:text-white"
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
        className="mt-8 mb-3 scroll-mt-28 text-lg font-semibold text-[#1A1A1A] dark:text-white"
        {...props}
      >
        {children}
      </h3>
    );
  },
  p: ({ children, ...props }: React.HTMLProps<HTMLParagraphElement>) => (
    <p
      className="mb-4 text-base leading-[1.7] text-[#4A4A4A] dark:text-neutral-300"
      {...props}
    >
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.HTMLProps<HTMLUListElement>) => (
    <ul className="mb-5 ml-1 space-y-2.5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children }: React.HTMLProps<HTMLOListElement>) => (
    <ol className="mb-5 ml-1 list-inside list-decimal space-y-2.5">
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.HTMLProps<HTMLLIElement>) => (
    <li
      className="relative pl-2 leading-[1.7] text-[#4A4A4A] before:absolute before:left-[-12px] before:font-bold before:text-[#7C3AED] before:content-['•'] dark:text-neutral-300"
      {...props}
    >
      {children}
    </li>
  ),
  strong: ({ children, ...props }: React.HTMLProps<HTMLElement>) => (
    <strong className="font-semibold text-[#1A1A1A] dark:text-white" {...props}>
      {children}
    </strong>
  ),
  table: ({ children, ...props }: React.HTMLProps<HTMLTableElement>) => (
    <div className="mb-6 overflow-x-auto rounded-lg border border-[#E5E5E5] dark:border-neutral-800">
      <table className="min-w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: React.HTMLProps<HTMLTableSectionElement>) => (
    <thead className="bg-[#F5F5F5] dark:bg-neutral-900" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: React.HTMLProps<HTMLTableCellElement>) => (
    <th
      className="border-b border-[#E5E5E5] px-4 py-3 text-left text-xs font-semibold tracking-wider text-[#1A1A1A] uppercase dark:border-neutral-800 dark:text-white"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.HTMLProps<HTMLTableCellElement>) => (
    <td
      className="border-b border-[#E5E5E5] px-4 py-3 text-[#4A4A4A] last:border-b-0 dark:border-neutral-800 dark:text-neutral-300"
      {...props}
    >
      {children}
    </td>
  ),
  code: ({ children, className, ...props }: React.HTMLProps<HTMLElement>) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <pre className="mb-5 overflow-x-auto rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] p-4 font-mono text-sm dark:border-neutral-800 dark:bg-neutral-900">
          <code {...props}>{children}</code>
        </pre>
      );
    }
    return (
      <code
        className="rounded bg-[#F5F5F5] px-1.5 py-0.5 font-mono text-[13px] text-[#7C3AED] dark:bg-neutral-900"
        {...props}
      >
        {children}
      </code>
    );
  },
  blockquote: ({ children, ...props }: React.HTMLProps<HTMLQuoteElement>) => (
    <blockquote
      className="my-5 rounded-r-lg border-l-[3px] border-[#7C3AED] bg-[#FAFAFA] py-4 pr-4 pl-5 dark:bg-neutral-900/50"
      {...props}
    >
      <div className="leading-[1.7] text-[#4A4A4A] italic dark:text-neutral-300">
        {children}
      </div>
    </blockquote>
  ),
};
