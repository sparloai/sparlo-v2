'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { motion } from 'framer-motion';
import { Loader2, MessageSquare } from 'lucide-react';

import type { HybridReportData } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

import { ProcessingScreen } from '../../../_components/processing-screen';
import { useReportProgress } from '../../../_lib/use-report-progress';
import { extractUserInput } from '../_lib/extract-report';
import { useChat } from '../_lib/hooks/use-chat';
import { useReportActions } from '../_lib/hooks/use-report-actions';
import type { ChatMessage } from '../_lib/schemas/chat.schema';
import { BrandSystemReport } from './brand-system';
import { ChatDrawer, ChatHeader, ChatInput, ChatMessages } from './chat';
import { ShareModal } from './share-modal';

interface Report {
  id: string;
  title: string;
  status: string;
  current_step: string | null;
  phase_progress: number | null;
  report_data: {
    report?: HybridReportData;
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
  const reportData = report.report_data?.report;

  if (!reportData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#7C3AED]" />
          <p className="mt-4 text-[#6A6A6A]">Loading report...</p>
        </div>
      </div>
    );
  }

  // Extract user's original input for the Brief section
  const userBrief = extractUserInput(report.report_data, report.title);

  return (
    <div className="report-page relative min-h-screen">
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
        <motion.button
          className="fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-2xl bg-zinc-900 px-6 py-4 text-white shadow-[0_8px_30px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.08)] transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] dark:hover:bg-zinc-100"
          onClick={() => setIsChatOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-[15px] font-medium">Go Deeper</span>
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
