'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronRight,
  Download,
  Lightbulb,
  List,
  Loader2,
  MessageSquare,
  Send,
  Share2,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { Button } from '@kit/ui/button';
import { toast } from '@kit/ui/sonner';
import { Textarea } from '@kit/ui/textarea';
import { cn } from '@kit/ui/utils';

import { ProcessingScreen } from '../../../_components/processing-screen';
import { useReportProgress } from '../../../_lib/use-report-progress';
import {
  extractStructuredReport,
  extractUserInput,
} from '../_lib/extract-report';
import type { ChatMessage } from '../_lib/schemas/chat.schema';
import { DiscoveryReportDisplay } from './discovery-report-display';
import { HybridReportDisplay } from './hybrid-report-display';
import { ReportRenderer } from './report/report-renderer';

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
  initialChatHistory?: ChatMessage[];
  isDiscovery?: boolean;
  isHybrid?: boolean;
}

// Table of contents item
interface TocItem {
  id: string;
  title: string;
  level: number;
}

export function ReportDisplay({
  report,
  isProcessing,
  initialChatHistory = [],
  isDiscovery = false,
  isHybrid = false,
}: ReportDisplayProps) {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [activeSection, setActiveSection] = useState('executive-summary');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>(initialChatHistory);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isUserScrolledUpRef = useRef(false);

  // Cancel the current streaming response
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Mark the current streaming message as cancelled
    setChatMessages((prev) =>
      prev.map((msg) =>
        msg.isStreaming ? { ...msg, isStreaming: false, cancelled: true } : msg,
      ),
    );
    setIsChatLoading(false);
  }, []);

  // Track progress for processing reports
  const { progress } = useReportProgress(isProcessing ? report.id : null);

  // Handle completion - refresh to get updated server data
  const handleComplete = useCallback(() => {
    router.refresh();
  }, [router]);

  // Extract markdown from report data
  const reportMarkdown = report.report_data?.markdown ?? '';

  // Extract structured report data for premium rendering
  // Functions accept unknown type and handle validation internally
  const structuredReport = useMemo(() => {
    return extractStructuredReport(report.report_data);
  }, [report.report_data]);

  const _userInput = useMemo(() => {
    return extractUserInput(report.report_data, report.title);
  }, [report.report_data, report.title]);

  // P1 Performance: Memoize TOC generation to prevent recalculation on every render
  const tocItems = useMemo(() => {
    const items: TocItem[] = [];

    // For discovery reports, generate TOC from known sections
    if (isDiscovery) {
      const discoveryData = report.report_data as {
        report?: {
          executive_summary?: unknown;
          discovery_brief?: unknown;
          what_industry_missed?: unknown;
          discovery_concepts?: unknown[];
          validation_roadmap?: unknown;
          why_this_matters?: unknown;
        };
      };
      const r = discoveryData?.report;
      if (r?.executive_summary)
        items.push({
          id: 'executive-summary',
          title: 'Executive Summary',
          level: 2,
        });
      if (r?.discovery_brief)
        items.push({
          id: 'discovery-brief',
          title: 'Discovery Brief',
          level: 2,
        });
      if (r?.what_industry_missed)
        items.push({
          id: 'what-industry-missed',
          title: 'What Industry Missed',
          level: 2,
        });
      if (r?.discovery_concepts && r.discovery_concepts.length > 0)
        items.push({
          id: 'discovery-concepts',
          title: 'Discovery Concepts',
          level: 2,
        });
      if (r?.validation_roadmap)
        items.push({
          id: 'validation-roadmap',
          title: 'Validation Roadmap',
          level: 2,
        });
      if (r?.why_this_matters)
        items.push({
          id: 'why-this-matters',
          title: 'Why This Matters',
          level: 2,
        });
      return items;
    }

    // For hybrid reports, generate TOC from decision architecture sections
    if (isHybrid) {
      const hybridData = report.report_data as {
        report?: {
          executive_summary?: unknown;
          problem_restatement?: unknown;
          decision_architecture?: unknown;
          key_insights?: unknown[];
          next_steps?: unknown[];
          other_concepts?: unknown[];
          self_critique?: unknown;
        };
      };
      const r = hybridData?.report;
      if (r?.executive_summary)
        items.push({
          id: 'executive-summary',
          title: 'Executive Summary',
          level: 2,
        });
      if (r?.problem_restatement)
        items.push({
          id: 'problem-restatement',
          title: 'Problem Restatement',
          level: 2,
        });
      if (r?.decision_architecture)
        items.push({
          id: 'decision-architecture',
          title: 'Decision Architecture',
          level: 2,
        });
      if (r?.key_insights && r.key_insights.length > 0)
        items.push({
          id: 'key-insights',
          title: 'Key Insights',
          level: 2,
        });
      if (r?.next_steps && r.next_steps.length > 0)
        items.push({
          id: 'next-steps',
          title: 'Next Steps',
          level: 2,
        });
      if (r?.other_concepts && r.other_concepts.length > 0)
        items.push({
          id: 'other-concepts',
          title: 'Other Concepts',
          level: 2,
        });
      if (r?.self_critique)
        items.push({
          id: 'self-critique',
          title: 'Self-Critique',
          level: 2,
        });
      return items;
    }

    // For structured reports, generate TOC from known sections
    if (structuredReport) {
      items.push({ id: 'brief', title: 'Brief', level: 2 });
      items.push({
        id: 'executive-summary',
        title: 'Executive Summary',
        level: 2,
      });
      if (structuredReport.constraints)
        items.push({ id: 'constraints', title: 'Constraints', level: 2 });
      if (structuredReport.problem_analysis)
        items.push({
          id: 'problem-analysis',
          title: 'Problem Analysis',
          level: 2,
        });
      if (structuredReport.key_patterns)
        items.push({ id: 'key-patterns', title: 'Key Patterns', level: 2 });
      if (structuredReport.solution_concepts)
        items.push({
          id: 'solution-concepts',
          title: 'Solution Concepts',
          level: 2,
        });
      if (structuredReport.validation_summary)
        items.push({
          id: 'validation-summary',
          title: 'Validation Summary',
          level: 2,
        });
      if (structuredReport.challenge_the_frame)
        items.push({
          id: 'challenge-frame',
          title: 'Challenge the Frame',
          level: 2,
        });
      if (structuredReport.risks_and_watchouts)
        items.push({
          id: 'risks-watchouts',
          title: 'Risks & Watchouts',
          level: 2,
        });
      if (structuredReport.next_steps)
        items.push({ id: 'next-steps', title: 'Next Steps', level: 2 });
      return items;
    }

    // For markdown fallback, parse headers
    const headerRegex = /^(#{2,3})\s+(.+)$/gm;
    let match;
    while ((match = headerRegex.exec(reportMarkdown)) !== null) {
      const level = match[1]?.length ?? 2;
      const title = match[2]?.replace(/\*\*/g, '') ?? '';
      const id = generateSectionId(title);
      items.push({ id, title, level });
    }
    return items;
  }, [
    reportMarkdown,
    isDiscovery,
    isHybrid,
    structuredReport,
    report.report_data,
  ]);

  // Smart scroll: only auto-scroll if user is near bottom
  useEffect(() => {
    if (!isUserScrolledUpRef.current && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Track user scroll position in chat
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Consider "near bottom" if within 100px of the bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      isUserScrolledUpRef.current = !isNearBottom;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Track active section on scroll (throttled with rAF)
  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
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
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [tocItems]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsChatOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        // If streaming, stop the stream first
        if (isChatLoading) {
          cancelStream();
        } else if (isChatOpen) {
          // Otherwise close the chat
          setIsChatOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen, isChatLoading, cancelStream]);

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

      const savedInput = chatInput.trim();
      setChatMessages((prev) => [...prev, userMessage]);
      setChatInput('');
      setIsChatLoading(true);

      const assistantId = (Date.now() + 1).toString();
      setChatMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', isStreaming: true },
      ]);

      // Create AbortController for this request
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch('/api/sparlo/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId: report.id,
            message: savedInput,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          // Handle rate limit with specific message
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter
              ? `Please wait ${Math.ceil(parseInt(retryAfter) / 60)} minutes.`
              : 'Please wait a few minutes.';
            throw new Error(`Rate limit exceeded. ${waitTime}`);
          }
          throw new Error(
            errorData.error || `Failed to get response (${response.status})`,
          );
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';

        if (!reader) {
          throw new Error('No response body');
        }

        let streamDone = false;
        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              try {
                const parsed = JSON.parse(data);

                // Handle text chunks
                if (parsed.text) {
                  assistantContent += parsed.text;
                  setChatMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, content: assistantContent }
                        : msg,
                    ),
                  );
                }

                // Handle completion signal with save status
                if (parsed.done) {
                  streamDone = true;
                  if (parsed.saved === false) {
                    toast.warning('Message may not be saved', {
                      description:
                        'Your conversation might not persist. Please copy important responses.',
                      duration: 8000,
                    });
                  }
                }

                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (parseError) {
                // Skip invalid JSON lines (may be partial chunks)
                if (
                  parseError instanceof Error &&
                  parseError.message !== 'AI service error'
                ) {
                  continue;
                }
                throw parseError;
              }
            }
          }
        }

        // Mark streaming as complete
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, isStreaming: false } : msg,
          ),
        );
      } catch (error) {
        // Handle abort separately - don't show error for user-initiated cancellation
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        console.error('Chat error:', error);
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content:
                    msg.content ||
                    (error instanceof Error
                      ? error.message
                      : 'Sorry, I encountered an error. Please try again.'),
                  isStreaming: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : 'An error occurred',
                }
              : msg,
          ),
        );
      } finally {
        abortControllerRef.current = null;
        setIsChatLoading(false);
      }
    },
    [chatInput, isChatLoading, report.id],
  );

  // Show processing screen if still in progress
  if (isProcessing && progress) {
    return <ProcessingScreen progress={progress} onComplete={handleComplete} />;
  }

  // Check if we have valid report content
  // For discovery/hybrid reports, data is in report.report_data.report
  // For regular reports, data is in report.report_data.markdown
  const hasDiscoveryContent =
    isDiscovery &&
    report.report_data &&
    (report.report_data as { report?: unknown }).report;
  const hasHybridContent =
    isHybrid &&
    report.report_data &&
    (report.report_data as { report?: unknown }).report;
  const hasMarkdownContent = !!reportMarkdown;

  // Debug logging
  console.log('[ReportDisplay] Debug:', {
    isDiscovery,
    isHybrid,
    hasDiscoveryContent: !!hasDiscoveryContent,
    hasHybridContent: !!hasHybridContent,
    hasMarkdownContent,
    reportDataKeys: report.report_data ? Object.keys(report.report_data) : [],
    reportStatus: report.status,
  });

  // No report content yet
  if (!hasDiscoveryContent && !hasHybridContent && !hasMarkdownContent) {
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
    <div className="report-page relative min-h-screen">
      <div className="report-content">
        {/* Two-column layout */}
        <div className="flex">
          {/* Sticky TOC Sidebar - uses transform for GPU-accelerated animation */}
          <AnimatePresence>
            {showToc && (
              <motion.aside
                className="hidden w-64 flex-shrink-0 lg:block"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="sticky top-20 h-[calc(100vh-80px)] overflow-y-auto border-r border-[--border-subtle] bg-[--void-elevated]">
                  <div className="p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="text-label">Contents</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-[--text-muted] hover:text-[--text-primary]"
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
                            'group flex w-full items-center gap-2.5 rounded-[--radius-sm] px-2.5 py-2 text-left text-[13px] transition-all',
                            item.level === 3 && 'pl-6',
                            activeSection === item.id
                              ? 'bg-[--accent-muted] font-medium text-[--violet-400]'
                              : 'text-[--text-muted] hover:bg-[--void-surface] hover:text-[--text-primary]',
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
              className="btn fixed top-24 left-4 z-40 hidden lg:flex"
              onClick={() => setShowToc(true)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <List className="btn-icon" />
              <span className="text-xs">Contents</span>
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
                className="mb-6 inline-flex items-center gap-2 text-sm text-[--text-muted] transition-colors hover:text-[--text-primary]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>

              {/* Report Header */}
              <header className="mb-10">
                <div className="mb-6 flex items-start justify-between gap-6">
                  <div className="space-y-3">
                    <div className="text-label flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5" />
                      Sparlo Intelligence Briefing
                    </div>
                    <h1 className="heading-display heading-display--lg">
                      {report.title}
                    </h1>
                  </div>
                  <div className="status status--high">
                    <span className="status-dot" />
                    Complete
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-[--text-muted]">
                    Generated {new Date(report.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <button className="btn">
                      <Download className="btn-icon" />
                      Export
                    </button>
                    <button className="btn">
                      <Share2 className="btn-icon" />
                      Share
                    </button>
                  </div>
                </div>
              </header>

              {/* Core Insight Card */}
              {report.report_data?.recommendedConcept && (
                <motion.section
                  className="callout callout--insight mb-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[--radius-sm] bg-[--accent-muted]">
                      <Lightbulb className="h-5 w-5 text-[--violet-400]" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-[--text-primary]">
                          Lead Recommendation
                        </h2>
                        <span className="confidence-badge confidence-badge--high">
                          Key Finding
                        </span>
                      </div>
                      <div className="border-t border-[--border-subtle] pt-3">
                        <div className="flex items-start gap-2">
                          <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[--violet-400]" />
                          <p className="text-sm font-medium text-[--text-primary]">
                            {report.report_data.recommendedConcept}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Full Report - Discovery, Hybrid, Structured, or Markdown fallback */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {isDiscovery ? (
                  <DiscoveryReportDisplay
                    reportData={
                      report.report_data as Parameters<
                        typeof DiscoveryReportDisplay
                      >[0]['reportData']
                    }
                  />
                ) : isHybrid ? (
                  <HybridReportDisplay
                    reportData={
                      report.report_data as Parameters<
                        typeof HybridReportDisplay
                      >[0]['reportData']
                    }
                  />
                ) : structuredReport ? (
                  <ReportRenderer report={structuredReport} />
                ) : (
                  <ReactMarkdown components={markdownComponents}>
                    {reportMarkdown}
                  </ReactMarkdown>
                )}
              </motion.div>

              <div className="h-32" />
            </div>
          </div>
        </div>

        {/* Chat Toggle Button */}
        {!isChatOpen && (
          <motion.button
            className="btn btn--primary fixed right-6 bottom-6 z-50 rounded-full shadow-lg"
            style={{ boxShadow: 'var(--glow-violet)' }}
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
            <motion.aside
              role="complementary"
              aria-label="Chat with report"
              className="fixed top-16 right-0 z-50 flex h-[calc(100%-4rem)] w-[420px] flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Chat with Report
                    </span>
                    <p className="text-[10px] text-gray-500 dark:text-neutral-400">
                      Ask follow-up questions
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white"
                  onClick={() => setIsChatOpen(false)}
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 space-y-4 overflow-y-auto p-5"
                role="log"
                aria-live="polite"
                aria-label="Chat messages"
              >
                {chatMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800">
                      <MessageSquare className="h-7 w-7 text-gray-400 dark:text-neutral-500" />
                    </div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      Ask anything about this report
                    </p>
                    <p className="mt-2 max-w-[280px] text-sm text-gray-500 dark:text-neutral-400">
                      Get clarification, explore alternatives, or dive deeper
                      into specific concepts.
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
                            ? 'rounded-tr-sm bg-purple-600 text-white'
                            : 'rounded-tl-sm bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-neutral-100',
                          msg.cancelled && 'opacity-60',
                          msg.error && 'border border-red-500/30',
                        )}
                      >
                        {msg.role === 'user' ? (
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        ) : (
                          <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
                            <ReactMarkdown components={chatMarkdownComponents}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        {msg.isStreaming && (
                          <span className="inline-block animate-pulse text-purple-500">
                            ▋
                          </span>
                        )}
                        {msg.cancelled && (
                          <span className="mt-1 block text-xs text-gray-500 italic dark:text-neutral-400">
                            Generation stopped
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
                className="border-t border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50"
              >
                <div className="flex gap-2">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="max-h-[100px] min-h-[44px] resize-none rounded-lg border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                    disabled={isChatLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSubmit(e);
                      }
                    }}
                  />
                  {isChatLoading ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-[44px] w-[44px] flex-shrink-0 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      onClick={cancelStream}
                      aria-label="Stop generating"
                    >
                      <Square className="h-4 w-4 fill-current" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      size="icon"
                      className="h-[44px] w-[44px] flex-shrink-0 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 dark:bg-purple-600 dark:hover:bg-purple-700 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500"
                      disabled={!chatInput.trim()}
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
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

// Chat-specific markdown components (compact styling for sidebar)
const chatMarkdownComponents = {
  p: ({ children }: React.HTMLProps<HTMLParagraphElement>) => (
    <p className="mb-2 text-sm leading-relaxed last:mb-0">{children}</p>
  ),
  ul: ({ children }: React.HTMLProps<HTMLUListElement>) => (
    <ul className="mb-2 ml-4 list-disc space-y-1 text-sm">{children}</ul>
  ),
  ol: ({ children }: React.HTMLProps<HTMLOListElement>) => (
    <ol className="mb-2 ml-4 list-decimal space-y-1 text-sm">{children}</ol>
  ),
  li: ({ children }: React.HTMLProps<HTMLLIElement>) => (
    <li className="text-sm">{children}</li>
  ),
  strong: ({ children }: React.HTMLProps<HTMLElement>) => (
    <strong className="font-semibold">{children}</strong>
  ),
  code: ({
    children,
    className,
  }: React.HTMLProps<HTMLElement> & { inline?: boolean }) => {
    const match = /language-(\w+)/.exec(className ?? '');
    const language = match ? match[1] : undefined;

    if (language) {
      return (
        <div className="my-2 overflow-hidden rounded-md">
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: '0.75rem',
              fontSize: '0.75rem',
              borderRadius: '0.375rem',
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    }

    return (
      <code className="rounded bg-[--void-deep] px-1 py-0.5 font-mono text-xs text-[--violet-400]">
        {children}
      </code>
    );
  },
  pre: ({ children }: React.HTMLProps<HTMLPreElement>) => <>{children}</>,
  blockquote: ({ children }: React.HTMLProps<HTMLQuoteElement>) => (
    <blockquote className="my-2 border-l-2 border-[--violet-400] pl-3 text-sm italic opacity-80">
      {children}
    </blockquote>
  ),
  h1: ({ children }: React.HTMLProps<HTMLHeadingElement>) => (
    <h1 className="mb-2 text-base font-semibold">{children}</h1>
  ),
  h2: ({ children }: React.HTMLProps<HTMLHeadingElement>) => (
    <h2 className="mb-2 text-sm font-semibold">{children}</h2>
  ),
  h3: ({ children }: React.HTMLProps<HTMLHeadingElement>) => (
    <h3 className="mb-1 text-sm font-medium">{children}</h3>
  ),
};
