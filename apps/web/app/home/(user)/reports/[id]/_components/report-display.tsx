'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

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
  Share2,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { Button } from '@kit/ui/button';
import { toast } from '@kit/ui/sonner';
import { cn } from '@kit/ui/utils';

import { ProcessingScreen } from '../../../_components/processing-screen';
import { useReportProgress } from '../../../_lib/use-report-progress';
import { CHAT_DRAWER_WIDTH } from '../_lib/constants';
import {
  extractStructuredReport,
  extractUserInput,
} from '../_lib/extract-report';
import { useChat } from '../_lib/hooks/use-chat';
import { useReportActions } from '../_lib/hooks/use-report-actions';
import type { ChatMessage } from '../_lib/schemas/chat.schema';
import { ChatDrawer, ChatHeader, ChatInput, ChatMessages } from './chat';
import { DiscoveryReportDisplay } from './discovery-report-display';
import { HybridReportDisplay } from './hybrid-report-display';
import { ReportRenderer } from './report/report-renderer';
import { ShareModal } from './share-modal';

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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Chat functionality via custom hook
  const {
    messages: chatMessages,
    input: chatInput,
    setInput: setChatInput,
    isLoading: isChatLoading,
    submitMessage: submitChatMessage,
    handleSubmit: handleChatSubmit,
    cancelStream,
  } = useChat({
    reportId: report.id,
    initialMessages: initialChatHistory,
  });

  // Track progress for processing reports
  const { progress } = useReportProgress(isProcessing ? report.id : null);

  // Share and export functionality via shared hook
  const { handleShare, handleExport, isGeneratingShare, isExporting } =
    useReportActions({
      reportId: report.id,
      reportTitle: report.title,
      onShareFallback: () => setIsShareModalOpen(true),
    });

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

    // For hybrid reports, generate TOC from all available sections
    if (isHybrid) {
      const hybridData = report.report_data as {
        report?: {
          brief?: unknown;
          executive_summary?: unknown;
          honest_assessment?: unknown;
          problem_analysis?: unknown;
          constraints_and_metrics?: unknown;
          challenge_the_frame?: unknown[];
          innovation_analysis?: unknown;
          problem_restatement?: unknown;
          cross_domain_search?: unknown;
          execution_track?: unknown;
          innovation_portfolio?: unknown;
          solution_concepts?: unknown;
          innovation_concepts?: unknown;
          strategic_integration?: unknown;
          decision_architecture?: unknown;
          key_insights?: unknown[];
          next_steps?: unknown[];
          other_concepts?: unknown[];
          self_critique?: unknown;
          risks_and_watchouts?: unknown[];
          what_id_actually_do?: unknown;
        };
      };
      const r = hybridData?.report;

      // Order matches the actual render order in HybridReportDisplay
      if (r?.brief) items.push({ id: 'brief', title: 'The Brief', level: 2 });
      if (r?.executive_summary)
        items.push({
          id: 'executive-summary',
          title: 'Executive Summary',
          level: 2,
        });
      if (r?.honest_assessment)
        items.push({
          id: 'honest-assessment',
          title: 'Honest Assessment',
          level: 2,
        });
      if (r?.problem_analysis)
        items.push({
          id: 'problem-analysis',
          title: 'Problem Analysis',
          level: 2,
        });
      if (r?.constraints_and_metrics)
        items.push({ id: 'constraints', title: 'Constraints', level: 2 });
      if (
        r?.challenge_the_frame &&
        Array.isArray(r.challenge_the_frame) &&
        r.challenge_the_frame.length > 0
      )
        items.push({
          id: 'challenge-the-frame',
          title: 'Challenge the Frame',
          level: 2,
        });
      if (r?.innovation_analysis)
        items.push({
          id: 'innovation-analysis',
          title: 'Innovation Analysis',
          level: 2,
        });
      if (r?.problem_restatement)
        items.push({
          id: 'problem-restatement',
          title: 'Problem Restatement',
          level: 2,
        });
      if (r?.cross_domain_search)
        items.push({
          id: 'cross-domain-search',
          title: 'Cross-Domain Search',
          level: 2,
        });
      // Check for execution_track or solution_concepts (both map to same section)
      if (r?.execution_track || r?.solution_concepts)
        items.push({
          id: 'solution-concepts',
          title: 'Solution Concepts',
          level: 2,
        });
      // Check for innovation_portfolio or innovation_concepts (both map to same section)
      if (r?.innovation_portfolio || r?.innovation_concepts)
        items.push({
          id: 'innovation-concepts',
          title: 'Innovation Concepts',
          level: 2,
        });
      if (r?.strategic_integration)
        items.push({
          id: 'strategic-integration',
          title: 'Strategic Integration',
          level: 2,
        });
      if (r?.decision_architecture)
        items.push({
          id: 'decision-architecture',
          title: 'Decision Architecture',
          level: 2,
        });
      if (
        r?.key_insights &&
        Array.isArray(r.key_insights) &&
        r.key_insights.length > 0
      )
        items.push({
          id: 'key-insights',
          title: 'Key Insights',
          level: 2,
        });
      if (
        r?.next_steps &&
        Array.isArray(r.next_steps) &&
        r.next_steps.length > 0
      )
        items.push({
          id: 'next-steps',
          title: 'Next Steps',
          level: 2,
        });
      if (
        r?.other_concepts &&
        Array.isArray(r.other_concepts) &&
        r.other_concepts.length > 0
      )
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
      if (
        r?.risks_and_watchouts &&
        Array.isArray(r.risks_and_watchouts) &&
        r.risks_and_watchouts.length > 0
      )
        items.push({
          id: 'risks',
          title: 'Risks & Watchouts',
          level: 2,
        });
      if (r?.what_id_actually_do)
        items.push({
          id: 'recommendation',
          title: 'Recommendation',
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

  // Hybrid reports use brand system with full-page layout control
  // Render them separately to avoid layout conflicts
  if (isHybrid) {
    // Extract user's original input for the Brief section
    const userBrief = extractUserInput(report.report_data, report.title);

    return (
      <div className="report-page relative min-h-screen">
        {/* Full-width hybrid report with brand system */}
        <HybridReportDisplay
          reportData={
            report.report_data as Parameters<
              typeof HybridReportDisplay
            >[0]['reportData']
          }
          title={report.title}
          brief={userBrief}
          createdAt={report.created_at}
          isChatOpen={isChatOpen}
          reportId={report.id}
        />

        {/* Chat Toggle Button */}
        {!isChatOpen && (
          <motion.button
            className="fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-2xl bg-zinc-900 px-6 py-4 text-white shadow-[0_8px_30px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.08)] transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] dark:hover:bg-zinc-100"
            onClick={() => setIsChatOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[15px] font-medium">
              Ask about this report
            </span>
            <span className="rounded-md bg-white/15 px-2 py-1 text-[11px] font-medium dark:bg-zinc-900/20">
              ⌘/
            </span>
          </motion.button>
        )}

        {/* Chat Drawer */}
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          fullHeight
        >
          <ChatHeader onClose={() => setIsChatOpen(false)} />
          <ChatMessages messages={chatMessages} isStreaming={isChatLoading} />
          <ChatInput
            value={chatInput}
            onChange={setChatInput}
            onSubmit={() => void submitChatMessage()}
            onCancel={cancelStream}
            isStreaming={isChatLoading}
          />
        </ChatDrawer>

        {/* Share Modal */}
        <ShareModal
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          reportId={report.id}
        />
      </div>
    );
  }

  return (
    <div className="report-page relative min-h-screen">
      <div className="report-content">
        {/* Two-column layout */}
        <div className="flex">
          {/* Sticky TOC Sidebar - hidden when chat is open */}
          <AnimatePresence>
            {showToc && !isChatOpen && (
              <motion.aside
                className="hidden w-64 flex-shrink-0 lg:block"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="sticky top-20 h-[calc(100vh-80px)] overflow-y-auto border-r border-[--border-subtle] bg-[--void-elevated]">
                  <div className="p-6">
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

          {/* TOC Toggle - hidden when chat is open */}
          {!showToc && !isChatOpen && (
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
            className="min-w-0 flex-1 px-6 py-10 transition-transform duration-300 ease-out md:px-8 lg:px-10"
            style={{
              transform: isChatOpen
                ? `translateX(-${CHAT_DRAWER_WIDTH / 2}px)`
                : undefined,
            }}
          >
            <div className="mx-auto max-w-[680px]">
              {/* Back link */}
              <Link
                href="/home"
                className="mb-6 inline-flex items-center gap-2 text-sm text-[--text-muted] transition-colors hover:text-[--text-primary]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>

              {/* Report Header */}
              <header className="mb-12">
                <div className="mb-6 flex items-start justify-between gap-6">
                  <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight text-zinc-900 lg:text-5xl">
                      {report.title}
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-zinc-500">
                      <span>
                        {new Date(report.created_at).toLocaleDateString(
                          'en-US',
                          {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                          },
                        )}
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span>
                        {new Date(report.created_at).toLocaleTimeString(
                          'en-US',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          },
                        )}
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span>8 min read</span>
                    </div>
                  </div>
                  <div className="status status--high">
                    <span className="status-dot" />
                    Complete
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      className="btn w-full sm:w-auto"
                      onClick={handleExport}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 className="btn-icon animate-spin" />
                      ) : (
                        <Download className="btn-icon" />
                      )}
                      {isExporting ? 'Exporting...' : 'Export PDF'}
                    </button>
                    <button
                      className="btn w-full sm:w-auto"
                      onClick={handleShare}
                      disabled={isGeneratingShare}
                    >
                      {isGeneratingShare ? (
                        <Loader2 className="btn-icon animate-spin" />
                      ) : (
                        <Share2 className="btn-icon" />
                      )}
                      {isGeneratingShare ? 'Sharing...' : 'Share'}
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

              {/* Full Report - Discovery, Structured, or Markdown fallback */}
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

        {/* Chat Toggle Button - Per Jobs Standard: prominent CTA */}
        {!isChatOpen && (
          <motion.button
            className="fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-2xl bg-zinc-900 px-6 py-4 text-white shadow-[0_8px_30px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.08)] transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] dark:hover:bg-zinc-100"
            onClick={() => setIsChatOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[15px] font-medium">
              Ask about this report
            </span>
            <span className="rounded-md bg-white/15 px-2 py-1 text-[11px] font-medium dark:bg-zinc-900/20">
              ⌘/
            </span>
          </motion.button>
        )}

        {/* Chat Drawer */}
        <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)}>
          <ChatHeader onClose={() => setIsChatOpen(false)} />
          <ChatMessages messages={chatMessages} isStreaming={isChatLoading} />
          <ChatInput
            value={chatInput}
            onChange={setChatInput}
            onSubmit={() => void submitChatMessage()}
            onCancel={cancelStream}
            isStreaming={isChatLoading}
          />
        </ChatDrawer>

        {/* Share Modal */}
        <ShareModal
          reportId={report.id}
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
        />
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
    <ul className="mb-5 space-y-2.5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children }: React.HTMLProps<HTMLOListElement>) => (
    <ol className="mb-5 list-inside list-decimal space-y-2.5">{children}</ol>
  ),
  li: ({ children, ...props }: React.HTMLProps<HTMLLIElement>) => (
    <li
      className="relative flex items-start gap-3 leading-[1.7] text-[#4A4A4A] dark:text-neutral-300"
      {...props}
    >
      <span className="mt-2.5 h-px w-3 shrink-0 bg-zinc-400 dark:bg-zinc-500" />
      <span>{children}</span>
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
      className="border-b border-[#E5E5E5] px-4 py-3 text-left text-xs font-semibold text-[#1A1A1A] dark:border-neutral-800 dark:text-white"
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
