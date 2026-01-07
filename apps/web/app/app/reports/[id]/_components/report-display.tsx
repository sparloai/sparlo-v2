'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Loader2, MessageSquare } from 'lucide-react';

import type { HybridReportData } from '~/app/app/reports/_lib/types/hybrid-report-display.types';
import { TrackReportViewed } from '~/components/analytics-events';

import { ProcessingScreen } from '../../../_components/processing-screen';
import { useReportProgress } from '../../../_lib/use-report-progress';
import { extractUserInput } from '../_lib/extract-report';
import { useChat } from '../_lib/hooks/use-chat';
import { useReportActions } from '../_lib/hooks/use-report-actions';
import type { ChatMessage } from '../_lib/schemas/chat.schema';
import { BrandSystemReport, DDReportDisplay } from './brand-system';
import {
  ChatDrawer,
  ChatHeader,
  ChatInput,
  ChatMessages,
  ChatSuggestions,
} from './chat';
import { ShareModal } from './share-modal';

// Type for DD mode report data
interface DDReportData {
  mode: 'dd';
  report: unknown;
  claim_extraction?: unknown;
  problem_framing?: unknown;
  solution_space?: unknown;
  claim_validation?: unknown;
  solution_mapping?: unknown;
}

interface Report {
  id: string;
  title: string;
  status: string;
  current_step: string | null;
  phase_progress: number | null;
  report_data: {
    mode?: string;
    report?: HybridReportData | unknown;
  } | null;
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
}

export function ReportDisplay({
  report,
  isProcessing,
  initialChatHistory = [],
}: ReportDisplayProps) {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Chat functionality via custom hook
  const {
    messages: chatMessages,
    input: chatInput,
    setInput: setChatInput,
    isLoading: isChatLoading,
    submitMessage: submitChatMessage,
    cancelStream,
  } = useChat({
    reportId: report.id,
    initialMessages: initialChatHistory,
  });

  // Track progress for processing reports
  const { progress } = useReportProgress(isProcessing ? report.id : null);

  // Share and export functionality via shared hook
  useReportActions({
    reportId: report.id,
    reportTitle: report.title,
    onShareFallback: () => setIsShareModalOpen(true),
  });

  // Handle completion - refresh to get updated server data
  const handleComplete = useCallback(() => {
    router.refresh();
  }, [router]);

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

  // Show processing screen if still in progress
  if (isProcessing && progress) {
    return <ProcessingScreen progress={progress} onComplete={handleComplete} />;
  }

  // Check if we have valid report content
  // Try both nested (.report) and direct storage patterns
  const rawReportData = report.report_data;

  // Detect DD mode
  const isDDMode = rawReportData?.mode === 'dd';

  // For DD mode, use the DD report data structure
  // For other modes, extract HybridReportData
  const reportData = isDDMode
    ? null
    : ((rawReportData?.report as HybridReportData | undefined) ??
      (rawReportData as HybridReportData | null));

  // Debug logging for production issues
  if (process.env.NODE_ENV !== 'production') {
    console.log('[ReportDisplay] report_data:', rawReportData);
    console.log('[ReportDisplay] isDDMode:', isDDMode);
    console.log('[ReportDisplay] extracted reportData:', reportData);
  }

  // For DD mode, render DD report display
  if (isDDMode && rawReportData) {
    return (
      <>
        <TrackReportViewed reportId={report.id} reportType="dd" />
        <DDReportDisplay
          reportData={rawReportData as DDReportData}
          title={report.title}
          createdAt={report.created_at}
          showActions={true}
          reportId={report.id}
        />
      </>
    );
  }

  if (!reportData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#7C3AED]" />
          <p className="mt-4 text-[#6A6A6A]">Loading report...</p>
          {process.env.NODE_ENV !== 'production' && (
            <p className="mt-2 text-xs text-red-500">
              Debug: report_data is {JSON.stringify(rawReportData, null, 2)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Extract user's original input for the Brief section
  const userBrief = extractUserInput(report.report_data, report.title);

  // Determine report type for analytics
  const reportType =
    rawReportData?.mode === 'discovery' ? 'discovery' : 'hybrid';

  return (
    <div className="report-page relative min-h-screen">
      {/* Analytics tracking */}
      <TrackReportViewed reportId={report.id} reportType={reportType} />

      {/* Full-width report with brand system */}
      <BrandSystemReport
        reportData={reportData}
        title={report.title}
        brief={userBrief}
        createdAt={report.created_at}
        isChatOpen={isChatOpen}
        reportId={report.id}
      />

      {/* Chat Toggle Button */}
      {!isChatOpen && (
        <button
          className="fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-2xl bg-zinc-900 px-6 py-4 text-white shadow-[0_8px_30px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] dark:hover:bg-zinc-100"
          onClick={() => setIsChatOpen(true)}
        >
          <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-[15px] font-medium">Go Deeper</span>
          <span className="rounded-md bg-white/15 px-2 py-1 text-[11px] font-medium dark:bg-zinc-900/20">
            ⌘/
          </span>
        </button>
      )}

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        fullHeight
      >
        <ChatHeader onClose={() => setIsChatOpen(false)} />
        <ChatMessages messages={chatMessages} isStreaming={isChatLoading} />

        {/* Show conversation starters when no messages yet */}
        {chatMessages.length === 0 &&
          reportData.follow_up_prompts &&
          reportData.follow_up_prompts.length > 0 && (
            <ChatSuggestions
              suggestions={reportData.follow_up_prompts}
              onSelect={(suggestion) => {
                void submitChatMessage(suggestion);
              }}
              disabled={isChatLoading}
            />
          )}

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
